/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type GarmentView = 'front' | 'back' | 'left' | 'right';

export interface GarmentViews {
  front: string;
  back?: string;
  left?: string;
  right?: string;
}

export type MaterialName = 'Cotton' | 'Polyester' | 'Spandex' | 'Denim' | 'Silk' | 'Leather' | 'Wool' | 'Sheer' | 'Other';
export type Fit = 'Slim' | 'Regular' | 'Oversized';
export type DesignApplication = 'DTG' | 'Vinyl' | 'Embroidery' | 'Screen Print' | 'Puff Print';
export type RenderStyle = 'Digital Clean' | 'Studio Portrait' | 'Editorial Film';


export interface Measurement {
  dimension: string;
  value: number;
}

export interface SizeMeasurement {
  id: string;
  sizeLabel: string;
  measurements: Measurement[];
  unit: 'in' | 'cm';
}

export interface MaterialBlendComponent {
  material: MaterialName;
  percentage: number;
}

// New type for a specific color variant of a garment
export interface GarmentVariant {
  id: string;
  colorName: string;
  views: GarmentViews;
}

export interface WardrobeItem {
  id:string;
  name: string; // This is now the "Style Name"
  variants: GarmentVariant[]; // An array of different colorways
  materialBlend: MaterialBlendComponent[];
  // Advanced Properties (shared across variants)
  gsm?: number;
  fit?: Fit;
  designApplication?: DesignApplication;
  measurements?: SizeMeasurement[];
  weave_type?: 'Jersey' | 'Twill' | 'Pique' | 'Slub' | 'Rib-Knit' | 'Fleece' | 'French Terry';
  manufacturing_finish?: 'None' | 'Garment-Dyed' | 'Stonewashed';
  construction_details?: ('flatlock_seams' | 'ribbed_cuffs' | 'raw_hem')[];
}

// New type to reference a specific garment and variant in a product
export interface ProductGarment {
  garmentId: string; // ID of the WardrobeItem (style)
  variantId: string; // ID of the selected GarmentVariant
}

export interface FlatLayProduct {
    id: string;
    garmentId: string;
    variantId: string; // Added variantId
    imageUrl: string;
    createdAt: Date;
    settings: {
        background: string;
        layout: string;
        props: string[];
        lighting: string;
        view: GarmentView;
    }
}

// Type for the AI Tailor pipeline
export interface IdentifiedItem {
    label: string;
    box: [number, number, number, number]; // y_min, x_min, y_max, x_max (normalized)
}

// --- Realism Engine Types (Phase 4 - Ultimate Directive) ---

export interface TensionMap {
  chestEaseInches: number;
  waistEaseInches: number;
  sleeveTightness: 'loose' | 'fitted' | 'compression';
  shoulderFit: 'fitted_seam' | 'drop_shoulder';
  lengthTermination: string;
}

export interface FabricPhysics {
  weightClass: 'lightweight' | 'midweight' | 'heavyweight';
  stiffness: number; // 0-1 (fluid to rigid)
  drapeFluidity: number; // 0-1 (none to high)
  wrinkleFactor: number; // 0-1 (none to high)
  massDensity: number; // Represents how gravity affects its hang
  bendRadius: 'sharp' | 'medium' | 'broad'; // How the fabric folds
  anisotropicStretch: { warp: number; weft: number; }; // Different stretch on X/Y axes
  surfaceMicrotexture: string; // e.g., 'soft matte weave', 'visible twill'
}

export interface MaterialProperties {
  blendDescription: string;
  sheen: number; // 0-1 (matte to high-sheen)
  stretch: number; // 0-1 (none to high)
  wrinkleResistance: number; // 0-1 (low to high)
  lightInteraction: {
    specularResponse: number; // 0-1 Sharpness of highlights
    diffuseScattering: number; // 0-1 How much light scatters across surface
  };
}

export interface DesignProperties {
    description: string;
}

export interface SimulationDirective {
  tensionMap: TensionMap;
  fabricPhysics?: FabricPhysics;
  materialProperties: MaterialProperties;
  designProperties?: DesignProperties;
}


export interface ArtisticPlanStep {
  stepNumber: number;
  toolToUse: 'changePose' | 'changeBackground' | 'changeLighting' | 'editGarment';
  arguments: { [key: string]: any };
  reason: string;
}

export interface ArtisticPlan {
  overallGoal: string;
  steps: ArtisticPlanStep[];
}

// --- New Chat Message Structure ---

export type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'plan_approval'; plan: ArtisticPlan }
  | { type: 'suggestion_chips'; suggestions: string[] }
  | { type: 'image'; url: string; alt: string };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
}


export interface PlanExecutionState {
  plan: ArtisticPlan | null;
  status: 'idle' | 'awaiting_approval' | 'executing' | 'verifying' | 'paused' | 'complete' | 'failed';
  currentStepIndex: number;
  error?: string;
}


export interface ModelInfo {
    imageUrl: string;
    height?: string;
    physique?: 'Slim/Slender' | 'Average/Regular' | 'Broad/Athletic';
}

// --- Phase 3: Shoot Templates ---

export interface PosePreset {
  id: string;
  name: string;
  description: string;
  instruction: string; // Simple instruction for pose generation
  prompt?: string; // Detailed prompt for Gemini
  direction?: string;
  previewImageUrl: string;
  isPreset?: boolean;
}

export interface TwoModelPosePreset {
  id: string;
  name: string;
  description: string;
  model1Instruction: string;
  model2Instruction: string;
  previewImageUrl: string;
}

export interface BackgroundStyle {
  type: 'studio_clean' | 'urban_street' | 'lifestyle_home' | 'nature' | 'custom';
  description: string; // Prompt for background generation
}

export interface ShootTemplate {
  id: string;
  name: string;
  description: string;
  posePresets: PosePreset[];
  backgroundStyle: BackgroundStyle;
  lightingDirection: 'studio' | 'natural' | 'dramatic';
  fabricRealismDefault: boolean;
  humanizeModelDefault: boolean;
  createdAt: Date;
}


// --- Metadata & Advanced Sub-Features ---

export interface CollectionMetadata {
  tags: string[];
  season?: string;
  theme?: string;
  archived: boolean;
}

export interface ProductMetadata {
  sku?: string;
  tags: string[];
  notes: string;
  createdAt: Date;
  lastModified: Date;
}

export interface DesignGraphic {
  id: string;
  name: string;
  imageUrl: string;
  colorPalette?: string[];
}

export interface VariationMetadata {
  generatedAt: Date;
  fabricRealismApplied: boolean;
  humanizeModelApplied: boolean;
  tags: string[];
  quality: 'standard' | '4k';
  renderStyle?: RenderStyle;
  size?: string;
}

export interface EditStep {
  id: string;
  timestamp: Date;
  editType: 'pose_change' | 'background_swap' | 'brush_edit' | 'inpaint';
  prompt: string;
  resultImageUrl: string;
}

// --- Main Data Architecture ---

export interface Variation {
  id: string;
  poseInstruction: string;
  imageUrl: string;
  backgroundDescription: string;
  lightingStyle: string;
  metadata: VariationMetadata;
  editHistory?: EditStep[];
  // New from spec: For future overrides
  backgroundStyle?: BackgroundStyle;
}

export interface Product {
  id: string;
  collectionId: string;
  shootTemplateId: string;
  name: string;
  modelInfo: ModelInfo;
  garments: ProductGarment[]; // Changed from WardrobeItem[]
  variations: Variation[];
  recommendedSize?: string;
  metadata: ProductMetadata;
  designGraphic?: DesignGraphic;
  // For Lookbook feature
  isSavedLook?: boolean;
  lookName?: string;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: Date;
  description?: string;
  metadata: CollectionMetadata;
}

export interface SavedModel extends ModelInfo {
  id: string;
  name: string;
  // New fields from spec
  shootTemplatesUsedWith?: string[];
  totalMockupsGenerated?: number;
  lastUsedAt?: Date;
}

export interface DetailShot {
  id: string;
  imageUrl: string;
  description: string;
  lighting: string;
}

// --- Campaign Studio Types ---
export interface CampaignBrief {
    objective: string;
    scene: string;
    lighting: string;
    cameraLens: string;
    framingAndCrop: string;
}

export interface CampaignModel {
    slotId: 'model1' | 'model2';
    modelId: string | null;
    outfit: ProductGarment[]; // Changed from WardrobeItem[]
    poseInstruction: string;
}