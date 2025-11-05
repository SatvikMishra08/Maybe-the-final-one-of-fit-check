/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { WardrobeItem, ModelInfo, MaterialBlendComponent, MaterialName, SimulationDirective, MaterialProperties, FabricPhysics, TensionMap, DesignProperties } from '../types';
import { parseHeight } from './utils';

// --- BASELINE DATA & MATRICES (PHASE 4) ---

const BASELINE_MATERIAL_PROPERTIES: { [key in MaterialName]: Omit<MaterialProperties, 'blendDescription'> } = {
    'Cotton':    { sheen: 0.1, stretch: 0.05, wrinkleResistance: 0.3, lightInteraction: { specularResponse: 0.1, diffuseScattering: 0.8 } },
    'Polyester': { sheen: 0.6, stretch: 0.15, wrinkleResistance: 0.9, lightInteraction: { specularResponse: 0.5, diffuseScattering: 0.4 } },
    'Spandex':   { sheen: 0.4, stretch: 1.0,  wrinkleResistance: 0.6, lightInteraction: { specularResponse: 0.4, diffuseScattering: 0.5 } },
    'Denim':     { sheen: 0.2, stretch: 0.02, wrinkleResistance: 0.7, lightInteraction: { specularResponse: 0.2, diffuseScattering: 0.7 } },
    'Silk':      { sheen: 0.8, stretch: 0.05, wrinkleResistance: 0.2, lightInteraction: { specularResponse: 0.8, diffuseScattering: 0.2 } },
    'Leather':   { sheen: 0.7, stretch: 0.01, wrinkleResistance: 0.5, lightInteraction: { specularResponse: 0.7, diffuseScattering: 0.1 } },
    'Wool':      { sheen: 0.1, stretch: 0.20, wrinkleResistance: 0.8, lightInteraction: { specularResponse: 0.1, diffuseScattering: 0.9 } },
    'Sheer':     { sheen: 0.5, stretch: 0.10, wrinkleResistance: 0.4, lightInteraction: { specularResponse: 0.6, diffuseScattering: 0.3 } },
    'Other':     { sheen: 0.3, stretch: 0.10, wrinkleResistance: 0.5, lightInteraction: { specularResponse: 0.3, diffuseScattering: 0.6 } },
};

type FabricPhysicsMatrix = {
    [key in MaterialName | 'Other']?: {
        [key: string]: Omit<FabricPhysics, 'weightClass'>;
    };
};

const FABRIC_PHYSICS_MATRIX: FabricPhysicsMatrix = {
    'Cotton':    { '0-150':   { stiffness: 0.2, drapeFluidity: 0.8, wrinkleFactor: 0.9, massDensity: 0.3, bendRadius: 'sharp', anisotropicStretch: { warp: 0.03, weft: 0.08 }, surfaceMicrotexture: 'soft matte weave with fine fibers' }, '151-250': { stiffness: 0.4, drapeFluidity: 0.6, wrinkleFactor: 0.7, massDensity: 0.5, bendRadius: 'medium', anisotropicStretch: { warp: 0.02, weft: 0.05 }, surfaceMicrotexture: 'standard cotton weave' }, '251+':    { stiffness: 0.6, drapeFluidity: 0.4, wrinkleFactor: 0.5, massDensity: 0.8, bendRadius: 'broad', anisotropicStretch: { warp: 0.01, weft: 0.03 }, surfaceMicrotexture: 'heavy, dense weave' } },
    'Polyester': { '0-150':   { stiffness: 0.3, drapeFluidity: 0.7, wrinkleFactor: 0.2, massDensity: 0.2, bendRadius: 'sharp', anisotropicStretch: { warp: 0.10, weft: 0.10 }, surfaceMicrotexture: 'smooth, synthetic surface' }, '151-250': { stiffness: 0.5, drapeFluidity: 0.5, wrinkleFactor: 0.1, massDensity: 0.4, bendRadius: 'medium', anisotropicStretch: { warp: 0.08, weft: 0.08 }, surfaceMicrotexture: 'slight synthetic sheen' }, '251+':    { stiffness: 0.7, drapeFluidity: 0.3, wrinkleFactor: 0.1, massDensity: 0.7, bendRadius: 'broad', anisotropicStretch: { warp: 0.05, weft: 0.05 }, surfaceMicrotexture: 'heavy synthetic canvas' } },
    'Denim':     { '0-300':   { stiffness: 0.7, drapeFluidity: 0.3, wrinkleFactor: 0.4, massDensity: 0.7, bendRadius: 'broad', anisotropicStretch: { warp: 0.01, weft: 0.03 }, surfaceMicrotexture: 'visible diagonal twill weave' }, '301-500': { stiffness: 0.9, drapeFluidity: 0.1, wrinkleFactor: 0.2, massDensity: 0.9, bendRadius: 'broad', anisotropicStretch: { warp: 0.01, weft: 0.02 }, surfaceMicrotexture: 'heavy, rigid twill weave' }, '501+':    { stiffness: 1.0, drapeFluidity: 0.0, wrinkleFactor: 0.1, massDensity: 1.0, bendRadius: 'broad', anisotropicStretch: { warp: 0.0, weft: 0.01 }, surfaceMicrotexture: 'extremely rigid, raw denim texture' } },
    'Silk':      { 'any':     { stiffness: 0.1, drapeFluidity: 0.95, wrinkleFactor: 0.9, massDensity: 0.1, bendRadius: 'sharp', anisotropicStretch: { warp: 0.02, weft: 0.02 }, surfaceMicrotexture: 'smooth, high-sheen surface with subtle texture' } },
    'Leather':   { 'any':     { stiffness: 0.8, drapeFluidity: 0.2, wrinkleFactor: 0.3, massDensity: 0.8, bendRadius: 'broad', anisotropicStretch: { warp: 0.01, weft: 0.01 }, surfaceMicrotexture: 'smooth or pebbled grain with semi-gloss finish' } },
    'Wool':      { 'any':     { stiffness: 0.6, drapeFluidity: 0.5, wrinkleFactor: 0.2, massDensity: 0.7, bendRadius: 'broad', anisotropicStretch: { warp: 0.1, weft: 0.15 }, surfaceMicrotexture: 'soft, fuzzy texture with visible fibers' } },
    'Sheer':     { 'any':     { stiffness: 0.1, drapeFluidity: 0.9, wrinkleFactor: 0.6, massDensity: 0.1, bendRadius: 'sharp', anisotropicStretch: { warp: 0.05, weft: 0.05 }, surfaceMicrotexture: 'translucent, fine weave' } },
    'Other':     { 'any':     { stiffness: 0.5, drapeFluidity: 0.5, wrinkleFactor: 0.5, massDensity: 0.5, bendRadius: 'medium', anisotropicStretch: { warp: 0.05, weft: 0.05 }, surfaceMicrotexture: 'standard textile weave' } },
};


// --- LOGIC FUNCTIONS (PHASE 4) ---

function calculateMaterialProperties(blend: MaterialBlendComponent[]): MaterialProperties {
    if (!blend || blend.length === 0) {
        return { ...BASELINE_MATERIAL_PROPERTIES['Other'], blendDescription: 'Unknown Material' };
    }

    const hostComponent = blend.reduce((max, item) => item.percentage > max.percentage ? item : max, blend[0]);
    const otherComponents = blend.filter(item => item !== hostComponent);

    const finalProps: Omit<MaterialProperties, 'blendDescription'> = JSON.parse(JSON.stringify(BASELINE_MATERIAL_PROPERTIES[hostComponent.material]));

    for (const component of otherComponents) {
        const percentage = component.percentage / 100;
        const base = BASELINE_MATERIAL_PROPERTIES[component.material] || BASELINE_MATERIAL_PROPERTIES['Other'];
        switch (component.material) {
            case 'Spandex':
                finalProps.stretch = Math.min(1.0, finalProps.stretch + percentage * 5.0);
                finalProps.wrinkleResistance = Math.min(1.0, finalProps.wrinkleResistance + percentage * 2.0);
                break;
            default:
                finalProps.sheen += base.sheen * percentage;
                finalProps.stretch += base.stretch * percentage;
                finalProps.wrinkleResistance += base.wrinkleResistance * percentage;
                finalProps.lightInteraction.specularResponse += base.lightInteraction.specularResponse * percentage;
                finalProps.lightInteraction.diffuseScattering += base.lightInteraction.diffuseScattering * percentage;
                break;
        }
    }
    
    // Clamp all values to a 0-1 range
    const clamp = (val: number) => Math.max(0, Math.min(1, val));
    finalProps.sheen = clamp(finalProps.sheen);
    finalProps.stretch = clamp(finalProps.stretch);
    finalProps.wrinkleResistance = clamp(finalProps.wrinkleResistance);
    finalProps.lightInteraction.specularResponse = clamp(finalProps.lightInteraction.specularResponse);
    finalProps.lightInteraction.diffuseScattering = clamp(finalProps.lightInteraction.diffuseScattering);

    return {
        ...finalProps,
        blendDescription: blend.map(c => `${c.percentage}% ${c.material}`).join(' / ')
    };
}


function calculateFabricPhysics(garment: WardrobeItem): FabricPhysics | undefined {
    if (!garment.gsm) return undefined;

    const gsm = garment.gsm;
    const primaryMaterial = garment.materialBlend?.[0]?.material || 'Other';
    const matrix = FABRIC_PHYSICS_MATRIX[primaryMaterial] || FABRIC_PHYSICS_MATRIX['Other']!;
    
    const gsmRangeKey = Object.keys(matrix).find(range => {
        if (range === 'any') return true;
        const [min, max] = range.split('-').map(val => val === '+' ? Infinity : Number(val));
        return gsm >= min && (max === Infinity || gsm <= max);
    }) || 'any';

    const physics = matrix[gsmRangeKey];

    return {
        ...physics,
        weightClass: gsm < 180 ? 'lightweight' : gsm < 300 ? 'midweight' : 'heavyweight',
    };
}

function calculateTensionMap(garment: WardrobeItem, modelInfo: ModelInfo, selectedSizeLabel?: string): TensionMap {
    // Default fallback tension map
    const defaultMap: TensionMap = {
        chestEaseInches: 2.5,
        waistEaseInches: 3.0,
        sleeveTightness: 'fitted',
        shoulderFit: 'fitted_seam',
        lengthTermination: 'at the waist'
    };

    const heightInInches = modelInfo.height ? parseHeight(modelInfo.height) : null;
    if (!heightInInches || !garment.measurements || garment.measurements.length === 0) {
        return defaultMap;
    }

    const sizeData = garment.measurements.find(m => m.sizeLabel === selectedSizeLabel) || garment.measurements[0];
    if (!sizeData) return defaultMap;

    const mannequin = {
        height: heightInInches,
        torso_length: heightInInches * 0.28,
        chest_circumference: heightInInches * 0.52,
        waist_circumference: heightInInches * 0.45,
        shoulder_width: heightInInches * 0.25,
        bicep_circumference: heightInInches * 0.18,
    };
    
    const getMeasurement = (dim: string) => sizeData.measurements.find(m => m.dimension.toLowerCase().replace(/[\s_]/g, '').includes(dim))?.value;

    const garmentLength = getMeasurement('length');
    const garmentChest = getMeasurement('chest');
    const garmentWaist = getMeasurement('waist') || garmentChest; // Fallback to chest for straight-cut items
    const garmentShoulder = getMeasurement('shoulder');
    const garmentSleeveOpening = getMeasurement('sleeveopening');
    
    if (garmentLength) {
        const lengthRatio = garmentLength / mannequin.torso_length;
        if (lengthRatio > 1.2) defaultMap.lengthTermination = "well below the waist, around the upper thigh";
        else if (lengthRatio > 1.05) defaultMap.lengthTermination = "just below the waist";
        else defaultMap.lengthTermination = "at the waist";
    }

    if (garmentChest) {
        const mannequinChestWidth = mannequin.chest_circumference / 2;
        defaultMap.chestEaseInches = parseFloat((garmentChest - mannequinChestWidth).toFixed(2));
    }
    
    if (garmentWaist) {
        const mannequinWaistWidth = mannequin.waist_circumference / 2;
        defaultMap.waistEaseInches = parseFloat((garmentWaist - mannequinWaistWidth).toFixed(2));
    }

    if (garmentShoulder) {
        const shoulderOffset = garmentShoulder - mannequin.shoulder_width;
        defaultMap.shoulderFit = shoulderOffset > 1.5 ? 'drop_shoulder' : 'fitted_seam';
    }

    if (garmentSleeveOpening) {
        const mannequinBicepWidth = mannequin.bicep_circumference / 2;
        const sleeveEase = garmentSleeveOpening - mannequinBicepWidth;
        if (sleeveEase < -0.25) defaultMap.sleeveTightness = 'compression';
        else if (sleeveEase > 1.5) defaultMap.sleeveTightness = 'loose';
        else defaultMap.sleeveTightness = 'fitted';
    }

    return defaultMap;
}

function getDesignProperties(garment: WardrobeItem): DesignProperties | undefined {
    if (!garment.designApplication) return undefined;
    
    let description = '';
    switch(garment.designApplication) {
        case 'Embroidery': description = 'has the raised, 3D texture of stitched embroidery, catching light on its threads.'; break;
        case 'Vinyl': description = 'sits on top of the fabric with a slight semi-gloss sheen, creating sharp creases.'; break;
        case 'Puff Print': description = 'is a 3D, raised puff print that should look soft and cast subtle shadows.'; break;
        case 'DTG': default: description = 'is printed directly into the fabric (DTG), so it should be matte and follow the fabric\'s folds perfectly.'; break;
    }
    return { description };
}

export function generateSimulationDirective(garment: WardrobeItem, modelInfo: ModelInfo, selectedSizeLabel?: string): SimulationDirective {
    return {
        materialProperties: calculateMaterialProperties(garment.materialBlend),
        fabricPhysics: calculateFabricPhysics(garment),
        tensionMap: calculateTensionMap(garment, modelInfo, selectedSizeLabel),
        designProperties: getDesignProperties(garment),
    };
}