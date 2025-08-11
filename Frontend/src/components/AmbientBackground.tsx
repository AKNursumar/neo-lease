import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AmbientBackground
 * Subtle multi-layer radial / conic gradient that changes position & hue per route.
 * Very low opacity, sits behind all content (pointer-events: none).
 */
const AmbientBackground = () => {
  const location = useLocation();
  const path = location.pathname;

  const gradient = useMemo(() => {
    const seed = Math.abs([...path].reduce((a, c) => a + c.charCodeAt(0), 0));
    const angle = (seed * 23) % 360;
    const x1 = (seed * 37) % 100; // percentage
    const y1 = (seed * 53) % 100;
    const x2 = (x1 + 30) % 100;
    const y2 = (y1 + 45) % 100;

    // Light & dark mode handle via CSS variables; we only set alpha here
    const layer1 = `radial-gradient(circle at ${x1}% ${y1}%, hsl(var(--primary) / 0.18), transparent 60%)`;
    const layer2 = `radial-gradient(circle at ${x2}% ${y2}%, hsl(var(--accent) / 0.12), transparent 70%)`;
    const layer3 = `conic-gradient(from ${angle}deg at 50% 50%, hsl(var(--secondary) / 0.10), transparent 75%)`;

    return `${layer1}, ${layer2}, ${layer3}`;
  }, [path]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={path}
        aria-hidden
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        style={{
          background: gradient,
          filter: 'blur(80px) saturate(140%)',
          opacity: 0.45,
          transition: 'background 1.2s ease',
        }}
      />
    </AnimatePresence>
  );
};

export default AmbientBackground;
