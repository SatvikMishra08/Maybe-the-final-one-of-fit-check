/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Collection } from '../types';
import { ChevronRightIcon, PlusIcon, ArrowRightIcon, BookmarkIcon } from './icons';

interface CollectionPanelProps {
  collections: Collection[];
  onCollectionSelect: (collectionId: string) => void;
  onCollectionCreate: (collectionName: string) => void;
  onLookbookClick: () => void;
}

const CollectionPanel: React.FC<CollectionPanelProps> = ({ collections, onCollectionSelect, onCollectionCreate, onLookbookClick }) => {
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (newCollectionName.trim()) {
      onCollectionCreate(newCollectionName.trim());
      setNewCollectionName('');
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <div className="flex flex-col">
        <div className="border-b border-borderLight/50 pb-4 mb-4">
             <button
                onClick={onLookbookClick}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 border border-accent/20 transition-colors mb-4"
            >
                <BookmarkIcon className="w-4 h-4" /> My Lookbook
            </button>
            <h2 className="text-xl font-serif tracking-wider text-textPrimary">Collections</h2>
            <p className="text-sm text-textSecondary mt-1">Group your generated products into collections.</p>
        </div>
        <div className="space-y-2">
            {collections.map(collection => (
                <button
                    key={collection.id}
                    onClick={() => onCollectionSelect(collection.id)}
                    className="w-full flex items-start justify-between text-left p-3 bg-white rounded-lg hover:bg-gray-100 border border-borderLight/60 transition-colors"
                >
                    <div className="flex-grow">
                        <span className="font-semibold">{collection.name}</span>
                        {collection.description && (
                            <p className="text-xs text-textSecondary mt-1 pr-2">{collection.description}</p>
                        )}
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-textSecondary flex-shrink-0 mt-0.5" />
                </button>
            ))}
        </div>

        <div className="mt-4 pt-4 border-t border-borderLight/50">
        {isCreating ? (
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., Summer 2024"
                    className="w-full px-4 py-2 bg-white border border-borderLight rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                />
                <button
                    onClick={handleCreate}
                    disabled={!newCollectionName.trim()}
                    className="p-3 bg-accent text-white rounded-full transition-colors hover:bg-accentHover disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label="Create new collection"
                >
                    <ArrowRightIcon className="w-5 h-5" />
                </button>
            </div>
        ) : (
             <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 bg-gray-100 rounded-lg hover:bg-gray-200 border border-borderLight/60 transition-colors"
            >
                <PlusIcon className="w-4 h-4" /> Create New Collection
            </button>
        )}
        </div>
    </div>
  );
};

export default React.memo(CollectionPanel);