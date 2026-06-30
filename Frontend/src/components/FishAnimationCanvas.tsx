import { useEffect, useRef } from 'react';

interface FishIndividual {
  x: number;
  y: number;
  baseY: number;
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
    x, y, baseY: y, vx, vy, size,
    tailPhase: Math.random() * Math.PI * 2,
    tailSpeed: type === 'large' ? 0.06 : 0.12 + Math.random() * 0.06,
    color, bodyAlpha: type === 'schooling' ? 0.68 : 0.88,
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
    const createSchool = (
      count: number,
      startX: number,
      startY: number,
      direction: 1 | -1,
      spreadX: number,
      spreadY: number,
      baseSpeed: number,
      color: string,
    ) =>
      Array.from({ length: count }, (_, i) => {
        const row = Math.floor(i / 7);
        const col = i % 7;
        return createFish(
          startX + direction * (col * spreadX + row * 12 + Math.random() * 18),
          startY + row * spreadY + (Math.random() - 0.5) * 14,
          direction * (baseSpeed + Math.random() * 0.28),
          (Math.random() - 0.5) * 0.18,
          8 + Math.random() * 5,
          color,
          'rgba(34,211,238,0.2)',
          'schooling'
        );
      });

    const school: FishIndividual[] = [
      ...createSchool(22, -120, H * 0.60, 1, 26, 18, 0.85, '#143f60'),
      ...createSchool(16, W + 130, H * 0.34, -1, 24, 14, 0.7, '#155e75'),
      ...createSchool(14, -220, H * 0.76, 1, 34, 13, 0.48, '#0f2d45'),
    ];

    // ---- A few glowing solo fish scattered ----
    const soloFish: FishIndividual[] = [
      createFish(-90, H * 0.25, 0.92, 0.04, 16, '#22d3ee', 'rgba(34,211,238,0.45)', 'solo'),
      createFish(-240, H * 0.48, 0.72, -0.04, 14, '#60a5fa', 'rgba(96,165,250,0.42)', 'solo'),
      createFish(W + 120, H * 0.28, -0.78, 0.03, 15, '#34d399', 'rgba(52,211,153,0.38)', 'solo'),
      createFish(W + 180, H * 0.66, -0.52, -0.04, 24, '#22d3ee', 'rgba(34,211,238,0.34)', 'large'),
      createFish(-180, H * 0.82, 0.46, 0.04, 28, '#0ea5e9', 'rgba(14,165,233,0.32)', 'large'),
      createFish(W + 280, H * 0.52, -0.64, 0.02, 18, '#7dd3fc', 'rgba(125,211,252,0.36)', 'solo'),
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
      ctx.globalAlpha = fish.bodyAlpha;

      // Body silhouette
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = fish.color;
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-size * 0.85, 0);
      ctx.lineTo(-size * 1.3, tailSwing - size * 0.38);
      ctx.lineTo(-size * 1.3, tailSwing + size * 0.38);
      ctx.closePath();
      ctx.fillStyle = fish.color;
      ctx.fill();

      // Dorsal
      ctx.beginPath();
      ctx.moveTo(-size * 0.05, -size * 0.36);
      ctx.quadraticCurveTo(size * 0.2, -size * 0.65, size * 0.42, -size * 0.36);
      ctx.closePath();
      ctx.fillStyle = fish.color;
      ctx.fill();

      // Subtle blue glow on the fish
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0,160,210,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34,211,238,0.12)';
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    let time = 0;

    function tick() {
      time += 0.016;
      ctx.clearRect(0, 0, W, H);

      // ---- Update and draw school ----
      // Keep the schools together while letting multiple lanes cross the scene.
      const centerX = school.reduce((s, f) => s + f.x, 0) / school.length;
      const centerY = school.reduce((s, f) => s + f.y, 0) / school.length;

      school.forEach((fish, i) => {
        // Gentle cohesion + wander
        const direction = fish.vx >= 0 ? 1 : -1;
        fish.vx += (centerX - fish.x) * 0.00005 + Math.sin(time * 0.7 + i) * 0.004 + direction * 0.003;
        fish.vy += (fish.baseY - fish.y) * 0.0012 + (centerY - fish.y) * 0.00008 + Math.cos(time * 0.55 + i * 0.7) * 0.004;

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
        const maxSpd = 1.35;
        if (spd > maxSpd) { fish.vx = (fish.vx / spd) * maxSpd; fish.vy = (fish.vy / spd) * maxSpd; }

        fish.x += fish.vx;
        fish.y += fish.vy + Math.sin(time * 1.1 + i * 0.4) * 0.08;
        fish.tailPhase += fish.tailSpeed;

        // Wrap
        if (fish.vx > 0 && fish.x > W + 80) {
          fish.x = -80 - Math.random() * 160;
          fish.baseY = H * (0.28 + Math.random() * 0.55);
          fish.y = fish.baseY;
        }
        if (fish.vx < 0 && fish.x < -80) {
          fish.x = W + 80 + Math.random() * 160;
          fish.baseY = H * (0.24 + Math.random() * 0.5);
          fish.y = fish.baseY;
        }
        if (fish.y > H + 40) fish.y = fish.baseY = H * 0.72;
        if (fish.y < -40) fish.y = fish.baseY = H * 0.26;

        drawSchoolFish(fish);
      });

      // ---- Update and draw solo / large fish ----
      soloFish.forEach((fish) => {
        fish.x += fish.vx;
        fish.y += fish.vy + Math.sin(time * 0.7 + fish.tailPhase) * 0.18;
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
