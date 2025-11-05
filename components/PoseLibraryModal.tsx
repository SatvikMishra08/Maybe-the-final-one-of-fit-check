/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon, SearchIcon, EyeIcon, Trash2Icon } from './icons';
import { poseLibrary, twoModelPoseLibrary } from '../data/poses';
import { PosePreset, ModelInfo, WardrobeItem, TwoModelPosePreset } from '../types';
import Spinner from './Spinner';

interface PoseCardProps {
    pose: PosePreset;
    previewState: { status: 'loading' | 'success' | 'error'; imageUrl?: string } | undefined;
    onApply: (instruction: string, poseId: string) => void;
    onPreview: (pose: PosePreset) => void;
    onRevert: (poseId: string) => void;
    isLoading: boolean;
}

const PoseCard: React.FC<PoseCardProps> = ({ pose, previewState, onApply, onRevert, onPreview, isLoading }) => {
    return (
        <div className="relative group aspect-[2/3]">
            <AnimatePresence>
                {previewState?.status === 'loading' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm border-2 border-dashed border-accent rounded-lg flex items-center justify-center z-10">
                        <Spinner />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`w-full h-full border-2 rounded-lg overflow-hidden transition-all duration-200 group-hover:border-gray-400 ${previewState?.status === 'success' ? 'border-accent/50' : 'border-borderLight'}`}>
                 <img 
                    src={previewState?.status === 'success' ? previewState.imageUrl : pose.previewImageUrl} 
                    alt={pose.name} 
                    className="w-full h-full object-cover bg-gray-100" 
                    loading="lazy" 
                />

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 z-20">
                    {previewState?.status === 'success' ? (
                        <div className="flex flex-col items-center gap-1.5 text-center">
                            <button onClick={() => onApply(pose.instruction, pose.id)} disabled={isLoading} className="text-xs font-semibold bg-accent px-3 py-1.5 rounded-full hover:bg-accentHover">✓ Apply Pose</button>
                            <button onClick={() => onRevert(pose.id)} className="text-xs underline">Revert</button>
                        </div>
                    ) : previewState?.status === 'error' ? (
                        <div className="text-center">
                            <p className="text-xs font-semibold text-red-400">Preview Error</p>
                            <button onClick={() => onPreview(pose)} className="text-xs underline">Retry</button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => onPreview(pose)} disabled={isLoading} className="flex items-center gap-1 text-xs font-semibold bg-white/80 text-black px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-white">
                                <EyeIcon className="w-3 h-3"/> Preview
                            </button>
                            <div className="text-center text-white text-sm leading-tight font-semibold truncate mt-2">
                                {pose.name}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const TwoModelPoseCard: React.FC<{ pose: TwoModelPosePreset, onSelect: () => void }> = ({ pose, onSelect }) => {
    return (
         <button onClick={onSelect} className="relative group aspect-[2/3] text-left">
            <div className="w-full h-full border-2 border-borderLight rounded-lg overflow-hidden transition-all duration-200 group-hover:border-accent">
                <img 
                    src={pose.previewImageUrl} 
                    alt={pose.name} 
                    className="w-full h-full object-cover bg-gray-100" 
                    loading="lazy" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex flex-col justify-end">
                    <p className="text-white text-sm font-bold">{pose.name}</p>
                    <p className="text-white/80 text-xs mt-1">{pose.description}</p>
                </div>
            </div>
        </button>
    );
};


interface PoseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'single' | 'two-model';
  onPoseSelect: (instruction: string, poseId: string) => void;
  onTwoModelPoseSelect: (poses: { model1Pose: string; model2Pose: string }) => void;
  modelInfo: ModelInfo | null;
  garments: WardrobeItem[] | undefined;
  isLoading: boolean;
  posePreviews: { [poseId: string]: { status: 'loading' | 'success' | 'error'; imageUrl?: string } };
  onPreviewGenerate: (pose: PosePreset) => void;
  onRevertPreview: (poseId: string) => void;
  onClearAllPreviews: () => void;
  onBulkPreviewGenerate: (poses: PosePreset[]) => void;
}

const PoseLibraryModal: React.FC<PoseLibraryModalProps> = ({ 
    isOpen, 
    onClose,
    mode,
    onPoseSelect,
    onTwoModelPoseSelect,
    modelInfo, 
    garments, 
    isLoading, 
    posePreviews, 
    onPreviewGenerate, 
    onRevertPreview, 
    onClearAllPreviews,
    onBulkPreviewGenerate,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>(Object.keys(poseLibrary)[0]);
    
    const categories = Object.entries(poseLibrary);

    const filteredPoses = useMemo(() => {
        if (!activeCategory) return [];
        const lowerCaseSearch = searchTerm.toLowerCase();
        return poseLibrary[activeCategory].poses.filter(pose =>
            pose.name.toLowerCase().includes(lowerCaseSearch) ||
            pose.description.toLowerCase().includes(lowerCaseSearch)
        );
    }, [searchTerm, activeCategory]);
    
     const filteredTwoModelPoses = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (!lowerCaseSearch) return twoModelPoseLibrary;
        return twoModelPoseLibrary.filter(pose =>
            pose.name.toLowerCase().includes(lowerCaseSearch) ||
            pose.description.toLowerCase().includes(lowerCaseSearch)
        );
    }, [searchTerm]);

    const handleCategoryClick = (key: string) => {
        setActiveCategory(key);
        setSearchTerm('');
    };
    
    const handleBulkPreview = () => {
        onBulkPreviewGenerate(filteredPoses);
    };
    
    const hasPosesToPreview = useMemo(() => {
        return filteredPoses.some(p => !posePreviews[p.id] || posePreviews[p.id]?.status === 'error');
    }, [filteredPoses, posePreviews]);


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="relative bg-background rounded-2xl w-[95%] h-[90%] max-w-6xl flex flex-col shadow-xl text-textPrimary"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pose-library-title"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-borderLight">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div>
                                    <h2 id="pose-library-title" className="text-2xl font-serif tracking-wider text-textPrimary">
                                        {mode === 'two-model' ? 'Two-Model Pose Library' : 'Pose Library'}
                                    </h2>
                                    <p className="text-sm text-textSecondary mt-1">Select a pose to apply it to your model(s).</p>
                                </div>
                                {mode === 'single' && (
                                    <>
                                        <button onClick={handleBulkPreview} disabled={!hasPosesToPreview || isLoading} className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accentHover p-2 rounded-md hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <EyeIcon className="w-4 h-4" /> Preview All Visible
                                        </button>
                                        {Object.keys(posePreviews).length > 0 && (
                                            <button onClick={onClearAllPreviews} className="flex items-center gap-1.5 text-sm font-semibold text-textSecondary hover:text-red-500 p-2 rounded-md hover:bg-red-50">
                                                <Trash2Icon className="w-4 h-4" /> Clear Previews
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            <button onClick={onClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {/* Controls */}
                        <div className="flex-shrink-0 p-4 border-b border-borderLight space-y-4">
                             <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                type="text"
                                placeholder={`Search poses${mode === 'single' ? ' in this category...' : '...'}`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-borderLight rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            {mode === 'single' && (
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(([key, category]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleCategoryClick(key)}
                                            className={`px-3 py-1.5 text-sm rounded-full font-semibold transition-colors ${
                                                activeCategory === key
                                                ? 'bg-accent text-white'
                                                : 'bg-white text-textSecondary border border-borderLight hover:border-gray-400 hover:text-textPrimary'
                                            }`}
                                        >
                                        {category.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Grid */}
                        <div className="flex-grow p-4 overflow-y-auto">
                           {mode === 'single' ? (
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={activeCategory}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                                    >
                                        {filteredPoses.map(pose => (
                                            <PoseCard 
                                                key={pose.id} 
                                                pose={pose} 
                                                previewState={posePreviews[pose.id]}
                                                onApply={onPoseSelect}
                                                onPreview={onPreviewGenerate}
                                                onRevert={onRevertPreview}
                                                isLoading={isLoading || posePreviews[pose.id]?.status === 'loading'}
                                            />
                                        ))}
                                    </motion.div>
                               </AnimatePresence>
                           ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {filteredTwoModelPoses.map(pose => (
                                        <TwoModelPoseCard
                                            key={pose.id}
                                            pose={pose}
                                            onSelect={() => onTwoModelPoseSelect({ model1Pose: pose.model1Instruction, model2Pose: pose.model2Instruction })}
                                        />
                                    ))}
                                </div>
                           )}
                           {(mode === 'single' && filteredPoses.length === 0) && (
                                <div className="text-center py-10 text-textSecondary">
                                    <p>No poses found for "{searchTerm}" in this category.</p>
                                </div>
                           )}
                           {(mode === 'two-model' && filteredTwoModelPoses.length === 0) && (
                                <div className="text-center py-10 text-textSecondary">
                                    <p>No poses found for "{searchTerm}".</p>
                                </div>
                           )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PoseLibraryModal;