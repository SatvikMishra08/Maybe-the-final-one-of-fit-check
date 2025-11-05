/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from './Spinner';

interface LoadingScreenProps {
  messages: string[];
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ messages }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [messages]);

  return (
    <motion.div
      key="loading-screen"
      className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0 bg-accent/5"
        animate={{
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <Spinner />
      <div className="h-8 mt-6 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            className="text-lg font-serif text-textPrimary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;