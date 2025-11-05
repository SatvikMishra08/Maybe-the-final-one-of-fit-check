/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SparklesIcon } from './icons';

interface FinalDetailsPanelProps {
    onToggleFabricRealism: () => void;
    isFabricRealismActive: boolean;
    onToggleHumanizeModel: () => void;
    isHumanizeModelActive: boolean;
    isLoading: boolean;
    disabled: boolean;
}

const FinalDetailsPanel: React.FC<FinalDetailsPanelProps> = ({ 
    onToggleFabricRealism,
    isFabricRealismActive,
    onToggleHumanizeModel,
    isHumanizeModelActive,
    isLoading, 
    disabled 
}) => {
  return (
    <div>
        <p className="text-sm text-textSecondary mb-4">
            Toggle these switches to automatically apply hyper-realistic details. When turned on, you'll be asked to apply them to your existing outfit.
        </p>
        <div className="flex flex-col gap-3">
             <button
                onClick={onToggleFabricRealism}
                disabled={isLoading || disabled}
                className={`w-full text-center border font-semibold py-2.5 px-3 rounded-md transition-all duration-200 ease-in-out active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    isFabricRealismActive
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-white border-borderLight text-textPrimary hover:bg-gray-100 hover:border-gray-400'
                }`}
            >
                Fabric Realism: {isFabricRealismActive ? 'ON' : 'OFF'}
            </button>
             <button
                onClick={onToggleHumanizeModel}
                disabled={isLoading || disabled}
                className={`w-full text-center border font-semibold py-2.5 px-3 rounded-md transition-all duration-200 ease-in-out active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    isHumanizeModelActive
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-white border-borderLight text-textPrimary hover:bg-gray-100 hover:border-gray-400'
                }`}
            >
                Humanize Model: {isHumanizeModelActive ? 'ON' : 'OFF'}
            </button>
        </div>
    </div>
  );
};

export default React.memo(FinalDetailsPanel);