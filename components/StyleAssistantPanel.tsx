/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendIcon, ArrowRightIcon, PaperclipIcon, XIcon, SpeakerWaveIcon, SpeakerOffIcon, ClipboardListIcon, PersonStandingIcon, ImageIcon, SunIcon, SparklesIcon, CheckCircle2Icon, CircleIcon } from './icons';
import { ChatMessage, ArtisticPlan, PlanExecutionState, MessagePart } from '../types';
import Spinner from './Spinner';

interface StyleAssistantPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, image?: File) => void;
  isAssistantLoading: boolean;
  onBack?: () => void;
  isMobile?: boolean;
  isTtsEnabled: boolean;
  onToggleTts: () => void;
  disabled?: boolean;
  planExecution: PlanExecutionState;
  onPlanApprove: () => void;
  onPlanCancel: () => void;
}

const SuggestionChips: React.FC<{ suggestions: string[], onSelect: (suggestion: string) => void, disabled?: boolean }> = ({ suggestions, onSelect, disabled = false }) => {
    return (
        <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(suggestion)}
                    disabled={disabled}
                    className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
};


const getIconForTool = (tool: string) => {
    switch (tool) {
        case 'changePose': return <PersonStandingIcon className="w-5 h-5 text-accent" />;
        case 'changeBackground': return <ImageIcon className="w-5 h-5 text-accent" />;
        case 'changeLighting': return <SunIcon className="w-5 h-5 text-accent" />;
        case 'editGarment': return <SparklesIcon className="w-5 h-5 text-accent" />;
        default: return <ClipboardListIcon className="w-5 h-5 text-accent" />;
    }
};

const PlanSteps: React.FC<{ plan: ArtisticPlan, executionState: PlanExecutionState }> = ({ plan, executionState }) => {
    const { status, currentStepIndex } = executionState;
    const isCompleteOrExecuting = status === 'complete' || status === 'executing' || status === 'verifying';

    return (
        <div className="space-y-2.5">
            {plan.steps.map((step, index) => {
                const isStepComplete = status === 'complete' || (isCompleteOrExecuting && currentStepIndex > index);
                const isCurrentStep = isCompleteOrExecuting && currentStepIndex === index;
                
                return (
                    <div key={step.stepNumber} className={`flex items-start gap-3 transition-opacity ${!isCurrentStep && !isStepComplete ? 'opacity-60' : ''}`}>
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                            {isStepComplete ? (
                                <CheckCircle2Icon className="w-6 h-6 text-green-500" />
                            ) : isCurrentStep ? (
                                <Spinner />
                            ) : (
                                <CircleIcon className="w-6 h-6 text-gray-300" />
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-textPrimary leading-tight">{step.toolToUse.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                            <p className="text-sm text-textSecondary leading-tight">{step.reason}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const PlanApprovalCard: React.FC<{ plan: ArtisticPlan, executionState: PlanExecutionState, onApprove: () => void, onCancel: () => void }> = ({ plan, executionState, onApprove, onCancel }) => {
    const isAwaitingApproval = executionState.status === 'awaiting_approval';

    return (
        <div className="space-y-3">
            <div className="flex items-start gap-2">
                 <ClipboardListIcon className="w-5 h-5 text-textSecondary flex-shrink-0 mt-0.5"/>
                 <div>
                    <p className="font-semibold text-textPrimary">Here's my plan to create that look:</p>
                    <p className="text-xs text-textSecondary">{plan.overallGoal}</p>
                 </div>
            </div>
            <PlanSteps plan={plan} executionState={executionState} />
            {isAwaitingApproval && (
                 <div className="flex items-center gap-2 pt-2">
                    <button onClick={onApprove} className="flex-1 text-sm font-semibold text-white bg-accent px-3 py-1.5 rounded-full hover:bg-accentHover transition-colors">
                        Approve & Start
                    </button>
                    <button onClick={onCancel} className="flex-1 text-sm font-semibold text-textSecondary bg-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

const TaskRunner: React.FC<{ executionState: PlanExecutionState, onCancel: () => void }> = ({ executionState, onCancel }) => {
    const { plan, status } = executionState;
    if (!plan) return null;

    return (
         <motion.div
            key="task-runner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-shrink-0 p-4 border-t border-b border-borderLight bg-white/80 backdrop-blur-md"
        >
            <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-textPrimary">Executing Plan: <span className="font-normal">{plan.overallGoal}</span></p>
                        {status === 'complete' && <p className="text-xs font-semibold text-green-600">Plan completed successfully!</p>}
                    </div>
                     <button onClick={onCancel} disabled={status === 'complete'} className="text-xs font-semibold text-textSecondary hover:text-red-600 disabled:opacity-50">
                        Cancel
                    </button>
                </div>
                <PlanSteps plan={plan} executionState={executionState} />
            </div>
        </motion.div>
    );
};


const ImagePart: React.FC<{ url: string; alt: string }> = ({ url, alt }) => {
    useEffect(() => {
        // Clean up blob URL when the component unmounts or the URL changes
        return () => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        };
    }, [url]);

    return <img src={url} alt={alt} className="w-full rounded-lg" />;
};


const MessageBubble: React.FC<{ 
    message: ChatMessage; 
    onSendMessage: (message: string) => void;
    planExecution: PlanExecutionState;
    onPlanApprove: () => void;
    onPlanCancel: () => void;
    isAssistantLoading: boolean;
}> = ({ message, onSendMessage, planExecution, onPlanApprove, onPlanCancel, isAssistantLoading }) => {
    const isPlanActive = planExecution.status !== 'idle' && planExecution.status !== 'failed';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-xs md:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl ${
                message.role === 'user'
                    ? 'bg-accent text-white rounded-br-lg'
                    : 'bg-gray-100 text-textPrimary rounded-bl-lg'
                }`}
            >
                <div className="space-y-3">
                     {message.parts.map((part, index) => {
                        const key = `${message.id}-part-${index}`;
                        switch (part.type) {
                            case 'text':
                                return <p key={key} className="text-sm whitespace-pre-wrap">{part.content}</p>;
                            case 'image':
                                return <ImagePart key={key} url={part.url} alt={part.alt} />;
                            case 'plan_approval':
                                return <PlanApprovalCard 
                                            key={key}
                                            plan={part.plan}
                                            executionState={planExecution}
                                            onApprove={onPlanApprove}
                                            onCancel={onPlanCancel}
                                        />;
                            case 'suggestion_chips':
                                return <SuggestionChips key={key} suggestions={part.suggestions} onSelect={onSendMessage} disabled={isAssistantLoading || isPlanActive} />;
                            default:
                                return null;
                        }
                    })}
                </div>
            </div>
        </motion.div>
    );
};


const StyleAssistantPanel: React.FC<StyleAssistantPanelProps> = ({ messages, onSendMessage, isAssistantLoading, onBack, isMobile, isTtsEnabled, onToggleTts, disabled = false, planExecution, onPlanApprove, onPlanCancel }) => {
  const [input, setInput] = useState('');
  const [referenceImage, setReferenceImage] = useState<{ file: File, url: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isAssistantLoading, planExecution.status]);
  
  const isPlanActive = planExecution.status !== 'idle' && planExecution.status !== 'failed';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || referenceImage) && !isAssistantLoading && !disabled) {
      onSendMessage(input.trim(), referenceImage?.file);
      setInput('');
      setReferenceImage(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setReferenceImage({ file, url });
      // Don't revoke here, will be revoked when referenceImage changes or on unmount
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Effect to revoke object URL when reference image is removed
  useEffect(() => {
    let url = referenceImage?.url;
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  }, [referenceImage]);
  
  const showTaskRunner = planExecution.plan && (planExecution.status === 'executing' || planExecution.status === 'verifying' || planExecution.status === 'paused' || planExecution.status === 'complete');


  const panelContent = (
    <div className="h-full flex flex-col bg-white rounded-t-2xl overflow-hidden">
      {isMobile ? (
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-borderLight bg-white/80 backdrop-blur-md" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0) + 1rem)', paddingBottom: '1rem' }}>
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100" aria-label="Back to fitting room">
              <ArrowRightIcon className="w-5 h-5 text-textPrimary -scale-x-100" />
            </button>
            <h2 className="text-lg font-serif tracking-wider text-textPrimary ml-4">Style Assistant</h2>
          </div>
          <button onClick={onToggleTts} className="p-2 rounded-full hover:bg-gray-100" aria-label="Toggle voice">
              {isTtsEnabled ? <SpeakerWaveIcon className="w-5 h-5 text-accent"/> : <SpeakerOffIcon className="w-5 h-5 text-textSecondary"/>}
          </button>
        </div>
      ) : (
          <div className="p-4 border-b border-borderLight flex justify-end">
              <button onClick={onToggleTts} className="p-2 rounded-full hover:bg-gray-100" aria-label="Toggle voice">
                {isTtsEnabled ? <SpeakerWaveIcon className="w-5 h-5 text-accent"/> : <SpeakerOffIcon className="w-5 h-5 text-textSecondary"/>}
              </button>
          </div>
      )}
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onSendMessage={onSendMessage}
            planExecution={planExecution}
            onPlanApprove={onPlanApprove}
            onPlanCancel={onPlanCancel}
            isAssistantLoading={isAssistantLoading}
          />
        ))}
        {isAssistantLoading && !isPlanActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="inline-flex items-center px-4 py-3 rounded-2xl bg-gray-100 text-textPrimary rounded-bl-lg">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150 mx-1.5"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <AnimatePresence>
          {showTaskRunner && (
              <TaskRunner
                  executionState={planExecution}
                  onCancel={onPlanCancel}
              />
          )}
      </AnimatePresence>

      <div className="flex-shrink-0 p-4 border-t border-borderLight bg-white/80 backdrop-blur-md" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 1rem)'}}>
        <form onSubmit={handleSubmit} className={`flex flex-col gap-2 ${disabled || isPlanActive ? 'opacity-50' : ''}`}>
            {referenceImage && (
              <div className="relative w-20 h-20 ml-2 mb-2 rounded-md overflow-hidden self-start">
                  <img src={referenceImage.url} alt="Reference preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setReferenceImage(null)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors" aria-label="Remove image">
                      <XIcon className="w-3 h-3" />
                  </button>
              </div>
            )}
            <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect}/>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isAssistantLoading || disabled || isPlanActive} className="p-3 border border-borderLight text-textSecondary rounded-full transition-colors hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed flex-shrink-0" aria-label="Attach image">
                    <PaperclipIcon className="w-5 h-5"/>
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={disabled ? "Create a product to start..." : isPlanActive ? "Plan in progress..." : "Describe a change..."}
                    className="w-full px-4 py-2 bg-white border border-borderLight rounded-full focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-100"
                    disabled={isAssistantLoading || disabled || isPlanActive}
                />
                <button
                    type="submit"
                    disabled={isAssistantLoading || disabled || isPlanActive || (!input.trim() && !referenceImage)}
                    className="p-3 bg-accent text-white rounded-full transition-colors hover:bg-accentHover disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label="Send message"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </form>
      </div>
    </div>
  );

  if (!isMobile) {
    return <div className="h-full -m-6">{panelContent}</div>;
  }

  return (
    <motion.div
      key="assistant-modal-backdrop"
      className="fixed inset-0 bg-black/30 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
          className="h-[85vh] w-full"
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {panelContent}
      </motion.div>
    </motion.div>
  );
};

export default StyleAssistantPanel;