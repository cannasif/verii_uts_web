import { useEffect, useRef } from 'react';

interface AuthBackgroundProps {
  isActive: boolean;
}

export function AuthBackground({ isActive }: AuthBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrame = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resize();

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.2 + Math.random() * 2.4,
    }));

    const render = () => {
      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(236, 72, 153, 0.08)');
      gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
      gradient.addColorStop(1, 'rgba(251, 146, 60, 0.06)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x <= 0 || particle.x >= width) particle.vx *= -1;
        if (particle.y <= 0 || particle.y >= height) particle.vy *= -1;

        context.beginPath();
        context.fillStyle = 'rgba(255, 237, 213, 0.75)';
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fill();

        for (let innerIndex = index + 1; innerIndex < particles.length; innerIndex += 1) {
          const other = particles[innerIndex];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            context.beginPath();
            context.strokeStyle = `rgba(236, 72, 153, ${0.12 - distance / 1200})`;
            context.lineWidth = 1;
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        }
      });

      animationFrame = window.requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);
    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    />
  );
}
