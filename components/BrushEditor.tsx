/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { XIcon, Trash2Icon, RotateCcwIcon, ArrowRightIcon, EyeIcon } from './icons';
import Spinner from './Spinner';

interface BrushEditorProps {
  imageUrl: string;
  onCancel: () => void;
  onApply: (maskDataUrl: string, prompt: string) => void;
}

const BrushEditor: React.FC<BrushEditorProps> = ({ imageUrl, onCancel, onApply }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [brushSize, setBrushSize] = useState(40);
  const [isErasing, setIsErasing] = useState(false);
  const [brushPreset, setBrushPreset] = useState<'hard' | 'soft'>('hard');
  const [isPreviewingMask, setIsPreviewingMask] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, top: 0, left: 0 });

  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const history = useRef<ImageData[]>([]);

  const getCanvasContext = (canvas: HTMLCanvasElement | null) => {
    return canvas?.getContext('2d', { willReadFrequently: true });
  };
  
  const renderMaskPreview = useCallback(() => {
    const displayCtx = getCanvasContext(displayCanvasRef.current);
    const maskCanvas = maskCanvasRef.current;
    if (!displayCtx || !maskCanvas) return;
  
    displayCtx.clearRect(0, 0, displayCtx.canvas.width, displayCtx.canvas.height);
  
    if (isPreviewingMask) {
      if (!tempPreviewCanvasRef.current) {
        tempPreviewCanvasRef.current = document.createElement('canvas');
      }
      const tempCanvas = tempPreviewCanvasRef.current;
      tempCanvas.width = maskCanvas.width;
      tempCanvas.height = maskCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
  
      if (tempCtx) {
        // Draw mask
        tempCtx.drawImage(maskCanvas, 0, 0);
        // Overlay with red color
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = 'rgba(239, 68, 68, 0.7)'; // red-500 with transparency
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        // Draw back to display canvas
        displayCtx.globalCompositeOperation = 'source-over';
        displayCtx.drawImage(tempCanvas, 0, 0, displayCtx.canvas.width, displayCtx.canvas.height);
      }
    }
  }, [isPreviewingMask]);

  const setupCanvases = useCallback(() => {
    const imageElement = containerRef.current?.querySelector('img');
    if (!imageElement || !displayCanvasRef.current || !maskCanvasRef.current) return;

    const { naturalWidth, naturalHeight, clientWidth, clientHeight, offsetTop, offsetLeft } = imageElement;
    
    setImageSize({ width: clientWidth, height: clientHeight, top: offsetTop, left: offsetLeft });

    displayCanvasRef.current.width = clientWidth;
    displayCanvasRef.current.height = clientHeight;
    maskCanvasRef.current.width = naturalWidth;
    maskCanvasRef.current.height = naturalHeight;

    const maskCtx = getCanvasContext(maskCanvasRef.current);
    if(maskCtx) {
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCtx.canvas.width, maskCtx.canvas.height);
        history.current = [maskCtx.getImageData(0, 0, maskCtx.canvas.width, maskCtx.canvas.height)];
    }
    renderMaskPreview();
  }, [renderMaskPreview]);
  
  useEffect(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageUrl;
    image.onload = setupCanvases;
    window.addEventListener('resize', setupCanvases);
    return () => window.removeEventListener('resize', setupCanvases);
  }, [imageUrl, setupCanvases]);

  useEffect(() => {
    renderMaskPreview();
  }, [isPreviewingMask, renderMaskPreview]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : null;
    let pressure = 0.5;
    if (touch && 'force' in touch && (touch as any).force > 0) {
        pressure = (touch as any).force;
    } else if ('pressure' in e && (e.pressure as number) > 0) {
        pressure = e.pressure as number;
    }

    return {
      x: (touch ? touch.clientX : (e as React.MouseEvent).clientX) - rect.left,
      y: (touch ? touch.clientY : (e as React.MouseEvent).clientY) - rect.top,
      pressure,
    };
  };

  const drawOnCanvas = (x: number, y: number, pressure: number) => {
    const displayCtx = getCanvasContext(displayCanvasRef.current);
    const maskCtx = getCanvasContext(maskCanvasRef.current);
    if (!displayCtx || !maskCtx || !lastPoint.current) return;

    const scaleX = maskCtx.canvas.width / displayCtx.canvas.width;
    const scaleY = maskCtx.canvas.height / displayCtx.canvas.height;
    const currentBrushSize = brushSize * (pressure > 0.1 ? pressure : 0.5);

    const draw = (ctx: CanvasRenderingContext2D, isMask: boolean) => {
        const size = isMask ? currentBrushSize * scaleX : currentBrushSize;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if(isMask) {
            ctx.strokeStyle = isErasing ? 'black' : 'white';
            ctx.globalCompositeOperation = 'source-over';
        } else {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
        }

        if (brushPreset === 'soft') {
            ctx.shadowBlur = size / 2;
            ctx.shadowColor = isMask ? (isErasing ? 'black' : 'white') : 'rgba(239, 68, 68, 0.7)';
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.moveTo(
            isMask ? lastPoint.current.x * scaleX : lastPoint.current.x,
            isMask ? lastPoint.current.y * scaleY : lastPoint.current.y
        );
        ctx.lineTo(
            isMask ? x * scaleX : x,
            isMask ? y * scaleY : y
        );
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset for performance
    };
    
    if (!isPreviewingMask) draw(displayCtx, false);
    draw(maskCtx, true);
    
    lastPoint.current = { x, y };
  };

  const handleStartDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const { x, y } = getCoords(e);
    lastPoint.current = { x, y };

    const maskCtx = getCanvasContext(maskCanvasRef.current);
    if(maskCtx) {
        history.current.push(maskCtx.getImageData(0, 0, maskCtx.canvas.width, maskCtx.canvas.height));
        if (history.current.length > 20) history.current.shift(); // Limit undo history
    }
  };

  const handleDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const { x, y, pressure } = getCoords(e);
    drawOnCanvas(x, y, pressure);
    if(isPreviewingMask) renderMaskPreview();
  };
  
  const handleEndDrawing = () => { isDrawing.current = false; lastPoint.current = null; };
  
  const handleUndo = () => {
    if (history.current.length <= 1) return;
    history.current.pop();
    const lastState = history.current[history.current.length - 1];
    
    const maskCtx = getCanvasContext(maskCanvasRef.current);
    if (maskCtx) {
        maskCtx.putImageData(lastState, 0, 0);
        renderMaskPreview();
    }
  };

  const handleClear = () => {
    const maskCtx = getCanvasContext(maskCanvasRef.current);
    if (maskCtx) {
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, maskCtx.canvas.width, maskCtx.canvas.height);
      history.current = [maskCtx.getImageData(0, 0, maskCtx.canvas.width, maskCtx.canvas.height)];
      renderMaskPreview();
    }
  };

  const handleApply = async () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas || !prompt.trim()) return;
    setIsLoading(true);
    const maskDataUrl = maskCanvas.toDataURL('image/png');
    await onApply(maskDataUrl, prompt);
  };

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-40 flex flex-col items-center justify-center"
    >
        <div ref={containerRef} className="relative w-full h-full flex items-center justify-center p-4">
            <img 
                src={imageUrl} 
                alt="Model to edit" 
                className="max-w-full max-h-full object-contain pointer-events-none" 
            />
            <canvas
                ref={displayCanvasRef}
                className="absolute"
                style={{
                    width: `${imageSize.width}px`,
                    height: `${imageSize.height}px`,
                    top: `${imageSize.top}px`,
                    left: `${imageSize.left}px`,
                    touchAction: 'none',
                    cursor: 'crosshair',
                }}
                onMouseDown={handleStartDrawing}
                onMouseMove={handleDrawing}
                onMouseUp={handleEndDrawing}
                onMouseLeave={handleEndDrawing}
                onTouchStart={handleStartDrawing}
                onTouchMove={handleDrawing}
                onTouchEnd={handleEndDrawing}
            />
            <canvas ref={maskCanvasRef} className="hidden" />
        </div>
        
        <div className="absolute bottom-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-3 flex flex-col items-center gap-3 w-[95%] max-w-2xl" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0))'}}>
            {/* Top row: Tool Controls */}
            <div className="flex items-center justify-between w-full gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={handleUndo} title="Undo" className="p-3 rounded-full hover:bg-gray-200"><RotateCcwIcon className="w-5 h-5"/></button>
                    <button onClick={handleClear} title="Clear Mask" className="p-3 rounded-full hover:bg-gray-200"><Trash2Icon className="w-5 h-5"/></button>
                    <button onClick={() => setIsPreviewingMask(!isPreviewingMask)} title="Preview Mask" className={`p-3 rounded-full ${isPreviewingMask ? 'bg-accent/10 text-accent' : 'hover:bg-gray-200'}`}><EyeIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex-grow flex items-center gap-2 order-3 sm:order-2 w-full sm:w-auto">
                    <label htmlFor="brush-size" className="text-sm font-medium sr-only">Brush Size</label>
                    <input id="brush-size" type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
                </div>
                <div className="flex items-center gap-2 order-2 sm:order-3">
                  <div className="p-0.5 bg-gray-200 rounded-lg flex">
                    <button onClick={() => setBrushPreset('hard')} className={`py-1.5 px-3 rounded-md text-xs font-semibold ${brushPreset === 'hard' ? 'bg-white shadow-sm' : ''}`}>Hard</button>
                    <button onClick={() => setBrushPreset('soft')} className={`py-1.5 px-3 rounded-md text-xs font-semibold ${brushPreset === 'soft' ? 'bg-white shadow-sm' : ''}`}>Soft</button>
                  </div>
                  <button onClick={() => setIsErasing(!isErasing)} className={`py-2 px-3 rounded-md border text-sm font-semibold whitespace-nowrap ${isErasing ? 'bg-accent/10 border-accent text-accent' : 'border-gray-300 bg-white hover:bg-gray-100'}`}>Erase</button>
                </div>
            </div>

            {/* Bottom row: Prompt & Apply */}
            <div className="flex items-center gap-2 w-full">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your edit..."
                    className="w-full px-4 py-3 bg-white border border-borderLight rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button onClick={handleApply} disabled={!prompt.trim() || isLoading} className="p-3 bg-accent text-white rounded-full hover:bg-accentHover disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0">
                    {isLoading ? <Spinner /> : <ArrowRightIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>

        <button onClick={onCancel} className="absolute top-4 right-4 bg-white/60 p-2 rounded-full hover:bg-white backdrop-blur-sm" aria-label="Cancel edit" style={{ top: 'calc(1rem + env(safe-area-inset-top, 0))'}}>
            <XIcon className="w-6 h-6 text-textPrimary"/>
        </button>
    </motion.div>
  );
};

export default BrushEditor;