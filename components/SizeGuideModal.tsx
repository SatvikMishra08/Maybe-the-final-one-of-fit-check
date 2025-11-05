/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon, RulerIcon } from './icons';
import { WardrobeItem } from '../types';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WardrobeItem | null;
  recommendedSize?: string;
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, item, recommendedSize }) => {
  const measurementDimensions = useMemo(() => {
    if (!item?.measurements) return [];
    const dimensions = new Set<string>();
    item.measurements.forEach(size => {
      size.measurements.forEach(m => dimensions.add(m.dimension));
    });
    return Array.from(dimensions);
  }, [item]);

  if (!item) return null;

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
            aria-labelledby="size-guide-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-borderLight">
              <h2 id="size-guide-title" className="text-2xl font-serif tracking-wider text-textPrimary flex items-center gap-2">
                <RulerIcon className="w-5 h-5" />
                Size Guide: {item.name}
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {item.measurements && item.measurements.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-textSecondary">
                        <thead className="text-xs text-textPrimary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Size</th>
                                {measurementDimensions.map(dim => (
                                    <th key={dim} scope="col" className="px-6 py-3 capitalize">
                                        {dim.replace('_', ' ')} ({item.measurements![0].unit})
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {item.measurements.map(size => {
                                const isRecommended = size.sizeLabel === recommendedSize;
                                const measurementMap = new Map(size.measurements.map(m => [m.dimension, m.value]));
                                return (
                                    <tr key={size.id} className={`border-b ${isRecommended ? 'bg-accent/10' : 'bg-white'}`}>
                                        <th scope="row" className={`px-6 py-4 font-bold ${isRecommended ? 'text-accent' : 'text-textPrimary'}`}>
                                            {size.sizeLabel}
                                            {isRecommended && <span className="block text-xs font-normal">Recommended</span>}
                                        </th>
                                        {measurementDimensions.map(dim => (
                                            <td key={dim} className="px-6 py-4">
                                                {measurementMap.get(dim) ?? '-'}
                                            </td>
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
              ) : (
                <p className="text-center text-textSecondary">No measurement data available for this item.</p>
              )}
               <p className="text-xs text-textSecondary mt-4 text-center">All measurements are approximate and may vary slightly.</p>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-borderLight flex justify-end bg-background/50">
                <button
                    onClick={onClose}
                    className="w-full sm:w-auto flex items-center justify-center text-center bg-gray-200 text-textPrimary font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-gray-300"
                >
                    Close
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SizeGuideModal;