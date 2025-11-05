/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WardrobeItem, FlatLayProduct, DetailShot } from '../types';
import { XIcon } from './icons';

interface LibraryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    library: FlatLayProduct[];
    detailShotLibrary: { [garmentId: string]: DetailShot[] };
    activeGarment: WardrobeItem | null | undefined;
    onImageSelect: (imageUrl: string) => void;
}

const LibraryDrawer: React.FC<LibraryDrawerProps> = ({
    isOpen,
    onClose,
    library,
    detailShotLibrary,
    activeGarment,
    onImageSelect,
}) => {
    // These checks are important to prevent crashes if the drawer is opened with bad data.
    const garmentLibrary = activeGarment ? library.filter(item => item.garmentId === activeGarment.id) : [];
    const garmentDetailShots = activeGarment ? detailShotLibrary[activeGarment.id] || [] : [];

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
                    >
                        <div className="flex items-center justify-between p-4 border-b border-borderLight">
                            <h2 className="text-2xl font-serif tracking-wider text-textPrimary">
                                Library: {activeGarment?.name || 'All Content'}
                            </h2>
                            <button onClick={onClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {(garmentLibrary.length > 0 || garmentDetailShots.length > 0) ? (
                                <div className="space-y-6">
                                    {garmentLibrary.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-serif text-textPrimary mb-3">Flat Lays</h3>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {garmentLibrary.map(item => (
                                                    <button key={item.id} onClick={() => onImageSelect(item.imageUrl)} className="aspect-square border rounded-lg overflow-hidden group">
                                                        <img src={item.imageUrl} alt="Generated flat lay" className="w-full h-full object-cover"/>
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {garmentDetailShots.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-serif text-textPrimary mb-3">Detail Shots</h3>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {garmentDetailShots.map(shot => (
                                                    <button key={shot.id} onClick={() => onImageSelect(shot.imageUrl)} className="aspect-square border rounded-lg overflow-hidden group relative">
                                                        <img src={shot.imageUrl} alt={shot.description} className="w-full h-full object-cover"/>
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex flex-col justify-end">
                                                            <p className="text-white text-[10px] font-semibold leading-tight">{shot.description}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-sm text-textSecondary py-10">
                                    <p>No generated content for this garment yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LibraryDrawer;
