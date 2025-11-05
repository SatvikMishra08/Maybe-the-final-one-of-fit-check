/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Product } from '../types';
import { ChevronLeftIcon, PlusIcon, BookmarkIcon } from './icons';

interface ProductGridProps {
  products: Product[];
  collectionName: string;
  onProductSelect: (productId: string) => void;
  onBack: () => void;
  onNewProductClick?: () => void;
  isLookbook?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, collectionName, onProductSelect, onBack, onNewProductClick, isLookbook = false }) => {
  return (
    <div className="flex flex-col">
      <div className="border-b border-borderLight/50 pb-2 mb-3 relative flex items-center">
         <button onClick={onBack} className="absolute left-0 p-1 -ml-1 text-textSecondary hover:text-textPrimary">
             <ChevronLeftIcon className="w-5 h-5" />
         </button>
        <h2 className="text-xl font-serif tracking-wider text-textPrimary text-center flex-grow">{collectionName}</h2>
      </div>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
                <button
                    key={product.id}
                    onClick={() => onProductSelect(product.id)}
                    className="aspect-square border rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent w-full group relative"
                    aria-label={`Select ${product.name}`}
                    title={product.isSavedLook ? product.lookName : (product.metadata.notes || `Select ${product.name}`)}
                >
                    <img src={product.variations[product.variations.length - 1].imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-bold text-left">{product.isSavedLook ? product.lookName : product.name}</p>
                    </div>
                    {product.isSavedLook && !isLookbook && (
                      <div className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 backdrop-blur-sm" title="Saved to Lookbook">
                        <BookmarkIcon className="w-3 h-3 fill-white" />
                      </div>
                    )}
                </button>
            ))}
            {onNewProductClick && !isLookbook && (
                 <button
                    onClick={onNewProductClick}
                    className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-textSecondary transition-colors hover:border-gray-400 hover:text-textPrimary cursor-pointer"
                >
                    <PlusIcon className="w-6 h-6 mb-1"/>
                    <span className="text-xs text-center font-semibold">New Product</span>
                </button>
            )}
        </div>
      ) : (
        <div className="text-center text-sm text-textSecondary pt-4 flex flex-col items-center gap-4">
            <p>{isLookbook ? "You haven't saved any looks yet." : 'No products in this collection yet.'}</p>
            {onNewProductClick && !isLookbook && (
                <button
                    onClick={onNewProductClick}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 bg-gray-100 rounded-lg hover:bg-gray-200 border border-borderLight/60 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" /> Create First Product
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ProductGrid);