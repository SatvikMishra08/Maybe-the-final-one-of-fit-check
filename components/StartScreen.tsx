/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUploadIcon, SparklesIcon, Trash2Icon, DownloadIcon, FileJsonIcon, ArrowRightIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage, refineModelRealism } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage, withRetry } from '../lib/utils';
import { SavedModel } from '../types';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string, height?: string) => void;
  savedModels: SavedModel[];
  onLoadSavedModel: (model: SavedModel) => void;
  onDeleteSavedModel: (modelId: string) => void;
  onImportModels: (models: SavedModel[]) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized, savedModels, onLoadSavedModel, onDeleteSavedModel, onImportModels }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heightInput, setHeightInput] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);


  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrl(dataUrl);
        setIsGenerating(true);
        setGeneratedModelUrl(null);
        setError(null);
        try {
            const result = await withRetry(() => generateModelImage(file));
            setGeneratedModelUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Failed to create model'));
            setUserImageUrl(null);
        } finally {
            setIsGenerating(false);
        }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRefine = async () => {
    if (!generatedModelUrl) return;
    setIsRefining(true);
    setError(null);
    try {
        const refinedUrl = await withRetry(() => refineModelRealism(generatedModelUrl));
        setGeneratedModelUrl(refinedUrl);
        // Automatically proceed after refining
        onModelFinalized(refinedUrl, heightInput);
    } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Failed to refine model details.'));
    } finally {
        setIsRefining(false);
    }
  };

  const handleExportModels = () => {
    if (savedModels.length === 0) return;
    const jsonString = JSON.stringify(savedModels, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'virtual-try-on-models.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const models = JSON.parse(event.target?.result as string);
            // Basic validation
            if (Array.isArray(models) && models.every(m => m.id && m.name && m.imageUrl)) {
                onImportModels(models);
            } else {
                setError("Invalid or corrupted models file.");
            }
        } catch (err) {
            setError("Failed to read the models file. Please ensure it is a valid JSON file.");
        }
    };
    reader.readAsText(file);
    if(importInputRef.current) importInputRef.current.value = ""; // Reset file input
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setIsRefining(false);
    setError(null);
    setHeightInput('');
  };

  const screenVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  const mainContent = (
      <div className="w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-center gap-8 lg:gap-12">
        <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="max-w-lg">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-textPrimary leading-tight">
              Create Your Model for Any Look.
            </h1>
            <p className="mt-4 text-lg text-textSecondary max-w-md">
              Ever wondered how an outfit would look on you? Stop guessing. Upload a photo and see for yourself. Our AI creates your personal model, ready to try on anything.
            </p>
            <div className="flex flex-col items-center lg:items-start w-full gap-3 mt-8">
              <label htmlFor="image-upload-start" className="w-full relative flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-accent rounded-md cursor-pointer group hover:bg-accentHover">
                <CloudUploadIcon className="w-5 h-5 mr-3" />
                Create a New Model
              </label>
              <input id="image-upload-start" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} />
              
              <p className="text-textSecondary text-xs mt-1">By uploading, you agree not to create harmful, explicit, or unlawful content. This service is for creative and responsible use only.</p>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
          <Compare
            firstImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg"
            secondImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png"
            slideMode="drag"
            className="w-full max-w-sm aspect-[2/3] rounded-2xl bg-gray-200"
          />
        </div>
      </div>
  );

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!userImageUrl ? (
          <motion.div
            key="uploader"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {mainContent}
            {savedModels.length > 0 && (
              <div className="w-full max-w-7xl mx-auto mt-16">
                <hr className="border-borderLight" />
                <div className="mt-12 mb-6 text-center flex flex-col items-center">
                    <h2 className="text-2xl font-serif text-textPrimary">Your Saved Models</h2>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <input type="file" ref={importInputRef} onChange={handleImportChange} accept=".json" className="hidden"/>
                        <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-1.5 text-sm font-semibold text-textSecondary hover:text-accent p-2 rounded-md hover:bg-accent/10">
                            <FileJsonIcon className="w-4 h-4"/> Import
                        </button>
                        <button onClick={handleExportModels} disabled={savedModels.length === 0} className="flex items-center gap-1.5 text-sm font-semibold text-textSecondary hover:text-accent p-2 rounded-md hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed">
                            <DownloadIcon className="w-4 h-4"/> Export
                        </button>
                    </div>
                </div>
                <div className="px-4">
                  <div className="flex gap-4 pb-4 overflow-x-auto">
                      {savedModels.map(model => (
                          <div key={model.id} className="relative flex-shrink-0 w-40 group">
                              <button onClick={() => onLoadSavedModel(model)} className="w-full aspect-[2/3] rounded-lg overflow-hidden border border-borderLight hover:border-accent">
                                  <img src={model.imageUrl} alt={model.name} className="w-full h-full object-cover"/>
                              </button>
                              <p className="text-center text-sm font-semibold mt-2 truncate">{model.name}</p>
                              <button 
                                  onClick={() => onDeleteSavedModel(model.id)}
                                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                  aria-label={`Delete ${model.name}`}
                              >
                                  <Trash2Icon className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="compare"
            className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-textPrimary leading-tight">
                  The New You
                </h1>
                <p className="mt-2 text-md text-textSecondary">
                  Drag the slider to see your transformation.
                </p>
              </div>
              
              {(isGenerating || isRefining) && (
                <div className="flex items-center gap-3 text-lg text-textPrimary font-serif mt-6">
                  <Spinner />
                  <span>{isRefining ? 'Adding final details...' : 'Generating your model...'}</span>
                </div>
              )}

              {error && 
                <div className="text-center md:text-left text-red-600 max-w-md mt-6">
                  <p className="font-semibold">Generation Failed</p>
                  <p className="text-sm mb-4">{error}</p>
                  <button onClick={reset} className="text-sm font-semibold text-textSecondary hover:underline">Try Again</button>
                </div>
              }
              
              <AnimatePresence>
                {generatedModelUrl && !isGenerating && !error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.5 }}
                    className="mt-8 w-full max-w-sm space-y-4"
                  >
                    <div>
                      <label htmlFor="model-height" className="block text-sm font-medium text-textPrimary mb-1">Model Height (Optional)</label>
                      <input 
                        type="text"
                        id="model-height"
                        value={heightInput}
                        onChange={(e) => setHeightInput(e.target.value)}
                        placeholder="e.g., 5ft 10in or 178cm"
                        className="w-full px-3 py-2 bg-white border border-borderLight text-textPrimary rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button 
                        onClick={reset}
                        className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-textPrimary bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300"
                      >
                        Use Different Photo
                      </button>
                      <button 
                        onClick={() => onModelFinalized(generatedModelUrl, heightInput)}
                        className="w-full sm:w-auto relative inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-accent border border-accent rounded-md cursor-pointer hover:bg-accent/10"
                      >
                        Use Model
                      </button>
                    </div>
                    <button 
                          onClick={handleRefine}
                          disabled={isRefining}
                          className="w-full relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-accent rounded-md cursor-pointer group hover:bg-accentHover disabled:bg-gray-400"
                      >
                          {isRefining ? <Spinner/> : <SparklesIcon className="w-5 h-5 mr-3" />}
                          Add Final Details & Proceed &rarr;
                      </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="md:w-1/2 w-full flex items-center justify-center">
              <div 
                className={`relative rounded-[1.25rem] transition-all duration-700 ease-in-out ${(isGenerating || isRefining) ? 'border border-borderLight animate-pulse' : 'border border-transparent'}`}
              >
                <Compare
                  firstImage={userImageUrl}
                  secondImage={generatedModelUrl ?? userImageUrl}
                  slideMode="drag"
                  className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] rounded-2xl bg-gray-200"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartScreen;
