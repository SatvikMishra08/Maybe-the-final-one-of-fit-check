/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Product, ShootTemplate, Variation, WardrobeItem, ProductGarment } from '../types';
import { SparklesIcon, PlusIcon, XIcon, BookmarkIcon, GripVerticalIcon, CheckCircle2Icon } from './icons';
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion';


interface CurrentProductPanelProps {
  activeProduct: Product | undefined | null;
  activeTemplate: ShootTemplate | undefined | null;
  activeVariation: Variation | undefined | null;
  // FIX: Add wardrobe to props to resolve ProductGarment references.
  wardrobe: WardrobeItem[];
  onUpdateNotes: (notes: string) => void;
  onChangeTemplateClick: () => void;
  onAddLayerClick: () => void;
  onRemoveLayerClick: (garmentId: string) => void;
  // FIX: Update prop to expect an array of ProductGarment references.
  onReorderLayers: (newGarmentOrder: ProductGarment[]) => void;
  onSaveLook: (productId: string, name?: string) => void;
  isLoading: boolean;
  onChangeSize: (size: string) => void;
}

const DraggableGarmentItem: React.FC<{
    // FIX: Expect a ProductGarment reference instead of a full WardrobeItem.
    garment: ProductGarment,
    wardrobe: WardrobeItem[],
    isTopLayer: boolean, 
    onRemove: () => void,
    isLoading: boolean,
}> = ({ garment, wardrobe, isTopLayer, onRemove, isLoading }) => {
    const dragControls = useDragControls();

    const fullGarment = wardrobe.find(w => w.id === garment.garmentId);
    if (!fullGarment) return null; // Should not happen in practice
    const variant = fullGarment.variants.find(v => v.id === garment.variantId) || fullGarment.variants[0];
    if (!variant) return null;


    const primaryMaterial = fullGarment.materialBlend[0]?.material || 'Unknown';
    return (
        <Reorder.Item
            // FIX: Use a unique key combining garment and variant ID for reordering stability.
            key={`${garment.garmentId}-${garment.variantId}`}
            value={garment}
            dragListener={!isLoading}
            dragControls={dragControls}
            className="flex items-center justify-between bg-white/50 p-2 rounded-lg border border-borderLight/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            <div className="flex items-center overflow-hidden">
                <div 
                    onPointerDown={(e) => dragControls.start(e)}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-2 -ml-2 text-textSecondary/50"
                >
                    <GripVerticalIcon className="w-4 h-4" />
                </div>
                {/* FIX: Use the resolved variant's front view. */}
                <img src={variant.views.front} alt={fullGarment.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-md mr-3" />
                <div className="flex flex-col items-start">
                    <span className="font-semibold text-textPrimary truncate" title={fullGarment.name}>
                        {fullGarment.name}
                    </span>
                    <span className="text-xs text-textSecondary">{primaryMaterial}</span>
                </div>
            </div>
            {isTopLayer && (
                <button onClick={onRemove} className="p-1.5 rounded-full hover:bg-red-100 text-textSecondary hover:text-red-600 transition-colors">
                    <XIcon className="w-4 h-4" />
                </button>
            )}
        </Reorder.Item>
    );
};


const CurrentProductPanel: React.FC<CurrentProductPanelProps> = ({ 
    activeProduct, 
    activeTemplate, 
    activeVariation,
    // FIX: Destructure wardrobe from props.
    wardrobe,
    onUpdateNotes, 
    onChangeTemplateClick, 
    onAddLayerClick, 
    onRemoveLayerClick, 
    onReorderLayers,
    onSaveLook,
    isLoading,
    onChangeSize,
}) => {
  const [notes, setNotes] = useState(activeProduct?.metadata.notes || '');
  // FIX: The state now correctly holds ProductGarment[]
  const [garments, setGarments] = useState<ProductGarment[]>(activeProduct?.garments || []);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setNotes(activeProduct?.metadata.notes || '');
    setGarments(activeProduct?.garments || []);
  }, [activeProduct]);

  const handleNotesBlur = () => {
    if (notes !== activeProduct?.metadata.notes) {
      onUpdateNotes(notes);
    }
  };
  
  // FIX: Handle reordering of ProductGarment[]
  const handleReorder = (newOrder: ProductGarment[]) => {
    setGarments(newOrder); // Update local state immediately for responsiveness
    onReorderLayers(newOrder);
  };

  const handleSaveClick = () => {
      if (!activeProduct) return;
      const lookName = activeProduct.isSavedLook ? prompt('Rename look:', activeProduct.lookName) ?? undefined : undefined;
      onSaveLook(activeProduct.id, lookName);
      if (!activeProduct.isSavedLook) { // Only animate on initial save
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 2000);
      }
  };

  if (!activeProduct) {
      return <p className="text-center text-sm text-textSecondary pt-4">Select a product to see its details.</p>;
  }
  
  // FIX: Resolve the top ProductGarment to a WardrobeItem to access its properties.
  const topProductGarment = activeProduct.garments.length > 0 ? activeProduct.garments[activeProduct.garments.length - 1] : undefined;
  const topGarment = topProductGarment ? wardrobe.find(w => w.id === topProductGarment.garmentId) : undefined;
  const availableSizes = topGarment?.measurements?.map(m => m.sizeLabel) || [];
  const currentSize = activeVariation?.metadata.size;


  return (
    <div className="flex flex-col gap-6">
      {/* Outfit Stack */}
      <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-textPrimary">Outfit Stack</h4>
            <button
                onClick={handleSaveClick}
                disabled={isLoading}
                title={activeProduct.isSavedLook ? 'Rename this Look' : 'Save this Look'}
                className="p-2 -mr-2 text-textSecondary hover:text-accent transition-colors disabled:opacity-50"
            >
              <AnimatePresence mode="wait" initial={false}>
                  {justSaved ? (
                      <motion.div key="saved" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                          <CheckCircle2Icon className="w-5 h-5 text-green-500" />
                      </motion.div>
                  ) : (
                      <motion.div key="bookmark" initial={false} animate={{ scale: 1, opacity: 1 }}>
                          <BookmarkIcon className={`w-5 h-5 ${activeProduct.isSavedLook ? 'text-accent fill-accent' : ''}`} />
                      </motion.div>
                  )}
              </AnimatePresence>
            </button>
        </div>
        <Reorder.Group axis="y" values={garments} onReorder={handleReorder} className="space-y-2">
            {garments.map((garment, index) => (
                 <DraggableGarmentItem
                    // FIX: Use a unique key for reordering stability.
                    key={`${garment.garmentId}-${garment.variantId}`}
                    garment={garment}
                    wardrobe={wardrobe}
                    isTopLayer={index === garments.length - 1 && garments.length > 1}
                    onRemove={() => onRemoveLayerClick(garment.garmentId)}
                    isLoading={isLoading}
                 />
            ))}
        </Reorder.Group>
        <button onClick={onAddLayerClick} disabled={isLoading} className="w-full mt-2 flex items-center justify-center gap-2 text-sm font-semibold p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 border border-borderLight/60 transition-colors disabled:opacity-50">
            <PlusIcon className="w-4 h-4"/> Add Layer
        </button>
      </div>

       {availableSizes.length > 0 && topGarment && (
        <div>
            <h4 className="font-semibold text-textPrimary mb-2">
                Size <span className="font-normal text-textSecondary">({topGarment.name})</span>
            </h4>
            <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                    <button
                        key={size}
                        onClick={() => onChangeSize(size)}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-semibold border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            currentSize === size
                            ? 'bg-accent text-white border-accent'
                            : 'bg-white text-textPrimary border-borderLight hover:border-gray-400'
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>
            {activeProduct.recommendedSize && (
                <p className="text-xs text-textSecondary mt-2">Recommended: <strong>{activeProduct.recommendedSize}</strong></p>
            )}
        </div>
      )}

      <div>
        <label htmlFor="product-notes" className="block text-sm font-semibold text-textPrimary mb-1">
          Product Notes
        </label>
        <textarea
          id="product-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add notes, SKU, or other details here..."
          className="w-full h-24 p-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
        />
      </div>
    </div>
  );
};

export default React.memo(CurrentProductPanel);