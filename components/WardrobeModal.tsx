/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef } from 'react';
import type { WardrobeItem, GarmentVariant } from '../types';
import { CloudUploadIcon, CheckCircle2Icon, OrbitIcon, RulerIcon, SparklesIcon, FocusIcon, PencilIcon } from './icons';
import Spinner from './Spinner';
import { motion, AnimatePresence } from 'framer-motion';

interface VariantSelectorProps {
    item: WardrobeItem;
    onSelect: (variantId: string) => void;
}

const containerVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto', transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};


const VariantSelector: React.FC<VariantSelectorProps> = ({ item, onSelect }) => {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col items-start gap-2 p-3 bg-gray-100 rounded-lg"
        >
            {item.variants.map(variant => (
                <motion.button
                    key={variant.id}
                    variants={itemVariants}
                    onClick={() => onSelect(variant.id)}
                    className="w-full flex items-center gap-2 text-left p-1.5 rounded-md hover:bg-gray-200"
                >
                    <img src={variant.views.front} alt={variant.colorName} className="w-8 h-8 object-cover rounded-sm flex-shrink-0" />
                    <span className="text-xs font-semibold text-textPrimary truncate">{variant.colorName}</span>
                </motion.button>
            ))}
        </motion.div>
    );
};


interface WardrobePanelProps {
  onGarmentSelect: (garmentId: string, variantId: string) => void;
  onUploadClick: () => void;
  onOpenSizeGuide: (item: WardrobeItem) => void;
  onOpenDetailSpotlight: (item: WardrobeItem) => void;
  onEditClick: (garmentId: string) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
  aiPrompt?: string | null;
  onAiGenerate?: () => void;
  isAiGenerating?: boolean;
}

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, onUploadClick, onOpenSizeGuide, onOpenDetailSpotlight, onEditClick, activeGarmentIds, isLoading, wardrobe, aiPrompt, onAiGenerate, isAiGenerating }) => {
    const [error, setError] = useState<string | null>(null);
    const [sizeFilter, setSizeFilter] = useState<string>('All');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    const handleGarmentClick = (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;

        if (item.variants.length === 1) {
            onGarmentSelect(item.id, item.variants[0].id);
        } else {
            setExpandedItemId(prev => (prev === item.id ? null : item.id));
        }
    };
    
    const availableSizes = useMemo(() => {
        const sizes = new Set<string>();
        wardrobe.forEach(item => {
            item.measurements?.forEach(m => sizes.add(m.sizeLabel));
        });
        return ['All', ...Array.from(sizes).sort()];
    }, [wardrobe]);

    const filteredWardrobe = useMemo(() => {
        if (sizeFilter === 'All') return wardrobe;
        return wardrobe.filter(item => 
            item.measurements?.some(m => m.sizeLabel === sizeFilter)
        );
    }, [wardrobe, sizeFilter]);

  return (
    <div>
        {aiPrompt && (
              <div className="p-4 mb-4 bg-accent/10 rounded-lg border border-accent/20 text-center">
                  <p className="text-sm font-semibold text-textPrimary flex items-center justify-center gap-2"><SparklesIcon className="w-4 h-4 text-accent"/> Style Assistant Suggestion</p>
                  <p className="text-sm text-textSecondary mt-1 mb-3">The assistant can generate this garment for you:</p>
                  <p className="font-semibold text-textPrimary text-lg mb-4 italic">"{aiPrompt}"</p>
                  <button 
                      onClick={onAiGenerate}
                      disabled={isAiGenerating}
                      className="w-full flex items-center justify-center text-center bg-accent text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-accentHover active:scale-95 text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                      {isAiGenerating ? (
                          <><Spinner /> <span className="ml-2">Generating...</span></>
                      ) : (
                          'Generate with AI'
                      )}
                  </button>
                   <p className="text-xs text-textSecondary mt-4">Or, select an item from your wardrobe below.</p>
              </div>
          )}
        <h2 className="text-xl font-serif tracking-wider text-textPrimary mb-3">Wardrobe</h2>
        
        {availableSizes.length > 1 && (
             <div className="mb-4">
                <p className="text-sm text-textSecondary mb-2">Filter by size:</p>
                <div className="flex gap-2 flex-wrap">
                    {availableSizes.map(size => (
                        <button 
                            key={size}
                            onClick={() => setSizeFilter(size)}
                            className={`px-3 py-1 text-sm font-semibold border rounded-full transition-colors ${
                                sizeFilter === size 
                                ? 'bg-accent text-white border-accent' 
                                : 'bg-white text-textSecondary border-borderLight hover:border-gray-400'
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-3 gap-3">
            {filteredWardrobe.map((item) => {
                const isActive = activeGarmentIds.includes(item.id);
                const hasMeasurements = item.measurements && item.measurements.length > 0;
                const showVariantIndicator = item.variants.length > 1;

                return (
                    <React.Fragment key={item.id}>
                        <div className="relative group aspect-square">
                            <button
                                onClick={() => handleGarmentClick(item)}
                                disabled={isLoading || isActive}
                                className="aspect-square border rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent w-full disabled:opacity-60 disabled:cursor-not-allowed"
                                aria-label={`Select ${item.name}`}
                            >
                                <img src={item.variants[0].views.front} alt={item.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                                </div>
                                {showVariantIndicator && (
                                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                        +{item.variants.length}
                                    </div>
                                )}
                                {isActive && (
                                    <div className="absolute inset-0 bg-accent/70 flex items-center justify-center">
                                        <CheckCircle2Icon className="w-8 h-8 text-white" />
                                    </div>
                                )}
                            </button>
                            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEditClick(item.id)} className="bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm hover:bg-accent" title="Edit Garment">
                                    <PencilIcon className="w-3 h-3" />
                                </button>
                                <button onClick={() => onOpenDetailSpotlight(item)} className="bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm hover:bg-accent" title="Detail Spotlight">
                                    <FocusIcon className="w-3 h-3" />
                                </button>
                                {hasMeasurements && (
                                    <button onClick={() => onOpenSizeGuide(item)} className="bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm hover:bg-accent" title="View Size Guide">
                                        <RulerIcon className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <AnimatePresence>
                            {expandedItemId === item.id && (
                                <motion.div className="col-span-3 -mt-2 z-10" layout>
                                    <VariantSelector
                                        item={item}
                                        onSelect={(variantId) => {
                                            onGarmentSelect(item.id, variantId);
                                            setExpandedItemId(null);
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </React.Fragment>
                );
            })}
            <button 
              onClick={onUploadClick}
              disabled={isLoading}
              className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-textSecondary transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100' : 'hover:border-gray-400 hover:text-textPrimary cursor-pointer'}`}
              aria-label="Upload a new garment"
            >
                <CloudUploadIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center">Upload</span>
            </button>
        </div>
        {filteredWardrobe.length === 0 && (
            <p className="text-center text-sm text-textSecondary mt-4">No garments match the selected size.</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;