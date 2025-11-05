/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { SimulationDirective, TensionMap, FabricPhysics, MaterialProperties, DesignProperties } from '../types';

function formatTensionMap(map: TensionMap): string {
    let fitProfile = `- **FITMENT & TENSION MAP:** Execute the following physical fit mapping.\n`;
    
    fitProfile += `  - **Torso:** The garment has **${map.chestEaseInches > 0 ? '+' : ''}${map.chestEaseInches?.toFixed(2)} inches of ease at the chest** and **${map.waistEaseInches > 0 ? '+' : ''}${map.waistEaseInches?.toFixed(2)} inches of ease at the waist**. Render the fabric drape accordingly (e.g., loose fabric will create larger folds).\n`;
    
    switch (map.sleeveTightness) {
        case 'compression': fitProfile += `  - **Sleeves:** The sleeves are under **negative ease (compression)**. Render them as taut, conforming to the arm's muscle definition.\n`; break;
        case 'loose': fitProfile += `  - **Sleeves:** The sleeves are **loose**. Render them with significant drape and folds.\n`; break;
        case 'fitted': default: fitProfile += `  - **Sleeves:** The sleeves are **fitted** to the arm, with minimal ease. Render them following the arm's contour with small, natural creases.\n`; break;
    }
    
    if (map.shoulderFit === 'drop_shoulder') {
        fitProfile += `  - **Shoulders:** This is a **drop-shoulder** garment. The shoulder seam MUST be rendered displaced laterally off the model's natural shoulder tip.\n`;
    } else {
        fitProfile += `  - **Shoulders:** The shoulder seam is **fitted**. It MUST sit directly on the model's natural acromion bone.\n`;
    }

    fitProfile += `  - **Hemline:** The hem must terminate **${map.lengthTermination}**.\n`;
    
    return fitProfile;
}

function formatFabricPhysics(physics: FabricPhysics | undefined, gsm: number | undefined): string {
    if (!physics) return '';
    
    let desc = `- **FABRIC PHYSICS (GSM: ${gsm}):**\n`;
    
    desc += `  - **Structure & Bending:** Stiffness is ${physics.stiffness?.toFixed(1)}/1.0. This fabric creates **${physics.bendRadius}-radius folds**. Do not render sharp, angular creases unless the material is thin and has low wrinkle resistance.\n`;
    if (physics.anisotropicStretch) {
        desc += `  - **Anisotropic Stretch (${(physics.anisotropicStretch.weft * 100)?.toFixed(0)}% weft / ${(physics.anisotropicStretch.warp * 100)?.toFixed(0)}% warp):** The fabric has different stretch properties along its weave. It will stretch more horizontally around the body but hang more tautly under gravity vertically.\n`;
    }
    desc += `  - **Surface Micro-texture:** The surface is not perfectly smooth. Render it with the texture of a **'${physics.surfaceMicrotexture}'**, which should be visible in highlights and close-ups.\n`;
    desc += `  - **Gravity & Mass:** Mass Density is ${physics.massDensity?.toFixed(1)}/1.0. Render the garment's hang and motion with a realistic sense of weight.\n`;
    
    return desc;
}

function formatMaterialProperties(props: MaterialProperties): string {
    let desc = `- **MATERIAL DEFINITION (Blend: ${props.blendDescription}):**\n`;

    if (props.lightInteraction) {
        desc += `  - **Light Interaction (Specular: ${props.lightInteraction.specularResponse?.toFixed(1)}, Diffuse: ${props.lightInteraction.diffuseScattering?.toFixed(1)}):**\n`;
        if (props.lightInteraction.specularResponse > 0.6) desc += `    - Render sharp, defined highlights (specular reflections) characteristic of a satin, silk, or leather-like finish.\n`;
        else if (props.lightInteraction.specularResponse > 0.3) desc += `    - Render soft, scattered highlights (a subtle sheen or luster).\n`;
        else desc += `    - Render a mostly matte surface with diffuse light and minimal specular highlights.\n`;
    }
    
    if (props.stretch > 0.3) desc += `  - **Elasticity:** High stretch content. The fabric must conform closely to the body's shape, especially at tension points, forming soft, stretched folds rather than sharp angular creases.\n`;
    
    if (props.wrinkleResistance < 0.4) desc += `  - **Wrinkling:** This material is prone to wrinkling; render fine, natural micro-creases and memory folds, especially around joints.\n`;

    return desc;
}

function formatDesignProperties(props: DesignProperties | undefined): string {
    if (!props) return '';
    return `- **DESIGN APPLICATION:** The graphic on the garment ${props.description}\n`;
}

/**
 * Takes a structured SimulationDirective and formats it into a rich,
 * technical, and unambiguous directive for the Gemini prompt.
 */
export function formatDirectiveForPrompt(directive: SimulationDirective, gsm?: number): string {
    let description = "--- \n**INITIATE VIRTUAL GARMENT SIMULATION DIRECTIVE:**\n";

    description += formatTensionMap(directive.tensionMap);
    description += formatFabricPhysics(directive.fabricPhysics, gsm);
    description += formatMaterialProperties(directive.materialProperties);
    description += formatDesignProperties(directive.designProperties);

    description += 'Render all texture, lighting interaction, and drape according to this physical simulation directive.\n';
    return description;
}