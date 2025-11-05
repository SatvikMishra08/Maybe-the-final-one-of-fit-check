/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { FunctionCall } from "@google/genai";

// A map where keys are tool names and values are the functions that handle them.
// Handlers are now async functions that do not return a value.
export type ToolHandlers = {
    [key: string]: (args: any) => Promise<void>;
};


/**
 * Generates a user-facing acknowledgement message for a tool call.
 */
export const getAcknowledgementForTool = (toolCall: FunctionCall): string | null => {
    switch (toolCall.name) {
        case 'addLayer':
            return `Okay, adding the ${toolCall.args.garmentName}...`;
        case 'removeLastGarment':
            return `Okay, removing the top layer...`;
        case 'removeSpecificGarment':
            return `Okay, removing the ${toolCall.args.garmentName}...`;
        case 'reorderGarments':
            return `Okay, reordering the garments...`;
        case 'changePose':
            return `Okay, changing the pose to "${toolCall.args.prompt}"...`;
        case 'changeBackground':
            return `Okay, changing the background to "${toolCall.args.description}"...`;
        case 'changeLighting':
            return `Okay, changing the lighting to "${toolCall.args.style}"...`;
        case 'editGarment':
            return `Okay, applying the edit: "${toolCall.args.prompt}"...`;
        case 'suggestGarmentFromPrompt':
            return `I can help with that! Let's see about creating a "${toolCall.args.garmentDescription}"...`;
        case 'generateCampaign':
            return `Alright, let's set up that campaign: "${toolCall.args.campaignStyle}"...`;
        default:
            // For tools like createArtisticPlan, we don't need an immediate acknowledgement,
            // as its output (the plan card) is the acknowledgement.
            return null;
    }
};


/**
 * Executes the appropriate handler for a given tool call from a map of handlers.
 */
export const toolExecutor = async (toolCall: FunctionCall, handlers: ToolHandlers): Promise<void> => {
    const handler = handlers[toolCall.name];
    if (handler) {
        try {
            await handler(toolCall.args);
        } catch (e) {
            console.error(`Error executing tool: ${toolCall.name}`, e);
            // Re-throw the error so the calling function can handle UI updates
            throw e;
        }
    } else {
        const errorMsg = `Unknown tool: ${toolCall.name}`;
        console.warn(errorMsg);
        throw new Error(errorMsg);
    }
};
