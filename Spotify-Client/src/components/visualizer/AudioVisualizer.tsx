
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

interface AudioVisualizerProps {
  isPlaying: boolean;
  color?: string;
  barCount?: number;
}

export function AudioVisualizer({ isPlaying, color = '#1DB954', barCount = 40 }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const barWidth = rect.width / barCount;
    // Current heights of bars
    const bars: number[] = new Array(barCount).fill(0);
    // Target heights to animate towards
    const targets: number[] = new Array(barCount).fill(0);

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Gradient
      const gradient = ctx.createLinearGradient(0, rect.height, 0, 0);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, `${color}40`); // Transparent at top
      ctx.fillStyle = gradient;

      for (let i = 0; i < barCount; i++) {
        // Update target randomly if close to current
        if (Math.abs(bars[i] - targets[i]) < 5) {
          if (isPlaying) {
            // Random height between 10% and 100%
            targets[i] = Math.random() * (rect.height * 0.9) + (rect.height * 0.1);
            // Make neighbors somewhat related for a wave effect?
            // Simple version: just random
          } else {
            targets[i] = rect.height * 0.1; // Low idle state
          }
        }

        // Smoothly move bar towards target
        bars[i] += (targets[i] - bars[i]) * 0.1;

        // Draw bar
        // Rounded caps
        const x = i * barWidth + (barWidth * 0.2); // Gap
        const w = barWidth * 0.6;
        const h = bars[i];

        ctx.beginPath();
        ctx.roundRect(x, rect.height - h, w, h, 4);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, color, barCount]);

  return (
    <div className="w-full h-48 bg-surface-2/50 rounded-xl p-4 backdrop-blur-sm border border-white/5">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
