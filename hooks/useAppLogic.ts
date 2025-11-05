/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// FIX: Rename `generatePoseScene` to `generateScene` and remove `generateCampaignScene` to align with geminiService exports.
import { generateVirtualTryOnImage, analyzePhysique, enhanceFabricRealism, humanizeModelOnImage, upscaleAndFinalizeImage, generateInpaintingEdit, generatePoseFromReferenceImage, generateLayeredImage, generateSpeech, generateScene, verifyPlanStep, generatePosePreview, generateSceneFromPoseReference, generateFlatLayImage, generateDetailSpotlightImage, generateCampaignScene } from '../services/geminiService';
import { Product, Variation, WardrobeItem, ChatMessage, ModelInfo, RenderStyle, SavedModel, ShootTemplate, PosePreset, ArtisticPlan, MessagePart, FlatLayProduct, DetailShot, GarmentView, VariationMetadata, GarmentVariant, ProductGarment } from '../types';
import { getFriendlyErrorMessage, withRetry, triggerHapticFeedback, parseHeight, getRecommendedSize, decode, decodeAudioData, blobToBase64 } from '../lib/utils';
import { GoogleGenAI, Chat, FunctionDeclaration, Type, GenerateContentResponse } from "@google/genai";
import { AppState, AppAction } from '../state/appReducer';
import { toolExecutor, ToolHandlers, getAcknowledgementForTool } from '../services/toolExecutor';
import { SceneOverrides } from '../components/PosePanel';

interface useAppLogicProps {
    state: AppState,
    dispatch: React.Dispatch<AppAction>
}

const tools: FunctionDeclaration[] = [
    {
        name: 'getCanvasSnapshot',
        description: "Gets a snapshot of the current image on the user's canvas. You MUST call this tool before answering any questions about the current image or making proactive suggestions.",
        parameters: { type: Type.OBJECT, properties: {}, required: [] }
    },
    {
        name: 'getInspiration',
        description: "When a user asks for creative ideas, inspiration, or doesn't know what to do next, call this tool with a theme to generate suggestions.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                theme: {
                    type: Type.STRING,
                    description: "A theme for the inspiration, e.g., 'summer vibe', 'night out', 'edgy'."
                }
            },
            required: ['theme']
        }
    },
    {
        name: 'createArtisticPlan',
        description: 'Analyzes a complex user request (like replicating a reference image or a multi-part prompt) and creates a step-by-step plan of tool calls to achieve the final look. This is the first and only tool you should use for such complex requests.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                overallGoal: { type: Type.STRING, description: 'A brief summary of the final artistic vision.' },
                steps: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            stepNumber: { type: Type.INTEGER },
                            toolToUse: { type: Type.STRING, enum: ['changePose', 'changeBackground', 'changeLighting', 'editGarment'] },
                            arguments: { type: Type.OBJECT, description: 'An object containing the arguments for the chosen tool, e.g., { "prompt": "leaning against a wall" }.' },
                            reason: { type: Type.STRING, description: 'A short, user-friendly explanation of why this step is necessary to achieve the goal.' }
                        },
                        required: ['stepNumber', 'toolToUse', 'arguments', 'reason']
                    }
                }
            },
            required: ['overallGoal', 'steps']
        }
    },
    { 
        name: 'addLayer', 
        description: "Adds a new layer of clothing from the user's wardrobe to the current outfit.",
        parameters: { type: Type.OBJECT, properties: { garmentName: { type: Type.STRING } }, required: ['garmentName'] }
    },
    { 
        name: 'removeLastGarment', 
        description: "Removes only the top-most layer of clothing from the current outfit.",
        parameters: { type: Type.OBJECT, properties: {}, required: [] }
    },
    { 
        name: 'removeSpecificGarment', 
        description: "Removes a specific layer of clothing from the current outfit, identified by its name. Use this when the user wants to remove an item that is not on top.",
        parameters: { type: Type.OBJECT, properties: { garmentName: { type: Type.STRING } }, required: ['garmentName'] }
    },
    { 
        name: 'reorderGarments', 
        description: "Changes the stacking order of the garments in the current outfit. Provide the full, new order of garment names from bottom to top.",
        parameters: { type: Type.OBJECT, properties: { garmentNames: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['garmentNames'] }
    },
    {
        name: 'changePose',
        description: 'Changes the pose of the model to a new pose described by the user (e.g., "jumping in the air", "hands on hips"). Use this for any requests related to the model\'s posture or action.',
        parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } }, required: ['prompt'] }
    },
    {
        name: 'changeBackground',
        description: 'Changes the background of the scene to a new setting described by the user (e.g., "a beach at sunset", "a minimalist studio").',
        parameters: { type: Type.OBJECT, properties: { description: { type: Type.STRING } }, required: ['description'] }
    },
    {
        name: 'changeLighting',
        description: 'Adjusts the lighting of the entire image to a new style (e.g., "dramatic movie lighting", "soft morning light").',
        parameters: { type: Type.OBJECT, properties: { style: { type: Type.STRING } }, required: ['style'] }
    },
    {
        name: 'editGarment',
        description: 'Makes a specific change to the clothing itself, like adding a graphic, changing color, or modifying the style (e.g., "add a pocket", "make the shirt red").',
        parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } }, required: ['prompt'] }
    },
    {
        name: 'suggestGarmentFromPrompt',
        description: 'When the user wants to add a garment they do not have, this function suggests creating it with AI and opens the wardrobe.',
        parameters: { type: Type.OBJECT, properties: { garmentDescription: { type: Type.STRING } }, required: ['garmentDescription'] }
    },
    {
        name: 'generateCampaign',
        description: "Generates a multi-shot campaign based on a user's brief. Use this when the user asks for a 'campaign', 'set', 'series', or multiple specific shots at once.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                campaignStyle: { type: Type.STRING, description: "A master description of the overall theme, environment, and mood for the entire campaign." },
                shots: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            shotDescription: { type: Type.STRING, description: "A short label for the shot, e.g., 'Full-body action shot'." },
                            detailedPrompt: { type: Type.STRING, description: "A detailed, specific prompt for generating this single image, which MUST adhere to the campaignStyle." }
                        },
                        required: ['shotDescription', 'detailedPrompt']
                    }
                }
            },
            required: ['campaignStyle', 'shots']
        }
    },
];

const ANIMATION_DELAY = 500; // ms to wait for loading overlay to fade out

export const useAppLogic = ({ state, dispatch }: useAppLogicProps) => {
    const abortControllerRef = useRef<AbortController | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
  
    const activeProduct = useMemo(() => state.products.find(p => p.id === state.activeProductId), [state.products, state.activeProductId]);
    const activeVariation = useMemo(() => activeProduct?.variations.find(v => v.id === state.activeVariationId), [activeProduct, state.activeVariationId]);
    const activeTemplate = useMemo(() => state.shootTemplates.find(t => t.id === activeProduct?.shootTemplateId), [state.shootTemplates, activeProduct]);
  
    const systemInstruction = useMemo(() => {
        const currentOutfit = activeProduct && activeProduct.garments.length > 0 ? `The current outfit on the model consists of these layers, from bottom to top: ${activeProduct.garments.map(g => state.wardrobe.find(w => w.id === g.garmentId)?.name).join(', ')}.` : 'The model is currently not wearing any items from the wardrobe.';
        
        return `You are a helpful and creative AI Photoshoot Director, a true creative co-pilot. Your goal is to collaborate with the user through natural conversation to create the perfect fashion shot.

**YOUR CORE BEHAVIOR - THINK, THEN ACT:**
Your primary directive is to engage in a conversation. For any user request, you have three choices:
1.  **ASK A CLARIFYING QUESTION:** If the user's request is ambiguous, vague, or subjective (e.g., "make it look better", "do something cool"), you **MUST** ask for more details. Do not guess. Propose options for them to choose from. Example: "I can help with that! Are you thinking about changing the pose, the background, or the lighting?"
2.  **PROVIDE ANALYSIS (USING YOUR EYES):** If the user asks a question about the current image ("what do you think?", "is this good?"), you **MUST** first use the \`getCanvasSnapshot()\` tool to see the image. After you receive the image, you will respond with your expert analysis in plain text.
3.  **PROPOSE AN ACTION:** For clear, actionable requests, you can propose a single step or use a tool.
    - **For simple, direct commands** (e.g., "change pose to walking"), you can directly call the \`changePose\` tool.
    - **For complex goals** (e.g., "I want a shot for a winter campaign"), break it down. Propose the first logical step conversationally. Example: "Great idea. Let's start by adding a 'Blue Jacket' to the outfit. Sound good? [Yes, add the jacket]". Only call the tool after user confirmation.
    - **For creative brainstorming**, use the \`getInspiration\` tool when the user asks for ideas.
    - **For multi-step creative visions**, use the \`createArtisticPlan\` tool.

**PROACTIVE CREATIVITY & SUGGESTIONS (THE SPARK):**
- After you provide an analysis or successfully complete an action, you should proactively suggest the next logical creative step. Your suggestions should be contextual and inspiring. Instead of generic suggestions like "[Change the background]", be specific.
- **Example:** After adding a denim jacket, say "The jacket is on. The urban vibe is really coming together. How about we change the background to a [gritty graffiti wall at night]? Or we could try a more [confident, hands-in-pockets pose] to match the style."
- **OFFER CREATIVE ALTERNATIVES:** Occasionally, you can offer an unexpected but relevant creative idea after fulfilling a user's request. Frame it as an alternative.
- **Example:** After the user asks for a 'walking' pose, say "Done. I've updated the pose to 'walking'. As I was generating that, I noticed the way the fabric is flowing would also look amazing in a [dramatic mid-jump pose], which would add a lot of energy. Would you like to see that instead?"

**CONTEXT:**
- The current outfit consists of: ${currentOutfit}.
- The user's wardrobe contains: ${state.wardrobe.map(g => g.name).join(', ')}.

**RESPONSE FORMATTING:**
- When you ask a question or propose an action, you can include specific, clickable suggestions in brackets, like [Suggestion 1] [Suggestion 2].

**YOUR GOAL IS A CONVERSATION, NOT JUST EXECUTION.** Guide the user, offer your expertise, and build the final image together, step-by-step.`;
    }, [state.wardrobe, activeProduct]);
    
    // Initialize Chat
    useEffect(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: tools }],
            }
        });
        setChat(newChat);
    }, [systemInstruction]);

    const handleStartOver = useCallback(() => {
        dispatch({ type: 'START_OVER' });
    }, [dispatch]);

    const handleModelFinalized = useCallback(async (modelUrl: string, height?: string) => {
        dispatch({ type: 'MODEL_ANALYSIS_START' });
        try {
            const [physique] = await Promise.all([
                analyzePhysique(modelUrl),
            ]);
            const modelInfo: ModelInfo = { imageUrl: modelUrl, height, physique };
            dispatch({ type: 'MODEL_READY', payload: modelInfo });
        } catch (error) {
            dispatch({ type: 'MODEL_ANALYSIS_FAILURE', payload: { message: getFriendlyErrorMessage(error, "Failed to analyze model") } });
        }
    }, [dispatch]);
  
    const handleCreateProduct = useCallback(async (garmentId: string, variantId: string, templateId: string) => {
        const garmentInfo = state.wardrobe.find(g => g.id === garmentId);
        const variantInfo = garmentInfo?.variants.find(v => v.id === variantId);
        if (!state.modelInfo || !state.activeCollectionId || !garmentInfo || !variantInfo) return;

        dispatch({ type: 'OPERATION_START', payload: { message: `Styling ${garmentInfo.name}...`, subMessage: "Creating initial look..." } });
        const retryFn = () => handleCreateProduct(garmentId, variantId, templateId);
        
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
    
        let successPayload: { product: Product } | null = null;
        let templateForDispatch: ShootTemplate | null = null;
    
        try {
            const template = state.shootTemplates.find(t => t.id === templateId);
            if (!template) throw new Error("Selected template not found.");
            templateForDispatch = template;
    
            const heightInInches = state.modelInfo.height ? parseHeight(state.modelInfo.height) : null;
            const recommendedSize = heightInInches ? getRecommendedSize(heightInInches, garmentInfo) : undefined;
            
            const imageUrl = await withRetry(() => generateVirtualTryOnImage(state.modelInfo!, garmentInfo, variantInfo, template, recommendedSize, signal));
            
            const initialVariation: Variation = {
                id: `var-${Date.now()}`,
                poseInstruction: 'Initial Pose',
                imageUrl,
                backgroundDescription: template.backgroundStyle.description,
                lightingStyle: template.lightingDirection,
                metadata: {
                    generatedAt: new Date(),
                    fabricRealismApplied: false,
                    humanizeModelApplied: false,
                    tags: [],
                    quality: 'standard',
                    size: recommendedSize
                }
            };
            
            const newProduct: Product = {
                id: `prod-${Date.now()}`,
                collectionId: state.activeCollectionId,
                shootTemplateId: templateId,
                name: garmentInfo.name,
                modelInfo: state.modelInfo,
                garments: [{ garmentId, variantId }],
                variations: [initialVariation],
                recommendedSize,
                metadata: {
                    notes: '',
                    tags: [],
                    createdAt: new Date(),
                    lastModified: new Date()
                }
            };
            successPayload = { product: newProduct };
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Failed to create product"), onRetry: retryFn } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload && templateForDispatch) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'CREATE_PRODUCT_SUCCESS', payload: successPayload });
            dispatch({ type: 'SET_REALISM_FROM_TEMPLATE', payload: { fabric: templateForDispatch.fabricRealismDefault, humanize: templateForDispatch.humanizeModelDefault } });
        }
    }, [state.modelInfo, state.shootTemplates, state.activeCollectionId, state.wardrobe, dispatch]);

    const handleCreateBatch = useCallback(async (garmentId: string, variantId: string, template: ShootTemplate, posePresets: PosePreset[], realism: { fabric: boolean; humanize: boolean; }) => {
        const garmentInfo = state.wardrobe.find(g => g.id === garmentId);
        const variantInfo = garmentInfo?.variants.find(v => v.id === variantId);
        if (!state.modelInfo || !state.activeCollectionId || !garmentInfo || !variantInfo) return;
        
        dispatch({ type: 'BATCH_GENERATE_START', payload: { total: posePresets.length, message: `Starting batch generation for ${garmentInfo.name}` } });
        
        const heightInInches = state.modelInfo.height ? parseHeight(state.modelInfo.height) : null;
        const recommendedSize = heightInInches ? getRecommendedSize(heightInInches, garmentInfo) : undefined;
    
        const allVariations: Variation[] = [];
    
        for (let i = 0; i < posePresets.length; i++) {
            const pose = posePresets[i];
            dispatch({ type: 'BATCH_GENERATE_PROGRESS', payload: { current: i + 1, message: `Generating pose: ${pose.name}` } });
            
            try {
                const sceneOverrides = { poseInstruction: pose.instruction };
                let imageUrl = await generateScene(state.modelInfo, [{ garmentId, variantId }], state.wardrobe, template, recommendedSize, sceneOverrides);
                
                if (realism.fabric) {
                     dispatch({ type: 'BATCH_GENERATE_PROGRESS', payload: { current: i + 1, message: `Applying fabric realism...` } });
                     imageUrl = await enhanceFabricRealism(state.modelInfo, imageUrl, garmentInfo);
                }
                if (realism.humanize) {
                     dispatch({ type: 'BATCH_GENERATE_PROGRESS', payload: { current: i + 1, message: `Humanizing model...` } });
                     imageUrl = await humanizeModelOnImage(imageUrl);
                }
    
                allVariations.push({
                    id: `var-${Date.now()}-${i}`,
                    poseInstruction: pose.name,
                    imageUrl,
                    backgroundDescription: template.backgroundStyle.description,
                    lightingStyle: template.lightingDirection,
                    metadata: {
                        generatedAt: new Date(),
                        fabricRealismApplied: realism.fabric,
                        humanizeModelApplied: realism.humanize,
                        tags: [],
                        quality: 'standard',
                        size: recommendedSize
                    }
                });
            } catch(err) {
                console.error(`Failed to generate pose ${pose.name}:`, err);
            }
        }
    
        if (allVariations.length > 0) {
            const newProduct: Product = {
                id: `prod-${Date.now()}`,
                collectionId: state.activeCollectionId,
                shootTemplateId: template.id,
                name: garmentInfo.name,
                modelInfo: state.modelInfo,
                garments: [{ garmentId, variantId }],
                variations: allVariations,
                recommendedSize,
                metadata: { notes: '', tags: [], createdAt: new Date(), lastModified: new Date() }
            };
            dispatch({ type: 'CREATE_PRODUCT_WITH_BATCH_SUCCESS', payload: { product: newProduct } });
        }
        
        dispatch({ type: 'BATCH_GENERATE_FINISH' });
    }, [state.modelInfo, state.activeCollectionId, state.wardrobe, dispatch]);

    const handleAddLayer = useCallback(async (garmentId: string, variantId: string) => {
        if (!activeProduct || !activeVariation || !activeTemplate) return;
        const newGarment = state.wardrobe.find(g => g.id === garmentId);
        const newVariant = newGarment?.variants.find(v => v.id === variantId);
        if (!newGarment || !newVariant) return;

        dispatch({ type: 'OPERATION_START', payload: { message: `Adding ${newGarment.name}...`, subMessage: "Layering over current outfit." } });
        abortControllerRef.current = new AbortController();
        
        let successPayload: { productId: string, newGarment: ProductGarment, newVariation: Variation } | null = null;
    
        try {
            const currentSize = activeVariation.metadata.size;
            const imageUrl = await withRetry(() => generateLayeredImage(activeProduct.modelInfo, activeVariation.imageUrl, newGarment, newVariant, activeTemplate, currentSize, abortControllerRef.current?.signal));
            
            const newVariation: Variation = {
                id: `var-${Date.now()}`,
                poseInstruction: activeVariation.poseInstruction,
                imageUrl,
                backgroundDescription: activeVariation.backgroundDescription,
                lightingStyle: activeVariation.lightingStyle,
                metadata: {
                    ...activeVariation.metadata,
                    generatedAt: new Date(),
                }
            };
            successPayload = { productId: activeProduct.id, newGarment: { garmentId, variantId }, newVariation };
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Failed to add layer"), onRetry: () => handleAddLayer(garmentId, variantId) } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'ADD_LAYER_SUCCESS', payload: successPayload });
            dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'newProduct', isOpen: false } });
    
            const confirmationMessage: ChatMessage = {
                id: `msg-confirm-${Date.now()}`,
                role: 'assistant',
                parts: [
                    { type: 'text', content: `Added ${newGarment.name}! The new layer looks great. I'd suggest we [change to a more dynamic pose] to show off the full outfit.` },
                ]
            };
            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: confirmationMessage });
        }
    }, [activeProduct, activeVariation, activeTemplate, state.wardrobe, dispatch]);

    const handleRemoveLayer = useCallback((garmentId: string) => {
        if (!activeProduct) return;
        dispatch({ type: 'REMOVE_LAYER', payload: { productId: activeProduct.id } });
        triggerHapticFeedback();

        const confirmationMessage: ChatMessage = {
            id: `msg-confirm-${Date.now()}`,
            role: 'assistant',
            parts: [
                { type: 'text', content: 'Removed the top layer. What should we do with this look now?' },
                { type: 'suggestion_chips', suggestions: ['Add a different layer', 'Change the pose'] }
            ]
        };
        dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: confirmationMessage });
    }, [activeProduct, dispatch]);
    
    const handleReorderLayers = useCallback(async (newGarmentOrder: ProductGarment[]) => {
        if (!activeProduct || !activeTemplate) return;
    
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        const totalLayers = newGarmentOrder.length;
    
        dispatch({ type: 'OPERATION_START', payload: { message: `Regenerating Layers...` } });
    
        let successPayload: { productId: string, newGarments: ProductGarment[], newVariations: Variation[] } | null = null;
    
        try {
            let currentImageUrl = activeProduct.modelInfo.imageUrl;
            const newVariations: Variation[] = [];
            const heightInInches = activeProduct.modelInfo.height ? parseHeight(activeProduct.modelInfo.height) : null;
    
            for (let i = 0; i < totalLayers; i++) {
                const garmentRef = newGarmentOrder[i];
                const garment = state.wardrobe.find(g => g.id === garmentRef.garmentId);
                const variant = garment?.variants.find(v => v.id === garmentRef.variantId);
                if (!garment || !variant) continue;
                dispatch({ type: 'OPERATION_START', payload: { message: `Regenerating Layers...`, subMessage: `Applying ${garment.name} (${i + 1}/${totalLayers})` } });
    
                const recommendedSize = heightInInches ? getRecommendedSize(heightInInches, garment) : undefined;
                
                if (i === 0) { // The first layer uses Virtual Try On
                    currentImageUrl = await generateVirtualTryOnImage(activeProduct.modelInfo, garment, variant, activeTemplate, recommendedSize, signal);
                } else { // Subsequent layers are layered on top
                    currentImageUrl = await generateLayeredImage(activeProduct.modelInfo, currentImageUrl, garment, variant, activeTemplate, recommendedSize, signal);
                }
                
                newVariations.push({
                    id: `var-reorder-${Date.now()}-${i}`,
                    poseInstruction: 'Initial Pose',
                    imageUrl: currentImageUrl,
                    backgroundDescription: activeTemplate.backgroundStyle.description,
                    lightingStyle: activeTemplate.lightingDirection,
                    metadata: {
                        generatedAt: new Date(),
                        fabricRealismApplied: state.isFabricRealismActive,
                        humanizeModelApplied: state.isHumanizeModelActive,
                        tags: [],
                        quality: 'standard',
                        size: recommendedSize
                    }
                });
            }
            successPayload = { productId: activeProduct.id, newGarments: newGarmentOrder, newVariations };
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Failed to reorder layers"), onRetry: () => handleReorderLayers(newGarmentOrder) } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'REORDER_LAYERS_SUCCESS', payload: successPayload });
            
            const lastGarment = state.wardrobe.find(g => g.id === newGarmentOrder[newGarmentOrder.length - 1].garmentId);
            const confirmationMessage: ChatMessage = {
                id: `msg-confirm-${Date.now()}`,
                role: 'assistant',
                parts: [
                    { type: 'text', content: `I've reordered the layers. With the ${lastGarment?.name} on top, maybe we should try a [new background to match] it?` },
                ]
            };
            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: confirmationMessage });
        }
    }, [activeProduct, activeTemplate, state.isFabricRealismActive, state.isHumanizeModelActive, state.wardrobe, dispatch]);

    const handleSaveLook = useCallback((productId: string, name?: string) => {
        const lookName = name || prompt("Enter a name for this look:");
        if (lookName) {
            dispatch({ type: 'SAVE_LOOK_SUCCESS', payload: { productId, name: lookName } });
            triggerHapticFeedback();
        }
    }, [dispatch]);
    
    const handlePoseGenerate = useCallback(async (sceneOverrides: SceneOverrides, poseId?: string) => {
        if (!activeProduct || !activeTemplate || !activeVariation) return;

        const { poseInstruction } = sceneOverrides;

        dispatch({ type: 'OPERATION_START', payload: { message: `Creating new pose...`, subMessage: `"${poseInstruction}"` } });
        const retryFn = () => handlePoseGenerate(sceneOverrides, poseId);
        abortControllerRef.current = new AbortController();
        
        let successPayload: { variation: Variation } | null = null;
        
        try {
            const baseModelInfo = activeProduct.modelInfo;
            const currentSize = activeVariation?.metadata.size;
            let imageUrl: string;

            const posePreview = poseId ? state.posePreviews[poseId] : undefined;

            if (posePreview?.status === 'success' && posePreview.imageUrl) {
                 const overridesForPoseRef = {
                    backgroundDescription: sceneOverrides.backgroundDescription ?? activeVariation.backgroundDescription,
                    lightingStyle: sceneOverrides.lightingStyle ?? activeVariation.lightingStyle,
                    generalEditPrompt: sceneOverrides.generalEditPrompt,
                    lens: sceneOverrides.lens,
                };
                imageUrl = await withRetry(() => generateSceneFromPoseReference(
                    baseModelInfo,
                    activeProduct.garments,
                    state.wardrobe,
                    activeTemplate,
                    currentSize,
                    posePreview.imageUrl!,
                    overridesForPoseRef,
                    abortControllerRef.current?.signal
                ));
            } else {
                imageUrl = await withRetry(() => generateScene(
                    baseModelInfo,
                    activeProduct.garments,
                    state.wardrobe,
                    activeTemplate,
                    currentSize,
                    sceneOverrides,
                    abortControllerRef.current?.signal
                ));
            }
            
            const newVariation: Variation = {
                id: `var-${Date.now()}`,
                imageUrl,
                poseInstruction,
                backgroundDescription: sceneOverrides.backgroundDescription ?? activeVariation.backgroundDescription,
                lightingStyle: sceneOverrides.lightingStyle ?? activeVariation.lightingStyle,
                metadata: {
                    ...activeVariation.metadata,
                    generatedAt: new Date(),
                }
            };
            successPayload = { variation: newVariation };
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Failed to generate pose"), onRetry: retryFn } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'CREATE_VARIATION_SUCCESS', payload: successPayload });
    
            const confirmationMessage: ChatMessage = {
                id: `msg-confirm-${Date.now()}`,
                role: 'assistant',
                parts: [
                    { type: 'text', content: `Pose updated! I think this pose works well with the current lighting. How about we [change the background to a minimalist studio] to really focus on the outfit?` },
                ]
            };
            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: confirmationMessage });
        }
    }, [activeProduct, activeTemplate, activeVariation, state.posePreviews, state.wardrobe, dispatch]);

    const handleApplyBrushEdit = useCallback(async (maskDataUrl: string, prompt: string) => {
        if (state.activeStudioMode === 'productStudio') {
            const activeFlatLayGarment = state.wardrobe.find(g => g.id === state.activeFlatLayGarmentId);
            if (!activeFlatLayGarment) return;
            const baseImageUrl = state.activeFlatLayImagePreview ?? activeFlatLayGarment?.variants[0]?.views.front ?? null;
            if (!baseImageUrl) return;

            dispatch({ type: 'OPERATION_START', payload: { message: `Applying edit: "${prompt}"...` } });
            
            try {
                const imageUrl = await generateInpaintingEdit(baseImageUrl, maskDataUrl, prompt);
                const newFlatLay: FlatLayProduct = {
                    id: `flatlay-edit-${Date.now()}`,
                    garmentId: activeFlatLayGarment.id,
                    variantId: activeFlatLayGarment.variants[0].id,
                    imageUrl,
                    createdAt: new Date(),
                    settings: {
                        background: 'Edited',
                        layout: 'Brush Edit',
                        props: [prompt],
                        lighting: 'Edited',
                        view: 'front',
                    },
                };
                dispatch({ type: 'OPERATION_FINISH' });
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
                dispatch({ type: 'GENERATE_FLAT_LAY_SUCCESS', payload: newFlatLay });
                dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'brushEdit', isOpen: false } });

            } catch (err) {
                dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Brush edit failed") } });
                dispatch({ type: 'OPERATION_FINISH' });
            }
        } else if (state.activeStudioMode === 'campaignStudio') {
            const baseImageUrl = state.campaignImageHistory[state.activeCampaignImageIndex];
            if (!baseImageUrl) return;

            dispatch({ type: 'OPERATION_START', payload: { message: `Applying edit: "${prompt}"...` } });
            
            try {
                const imageUrl = await generateInpaintingEdit(baseImageUrl, maskDataUrl, prompt);
                
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
                dispatch({ type: 'CAMPAIGN_GENERATION_SUCCESS', payload: imageUrl });
                dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'brushEdit', isOpen: false } });

            } catch (err) {
                dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Brush edit failed") } });
                dispatch({ type: 'OPERATION_FINISH' });
            }
        } else { // Fitting Room logic
            if (!activeVariation) return;
            dispatch({ type: 'OPERATION_START', payload: { message: `Applying edit: "${prompt}"...` } });
            
            let successPayload: { poseInstruction: string; imageUrl: string } | null = null;
            
            try {
                const imageUrl = await generateInpaintingEdit(activeVariation.imageUrl, maskDataUrl, prompt);
                successPayload = { poseInstruction: 'Edited', imageUrl };
            } catch (err) {
                dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Brush edit failed"), onRetry: () => handleApplyBrushEdit(maskDataUrl, prompt) } });
                dispatch({ type: 'OPERATION_FINISH' });
                return;
            }
        
            dispatch({ type: 'OPERATION_FINISH' });
            if (successPayload) {
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
                dispatch({ type: 'APPLY_BRUSH_EDIT_SUCCESS', payload: successPayload });
            }
        }
    }, [activeVariation, dispatch, state.activeStudioMode, state.activeFlatLayGarmentId, state.wardrobe, state.activeFlatLayImagePreview, state.campaignImageHistory, state.activeCampaignImageIndex]);
    
    const handleToggleRealism = useCallback(async (type: 'fabric' | 'humanize') => {
        const willBeActive = type === 'fabric' ? !state.isFabricRealismActive : !state.isHumanizeModelActive;
        dispatch({ type: 'TOGGLE_REALISM', payload: { type, willBeActive } });
    
        if (activeVariation && willBeActive) {
            if (confirm(`Do you want to apply ${type === 'fabric' ? 'Fabric Realism' : 'Humanize Model'} to the current image? This will create a new variation.`)) {
                dispatch({ type: 'OPERATION_START', payload: { message: `Applying ${type} realism...` } });
                const retryFn = () => handleToggleRealism(type);
                
                let successPayload: { variation: Variation } | null = null;

                try {
                    let imageUrl: string;
                    if (type === 'fabric' && activeProduct && activeProduct.modelInfo && activeProduct.garments.length > 0) {
                        const topGarmentRef = activeProduct.garments[activeProduct.garments.length - 1];
                        const topGarment = state.wardrobe.find(w => w.id === topGarmentRef.garmentId);
                        if (!topGarment) throw new Error("Top garment not found for realism enhancement.");
                        imageUrl = await enhanceFabricRealism(activeProduct.modelInfo, activeVariation.imageUrl, topGarment);
                    } else {
                        imageUrl = await humanizeModelOnImage(activeVariation.imageUrl);
                    }
                    const metadataUpdate = type === 'fabric' ? { fabricRealismApplied: true } : { humanizeModelApplied: true };
                    const newVariation: Variation = {
                        ...activeVariation,
                        id: `var-${Date.now()}`,
                        poseInstruction: `${activeVariation.poseInstruction} (${type})`,
                        imageUrl,
                        metadata: { ...activeVariation.metadata, ...metadataUpdate, generatedAt: new Date() },
                    };
                    successPayload = { variation: newVariation };
                } catch(err) {
                    dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Failed to apply realism"), onRetry: retryFn } });
                    dispatch({ type: 'OPERATION_FINISH' });
                    return;
                }
            
                dispatch({ type: 'OPERATION_FINISH' });
                if (successPayload) {
                    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
                    dispatch({ type: 'CREATE_VARIATION_SUCCESS', payload: successPayload });
                }
            }
        }
    }, [state.isFabricRealismActive, state.isHumanizeModelActive, activeVariation, activeProduct, state.wardrobe, dispatch]);

    const handleDownload = useCallback(async (
        quality: 'standard' | '4k',
        renderStyle: RenderStyle,
        setProgress: (p: { percent: number; message: string; }) => void
    ): Promise<string | void> => {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        const activeFlatLayGarment = state.wardrobe.find(g => g.id === state.activeFlatLayGarmentId);
        let imageUrl: string | null = null;
    
        if (state.activeStudioMode === 'productStudio') {
            imageUrl = state.activeFlatLayImagePreview ?? activeFlatLayGarment?.variants[0]?.views.front ?? null;
        } else if (state.activeStudioMode === 'campaignStudio') {
            const activeImage = state.campaignImageHistory[state.activeCampaignImageIndex];
            imageUrl = activeImage ?? state.modelInfo?.imageUrl ?? null;
        } else { // fittingRoom or assistant mode
            imageUrl = activeVariation?.imageUrl ?? null;
        }
    
        if (!imageUrl) {
            console.error("Download failed: No image URL found.");
            return;
        }
    
        if (quality === 'standard') {
            return imageUrl;
        }
    
        // Handle 4K upscaling
        setProgress({ percent: 10, message: 'Upscaling to 4K...' });
        
        let upscaledUrl: string;

        // Provide context only if in fitting room and context is available
        if (state.activeStudioMode === 'fittingRoom' && activeProduct && activeVariation) {
            const topGarmentRef = activeProduct.garments[activeProduct.garments.length - 1];
            const topGarment = topGarmentRef ? state.wardrobe.find(g => g.id === topGarmentRef.garmentId) : undefined;
            
            const context = {
                modelInfo: activeProduct.modelInfo,
                topGarment,
                variation: activeVariation,
            };
            upscaledUrl = await upscaleAndFinalizeImage(imageUrl, renderStyle, context, signal);
        } else {
            // Fallback for other modes or if context is missing
            upscaledUrl = await upscaleAndFinalizeImage(imageUrl, renderStyle, undefined, signal);
        }

        setProgress({ percent: 100, message: 'Finalizing...' });
    
        // Update state with the new upscaled image, depending on the current studio mode
        if (state.activeStudioMode === 'productStudio' && activeFlatLayGarment) {
            const newFlatLay: FlatLayProduct = {
                id: `flatlay-4k-${Date.now()}`,
                garmentId: activeFlatLayGarment.id,
                variantId: activeFlatLayGarment.variants[0].id,
                imageUrl: upscaledUrl,
                createdAt: new Date(),
                settings: { background: '4K Upscaled', layout: renderStyle, props: [], lighting: '', view: 'front' },
            };
            dispatch({ type: 'GENERATE_FLAT_LAY_SUCCESS', payload: newFlatLay });
        } else if (state.activeStudioMode === 'campaignStudio') {
            dispatch({ type: 'CAMPAIGN_GENERATION_SUCCESS', payload: upscaledUrl });
        } else if (activeVariation) { // fittingRoom mode
            const newMetadata: Partial<VariationMetadata> = {
                quality: '4k' as const,
                renderStyle,
            };
            dispatch({ type: 'UPDATE_VARIATION_IMAGE', payload: { variationId: activeVariation.id, imageUrl: upscaledUrl, metadata: newMetadata as VariationMetadata } });
        }
    
        return upscaledUrl;
    }, [state, dispatch, activeVariation, activeProduct]);    

    const handleChangeTemplate = useCallback(async (newTemplateId: string) => {
        if (!activeProduct || !activeTemplate || !activeVariation) return;

        const newTemplate = state.shootTemplates.find(t => t.id === newTemplateId);
        if (!newTemplate) return;

        dispatch({ type: 'OPERATION_START', payload: { message: `Applying new style...`, subMessage: newTemplate.name } });
        abortControllerRef.current = new AbortController();
        
        let successPayload: { productId: string, newTemplateId: string, newVariation: Variation } | null = null;

        try {
            const sceneOverrides = {
                poseInstruction: activeVariation.poseInstruction,
                backgroundDescription: newTemplate.backgroundStyle.description,
                lightingStyle: newTemplate.lightingDirection,
            };
            
            const imageUrl = await withRetry(() => generateScene(
                activeProduct.modelInfo,
                activeProduct.garments,
                state.wardrobe,
                newTemplate,
                activeVariation.metadata.size,
                sceneOverrides,
                abortControllerRef.current?.signal
            ));
            
            const newVariation: Variation = {
                id: `var-${Date.now()}`,
                imageUrl,
                poseInstruction: activeVariation.poseInstruction,
                backgroundDescription: newTemplate.backgroundStyle.description,
                lightingStyle: newTemplate.lightingDirection,
                metadata: {
                    ...activeVariation.metadata,
                    generatedAt: new Date(),
                }
            };
            successPayload = { productId: activeProduct.id, newTemplateId, newVariation };
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Failed to apply new style"), onRetry: () => handleChangeTemplate(newTemplateId) } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'APPLY_TEMPLATE_SUCCESS', payload: successPayload });
            dispatch({ type: 'SET_REALISM_FROM_TEMPLATE', payload: { fabric: newTemplate.fabricRealismDefault, humanize: newTemplate.humanizeModelDefault } });
            dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'changeTemplate', isOpen: false } });
        }
    }, [activeProduct, activeTemplate, activeVariation, state.shootTemplates, state.wardrobe, dispatch]);

    const handleChangeSize = useCallback(async (newSize: string) => {
        if (!activeProduct || !activeVariation || !activeTemplate) return;
        if (newSize === activeVariation.metadata.size) return;

        dispatch({ type: 'OPERATION_START', payload: { message: `Updating size to ${newSize}...`, subMessage: "Recalculating fit and drape..." } });
        abortControllerRef.current = new AbortController();
        
        let successPayload: { variation: Variation } | null = null;

        try {
            const sceneOverrides = {
                poseInstruction: activeVariation.poseInstruction,
                backgroundDescription: activeVariation.backgroundDescription,
                lightingStyle: activeVariation.lightingStyle,
            };

            const imageUrl = await withRetry(() => generateScene(
                activeProduct.modelInfo,
                activeProduct.garments,
                state.wardrobe,
                activeTemplate,
                newSize, // Use the new size
                sceneOverrides,
                abortControllerRef.current?.signal
            ));

            const newVariation: Variation = {
                id: `var-size-${Date.now()}`,
                imageUrl,
                poseInstruction: activeVariation.poseInstruction,
                backgroundDescription: activeVariation.backgroundDescription,
                lightingStyle: activeVariation.lightingStyle,
                metadata: {
                    ...activeVariation.metadata,
                    generatedAt: new Date(),
                    size: newSize, // Store the new size in metadata
                }
            };
            successPayload = { variation: newVariation };
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Failed to update size"), onRetry: () => handleChangeSize(newSize) } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'CREATE_VARIATION_SUCCESS', payload: successPayload });
        }
    }, [activeProduct, activeVariation, activeTemplate, state.wardrobe, dispatch]);

    const handleGeneralEdit = async (prompt: string) => {
        if (!activeProduct || !activeVariation || !activeTemplate) return;
        dispatch({ type: 'OPERATION_START', payload: { message: `Editing garment...`, subMessage: `"${prompt}"` } });
        
        let successPayload: { variation: Variation } | null = null;
        
        try {
            const sceneOverrides = {
                poseInstruction: activeVariation.poseInstruction,
                backgroundDescription: activeVariation.backgroundDescription,
                lightingStyle: activeVariation.lightingStyle,
                generalEditPrompt: prompt,
            };
            const imageUrl = await generateScene(activeProduct.modelInfo, activeProduct.garments, state.wardrobe, activeTemplate, activeVariation.metadata.size, sceneOverrides);
    
            const newVariation: Variation = {
                id: `var-${Date.now()}`,
                imageUrl,
                poseInstruction: 'Edited',
                backgroundDescription: activeVariation.backgroundDescription,
                lightingStyle: activeVariation.lightingStyle,
                metadata: { ...activeVariation.metadata, generatedAt: new Date() },
            };
            successPayload = { variation: newVariation };
        } catch(err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, 'Failed to edit garment') } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'CREATE_VARIATION_SUCCESS', payload: successPayload });
    
            const confirmationMessage: ChatMessage = {
                id: `msg-confirm-${Date.now()}`,
                role: 'assistant',
                parts: [
                    { type: 'text', content: `Here are the edits you requested. I think it looks great! What's next? Maybe we can [change the pose to a 'walking away' shot] to show off the back?` },
                ]
            };
            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: confirmationMessage });
        }
    };
    
    const handleBackgroundChange = async (description: string) => {
        if (!activeProduct || !activeVariation || !activeTemplate) return;
        dispatch({ type: 'OPERATION_START', payload: { message: `Changing background...`, subMessage: `To: ${description}` } });
        
        let successPayload: { variation: Variation } | null = null;
        
        try {
            const sceneOverrides = {
                poseInstruction: activeVariation.poseInstruction,
                backgroundDescription: description,
                lightingStyle: activeVariation.lightingStyle,
            };
            const imageUrl = await generateScene(activeProduct.modelInfo, activeProduct.garments, state.wardrobe, activeTemplate, activeVariation.metadata.size, sceneOverrides);
            
            const newVariation: Variation = {
                id: `var-${Date.now()}`,
                imageUrl,
                poseInstruction: activeVariation.poseInstruction,
                backgroundDescription: description,
                lightingStyle: activeVariation.lightingStyle,
                metadata: { ...activeVariation.metadata, generatedAt: new Date() },
            };
            successPayload = { variation: newVariation };
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, 'Failed to change background') } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'CREATE_VARIATION_SUCCESS', payload: successPayload });
            
            const confirmationMessage: ChatMessage = {
                id: `msg-confirm-${Date.now()}`,
                role: 'assistant',
                parts: [
                    { type: 'text', content: `Background updated! The new setting gives it a completely different feel. I have an idea, what if we also [make the lighting more 'dramatic'] to match?` },
                ]
            };
            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: confirmationMessage });
        }
    };
  
    const handleLightingChange = async (style: string) => {
        if (!activeProduct || !activeVariation || !activeTemplate) return;
        dispatch({ type: 'OPERATION_START', payload: { message: `Adjusting lighting...`, subMessage: `Style: ${style}` } });
        
        let successPayload: { variation: Variation } | null = null;
        
        try {
            const sceneOverrides = {
                poseInstruction: activeVariation.poseInstruction,
                backgroundDescription: activeVariation.backgroundDescription,
                lightingStyle: style,
            };
            const imageUrl = await generateScene(activeProduct.modelInfo, activeProduct.garments, state.wardrobe, activeTemplate, activeVariation.metadata.size, sceneOverrides);
            
            const newVariation: Variation = {
                id: `var-${Date.now()}`,
                imageUrl,
                poseInstruction: activeVariation.poseInstruction,
                backgroundDescription: activeVariation.backgroundDescription,
                lightingStyle: style,
                metadata: { ...activeVariation.metadata, generatedAt: new Date() },
            };
            successPayload = { variation: newVariation };
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, 'Failed to change lighting') } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'CREATE_VARIATION_SUCCESS', payload: successPayload });
    
            const confirmationMessage: ChatMessage = {
                id: `msg-confirm-${Date.now()}`,
                role: 'assistant',
                parts: [
                    { type: 'text', content: `Lighting adjusted. This feels much more moody now.` },
                    { type: 'suggestion_chips', suggestions: ['Try an "over the shoulder" pose', 'Change the background again'] }
                ]
            };
            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: confirmationMessage });
        }
    };

    const handleGetInspiration = async (args: { theme: string }) => {
        dispatch({ type: 'CHAT_LOADING_START' });
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `You are a creative director. Brainstorm 3-4 concise, creative, and actionable photoshoot ideas based on the theme: "${args.theme}". The ideas should be things a user can do next, like changing the pose, background, or adding an item.`;
    
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });
    
            const ideas = JSON.parse(response.text) as string[];
    
            const inspirationMessage: ChatMessage = {
                id: `msg-inspire-${Date.now()}`,
                role: 'assistant',
                parts: [
                    { type: 'text', content: `Here are a few ideas for a "${args.theme}" theme:` },
                    { type: 'suggestion_chips', suggestions: ideas }
                ]
            };
            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: inspirationMessage });
    
        } catch (e) {
            console.error("Inspiration generation failed:", e);
            const errorMessage: ChatMessage = {
                id: `err-${Date.now()}`,
                role: 'assistant',
                parts: [{ type: 'text', content: `Sorry, I couldn't come up with ideas for that theme right now. Please try again.` }]
            };
            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: errorMessage });
        } finally {
            dispatch({ type: 'CHAT_LOADING_FINISH' });
        }
    };
      
    const handleSendMessage = useCallback(async (message: string, image?: File) => {
        if (!chat || !activeProduct || !activeVariation) return;
    
        const userParts: MessagePart[] = [];
        if (message) {
            userParts.push({ type: 'text', content: message });
        }
        if (image) {
            userParts.push({ type: 'image', url: URL.createObjectURL(image), alt: 'User upload' });
            dispatch({ type: 'SET_LAST_REFERENCE_IMAGE', payload: image });
        }
    
        const userMessage: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', parts: userParts };
        dispatch({ type: 'CHAT_SEND_MESSAGE', payload: userMessage });
        dispatch({ type: 'CHAT_LOADING_START' });
    
        let genAIResponse: string | undefined;
        let response: GenerateContentResponse | undefined;
    
        try {
            const messageParts: any[] = [];
            const prompt = message.trim() ? message.trim() : (image ? "Analyze this image and give me a deep analysis." : "");
    
            if (prompt) {
                messageParts.push({ text: prompt });
            }
    
            if (image) {
                const base64Data = await blobToBase64(image);
                messageParts.push({
                    inlineData: {
                        mimeType: image.type,
                        data: base64Data,
                    },
                });
            }
    
            if (messageParts.length === 0) {
                dispatch({ type: 'CHAT_LOADING_FINISH' });
                return;
            }
    
            response = await chat.sendMessage({ message: messageParts });
    
            while (response.functionCalls && response.functionCalls.length > 0) {
                const toolCalls = response.functionCalls;
                
                const snapshotCall = toolCalls.find(tc => tc.name === 'getCanvasSnapshot');
                
                if (snapshotCall) {
                    let toolResponsePayload;
                    if (activeVariation?.imageUrl) {
                        const imageResponse = await fetch(activeVariation.imageUrl);
                        const imageBlob = await imageResponse.blob();
                        const base64Data = await blobToBase64(imageBlob);
                        
                        toolResponsePayload = {
                            toolResponses: [{
                                id: snapshotCall.id,
                                name: snapshotCall.name,
                                response: { image: { inlineData: { mimeType: imageBlob.type, data: base64Data } } }
                            }]
                        };
                    } else {
                        toolResponsePayload = {
                            toolResponses: [{
                                id: snapshotCall.id,
                                name: snapshotCall.name,
                                response: { error: "There is no image on the canvas to analyze." }
                            }]
                        };
                    }
                    
                    response = await chat.sendMessage(toolResponsePayload);
                    continue; // Continue loop to process the new response
                }
                
                // If not a snapshot call, they are action tools.
                const handlers: ToolHandlers = {
                    'getInspiration': handleGetInspiration,
                    'addLayer': async (args) => {
                        const garmentName = args.garmentName as string;
                        const garment = state.wardrobe.find(g => g.name.toLowerCase() === garmentName.toLowerCase());
                        if (garment) {
                            await handleAddLayer(garment.id, garment.variants[0].id);
                        } else {
                            const errorMessage: ChatMessage = { id: `err-${Date.now()}`, role: 'assistant', parts: [{ type: 'text', content: `I couldn't find a garment called "${garmentName}" in the wardrobe.` }]};
                            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: errorMessage });
                        }
                    },
                    'removeLastGarment': async () => {
                        if (activeProduct && activeProduct.garments.length > 1) {
                            handleRemoveLayer(activeProduct.garments[activeProduct.garments.length - 1].garmentId);
                        } else {
                             const errorMessage: ChatMessage = { id: `err-${Date.now()}`, role: 'assistant', parts: [{ type: 'text', content: "There's only one garment, so I can't remove a layer." }]};
                            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: errorMessage });
                        }
                    },
                    'removeSpecificGarment': async (args) => {
                        const garmentName = args.garmentName as string;
                        if (!activeProduct) return;
                        const currentGarments = activeProduct.garments;
                        const garmentToRemove = state.wardrobe.find(g => g.name.toLowerCase() === garmentName.toLowerCase());
                        if (!garmentToRemove) {
                            const errorMessage: ChatMessage = { id: `err-${Date.now()}`, role: 'assistant', parts: [{ type: 'text', content: `Couldn't find a garment named "${garmentName}" to remove.` }]};
                            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: errorMessage });
                            return;
                        }
                        const newGarmentOrder = currentGarments.filter(g => g.garmentId !== garmentToRemove.id);
                        if (newGarmentOrder.length < currentGarments.length) {
                            await handleReorderLayers(newGarmentOrder);
                        } else {
                            const errorMessage: ChatMessage = { id: `err-${Date.now()}`, role: 'assistant', parts: [{ type: 'text', content: `Couldn't find a garment named "${garmentName}" in the current outfit to remove.` }]};
                            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: errorMessage });
                        }
                    },
                    'reorderGarments': async (args) => {
                        const garmentNames = args.garmentNames as string[];
                        const newGarmentOrderRefs: ProductGarment[] = [];
                        let allFound = true;
                        
                        for (const name of garmentNames) {
                            const garment = state.wardrobe.find(g => g.name.toLowerCase() === name.toLowerCase());
                            if (garment) {
                                newGarmentOrderRefs.push({ garmentId: garment.id, variantId: garment.variants[0].id });
                            } else {
                                allFound = false;
                                break;
                            }
                        }
                        
                        if (allFound) {
                            await handleReorderLayers(newGarmentOrderRefs);
                        } else {
                             const errorMessage: ChatMessage = { id: `err-${Date.now()}`, role: 'assistant', parts: [{ type: 'text', content: "I couldn't find all the garments you mentioned in the wardrobe to reorder them." }]};
                            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: errorMessage });
                        }
                    },
                    'changePose': (args) => handlePoseGenerate({ poseInstruction: args.prompt as string }),
                    'changeBackground': (args) => handleBackgroundChange(args.description as string),
                    'changeLighting': (args) => handleLightingChange(args.style as string),
                    'editGarment': (args) => handleGeneralEdit(args.prompt as string),
                    'suggestGarmentFromPrompt': async (args) => {
                        dispatch({ type: 'START_AI_GARMENT_GENERATION', payload: args.garmentDescription as string });
                        const confirmationMessage: ChatMessage = {
                            id: `msg-confirm-${Date.now()}`,
                            role: 'assistant',
                            parts: [ { type: 'text', content: `Okay, I can help create that. You can generate it with AI or choose something else from your wardrobe.` } ]
                        };
                        dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: confirmationMessage });
                    },
                    'generateCampaign': (args) => handleGenerateCampaign(args as any),
                };

                for (const funcCall of toolCalls) {
                    const acknowledgement = getAcknowledgementForTool(funcCall);
                    if (acknowledgement) {
                        const ackMessage: ChatMessage = { id: `ack-${Date.now()}`, role: 'assistant', parts: [{ type: 'text', content: acknowledgement }]};
                        dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: ackMessage });
                    }

                    if (funcCall.name === 'createArtisticPlan') {
                        const plan = funcCall.args as ArtisticPlan;
                        dispatch({ type: 'PLAN_RECEIVED', payload: plan });
                        dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: { id: `plan-${Date.now()}`, role: 'assistant', parts: [{ type: 'plan_approval', plan }] }});
                        dispatch({ type: 'CHAT_LOADING_FINISH' });
                        return; // Exit after handling plan
                    }
                    await toolExecutor(funcCall, handlers);
                }
                
                dispatch({ type: 'CHAT_LOADING_FINISH' });
                return; // Exit since action tools were handled
            }

            genAIResponse = response.text;
    
        } catch (e) {
            console.error("Gemini chat error:", e);
            genAIResponse = "Sorry, I encountered an error. Please try again.";
        } finally {
            if (genAIResponse) {
                dispatch({ type: 'CHAT_LOADING_FINISH' });

                const assistantParts: MessagePart[] = [];
                const suggestionRegex = /\[([^\]]+?)\]/g;
                let lastIndex = 0;
                let match;

                while ((match = suggestionRegex.exec(genAIResponse)) !== null) {
                    if (match.index > lastIndex) {
                        assistantParts.push({ type: 'text', content: genAIResponse.substring(lastIndex, match.index).trim() });
                    }
                    assistantParts.push({ type: 'suggestion_chips', suggestions: [match[1]] });
                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex < genAIResponse.length) {
                    assistantParts.push({ type: 'text', content: genAIResponse.substring(lastIndex).trim() });
                }

                const cleanedParts = assistantParts.filter(part => (part.type === 'text' && part.content.length > 0) || part.type !== 'text');

                if (cleanedParts.length > 0) {
                   dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: { id: `msg-${Date.now()}`, role: 'assistant', parts: cleanedParts } });
                }

                 if (state.isTtsEnabled) {
                    try {
                        const textToSpeak = genAIResponse.replace(/\[(.*?)\]/g, '').trim();
                        if (textToSpeak) {
                            if (!audioContextRef.current) {
                                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                            }
                            const audioContext = audioContextRef.current;
                            const base64Audio = await generateSpeech(textToSpeak);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                            const source = audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContext.destination);
                            source.start();
                        }
                    } catch (ttsError) {
                        console.error("TTS generation or playback failed:", ttsError);
                    }
                }
            } else if (!response || !response.functionCalls) {
                 dispatch({ type: 'CHAT_LOADING_FINISH' });
            }

            if (image) {
                dispatch({ type: 'CLEAR_AI_GARMENT_GENERATION' });
            }
        }
    }, [chat, activeProduct, activeVariation, state.wardrobe, state.isTtsEnabled, dispatch, handleAddLayer, handleRemoveLayer, handlePoseGenerate, handleBackgroundChange, handleLightingChange, handleGeneralEdit, handleReorderLayers]);
    
    const handleGenerateCampaign = async (campaignPlan: { campaignStyle: string; shots: { shotDescription: string; detailedPrompt: string }[] }) => {
        if (!activeVariation) return;
    
        const { campaignStyle, shots } = campaignPlan;
        
        dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: { id: `campaign-plan-${Date.now()}`, role: 'assistant', parts: [{ type: 'text', content: `Okay, generating a ${shots.length}-shot campaign: ${campaignStyle}`}] } });
    
        let lastImageUrl = activeVariation.imageUrl;
        let lastVariation = activeVariation;
    
        for (let i = 0; i < shots.length; i++) {
            const shot = shots[i];
            dispatch({ type: 'OPERATION_START', payload: { message: `Generating Campaign Shot (${i + 1}/${shots.length})`, subMessage: shot.shotDescription } });
            
            let successPayload: { variation: Variation } | null = null;
            
            try {
                const newImageUrl = await generateInpaintingEdit(lastImageUrl, '', shot.detailedPrompt);
                const newVariation: Variation = {
                    id: `var-campaign-${Date.now()}-${i}`,
                    imageUrl: newImageUrl,
                    poseInstruction: shot.shotDescription,
                    backgroundDescription: lastVariation.backgroundDescription,
                    lightingStyle: lastVariation.lightingStyle,
                    metadata: { ...lastVariation.metadata, generatedAt: new Date() },
                };
                successPayload = { variation: newVariation };
                lastImageUrl = newImageUrl;
                lastVariation = newVariation;
            } catch(err) {
                dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, `Failed to generate shot: ${shot.shotDescription}`) } });
                dispatch({ type: 'OPERATION_FINISH' });
                return; // Stop campaign on failure
            }

            dispatch({ type: 'OPERATION_FINISH' });
            if (successPayload) {
                await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
                dispatch({ type: 'CREATE_VARIATION_SUCCESS', payload: successPayload });
            }
        }
    };
  
    const executeNextPlanStep = useCallback(async () => {
        const { plan, currentStepIndex } = state.planExecution;
        if (!plan || currentStepIndex >= plan.steps.length) {
            if (plan) dispatch({ type: 'PLAN_EXECUTION_COMPLETE' });
            return;
        }
    
        const step = plan.steps[currentStepIndex];
        dispatch({ type: 'PLAN_STEP_EXECUTION_START', payload: { stepIndex: currentStepIndex } });
    
        try {
            switch (step.toolToUse) {
                case 'changePose': await handlePoseGenerate({ poseInstruction: step.arguments.prompt as string }); break;
                case 'changeBackground': await handleBackgroundChange(step.arguments.description as string); break;
                case 'changeLighting': await handleLightingChange(step.arguments.style as string); break;
                case 'editGarment': await handleGeneralEdit(step.arguments.prompt as string); break;
                default: throw new Error(`Unknown tool in plan: ${step.toolToUse}`);
            }
        } catch (e) {
            const error = getFriendlyErrorMessage(e, `Failed during plan step: ${step.reason}`);
            dispatch({ type: 'PLAN_EXECUTION_FAILED', payload: { error }});
        }
    }, [state.planExecution, dispatch, handlePoseGenerate, handleBackgroundChange, handleLightingChange, handleGeneralEdit]);

    useEffect(() => {
        const { plan, status, currentStepIndex } = state.planExecution;
        // Don't verify if we are already on the last step and it just succeeded
        if (status === 'executing' && activeVariation && plan && currentStepIndex < plan.steps.length) {
            const verify = async () => {
                const currentStep = plan.steps[currentStepIndex];
                if (!currentStep) return;
    
                try {
                    // Short delay to allow UI to update before verification
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const isVerified = await verifyPlanStep(activeVariation.imageUrl, currentStep.reason);
                    if (isVerified) {
                        dispatch({ type: 'PLAN_STEP_VERIFICATION_SUCCESS' });
                    } else {
                        dispatch({ type: 'PLAN_EXECUTION_PAUSED', payload: { reason: `Step ${currentStepIndex + 1} failed verification.` } });
                    }
                } catch (e) {
                     const error = getFriendlyErrorMessage(e, 'Failed to verify plan step.');
                     dispatch({ type: 'PLAN_EXECUTION_FAILED', payload: { error }});
                }
            };
            verify();
        }
    }, [activeVariation?.id, state.planExecution.status, state.planExecution.currentStepIndex, dispatch]); // Rerunning verification on step change
    
    useEffect(() => {
        const { plan, status, currentStepIndex } = state.planExecution;
        if (status === 'executing' && plan && currentStepIndex > -1 && currentStepIndex < plan.steps.length) {
            executeNextPlanStep();
        }
    }, [state.planExecution.status, state.planExecution.currentStepIndex, executeNextPlanStep]); // Trigger next step on index change

    // Effect to handle plan completion
    useEffect(() => {
        if (state.planExecution.status === 'complete') {
            const finalMessage: ChatMessage = {
                id: `plan-complete-${Date.now()}`,
                role: 'assistant',
                parts: [
                    { type: 'text', content: "All done! Here's the final look." },
                    { type: 'suggestion_chips', suggestions: ['Make it a rainy day', 'Change my pose'] }
                ]
            };
            dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: finalMessage });

            // Wait a moment before clearing the completed plan runner
            const timer = setTimeout(() => {
                dispatch({ type: 'PLAN_CANCELLED' }); // Re-using this to reset state
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [state.planExecution.status, dispatch]);


    const handlePlanApproval = useCallback(() => dispatch({ type: 'PLAN_APPROVED' }), [dispatch]);
    const handlePlanCancellation = useCallback(() => {
        dispatch({ type: 'CHAT_RECEIVE_MESSAGE', payload: { id: `msg-${Date.now()}`, role: 'assistant', parts: [{ type: 'text', content: 'Plan cancelled. What would you like to do instead?' }] } });
        dispatch({ type: 'PLAN_CANCELLED' });
    }, [dispatch]);
    
    const handleCancelOperation = () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        dispatch({ type: 'OPERATION_FINISH' });
    };

    const handlePosePreviewGenerate = useCallback(async (pose: PosePreset) => {
        if (state.isLoading || !state.modelInfo || !activeProduct?.garments) return;
        const garments = activeProduct.garments.map(g => state.wardrobe.find(w => w.id === g.garmentId)).filter((g): g is WardrobeItem => !!g);

        dispatch({ type: 'POSE_PREVIEW_START', payload: { poseId: pose.id } });

        try {
            const result = await generatePosePreview(state.modelInfo.imageUrl, garments, pose.instruction);
            dispatch({ type: 'POSE_PREVIEW_SUCCESS', payload: { poseId: pose.id, imageUrl: result } });
        } catch (err) {
            console.error("Preview generation failed:", err);
            dispatch({ type: 'POSE_PREVIEW_FAILURE', payload: { poseId: pose.id } });
        }
    }, [state.isLoading, state.modelInfo, activeProduct, state.wardrobe, dispatch]);

    const handleBulkPosePreviewGenerate = useCallback(async (poses: PosePreset[]) => {
        if (state.isLoading || !state.modelInfo || !activeProduct?.garments) return;

        const garments = activeProduct.garments.map(g => state.wardrobe.find(w => w.id === g.garmentId)).filter((g): g is WardrobeItem => !!g);
    
        const posesToPreview = poses.filter(pose => !state.posePreviews[pose.id] || state.posePreviews[pose.id]?.status === 'error');
    
        const CONCURRENCY_LIMIT = 3;
        for (let i = 0; i < posesToPreview.length; i += CONCURRENCY_LIMIT) {
            const chunk = posesToPreview.slice(i, i + CONCURRENCY_LIMIT);
            const promises = chunk.map(pose => 
                (async () => {
                    dispatch({ type: 'POSE_PREVIEW_START', payload: { poseId: pose.id } });
                    try {
                        const result = await generatePosePreview(state.modelInfo!.imageUrl, garments, pose.instruction);
                        dispatch({ type: 'POSE_PREVIEW_SUCCESS', payload: { poseId: pose.id, imageUrl: result } });
                    } catch (err) {
                        console.error("Preview generation failed:", err);
                        dispatch({ type: 'POSE_PREVIEW_FAILURE', payload: { poseId: pose.id } });
                    }
                })()
            );
            await Promise.all(promises);
        }
    }, [state.isLoading, state.modelInfo, activeProduct, state.posePreviews, state.wardrobe, dispatch]);

    const handleRevertPosePreview = useCallback((poseId: string) => {
        dispatch({ type: 'REVERT_POSE_PREVIEW', payload: { poseId } });
    }, [dispatch]);

    const handleClearAllPosePreviews = useCallback(() => {
        dispatch({ type: 'CLEAR_ALL_POSE_PREVIEWS' });
    }, [dispatch]);

    const handleGenerateFlatLay = useCallback(async (settings: { background: string; layout: string; lighting: string; props: string[]; view: GarmentView; variantId: string; }) => {
        const activeFlatLayGarment = state.wardrobe.find(g => g.id === state.activeFlatLayGarmentId);
        if (!activeFlatLayGarment) return;

        dispatch({ type: 'OPERATION_START', payload: { message: 'Generating Flat Lay...', subMessage: `Using ${settings.layout} style` } });
        abortControllerRef.current = new AbortController();

        let successPayload: FlatLayProduct | null = null;

        try {
            const imageUrl = await withRetry(() => generateFlatLayImage(activeFlatLayGarment, settings, abortControllerRef.current?.signal));
            const newFlatLay: FlatLayProduct = {
                id: `flatlay-${Date.now()}`,
                garmentId: activeFlatLayGarment.id,
                variantId: settings.variantId,
                imageUrl,
                createdAt: new Date(),
                settings: {
                    background: settings.background,
                    layout: settings.layout,
                    props: settings.props,
                    lighting: settings.lighting,
                    view: settings.view,
                },
            };
            successPayload = newFlatLay;
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Failed to generate flat lay image") } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }
    
        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'GENERATE_FLAT_LAY_SUCCESS', payload: successPayload });
        }
    }, [state.wardrobe, state.activeFlatLayGarmentId, dispatch]);
    
    const handleGenerateDetailShot = useCallback(async (garment: WardrobeItem, croppedImageUrl: string, lighting: string, description: string) => {
        dispatch({ type: 'OPERATION_START', payload: { message: 'Generating Detail Shot...', subMessage: description } });
        abortControllerRef.current = new AbortController();
        
        let successPayload: { garmentId: string, shot: DetailShot } | null = null;
        
        try {
            const imageUrl = await withRetry(() => generateDetailSpotlightImage(garment, croppedImageUrl, lighting, description, abortControllerRef.current?.signal));
            const newShot: DetailShot = {
                id: `detail-${Date.now()}`,
                imageUrl,
                description,
                lighting,
            };
            successPayload = { garmentId: garment.id, shot: newShot };
        } catch (err) {
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: getFriendlyErrorMessage(err, "Failed to generate detail shot") } });
            dispatch({ type: 'OPERATION_FINISH' });
            return;
        }

        dispatch({ type: 'OPERATION_FINISH' });
        if (successPayload) {
            await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
            dispatch({ type: 'ADD_DETAIL_SHOT', payload: successPayload });
        }
    }, [dispatch]);
    
    const handleEnterStudioDirectly = useCallback(() => {
        dispatch({ type: 'ENTER_STUDIO_MODE_DIRECTLY' });
    }, [dispatch]);

    const handleGenerateCampaignScene = useCallback(async () => {
        if (state.campaignModels.length === 0) return;

        dispatch({ type: 'CAMPAIGN_GENERATION_START' });
        abortControllerRef.current = new AbortController();

        try {
            const imageUrl = await generateCampaignScene(
                state.campaignModels,
                state.campaignBrief,
                state.savedModels,
                state.wardrobe,
                abortControllerRef.current.signal
            );
            dispatch({ type: 'CAMPAIGN_GENERATION_SUCCESS', payload: imageUrl });
        } catch (err) {
            const errorMessage = getFriendlyErrorMessage(err, 'Failed to generate campaign scene');
            dispatch({ type: 'OPERATION_FAILURE', payload: { message: errorMessage }});
        }
    }, [state.campaignBrief, state.campaignModels, state.savedModels, state.wardrobe, dispatch]);

    const handleSelectTwoModelPose = useCallback((poses: { model1Pose: string; model2Pose: string }) => {
        dispatch({ type: 'UPDATE_CAMPAIGN_MODEL_POSES', payload: poses });
    }, [dispatch]);

    return {
        handleStartOver,
        handleModelFinalized,
        handleCreateProduct,
        handleCreateBatch,
        handleAddLayer,
        handleRemoveLayer,
        handleReorderLayers,
        handleSaveLook,
        handlePoseGenerate,
        handleApplyBrushEdit,
        handleToggleRealism,
        handleDownload,
        handleChangeTemplate,
        handleChangeSize,
        handleGeneralEdit,
        handleBackgroundChange,
        handleLightingChange,
        handleSendMessage,
        handleGenerateCampaign,
        executeNextPlanStep,
        handlePlanApproval,
        handlePlanCancellation,
        handleGenerateFlatLay,
        handleCancelOperation,
        handlePosePreviewGenerate,
        handleRevertPosePreview,
        handleClearAllPosePreviews,
        handleBulkPosePreviewGenerate,
        handleGenerateDetailShot,
        handleEnterStudioDirectly,
        handleGenerateCampaignScene,
        handleSelectTwoModelPose,
    };
};
