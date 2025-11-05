/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PencilIcon } from './icons';

interface ModelInfoOverlayProps {
  height?: string;
  recommendedSize?: string;
  onUpdateHeight: (newHeight: string) => void;
}

const ModelInfoOverlay: React.FC<ModelInfoOverlayProps> = ({ height, recommendedSize, onUpdateHeight }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHeight, setEditedHeight] = useState(height || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedHeight(height || '');
  }, [height]);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdateHeight(editedHeight);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedHeight(height || '');
      setIsEditing(false);
    }
  };

  const shouldShow = height || recommendedSize || isEditing;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-semibold px-3 py-2 rounded-lg backdrop-blur-sm pointer-events-auto group z-20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          {isEditing ? (
            <div className="flex items-center gap-2">
                <label htmlFor="height-edit" className="whitespace-nowrap">Height:</label>
                <input
                    ref={inputRef}
                    id="height-edit"
                    type="text"
                    value={editedHeight}
                    onChange={(e) => setEditedHeight(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent outline-none w-24 border-b border-white/50 focus:border-white"
                />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {height && (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                  <span>Height: {height}</span>
                  <PencilIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              {recommendedSize && <p>Recommended Size: <span className="font-bold text-base">{recommendedSize}</span></p>}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModelInfoOverlay;