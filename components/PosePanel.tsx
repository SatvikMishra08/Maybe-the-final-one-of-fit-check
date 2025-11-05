/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { ArrowRightIcon, LayoutGridIcon, SparklesIcon } from './icons';
import Spinner from './Spinner';
import { Variation, ShootTemplate } from '../types';

export interface SceneOverrides {
    poseInstruction: string;
    backgroundDescription?: string;
    lightingStyle?: string;
    lens?: string;
    generalEditPrompt?: string;
}

interface PosePanelProps {
  variations: Variation[];
  activeVariationId: string | null;
  onVariationSelect: (variationId: string) => void;
  onPoseGenerate: (overrides: SceneOverrides) => void;
  isLoading: boolean;
  onBrowseLibrary: () => void;
  activeTemplate: ShootTemplate | undefined | null;
}

const PosePanel: React.FC<PosePanelProps> = ({ 
  variations, 
  activeVariationId, 
  onVariationSelect, 
  onPoseGenerate, 
  isLoading, 
  onBrowseLibrary,
  activeTemplate,
}) => {
  const [isDirectorMode, setIsDirectorMode] = useState(false);
  const [poseInput, setPoseInput] = useState('');

  // Director mode states
  const [backgroundInput, setBackgroundInput] = useState('');
  const [lightingInput, setLightingInput] = useState('');
  const [lensInput, setLensInput] = useState('85mm f/1.8 (Portrait)');
  const [creativeInput, setCreativeInput] = useState('');

  useEffect(() => {
    if (activeTemplate) {
      setBackgroundInput(activeTemplate.backgroundStyle.description);
      setLightingInput(activeTemplate.lightingDirection);
    }
  }, [activeTemplate, isDirectorMode]); // Rerun when director mode is toggled

  const handleGenerate = () => {
    if (isLoading) return;

    if (isDirectorMode) {
        if (!poseInput.trim()) return;
        onPoseGenerate({
            poseInstruction: poseInput.trim(),
            backgroundDescription: backgroundInput.trim(),
            lightingStyle: lightingInput.trim(),
            lens: lensInput,
            generalEditPrompt: creativeInput.trim(),
        });
    } else {
        if (!poseInput.trim()) return;
        onPoseGenerate({ poseInstruction: poseInput.trim() });
    }
    setPoseInput('');
    setCreativeInput('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Allow shift+enter for newlines in textarea
      e.preventDefault();
      handleGenerate();
    }
  };

  const currentPoseInstruction = variations.find(v => v.id === activeVariationId)?.poseInstruction;

  return (
    <div>
      {/* Pose Gallery */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {variations.map((variation) => (
          <button
            key={variation.id}
            onClick={() => onVariationSelect(variation.id)}
            disabled={isLoading}
            className={`relative flex-shrink-0 w-20 h-32 bg-gray-100 border-2 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent group disabled:cursor-not-allowed ${
              activeVariationId === variation.id ? 'border-accent' : 'border-borderLight hover:border-gray-400'
            }`}
          >
            <img src={variation.imageUrl} alt={variation.poseInstruction} className="w-full h-full object-contain" />
            <div
              className={`absolute bottom-0 left-0 right-0 p-1 text-center text-white bg-black/60 text-[10px] leading-tight truncate transition-opacity ${
                activeVariationId === variation.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {variation.poseInstruction}
            </div>
          </button>
        ))}
         {isLoading && currentPoseInstruction && !variations.find(v => v.poseInstruction === currentPoseInstruction) && (
            <div className="flex-shrink-0 w-20 h-32 border-2 border-dashed border-accent rounded-lg flex flex-col items-center justify-center bg-gray-100 animate-pulse">
                <Spinner />
                <p className="text-[10px] text-center mt-1 text-accent">Generating...</p>
            </div>
        )}
      </div>

      <div className="mt-6">
        <button onClick={onBrowseLibrary} className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 bg-gray-100 rounded-lg hover:bg-gray-200 border border-borderLight/60 transition-colors mb-4">
          <LayoutGridIcon className="w-4 h-4" />
          Browse Full Pose Library
        </button>
      </div>

      {/* New Pose Input */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-textSecondary">{isDirectorMode ? 'Director Controls:' : 'Or, describe a new pose:'}</p>
            <label htmlFor="director-mode-toggle" className="flex items-center cursor-pointer gap-2 text-sm font-semibold text-textSecondary hover:text-textPrimary">
                <SparklesIcon className="w-4 h-4" />
                <span>Director Mode</span>
                <div className="relative inline-flex items-center">
                    <input 
                        type="checkbox" 
                        id="director-mode-toggle" 
                        className="sr-only peer" 
                        checked={isDirectorMode}
                        onChange={(e) => setIsDirectorMode(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-accent/30"></div>
                    <div className="absolute top-0.5 left-[2px] bg-white border-gray-300 border w-4 h-4 rounded-full transition-transform peer-checked:translate-x-full peer-checked:border-accent peer-checked:bg-accent"></div>
                </div>
            </label>
        </div>
        
        {isDirectorMode ? (
            <div className="space-y-4">
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-borderLight">
                    <div>
                        <label htmlFor="pose-textarea" className="block text-xs font-semibold text-textPrimary mb-1">Pose Instruction</label>
                        <textarea
                            id="pose-textarea"
                            value={poseInput}
                            onChange={(e) => setPoseInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="e.g., mid-jump, arms outstretched, joyful expression..."
                            className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm h-20 resize-none"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="background-input" className="block text-xs font-semibold text-textPrimary mb-1">Background</label>
                        <input
                            id="background-input"
                            type="text"
                            value={backgroundInput}
                            onChange={(e) => setBackgroundInput(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="lighting-input" className="block text-xs font-semibold text-textPrimary mb-1">Lighting</label>
                            <input
                                id="lighting-input"
                                type="text"
                                value={lightingInput}
                                onChange={(e) => setLightingInput(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="lens-select" className="block text-xs font-semibold text-textPrimary mb-1">Camera & Lens</label>
                            <select
                                id="lens-select"
                                value={lensInput}
                                onChange={(e) => setLensInput(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                disabled={isLoading}
                            >
                                <option>35mm f/2.0 (Wide)</option>
                                <option>50mm f/1.4 (Standard)</option>
                                <option>85mm f/1.8 (Portrait)</option>
                                <option>135mm f/2.0 (Telephoto)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="creative-input" className="block text-xs font-semibold text-textPrimary mb-1">Creative Edit (Optional)</label>
                        <input
                            id="creative-input"
                            type="text"
                            value={creativeInput}
                            onChange={(e) => setCreativeInput(e.target.value)}
                            placeholder="e.g., add a prop like a skateboard"
                            className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading || !poseInput.trim()}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 bg-accent text-white rounded-lg hover:bg-accentHover disabled:bg-gray-400 disabled:cursor-not-allowed"
                    aria-label="Generate new pose"
                >
                    <ArrowRightIcon className="w-5 h-5" />
                    Generate
                </button>
            </div>
        ) : (
            <div className="flex items-center gap-2">
               <input
                    type="text"
                    value={poseInput}
                    onChange={(e) => setPoseInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., jumping in the air"
                    className="w-full px-4 py-2 bg-white border border-borderLight rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !poseInput.trim()}
                    className="p-3 bg-accent text-white rounded-full transition-colors hover:bg-accentHover disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label="Generate new pose"
                >
                    <ArrowRightIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PosePanel);