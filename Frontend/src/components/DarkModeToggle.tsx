import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

/**
 * DarkModeToggle: 3D flip + soft neumorphic animated theme switcher.
 * - Remembers preference in localStorage
 * - Respects system preference on first load
 */
const DarkModeToggle = () => {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage / system
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored) {
      const isDark = stored === 'dark';
      setDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(prefers);
      document.documentElement.classList.toggle('dark', prefers);
    }
    setMounted(true);
  }, []);

  const toggle = () => {
    setDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Avoid hydration flicker
  if (!mounted) return null;

  return (
    <motion.button
      onClick={toggle}
      aria-label="Toggle dark mode"
      whileTap={{ scale: 0.9 }}
      className="relative w-12 h-12 neu-button group flip-3d overflow-hidden"
      style={{ perspective: 800 }}
    >
      {/* 3D rotating inner cube */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotateY: dark ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div className="flip-face absolute inset-0 flex items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
          <Sun className="w-6 h-6 text-yellow-500 drop-shadow" />
        </motion.div>
        <motion.div className="flip-face flip-back absolute inset-0 flex items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
          <Moon className="w-6 h-6 text-blue-400" />
        </motion.div>
      </motion.div>

      {/* Glow / ring accent */}
      <AnimatePresence mode="wait">
        {dark ? (
          <motion.span
            key="dark-glow"
            className="absolute inset-0 rounded-[20px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, boxShadow: '0 0 12px 2px hsl(var(--primary) / 0.5)' }}
            exit={{ opacity: 0 }}
          />
        ) : (
          <motion.span
            key="light-glow"
            className="absolute inset-0 rounded-[20px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, boxShadow: '0 0 12px 2px hsl(var(--accent) / 0.5)' }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default DarkModeToggle;
