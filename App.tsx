/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Import `useCallback` from React.
import React, { useReducer, useMemo, useEffect, lazy, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import { ChevronLeftIcon, HangerIcon, MessageCircleIcon, XIcon, Undo2Icon, SparklesIcon, LayoutTemplateIcon, ClapperboardIcon } from './components/icons';
import ModelInfoOverlay from './components/ModelInfoOverlay';
import LoadingScreen from './components/LoadingScreen';
import CollectionPanel from './components/CollectionPanel';
import ProductGrid from './components/ProductGrid';
import Accordion from './components/Accordion';
import CurrentProductPanel from './components/CurrentProductPanel';
import PosePanel from './components/PosePanel';
import FinalDetailsPanel from './components/FinalDetailsPanel';
import StyleAssistantPanel from './components/StyleAssistantPanel';
import ProductStudioPanel from './components/ProductStudioPanel';
import CampaignStudioPanel from './components/CampaignStudioPanel';


import { appReducer, initialState } from './state/appReducer';
// FIX: Correct import path for useAppLogic. The user had a duplicate file with `src/` prefix which I am ignoring.
import { useAppLogic } from './hooks/useAppLogic';

const AddGarmentModal = lazy(() => import('./components/AddGarmentModal'));
const NewProductModal = lazy(() => import('./components/NewProductModal'));
const ChangeTemplateModal = lazy(() => import('./components/ChangeTemplateModal'));
const ShareExportModal = lazy(() => import('./components/ShareExportModal'));
const SaveModelModal = lazy(() => import('./components/SaveModelModal'));
const BrushEditor = lazy(() => import('./components/BrushEditor'));
const SizeGuideModal = lazy(() => import('./components/SizeGuideModal'));
const PoseLibraryModal = lazy(() => import('./components/PoseLibraryModal'));
const DetailSpotlightModal = lazy(() => import('./components/DetailSpotlightModal'));
const LibraryDrawer = lazy(() => import('./components/LibraryDrawer'));
const SelectCampaignModelModal = lazy(() => import('./components/SelectCampaignModelModal'));
const AssignWardrobeModal = lazy(() => import('./components/AssignWardrobeModal'));


const SAVED_MODELS_STORAGE_KEY = 'virtual-try-on-saved-models';

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', listener);
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};


// --- App Component ---

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const logic = useAppLogic({ state, dispatch });

  const activeProduct = useMemo(() => state.products.find(p => p.id === state.activeProductId), [state.products, state.activeProductId]);
  const activeVariation = useMemo(() => activeProduct?.variations.find(v => v.id === state.activeVariationId), [activeProduct, state.activeVariationId]);
  const activeTemplate = useMemo(() => state.shootTemplates.find(t => t.id === activeProduct?.shootTemplateId), [state.shootTemplates, activeProduct]);
  const activeCollection = useMemo(() => state.collections.find(c => c.id === state.activeCollectionId), [state.collections, state.activeCollectionId]);
  const productsInActiveCollection = useMemo(() => state.products.filter(p => p.collectionId === state.activeCollectionId), [state.products, state.activeCollectionId]);
  const lookbookProducts = useMemo(() => state.products.filter(p => p.isSavedLook), [state.products]);
  const activeFlatLayGarment = useMemo(() => state.wardrobe.find(g => g.id === state.activeFlatLayGarmentId), [state.wardrobe, state.activeFlatLayGarmentId]);
  const garmentToEdit = useMemo(() => state.wardrobe.find(g => g.id === state.editingGarmentId), [state.wardrobe, state.editingGarmentId]);


  // Load saved models from local storage on initial render
  useEffect(() => {
    try {
        const saved = localStorage.getItem(SAVED_MODELS_STORAGE_KEY);
        if (saved) {
            dispatch({ type: 'SET_MODELS_FROM_STORAGE', payload: JSON.parse(saved) });
        }
    } catch (e) {
        console.error("Failed to load saved models from localStorage", e);
    }
  }, []);

  const handleStudioModeChange = (mode: 'fittingRoom' | 'productStudio' | 'assistant' | 'campaignStudio') => {
    if ((mode === 'fittingRoom' || mode === 'assistant' || mode === 'campaignStudio') && !state.modelInfo) {
        if (confirm("This feature requires a model. Would you like to create one now?")) {
            dispatch({ type: 'RESET_TO_MODEL_CREATION' });
        }
        return;
    }
    // Bug fix: Ensure all modals are closed when switching contexts.
    dispatch({ type: 'CLOSE_ALL_MODALS' });
    dispatch({ type: 'SET_STUDIO_MODE', payload: mode });
  };
  
  const variationNavProps = useMemo(() => {
    if (state.activeStudioMode !== 'fittingRoom' || !activeProduct || !activeVariation || activeProduct.variations.length <= 1) {
      return { hasNext: false, hasPrevious: false, onNext: () => {}, onPrevious: () => {} };
    }

    const currentIndex = activeProduct.variations.findIndex(v => v.id === activeVariation.id);
    const hasNext = currentIndex < activeProduct.variations.length - 1;
    const hasPrevious = currentIndex > 0;

    const handleNext = () => {
      if (hasNext) {
        dispatch({ type: 'SET_ACTIVE_VARIATION', payload: { variationId: activeProduct.variations[currentIndex + 1].id } });
      }
    };
    const handlePrevious = () => {
      if (hasPrevious) {
        dispatch({ type: 'SET_ACTIVE_VARIATION', payload: { variationId: activeProduct.variations[currentIndex - 1].id } });
      }
    };

    return { hasNext, hasPrevious, onNext: handleNext, onPrevious: handlePrevious };
  }, [activeProduct, activeVariation, state.activeStudioMode, dispatch]);

  const productStudioNavProps = useMemo(() => {
    if (state.activeStudioMode !== 'productStudio' || !activeFlatLayGarment) {
      return { hasNext: false, hasPrevious: false, onNext: () => {}, onPrevious: () => {} };
    }
    // FIX: Access views from the first variant of the garment.
    const originalViews = Object.values(activeFlatLayGarment.variants[0]?.views || {}).filter(Boolean) as string[];
    const flatLays = state.flatLayLibrary.filter(fl => fl.garmentId === activeFlatLayGarment.id).map(fl => fl.imageUrl);
    const detailShots = state.detailShotLibrary[activeFlatLayGarment.id]?.map(ds => ds.imageUrl) || [];
    
    const allImages = [...originalViews, ...flatLays, ...detailShots];
    // FIX: Access views from the first variant of the garment.
    const currentImage = state.activeFlatLayImagePreview ?? activeFlatLayGarment.variants[0]?.views.front;
    const currentIndex = allImages.findIndex(img => img === currentImage);

    if (currentIndex === -1 || allImages.length <= 1) {
      return { hasNext: false, hasPrevious: false, onNext: () => {}, onPrevious: () => {} };
    }

    const hasNext = currentIndex < allImages.length - 1;
    const hasPrevious = currentIndex > 0;

    const handleNext = () => {
      if (hasNext) {
        dispatch({ type: 'SET_FLAT_LAY_PREVIEW', payload: allImages[currentIndex + 1] });
      }
    };
    const handlePrevious = () => {
      if (hasPrevious) {
        dispatch({ type: 'SET_FLAT_LAY_PREVIEW', payload: allImages[currentIndex - 1] });
      }
    };

    return { hasNext, hasPrevious, onNext: handleNext, onPrevious: handlePrevious };
  }, [activeFlatLayGarment, state.activeFlatLayImagePreview, state.flatLayLibrary, state.detailShotLibrary, state.activeStudioMode, dispatch]);

  const campaignNavProps = useMemo(() => {
    if (state.activeStudioMode !== 'campaignStudio' || state.campaignImageHistory.length <= 1) {
        return { hasNext: false, hasPrevious: false, onNext: () => {}, onPrevious: () => {} };
    }

    const currentIndex = state.activeCampaignImageIndex;
    const hasNext = currentIndex < state.campaignImageHistory.length - 1;
    const hasPrevious = currentIndex > 0;

    const handleNext = () => {
        if (hasNext) {
            dispatch({ type: 'SET_ACTIVE_CAMPAIGN_IMAGE_INDEX', payload: currentIndex + 1 });
        }
    };

    const handlePrevious = () => {
        if (hasPrevious) {
            dispatch({ type: 'SET_ACTIVE_CAMPAIGN_IMAGE_INDEX', payload: currentIndex - 1 });
        }
    };

    return { hasNext, hasPrevious, onNext: handleNext, onPrevious: handlePrevious };
  }, [state.activeStudioMode, state.campaignImageHistory, state.activeCampaignImageIndex, dispatch]);


  const getDisplayImageUrl = useCallback(() => {
    if (state.activeStudioMode === 'productStudio') {
      // FIX: Access views from the first variant of the garment.
      return state.activeFlatLayImagePreview ?? activeFlatLayGarment?.variants[0]?.views.front ?? null;
    }
    if (state.activeStudioMode === 'campaignStudio') {
        const activeImage = state.campaignImageHistory[state.activeCampaignImageIndex];
        return activeImage ?? state.modelInfo?.imageUrl ?? null;
    }
    return activeVariation?.imageUrl ?? null;
  }, [state.activeStudioMode, state.activeFlatLayImagePreview, activeFlatLayGarment, activeVariation, state.campaignImageHistory, state.activeCampaignImageIndex, state.modelInfo]);


  if (!state.modelInfo && !state.hasSkippedModelCreation) {
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 bg-background font-sans">
            <StartScreen
                onModelFinalized={logic.handleModelFinalized}
                savedModels={state.savedModels}
                onLoadSavedModel={(model) => dispatch({ type: 'LOAD_SAVED_MODEL', payload: model })}
                onDeleteSavedModel={(id) => dispatch({ type: 'DELETE_SAVED_MODEL', payload: id })}
                onImportModels={(models) => dispatch({ type: 'IMPORT_MODELS', payload: models })}
            />
            {state.isFinalizingModel && <LoadingScreen messages={['Analyzing physique...', 'Calibrating measurements...', 'Finalizing your digital double...']} />}
            {state.error && <p className="text-red-500 mt-4">{state.error.message}</p>}
        </div>
    );
  }
  
  const renderFittingRoomPanel = () => {
    if (state.isLookbookVisible) {
        return <ProductGrid
            products={lookbookProducts}
            collectionName="My Lookbook"
            onProductSelect={(id) => dispatch({ type: 'SET_ACTIVE_PRODUCT', payload: { productId: id } })}
            onBack={() => dispatch({ type: 'TOGGLE_LOOKBOOK' })}
            isLookbook
        />;
    }
    if (state.activeCollectionId === null) {
        return <CollectionPanel
            collections={state.collections}
            onCollectionSelect={(id) => dispatch({ type: 'SET_ACTIVE_COLLECTION', payload: { collectionId: id } })}
            onCollectionCreate={(name) => dispatch({ type: 'CREATE_COLLECTION', payload: { name } })}
            onLookbookClick={() => dispatch({ type: 'TOGGLE_LOOKBOOK' })}
        />;
    }
    if (state.activeProductId === null) {
        return <ProductGrid
            products={productsInActiveCollection}
            collectionName={activeCollection?.name ?? 'Collection'}
            onProductSelect={(id) => dispatch({ type: 'SET_ACTIVE_PRODUCT', payload: { productId: id } })}
            onBack={() => dispatch({ type: 'SET_ACTIVE_COLLECTION', payload: { collectionId: null } })}
            onNewProductClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'newProduct', isOpen: true } })}
        />;
    }

    return (
        <>
            {!isMobile && (
                <div className="flex items-center mb-4">
                    <button onClick={() => dispatch({ type: 'SET_ACTIVE_PRODUCT', payload: { productId: null } })} className="p-1.5 -ml-1.5 text-textSecondary hover:text-textPrimary rounded-full hover:bg-gray-100">
                        <ChevronLeftIcon className="w-5 h-5"/>
                    </button>
                    <h2 className="text-xl font-serif tracking-wider text-textPrimary ml-2">{activeProduct?.name}</h2>
                </div>
            )}
            <div>
                 <Accordion title="Outfit & Sizing" defaultOpen={true}>
                    <CurrentProductPanel
                        activeProduct={activeProduct}
                        activeTemplate={activeTemplate}
                        activeVariation={activeVariation}
                        // FIX: Pass the wardrobe state to CurrentProductPanel for resolving garment details.
                        wardrobe={state.wardrobe}
                        onUpdateNotes={(notes) => dispatch({ type: 'UPDATE_PRODUCT_METADATA', payload: { productId: activeProduct!.id, notes } })}
                        onChangeTemplateClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'changeTemplate', isOpen: true } })}
                        onAddLayerClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'newProduct', isOpen: true } })}
                        onRemoveLayerClick={logic.handleRemoveLayer}
                        onReorderLayers={logic.handleReorderLayers}
                        onSaveLook={logic.handleSaveLook}
                        isLoading={state.isLoading}
                        onChangeSize={logic.handleChangeSize}
                    />
                </Accordion>
                <Accordion 
                    title="Manage Pose" 
                    defaultOpen={true}
                    actions={
                        <button
                            onClick={() => dispatch({ type: 'DELETE_LAST_VARIATION' })}
                            disabled={state.isLoading || !(!!activeProduct && activeProduct.variations.length > 1)}
                            className="flex items-center gap-1.5 text-sm font-semibold text-textSecondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Undo last pose change"
                        >
                            <Undo2Icon className="w-4 h-4"/> Undo
                        </button>
                    }
                >
                    <PosePanel 
                        variations={activeProduct?.variations || []} 
                        activeVariationId={state.activeVariationId}
                        onVariationSelect={(id) => dispatch({ type: 'SET_ACTIVE_VARIATION', payload: { variationId: id } })}
                        onPoseGenerate={logic.handlePoseGenerate}
                        isLoading={state.isLoading}
                        onBrowseLibrary={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'poseLibrary', isOpen: true } })}
                        activeTemplate={activeTemplate}
                    />
                </Accordion>
                <Accordion 
                    title={
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5"/>
                            <span>Realism Engine</span>
                        </div>
                    }
                >
                    <FinalDetailsPanel
                        onToggleFabricRealism={() => logic.handleToggleRealism('fabric')}
                        isFabricRealismActive={state.isFabricRealismActive}
                        onToggleHumanizeModel={() => logic.handleToggleRealism('humanize')}
                        isHumanizeModelActive={state.isHumanizeModelActive}
                        isLoading={state.isLoading}
                        disabled={!activeProduct}
                    />
                </Accordion>
            </div>
        </>
    );
  };
  
  const renderMainPanel = () => {
    switch(state.activeStudioMode) {
      case 'fittingRoom':
        return renderFittingRoomPanel();
      case 'productStudio':
        return <ProductStudioPanel 
                  wardrobe={state.wardrobe}
                  activeGarment={activeFlatLayGarment}
                  onGarmentSelect={(id) => dispatch({ type: 'SET_ACTIVE_FLAT_LAY_GARMENT', payload: id })}
                  onUploadClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'addGarment', isOpen: true }})}
                  onEditClick={(id) => dispatch({ type: 'EDIT_GARMENT', payload: id })}
                  onGenerate={logic.handleGenerateFlatLay}
                  isLoading={state.isLoading}
                  onOpenDetailSpotlight={(item) => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'detailSpotlight', isOpen: true, item } })}
                  onOpenLibrary={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'libraryDrawer', isOpen: true }})}
               />;
      case 'campaignStudio':
        return <CampaignStudioPanel
                  brief={state.campaignBrief}
                  models={state.campaignModels}
                  savedModels={state.savedModels}
                  // FIX: Pass wardrobe to CampaignStudioPanel
                  wardrobe={state.wardrobe}
                  onBriefChange={(updates) => dispatch({ type: 'UPDATE_CAMPAIGN_BRIEF', payload: updates })}
                  onPoseChange={(slotId, pose) => dispatch({ type: 'UPDATE_CAMPAIGN_MODEL_POSE', payload: { slotId, pose } })}
                  onGenerate={logic.handleGenerateCampaignScene}
                  isLoading={state.isLoading}
                  onAddModel={() => dispatch({ type: 'ADD_CAMPAIGN_MODEL_SLOT' })}
                  onRemoveModel={(slotId) => dispatch({ type: 'REMOVE_CAMPAIGN_MODEL_SLOT', payload: { slotId }})}
                  onSelectModelClick={(slotId) => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'selectCampaignModel', isOpen: true, slotId } })}
                  onAssignWardrobeClick={(slotId) => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'assignWardrobe', isOpen: true, slotId } })}
                />;
      case 'assistant':
         return <StyleAssistantPanel
                  messages={state.messages}
                  onSendMessage={logic.handleSendMessage}
                  isAssistantLoading={state.isAssistantLoading}
                  isTtsEnabled={state.isTtsEnabled}
                  onToggleTts={() => dispatch({ type: 'TOGGLE_TTS' })}
                  disabled={!activeProduct}
                  planExecution={state.planExecution}
                  onPlanApprove={logic.handlePlanApproval}
                  onPlanCancel={logic.handlePlanCancellation}
              />;
      default:
        return null;
    }
  }
  
  return (
    <>
      <div className="w-full h-screen flex flex-col md:flex-row bg-background font-sans text-textPrimary overflow-hidden">
        {state.error && (
            <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{state.error.message}</span>
                {state.error.onRetry && (
                    <button onClick={state.error.onRetry} className="ml-4 font-bold underline">Retry</button>
                )}
                <button onClick={() => dispatch({ type: 'CLEAR_ERROR' })} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <XIcon className="w-4 h-4"/>
                </button>
            </div>
        )}
        <main className="flex-grow flex flex-col relative min-w-0">
          <Canvas
            displayImageUrl={getDisplayImageUrl()}
            onStartOver={logic.handleStartOver}
            onShareClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'share', isOpen: true } })}
            onSaveModelClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'saveModel', isOpen: true } })}
            onToggleBrushEditMode={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'brushEdit', isOpen: !state.isBrushEditMode } })}
            isLoading={state.isLoading}
            loadingMessage={state.loadingMessage}
            loadingSubMessage={state.loadingSubMessage}
            onCancelOperation={logic.handleCancelOperation}
            isMobile={isMobile}
            isBatchGenerating={state.isBatchGenerating}
            batchProgress={state.batchProgress}
            mode={state.activeStudioMode}
            {...(state.activeStudioMode === 'campaignStudio' ? campaignNavProps : state.activeStudioMode === 'productStudio' ? productStudioNavProps : variationNavProps)}
          />
          {state.activeStudioMode === 'fittingRoom' && state.modelInfo && (
            <ModelInfoOverlay
              height={state.modelInfo.height}
              recommendedSize={activeProduct?.recommendedSize}
              onUpdateHeight={(h) => dispatch({ type: 'UPDATE_HEIGHT', payload: h })}
            />
          )}
        </main>
        
        {/* --- Mobile Bottom Sheet --- */}
        {isMobile && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-borderLight shadow-2xl rounded-t-2xl z-20"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 && !state.isSheetCollapsed) {
                dispatch({ type: 'TOGGLE_SHEET' });
              } else if (info.offset.y < -100 && state.isSheetCollapsed) {
                dispatch({ type: 'TOGGLE_SHEET' });
              }
            }}
            animate={{ y: state.isSheetCollapsed ? 'calc(100% - 140px - env(safe-area-inset-bottom))' : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="absolute top-0 left-0 right-0 flex justify-center py-3" onClick={() => dispatch({ type: 'TOGGLE_SHEET' })}>
                <div className="w-8 h-1 bg-gray-300 rounded-full"/>
            </div>
            <div className="h-[75svh] flex flex-col">
              {/* Panel Content */}
               <div className="flex-shrink-0 grid grid-cols-4 items-center p-4 border-b border-borderLight mt-4">
                  <button 
                      onClick={() => handleStudioModeChange('fittingRoom')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-t-lg font-semibold transition-colors text-xs ${state.activeStudioMode === 'fittingRoom' ? 'text-accent border-b-2 border-accent' : 'text-textSecondary'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      <HangerIcon className="w-5 h-5 mb-1" />
                      Fitting Room
                  </button>
                   <button 
                      onClick={() => handleStudioModeChange('productStudio')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-t-lg font-semibold transition-colors text-xs ${state.activeStudioMode === 'productStudio' ? 'text-accent border-b-2 border-accent' : 'text-textSecondary'}`}
                  >
                      <LayoutTemplateIcon className="w-5 h-5 mb-1" />
                      Product Studio
                  </button>
                  <button 
                      onClick={() => handleStudioModeChange('campaignStudio')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-t-lg font-semibold transition-colors text-xs ${state.activeStudioMode === 'campaignStudio' ? 'text-accent border-b-2 border-accent' : 'text-textSecondary'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      <ClapperboardIcon className="w-5 h-5 mb-1" />
                      Campaign Studio
                  </button>
                  <button 
                      onClick={() => handleStudioModeChange('assistant')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-t-lg font-semibold transition-colors text-xs ${state.activeStudioMode === 'assistant' ? 'text-accent border-b-2 border-accent' : 'text-textSecondary'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      <MessageCircleIcon className="w-5 h-5 mb-1" />
                      Assistant
                  </button>
              </div>
              <div className="flex-grow p-4 overflow-y-auto">
                 <AnimatePresence mode="wait">
                      <motion.div
                          key={state.activeStudioMode}
                          initial={{ opacity: 0, x: 0 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 0 }}
                          transition={{ duration: 0.2 }}
                      >
                         <div className="space-y-6">
                            {renderMainPanel()}
                         </div>
                      </motion.div>
                  </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- Desktop Sidebar --- */}
        {!isMobile && (
          <aside className="w-96 flex-shrink-0 bg-white/50 border-l border-borderLight shadow-sm flex flex-col">
              <div className="flex-shrink-0 grid grid-cols-4 items-center p-2 border-b border-borderLight gap-1">
                  <button 
                      onClick={() => handleStudioModeChange('fittingRoom')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg font-semibold transition-colors text-xs gap-1 ${state.activeStudioMode === 'fittingRoom' ? 'text-accent bg-accent/10' : 'text-textSecondary hover:bg-gray-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      <HangerIcon className="w-5 h-5" />
                      Fitting Room
                  </button>
                  <button 
                      onClick={() => handleStudioModeChange('productStudio')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg font-semibold transition-colors text-xs gap-1 ${state.activeStudioMode === 'productStudio' ? 'text-accent bg-accent/10' : 'text-textSecondary hover:bg-gray-100'}`}
                  >
                      <LayoutTemplateIcon className="w-5 h-5" />
                      Product Studio
                  </button>
                  <button 
                      onClick={() => handleStudioModeChange('campaignStudio')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg font-semibold transition-colors text-xs gap-1 ${state.activeStudioMode === 'campaignStudio' ? 'text-accent bg-accent/10' : 'text-textSecondary hover:bg-gray-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      <ClapperboardIcon className="w-5 h-5" />
                      Campaign Studio
                  </button>
                  <button 
                      onClick={() => handleStudioModeChange('assistant')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg font-semibold transition-colors text-xs gap-1 ${state.activeStudioMode === 'assistant' ? 'text-accent bg-accent/10' : 'text-textSecondary hover:bg-gray-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      <MessageCircleIcon className="w-5 h-5" />
                      Style Assistant
                  </button>
              </div>
               <div className="flex-grow p-6 overflow-y-auto">
                   <AnimatePresence mode="wait">
                      <motion.div
                          key={state.activeStudioMode}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="h-full"
                      >
                         {renderMainPanel()}
                      </motion.div>
                  </AnimatePresence>
              </div>
          </aside>
        )}
      </div>

      <Suspense fallback={<div></div>}>
        <NewProductModal
            isOpen={state.isNewProductModalOpen}
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'newProduct', isOpen: false } })}
            onCreate={logic.handleCreateProduct}
            onCreateBatch={logic.handleCreateBatch}
            onAddLayer={activeProduct ? logic.handleAddLayer : undefined}
            wardrobe={state.wardrobe}
            templates={state.shootTemplates}
            isLoading={state.isLoading}
            onUploadClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'addGarment', isOpen: true } })}
            onEditClick={(id) => dispatch({ type: 'EDIT_GARMENT', payload: id })}
            onOpenSizeGuide={(item) => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'sizeGuide', isOpen: true, item } })}
            onOpenDetailSpotlight={(item) => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'detailSpotlight', isOpen: true, item } })}
            isAddGarmentModalOpen={state.isAddGarmentModalOpen}
            aiGarmentDescription={state.aiGarmentDescription}
            activeGarmentIds={activeProduct?.garments.map(g => g.garmentId)}
        />
        <AddGarmentModal 
            isOpen={state.isAddGarmentModalOpen} 
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'addGarment', isOpen: false } })}
            onSave={(item) => dispatch({ type: 'SAVE_GARMENT', payload: item })}
            garmentToEdit={garmentToEdit}
        />
        <ChangeTemplateModal
            isOpen={state.isChangeTemplateModalOpen}
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'changeTemplate', isOpen: false } })}
            onSelect={logic.handleChangeTemplate}
            templates={state.shootTemplates}
            currentTemplateId={activeProduct?.shootTemplateId || null}
        />
        <ShareExportModal
            isOpen={state.isShareModalOpen}
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'share', isOpen: false } })}
            onDownload={logic.handleDownload}
            previewImageUrl={getDisplayImageUrl()}
        />
        {state.modelInfo && (
            <SaveModelModal
                isOpen={state.isSaveModelModalOpen}
                onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'saveModel', isOpen: false } })}
                onSave={(name) => dispatch({ type: 'SAVE_NEW_MODEL', payload: { ...state.modelInfo!, id: `model-${Date.now()}`, name }})}
                previewImageUrl={state.modelInfo.imageUrl}
            />
        )}
        {getDisplayImageUrl() && state.isBrushEditMode && (
            <BrushEditor
                imageUrl={getDisplayImageUrl()!}
                onCancel={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'brushEdit', isOpen: false } })}
                onApply={logic.handleApplyBrushEdit}
            />
        )}
        <SizeGuideModal
            isOpen={state.isSizeGuideModalOpen}
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'sizeGuide', isOpen: false } })}
            item={state.sizeGuideItem}
            recommendedSize={activeProduct?.recommendedSize}
        />
        <PoseLibraryModal
            isOpen={state.isPoseLibraryOpen}
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'poseLibrary', isOpen: false } })}
            mode={(state.activeStudioMode === 'campaignStudio' && state.campaignModels.length === 2) ? 'two-model' : 'single'}
            onPoseSelect={(instruction, poseId) => {
              logic.handlePoseGenerate({ poseInstruction: instruction }, poseId);
              dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'poseLibrary', isOpen: false } });
            }}
            onTwoModelPoseSelect={(poses) => {
                logic.handleSelectTwoModelPose(poses);
                dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'poseLibrary', isOpen: false } });
            }}
            modelInfo={state.modelInfo}
            garments={activeProduct?.garments.map(pg => state.wardrobe.find(w => w.id === pg.garmentId)).filter(g => !!g) as any}
            isLoading={state.isLoading}
            posePreviews={state.posePreviews}
            onPreviewGenerate={logic.handlePosePreviewGenerate}
            onRevertPreview={logic.handleRevertPosePreview}
            onClearAllPreviews={logic.handleClearAllPosePreviews}
            onBulkPreviewGenerate={logic.handleBulkPosePreviewGenerate}
        />
        <DetailSpotlightModal
            isOpen={state.isDetailSpotlightModalOpen}
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'detailSpotlight', isOpen: false } })}
            garment={state.detailSpotlightItem}
            onGenerate={logic.handleGenerateDetailShot}
            existingShots={state.detailSpotlightItem ? state.detailShotLibrary[state.detailSpotlightItem.id] : []}
        />
        <LibraryDrawer
            isOpen={state.isLibraryDrawerOpen}
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'libraryDrawer', isOpen: false } })}
            library={state.flatLayLibrary}
            detailShotLibrary={state.detailShotLibrary}
            activeGarment={activeFlatLayGarment}
            onImageSelect={(imageUrl) => dispatch({ type: 'SET_FLAT_LAY_PREVIEW', payload: imageUrl })}
        />
        <SelectCampaignModelModal
            isOpen={state.isSelectCampaignModelOpen}
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'selectCampaignModel', isOpen: false } })}
            savedModels={state.savedModels}
            onSelect={(modelId) => {
                if (state.activeCampaignModelSlot) {
                    dispatch({ type: 'ASSIGN_MODEL_TO_CAMPAIGN_SLOT', payload: { slotId: state.activeCampaignModelSlot, modelId } });
                }
            }}
        />
        <AssignWardrobeModal
            isOpen={state.isAssignWardrobeOpen}
            onClose={() => dispatch({ type: 'TOGGLE_MODAL', payload: { modal: 'assignWardrobe', isOpen: false } })}
            wardrobe={state.wardrobe}
            onSave={(outfit) => {
                if (state.activeCampaignModelSlot) {
                    dispatch({ type: 'ASSIGN_OUTFIT_TO_CAMPAIGN_SLOT', payload: { slotId: state.activeCampaignModelSlot, outfit } });
                }
            }}
        />
      </Suspense>
    </>
  );
};

export default App;