import { useLocation } from 'react-router-dom';
import { useMemo, memo } from 'react';
import { config } from '@/lib/config';

/**
 * AmbientBackground
 * Lightweight background gradient that changes per route.
 * Optimized for performance with minimal animations.
 */
const AmbientBackground = memo(() => {
  const location = useLocation();
  const path = location.pathname;

  // Skip animations if disabled in config
  const enableAnimations = config.ui.enableAnimations;

  const gradient = useMemo(() => {
    const seed = Math.abs([...path].reduce((a, c) => a + c.charCodeAt(0), 0));
    const angle = (seed * 23) % 360;
    const x1 = (seed * 37) % 100; // percentage
    const y1 = (seed * 53) % 100;

    // Simplified gradient for better performance
    const layer1 = `radial-gradient(ellipse at ${x1}% ${y1}%, hsl(var(--primary) / 0.08), transparent 60%)`;
    const layer2 = `conic-gradient(from ${angle}deg at 50% 50%, hsl(var(--accent) / 0.05), transparent 75%)`;

    return `${layer1}, ${layer2}`;
  }, [path]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      style={{
        background: gradient,
        filter: 'blur(60px) saturate(120%)',
        opacity: 0.3,
        transition: enableAnimations ? 'background 0.6s ease' : 'none',
      }}
    />
  );
});

AmbientBackground.displayName = 'AmbientBackground';

export default AmbientBackground;
