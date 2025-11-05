/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShootTemplate } from '../types';
import { XIcon, SparklesIcon } from './icons';

interface ChangeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  templates: ShootTemplate[];
  currentTemplateId: string | null;
}

const ChangeTemplateModal: React.FC<ChangeTemplateModalProps> = ({ isOpen, onClose, onSelect, templates, currentTemplateId }) => {
  const handleSelect = (templateId: string) => {
    if (templateId !== currentTemplateId) {
      onSelect(templateId);
    }
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
            className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl text-textPrimary"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-template-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-borderLight">
              <h2 id="change-template-title" className="text-2xl font-serif tracking-wider text-textPrimary flex items-center gap-2">
                <SparklesIcon className="w-5 h-5"/>
                Change Shoot Style
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-grow">
                {templates.map(template => (
                    <button
                        key={template.id}
                        onClick={() => handleSelect(template.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            template.id === currentTemplateId
                                ? 'bg-accent/10 border-accent cursor-default'
                                : 'bg-white border-borderLight/60 hover:bg-gray-100'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <p className="font-semibold text-textPrimary">{template.name}</p>
                            {template.id === currentTemplateId && (
                                <span className="text-xs font-semibold text-accent bg-accent/20 px-2 py-0.5 rounded-full">Current</span>
                            )}
                        </div>
                        <p className="text-sm text-textSecondary mt-1">{template.description}</p>
                    </button>
                ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChangeTemplateModal;