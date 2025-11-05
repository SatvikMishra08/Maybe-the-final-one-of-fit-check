/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SavedModel } from '../types';
import { XIcon, PersonStandingIcon } from './icons';

interface SelectCampaignModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedModels: SavedModel[];
  onSelect: (modelId: string) => void;
}

const SelectCampaignModelModal: React.FC<SelectCampaignModelModalProps> = ({ isOpen, onClose, savedModels, onSelect }) => {
  const handleSelect = (modelId: string) => {
    onSelect(modelId);
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
            className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl text-textPrimary"
            role="dialog"
            aria-modal="true"
            aria-labelledby="select-model-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-borderLight">
              <h2 id="select-model-title" className="text-2xl font-serif tracking-wider text-textPrimary flex items-center gap-2">
                <PersonStandingIcon className="w-5 h-5" />
                Select a Model
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {savedModels.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {savedModels.map(model => (
                    <div key={model.id} className="flex flex-col items-center">
                      <button
                        onClick={() => handleSelect(model.id)}
                        className="w-full aspect-[2/3] rounded-lg overflow-hidden border border-borderLight hover:border-accent group focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <img src={model.imageUrl} alt={model.name} className="w-full h-full object-cover" />
                      </button>
                      <p className="text-sm font-semibold mt-2 text-center truncate w-full">{model.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-textSecondary">
                  <p>You haven't saved any models yet.</p>
                  <p className="text-xs mt-1">You can save your current model from the canvas view.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectCampaignModelModal;