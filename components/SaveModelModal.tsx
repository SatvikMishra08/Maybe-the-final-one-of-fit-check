/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon, BookmarkIcon } from './icons';

interface SaveModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  previewImageUrl: string | null;
}

const SaveModelModal: React.FC<SaveModelModalProps> = ({ isOpen, onClose, onSave, previewImageUrl }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
    }
  }, [isOpen]);

  const handleSaveClick = () => {
    if (!name.trim()) {
      setError('Please enter a name for your model.');
      return;
    }
    onSave(name.trim());
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
            className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl text-textPrimary"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-model-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-borderLight">
              <h2 id="save-model-title" className="text-2xl font-serif tracking-wider text-textPrimary flex items-center gap-2">
                <BookmarkIcon className="w-5 h-5" />
                Save to Model Library
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {previewImageUrl && (
                <div className="w-full aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden border border-borderLight">
                  <img src={previewImageUrl} alt="Model preview" className="w-full h-full object-contain" />
                </div>
              )}
              {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}
              <div>
                <label htmlFor="model-name" className="block text-sm font-semibold text-textPrimary mb-1">Model Name</label>
                <input
                  id="model-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Default Model"
                  className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-borderLight flex justify-end bg-background/50">
              <button
                onClick={handleSaveClick}
                disabled={!name.trim()}
                className="w-full sm:w-auto flex items-center justify-center text-center bg-accent text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-accentHover active:scale-95 text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save Model
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SaveModelModal;