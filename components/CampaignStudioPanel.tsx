/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import Accordion from './Accordion';
import { CampaignBrief, CampaignModel, SavedModel, WardrobeItem, ProductGarment } from '../types';
import { ArrowRightIcon, PlusIcon, XIcon } from './icons';

interface CampaignStudioPanelProps {
  brief: CampaignBrief;
  models: CampaignModel[];
  savedModels: SavedModel[];
  // FIX: Add wardrobe to resolve outfit images
  wardrobe: WardrobeItem[];
  onBriefChange: (updates: Partial<CampaignBrief>) => void;
  onPoseChange: (slotId: 'model1' | 'model2', pose: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onAddModel: () => void;
  onRemoveModel: (slotId: 'model1' | 'model2') => void;
  onSelectModelClick: (slotId: 'model1' | 'model2') => void;
  onAssignWardrobeClick: (slotId: 'model1' | 'model2') => void;
}

const CampaignStudioPanel: React.FC<CampaignStudioPanelProps> = ({ 
    brief, 
    models, 
    savedModels,
    // FIX: Destructure wardrobe
    wardrobe,
    onBriefChange, 
    onPoseChange, 
    onGenerate, 
    isLoading,
    onAddModel,
    onRemoveModel,
    onSelectModelClick,
    onAssignWardrobeClick,
}) => {

    const getModelInfo = (modelId: string | null): SavedModel | undefined => {
        return savedModels.find(m => m.id === modelId);
    }

    return (
        <div className="space-y-4">
            <Accordion title="Art Direction" defaultOpen={true}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="campaign-objective" className="block text-sm font-semibold text-textPrimary mb-1">Campaign Objective</label>
                        <input
                            id="campaign-objective"
                            type="text"
                            value={brief.objective}
                            onChange={(e) => onBriefChange({ objective: e.target.value })}
                            placeholder="e.g., Fall fleece collection launch"
                            className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="campaign-scene" className="block text-sm font-semibold text-textPrimary mb-1">Scene & Location</label>
                        <input
                            id="campaign-scene"
                            type="text"
                            value={brief.scene}
                            onChange={(e) => onBriefChange({ scene: e.target.value })}
                            placeholder="e.g., A bustling train station at dawn"
                            className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isLoading}
                        />
                    </div>
                     <div>
                        <label htmlFor="campaign-lighting" className="block text-sm font-semibold text-textPrimary mb-1">Lighting Style</label>
                        <input
                            id="campaign-lighting"
                            type="text"
                            value={brief.lighting}
                            onChange={(e) => onBriefChange({ lighting: e.target.value })}
                            placeholder="e.g., Soft morning light"
                            className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="campaign-lens" className="block text-sm font-semibold text-textPrimary mb-1">Camera & Lens</label>
                        <select
                            id="campaign-lens"
                            value={brief.cameraLens}
                            onChange={(e) => onBriefChange({ cameraLens: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isLoading}
                        >
                            <option>35mm f/2.0 (Wide)</option>
                            <option>50mm f/1.4 (Standard)</option>
                            <option>85mm f/1.8 (Portrait)</option>
                            <option>135mm f/2.0 (Telephoto)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="campaign-framing" className="block text-sm font-semibold text-textPrimary mb-1">Framing & Crop</label>
                        <input
                            id="campaign-framing"
                            type="text"
                            value={brief.framingAndCrop}
                            onChange={(e) => onBriefChange({ framingAndCrop: e.target.value })}
                            placeholder="e.g., Full-body portrait shot, 9:16 aspect ratio"
                            className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </Accordion>
            <Accordion title="Model Casting & Styling" defaultOpen={true}>
                 <div className="space-y-4">
                    {models.map((model, index) => {
                        const modelInfo = getModelInfo(model.modelId);
                        return (
                            <div key={model.slotId} className="relative p-3 bg-gray-50 rounded-lg border border-borderLight space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {modelInfo ? (
                                            <img src={modelInfo.imageUrl} alt="Model preview" className="w-16 h-24 object-cover rounded-md flex-shrink-0 bg-gray-200" />
                                        ) : (
                                            <div className="w-16 h-24 bg-gray-200 rounded-md flex-shrink-0" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-textPrimary">Model {index + 1}</p>
                                            <button onClick={() => onSelectModelClick(model.slotId)} className="text-xs font-semibold text-accent hover:underline">
                                                {modelInfo ? 'Change Model' : 'Select Model'}
                                            </button>
                                        </div>
                                    </div>
                                    {index > 0 && (
                                        <button onClick={() => onRemoveModel(model.slotId)} className="absolute top-2 right-2 p-1 text-textSecondary hover:text-red-500 rounded-full hover:bg-red-100">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <button onClick={() => onAssignWardrobeClick(model.slotId)} className="w-full text-left text-xs font-semibold text-textPrimary mb-1 hover:underline">Outfit ({model.outfit.length} items):</button>
                                    <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-borderLight/50">
                                        {/* FIX: Resolve ProductGarment to display images */}
                                        {model.outfit.length > 0 ? model.outfit.map(pg => {
                                            const garment = wardrobe.find(w => w.id === pg.garmentId);
                                            const variant = garment?.variants.find(v => v.id === pg.variantId);
                                            if (!garment || !variant) return null;
                                            return <img key={`${pg.garmentId}-${pg.variantId}`} src={variant.views.front} alt={garment.name} className="w-10 h-10 object-cover rounded-md border border-borderLight" title={garment.name} />;
                                        }) : <p className="text-xs text-textSecondary">No items assigned.</p>}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor={`pose-instruction-${model.slotId}`} className="block text-xs font-semibold text-textPrimary mb-1">Pose & Interaction</label>
                                    <textarea
                                        id={`pose-instruction-${model.slotId}`}
                                        value={model.poseInstruction}
                                        onChange={(e) => onPoseChange(model.slotId, e.target.value)}
                                        placeholder={index === 0 ? "e.g., Leaning against a pillar..." : "e.g., Laughing with Model 1..."}
                                        className="w-full px-3 py-2 bg-white border border-borderLight rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm h-20 resize-none"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )
                    })}
                    <button onClick={onAddModel} disabled={isLoading || models.length >= 2} className="w-full text-sm font-semibold text-textSecondary p-2 rounded-md bg-gray-100 border border-borderLight hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                       <PlusIcon className="w-4 h-4"/> Add Second Model
                    </button>
                </div>
            </Accordion>
            
             <button
                onClick={onGenerate}
                disabled={isLoading || models.some(m => !m.modelId || !m.poseInstruction.trim())}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 bg-accent text-white rounded-lg hover:bg-accentHover disabled:bg-gray-400 disabled:cursor-not-allowed"
                aria-label="Generate campaign scene"
            >
                <ArrowRightIcon className="w-5 h-5" />
                Generate Scene
            </button>
        </div>
    );
};

export default CampaignStudioPanel;