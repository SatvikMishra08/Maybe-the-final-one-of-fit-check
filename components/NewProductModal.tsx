/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WardrobeItem, ShootTemplate, PosePreset, GarmentVariant } from '../types';
import { XIcon, ArrowRightIcon, ChevronLeftIcon, SparklesIcon, CheckCircle2Icon } from './icons';
import WardrobePanel from './WardrobeModal';
import { SizeMeasurement } from '../types';
import { generateGarmentImageFromPrompt } from '../services/geminiService';
import { getFriendlyErrorMessage } from '../lib/utils';

// Copied from App.tsx to use in this component for responsive layout
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

interface ShootTemplateSelectorProps {
    templates: ShootTemplate[];
    onSelect: (template: ShootTemplate) => void;
    onBack: () => void;
    selectedGarment: WardrobeItem;
    selectedVariant: GarmentVariant;
}

const ShootTemplateSelector: React.FC<ShootTemplateSelectorProps> = ({ templates, onSelect, onBack, selectedGarment, selectedVariant }) => {
    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full"
        >
            <div className="flex-shrink-0 flex items-center p-4 border-b border-borderLight relative">
                <button onClick={onBack} className="absolute left-4 p-1 text-textSecondary hover:text-textPrimary">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="text-center flex-grow">
                    <h3 className="text-lg font-serif tracking-wider text-textPrimary">Step 2: Select a Shoot Style</h3>
                    <p className="text-sm text-textSecondary">For: {selectedGarment.name} ({selectedVariant.colorName})</p>
                </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-3 flex-grow">
                {templates.map(template => (
                    <button
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className="w-full text-left p-4 bg-white rounded-lg hover:bg-gray-100 border border-borderLight/60 transition-colors"
                    >
                        <p className="font-semibold text-textPrimary">{template.name}</p>
                        <p className="text-sm text-textSecondary mt-1">{template.description}</p>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

interface PosePreviewCardProps {
  pose: PosePreset;
  isSelected: boolean;
  onToggle: (poseId: string) => void;
}

const PosePreviewCard: React.FC<PosePreviewCardProps> = ({ pose, isSelected, onToggle }) => {
    return (
        <div className="w-full">
            <button
                onClick={() => onToggle(pose.id)}
                className={`relative w-full aspect-[2/3] border-2 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent group ${isSelected ? 'border-accent' : 'border-borderLight hover:border-gray-400'}`}
                aria-pressed={isSelected}
            >
                <img src={pose.previewImageUrl} alt={pose.name} className="w-full h-full object-cover bg-gray-100" />
                {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-accent text-white rounded-full p-0.5 pointer-events-none">
                        <CheckCircle2Icon className="w-4 h-4" />
                    </div>
                )}
            </button>
            <p className="text-xs font-semibold text-center mt-1.5 text-textPrimary">{pose.name}</p>
        </div>
    );
};


interface BatchConfiguratorProps {
    template: ShootTemplate;
    onGenerate: (selectedPoses: PosePreset[], realism: { fabric: boolean; humanize: boolean; }) => void;
    onBack: () => void;
    selectedGarment: WardrobeItem;
}

const BatchConfigurator: React.FC<BatchConfiguratorProps> = ({ template, onGenerate, onBack, selectedGarment }) => {
    const [selectedPoseIds, setSelectedPoseIds] = useState<Set<string>>(() => new Set(template.posePresets.map(p => p.id)));
    const [isFabricRealismActive, setIsFabricRealismActive] = useState(template.fabricRealismDefault);
    const [isHumanizeModelActive, setIsHumanizeModelActive] = useState(template.humanizeModelDefault);
    const isMobile = useMediaQuery('(max-width: 640px)');

    const handlePoseToggle = (poseId: string) => {
        setSelectedPoseIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(poseId)) {
                newSet.delete(poseId);
            } else {
                newSet.add(poseId);
            }
            return newSet;
        });
    };

    const handleGenerateClick = () => {
        const selectedPoses = template.posePresets.filter(p => selectedPoseIds.has(p.id));
        onGenerate(selectedPoses, { fabric: isFabricRealismActive, humanize: isHumanizeModelActive });
    };

    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full"
        >
            <div className="flex-shrink-0 flex items-center p-4 border-b border-borderLight relative">
                <button onClick={onBack} className="absolute left-4 p-1 text-textSecondary hover:text-textPrimary">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="text-center flex-grow">
                     <h3 className="text-lg font-serif tracking-wider text-textPrimary">Step 3: Configure Batch</h3>
                     <p className="text-sm text-textSecondary">{template.name} Style</p>
                </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                 <div>
                    <h4 className="text-sm font-semibold text-textPrimary mb-3">Select Poses to Generate</h4>
                    {isMobile ? (
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
                            {template.posePresets.map(pose => (
                                <div key={pose.id} className="flex-shrink-0 w-32">
                                    <PosePreviewCard pose={pose} isSelected={selectedPoseIds.has(pose.id)} onToggle={handlePoseToggle} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                             {template.posePresets.map(pose => (
                                <PosePreviewCard key={pose.id} pose={pose} isSelected={selectedPoseIds.has(pose.id)} onToggle={handlePoseToggle} />
                            ))}
                        </div>
                    )}
                </div>
                 <div>
                    <h4 className="text-sm font-semibold text-textPrimary mb-2 flex items-center gap-1.5"><SparklesIcon className="w-4 h-4"/> Realism Engine</h4>
                     <div className="flex flex-col gap-2">
                        <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-borderLight/60">
                            <span className="text-sm font-medium text-textPrimary">Fabric Realism</span>
                             <input type="checkbox" className="toggle-checkbox" checked={isFabricRealismActive} onChange={(e) => setIsFabricRealismActive(e.target.checked)} />
                        </label>
                         <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-borderLight/60">
                            <span className="text-sm font-medium text-textPrimary">Humanize Model</span>
                             <input type="checkbox" className="toggle-checkbox" checked={isHumanizeModelActive} onChange={(e) => setIsHumanizeModelActive(e.target.checked)} />
                        </label>
                    </div>
                 </div>
            </div>
             <div className="flex-shrink-0 p-4 border-t border-borderLight flex justify-end bg-background/50">
                <button
                    onClick={handleGenerateClick}
                    disabled={selectedPoseIds.size === 0}
                    className="w-full sm:w-auto flex items-center justify-center text-center bg-accent text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-accentHover active:scale-95 text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Generate {selectedPoseIds.size} {selectedPoseIds.size === 1 ? 'Pose' : 'Poses'}
                </button>
            </div>
        </motion.div>
    );
};

interface NewProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate?: (garmentId: string, variantId: string, templateId: string) => void;
    onCreateBatch?: (garmentId: string, variantId: string, template: ShootTemplate, posePresets: PosePreset[], realism: { fabric: boolean; humanize: boolean; }) => void;
    onAddLayer?: (garmentId: string, variantId: string) => void;
    wardrobe: WardrobeItem[];
    templates: ShootTemplate[];
    isLoading: boolean;
    onUploadClick: () => void;
    onEditClick: (garmentId: string) => void;
    onOpenSizeGuide: (item: WardrobeItem) => void;
    onOpenDetailSpotlight: (item: WardrobeItem) => void;
    isAddGarmentModalOpen: boolean;
    aiGarmentDescription: string | null;
    activeGarmentIds?: string[];
}

const NewProductModal: React.FC<NewProductModalProps> = ({ isOpen, onClose, onCreate, onCreateBatch, onAddLayer, wardrobe, templates, isLoading, onUploadClick, onEditClick, onOpenSizeGuide, onOpenDetailSpotlight, isAddGarmentModalOpen, aiGarmentDescription, activeGarmentIds = [] }) => {
    const [step, setStep] = useState(1);
    const [selectedGarment, setSelectedGarment] = useState<WardrobeItem | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<GarmentVariant | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<ShootTemplate | null>(null);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    
    const isLayeringMode = !!onAddLayer;

    const handleGarmentSelect = (garmentId: string, variantId: string) => {
        const garment = wardrobe.find(g => g.id === garmentId);
        const variant = garment?.variants.find(v => v.id === variantId);
        if (!garment || !variant) return;

        if (isLayeringMode) {
            onAddLayer(garmentId, variantId);
        } else {
            setSelectedGarment(garment);
            setSelectedVariant(variant);
            setStep(2);
        }
    };

    const handleTemplateSelect = (template: ShootTemplate) => {
        if (!onCreateBatch) { // Fallback for safety
             if (selectedGarment && selectedVariant && onCreate) onCreate(selectedGarment.id, selectedVariant.id, template.id);
        } else {
            setSelectedTemplate(template);
            setStep(3);
        }
    };
    
    const handleBatchGenerate = (selectedPoses: PosePreset[], realism: { fabric: boolean; humanize: boolean; }) => {
        if (selectedGarment && selectedVariant && selectedTemplate && onCreateBatch) {
            onCreateBatch(selectedGarment.id, selectedVariant.id, selectedTemplate, selectedPoses, realism);
        }
    }

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep(1);
            setSelectedGarment(null);
            setSelectedVariant(null);
            setSelectedTemplate(null);
        }, 300); // Reset state after transition
    };

    const handleAiGenerate = async () => {
        if (!aiGarmentDescription) return;
        setIsAiGenerating(true);
        try {
            const imageUrl = await generateGarmentImageFromPrompt(aiGarmentDescription);
            const variantId = `variant-ai-${Date.now()}`;
            const newGarment: WardrobeItem = {
                id: `ai-${Date.now()}`,
                name: aiGarmentDescription.charAt(0).toUpperCase() + aiGarmentDescription.slice(1),
                variants: [{
                    id: variantId,
                    colorName: 'Generated',
                    views: { front: imageUrl },
                }],
                materialBlend: [{ material: 'Cotton', percentage: 100 }],
                fit: 'Regular',
            };
            // This is a bit of a workaround - we need to add the garment to the main state
            // and then select it. A better way would be to have the logic handler do this.
            // For now, we'll assume a parent component handles adding the AI garment.
            // A "SAVE_GARMENT" action would be ideal here.
            // For now, we'll just proceed with the selection logic.
            setSelectedGarment(newGarment);
            setSelectedVariant(newGarment.variants[0]);
            setStep(2);

        } catch (err) {
            alert(getFriendlyErrorMessage(err, "Failed to generate garment with AI."));
        } finally {
            setIsAiGenerating(false);
        }
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ 
                            scale: isAddGarmentModalOpen ? 0.95 : 1, 
                            opacity: isAddGarmentModalOpen ? 0.7 : 1,
                            y: isAddGarmentModalOpen ? 10 : 0
                        }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative bg-white rounded-2xl w-full max-w-lg h-[80vh] max-h-[700px] flex flex-col shadow-xl text-textPrimary overflow-hidden"
                        style={{ isolation: 'isolate' }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="new-product-title"
                    >
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    className="flex flex-col h-full"
                                >
                                    <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-borderLight">
                                        <h2 id="new-product-title" className="text-xl font-serif tracking-wider text-textPrimary">{isLayeringMode ? 'Add a Layer' : 'Step 1: Select a Garment'}</h2>
                                        <button onClick={handleClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                                            <XIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="p-6 overflow-y-auto flex-grow">
                                        <WardrobePanel
                                            onGarmentSelect={handleGarmentSelect}
                                            activeGarmentIds={activeGarmentIds}
                                            isLoading={isLoading || isAiGenerating}
                                            wardrobe={wardrobe}
                                            onUploadClick={onUploadClick}
                                            onEditClick={onEditClick}
                                            onOpenSizeGuide={onOpenSizeGuide}
                                            onOpenDetailSpotlight={onOpenDetailSpotlight}
                                            aiPrompt={aiGarmentDescription}
                                            onAiGenerate={handleAiGenerate}
                                            isAiGenerating={isAiGenerating}
                                        />
                                    </div>
                                </motion.div>
                            )}
                            {step === 2 && selectedGarment && selectedVariant && !isLayeringMode && (
                                <ShootTemplateSelector
                                    templates={templates}
                                    onSelect={handleTemplateSelect}
                                    onBack={() => setStep(1)}
                                    selectedGarment={selectedGarment}
                                    selectedVariant={selectedVariant}
                                />
                            )}
                             {step === 3 && selectedGarment && selectedTemplate && !isLayeringMode && (
                                <BatchConfigurator
                                    template={selectedTemplate}
                                    onGenerate={handleBatchGenerate}
                                    onBack={() => setStep(2)}
                                    selectedGarment={selectedGarment}
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NewProductModal;