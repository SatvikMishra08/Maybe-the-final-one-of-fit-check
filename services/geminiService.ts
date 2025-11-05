/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { WardrobeItem, ModelInfo, ShootTemplate, SizeMeasurement, RenderStyle, GarmentView, CampaignBrief, CampaignModel, SavedModel, IdentifiedItem, ProductGarment, GarmentVariant, Variation } from "../types";
import { generateSimulationDirective } from "../lib/realismEngine";
import { formatDirectiveForPrompt } from "../lib/promptFormatter";

const API_TIMEOUT = 60000; // 60 seconds

const BASELINE_CONSTRAINTS = `
CRITICAL ANATOMICAL & QUALITY REQUIREMENTS:
- The entire pose must be physically possible for a human body.
- All joints (shoulders, elbows, hips, knees, ankles) must bend naturally in anatomically correct directions. Do not create broken or backward-bending limbs.
- All limbs must be properly proportioned and visibly connected to the torso at their respective joints. Do not create floating or disconnected body parts.
- The head must sit naturally on the neck and be properly connected to the shoulders.
- The spine must maintain a natural alignment and not be impossibly twisted.
- Weight distribution must appear physically stable and realistic for the pose. Feet should be firmly on the ground unless the pose involves jumping or lifting a leg.
- All hands and feet must be fully visible and anatomically correct (e.g., 5 fingers per hand).
- Clothing and hair must hang and drape naturally according to gravity.
`;

const callGeminiWithTimeout = async <T>(
    geminiCall: Promise<T>,
    signal?: AbortSignal
): Promise<T> => {
    return new Promise(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new DOMException('The request timed out after 60 seconds.', 'TimeoutError'));
        }, API_TIMEOUT);

        const handleAbort = () => {
            clearTimeout(timeoutId);
            reject(new DOMException('Operation cancelled by user.', 'AbortError'));
        };

        signal?.addEventListener('abort', handleAbort);

        try {
            const result = await geminiCall;
            clearTimeout(timeoutId);
            resolve(result);
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        } finally {
            signal?.removeEventListener('abort', handleAbort);
        }
    });
};

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or if the request is too complex. Please try a different image.");
    throw new Error(errorMessage);
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const imageModel = 'gemini-2.5-flash-image';
const textModel = 'gemini-2.5-flash';

export const isPersonInImage = async (image: File, signal?: AbortSignal): Promise<boolean> => {
    const imagePart = await fileToPart(image);
    const prompt = "Does this image contain a person, a mannequin, or parts of a human body? Respond with only 'YES' or 'NO'.";
    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: textModel,
        contents: { parts: [imagePart, { text: prompt }] },
    }), signal);
    return response.text.trim().toUpperCase() === 'YES';
};

export const identifyGarmentsInImage = async (image: File, signal?: AbortSignal): Promise<IdentifiedItem[]> => {
    const imagePart = await fileToPart(image);
    const prompt = `You are an expert fashion AI assistant. Your task is to analyze an image of a person and identify all the distinct articles of clothing they are wearing.

**Chain of Thought:**
1.  **Scan the Image:** Look for the person in the image.
2.  **Identify Clothing Items:** Systematically identify each separate piece of clothing. Start from the top (e.g., headwear) and move down to the bottom (e.g., footwear). Examples include hats, glasses, t-shirts, jackets, pants, skirts, shoes, etc.
3.  **Describe and Locate:** For each item you find, create a concise, descriptive label (e.g., "white short-sleeve t-shirt", "light-wash blue jeans"). Then, determine the precise bounding box that tightly encloses only that item. The box coordinates must be normalized from 0.0 to 1.0 in the format [y_min, x_min, y_max, x_max].
4.  **Format Output:** Compile all identified items into a JSON object that strictly adheres to the provided schema.

**CRITICAL RULES:**
-   If no clothing items can be clearly identified, return an empty array for the 'items' property.
-   Do not include accessories like watches or jewelry unless they are very prominent. Focus on main clothing articles.
-   Ensure bounding boxes are as tight as possible around each item.
-   Respond ONLY with the valid JSON object.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        label: { type: Type.STRING },
                        box: {
                            type: Type.ARRAY,
                            items: { type: Type.NUMBER }
                        }
                    },
                    required: ['label', 'box']
                }
            }
        },
        required: ['items']
    };

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: textModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    }), signal);

    try {
        const parsed = JSON.parse(response.text);
        if (parsed && Array.isArray(parsed.items)) {
            return parsed.items.filter((item: any) => Array.isArray(item.box) && item.box.length === 4);
        }
        return [];
    } catch (e) {
        console.error("Failed to parse JSON from identifyGarmentsInImage:", response.text, e);
        return []; // Return empty array on parse failure
    }
};

export const extractGarmentFromSelection = async (imageFile: File, box: number[], signal?: AbortSignal): Promise<string> => {
    const imageUrl = URL.createObjectURL(imageFile);
    const image = new Image();
    image.src = imageUrl;
    await new Promise(resolve => image.onload = resolve);
    URL.revokeObjectURL(imageUrl);

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    ctx.drawImage(image, 0, 0);
    
    const [yMin, xMin, yMax, xMax] = box;
    ctx.strokeStyle = '#00FF00'; // Bright green
    ctx.lineWidth = Math.max(8, image.naturalWidth * 0.01); // Make line width responsive
    ctx.strokeRect(
        xMin * canvas.width,
        yMin * canvas.height,
        (xMax - xMin) * canvas.width,
        (yMax - yMin) * canvas.height
    );

    const boxedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const imagePart = dataUrlToPart(boxedImageDataUrl);

    const prompt = `You are an expert digital tailor and photo retoucher. Your task is to extract the clothing item located inside the bright green bounding box.
    1.  **Isolate:** Meticulously isolate the garment inside the box.
    2.  **Reconstruct:** Intelligently fill in any parts of the garment that are occluded by arms, hair, or other objects, using the visible context of the person's pose.
    3.  **Neutralize Lighting:** Remove all shadows and highlights cast *onto* the garment to create a flat, evenly-lit product image.
    4.  **Output:** Return ONLY a PNG of the clean, reconstructed garment on a perfectly transparent background.`;

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);

    return handleApiResponse(response);
};


export const segmentGarment = async (garmentImage: File, signal?: AbortSignal): Promise<string> => {
    const garmentImagePart = await fileToPart(garmentImage);
    const prompt = "Isolate the primary clothing item in this image and make the background transparent. Return only the PNG of the cutout garment.";

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [garmentImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const generateGarmentImageFromPrompt = async (description: string, signal?: AbortSignal): Promise<string> => {
    const prompt = `Create a photorealistic, studio-quality image of the following clothing item on a perfectly transparent background: "${description}". The item should be facing forward, laid flat, and mostly wrinkle-free, like a product photo for an e-commerce website. Return ONLY the PNG image with a transparent background.`;

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};


export const analyzeSizeChartImage = async (chartImage: File, signal?: AbortSignal): Promise<Omit<SizeMeasurement, 'id'>[]> => {
    const chartImagePart = await fileToPart(chartImage);
    const prompt = `You are an expert data extraction AI. Analyze the provided image of a garment size chart and convert it into a structured JSON array.

**Your Chain of Thought:**
1.  **Identify Columns:** First, scan the table headers to identify all available measurement dimensions. These could be 'Chest', 'Length', 'Sleeve', 'Waist', 'Inseam', 'Shoulder Width', etc. Also, identify the column for size labels (e.g., S, M, L, XL).
2.  **Determine Units:** Look for the unit of measurement used in the chart (e.g., 'in', 'cm', inches, centimeters). If not explicitly stated, infer it from the values and default to 'in' if ambiguous.
3.  **Process Rows:** For each row (each size), extract the size label and the numeric value for each measurement dimension you identified.
4.  **Handle Complex Values:** If a value is a range (e.g., "30-32"), calculate the average (31). If it's a fraction (e.g., "28 1/2"), convert it to a decimal (28.5). If a cell is empty or has a non-numeric value like '-', skip that measurement for that size.
5.  **Standardize Keys:** Convert all identified measurement dimension names to a standardized 'snake_case' format (e.g., "Shoulder Width" becomes "shoulder_width").
6.  **Format Output:** Construct a JSON array where each object represents a size and contains the 'sizeLabel', 'unit', and a nested 'measurements' array of dimension/value pairs.

**CRITICAL RULES:**
- Return ONLY the final, clean JSON array. Do not include any other text, explanations, or markdown formatting.
- The output MUST conform to the provided JSON schema.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                sizeLabel: { type: Type.STRING },
                unit: { type: Type.STRING, enum: ['in', 'cm'] },
                measurements: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            dimension: { type: Type.STRING, description: 'The standardized name of the measurement dimension (e.g., "chest", "length", "waist").' },
                            value: { type: Type.NUMBER, description: 'The numeric value of the measurement.' }
                        },
                        required: ['dimension', 'value']
                    }
                }
            },
            required: ['sizeLabel', 'unit', 'measurements']
        }
    };
    
    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: textModel,
        contents: { parts: [chartImagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        },
    }), signal);
    
    try {
        const parsedJson = JSON.parse(response.text);
        if (Array.isArray(parsedJson)) {
            return parsedJson as Omit<SizeMeasurement, 'id'>[];
        }
        throw new Error("AI returned data in an unexpected format.");
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", response.text);
        throw new Error("The AI failed to analyze the size chart. Please ensure the image is clear and try again.");
    }
};


export const analyzePose = async (modelImageUrl: string, signal?: AbortSignal): Promise<{ sides: string[]; confidence: number; }> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const prompt = "Analyze the person in this image. Determine which sides of their body are primarily visible from the options: 'front', 'back', 'left', 'right'. Also provide a confidence score (0.0 to 1.0) for your analysis. For example, for a three-quarters turn, the answer would include 'front' and 'right'. Respond ONLY with a valid JSON object matching the provided schema.";

    const schema = {
        type: Type.OBJECT,
        properties: {
            visible_sides: {
                type: Type.ARRAY,
                items: { type: Type.STRING, enum: ['front', 'back', 'left', 'right'] }
            },
            confidence: {
                type: Type.NUMBER,
                description: 'A value from 0.0 to 1.0 representing the confidence in the pose analysis.'
            }
        },
        required: ['visible_sides', 'confidence']
    };

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: textModel,
        contents: { parts: [modelImagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    }), signal);

    try {
        const parsed = JSON.parse(response.text);
        if (parsed && Array.isArray(parsed.visible_sides) && typeof parsed.confidence === 'number') {
            return {
                sides: parsed.visible_sides.map((s: string) => s.toLowerCase().trim()).filter(Boolean),
                confidence: parsed.confidence,
            };
        }
        // Fallback if structure is wrong but parsable
        if (parsed && Array.isArray(parsed.visible_sides)) {
            return {
                sides: parsed.visible_sides.map((s: string) => s.toLowerCase().trim()).filter(Boolean),
                confidence: 0.9, // Default confidence
            }
        }
        throw new Error("AI returned a JSON object with an unexpected structure.");
    } catch (e) {
        console.error("Failed to parse or validate JSON from analyzePose:", response.text, e);
        throw new Error("The AI failed to analyze the pose correctly. The response was not in the expected format.");
    }
};

export const analyzePhysique = async (modelImageUrl: string, signal?: AbortSignal): Promise<'Slim/Slender' | 'Average/Regular' | 'Broad/Athletic'> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const prompt = "Analyze the model's physique. Is their build best described as 'Slim/Slender', 'Average/Regular', 'or 'Broad/Athletic'? Respond with only one of these options.";
    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: textModel,
        contents: { parts: [modelImagePart, { text: prompt }] },
    }), signal);
    const text = response.text.trim();
    if (['Slim/Slender', 'Average/Regular', 'Broad/Athletic'].includes(text)) {
        return text as 'Slim/Slender' | 'Average/Regular' | 'Broad/Athletic';
    }
    return 'Average/Regular'; // Default fallback
};


export const generateModelImage = async (userImage: File, signal?: AbortSignal): Promise<string> => {
    const userImagePart = await fileToPart(userImage);
    const prompt = `You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic.
    
    ${BASELINE_CONSTRAINTS}
    
    Return ONLY the final image.`;
    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [userImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const refineModelRealism = async (modelImageUrl: string, signal?: AbortSignal): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const prompt = `You are a world-class digital portrait artist and retoucher. Your task is to enhance the realism of the provided generated model image to make it indistinguishable from a high-end photograph.

**CRITICAL RULE:** Do NOT change the person's identity, facial features, pose, clothing, or background. Your only task is to add high-fidelity, subtle details.

**Focus on these enhancements:**
1.  **Skin Texture:** Add natural-looking skin pores, subtle imperfections, and micro-textures. Eliminate any "airbrushed" or overly smooth appearance.
2.  **Eyes:** Ensure the eyes have a lifelike, complex "catchlight" (reflection), making them look vibrant and real.
3.  **Lighting & Shadows:** Refine the lighting to create soft, natural micro-shadows (e.g., under the chin, around the nose) that enhance the facial structure and add depth.

Return ONLY the refined, ultra-realistic image.`;
    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [modelImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
}

export const generateVirtualTryOnImage = async (
    modelInfo: ModelInfo, 
    garmentInfo: WardrobeItem,
    variantInfo: GarmentVariant,
    template: ShootTemplate,
    size: string | undefined,
    signal?: AbortSignal
): Promise<string> => {
    
    const { views: garmentViews } = variantInfo;
    
    const modelImagePart = dataUrlToPart(modelInfo.imageUrl);
    const parts: any[] = [modelImagePart];

    let prompt = `You are an expert virtual try-on AI with a deep understanding of fashion, materials, and photography. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment view' images, placed within a new scene.

**Crucial Rules:**
1.  **Pixel-Perfect Replication:** You MUST replicate the provided garment images with the highest possible fidelity, preserving all logos, patterns, textures, and design elements without any alteration or creative interpretation. The graphic or design must not be changed.
2.  **Complete Garment Replacement:** You MUST completely REMOVE and REPLACE the clothing item worn by the person in the 'model image' with the new garment. No part of the original clothing should be visible.
3.  **Preserve the Model:** The person's face, hair, body shape, and pose from the 'model image' MUST remain unchanged.
4.  **Create New Scene:** You MUST REPLACE the original background. Place the model in this new scene: **${template.backgroundStyle.description}**.
5.  **Lighting:** The lighting on the model and garment must match the new scene, with a **${template.lightingDirection}** lighting style.
6.  **Realism is Key:** The final image must be indistinguishable from a real photograph. Pay close attention to lighting, shadows, and how the fabric interacts with the body.
7.  **Output:** Return ONLY the final, edited image. Do not include any text.
`;

    const simulationDirective = generateSimulationDirective(garmentInfo, modelInfo, size);
    prompt += formatDirectiveForPrompt(simulationDirective, garmentInfo.gsm);
    
    prompt += `- **Provided Garment Views:**\n`;
    parts.push(dataUrlToPart(garmentViews.front));
    prompt += `  - **Front View:** This is the primary image of the garment's front.\n`;

    if (garmentViews.back) {
        parts.push(dataUrlToPart(garmentViews.back));
        prompt += `  - **Back View:** This is the image of the garment's back.\n`;
    }
    if (garmentViews.left) {
        parts.push(dataUrlToPart(garmentViews.left));
        prompt += `  - **Left View:** This is the image of the garment's left side.\n`;
    }
    if (garmentViews.right) {
        parts.push(dataUrlToPart(garmentViews.right));
        prompt += `  - **Right View:** This is the image of the garment's right side.\n`;
    }

    const { sides: visibleSides } = await analyzePose(modelInfo.imageUrl, signal);
    prompt += `- **Pose Analysis:** The model's pose primarily shows their: **${visibleSides.join(', ')}**.\n`;
    prompt += `- **View Logic:** You have been provided with up to four orthographic views of the garment (front, back, left, right). You MUST synthesize information from **all provided views** to create a seamless, 3D-consistent understanding of the garment's design. When rendering a pose that shows a side or a three-quarters view, the design, patterns, and graphics must flow perfectly and continuously from one view to the next (e.g., from front to side) without any breaks, seams, or inconsistencies. Use the correct view for the most visible part of the model, and infer the transition between views based on all available images. **DO NOT simply copy the front design to the back if a back view is not provided; generate a plausible plain back.**\n`;
    
    prompt += `
---
**Final Quality Checks:**
- Ensure the model's final pose is physically possible and anatomically correct.
- All limbs must be properly connected and proportioned.
- The lighting on the garment must be consistent with the background and lighting style.
    `;
    
    parts.push({ text: prompt });

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const generateLayeredImage = async (
    modelInfo: ModelInfo,
    currentImageUrl: string,
    newGarment: WardrobeItem,
    newVariant: GarmentVariant,
    template: ShootTemplate,
    size: string | undefined,
    signal?: AbortSignal
): Promise<string> => {
    const { views: garmentViews } = newVariant;
    
    const currentImagePart = dataUrlToPart(currentImageUrl);
    const parts: any[] = [currentImagePart];

    let prompt = `You are an expert virtual try-on AI specializing in layering garments. Your task is to add a new piece of clothing ON TOP OF the person in the 'current outfit image'.

**Crucial Rules:**
1.  **Layer, Don't Replace:** You MUST add the new garment on top of the existing clothing. DO NOT remove or replace the clothes already being worn. The new garment should interact realistically with the layer underneath (e.g., a jacket causing wrinkles in a shirt).
2.  **Preserve Everything Else:** The person's identity, pose, background, and lighting from the 'current outfit image' MUST be perfectly preserved.
3.  **Pixel-Perfect Replication:** You MUST replicate the new garment from the provided views with the highest possible fidelity, preserving all logos, patterns, and textures.
4.  **Realism is Key:** The final image must be indistinguishable from a real photograph. Pay close attention to how the new layer drapes, folds, and casts shadows on the existing outfit.
5.  **Output:** Return ONLY the final, edited image.

`;
    const simulationDirective = generateSimulationDirective(newGarment, modelInfo, size);
    prompt += formatDirectiveForPrompt(simulationDirective, newGarment.gsm);
    
    prompt += `- **Provided Garment Views:**\n`;
    parts.push(dataUrlToPart(garmentViews.front));
    prompt += `  - **Front View:** This is the primary image of the garment's front.\n`;
    if (garmentViews.back) { parts.push(dataUrlToPart(garmentViews.back)); prompt += `  - **Back View:** This is the image of the garment's back.\n`; }
    if (garmentViews.left) { parts.push(dataUrlToPart(garmentViews.left)); prompt += `  - **Left View:** This is the image of the garment's left side.\n`; }
    if (garmentViews.right) { parts.push(dataUrlToPart(garmentViews.right)); prompt += `  - **Right View:** This is the image of the garment's right side.\n`; }

    const { sides: visibleSides } = await analyzePose(currentImageUrl, signal);
    prompt += `- **Pose Analysis:** The model's pose primarily shows their: **${visibleSides.join(', ')}**.\n`;
    prompt += `- **View Logic:** Synthesize information from all provided views to create a seamless, 3D-consistent rendering of the new garment. The design must flow perfectly and continuously from one view to the next based on the visible parts of the model in the pose.\n`;
    
    prompt += `---
**Final Quality Checks:**
- Ensure the final pose remains physically possible and anatomically correct.
- The lighting on the new garment must be consistent with the existing image.
    `;
    
    parts.push({ text: prompt });

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const enhanceFabricRealism = async (modelInfo: ModelInfo, tryOnImageUrl: string, garmentInfo: WardrobeItem, signal?: AbortSignal): Promise<string> => {
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const simulationDirective = generateSimulationDirective(garmentInfo, modelInfo, undefined);
    const physicsDescription = formatDirectiveForPrompt(simulationDirective, garmentInfo.gsm);
    
    const prompt = `You are a digital textile simulation expert. Your task is to re-render ONLY the garment worn by the model, enhancing its realism based on its physical properties.

**CRITICAL RULE:** Do NOT alter the model, their pose, or the background in any way.

${physicsDescription}

**Focus on these details based on the properties above:**
1.  **Seams:** Add subtle puckering and tension along the garment's seams.
2.  **Texture & Wrinkles:** Introduce fine, organic micro-creases and wrinkles consistent with the model's pose and the fabric's described behavior (e.g., sharp creases for low wrinkle resistance, broad folds for high stiffness).
3.  **Lighting & Finish:** Ensure the material's described finish (e.g., matte, sheen) interacts with the light realistically.
4.  **Shadows:** Refine the shadows within the larger folds to give them more depth and softness, reflecting the fabric's stiffness and drape.

Return ONLY the updated image.`;
    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const humanizeModelOnImage = async (tryOnImageUrl: string, signal?: AbortSignal): Promise<string> => {
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `You are a world-class portrait retoucher. Your task is to enhance the realism of the PERSON in this image.

    **CRITICAL RULE:** Do NOT alter the clothing, background, or the person's identity and features. Your job is to add subtle, lifelike details to the person ONLY.

    **Focus on these enhancements:**
    1.  **Skin:** Apply a natural skin texture with visible but subtle pores.
    2.  **Eyes:** Add a complex, multi-point 'catchlight' to the eyes.
    3.  **Lighting:** Enhance the soft, natural micro-shadows on the face to add depth.
    
    Return ONLY the updated image.`;
     const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const upscaleAndFinalizeImage = async (
    imageUrl: string, 
    renderStyle: RenderStyle, 
    context?: { modelInfo: ModelInfo, topGarment?: WardrobeItem, variation: Variation },
    signal?: AbortSignal
): Promise<string> => {
    const imagePart = dataUrlToPart(imageUrl);
    let prompt = `You are a professional photo editor and upscaling expert. Your primary task is to upscale this image to 4K resolution (approx. 3840 pixels on the longest edge) while intelligently enhancing its realism.

**Primary Goal:** Enhance and sharpen all details, textures, and clarity without altering the core content or artistic style. Maintain absolute photorealism.
`;

    if (context && context.topGarment) {
        prompt += `
---
**CONTEXT-AWARE ENHANCEMENT DIRECTIVE:**
You MUST use the following physical context to inform your enhancements. This is not just a simple upscale; it's an intelligent reconstruction based on real-world properties.

**SCENE CONTEXT:**
- **Background:** ${context.variation.backgroundDescription}
- **Lighting:** ${context.variation.lightingStyle}

`
        const simulationDirective = generateSimulationDirective(context.topGarment, context.modelInfo, context.variation.metadata.size);
        prompt += formatDirectiveForPrompt(simulationDirective, context.topGarment.gsm);

        prompt += `
**ENHANCEMENT INSTRUCTIONS:**
- When upscaling the garment, you MUST meticulously reconstruct its **surface micro-texture** based on the fabric physics provided (e.g., render the visible twill weave of denim, the fine fibers of wool).
- Refine highlights and shadows on the fabric according to its specified **light interaction** properties (sheen, specular response) and the scene's **lighting style**.
- Sharpen details along seams and folds based on the fabric's **bend radius** and **wrinkle factor**.
`
    }
    
    prompt += `
---
**POST-PROCESSING STYLE: ${renderStyle}**
`;

    switch (renderStyle) {
        case 'Studio Portrait':
            prompt += `After upscaling, apply post-processing effects to simulate a professional studio portrait taken with an 85mm f/1.8 lens.
            1.  Apply a realistic and aesthetically pleasing depth of field (bokeh) to the background, making the subject pop.
            2.  Ensure lighting on the subject is clean and focused.`;
            break;
        case 'Editorial Film':
             prompt += `After upscaling, apply post-processing effects to simulate a photograph taken on 35mm film.
            1.  Apply a realistic depth of field (bokeh) to the background.
            2.  Add a subtle, natural, and fine-grained film grain over the entire image.
            3.  Introduce very slight chromatic aberration on the sharpest high-contrast edges.`;
            break;
        case 'Digital Clean':
        default:
            prompt += `No additional artistic post-processing is needed. Focus solely on a clean, sharp, high-resolution upscale based on the provided context.`;
            break;
    }

    prompt += "\n\nReturn ONLY the final, upscaled image.";

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const generateDetailSpotlightImage = async (
    garment: WardrobeItem, 
    croppedImageUrl: string, 
    lightingStyle: string, 
    description: string, 
    signal?: AbortSignal
): Promise<string> => {
    const croppedImagePart = dataUrlToPart(croppedImageUrl);
    
    const simulationDirective = generateSimulationDirective(garment, { imageUrl: '' }, undefined); 
    const physicsDescription = formatDirectiveForPrompt(simulationDirective, garment.gsm);

    const prompt = `You are a professional product photographer specializing in macro detail shots for luxury fashion. Your task is to create an ultra-realistic, detailed close-up shot of the provided 'cropped garment image'.

**USER'S INSTRUCTION:**
- **Focus:** "${description}"
- **Lighting:** "${lightingStyle}"

---
**GARMENT'S PHYSICAL PROPERTIES (For Realism):**
${physicsDescription}
---

**CRITICAL INSTRUCTIONS:**
1.  **Hyper-Realism:** The final image must be indistinguishable from a real macro photograph. Render every thread, texture, and seam with extreme detail based on the physical properties.
2.  **Focus & Composition:** The shot must be a close-up, focusing on the details described in the user's instruction. The composition should be artistic and compelling.
3.  **Lighting:** The lighting must match the requested style. For 'Studio', it should be clean and controlled. For 'Natural Light', it should be soft and directional. For 'Dramatic', use high contrast and shadows.
4.  **NO PEOPLE OR BODY PARTS:** The output image MUST NOT contain any person, model, mannequin, hand, finger, or any other body part. It must be a product-only shot. This is the most important rule.
5.  **Output:** Return ONLY the final, high-quality image.
`;

    const parts = [croppedImagePart, { text: prompt }];

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);

    return handleApiResponse(response);
};

const enrichLightingDescription = async (style: string, signal?: AbortSignal): Promise<string> => {
    if (!style || style.toLowerCase() === 'studio' || style.toLowerCase() === 'natural') {
        return `This implies a standard, balanced lighting setup. For 'studio', it's controlled and even. For 'natural', it mimics outdoor daylight.`;
    }
    const prompt = `You are a photography lighting expert. A user has requested a lighting style: "${style}". In one or two sentences, describe the key physical properties of this light for an AI image generator. Mention key light direction, shadow quality (hard/soft), and potential for highlights or reflections. Be concise.`;
    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: textModel,
        contents: { parts: [{ text: prompt }] },
    }), signal);
    return response.text.trim();
};

const enrichBackgroundDescription = async (description: string, signal?: AbortSignal): Promise<string> => {
    if (!description) return "";
    const prompt = `You are a professional location scout. A user has requested a background scene: "${description}". In one or two sentences, describe the key physical and light-emitting/reflecting properties of this location for an AI image generator. For example, mention wet pavement, neon signs, bright windows, reflective surfaces, etc. Be concise.`;
    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: textModel,
        contents: { parts: [{ text: prompt }] },
    }), signal);
    return response.text.trim();
};

export const generateScene = async (
    modelInfo: ModelInfo,
    garments: ProductGarment[],
    wardrobe: WardrobeItem[],
    template: ShootTemplate,
    size: string | undefined,
    sceneOverrides: {
        poseInstruction: string;
        backgroundDescription?: string;
        lightingStyle?: string;
        generalEditPrompt?: string;
        lens?: string;
    },
    signal?: AbortSignal
): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelInfo.imageUrl);
    const parts: any[] = [modelImagePart];

    const background = sceneOverrides.backgroundDescription || template.backgroundStyle.description;
    const lighting = sceneOverrides.lightingStyle || template.lightingDirection;
    const lensRaw = sceneOverrides.lens || '85mm f/1.8 (Portrait)';
    const lens = lensRaw.split('(')[0].trim();

    // STEP 1: Enrich the basic descriptions into physical properties.
    const [enrichedLighting, enrichedBackground] = await Promise.all([
        enrichLightingDescription(lighting, signal),
        enrichBackgroundDescription(background, signal)
    ]);


    // STEP 2: Construct the new Unified Photographic Brief.
    let prompt = `You are an expert AI Photoshoot Director, tasked with simulating a complete, physically cohesive photoshoot from scratch. Your goal is to create a single, unified, photorealistic fashion photograph where all elements are bound by the same laws of physics and optics.

**CRITICAL RULE: Re-create this entire scene from scratch using the provided original assets. Do not simply composite elements. You are simulating a real camera capturing a real moment.**

---
**1. PHOTOGRAPHIC SETUP (The Camera & Lens):**
- **Lens Simulation:** The entire scene must be rendered as if captured through a **${lens} lens**.
- **Optical Properties:** This lens choice dictates a shallow depth of field. The background should have a natural, beautiful bokeh blur, making the subject stand out. The perspective should be compressed, typical of a portrait lens, avoiding wide-angle distortion.

---
**2. THE SCENE & ITS PHYSICS:**
- **Environment:** The setting is: **${background}**.
- **Environmental Analysis:** Physical properties of this location are: **${enrichedBackground}**
- **Lighting Style:** The scene is lit with: **${lighting}**.
- **Lighting Analysis:** The physical properties of this light are: **${enrichedLighting}**
- **CRITICAL LIGHT INTERACTION:** The lighting must interact realistically with the environment and the subject. For example, if the background has wet pavement and neon signs, you MUST render colored reflections from those signs onto the model's clothing and skin. If the lighting is a 'strong key light from the side', you MUST cast long, soft shadows from the model onto the environment. You MUST render a subtle 'rim light' around the model's silhouette if backlighting is present, separating them from the background.

---
**3. THE SUBJECT & OUTFIT:**
- **Base Model:** Use the person from the 'Base Model Image' for identity, face, hair, and body shape.
- **Pose:** Render the model in this new pose: **"${sceneOverrides.poseInstruction}"**.
- **Outfit Construction:** Dress the model in ALL provided garments in order (base to top layer).
`;

    if (sceneOverrides.generalEditPrompt) {
        prompt += `- **Creative Edit:** After constructing the scene, apply this creative edit: **"${sceneOverrides.generalEditPrompt}"**.\n`;
    }

    if (garments.length === 0) {
        prompt += `- No garments provided. The model should be rendered in the base image's clothing if visible, or appropriate simple clothing if not.\n`;
    } else {
        garments.forEach((garmentRef, i) => {
            const garment = wardrobe.find(w => w.id === garmentRef.garmentId);
            const variant = garment?.variants.find(v => v.id === garmentRef.variantId);
            if (!garment || !variant) return;

            const simulationDirective = generateSimulationDirective(garment, modelInfo, size);
            prompt += formatDirectiveForPrompt(simulationDirective, garment.gsm);

            prompt += `- **Provided Garment Views for ${garment.name}:\n`;
            const { views: garmentViews } = variant;
            parts.push(dataUrlToPart(garmentViews.front));
            prompt += `  - Front View.\n`;
            if (garmentViews.back) { parts.push(dataUrlToPart(garmentViews.back)); prompt += `  - Back View.\n`; }
            if (garmentViews.left) { parts.push(dataUrlToPart(garmentViews.left)); prompt += `  - Left View.\n`; }
            if (garmentViews.right) { parts.push(dataUrlToPart(garmentViews.right)); prompt += `  - Right View.\n`; }
        });
    }
    
    prompt += `
---
**5. FINAL CHECKS & CONSTRAINTS:**
- **Output:** Return ONLY the final, single, cohesive photograph.
- **View & Pose Logic:** You must determine which sides of the model are visible based on the new pose instruction and use the corresponding garment views to construct the final image. Synthesize information from all provided views for each garment to create a seamless, 3D-consistent understanding of the entire outfit.
${BASELINE_CONSTRAINTS}
`;
    
    parts.push({ text: prompt });

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const generateSceneFromPoseReference = async (
    modelInfo: ModelInfo,
    garments: ProductGarment[],
    wardrobe: WardrobeItem[],
    template: ShootTemplate,
    size: string | undefined,
    poseReferenceImageUrl: string,
    sceneOverrides: {
        backgroundDescription?: string;
        lightingStyle?: string;
        generalEditPrompt?: string;
        lens?: string;
    },
    signal?: AbortSignal
): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelInfo.imageUrl);
    const poseReferencePart = dataUrlToPart(poseReferenceImageUrl);
    const parts: any[] = [modelImagePart, poseReferencePart];

    const background = sceneOverrides.backgroundDescription || template.backgroundStyle.description;
    const lighting = sceneOverrides.lightingStyle || template.lightingDirection;
    const lensRaw = sceneOverrides.lens || '85mm f/1.8 (Portrait)';
    const lens = lensRaw.split('(')[0].trim();

    const [enrichedLighting, enrichedBackground] = await Promise.all([
        enrichLightingDescription(lighting, signal),
        enrichBackgroundDescription(background, signal)
    ]);

    let prompt = `You are an expert AI Photoshoot Director. Your goal is to create a photorealistic fashion photograph by re-creating a scene from scratch using provided assets.

**CRITICAL RULE: Re-create this entire scene from scratch using the provided original assets. Do not simply composite elements.**

---
**1. PHOTOGRAPHIC SETUP (The Camera & Lens):**
- **Lens Simulation:** Render the scene as if captured through an **${lens} lens**, creating a shallow depth of field and beautiful background bokeh.

---
**2. THE SCENE & ITS PHYSICS:**
- **Environment:** The setting is: **${background}**. Physical properties: **${enrichedBackground}**
- **Lighting Style:** The scene is lit with: **${lighting}**. Physical properties: **${enrichedLighting}**
- **CRITICAL LIGHT INTERACTION:** Ensure lighting interacts realistically with the environment and subject (e.g., reflections from wet pavement, rim lighting from backlights).

---
**3. THE SUBJECT & OUTFIT:**
- **Base Model:** Use the person from the 'Base Model Image' for identity, face, hair, and body shape.
- **Pose Reference Image:** An image showing the desired pose is provided.
- **Pose:** Render the model in the **exact pose** from the 'Pose Reference Image'. This reference image is ONLY for the pose; do not copy its clothing, identity, or background.
- **Outfit Construction:** Dress the model in ALL provided garments in order (base to top layer).
`;

    if (sceneOverrides.generalEditPrompt) {
        prompt += `- **Creative Edit:** After constructing the scene, apply this creative edit: **"${sceneOverrides.generalEditPrompt}"**.\n`;
    }

    garments.forEach((garmentRef, i) => {
        const garment = wardrobe.find(w => w.id === garmentRef.garmentId);
        const variant = garment?.variants.find(v => v.id === garmentRef.variantId);
        if (!garment || !variant) return;

        const simulationDirective = generateSimulationDirective(garment, modelInfo, size);
        prompt += formatDirectiveForPrompt(simulationDirective, garment.gsm);
        prompt += `- **Provided Garment Views for ${garment.name}:\n`;
        const { views: garmentViews } = variant;
        parts.push(dataUrlToPart(garmentViews.front));
        prompt += `  - Front View.\n`;
        if (garmentViews.back) { parts.push(dataUrlToPart(garmentViews.back)); prompt += `  - Back View.\n`; }
        if (garmentViews.left) { parts.push(dataUrlToPart(garmentViews.left)); prompt += `  - Left View.\n`; }
        if (garmentViews.right) { parts.push(dataUrlToPart(garmentViews.right)); prompt += `  - Right View.\n`; }
    });

    prompt += `
---
**5. FINAL CHECKS & CONSTRAINTS:**
- **Output:** Return ONLY the final, single, cohesive photograph.
- **View & Pose Logic:** Use the garment views to construct a seamless 3D understanding of the outfit, applied to the replicated pose.
${BASELINE_CONSTRAINTS}
`;

    parts.push({ text: prompt });

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};


export const generateInpaintingEdit = async (baseImageUrl: string, maskImageUrl: string, prompt: string, signal?: AbortSignal): Promise<string> => {
    const baseImagePart = dataUrlToPart(baseImageUrl);
    const maskImagePart = dataUrlToPart(maskImageUrl);

    const fullPrompt = `You are an expert inpainting photo editor. You will be given a 'base image' to edit, a 'mask image' indicating the editable area, and a text 'prompt'.
    
**CRITICAL RULES:**
1.  Your task is to edit the 'base image' *only* within the white areas defined by the 'mask image'.
2.  The black areas of the 'mask image' correspond to parts of the 'base image' that you MUST NOT change. Preserve them perfectly.
3.  Blend your edits seamlessly and photorealistically with the unchanged parts of the image.
4.  Preserve the identity of the person in the image.

**User's Instruction:** "${prompt}"

Return ONLY the final, edited image.`;
    
    const parts = [baseImagePart, maskImagePart, { text: fullPrompt }];

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);

    return handleApiResponse(response);
};

export const generatePoseFromReferenceImage = async (baseImageUrl: string, referenceImageUrl: string, signal?: AbortSignal): Promise<string> => {
    const baseImagePart = dataUrlToPart(baseImageUrl);
    const referenceImagePart = dataUrlToPart(referenceImageUrl);
    const prompt = `You are an expert pose replication AI. You will receive a 'base image' of a model and a 'reference image' showing a pose.

**Your task is to regenerate the 'base image' so that the person adopts the *exact pose* from the 'reference image'.**

**CRITICAL RULES:**
1.  The person's identity, face, hair, and body type from the 'base image' **must be preserved**.
2.  The clothing worn by the person in the 'base image' **must be preserved**.
3.  The background style from the 'base image' **must be preserved**.
4.  The final image must be photorealistic and seamlessly edited.

${BASELINE_CONSTRAINTS}

Return ONLY the final image with the replicated pose.`;

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [baseImagePart, referenceImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const generateSpeech = async (text: string, signal?: AbortSignal): Promise<string> => {
    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
        },
    }), signal);

    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    if (audioPart?.inlineData?.data) {
        return audioPart.inlineData.data;
    }

    throw new Error("The AI model did not return any audio data.");
};

export const verifyPlanStep = async (imageUrl: string, objective: string, signal?: AbortSignal): Promise<boolean> => {
    const imagePart = dataUrlToPart(imageUrl);
    const prompt = `You are a quality assurance AI. Your task is to determine if an image successfully meets a specific objective.
    
    **Objective:** "${objective}"

    Analyze the provided image. Does the image successfully achieve this objective? Respond ONLY with a valid JSON object matching the provided schema, with a single boolean property 'objectiveMet'.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            objectiveMet: { type: Type.BOOLEAN }
        },
        required: ['objectiveMet']
    };

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: textModel,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    }), signal);

    try {
        const parsed = JSON.parse(response.text);
        if (typeof parsed?.objectiveMet === 'boolean') {
             return parsed.objectiveMet;
        }
        throw new Error("AI returned a JSON object with an unexpected structure.");
    } catch (e) {
        console.error("Failed to parse or validate JSON from verifyPlanStep:", response.text, e);
        throw new Error("The AI failed to verify the plan step. The response was not in the expected format.");
    }
};

export const generatePosePreview = async (
    modelImageUrl: string,
    garments: WardrobeItem[],
    poseInstruction: string,
    signal?: AbortSignal
): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const parts: any[] = [modelImagePart];
    
    garments.forEach(garment => {
        parts.push(dataUrlToPart(garment.variants[0].views.front));
        if (garment.variants[0].views.back) parts.push(dataUrlToPart(garment.variants[0].views.back));
        // We can omit side views for a faster preview
    });

    const prompt = `Replicate the person from the base image and the clothes from the garment images, but place them in this new pose: "${poseInstruction}". Preserve the person's identity. The background can be a simple neutral gray. This is a quick preview, so speed is more important than perfect detail.`;
    parts.push({ text: prompt });

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);
    return handleApiResponse(response);
};

export const generateFlatLayImage = async (
    garmentInfo: WardrobeItem,
    settings: {
        background: string;
        layout: string;
        lighting: string;
        props: string[];
        view: GarmentView;
    },
    signal?: AbortSignal
): Promise<string> => {
    const selectedView = settings.view || 'front';
    const garmentImageUrl = garmentInfo.variants[0].views[selectedView] || garmentInfo.variants[0].views.front;

    if (!garmentImageUrl) {
        throw new Error(`Garment view '${selectedView}' is not available for this item.`);
    }

    const garmentImagePart = dataUrlToPart(garmentImageUrl);
    
    const simulationDirective = generateSimulationDirective(garmentInfo, { imageUrl: '' }, undefined);
    const physicsDescription = formatDirectiveForPrompt(simulationDirective, garmentInfo.gsm);

    let layoutExecution = '';
    switch (settings.layout) {
        case 'Neatly Folded':
            layoutExecution = "The garment must be neatly folded in thirds vertically, as if for retail display. The collar and front graphic must be clearly visible.";
            break;
        case 'Casually Draped':
            layoutExecution = "Arrange the garment in soft, S-shaped curves. It should look natural, unforced, and premium, as if casually tossed onto the surface.";
            break;
        case 'Classic Flat':
        default:
            layoutExecution = "The garment is laid out perfectly flat and symmetrical, as if ironed. All wrinkles are smoothed out. This is a classic e-commerce product shot.";
            break;
    }

    const prompt = `You are an expert product photographer creating a high-end e-commerce flat lay image.

**OBJECTIVE:**
Create a single, photorealistic, top-down flat lay image of the **${selectedView} view** of the provided garment, based on the detailed directives below.

---
**1. GARMENT SIMULATION DIRECTIVE (Based on the provided garment image and its physical properties):**
${physicsDescription}
---
**2. SCENE & PHOTOGRAPHY DIRECTIVE:**
- **Layout Style:** "${settings.layout}"
- **Execution:** ${layoutExecution}
- **Background Surface:** The garment must be placed on a surface that looks like: **"${settings.background}"**.
- **Lighting Style:** The scene must be lit with: **"${settings.lighting}"**. This lighting must cast soft, realistic shadows from the garment's folds and props onto the background surface.
- **Styling Props:** ${settings.props.length > 0 ? `Artfully include the following props in the scene: **${settings.props.join(', ')}**.` : 'No additional props are needed.'}

---
**FINAL OUTPUT:**
Return ONLY the final, photorealistic image. Do not add text, borders, or any other elements.`;

    const parts = [garmentImagePart, { text: prompt }];

    const response: GenerateContentResponse = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);

    return handleApiResponse(response);
};

export const generateCampaignScene = async (
    campaignModels: CampaignModel[],
    brief: CampaignBrief,
    savedModels: SavedModel[],
    wardrobe: WardrobeItem[],
    signal?: AbortSignal
): Promise<string> => {
    // --- STAGE 1: Generate the "Digital Mannequin" on a transparent background ---
    const stage1Parts: any[] = [];
    let stage1Prompt = `You are an expert character compositor. Your task is to extract the people from the 'Model Image(s)', dress them in their provided outfits, and render them together in their specified poses.

**CRITICAL OUTPUT REQUIREMENT:** The final output MUST be a single PNG image containing all posed models on a **perfectly transparent background**. Do not add any background, shadows, or other elements. Preserve the full body of each model.

---
**SUBJECTS & OUTFITS:**
The scene contains **${campaignModels.length} model(s)**.

`;

    for (let i = 0; i < campaignModels.length; i++) {
        const campaignModel = campaignModels[i];
        const modelInfo = savedModels.find(m => m.id === campaignModel.modelId);
        if (!modelInfo) throw new Error(`Model for slot ${i+1} not found.`);

        stage1Prompt += `**Model ${i + 1}:**\n`;
        stage1Prompt += `- **Identity:** Use the person from 'Model ${i + 1} Image'.\n`;
        stage1Prompt += `- **Pose:** Render this model in the pose: **"${campaignModel.poseInstruction}"**.\n`;
        stage1Parts.push({ text: `Model ${i + 1} Image` });
        stage1Parts.push(dataUrlToPart(modelInfo.imageUrl));

        stage1Prompt += `- **Outfit Construction:**\n`;
        if (campaignModel.outfit.length === 0) {
            stage1Prompt += `  - Model is wearing simple, appropriate clothing.\n`;
        } else {
            for (const garmentRef of campaignModel.outfit) {
                const fullGarment = wardrobe.find(w => w.id === garmentRef.garmentId);
                const variant = fullGarment?.variants.find(v => v.id === garmentRef.variantId);
                if (!fullGarment || !variant) continue;

                const simulationDirective = generateSimulationDirective(fullGarment, modelInfo, undefined);
                stage1Prompt += formatDirectiveForPrompt(simulationDirective, fullGarment.gsm);
                stage1Prompt += `  - **Garment: ${fullGarment.name}**\n`;
                const { views: garmentViews } = variant;
                stage1Parts.push({ text: `Front view of ${fullGarment.name}`});
                stage1Parts.push(dataUrlToPart(garmentViews.front));
                if (garmentViews.back) { stage1Parts.push({ text: `Back view of ${fullGarment.name}`}); stage1Parts.push(dataUrlToPart(garmentViews.back)); }
            }
        }
    }

    stage1Prompt += `
---
**FINAL CHECKS & CONSTRAINTS:**
- **Output:** Return ONLY the PNG image of the posed models on a transparent background.
- **View & Pose Logic:** Synthesize information from all provided views for each garment to create a seamless, 3D-consistent understanding of the entire outfit, applied to the new poses.
${BASELINE_CONSTRAINTS}
`;
    stage1Parts.push({ text: stage1Prompt });

    const stage1Response = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: stage1Parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }), signal);

    const digitalMannequinDataUrl = handleApiResponse(stage1Response);
    const digitalMannequinPart = dataUrlToPart(digitalMannequinDataUrl);

    // --- STAGE 2: Composite the "Digital Mannequin" into the final scene ---
    const { framingAndCrop, cameraLens, lighting, scene } = brief;
    const lens = cameraLens.split('(')[0].trim();
    const [enrichedLighting, enrichedBackground] = await Promise.all([
        enrichLightingDescription(lighting, signal),
        enrichBackgroundDescription(scene, signal)
    ]);

    // Extract a valid aspect ratio from the user's text for the API config
    const aspectRatioMatch = framingAndCrop.match(/(\d+:\d+)/);
    let apiAspectRatio: '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | undefined = undefined;
    if (aspectRatioMatch) {
        const ratio = aspectRatioMatch[1];
        if (['16:9', '9:16', '4:3', '3:4', '1:1'].includes(ratio)) {
            apiAspectRatio = ratio as '16:9' | '9:16' | '4:3' | '3:4' | '1:1';
        }
    }

    let stage2Prompt = `**NON-NEGOTIABLE RENDER DIRECTIVE:**
- **Framing, Crop & Aspect Ratio:** The final image's composition MUST strictly adhere to the following instruction: **"${framingAndCrop}"**. This is the most important rule. You must render the image at the specified aspect ratio and use the described framing (e.g., 'full-body', 'close-up', 'waist-up').

You are an expert AI Photoshoot Director. Your task is to take the provided image of person/people on a transparent background (the 'subject') and composite them into a new, photorealistic scene.

**CRITICAL RULE: Do not change the subjects themselves (their pose, identity, or clothing). Your only job is to place them in the environment and apply lighting.**

---
**1. PROVIDED ASSETS:**
- **Subject Image:** The provided image of the posed model(s) on a transparent background.

---
**2. PHOTOGRAPHIC SETUP:**
- **Lens Simulation:** Render the scene as if captured through a **${lens} lens**. This dictates a shallow depth of field with natural background bokeh.

---
**3. SCENE & PHYSICS:**
- **Environment:** The setting is: **"${scene}"**. Physical properties: **${enrichedBackground}**
- **Lighting Style:** The scene is lit with: **"${lighting}"**. Physical properties: **${enrichedLighting}**
- **CRITICAL LIGHT INTERACTION:** The lighting MUST interact realistically with the environment and the subject. Cast realistic shadows from the subject onto the background. Ensure the lighting on the subject matches the direction and quality of the scene's lighting (e.g., add rim light if backlit).

---
**FINAL OUTPUT CHECK:**
- Confirm the final rendered image precisely matches the framing, crop, and aspect ratio directive.
- Return ONLY the final, single, cohesive photograph.
`;

    const config: any = {
        responseModalities: [Modality.IMAGE],
    };
    if (apiAspectRatio) {
        config.aspectRatio = apiAspectRatio;
    }

    const stage2Response = await callGeminiWithTimeout(ai.models.generateContent({
        model: imageModel,
        contents: { parts: [digitalMannequinPart, { text: stage2Prompt }] },
        config: config,
    }), signal);

    return handleApiResponse(stage2Response);
};