/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WardrobeItem, GarmentView, GarmentVariant } from '../types';
import { CloudUploadIcon, ArrowRightIcon, FocusIcon, LayoutGridIcon, PencilIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import Accordion from './Accordion';

const containerVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto', transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

interface ProductStudioPanelProps {
    wardrobe: WardrobeItem[];
    activeGarment: WardrobeItem | null | undefined;
    onGarmentSelect: (garmentId: string | null) => void;
    onUploadClick: () => void;
    onEditClick: (garmentId: string) => void;
    onGenerate: (settings: { background: string; layout: string; lighting: string; props: string[]; view: GarmentView; variantId: string; }) => void;
    isLoading: boolean;
    onOpenDetailSpotlight: (item: WardrobeItem) => void;
    onOpenLibrary: () => void;
}

const ProductStudioPanel: React.FC<ProductStudioPanelProps> = ({ 
    wardrobe, 
    activeGarment, 
    onGarmentSelect, 
    onUploadClick, 
    onEditClick,
    onGenerate, 
    isLoading, 
    onOpenDetailSpotlight, 
    onOpenLibrary,
}) => {
    // Controls state
    const [background, setBackground] = useState('White Wood Planks');
    const [layout, setLayout] = useState('Classic Flat');
    const [lighting, setLighting] = useState('Soft Natural Light');
    const [selectedProps, setSelectedProps] = useState<Set<string>>(new Set());
    const [customProp, setCustomProp] = useState('');
    const [view, setView] = useState<GarmentView>('front');
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);


    // When the active garment changes, reset the controls and select the first variant.
    useEffect(() => {
        if (activeGarment) {
            setBackground('White Wood Planks');
            setLayout('Classic Flat');
            setLighting('Soft Natural Light');
            setSelectedProps(new Set());
            setCustomProp('');
            setView('front');
            setActiveVariantId(activeGarment.variants[0]?.id || null);
            setExpandedItemId(null); // Close any expanded item when a new garment is selected
        } else {
            setActiveVariantId(null);
            setExpandedItemId(null);
        }
    }, [activeGarment]);
    
    const handleGarmentClick = (item: WardrobeItem) => {
        if (item.id === activeGarment?.id) {
            // If clicking the active garment, toggle expansion if it has variants
            if (item.variants.length > 1) {
                setExpandedItemId(prev => (prev === item.id ? null : item.id));
            }
        } else {
            // If clicking a new garment, select it
            onGarmentSelect(item.id);
        }
    };
    
    const handleGenerateClick = () => {
        if (!activeVariantId) return;
        const allProps = Array.from(selectedProps);
        if (customProp.trim()) {
            allProps.push(customProp.trim());
        }
        onGenerate({ background, layout, lighting, props: allProps, view, variantId: activeVariantId });
    };
    
    const backgrounds = ['Plain White', 'White Wood Planks', 'Polished Concrete', 'Crinkled Linen Sheet', 'Marble Slab', 'Neutral Gray'];
    const layouts = ['Classic Flat', 'Neatly Folded', 'Casually Draped'];
    const lightings = ['Soft Natural Light', 'Hard Direct Sunlight', 'Clean Studio Light'];
    const commonProps = ['Sunglasses', 'Open Book', 'Coffee Cup', 'Plant Leaf'];
    
     const handlePropToggle = (prop: string) => {
        setSelectedProps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(prop)) {
                newSet.delete(prop);
            } else {
                newSet.add(prop);
            }
            return newSet;
        });
    };
    
    const activeVariant = useMemo(() => {
        return activeGarment?.variants.find(v => v.id === activeVariantId);
    }, [activeGarment, activeVariantId]);

    const availableViews = useMemo(() => {
        if (!activeVariant) return [];
        return Object.keys(activeVariant.views).filter(v => activeVariant!.views[v as GarmentView]) as GarmentView[];
    }, [activeVariant]);

    return (
        <div className="space-y-4">
            <Accordion title="Wardrobe" defaultOpen={true}>
                 <div className="grid grid-cols-3 gap-3">
                    {wardrobe.map(item => (
                        <React.Fragment key={item.id}>
                            <div className="relative group aspect-square">
                                <button
                                    onClick={() => handleGarmentClick(item)}
                                    className={`aspect-square border-2 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent w-full ${activeGarment?.id === item.id ? 'border-accent' : 'border-borderLight'}`}
                                >
                                    <img src={item.variants[0].views.front} alt={item.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                                    </div>
                                    {item.variants.length > 1 && (
                                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                            +{item.variants.length}
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
                                </div>
                            </div>
                            <AnimatePresence>
                                {expandedItemId === item.id && (
                                    <motion.div className="col-span-3 -mt-2 z-10" layout>
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
                                                    onClick={() => { setActiveVariantId(variant.id); setExpandedItemId(null); }}
                                                    className="w-full flex items-center gap-2 text-left p-1.5 rounded-md hover:bg-gray-200"
                                                >
                                                    <img src={variant.views.front} alt={variant.colorName} className="w-8 h-8 object-cover rounded-sm flex-shrink-0" />
                                                    <span className="text-xs font-semibold text-textPrimary truncate">{variant.colorName}</span>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </React.Fragment>
                    ))}
                    <button onClick={onUploadClick} className="relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-textSecondary transition-colors hover:border-gray-400 hover:text-textPrimary cursor-pointer">
                        <CloudUploadIcon className="w-6 h-6 mb-1"/>
                        <span className="text-xs text-center">Upload</span>
                    </button>
                </div>
            </Accordion>
            
            <button
                onClick={onOpenLibrary}
                disabled={!activeGarment}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 bg-gray-100 rounded-lg hover:bg-gray-200 border border-borderLight/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <LayoutGridIcon className="w-4 h-4" />
                View Generated Library
            </button>

            <AnimatePresence>
                {activeGarment && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                         <Accordion title="Photoshoot Controls" defaultOpen={true}>
                            <div className="space-y-4">
                                {activeGarment.variants.length > 1 && (
                                    <div>
                                        <label className="block text-sm font-semibold text-textPrimary mb-1">Color Variant</label>
                                        <div className="flex flex-wrap gap-2">
                                            {activeGarment.variants.map(v => (
                                                <button key={v.id} onClick={() => setActiveVariantId(v.id)} className={`flex items-center gap-2 p-1 border rounded-md ${activeVariantId === v.id ? 'border-accent' : 'border-borderLight hover:border-gray-400'}`}>
                                                    <img src={v.views.front} alt={v.colorName} className="w-6 h-6 rounded-sm object-cover" />
                                                    <span className={`text-xs font-semibold pr-2 ${activeVariantId === v.id ? 'text-accent' : 'text-textSecondary'}`}>{v.colorName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {availableViews.length > 1 && (
                                    <div>
                                        <label htmlFor="view-select" className="block text-sm font-semibold text-textPrimary mb-1">Garment View</label>
                                        <select id="view-select" value={view} onChange={e => setView(e.target.value as GarmentView)} className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                                            {availableViews.map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="layout-select" className="block text-sm font-semibold text-textPrimary mb-1">Layout Style</label>
                                    <select id="layout-select" value={layout} onChange={e => setLayout(e.target.value)} className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                                        {layouts.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="background-select" className="block text-sm font-semibold text-textPrimary mb-1">Background Surface</label>
                                    <select id="background-select" value={background} onChange={e => setBackground(e.target.value)} className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                                        {backgrounds.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="lighting-select" className="block text-sm font-semibold text-textPrimary mb-1">Lighting Style</label>
                                    <select id="lighting-select" value={lighting} onChange={e => setLighting(e.target.value)} className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                                        {lightings.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-textPrimary mb-2">Styling Props (Optional)</label>
                                    <div className="p-3 bg-gray-50/80 rounded-lg border border-borderLight space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {commonProps.map(prop => (
                                                <button key={prop} onClick={() => handlePropToggle(prop)} className={`px-3 py-1 text-xs font-semibold border rounded-full transition-colors ${selectedProps.has(prop) ? 'bg-accent text-white border-accent' : 'bg-white text-textSecondary border-borderLight hover:border-gray-400'}`}>
                                                    {prop}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            value={customProp}
                                            onChange={(e) => setCustomProp(e.target.value)}
                                            placeholder="Add other items, comma separated..."
                                            className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                        />
                                    </div>
                                </div>
                                <button onClick={handleGenerateClick} disabled={isLoading} className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 bg-accent text-white rounded-lg hover:bg-accentHover disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    <ArrowRightIcon className="w-5 h-5"/>
                                    Generate Flat Lay
                                </button>
                            </div>
                        </Accordion>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductStudioPanel;