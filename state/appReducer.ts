/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Product, Variation, WardrobeItem, ChatMessage, ModelInfo, RenderStyle, SavedModel, SizeMeasurement, Collection, ShootTemplate, VariationMetadata, PosePreset, ArtisticPlan, PlanExecutionState, MessagePart, FlatLayProduct, DetailShot, CampaignBrief, CampaignModel, ProductGarment } from '../types';
import { defaultWardrobe } from '../wardrobe';
import { defaultTemplates } from '../templates';
import { parseHeight, getRecommendedSize } from '../lib/utils';

const INITIAL_POSE_KEY = "Initial Pose";

export interface AppState {
  modelInfo: ModelInfo | null;
  collections: Collection[];
  products: Product[];
  shootTemplates: ShootTemplate[];
  activeCollectionId: string | null;
  activeProductId: string | null;
  activeVariationId: string | null;
  prevActiveVariationId: string | null;
  isLoading: boolean;
  isFinalizingModel: boolean;
  loadingMessage: string;
  loadingSubMessage: string;
  error: { message: string; onRetry?: () => void } | null;
  isSheetCollapsed: boolean;
  wardrobe: WardrobeItem[];
  savedModels: SavedModel[];
  isAddGarmentModalOpen: boolean;
  isNewProductModalOpen: boolean;
  isAddLayerModalOpen: boolean;
  isChangeTemplateModalOpen: boolean;
  isShareModalOpen: boolean;
  isSaveModelModalOpen: boolean;
  isSizeGuideModalOpen: boolean;
  isPoseLibraryOpen: boolean;
  sizeGuideItem: WardrobeItem | null;
  editingGarmentId: string | null; // For editing existing garments
  isDetailSpotlightModalOpen: boolean;
  detailSpotlightItem: WardrobeItem | null;
  isLibraryDrawerOpen: boolean;
  isChatOpen: boolean;
  activePanelTab: 'wardrobe' | 'assistant';
  messages: ChatMessage[];
  isAssistantLoading: boolean;
  lastReferenceImage: File | null;
  isFabricRealismActive: boolean;
  isHumanizeModelActive: boolean;
  isBrushEditMode: boolean;
  isBatchGenerating: boolean;
  batchProgress: { current: number; total: number; message: string };
  aiGarmentDescription: string | null;
  isTtsEnabled: boolean;
  isLookbookVisible: boolean;
  planExecution: PlanExecutionState;
  posePreviews: { [poseId: string]: { status: 'loading' | 'success' | 'error'; imageUrl?: string } };
  activeStudioMode: 'fittingRoom' | 'productStudio' | 'assistant' | 'campaignStudio';
  activeFlatLayGarmentId: string | null;
  flatLayLibrary: FlatLayProduct[];
  activeFlatLayImagePreview: string | null;
  detailShotLibrary: { [garmentId: string]: DetailShot[] };
  hasSkippedModelCreation: boolean;
  campaignBrief: CampaignBrief;
  campaignModels: CampaignModel[];
  campaignImageHistory: string[];
  activeCampaignImageIndex: number;
  // New state for multi-model modals
  isSelectCampaignModelOpen: boolean;
  isAssignWardrobeOpen: boolean;
  activeCampaignModelSlot: 'model1' | 'model2' | null;
}

export type AppAction =
  | { type: 'START_OVER' }
  | { type: 'MODEL_ANALYSIS_START' }
  | { type: 'MODEL_ANALYSIS_FAILURE'; payload: { message: string } }
  | { type: 'MODEL_READY'; payload: ModelInfo }
  | { type: 'UPDATE_HEIGHT'; payload: string }
  | { type: 'OPERATION_START'; payload: { message: string, subMessage?: string } }
  | { type: 'OPERATION_FINISH' }
  | { type: 'OPERATION_FAILURE'; payload: { message: string; onRetry?: () => void } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CREATE_COLLECTION'; payload: { name: string, description?: string } }
  | { type: 'SET_ACTIVE_COLLECTION'; payload: { collectionId: string | null } }
  | { type: 'CREATE_PRODUCT_SUCCESS'; payload: { product: Product } }
  | { type: 'SET_ACTIVE_PRODUCT'; payload: { productId: string | null } }
  | { type: 'ADD_LAYER_SUCCESS'; payload: { productId: string, newGarment: ProductGarment, newVariation: Variation } }
  | { type: 'REORDER_LAYERS_SUCCESS'; payload: { productId: string, newGarments: ProductGarment[], newVariations: Variation[] } }
  | { type: 'REMOVE_LAYER'; payload: { productId: string } }
  | { type: 'UPDATE_PRODUCT_METADATA'; payload: { productId: string, notes: string } }
  | { type: 'SAVE_LOOK_SUCCESS'; payload: { productId: string, name: string } }
  | { type: 'APPLY_TEMPLATE_SUCCESS'; payload: { productId: string, newTemplateId: string, newVariation: Variation } }
  | { type: 'SET_ACTIVE_VARIATION'; payload: { variationId: string } }
  | { type: 'CREATE_VARIATION_START'; payload: { poseInstruction: string } }
  | { type: 'CREATE_VARIATION_SUCCESS'; payload: { variation: Variation } }
  | { type: 'CREATE_VARIATION_FAILURE'; payload: { message: string } }
  | { type: 'DELETE_LAST_VARIATION' }
  | { type: 'APPLY_BRUSH_EDIT_SUCCESS'; payload: { poseInstruction: string; imageUrl: string } }
  | { type: 'TOGGLE_REALISM'; payload: { type: 'fabric' | 'humanize'; willBeActive: boolean } }
  | { type: 'SET_REALISM_FROM_TEMPLATE'; payload: { fabric: boolean, humanize: boolean } }
  | { type: 'UPDATE_VARIATION_IMAGE'; payload: { variationId: string; imageUrl: string; metadata: VariationMetadata } }
  | { type: 'TOGGLE_SHEET' }
  | { type: 'SET_ACTIVE_PANEL_TAB'; payload: 'wardrobe' | 'assistant' }
  | { type: 'SAVE_GARMENT'; payload: WardrobeItem }
  | { type: 'EDIT_GARMENT'; payload: string }
  | { type: 'SET_MODELS_FROM_STORAGE'; payload: SavedModel[] }
  | { type: 'SAVE_NEW_MODEL'; payload: SavedModel }
  | { type: 'LOAD_SAVED_MODEL'; payload: SavedModel }
  | { type: 'DELETE_SAVED_MODEL'; payload: string }
  | { type: 'IMPORT_MODELS'; payload: SavedModel[] }
  | { type: 'CHAT_SEND_MESSAGE'; payload: ChatMessage }
  | { type: 'CHAT_RECEIVE_MESSAGE'; payload: ChatMessage }
  | { type: 'CHAT_LOADING_START' }
  | { type: 'CHAT_LOADING_FINISH' }
  | { type: 'SET_LAST_REFERENCE_IMAGE', payload: File | null }
  | { type: 'TOGGLE_MODAL'; payload: { modal: 'addGarment' | 'newProduct' | 'addLayer' | 'changeTemplate' | 'share' | 'saveModel' | 'brushEdit' | 'chat' | 'sizeGuide' | 'poseLibrary' | 'detailSpotlight' | 'libraryDrawer' | 'selectCampaignModel' | 'assignWardrobe'; isOpen: boolean; item?: WardrobeItem; slotId?: 'model1' | 'model2'; } }
  | { type: 'BATCH_GENERATE_START'; payload: { total: number; message: string } }
  | { type: 'BATCH_GENERATE_PROGRESS'; payload: { current: number; message: string } }
  | { type: 'CREATE_PRODUCT_WITH_BATCH_SUCCESS'; payload: { product: Product } }
  | { type: 'BATCH_GENERATE_FINISH' }
  | { type: 'START_AI_GARMENT_GENERATION'; payload: string }
  | { type: 'CLEAR_AI_GARMENT_GENERATION' }
  | { type: 'TOGGLE_TTS' }
  | { type: 'TOGGLE_LOOKBOOK' }
  | { type: 'PLAN_RECEIVED'; payload: ArtisticPlan }
  | { type: 'PLAN_APPROVED' }
  | { type: 'PLAN_STEP_EXECUTION_START'; payload: { stepIndex: number } }
  | { type: 'PLAN_STEP_VERIFICATION_SUCCESS' }
  | { type: 'PLAN_EXECUTION_PAUSED'; payload: { reason: string } }
  | { type: 'PLAN_EXECUTION_COMPLETE' }
  | { type: 'PLAN_CANCELLED' }
  | { type: 'PLAN_EXECUTION_FAILED'; payload: { error: string } }
  | { type: 'POSE_PREVIEW_START'; payload: { poseId: string } }
  | { type: 'POSE_PREVIEW_SUCCESS'; payload: { poseId: string, imageUrl: string } }
  | { type: 'POSE_PREVIEW_FAILURE'; payload: { poseId: string } }
  | { type: 'REVERT_POSE_PREVIEW'; payload: { poseId: string } }
  | { type: 'CLEAR_ALL_POSE_PREVIEWS' }
  | { type: 'SET_STUDIO_MODE'; payload: 'fittingRoom' | 'productStudio' | 'assistant' | 'campaignStudio' }
  | { type: 'SET_ACTIVE_FLAT_LAY_GARMENT'; payload: string | null }
  | { type: 'GENERATE_FLAT_LAY_SUCCESS'; payload: FlatLayProduct }
  | { type: 'SET_FLAT_LAY_PREVIEW'; payload: string | null }
  | { type: 'ADD_DETAIL_SHOT'; payload: { garmentId: string, shot: DetailShot } }
  | { type: 'CLOSE_ALL_MODALS' }
  | { type: 'ENTER_STUDIO_MODE_DIRECTLY' }
  | { type: 'RESET_TO_MODEL_CREATION' }
  | { type: 'UPDATE_CAMPAIGN_BRIEF'; payload: Partial<CampaignBrief> }
  | { type: 'UPDATE_MODEL_POSE_INSTRUCTION'; payload: string } // Obsolete, kept for safety
  | { type: 'CAMPAIGN_GENERATION_START' }
  | { type: 'CAMPAIGN_GENERATION_SUCCESS'; payload: string }
  | { type: 'CAMPAIGN_GENERATION_FAILURE'; payload: string }
  | { type: 'ADD_CAMPAIGN_MODEL_SLOT' }
  | { type: 'REMOVE_CAMPAIGN_MODEL_SLOT'; payload: { slotId: 'model1' | 'model2' } }
  | { type: 'UPDATE_CAMPAIGN_MODEL_POSE'; payload: { slotId: 'model1' | 'model2', pose: string } }
  | { type: 'UPDATE_CAMPAIGN_MODEL_POSES'; payload: { model1Pose: string; model2Pose: string } }
  | { type: 'ASSIGN_MODEL_TO_CAMPAIGN_SLOT'; payload: { slotId: 'model1' | 'model2', modelId: string } }
  | { type: 'ASSIGN_OUTFIT_TO_CAMPAIGN_SLOT'; payload: { slotId: 'model1' | 'model2', outfit: ProductGarment[] } }
  | { type: 'SET_ACTIVE_CAMPAIGN_IMAGE_INDEX'; payload: number };


const initialPlanState: PlanExecutionState = {
  plan: null,
  status: 'idle',
  currentStepIndex: -1,
  error: undefined,
};

export const initialState: AppState = {
  modelInfo: null,
  collections: [],
  products: [],
  shootTemplates: defaultTemplates,
  activeCollectionId: null,
  activeProductId: null,
  activeVariationId: null,
  prevActiveVariationId: null,
  isLoading: false,
  isFinalizingModel: false,
  loadingMessage: '',
  loadingSubMessage: '',
  error: null,
  isSheetCollapsed: true, // Default to collapsed on mobile
  wardrobe: defaultWardrobe,
  savedModels: [],
  isAddGarmentModalOpen: false,
  isNewProductModalOpen: false,
  isAddLayerModalOpen: false,
  isChangeTemplateModalOpen: false,
  isShareModalOpen: false,
  isSaveModelModalOpen: false,
  isSizeGuideModalOpen: false,
  isPoseLibraryOpen: false,
  sizeGuideItem: null,
  editingGarmentId: null,
  isDetailSpotlightModalOpen: false,
  detailSpotlightItem: null,
  isLibraryDrawerOpen: false,
  isChatOpen: false,
  activePanelTab: 'wardrobe',
  messages: [],
  isAssistantLoading: false,
  lastReferenceImage: null,
  isFabricRealismActive: false,
  isHumanizeModelActive: false,
  isBrushEditMode: false,
  isBatchGenerating: false,
  batchProgress: { current: 0, total: 0, message: '' },
  aiGarmentDescription: null,
  isTtsEnabled: true,
  isLookbookVisible: false,
  planExecution: initialPlanState,
  posePreviews: {},
  activeStudioMode: 'fittingRoom',
  activeFlatLayGarmentId: null,
  flatLayLibrary: [],
  activeFlatLayImagePreview: null,
  detailShotLibrary: {},
  hasSkippedModelCreation: false,
  campaignBrief: {
    objective: 'Fall/Winter 2024 Lookbook',
    scene: 'A misty forest with tall pine trees and a narrow path',
    lighting: 'Soft, overcast morning light filtering through the trees',
    cameraLens: '85mm f/1.8 (Portrait)',
    framingAndCrop: 'Full-body portrait shot, 2:3 aspect ratio',
  },
  campaignModels: [],
  campaignImageHistory: [],
  activeCampaignImageIndex: -1,
  isSelectCampaignModelOpen: false,
  isAssignWardrobeOpen: false,
  activeCampaignModelSlot: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_OVER':
      return { ...initialState, wardrobe: defaultWardrobe, savedModels: state.savedModels };
    case 'MODEL_ANALYSIS_START':
      return { ...state, isFinalizingModel: true };
    case 'MODEL_ANALYSIS_FAILURE':
      return { ...initialState, wardrobe: defaultWardrobe, savedModels: state.savedModels, error: { message: action.payload.message } };
    case 'MODEL_READY': {
        const defaultCollection: Collection = { 
            id: `col-${Date.now()}`,
            name: 'My First Collection',
            description: 'My first collection of AI-generated product mockups.',
            createdAt: new Date(),
            metadata: { tags: [], archived: false, season: '', theme: '' }
        };

        const modelInfo = action.payload;
        const baseTemplate = defaultTemplates[0];

        const baseVariation: Variation = {
            id: `var-base-${Date.now()}`,
            poseInstruction: INITIAL_POSE_KEY,
            imageUrl: modelInfo.imageUrl,
            backgroundDescription: baseTemplate.backgroundStyle.description,
            lightingStyle: baseTemplate.lightingDirection,
            metadata: {
                generatedAt: new Date(),
                fabricRealismApplied: false,
                humanizeModelApplied: false,
                tags: ['base-model'],
                quality: 'standard',
            }
        };

        const baseProduct: Product = {
            id: `prod-base-${Date.now()}`,
            collectionId: defaultCollection.id,
            shootTemplateId: baseTemplate.id,
            name: 'Base Model',
            modelInfo: modelInfo,
            garments: [],
            variations: [baseVariation],
            metadata: {
                notes: 'This is the base model without any garments.',
                tags: [],
                createdAt: new Date(),
                lastModified: new Date()
            }
        };

        return {
            ...state,
            modelInfo,
            hasSkippedModelCreation: false, // Explicitly set this
            collections: [defaultCollection],
            products: [baseProduct],
            activeCollectionId: defaultCollection.id,
            activeProductId: baseProduct.id,
            activeVariationId: baseVariation.id,
            messages: [{ id: 'initial', role: 'assistant', parts: [{ type: 'text', content: "Hi! I'm your Style Assistant. You can now add clothes, change the pose of your model, or give you a whole new look. What should we do?" }, { type: 'suggestion_chips', suggestions: ['Add a layer', 'Change my pose'] }] }],
            isFinalizingModel: false,
        };
    }
    case 'UPDATE_HEIGHT': {
        if (!state.modelInfo) return state;
        const newHeight = action.payload;
        const heightInInches = parseHeight(newHeight);
        
        const newProducts = state.products.map(p => {
          if (p.garments.length === 0 || !heightInInches) return p;
          const topGarmentId = p.garments[p.garments.length - 1].garmentId;
          const topGarment = state.wardrobe.find(w => w.id === topGarmentId);
          if (!topGarment) return p;

          const recommendedSize = getRecommendedSize(heightInInches, topGarment);
          return { ...p, recommendedSize };
        });

        return {
            ...state,
            modelInfo: { ...state.modelInfo, height: newHeight },
            products: newProducts,
        };
    }
    case 'OPERATION_START':
      return { ...state, isLoading: true, loadingMessage: action.payload.message, loadingSubMessage: action.payload.subMessage ?? '' };
    case 'OPERATION_FINISH':
      return { ...state, isLoading: false, loadingMessage: '', loadingSubMessage: '' };
    case 'OPERATION_FAILURE':
      return { ...state, isLoading: false, isFinalizingModel: false, error: { message: action.payload.message, onRetry: action.payload.onRetry } };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'CREATE_COLLECTION':
        const newCollection: Collection = {
            id: `col-${Date.now()}`,
            name: action.payload.name,
            description: action.payload.description,
            createdAt: new Date(),
            metadata: { tags: [], archived: false, season: '', theme: '' }
        };
        return {
            ...state,
            collections: [...state.collections, newCollection],
            activeCollectionId: newCollection.id,
            activeProductId: null,
            activeVariationId: null,
        };
    case 'SET_ACTIVE_COLLECTION':
        return {
            ...state,
            activeCollectionId: action.payload.collectionId,
            activeProductId: null,
            activeVariationId: null,
            isLookbookVisible: false,
        };
    case 'CREATE_PRODUCT_SUCCESS':
      return {
        ...state,
        products: [...state.products, action.payload.product],
        activeProductId: action.payload.product.id,
        activeVariationId: action.payload.product.variations[0].id,
        isNewProductModalOpen: false,
      };
    case 'SET_ACTIVE_PRODUCT':
      const newActiveProduct = state.products.find(p => p.id === action.payload.productId);
      const newActiveVariationId = newActiveProduct ? newActiveProduct.variations[newActiveProduct.variations.length - 1]?.id ?? null : null;
      return {
        ...state,
        activeProductId: action.payload.productId,
        activeVariationId: newActiveVariationId,
        activeCollectionId: newActiveProduct ? newActiveProduct.collectionId : state.activeCollectionId,
        isLookbookVisible: false,
      };
    case 'ADD_LAYER_SUCCESS': {
        const { productId, newGarment, newVariation } = action.payload;
        const newProducts = state.products.map(p => {
            if (p.id === productId) {
                const isFirstGarment = p.garments.length === 0;
                const updatedGarments = [...p.garments, newGarment];
                const updatedVariations = isFirstGarment
                  ? [newVariation] // Replace base variation
                  : [...p.variations, newVariation];
                
                const topGarmentInfo = state.wardrobe.find(w => w.id === newGarment.garmentId);
                const heightInInches = p.modelInfo.height ? parseHeight(p.modelInfo.height) : null;
                const recommendedSize = (heightInInches && topGarmentInfo) ? getRecommendedSize(heightInInches, topGarmentInfo) : undefined;
                return {
                    ...p,
                    garments: updatedGarments,
                    variations: updatedVariations,
                    recommendedSize,
                };
            }
            return p;
        });
        return {
            ...state,
            products: newProducts,
            activeVariationId: newVariation.id,
        };
    }
    case 'REORDER_LAYERS_SUCCESS': {
        const { productId, newGarments, newVariations } = action.payload;
        const newProducts = state.products.map(p => {
            if (p.id === productId) {
                const topGarmentRef = newGarments[newGarments.length - 1];
                const topGarmentInfo = state.wardrobe.find(w => w.id === topGarmentRef.garmentId);
                const heightInInches = p.modelInfo.height ? parseHeight(p.modelInfo.height) : null;
                const recommendedSize = (heightInInches && topGarmentInfo) ? getRecommendedSize(heightInInches, topGarmentInfo) : undefined;
                return {
                    ...p,
                    garments: newGarments,
                    variations: newVariations,
                    recommendedSize,
                };
            }
            return p;
        });
        return {
            ...state,
            products: newProducts,
            activeVariationId: newVariations[newVariations.length - 1].id,
        };
    }
    case 'REMOVE_LAYER': {
        const { productId } = action.payload;
        let newActiveVariationId = state.activeVariationId;
        const newProducts = state.products.map(p => {
            if (p.id === productId && p.garments.length > 1 && p.variations.length > 1) {
                const updatedGarments = p.garments.slice(0, -1);
                const updatedVariations = p.variations.slice(0, -1);
                newActiveVariationId = updatedVariations[updatedVariations.length - 1].id;
                
                const topGarmentRef = updatedGarments[updatedGarments.length - 1];
                const topGarmentInfo = state.wardrobe.find(w => w.id === topGarmentRef.garmentId);
                const heightInInches = p.modelInfo.height ? parseHeight(p.modelInfo.height) : null;
                const recommendedSize = (heightInInches && topGarmentInfo) ? getRecommendedSize(heightInInches, topGarmentInfo) : undefined;

                return {
                    ...p,
                    garments: updatedGarments,
                    variations: updatedVariations,
                    recommendedSize,
                };
            }
            return p;
        });
        return {
            ...state,
            products: newProducts,
            activeVariationId: newActiveVariationId,
        };
    }
    case 'UPDATE_PRODUCT_METADATA': {
      const { productId, notes } = action.payload;
      const newProducts = state.products.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            metadata: { ...p.metadata, notes, lastModified: new Date() }
          };
        }
        return p;
      });
      return { ...state, products: newProducts };
    }
    case 'SAVE_LOOK_SUCCESS': {
        const { productId, name } = action.payload;
        const newProducts = state.products.map(p => {
            if (p.id === productId) {
                return { ...p, isSavedLook: true, lookName: name };
            }
            return p;
        });
        return { ...state, products: newProducts };
    }
    case 'APPLY_TEMPLATE_SUCCESS': {
        const { productId, newTemplateId, newVariation } = action.payload;
        const newProducts = state.products.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    shootTemplateId: newTemplateId,
                    variations: [...p.variations, newVariation] // Add new variation instead of replacing
                };
            }
            return p;
        });
        return {
            ...state,
            products: newProducts,
            activeVariationId: newVariation.id,
        };
    }
    case 'SET_ACTIVE_VARIATION':
      return { ...state, prevActiveVariationId: state.activeVariationId, activeVariationId: action.payload.variationId };
    case 'CREATE_VARIATION_START':
      return {
        ...state,
        products: state.products.map(p => {
            if (p.id === state.activeProductId) {
                const newVariation: Variation = {
                    id: `temp-${Date.now()}`,
                    poseInstruction: action.payload.poseInstruction,
                    imageUrl: 'placeholder',
                    backgroundDescription: '',
                    lightingStyle: '',
                    metadata: {
                        generatedAt: new Date(),
                        fabricRealismApplied: false,
                        humanizeModelApplied: false,
                        tags: [],
                        quality: 'standard',
                    }
                };
                return {
                    ...p,
                    variations: [...p.variations, newVariation]
                };
            }
            return p;
        })
      };
    case 'CREATE_VARIATION_SUCCESS': {
        const newVariation = action.payload.variation;
        return {
            ...state,
            products: state.products.map(p => {
                if (p.id === state.activeProductId) {
                    // Filter out any temporary placeholder variations that might exist
                    const finalVariations = p.variations.filter(v => v.imageUrl !== 'placeholder');
                    return {
                        ...p,
                        variations: [...finalVariations, newVariation],
                    };
                }
                return p;
            }),
            activeVariationId: newVariation.id,
        };
    }
    case 'CREATE_VARIATION_FAILURE':
        // No state change needed, error is handled separately
        return state;
    case 'DELETE_LAST_VARIATION': {
        let newActiveVariationId = state.activeVariationId;
        const newProducts = state.products.map(p => {
            if (p.id === state.activeProductId && p.variations.length > 1) {
                const updatedVariations = p.variations.slice(0, -1);
                newActiveVariationId = updatedVariations.length > 0 ? updatedVariations[updatedVariations.length - 1].id : null;
                return { ...p, variations: updatedVariations };
            }
            return p;
        });
        return {
            ...state,
            products: newProducts,
            activeVariationId: newActiveVariationId,
            prevActiveVariationId: null, 
        };
    }
    case 'APPLY_BRUSH_EDIT_SUCCESS': {
        const { poseInstruction, imageUrl } = action.payload;
        const activeVar = state.products.find(p => p.id === state.activeProductId)?.variations.find(v => v.id === state.activeVariationId);
        if (!activeVar) return state;

        const newVariation: Variation = {
            id: `var-${Date.now()}`,
            poseInstruction,
            imageUrl,
            backgroundDescription: activeVar.backgroundDescription,
            lightingStyle: activeVar.lightingStyle,
            metadata: {
                generatedAt: new Date(),
                fabricRealismApplied: state.isFabricRealismActive,
                humanizeModelApplied: state.isHumanizeModelActive,
                tags: ['edited'],
                quality: 'standard'
            },
        };
        const newProducts = state.products.map(p => {
            if (p.id === state.activeProductId) {
                return {
                    ...p,
                    variations: [...p.variations, newVariation]
                };
            }
            return p;
        });
        return {
            ...state,
            products: newProducts,
            activeVariationId: newVariation.id,
            isBrushEditMode: false
        };
    }
    case 'TOGGLE_REALISM': {
        if (action.payload.type === 'fabric') {
            return { ...state, isFabricRealismActive: action.payload.willBeActive };
        }
        if (action.payload.type === 'humanize') {
            return { ...state, isHumanizeModelActive: action.payload.willBeActive };
        }
        return state;
    }
    case 'SET_REALISM_FROM_TEMPLATE': {
      return {
        ...state,
        isFabricRealismActive: action.payload.fabric,
        isHumanizeModelActive: action.payload.humanize,
      };
    }
    case 'UPDATE_VARIATION_IMAGE': {
      const { variationId, imageUrl, metadata } = action.payload;
      return {
        ...state,
        products: state.products.map(product => ({
          ...product,
          variations: product.variations.map(variation =>
            variation.id === variationId ? { ...variation, imageUrl, metadata: { ...variation.metadata, ...metadata } } : variation
          )
        }))
      };
    }
    case 'TOGGLE_SHEET':
      return { ...state, isSheetCollapsed: !state.isSheetCollapsed };
    case 'SET_ACTIVE_PANEL_TAB':
      return { ...state, activePanelTab: action.payload };
    case 'SAVE_GARMENT': {
        const newGarment = action.payload;
        const existingIndex = state.wardrobe.findIndex(item => item.id === newGarment.id);
        let newWardrobe;

        if (existingIndex > -1) {
            // Update existing item
            newWardrobe = [...state.wardrobe];
            newWardrobe[existingIndex] = newGarment;
        } else {
            // Add new item
            newWardrobe = [newGarment, ...state.wardrobe];
        }
        return { ...state, wardrobe: newWardrobe };
    }
    case 'EDIT_GARMENT':
        return { ...state, editingGarmentId: action.payload, isAddGarmentModalOpen: true };
    case 'SET_MODELS_FROM_STORAGE':
      return { ...state, savedModels: action.payload };
    case 'SAVE_NEW_MODEL':
      const newModels = [...state.savedModels, action.payload];
      localStorage.setItem('virtual-try-on-saved-models', JSON.stringify(newModels));
      return { ...state, savedModels: newModels, isSaveModelModalOpen: false };
    case 'LOAD_SAVED_MODEL': {
        const newDefaultCollection: Collection = {
            id: `col-${Date.now()}`,
            name: 'My First Collection',
            description: 'A new collection for this session.',
            createdAt: new Date(),
            metadata: { tags: [], archived: false, season: '', theme: '' }
        };
        return {
            ...initialState,
            savedModels: state.savedModels,
            wardrobe: state.wardrobe,
            modelInfo: action.payload,
            hasSkippedModelCreation: false,
            collections: [newDefaultCollection],
            activeCollectionId: newDefaultCollection.id,
            messages: [{ id: 'initial', role: 'assistant', parts: [{ type: 'text', content: "Hi! I'm your Style Assistant. You can now add clothes, change the pose of your model, or give you a whole new look. What should we do?" }, { type: 'suggestion_chips', suggestions: ['Add a layer', 'Change my pose'] }] }],
        };
    }
    case 'DELETE_SAVED_MODEL':
      const filteredModels = state.savedModels.filter(m => m.id !== action.payload);
      localStorage.setItem('virtual-try-on-saved-models', JSON.stringify(filteredModels));
      return { ...state, savedModels: filteredModels };
    case 'IMPORT_MODELS':
      const importedModelIds = new Set(state.savedModels.map(m => m.id));
      const uniqueNewModels = action.payload.filter(m => !importedModelIds.has(m.id));
      const allModels = [...state.savedModels, ...uniqueNewModels];
      localStorage.setItem('virtual-try-on-saved-models', JSON.stringify(allModels));
      return { ...state, savedModels: allModels };
    case 'CHAT_SEND_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'CHAT_RECEIVE_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'CHAT_LOADING_START':
      return { ...state, isAssistantLoading: true };
    case 'CHAT_LOADING_FINISH':
      return { ...state, isAssistantLoading: false };
    case 'SET_LAST_REFERENCE_IMAGE':
      return { ...state, lastReferenceImage: action.payload };
    case 'TOGGLE_MODAL':
      switch (action.payload.modal) {
        case 'addGarment':
          return { ...state, isAddGarmentModalOpen: action.payload.isOpen, editingGarmentId: action.payload.isOpen ? state.editingGarmentId : null };
        case 'newProduct':
          return { ...state, isNewProductModalOpen: action.payload.isOpen };
        case 'addLayer':
          return { ...state, isAddLayerModalOpen: action.payload.isOpen };
        case 'changeTemplate':
          return { ...state, isChangeTemplateModalOpen: action.payload.isOpen };
        case 'share':
          return { ...state, isShareModalOpen: action.payload.isOpen };
        case 'saveModel':
          return { ...state, isSaveModelModalOpen: action.payload.isOpen };
        case 'brushEdit':
          return { ...state, isBrushEditMode: action.payload.isOpen };
        case 'chat':
          return { ...state, isChatOpen: action.payload.isOpen };
        case 'sizeGuide':
          return { ...state, isSizeGuideModalOpen: action.payload.isOpen, sizeGuideItem: action.payload.item ?? null };
        case 'poseLibrary':
          return { ...state, isPoseLibraryOpen: action.payload.isOpen };
        case 'detailSpotlight':
            return { ...state, isDetailSpotlightModalOpen: action.payload.isOpen, detailSpotlightItem: action.payload.item ?? null };
        case 'libraryDrawer':
            return { ...state, isLibraryDrawerOpen: action.payload.isOpen };
        case 'selectCampaignModel':
            return { ...state, isSelectCampaignModelOpen: action.payload.isOpen, activeCampaignModelSlot: action.payload.slotId ?? null };
        case 'assignWardrobe':
            return { ...state, isAssignWardrobeOpen: action.payload.isOpen, activeCampaignModelSlot: action.payload.slotId ?? null };
        default:
          return state;
      }
    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        isAddGarmentModalOpen: false,
        isNewProductModalOpen: false,
        isAddLayerModalOpen: false,
        isChangeTemplateModalOpen: false,
        isShareModalOpen: false,
        isSaveModelModalOpen: false,
        isSizeGuideModalOpen: false,
        isPoseLibraryOpen: false,
        isDetailSpotlightModalOpen: false,
        isLibraryDrawerOpen: false,
        isBrushEditMode: false,
        isChatOpen: false,
        isSelectCampaignModelOpen: false,
        isAssignWardrobeOpen: false,
        editingGarmentId: null, // Ensure we clear editing state
      };
    case 'BATCH_GENERATE_START':
        return {
            ...state,
            isBatchGenerating: true,
            isLoading: true,
            loadingMessage: '',
            batchProgress: { current: 0, total: action.payload.total, message: action.payload.message },
        };
    case 'BATCH_GENERATE_PROGRESS':
        return {
            ...state,
            batchProgress: { ...state.batchProgress, current: action.payload.current, message: action.payload.message },
        };
    case 'CREATE_PRODUCT_WITH_BATCH_SUCCESS':
        return {
            ...state,
            products: [...state.products, action.payload.product],
        };
    case 'BATCH_GENERATE_FINISH':
        return {
            ...state,
            isBatchGenerating: false,
            isLoading: false,
            activeProductId: state.products.length > 0 ? state.products[state.products.length - 1].id : null,
            activeVariationId: state.products.length > 0 ? state.products[state.products.length - 1].variations[0].id : null,
            isNewProductModalOpen: false,
        };
    case 'START_AI_GARMENT_GENERATION':
        return {
            ...state,
            aiGarmentDescription: action.payload,
            isNewProductModalOpen: true,
            activePanelTab: 'wardrobe',
        };
    case 'CLEAR_AI_GARMENT_GENERATION':
        return { ...state, aiGarmentDescription: null };
    case 'TOGGLE_TTS':
        return { ...state, isTtsEnabled: !state.isTtsEnabled };
    case 'TOGGLE_LOOKBOOK':
        return { ...state, isLookbookVisible: !state.isLookbookVisible, activeProductId: null, activeCollectionId: null };
    // --- Plan Execution Reducers ---
    case 'PLAN_RECEIVED':
        return { ...state, planExecution: { ...initialPlanState, plan: action.payload, status: 'awaiting_approval' }};
    case 'PLAN_APPROVED':
        return { ...state, planExecution: { ...state.planExecution, status: 'executing', currentStepIndex: 0 }};
    case 'PLAN_CANCELLED':
        return { ...state, planExecution: initialPlanState };
    case 'PLAN_STEP_EXECUTION_START':
        return { ...state, planExecution: { ...state.planExecution, status: 'executing', currentStepIndex: action.payload.stepIndex }};
    case 'PLAN_STEP_VERIFICATION_SUCCESS':
        const nextStep = state.planExecution.currentStepIndex + 1;
        const isPlanFinished = nextStep >= (state.planExecution.plan?.steps.length ?? 0);
        return {
            ...state,
            planExecution: {
                ...state.planExecution,
                currentStepIndex: isPlanFinished ? state.planExecution.currentStepIndex : nextStep,
                status: isPlanFinished ? 'complete' : 'executing',
            }
        };
    case 'PLAN_EXECUTION_PAUSED': {
        const textPart1 = `Hmm, step ${state.planExecution.currentStepIndex + 1} didn't look quite right. I've paused the plan. You can ask me to `;
        const suggestion = `Try the step again`;
        const textPart2 = ` or give me feedback, like "make the pose more dynamic".`;
        const assistantMessage: ChatMessage = {
            id: `msg-plan-paused-${Date.now()}`,
            role: 'assistant',
            parts: [
                { type: 'text', content: textPart1 },
                { type: 'suggestion_chips', suggestions: [suggestion] },
                { type: 'text', content: textPart2 },
            ]
        };
        return { 
            ...state, 
            planExecution: { ...state.planExecution, status: 'paused', error: action.payload.reason },
            messages: [...state.messages, assistantMessage],
        };
    }
    case 'PLAN_EXECUTION_COMPLETE':
        return { ...state, planExecution: { ...state.planExecution, status: 'complete' }};
    case 'PLAN_EXECUTION_FAILED':
        return { ...state, planExecution: { ...initialPlanState, status: 'failed', error: action.payload.error }};
    // --- Pose Previews ---
    case 'POSE_PREVIEW_START':
      return {
        ...state,
        posePreviews: {
          ...state.posePreviews,
          [action.payload.poseId]: { status: 'loading' }
        }
      };
    case 'POSE_PREVIEW_SUCCESS':
      return {
        ...state,
        posePreviews: {
          ...state.posePreviews,
          [action.payload.poseId]: { status: 'success', imageUrl: action.payload.imageUrl }
        }
      };
    case 'POSE_PREVIEW_FAILURE':
      return {
        ...state,
        posePreviews: {
          ...state.posePreviews,
          [action.payload.poseId]: { status: 'error' }
        }
      };
    case 'REVERT_POSE_PREVIEW': {
      const newPreviews = { ...state.posePreviews };
      delete newPreviews[action.payload.poseId];
      return { ...state, posePreviews: newPreviews };
    }
    case 'CLEAR_ALL_POSE_PREVIEWS':
      return { ...state, posePreviews: {} };
    // --- Product Studio ---
    case 'SET_STUDIO_MODE':
      if (action.payload === 'campaignStudio' && state.campaignModels.length === 0) {
        const activeProduct = state.products.find(p => p.id === state.activeProductId);
        const savedModel = state.savedModels.find(m => m.imageUrl === state.modelInfo?.imageUrl);
        const initialModel: CampaignModel = {
            slotId: 'model1',
            modelId: savedModel?.id ?? null,
            outfit: activeProduct ? activeProduct.garments : [],
            poseInstruction: 'Walking down a path, looking thoughtfully to the side.',
        };
        return { ...state, activeStudioMode: action.payload, campaignModels: [initialModel], campaignImageHistory: [], activeCampaignImageIndex: -1 };
      }
      return { ...state, activeStudioMode: action.payload };
    case 'SET_ACTIVE_FLAT_LAY_GARMENT':
        // When selecting a new garment to edit, reset the canvas preview.
        return { ...state, activeFlatLayGarmentId: action.payload, activeFlatLayImagePreview: null };
    case 'GENERATE_FLAT_LAY_SUCCESS':
      return {
        ...state,
        flatLayLibrary: [action.payload, ...state.flatLayLibrary],
        activeFlatLayImagePreview: action.payload.imageUrl,
      };
    case 'SET_FLAT_LAY_PREVIEW':
      return { ...state, activeFlatLayImagePreview: action.payload };
    case 'ADD_DETAIL_SHOT': {
        const { garmentId, shot } = action.payload;
        const existingShots = state.detailShotLibrary[garmentId] || [];
        return {
            ...state,
            detailShotLibrary: {
                ...state.detailShotLibrary,
                [garmentId]: [shot, ...existingShots],
            },
        };
    }
    // New Actions for UX flow
    case 'ENTER_STUDIO_MODE_DIRECTLY': {
        const defaultCollection: Collection = state.collections.find(c => c.name === 'My First Collection') || { 
            id: `col-${Date.now()}`,
            name: 'My First Collection',
            description: 'My first collection of AI-generated product mockups.',
            createdAt: new Date(),
            metadata: { tags: [], archived: false, season: '', theme: '' }
        };
        const collections = state.collections.length > 0 ? state.collections : [defaultCollection];

        return {
            ...state,
            hasSkippedModelCreation: true,
            activeStudioMode: 'productStudio',
            collections,
            activeCollectionId: collections[0].id,
        };
    }
    case 'RESET_TO_MODEL_CREATION':
        return {
            ...state,
            hasSkippedModelCreation: false,
            modelInfo: null,
        }
    case 'UPDATE_CAMPAIGN_BRIEF':
        return {
            ...state,
            campaignBrief: { ...state.campaignBrief, ...action.payload }
        };
    case 'ADD_CAMPAIGN_MODEL_SLOT':
        if (state.campaignModels.length >= 2) return state;
        const newSlot: CampaignModel = {
            slotId: 'model2',
            modelId: null,
            outfit: [],
            poseInstruction: 'Interacting with Model 1.',
        };
        return { ...state, campaignModels: [...state.campaignModels, newSlot] };
    case 'REMOVE_CAMPAIGN_MODEL_SLOT':
        return { ...state, campaignModels: state.campaignModels.filter(m => m.slotId !== action.payload.slotId) };
    case 'UPDATE_CAMPAIGN_MODEL_POSE': {
        const { slotId, pose } = action.payload;
        return {
            ...state,
            campaignModels: state.campaignModels.map(m =>
                m.slotId === slotId ? { ...m, poseInstruction: pose } : m
            )
        };
    }
    case 'UPDATE_CAMPAIGN_MODEL_POSES': {
        const { model1Pose, model2Pose } = action.payload;
        return {
            ...state,
            campaignModels: state.campaignModels.map(m => {
                if (m.slotId === 'model1') return { ...m, poseInstruction: model1Pose };
                if (m.slotId === 'model2') return { ...m, poseInstruction: model2Pose };
                return m;
            })
        };
    }
    case 'ASSIGN_MODEL_TO_CAMPAIGN_SLOT': {
        const { slotId, modelId } = action.payload;
        return {
            ...state,
            campaignModels: state.campaignModels.map(m =>
                m.slotId === slotId ? { ...m, modelId } : m
            ),
            isSelectCampaignModelOpen: false,
        };
    }
    case 'ASSIGN_OUTFIT_TO_CAMPAIGN_SLOT': {
        const { slotId, outfit } = action.payload;
        return {
            ...state,
            campaignModels: state.campaignModels.map(m =>
                m.slotId === slotId ? { ...m, outfit } : m
            ),
            isAssignWardrobeOpen: false,
        };
    }
    case 'CAMPAIGN_GENERATION_START':
        return {
            ...state,
            isLoading: true,
            loadingMessage: 'Generating Campaign Scene...',
            loadingSubMessage: state.campaignBrief.objective,
        };
    case 'CAMPAIGN_GENERATION_SUCCESS':
        const newHistory = [...state.campaignImageHistory, action.payload];
        return {
            ...state,
            isLoading: false,
            campaignImageHistory: newHistory,
            activeCampaignImageIndex: newHistory.length - 1,
        };
    case 'CAMPAIGN_GENERATION_FAILURE':
        return {
            ...state,
            isLoading: false,
            error: { message: action.payload },
        };
    case 'SET_ACTIVE_CAMPAIGN_IMAGE_INDEX':
        return {
            ...state,
            activeCampaignImageIndex: action.payload
        };
    default:
      return state;
  }
}