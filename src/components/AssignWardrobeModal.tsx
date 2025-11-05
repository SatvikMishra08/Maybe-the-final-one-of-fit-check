/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WardrobeItem } from '../types';
import { XIcon, HangerIcon, CheckCircle2Icon, PlusIcon } from './icons';

interface AssignWardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: WardrobeItem[];
  onSave: (outfit: WardrobeItem[]) => void;
}

const AssignWardrobeModal: React.FC<AssignWardrobeModalProps> = ({ isOpen, onClose, wardrobe, onSave }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const handleToggle = (itemId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    const selectedItems = wardrobe.filter(item => selectedIds.has(item.id));
    // A simple sort could be added here if order matters, e.g., by item type
    onSave(selectedItems);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-xl text-textPrimary"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-wardrobe-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-borderLight">
              <h2 id="assign-wardrobe-title" className="text-2xl font-serif tracking-wider text-textPrimary flex items-center gap-2">
                <HangerIcon className="w-5 h-5" />
                Assign Wardrobe
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {wardrobe.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {wardrobe.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleToggle(item.id)}
                      className="relative w-full aspect-square rounded-lg overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent group"
                    >
                      {/* FIX: Access views from the first variant of the garment. */}
                      <img src={item.variants[0].views.front} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                      </div>
                      {selectedIds.has(item.id) && (
                        <div className="absolute inset-0 bg-accent/70 flex items-center justify-center">
                          <CheckCircle2Icon className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-textSecondary">
                  <p>Your wardrobe is empty.</p>
                  <p className="text-xs mt-1">You can add new garments in the Product Studio.</p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-borderLight flex justify-end bg-background/50">
              <button
                onClick={handleSave}
                className="w-full sm:w-auto flex items-center justify-center text-center bg-accent text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-accentHover active:scale-95 text-base"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Save Outfit ({selectedIds.size})
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssignWardrobeModal;
