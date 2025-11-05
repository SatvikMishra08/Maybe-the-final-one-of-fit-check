/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon, ShareIcon, DownloadIcon, CopyIcon, MailIcon, LinkIcon, CheckCircle2Icon } from './icons';
import { RenderStyle } from '../types';
import Spinner from './Spinner';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (quality: 'standard' | '4k', renderStyle: RenderStyle, setProgress: (p: { percent: number; message: string; }) => void) => Promise<string | void>;
  previewImageUrl: string | null;
}

const RENDER_STYLES: { name: RenderStyle, preview: string }[] = [
    { name: 'Digital Clean', preview: 'https://storage.googleapis.com/gemini-95-icons/digital-clean.jpg' },
    { name: 'Studio Portrait', preview: 'https://storage.googleapis.com/gemini-95-icons/studio-portrait.jpg' },
    { name: 'Editorial Film', preview: 'https://storage.googleapis.com/gemini-95-icons/editorial-film.jpg' },
];

const ShareExportModal: React.FC<ShareExportModalProps> = ({ isOpen, onClose, onDownload, previewImageUrl }) => {
    const [quality, setQuality] = useState<'standard' | '4k'>('standard');
    const [renderStyle, setRenderStyle] = useState<RenderStyle>('Digital Clean');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ percent: 0, message: '' });
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setTimeout(() => {
                setQuality('standard');
                setRenderStyle('Digital Clean');
                setIsProcessing(false);
                setError(null);
                setProgress({ percent: 0, message: '' });
                setCopyStatus('idle');
            }, 300);
        }
    }, [isOpen]);

    const handleDownloadClick = async () => {
        setError(null);
        setIsProcessing(true);

        try {
            const resultUrl = await onDownload(quality, renderStyle, setProgress);
            if (resultUrl) {
                const link = document.createElement('a');
                link.href = resultUrl;
                const fileName = `virtual-try-on-${quality}-${renderStyle.toLowerCase().replace(' ', '-')}-${Date.now()}.png`;
                link.download = fileName;
                link.click();
            }
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process and download image.');
            setIsProcessing(false);
            setProgress({ percent: 0, message: '' });
        }
    };
    
    const handleCopyToClipboard = async () => {
        if (!previewImageUrl || copyStatus === 'copied') return;
        try {
            const response = await fetch(previewImageUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch (err) {
            alert("Failed to copy image to clipboard. Your browser might not support this feature.");
        }
    }

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
                        className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl text-textPrimary"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="share-export-title"
                    >
                        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-borderLight">
                            <h2 id="share-export-title" className="text-2xl font-serif tracking-wider text-textPrimary flex items-center gap-3">
                                <ShareIcon className="w-6 h-6"/>
                                Share & Export
                            </h2>
                            <button onClick={onClose} className="p-1 rounded-full text-textSecondary hover:bg-gray-100 hover:text-textPrimary" aria-label="Close dialog">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row flex-grow min-h-0">
                            {/* Left Column: Image Preview */}
                            <div className="md:w-1/2 lg:w-3/5 flex-shrink-0 p-6 flex items-center justify-center bg-gray-50/70 border-b md:border-b-0 md:border-r border-borderLight">
                                {previewImageUrl ? (
                                    <img src={previewImageUrl} alt="Export preview" className="max-w-full max-h-full h-auto w-auto object-contain rounded-lg shadow-md" />
                                ) : (
                                    <div className="w-full aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center text-textSecondary">
                                        No image available
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Controls */}
                            <div className="md:w-1/2 lg:w-2/5 flex-grow p-6 flex flex-col space-y-6 overflow-y-auto">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-serif tracking-wider text-textPrimary">Share</h3>
                                    <div className="space-y-2">
                                        <button onClick={handleCopyToClipboard} className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-100 font-semibold text-sm">
                                            {copyStatus === 'copied' ? <CheckCircle2Icon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5 text-textSecondary"/>}
                                            <span>{copyStatus === 'copied' ? 'Image Copied!' : 'Copy Image'}</span>
                                        </button>
                                        <a href={`mailto:?subject=Check%20out%20this%20virtual%20try-on&body=I%20created%20this%20look!%20(You'll%20need%20to%20paste%20the%20image%20from%20your%20clipboard).`} className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-100 font-semibold text-sm">
                                            <MailIcon className="w-5 h-5 text-textSecondary"/>
                                            <span>Share via Email</span>
                                        </a>
                                        <button disabled className="w-full flex items-center gap-3 p-3 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm" title="Shareable link coming soon!">
                                            <LinkIcon className="w-5 h-5 text-textSecondary"/>
                                            <span>Get Shareable Link</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-lg font-serif tracking-wider text-textPrimary">Download Settings</h3>
                                    <div>
                                        <label className="block text-sm font-semibold text-textPrimary mb-2">Quality</label>
                                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                                            <button onClick={() => setQuality('standard')} className={`py-2 rounded-md text-sm font-semibold ${quality === 'standard' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>Standard</button>
                                            <button onClick={() => setQuality('4k')} className={`py-2 rounded-md text-sm font-semibold ${quality === '4k' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>4K (AI Upscaled)</button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                    {quality === '4k' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-textPrimary">Render Style <span className="text-xs text-textSecondary font-normal">(4K Only)</span></label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {RENDER_STYLES.map(style => (
                                                        <button key={style.name} onClick={() => setRenderStyle(style.name)} className={`relative p-1 border-2 rounded-lg ${renderStyle === style.name ? 'border-accent' : 'border-transparent hover:border-gray-300'}`}>
                                                            <img src={style.preview} alt={`${style.name} preview`} className="w-full h-20 object-cover rounded-md"/>
                                                            <p className="text-xs font-semibold mt-1.5 text-center">{style.name}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                    </AnimatePresence>
                                </div>
                                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm" role="alert">{error}</div>}
                                
                                <div className="flex-grow"></div>

                                <div className="flex-shrink-0 pt-4">
                                    <button
                                        onClick={handleDownloadClick}
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center text-center bg-accent text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-accentHover active:scale-95 text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? <Spinner /> : <DownloadIcon className="w-5 h-5 mr-2" />}
                                        {isProcessing ? 'Processing...' : 'Download Image'}
                                    </button>
                                </div>
                                
                                <AnimatePresence>
                                    {isProcessing && quality === '4k' && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="flex-shrink-0 pt-2 flex flex-col justify-center"
                                        >
                                           <div className="flex items-center gap-3">
                                               <div className="flex-grow">
                                                    <p className="text-sm font-semibold text-center">{progress.message}</p>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                                                        <div className="bg-accent h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress.percent}%` }}></div>
                                                    </div>
                                               </div>
                                           </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ShareExportModal;