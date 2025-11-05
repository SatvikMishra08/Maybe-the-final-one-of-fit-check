/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WardrobeItem, GarmentViews, GarmentView, MaterialName, Fit, DesignApplication, SizeMeasurement, Measurement, MaterialBlendComponent, IdentifiedItem, GarmentVariant } from '../types';
import { XIcon, CameraIcon, PlusIcon, ChevronDownIcon, PlusCircleIcon, MinusCircleIcon, SparklesIcon, Trash2Icon, PencilIcon } from './icons';
import { segmentGarment, analyzeSizeChartImage, isPersonInImage, identifyGarmentsInImage, extractGarmentFromSelection } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage, withRetry } from '../lib/utils';

interface AddGarmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: WardrobeItem) => void;
  garmentToEdit?: WardrobeItem | null;
}

const MATERIALS: MaterialName[] = ['Cotton', 'Polyester', 'Spandex', 'Denim', 'Silk', 'Leather', 'Wool', 'Sheer', 'Other'];
const FITS: Fit[] = ['Slim', 'Regular', 'Oversized'];
const DESIGN_APPLICATIONS: DesignApplication[] = ['DTG', 'Vinyl', 'Embroidery', 'Screen Print', 'Puff Print'];
const VIEWS: GarmentView[] = ['front', 'back', 'left', 'right'];

const WEAVE_TYPES = ['Jersey', 'Twill', 'Pique', 'Slub', 'Rib-Knit', 'Fleece', 'French Terry'];
const MANUFACTURING_FINISHES = ['None', 'Garment-Dyed', 'Stonewashed'];
const CONSTRUCTION_DETAILS = ['flatlock_seams', 'ribbed_cuffs', 'raw_hem'];

type PipelineStep = 'IDLE' | 'ANALYZING' | 'SELECTING' | 'EXTRACTING' | 'DETAILS';

const AddGarmentModal: React.FC<AddGarmentModalProps> = ({ isOpen, onClose, onSave, garmentToEdit }) => {
  const isEditMode = !!garmentToEdit;

  // Style-level state
  const [garmentName, setGarmentName] = useState('');
  const [materialBlend, setMaterialBlend] = useState<MaterialBlendComponent[]>([{ material: 'Cotton', percentage: 100 }]);
  const [error, setError] = useState<string | null>(null);

  // Variant-level state
  const [variants, setVariants] = useState<GarmentVariant[]>([{ id: `variant-${Date.now()}`, colorName: '', views: { front: '' } }]);
  
  // Advanced fields
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [gsm, setGsm] = useState<number | ''>('');
  const [fit, setFit] = useState<Fit>('Regular');
  const [designApplication, setDesignApplication] = useState<DesignApplication>('DTG');
  const [measurements, setMeasurements] = useState<SizeMeasurement[]>([]);
  const [isAnalyzingChart, setIsAnalyzingChart] = useState(false);
  const [weaveType, setWeaveType] = useState<string>('Jersey');
  const [manufacturingFinish, setManufacturingFinish] = useState<string>('None');
  const [constructionDetails, setConstructionDetails] = useState<Set<string>>(new Set());

  // AI Tailor Pipeline state
  const [pipelineState, setPipelineState] = useState<{ step: PipelineStep; variantId: string | null; file: File | null; imageUrl: string | null; identifiedItems: IdentifiedItem[]; }>({
    step: 'IDLE',
    variantId: null,
    file: null,
    imageUrl: null,
    identifiedItems: [],
  });
  
  const sizeChartInputRef = useRef<HTMLInputElement>(null);

  const totalPercentage = useMemo(() => materialBlend.reduce((sum, item) => sum + (item.percentage || 0), 0), [materialBlend]);

  const resetState = useCallback(() => {
    setGarmentName('');
    setMaterialBlend([{ material: 'Cotton', percentage: 100 }]);
    setVariants([{ id: `variant-${Date.now()}`, colorName: '', views: { front: '' } }]);
    setError(null);
    setIsAdvancedOpen(false);
    setGsm('');
    setFit('Regular');
    setDesignApplication('DTG');
    setMeasurements([]);
    setIsAnalyzingChart(false);
    setWeaveType('Jersey');
    setManufacturingFinish('None');
    setConstructionDetails(new Set());
    setPipelineState({ step: 'IDLE', variantId: null, file: null, imageUrl: null, identifiedItems: [] });
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (garmentToEdit) {
            setGarmentName(garmentToEdit.name);
            setMaterialBlend(garmentToEdit.materialBlend);
            setVariants(garmentToEdit.variants);
            setGsm(garmentToEdit.gsm || '');
            setFit(garmentToEdit.fit || 'Regular');
            setDesignApplication(garmentToEdit.designApplication || 'DTG');
            setMeasurements(garmentToEdit.measurements || []);
            setWeaveType(garmentToEdit.weave_type || 'Jersey');
            setManufacturingFinish(garmentToEdit.manufacturing_finish || 'None');
            setConstructionDetails(new Set(garmentToEdit.construction_details || []));
            setIsAdvancedOpen(true);
        } else {
            resetState();
        }
    }
  }, [isOpen, garmentToEdit, resetState]);


  const handleClose = () => {
    // No need to reset state here, useEffect will handle it on next open
    onClose();
  };

  const handleFileChange = async (file: File, variantId: string, view: GarmentView) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(`Please select a valid image file for the ${view} view.`);
      return;
    }
    setError(null);

    // --- AI Tailor Pipeline ---
    if (view === 'front') {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            setPipelineState({ step: 'ANALYZING', variantId, file, imageUrl: dataUrl, identifiedItems: [] });
        };
        reader.readAsDataURL(file);
    } else {
        // For back/left/right, use classic segmentation
        setPipelineState({ step: 'EXTRACTING', variantId, file: null, imageUrl: null, identifiedItems: [] });
        try {
            const segmentedImageUrl = await withRetry(() => segmentGarment(file));
            updateVariant(variantId, 'views', { ...variants.find(v => v.id === variantId)?.views, [view]: segmentedImageUrl });
        } catch (err) {
            setError(getFriendlyErrorMessage(err, `Failed to process ${view} view.`));
        } finally {
            setPipelineState({ step: 'IDLE', variantId: null, file: null, imageUrl: null, identifiedItems: [] });
        }
    }
  };
  
  // Pipeline Effects
  useEffect(() => {
    const { step, file, variantId } = pipelineState;
    if (step === 'ANALYZING' && file && variantId) {
        const analyze = async () => {
            try {
                const isPerson = await isPersonInImage(file);
                if (isPerson) {
                    const items = await identifyGarmentsInImage(file);
                    if (items.length > 0) {
                        setPipelineState(prev => ({ ...prev, identifiedItems: items, step: 'SELECTING' }));
                    } else {
                        // AI found a person but no items, fallback to segmenting the whole image
                        const segmentedImageUrl = await withRetry(() => segmentGarment(file));
                        updateVariant(variantId, 'views', { front: segmentedImageUrl });
                        setPipelineState({ step: 'IDLE', variantId: null, file: null, imageUrl: null, identifiedItems: [] });
                    }
                } else {
                    // Not a person, likely a flat lay
                    const segmentedImageUrl = await withRetry(() => segmentGarment(file));
                    updateVariant(variantId, 'views', { front: segmentedImageUrl });
                    setPipelineState({ step: 'IDLE', variantId: null, file: null, imageUrl: null, identifiedItems: [] });
                }
            } catch (err) {
                setError(getFriendlyErrorMessage(err, "Failed to analyze image. Trying standard segmentation."));
                try {
                    const segmentedImageUrl = await withRetry(() => segmentGarment(file!));
                    updateVariant(variantId, 'views', { front: segmentedImageUrl });
                    setPipelineState({ step: 'IDLE', variantId: null, file: null, imageUrl: null, identifiedItems: [] });
                } catch (segmentErr) {
                    setError(getFriendlyErrorMessage(segmentErr, "Failed to process image."));
                    setPipelineState({ step: 'IDLE', variantId: null, file: null, imageUrl: null, identifiedItems: [] });
                }
            }
        };
        analyze();
    }
  }, [pipelineState.step, pipelineState.file, pipelineState.variantId]);

  const handleItemSelection = async (item: IdentifiedItem) => {
    const { file, variantId } = pipelineState;
    if (!file || !variantId) return;
    setPipelineState(prev => ({ ...prev, step: 'EXTRACTING' }));
    try {
        const extractedUrl = await extractGarmentFromSelection(file, item.box);
        const currentVariant = variants.find(v => v.id === variantId);
        updateVariant(variantId, 'views', { ...currentVariant?.views, front: extractedUrl });
        if (!currentVariant?.colorName) {
            updateVariant(variantId, 'colorName', item.label);
        }
        setPipelineState({ step: 'IDLE', variantId: null, file: null, imageUrl: null, identifiedItems: [] });
    } catch (err) {
        setError(getFriendlyErrorMessage(err, "Failed to extract garment. Please try again."));
        setPipelineState({ step: 'IDLE', variantId: null, file: null, imageUrl: null, identifiedItems: [] });
    }
  };

  const handleSizeChartFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setIsAnalyzingChart(true);

    try {
        const analyzedMeasurements = await withRetry(() => analyzeSizeChartImage(file));
        const measurementsWithIds = analyzedMeasurements.map(m => ({ ...m, id: `m-${Date.now()}-${Math.random()}`}));
        setMeasurements(measurementsWithIds);
    } catch(err) {
        setError(getFriendlyErrorMessage(err, "Could not read the size chart."));
    } finally {
        setIsAnalyzingChart(false);
        if (e.target) e.target.value = '';
    }
  };

  const handleSave = () => {
    if (!garmentName.trim()) {
      setError('Please enter a name for the garment style.');
      return;
    }
    if (variants.some(v => !v.views.front)) {
      setError('The front view is required for all color variants.');
      return;
    }
    if (variants.some(v => !v.colorName.trim())) {
      setError('Please enter a name for each color variant.');
      return;
    }
    if (totalPercentage !== 100) {
      setError('Material percentages must add up to 100.');
      return;
    }

    const newItem: WardrobeItem = {
      id: garmentToEdit?.id || `custom-${Date.now()}`,
      name: garmentName.trim(),
      variants: variants.map(v => ({...v, views: v.views as GarmentViews})),
      materialBlend,
      gsm: gsm === '' ? undefined : gsm,
      fit,
      designApplication,
      measurements: measurements.filter(m => m.sizeLabel.trim() && m.measurements.length > 0),
      weave_type: weaveType as any,
      manufacturing_finish: manufacturingFinish as any,
      construction_details: Array.from(constructionDetails) as any,
    };
    onSave(newItem);
    handleClose();
  };

  const addVariant = () => {
    setVariants(prev => [...prev, { id: `variant-${Date.now()}`, colorName: '', views: { front: '' } }]);
  };

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof GarmentVariant, value: any) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };
  
  // Other handlers for advanced options (measurements, blend, etc.) remain largely the same.
  const handleAddSize = () => setMeasurements(prev => [...prev, { id: `size-${Date.now()}`, sizeLabel: '', unit: 'in', measurements: [{dimension: 'chest', value: 0}] }]);
  const handleRemoveSize = (id: string) => setMeasurements(prev => prev.filter(m => m.id !== id));
  const handleSizeLabelChange = (id: string, value: string) => setMeasurements(prev => prev.map(m => m.id === id ? { ...m, sizeLabel: value } : m));
  const handleMeasurementChange = (sizeId: string, measurementIndex: number, field: 'dimension' | 'value', value: string) => setMeasurements(prev => prev.map(size => size.id === sizeId ? { ...size, measurements: size.measurements.map((m, i) => i === measurementIndex ? { ...m, [field]: field === 'value' ? parseFloat(value) || 0 : value } : m) } : size));
  const handleAddMeasurementField = (sizeId: string) => setMeasurements(prev => prev.map(size => size.id === sizeId ? { ...size, measurements: [...size.measurements, { dimension: '', value: 0 }] } : size));
  const handleRemoveMeasurementField = (sizeId: string, measurementIndex: number) => setMeasurements(prev => prev.map(size => size.id === sizeId ? { ...size, measurements: size.measurements.filter((_, i) => i !== measurementIndex) } : size));
  const handleAddBlendComponent = () => setMaterialBlend(prev => [...prev, { material: 'Polyester', percentage: 0 }]);
  const handleRemoveBlendComponent = (index: number) => setMaterialBlend(prev => prev.filter((_, i) => i !== index));
  const handleUpdateBlendComponent = (index: number, field: 'material' | 'percentage', value: string | number) => setMaterialBlend(prev => prev.map((item, i) => i === index ? { ...item, [field]: field === 'material' ? value as MaterialName : Number(value) || 0 } : item));
  const handleConstructionDetailToggle = (detail: string) => setConstructionDetails(prev => { const newSet = new Set(prev); if (newSet.has(detail)) newSet.delete(detail); else newSet.add(detail); return newSet; });

  const isSaveDisabled = !garmentName.trim() || variants.some(v => !v.views.front || !v.colorName.trim()) || pipelineState.step !== 'IDLE' || isAnalyzingChart || totalPercentage !== 100;

  const renderPipelineOverlay = () => {
    const { step, imageUrl, identifiedItems } = pipelineState;
    if (step === 'IDLE' || step === 'DETAILS') return null;

    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-center p-6">
        { (step === 'ANALYZING' || step === 'EXTRACTING') && (
            <div className="flex flex-col items-center text-center">
                <Spinner />
                <p className="mt-4 font-serif text-lg">{step === 'ANALYZING' ? 'Analyzing Image...' : 'Extracting Garment...'}</p>
                <p className="text-sm text-textSecondary">This may take a moment.</p>
            </div>
        )}
        { step === 'SELECTING' && imageUrl && (
             <div className="space-y-4 w-full">
                <h3 className="text-lg font-serif text-center">Our AI found a few items. Tap the one you want to add.</h3>
                <div className="relative">
                    <img src={imageUrl} alt="Select an item" className="w-full h-auto rounded-lg" />
                    {identifiedItems.map((item, index) => {
                        const [yMin, xMin, yMax, xMax] = item.box;
                        const style = { top: `${yMin * 100}%`, left: `${xMin * 100}%`, width: `${(xMax - xMin) * 100}%`, height: `${(yMax - yMin) * 100}%` };
                        return (
                            <button
                                key={index}
                                style={style}
                                onClick={() => handleItemSelection(item)}
                                className="absolute border-2 border-accent bg-accent/20 rounded-md transition-all duration-200 hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent group"
                                aria-label={`Select ${item.label}`}
                            >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    return (
        <div className="p-6 overflow-y-auto space-y-6">
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm" role="alert">{error}</div>}
            
            {/* --- Style Profile Section --- */}
            <div className="space-y-4">
                <h3 className="text-xl font-serif tracking-wider text-textPrimary border-b border-borderLight pb-2">Style Profile</h3>
                <div>
                    <label htmlFor="garment-name" className="block text-sm font-semibold text-textPrimary mb-1">Style Name</label>
                    <input id="garment-name" type="text" value={garmentName} onChange={(e) => setGarmentName(e.target.value)} placeholder="e.g., Gemini Heavyweight Tee" className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-textPrimary">Material Blend</label>
                        <span className={`text-xs font-semibold ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>Total: {totalPercentage}%</span>
                    </div>
                    <div className="space-y-2 p-3 bg-gray-50/80 rounded-lg border border-borderLight">
                        {materialBlend.map((component, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <select value={component.material} onChange={(e) => handleUpdateBlendComponent(index, 'material', e.target.value)} className="w-1/2 px-2 py-1 bg-white border border-borderLight rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent">
                                    {MATERIALS.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                                </select>
                                <input type="number" value={component.percentage} onChange={(e) => handleUpdateBlendComponent(index, 'percentage', e.target.value)} placeholder="%" className="w-1/2 px-2 py-1 bg-white border border-borderLight rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent" max="100" min="0" />
                                <button onClick={() => handleRemoveBlendComponent(index)} disabled={materialBlend.length <= 1} className="text-textSecondary hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"><MinusCircleIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                        <button onClick={handleAddBlendComponent} className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accentHover pt-1"><PlusCircleIcon className="w-4 h-4"/> Add Material</button>
                    </div>
                </div>
            </div>

            {/* --- Colorways Section --- */}
            <div className="space-y-4">
                <h3 className="text-xl font-serif tracking-wider text-textPrimary border-b border-borderLight pb-2">Colorways</h3>
                <AnimatePresence>
                    {variants.map((variant, index) => (
                        <motion.div
                            key={variant.id}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="p-4 bg-gray-50/80 rounded-lg border border-borderLight space-y-4 relative"
                        >
                            {variants.length > 1 && (
                                <button onClick={() => removeVariant(variant.id)} className="absolute -top-2 -right-2 bg-gray-200 text-textSecondary rounded-full p-1 hover:bg-red-500 hover:text-white"><Trash2Icon className="w-4 h-4"/></button>
                            )}
                            <div>
                                <label htmlFor={`color-name-${variant.id}`} className="block text-sm font-semibold text-textPrimary mb-1">Color Name</label>
                                <input id={`color-name-${variant.id}`} type="text" value={variant.colorName} onChange={(e) => updateVariant(variant.id, 'colorName', e.target.value)} placeholder="e.g., Midnight Black" className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {VIEWS.map(view => {
                                    const fileInputRef = React.createRef<HTMLInputElement>();
                                    return (
                                        <div key={view} className="flex flex-col items-center gap-2">
                                            <label
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`relative w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-textSecondary transition-colors cursor-pointer hover:border-accent hover:text-accent ${variant.views[view] ? 'border-gray-400' : 'border-borderLight'}`}
                                            >
                                                {variant.views[view] && <img src={variant.views[view]} alt={`${view} view preview`} className="absolute inset-0 w-full h-full object-contain p-2" />}
                                                {!variant.views[view] && (
                                                    <>
                                                        <CameraIcon className="w-8 h-8" />
                                                        <span className="text-sm font-semibold capitalize mt-1">{view}</span>
                                                        {view === 'front' && <span className="text-xs text-red-500">(Required)</span>}
                                                    </>
                                                )}
                                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileChange(e.target.files[0], variant.id, view)} />
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <button onClick={addVariant} className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 border border-borderLight/60 transition-colors">
                    <PlusIcon className="w-4 h-4"/> Add another colorway
                </button>
            </div>
            
            {/* --- Advanced Section --- */}
            <div className="border-t border-borderLight pt-4">
                <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full flex justify-between items-center text-left text-lg font-serif tracking-wider text-textPrimary">
                    <span>Advanced Options</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isAdvancedOpen && (
                        <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="overflow-hidden">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="gsm-input" className="block text-sm font-semibold text-textPrimary mb-1">GSM</label>
                                        <input id="gsm-input" type="number" value={gsm} onChange={(e) => setGsm(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="e.g., 180" className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
                                    </div>
                                    <div>
                                        <label htmlFor="fit-select" className="block text-sm font-semibold text-textPrimary mb-1">Fit</label>
                                        <select id="fit-select" value={fit} onChange={(e) => setFit(e.target.value as Fit)} className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                                            {FITS.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="design-app-select" className="block text-sm font-semibold text-textPrimary mb-1">Design Application</label>
                                    <select id="design-app-select" value={designApplication} onChange={(e) => setDesignApplication(e.target.value as DesignApplication)} className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                                        {DESIGN_APPLICATIONS.map(da => <option key={da} value={da}>{da}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                    <label htmlFor="weave-type-select" className="block text-sm font-semibold text-textPrimary mb-1">Weave Type</label>
                                    <select id="weave-type-select" value={weaveType} onChange={(e) => setWeaveType(e.target.value)} className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                                        {WEAVE_TYPES.map(wt => <option key={wt} value={wt}>{wt}</option>)}
                                    </select>
                                    </div>
                                    <div>
                                    <label htmlFor="manufacturing-finish-select" className="block text-sm font-semibold text-textPrimary mb-1">Manufacturing Finish</label>
                                    <select id="manufacturing-finish-select" value={manufacturingFinish} onChange={(e) => setManufacturingFinish(e.target.value)} className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                                        {MANUFACTURING_FINISHES.map(mf => <option key={mf} value={mf}>{mf}</option>)}
                                    </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-textPrimary mb-1">Construction Details</label>
                                    <div className="flex flex-wrap gap-2">
                                    {CONSTRUCTION_DETAILS.map(cd => (
                                        <label key={cd} className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={constructionDetails.has(cd)} onChange={() => handleConstructionDetailToggle(cd)} className="w-4 h-4 text-accent rounded focus:ring-accent"/>
                                        {cd.replace('_', ' ')}
                                        </label>
                                    ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                        <h3 className="text-sm font-semibold text-textPrimary">Measurements</h3>
                                        <div className="flex items-center gap-2">
                                            <input type="file" ref={sizeChartInputRef} onChange={handleSizeChartFileChange} accept="image/*" className="hidden"/>
                                            <button onClick={() => sizeChartInputRef.current?.click()} disabled={isAnalyzingChart} className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accentHover disabled:opacity-50">
                                                <SparklesIcon className="w-4 h-4"/> Scan Size Chart
                                            </button>
                                        </div>
                                    </div>
                                    {isAnalyzingChart && ( <div className="flex items-center justify-center gap-2 text-sm text-textSecondary p-4 bg-gray-50 rounded-md border border-borderLight"><Spinner /><span>AI is reading your size chart...</span></div>)}
                                    <div className="space-y-3">
                                    {measurements.map((size) => (
                                        <div key={size.id} className="p-3 bg-gray-50/80 rounded-lg border border-borderLight space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input type="text" placeholder="Size Label (e.g., M)" value={size.sizeLabel} onChange={(e) => handleSizeLabelChange(size.id, e.target.value)} className="flex-grow px-2 py-1 bg-white border border-borderLight rounded-md text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-accent" />
                                            <button onClick={() => handleRemoveSize(size.id)} className="text-textSecondary hover:text-red-500 p-1 rounded-full hover:bg-red-100"><XIcon className="w-4 h-4"/></button>
                                        </div>
                                        <div className="space-y-2 pl-2 border-l-2 border-borderLight">
                                            {size.measurements.map((measurement, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input type="text" placeholder="Dimension" value={measurement.dimension} onChange={(e) => handleMeasurementChange(size.id, index, 'dimension', e.target.value)} className="w-1/2 px-2 py-1 bg-white border border-borderLight rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
                                                    <input type="number" placeholder="Value" value={measurement.value} onChange={(e) => handleMeasurementChange(size.id, index, 'value', e.target.value)} className="w-1/2 px-2 py-1 bg-white border border-borderLight rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
                                                    <button onClick={() => handleRemoveMeasurementField(size.id, index)} className="text-textSecondary hover:text-red-500"><MinusCircleIcon className="w-5 h-5"/></button>
                                                </div>
                                            ))}
                                            <button onClick={() => handleAddMeasurementField(size.id)} className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accentHover pt-1"><PlusCircleIcon className="w-4 h-4"/> Add Field</button>
                                        </div>
                                        </div>
                                    ))}
                                    <button onClick={handleAddSize} disabled={isAnalyzingChart} className="flex items-center gap-1 text-sm font-semibold text-accent hover:text-accentHover disabled:opacity-50"><PlusIcon className="w-5 h-5"/> Add Size</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
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
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl text-textPrimary"
            role="dialog" aria-modal="true" aria-labelledby="add-garment-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-borderLight flex-shrink-0">
              <h2 id="add-garment-title" className="text-2xl font-serif tracking-wider text-textPrimary">
                {isEditMode ? 'Edit Garment' : 'Add Garment to Wardrobe'}
              </h2>
              <button onClick={handleClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto relative">
                {renderContent()}
                {renderPipelineOverlay()}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-borderLight flex justify-end bg-background/50">
                <button
                    onClick={handleSave}
                    disabled={isSaveDisabled}
                    className="w-full sm:w-auto flex items-center justify-center text-center bg-accent text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-accentHover active:scale-95 text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isEditMode ? <PencilIcon className="w-5 h-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />}
                    {isEditMode ? 'Update Garment' : 'Save Garment'}
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddGarmentModal;