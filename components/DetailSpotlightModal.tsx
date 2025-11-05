/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { WardrobeItem, DetailShot } from '../types';
import { XIcon, SparklesIcon, ArrowRightIcon, DownloadIcon } from './icons';
import { getFriendlyErrorMessage } from '../lib/utils';
import Spinner from './Spinner';

interface DetailSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  garment: WardrobeItem | null;
  onGenerate: (garment: WardrobeItem, croppedImageUrl: string, lighting: string, description: string) => void;
  existingShots: DetailShot[] | undefined;
}

type LightingStyle = 'Studio' | 'Natural Light' | 'Dramatic';

const cropImage = (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number; }): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );
            resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = (error) => reject(error);
    });
};


const DetailSpotlightModal: React.FC<DetailSpotlightModalProps> = ({ isOpen, onClose, garment, onGenerate, existingShots = [] }) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const [lighting, setLighting] = useState<LightingStyle>('Studio');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

    // Guard against opening with invalid or incomplete garment data.
    // A malformed garment object can cause a crash on `garment.views.front`,
    // leaving a black modal overlay and making the UI unresponsive.
    // FIX: Check for the nested variants array instead of the top-level views property.
    if (!garment || !garment.variants || garment.variants.length === 0 || !garment.variants[0].views.front) {
        // Log an error if the modal was supposed to be open, to help debugging.
        if (isOpen) {
          console.error('DetailSpotlightModal opened with invalid garment data:', garment);
        }
        return null;
    }


    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setCrop(undefined);
            setCompletedCrop(undefined);
            setLighting('Studio');
            setDescription('');
            setIsLoading(false);
            setError(null);
        }, 300);
    };

    const handleGenerate = async () => {
        if (!garment || !completedCrop || !description.trim() || !imgElement) {
            setError('Please select an area on the image and provide a description.');
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            const scaleX = imgElement.naturalWidth / imgElement.width;
            const scaleY = imgElement.naturalHeight / imgElement.height;
            const pixelCrop = {
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY,
            };

            // FIX: Access views from the first variant of the garment.
            const croppedDataUrl = await cropImage(garment.variants[0].views.front, pixelCrop);
            
            await onGenerate(garment, croppedDataUrl, lighting, description);
            
            setDescription('');

        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Failed to generate detail shot.'));
        } finally {
            setIsLoading(false);
        }
    };
    
    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        setImgElement(e.currentTarget);
        const { width, height } = e.currentTarget;
        const newCrop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 50,
            },
            1,
            width,
            height,
          ),
          width,
          height,
        );
        setCrop(newCrop);
        setCompletedCrop(newCrop);
    }

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
                        className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl text-textPrimary"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="detail-spotlight-title"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-borderLight">
                            <h2 id="detail-spotlight-title" className="text-2xl font-serif tracking-wider text-textPrimary flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5" />
                                Detail Spotlight: {garment?.name}
                            </h2>
                            <button onClick={handleClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row flex-grow min-h-0">
                            {/* Left: Editor */}
                            <div className="flex-grow flex flex-col p-4 bg-gray-50/50">
                                <div className="relative flex-grow flex items-center justify-center min-h-0">
                                    {/* FIX: Access views from the first variant of the garment. */}
                                    {garment?.variants[0].views.front && (
                                        <ReactCrop
                                            crop={crop}
                                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                                            onComplete={(c) => setCompletedCrop(c)}
                                            aspect={1}
                                            className="max-w-full max-h-full"
                                        >
                                            <img
                                                src={garment.variants[0].views.front}
                                                alt="Garment front view"
                                                className="max-w-full max-h-[50vh] md:max-h-full object-contain"
                                                onLoad={onImageLoad}
                                            />
                                        </ReactCrop>
                                    )}
                                </div>
                                <div className="flex-shrink-0 pt-4 space-y-3">
                                    {error && <div className="text-red-500 text-sm text-center" role="alert">{error}</div>}
                                    <div>
                                        <label className="text-sm font-semibold text-textPrimary mb-2 block">1. Lighting Style</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['Studio', 'Natural Light', 'Dramatic'] as LightingStyle[]).map(style => (
                                                <button key={style} onClick={() => setLighting(style)} className={`p-2 border rounded-md text-sm text-center font-semibold ${lighting === style ? 'bg-accent/10 border-accent text-accent' : 'border-borderLight hover:bg-gray-100'}`}>{style}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="area-description" className="text-sm font-semibold text-textPrimary mb-1 block">2. Describe the selected area</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="area-description"
                                                type="text"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="e.g., Close up of the collar stitching"
                                                className="w-full px-4 py-2 bg-white border border-borderLight rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                                            />
                                            <button onClick={handleGenerate} disabled={isLoading || !completedCrop || !description} className="p-3 bg-accent text-white rounded-full hover:bg-accentHover disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0">
                                                {isLoading ? <Spinner /> : <ArrowRightIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right: Gallery */}
                            <div className="w-full md:w-80 flex-shrink-0 border-t md:border-t-0 md:border-l border-borderLight p-4 overflow-y-auto">
                                <h3 className="font-serif text-lg tracking-wider mb-3">Generated Shots</h3>
                                {existingShots.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {existingShots.map(shot => (
                                            <div key={shot.id} className="relative group aspect-square">
                                                <img src={shot.imageUrl} alt={shot.description} className="w-full h-full object-cover rounded-md bg-gray-100 border border-borderLight" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex flex-col justify-end">
                                                    <p className="text-white text-[10px] font-semibold leading-tight">{shot.description}</p>
                                                    <p className="text-white/80 text-[9px] leading-tight">{shot.lighting}</p>
                                                </div>
                                                <a href={shot.imageUrl} download={`detail-shot-${garment.id}-${shot.id}.png`} className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity" title="Download image">
                                                    <DownloadIcon className="w-4 h-4" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-textSecondary pt-10">
                                        <p>Your generated detail shots will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DetailSpotlightModal;