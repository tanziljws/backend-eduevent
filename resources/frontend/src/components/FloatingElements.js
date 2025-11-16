import React from 'react';
import { motion } from 'framer-motion';

const FloatingElements = () => {
  const floatingVariants = {
    float: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const rotateVariants = {
    rotate: {
      rotate: [0, 360],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <>
      {/* Floating Circles */}
      <motion.div
        className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-xl"
        variants={floatingVariants}
        animate="float"
        style={{ animationDelay: '0s' }}
      />
      
      <motion.div
        className="absolute top-40 left-10 w-24 h-24 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-full blur-lg"
        variants={floatingVariants}
        animate="float"
        style={{ animationDelay: '1s' }}
      />
      
      <motion.div
        className="absolute bottom-32 right-32 w-20 h-20 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-full blur-lg"
        variants={floatingVariants}
        animate="float"
        style={{ animationDelay: '2s' }}
      />

      {/* Rotating Elements */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-pink-500/30 rounded-lg"
        variants={rotateVariants}
        animate="rotate"
      />
      
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-12 h-12 border-2 border-purple-500/30 rounded-full"
        variants={rotateVariants}
        animate="rotate"
        style={{ animationDelay: '5s' }}
      />
    </>
  );
};

export default FloatingElements;
