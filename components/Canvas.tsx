/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { RotateCcwIcon, ShareIcon, BookmarkIcon, PencilIcon, ImageIcon, PersonStandingIcon, SunIcon, SparklesIcon, ShirtIcon, ChevronLeftIcon, ChevronRightIcon, ClapperboardIcon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  onShareClick: () => void;
  onSaveModelClick: () => void;
  onToggleBrushEditMode: () => void;
  isLoading: boolean;
  loadingMessage: string;
  loadingSubMessage?: string;
  onCancelOperation: () => void;
  isMobile: boolean;
  isBatchGenerating: boolean;
  batchProgress: { current: number; total: number; message: string };
  mode?: 'fittingRoom' | 'productStudio' | 'assistant' | 'campaignStudio';
  hasNext?: boolean;
  hasPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  displayImageUrl, 
  onStartOver, 
  onShareClick, 
  onSaveModelClick, 
  onToggleBrushEditMode, 
  isLoading, 
  loadingMessage, 
  loadingSubMessage, 
  onCancelOperation, 
  isMobile, 
  isBatchGenerating, 
  batchProgress,
  mode = 'fittingRoom',
  hasNext = false,
  hasPrevious = false,
  onNext = () => {},
  onPrevious = () => {},
}) => {
  const getLoadingIcon = () => {
    const msg = loadingMessage.toLowerCase();
    if (msg.includes('pose')) {
        return <PersonStandingIcon className="w-12 h-12 text-accent animate-pulse" />;
    }
    if (msg.includes('background') || msg.includes('flat lay')) {
        return <ImageIcon className="w-12 h-12 text-accent animate-pulse" />;
    }
     if (msg.includes('campaign')) {
        return <ClapperboardIcon className="w-12 h-12 text-accent animate-pulse" />;
    }
    if (msg.includes('lighting')) {
        return <SunIcon className="w-12 h-12 text-accent animate-pulse" />;
    }
    if (msg.includes('edit') || msg.includes('realism')) {
        return <SparklesIcon className="w-12 h-12 text-accent animate-pulse" />;
    }
    if (msg.includes('layer') || msg.includes('styling') || msg.includes('adding')) {
        return <ShirtIcon className="w-12 h-12 text-accent animate-pulse" />;
    }
    return <Spinner />; // Default
  };
  
  return (
    <div className={`w-full h-full flex items-center justify-center relative animate-zoom-in group ${isMobile ? 'px-4 pt-8 pb-36' : 'p-4'}`}>
      {/* Action Buttons */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex flex-wrap justify-between items-start gap-2" style={{paddingTop: 'calc(1rem + env(safe-area-inset-top, 0))'}}>
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'fittingRoom' && (
            <>
              <button 
                  onClick={onStartOver}
                  className="flex items-center justify-center text-center bg-white/60 border border-borderLight text-textPrimary font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 active:scale-95 text-sm backdrop-blur-sm"
              >
                  <RotateCcwIcon className="w-4 h-4 mr-2" />
                  {isMobile ? 'Reset' : 'Start Over'}
              </button>
              <button 
                  onClick={onSaveModelClick}
                  className="flex items-center justify-center text-center bg-white/60 border border-borderLight text-textPrimary font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 active:scale-95 text-sm backdrop-blur-sm"
              >
                  <BookmarkIcon className="w-4 h-4 mr-2" />
                  {isMobile ? 'Save' : 'Save Model'}
              </button>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {(mode === 'fittingRoom' || (mode === 'productStudio' && displayImageUrl) || (mode === 'campaignStudio' && displayImageUrl)) && (
            <button 
                onClick={onToggleBrushEditMode}
                className="flex items-center justify-center text-center bg-white/60 border border-borderLight text-textPrimary font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 active:scale-95 text-sm backdrop-blur-sm"
            >
                <PencilIcon className="w-4 h-4 mr-2" />
                {isMobile ? 'Edit' : 'Edit with Brush'}
            </button>
          )}
          <button 
              onClick={onShareClick}
              className="flex items-center justify-center text-center bg-white/60 border border-borderLight text-textPrimary font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 active:scale-95 text-sm backdrop-blur-sm"
          >
              <ShareIcon className="w-4 h-4 mr-2" />
              {isMobile ? 'Share' : 'Share & Export'}
          </button>
        </div>
      </div>


      {/* Image Display or Placeholder */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {displayImageUrl ? (
            <motion.img
              layout
              key={displayImageUrl}
              src={displayImageUrl}
              alt="Virtual try-on model"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="w-[400px] h-[600px] bg-gray-100 border border-borderLight rounded-lg flex flex-col items-center justify-center p-4 text-center"
            >
              {mode === 'productStudio' ? (
                <>
                  <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-md font-serif text-textSecondary">Select a garment to start creating</p>
                </>
              ) : (
                <>
                  <Spinner />
                  <p className="text-md font-serif text-textSecondary mt-4">Loading Model...</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Navigation Arrows --- */}
        {(mode === 'fittingRoom' || mode === 'productStudio' || mode === 'campaignStudio') && (
            <>
                <AnimatePresence>
                    {hasPrevious && (
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onClick={onPrevious}
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/60 p-2 rounded-full backdrop-blur-sm shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Previous image"
                        >
                            <ChevronLeftIcon className="w-6 h-6 text-textPrimary" />
                        </motion.button>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {hasNext && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onClick={onNext}
                            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/60 p-2 rounded-full backdrop-blur-sm shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Next image"
                        >
                            <ChevronRightIcon className="w-6 h-6 text-textPrimary" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              >
                {isBatchGenerating ? (
                    <div className="w-full max-w-sm text-center">
                        <Spinner />
                        <p className="text-lg font-serif text-textPrimary mt-4">{batchProgress.message}</p>
                        <p className="text-sm text-textSecondary mt-1">({batchProgress.current} / {batchProgress.total})</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
                          <div className="bg-accent h-2 rounded-full transition-all duration-500" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}></div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                        {getLoadingIcon()}
                        {loadingMessage && (
                            <p className="text-lg font-serif text-textPrimary mt-4">{loadingMessage}</p>
                        )}
                        {loadingSubMessage && (
                            <p className="text-sm text-textSecondary mt-1 max-w-xs truncate">{loadingSubMessage}</p>
                        )}
                    </div>
                )}
                  <button onClick={onCancelOperation} className="mt-6 px-5 py-2 bg-white border border-borderLight rounded-full text-sm font-semibold hover:bg-gray-100 active:scale-95">
                      Cancel
                  </button>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Canvas;