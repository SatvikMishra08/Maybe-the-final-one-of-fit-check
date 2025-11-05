/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from './icons';

interface AccordionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    actions?: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false, actions }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-borderLight/50 last-of-type:border-b-0">
            <div className="flex justify-between items-center w-full text-left py-4">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-grow flex items-center gap-2 text-left"
                    aria-expanded={isOpen}
                >
                    <div className="text-xl font-serif tracking-wider text-textPrimary flex items-center gap-2">{title}</div>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {actions}
                    <button onClick={() => setIsOpen(!isOpen)} className="p-1" aria-label={isOpen ? "Collapse section" : "Expand section"}>
                        <ChevronDownIcon className={`w-5 h-5 text-textSecondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.section
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 },
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6">
                            {children}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Accordion;
