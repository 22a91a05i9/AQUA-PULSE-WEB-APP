import { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
  wobbleAmt: number;
}

interface Fish {
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
  verticalDrift: number;
  verticalSpeed: number;
  tailAngle: number;
  tailSpeed: number;
  color: string;
  glowColor: string;
  type: 'small' | 'medium' | 'large';
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export default function UnderwaterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const bubbles: Bubble[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * 200,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
      wobbleAmt: Math.random() * 15 + 5,
    }));

    const fishes: Fish[] = [
      ...Array.from({ length: 6 }, (_, i) => ({
        x: -200 - i * 300,
        y: height * (0.3 + i * 0.08),
        size: 18 + i * 2,
        speed: 0.8 + Math.random() * 0.6,
        direction: 1,
        verticalDrift: 0,
        verticalSpeed: Math.random() * 0.003 + 0.001,
        tailAngle: 0,
        tailSpeed: 0.08 + Math.random() * 0.04,
        color: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#60a5fa' : '#34d399',
        glowColor: i % 3 === 0 ? 'rgba(34,211,238,0.4)' : i % 3 === 1 ? 'rgba(96,165,250,0.4)' : 'rgba(52,211,153,0.4)',
        type: 'small' as const,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        x: width + 300 + i * 400,
        y: height * (0.5 + i * 0.1),
        size: 28 + i * 4,
        speed: 0.5 + Math.random() * 0.4,
        direction: -1,
        verticalDrift: Math.PI * i,
        verticalSpeed: 0.001 + Math.random() * 0.002,
        tailAngle: 0,
        tailSpeed: 0.06,
        color: '#a78bfa',
        glowColor: 'rgba(167,139,250,0.4)',
        type: 'medium' as const,
      })),
    ];

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.3 + 0.05,
    }));

    let time = 0;

    function drawFish(fish: Fish) {
      const { x, y, size, tailAngle, color, glowColor, direction } = fish;
      const scaleX = direction;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scaleX, 1);

      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = glowColor;

      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
      const bodyGrad = ctx.createRadialGradient(-size * 0.2, -size * 0.1, 0, 0, 0, size);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(1, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // Tail
      ctx.beginPath();
      const tailX = -size;
      const tailY = 0;
      const tailSwing = Math.sin(tailAngle) * size * 0.4;
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tailX - size * 0.5, tailSwing - size * 0.4);
      ctx.lineTo(tailX - size * 0.5, tailSwing + size * 0.4);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Eye
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(size * 0.5, -size * 0.1, size * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.55, -size * 0.1, size * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = '#020b18';
      ctx.fill();

      // Fin
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.3);
      ctx.quadraticCurveTo(size * 0.2, -size * 0.7, size * 0.4, -size * 0.35);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.fill();

      ctx.restore();
    }

    function drawSeaweed(x: number, h: number, t: number, colorStop1: string, colorStop2: string) {
      const segments = 8;
      const segH = h / segments;
      ctx.beginPath();
      ctx.moveTo(x, height);
      for (let i = 0; i < segments; i++) {
        const sy = height - i * segH;
        const swayX = x + Math.sin(t + i * 0.5) * (15 + i * 3);
        const cp1x = swayX + 15;
        const cp1y = sy - segH / 2;
        const cp2x = swayX - 15;
        const cp2y = sy - segH;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, swayX, sy - segH);
      }
      const grad = ctx.createLinearGradient(x, height, x, height - h);
      grad.addColorStop(0, colorStop1);
      grad.addColorStop(1, colorStop2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 8;
      ctx.shadowColor = colorStop2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function drawCausticLights(t: number) {
      const lights = [
        { x: width * 0.15, y: 0, r: 200, phase: 0 },
        { x: width * 0.4, y: 50, r: 300, phase: Math.PI },
        { x: width * 0.7, y: 30, r: 250, phase: Math.PI * 0.5 },
      ];
      lights.forEach(l => {
        const alpha = 0.04 + Math.sin(t * 0.3 + l.phase) * 0.02;
        const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
        grad.addColorStop(0, `rgba(0,212,255,${alpha})`);
        grad.addColorStop(0.5, `rgba(0,150,255,${alpha * 0.3})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      });
    }

    function draw() {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Deep ocean gradient background
      const bgGrad = ctx.createRadialGradient(width * 0.3, height * 0.2, 0, width * 0.5, height * 0.5, width);
      bgGrad.addColorStop(0, '#0a2a47');
      bgGrad.addColorStop(0.4, '#041526');
      bgGrad.addColorStop(1, '#020b18');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Caustic lights from top
      drawCausticLights(time);

      // Volumetric light rays from top
      for (let i = 0; i < 5; i++) {
        const rayX = width * (0.1 + i * 0.2) + Math.sin(time * 0.2 + i) * 30;
        const alpha = (0.03 + Math.sin(time * 0.4 + i * 1.3) * 0.01);
        const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + 40, height * 0.8);
        rayGrad.addColorStop(0, `rgba(100,200,255,${alpha * 4})`);
        rayGrad.addColorStop(0.3, `rgba(50,150,255,${alpha})`);
        rayGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.moveTo(rayX - 20, 0);
        ctx.lineTo(rayX + 80, height * 0.8);
        ctx.lineTo(rayX + 60, height * 0.8);
        ctx.lineTo(rayX - 40, 0);
        ctx.closePath();
        ctx.fillStyle = rayGrad;
        ctx.fill();
      }

      // Floating particles
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += Math.sin(time + p.y * 0.01) * 0.3;
        if (p.y < -5) p.y = height + 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${p.opacity})`;
        ctx.fill();
      });

      // Seaweed
      const seaweeds = [
        { x: 30, h: 180, c1: '#064e3b', c2: '#10b981' },
        { x: 80, h: 140, c1: '#065f46', c2: '#34d399' },
        { x: 140, h: 200, c1: '#064e3b', c2: '#059669' },
        { x: width - 40, h: 160, c1: '#064e3b', c2: '#10b981' },
        { x: width - 100, h: 190, c1: '#065f46', c2: '#34d399' },
        { x: width - 170, h: 140, c1: '#064e3b', c2: '#059669' },
      ];
      seaweeds.forEach(sw => drawSeaweed(sw.x, sw.h, time, sw.c1, sw.c2));

      // Ocean floor
      ctx.beginPath();
      ctx.moveTo(0, height - 20);
      for (let x = 0; x <= width; x += 20) {
        ctx.lineTo(x, height - 20 + Math.sin(x * 0.02 + time * 0.3) * 8);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const floorGrad = ctx.createLinearGradient(0, height - 30, 0, height);
      floorGrad.addColorStop(0, 'rgba(6,182,212,0.15)');
      floorGrad.addColorStop(1, 'rgba(4,21,38,0.8)');
      ctx.fillStyle = floorGrad;
      ctx.fill();

      // Glowing wave at the bottom
      ctx.beginPath();
      for (let x = 0; x <= width; x += 5) {
        const y = height - 25 + Math.sin(x * 0.015 + time * 0.5) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(0,212,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(0,212,255,0.5)';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fish
      fishes.forEach(fish => {
        fish.x += fish.speed * fish.direction;
        fish.verticalDrift += fish.verticalSpeed;
        fish.y += Math.sin(fish.verticalDrift) * 0.4;
        fish.tailAngle += fish.tailSpeed;

        if (fish.direction === 1 && fish.x > width + 200) {
          fish.x = -200;
          fish.y = Math.random() * height * 0.7 + height * 0.1;
        }
        if (fish.direction === -1 && fish.x < -200) {
          fish.x = width + 200;
          fish.y = Math.random() * height * 0.7 + height * 0.1;
        }

        drawFish(fish);
      });

      // Bubbles
      bubbles.forEach(b => {
        b.y -= b.speed;
        b.wobble += b.wobbleSpeed;
        b.x += Math.sin(b.wobble) * 0.5;
        if (b.y < -20) {
          b.y = height + 10;
          b.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,212,255,${b.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Bubble shine
        ctx.beginPath();
        ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.4})`;
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
