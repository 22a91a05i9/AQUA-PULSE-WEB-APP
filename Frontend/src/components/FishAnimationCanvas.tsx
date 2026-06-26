import { useEffect, useRef } from 'react';

interface FishIndividual {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  tailPhase: number;
  tailSpeed: number;
  color: string;
  bodyAlpha: number;
  glowRadius: number;
  glowColor: string;
  type: 'schooling' | 'solo' | 'large';
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  alpha: number;
}

function createFish(
  x: number, y: number, vx: number, vy: number,
  size: number, color: string, glowColor: string,
  type: FishIndividual['type']
): FishIndividual {
  return {
    x, y, vx, vy, size,
    tailPhase: Math.random() * Math.PI * 2,
    tailSpeed: type === 'large' ? 0.06 : 0.12 + Math.random() * 0.06,
    color, bodyAlpha: 0.85,
    glowRadius: type === 'large' ? 20 : 10,
    glowColor, type,
  };
}

export default function FishAnimationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let W = canvas.parentElement?.clientWidth || window.innerWidth;
    let H = canvas.parentElement?.clientHeight || window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // ---- School of small fish (like the image — dark silhouettes, mid-left) ----
    const schoolSize = 18;
    const school: FishIndividual[] = Array.from({ length: schoolSize }, (_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      return createFish(
        W * 0.12 + col * 28 + row * 10,
        H * 0.52 + row * 22 + Math.random() * 10,
        0.55 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.2,
        9 + Math.random() * 4,
        '#1a3a5c',
        'rgba(0,180,220,0.15)',
        'schooling'
      );
    });

    // ---- A few glowing solo fish scattered ----
    const soloFish: FishIndividual[] = [
      createFish(-80, H * 0.38, 0.7, 0.05, 18, '#22d3ee', 'rgba(34,211,238,0.4)', 'solo'),
      createFish(-200, H * 0.65, 0.5, -0.05, 14, '#60a5fa', 'rgba(96,165,250,0.4)', 'solo'),
      createFish(W + 100, H * 0.30, -0.6, 0.03, 16, '#34d399', 'rgba(52,211,153,0.35)', 'solo'),
      createFish(W + 50, H * 0.72, -0.45, -0.05, 22, '#22d3ee', 'rgba(34,211,238,0.3)', 'large'),
      createFish(-150, H * 0.80, 0.35, 0.04, 26, '#0ea5e9', 'rgba(14,165,233,0.3)', 'large'),
    ];

    // ---- Bubbles ----
    const bubbles: Bubble[] = Array.from({ length: 28 }, () => ({
      x: Math.random() * W,
      y: H + Math.random() * 200,
      r: Math.random() * 3.5 + 0.8,
      speed: Math.random() * 1.2 + 1.4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.025 + 0.01,
      alpha: Math.random() * 0.35 + 0.1,
    }));

    // ---- Draw a realistic fish ----
    function drawRealisticFish(fish: FishIndividual) {
      const { x, y, size, tailPhase, color, bodyAlpha, glowRadius, glowColor, vx } = fish;
      const dir = vx >= 0 ? 1 : -1;
      const tailSwing = Math.sin(tailPhase) * size * 0.45;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);

      // Glow
      ctx.shadowBlur = glowRadius;
      ctx.shadowColor = glowColor;

      ctx.globalAlpha = bodyAlpha;

      // Body — main ellipse
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.44, 0, 0, Math.PI * 2);
      const bodyGrad = ctx.createLinearGradient(-size, 0, size, 0);
      bodyGrad.addColorStop(0, color);
      bodyGrad.addColorStop(0.5, color);
      bodyGrad.addColorStop(1, color + '80');
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Belly highlight
      ctx.beginPath();
      ctx.ellipse(-size * 0.05, size * 0.08, size * 0.55, size * 0.2, 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();

      // Tail fin
      ctx.shadowBlur = 0;
      ctx.beginPath();
      const tx = -size * 0.88;
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx - size * 0.55, tailSwing - size * 0.42);
      ctx.lineTo(tx - size * 0.55, tailSwing + size * 0.42);
      ctx.closePath();
      ctx.fillStyle = color + 'cc';
      ctx.fill();

      // Dorsal fin
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, -size * 0.38);
      ctx.quadraticCurveTo(size * 0.15, -size * 0.72, size * 0.45, -size * 0.38);
      ctx.closePath();
      ctx.fillStyle = color + 'aa';
      ctx.fill();

      // Pectoral fin
      ctx.beginPath();
      ctx.moveTo(size * 0.1, size * 0.1);
      ctx.quadraticCurveTo(size * 0.35, size * 0.55, size * 0.0, size * 0.38);
      ctx.closePath();
      ctx.fillStyle = color + '80';
      ctx.fill();

      // Eye
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(size * 0.58, -size * 0.06, size * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.60, -size * 0.06, size * 0.065, 0, Math.PI * 2);
      ctx.fillStyle = '#000c1a';
      ctx.fill();
      // Eye shine
      ctx.beginPath();
      ctx.arc(size * 0.62, -size * 0.1, size * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();

      // Scales (subtle arc lines)
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 0.5;
      for (let s = 0; s < 3; s++) {
        ctx.beginPath();
        ctx.arc(-size * 0.2 + s * size * 0.28, 0, size * 0.2, -Math.PI * 0.6, Math.PI * 0.6);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ---- Draw schooling fish (dark silhouette, like the image) ----
    function drawSchoolFish(fish: FishIndividual) {
      const { x, y, size, tailPhase, vx } = fish;
      const dir = vx >= 0 ? 1 : -1;
      const tailSwing = Math.sin(tailPhase) * size * 0.4;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.globalAlpha = 0.72;

      // Body silhouette
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0f2d45';
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-size * 0.85, 0);
      ctx.lineTo(-size * 1.3, tailSwing - size * 0.38);
      ctx.lineTo(-size * 1.3, tailSwing + size * 0.38);
      ctx.closePath();
      ctx.fillStyle = '#0f2d45';
      ctx.fill();

      // Dorsal
      ctx.beginPath();
      ctx.moveTo(-size * 0.05, -size * 0.36);
      ctx.quadraticCurveTo(size * 0.2, -size * 0.65, size * 0.42, -size * 0.36);
      ctx.closePath();
      ctx.fillStyle = '#0f2d45';
      ctx.fill();

      // Subtle blue glow on the fish
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0,160,210,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,100,160,0.1)';
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    let time = 0;

    function tick() {
      time += 0.016;
      ctx.clearRect(0, 0, W, H);

      // ---- Update and draw school ----
      // School cohesion: keep fish together and moving right
      const centerX = school.reduce((s, f) => s + f.x, 0) / school.length;
      const centerY = school.reduce((s, f) => s + f.y, 0) / school.length;

      school.forEach((fish, i) => {
        // Gentle cohesion + wander
        fish.vx += (centerX - fish.x) * 0.0003 + Math.sin(time * 0.6 + i) * 0.005 + 0.004;
        fish.vy += (centerY - fish.y) * 0.0003 + Math.cos(time * 0.5 + i * 0.7) * 0.004;

        // Separation from neighbors
        school.forEach((other, j) => {
          if (i === j) return;
          const dx = fish.x - other.x;
          const dy = fish.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 22 && dist > 0) {
            fish.vx += (dx / dist) * 0.04;
            fish.vy += (dy / dist) * 0.04;
          }
        });

        // Clamp speed
        const spd = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
        const maxSpd = 1.2;
        if (spd > maxSpd) { fish.vx = (fish.vx / spd) * maxSpd; fish.vy = (fish.vy / spd) * maxSpd; }

        fish.x += fish.vx;
        fish.y += fish.vy;
        fish.tailPhase += fish.tailSpeed;

        // Wrap
        if (fish.x > W + 60) fish.x = -60;
        if (fish.x < -60) fish.x = W + 60;
        if (fish.y > H + 40) fish.y = -40;
        if (fish.y < -40) fish.y = H + 40;

        drawSchoolFish(fish);
      });

      // ---- Update and draw solo / large fish ----
      soloFish.forEach((fish) => {
        fish.x += fish.vx;
        fish.y += fish.vy + Math.sin(time * 0.5 + fish.tailPhase) * 0.15;
        fish.tailPhase += fish.tailSpeed;

        // Wrap around
        if (fish.vx > 0 && fish.x > W + 120) { fish.x = -120; fish.y = H * (0.2 + Math.random() * 0.6); }
        if (fish.vx < 0 && fish.x < -120) { fish.x = W + 120; fish.y = H * (0.2 + Math.random() * 0.6); }

        drawRealisticFish(fish);
      });

      // ---- Bubbles ----
      bubbles.forEach((b) => {
        b.y -= b.speed;
        b.wobble += b.wobbleSpeed;
        b.x += Math.sin(b.wobble) * 0.4;
        if (b.y < -10) { b.y = H + 10; b.x = Math.random() * W; }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150,230,255,${b.alpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Shine on bubble
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${b.alpha * 0.5})`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    tick();

    const resizeCanvas = () => {
      W = canvas.parentElement?.clientWidth || window.innerWidth;
      H = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    window.addEventListener('resize', resizeCanvas);
    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}
