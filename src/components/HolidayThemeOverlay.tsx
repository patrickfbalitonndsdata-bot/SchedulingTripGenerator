import React, { useEffect, useRef, useMemo } from 'react';
import { ActiveHolidayTheme } from '../types';

interface HolidayThemeOverlayProps {
  activeTheme: ActiveHolidayTheme;
  animationsEnabled?: boolean;
}

export const HolidayThemeOverlay: React.FC<HolidayThemeOverlayProps> = ({
  activeTheme,
  animationsEnabled = true
}) => {
  const fireworksCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentYear = new Date().getFullYear();

  // Pre-compute deterministic random elements for smooth SSR/CSR rendering
  const snowflakes = useMemo(() => {
    return Array.from({ length: 48 }).map((_, i) => ({
      id: i,
      left: `${(i * 19.7 + (i % 7) * 3.1) % 100}%`,
      size: 6 + (i % 5) * 4,
      duration: 8 + (i % 7) * 2.2,
      delay: -(i * 1.3) % 15,
      opacity: 0.45 + (i % 5) * 0.12,
      sway: (i % 2 === 0 ? 1 : -1) * (15 + (i % 4) * 10),
      isCrystal: i % 3 === 0
    }));
  }, []);

  const twinklingStars = useMemo(() => {
    return Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      left: `${(i * 13.7 + (i % 11) * 2.3) % 100}%`,
      top: `${(i * 11.3 + (i % 5) * 4.7) % 78}%`,
      size: 2 + (i % 4) * 1.5,
      duration: 1.8 + (i % 5) * 0.7,
      delay: (i * 0.4) % 4,
      isFlare: i % 6 === 0,
      color: i % 4 === 0 ? '#fde047' : i % 3 === 0 ? '#93c5fd' : '#ffffff'
    }));
  }, []);

  const floatingGhosts = useMemo(() => {
    return [
      { id: 1, top: '14%', duration: '24s', delay: '0s', scale: 0.95, direction: 'right' },
      { id: 2, top: '34%', duration: '31s', delay: '-9s', scale: 0.75, direction: 'left' },
      { id: 3, top: '56%', duration: '28s', delay: '-16s', scale: 0.85, direction: 'right' },
      { id: 4, top: '22%', duration: '35s', delay: '-4s', scale: 0.65, direction: 'left' }
    ];
  }, []);

  const droppingSpiders = useMemo(() => {
    return [
      { id: 1, left: '6%', threadHeight: 160, duration: '7s', delay: '0s', scale: 0.9 },
      { id: 2, left: '18%', threadHeight: 110, duration: '9.5s', delay: '-3.2s', scale: 0.7 },
      { id: 3, left: '84%', threadHeight: 145, duration: '8.2s', delay: '-1.8s', scale: 0.85 },
      { id: 4, left: '93%', threadHeight: 190, duration: '6.8s', delay: '-4.5s', scale: 1.0 }
    ];
  }, []);

  // New Year Fireworks Canvas Animation
  useEffect(() => {
    if (activeTheme !== 'new_year' || !animationsEnabled) return;
    const canvas = fireworksCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Rocket {
      x: number;
      y: number;
      vx: number;
      vy: number;
      targetY: number;
      color: string;
      trail: { x: number; y: number }[];
    }

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      decay: number;
      color: string;
      size: number;
    }

    const palette = [
      '#fde047', // Gold
      '#f43f5e', // Rose
      '#38bdf8', // Sky Cyan
      '#a855f7', // Violet
      '#34d399', // Emerald
      '#fb923c', // Amber Orange
      '#f8fafc'  // Silver White
    ];

    const rockets: Rocket[] = [];
    const particles: Particle[] = [];

    const spawnRocket = () => {
      const x = width * (0.12 + Math.random() * 0.76);
      const targetY = height * (0.12 + Math.random() * 0.38);
      const color = palette[Math.floor(Math.random() * palette.length)];
      rockets.push({
        x,
        y: height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(7.5 + Math.random() * 3.5),
        targetY,
        color,
        trail: []
      });
    };

    const explode = (x: number, y: number, primaryColor: string) => {
      const count = 64 + Math.floor(Math.random() * 32);
      const secondaryColor = palette[Math.floor(Math.random() * palette.length)];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.15;
        const speed = 1.5 + Math.random() * 4.8;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.012,
          color: i % 3 === 0 ? secondaryColor : primaryColor,
          size: 1.8 + Math.random() * 1.8
        });
      }
    };

    // Initial celebratory bursts
    explode(width * 0.25, height * 0.26, '#fde047');
    explode(width * 0.75, height * 0.22, '#38bdf8');
    explode(width * 0.5, height * 0.18, '#f43f5e');

    let frameCount = 0;
    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      if (frameCount % 38 === 0 && rockets.length < 5) {
        spawnRocket();
      }
      if (frameCount % 95 === 0 && rockets.length < 5) {
        spawnRocket();
      }

      // Update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) r.trail.shift();

        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.06;

        // Draw rocket trail
        ctx.beginPath();
        for (let t = 0; t < r.trail.length; t++) {
          const pt = r.trail[t];
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw rocket head
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        if (r.y <= r.targetY || r.vy >= -1) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.vy += 0.045; // gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTheme, animationsEnabled]);

  if (activeTheme === 'default') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden select-none"
      aria-hidden="true"
    >
      {/* =====================================================================
          1. HALLOWEEN THEME: Spooky Cemetery, Pumpkin Heads, Ghosts, Spiders & Webs, Lightning
         ===================================================================== */}
      {activeTheme === 'halloween' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#090414] via-[#17092b] to-[#240e38]">
          {/* Periodic Sky Lightning Flash Overlay */}
          {animationsEnabled && (
            <>
              <div className="absolute inset-0 bg-purple-200/15 animate-halloween-lightning pointer-events-none" />
              {/* Jagged SVG Lightning Bolts in Sky */}
              <svg
                className="absolute top-0 left-[22%] w-40 h-72 text-amber-200/80 animate-halloween-bolt-1 drop-shadow-[0_0_16px_rgba(253,224,71,0.9)]"
                viewBox="0 0 100 200"
                fill="none"
              >
                <path
                  d="M55 0 L35 65 L60 70 L25 140 L45 142 L15 200 L55 130 L35 128 L75 60 L50 56 Z"
                  fill="currentColor"
                />
              </svg>
              <svg
                className="absolute top-0 right-[24%] w-36 h-64 text-purple-200/80 animate-halloween-bolt-2 drop-shadow-[0_0_18px_rgba(216,180,254,0.95)]"
                viewBox="0 0 100 200"
                fill="none"
              >
                <path
                  d="M45 0 L65 55 L42 62 L72 130 L52 134 L80 195 L42 122 L62 118 L30 50 L52 46 Z"
                  fill="currentColor"
                />
              </svg>
            </>
          )}

          {/* Giant Eerie Full Harvest Moon */}
          <div className="absolute top-12 right-[12%] w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-amber-200 via-orange-300 to-orange-500/90 shadow-[0_0_90px_30px_rgba(249,115,22,0.35)] opacity-85">
            <div className="absolute top-6 left-8 w-6 h-6 rounded-full bg-orange-900/15" />
            <div className="absolute bottom-8 right-10 w-9 h-9 rounded-full bg-orange-900/15" />
            <div className="absolute top-16 right-7 w-4 h-4 rounded-full bg-orange-900/15" />
          </div>

          {/* Corner Spider Cobwebs (Top Left & Top Right) */}
          <svg
            className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 text-purple-200/25"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <line x1="0" y1="0" x2="200" y2="20" />
            <line x1="0" y1="0" x2="190" y2="75" />
            <line x1="0" y1="0" x2="160" y2="135" />
            <line x1="0" y1="0" x2="115" y2="175" />
            <line x1="0" y1="0" x2="55" y2="195" />
            <path d="M 40 4 Q 36 20 38 15 Q 28 30 32 27 Q 18 35 11 39" />
            <path d="M 80 8 Q 70 28 76 30 Q 55 48 64 54 Q 38 64 22 78" />
            <path d="M 125 12 Q 112 40 119 45 Q 88 70 96 81 Q 58 96 33 117" />
            <path d="M 170 17 Q 150 55 161 63 Q 118 98 134 113 Q 82 135 46 164" />
          </svg>

          <svg
            className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 text-purple-200/25 transform -scale-x-100"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <line x1="0" y1="0" x2="200" y2="20" />
            <line x1="0" y1="0" x2="190" y2="75" />
            <line x1="0" y1="0" x2="160" y2="135" />
            <line x1="0" y1="0" x2="115" y2="175" />
            <line x1="0" y1="0" x2="55" y2="195" />
            <path d="M 40 4 Q 36 20 38 15 Q 28 30 32 27 Q 18 35 11 39" />
            <path d="M 80 8 Q 70 28 76 30 Q 55 48 64 54 Q 38 64 22 78" />
            <path d="M 125 12 Q 112 40 119 45 Q 88 70 96 81 Q 58 96 33 117" />
            <path d="M 170 17 Q 150 55 161 63 Q 118 98 134 113 Q 82 135 46 164" />
          </svg>

          {/* Animated Dropping Spiders on Silk Webs */}
          {animationsEnabled &&
            droppingSpiders.map((spider) => (
              <div
                key={spider.id}
                className="absolute top-0 flex flex-col items-center animate-spider-drop"
                style={{
                  left: spider.left,
                  animationDuration: spider.duration,
                  animationDelay: spider.delay
                }}
              >
                <div
                  className="w-[1.5px] bg-gradient-to-b from-purple-200/40 to-purple-100/70"
                  style={{ height: `${spider.threadHeight}px` }}
                />
                <svg
                  className="w-8 h-8 text-slate-950 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)] -mt-1"
                  style={{ transform: `scale(${spider.scale})` }}
                  viewBox="0 0 40 40"
                  fill="currentColor"
                >
                  {/* Spider body */}
                  <circle cx="20" cy="22" r="6" fill="#090414" />
                  <circle cx="20" cy="14" r="4" fill="#090414" />
                  {/* Glowing red eyes */}
                  <circle cx="18.5" cy="13" r="1" fill="#f97316" />
                  <circle cx="21.5" cy="13" r="1" fill="#f97316" />
                  {/* Spider legs */}
                  <path
                    d="M15 16 Q8 10 4 14 M14 19 Q6 17 2 22 M14 22 Q7 24 4 30 M16 25 Q10 30 8 36 M25 16 Q32 10 36 14 M26 19 Q34 17 38 22 M26 22 Q33 24 36 30 M24 25 Q30 30 32 36"
                    stroke="#090414"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            ))}

          {/* Floating Ghosts */}
          {animationsEnabled &&
            floatingGhosts.map((ghost) => (
              <div
                key={ghost.id}
                className={`absolute ${
                  ghost.direction === 'right' ? 'animate-ghost-float-right' : 'animate-ghost-float-left'
                }`}
                style={{
                  top: ghost.top,
                  animationDuration: ghost.duration,
                  animationDelay: ghost.delay
                }}
              >
                <div className="animate-ghost-bob" style={{ transform: `scale(${ghost.scale})` }}>
                  <svg
                    className="w-20 h-24 text-purple-100/35 drop-shadow-[0_0_20px_rgba(192,132,252,0.5)]"
                    viewBox="0 0 80 100"
                    fill="currentColor"
                  >
                    <path d="M40 8 C20 8 12 24 12 46 L12 88 C12 92 18 82 24 88 C30 94 35 82 40 88 C45 94 50 82 56 88 C62 94 68 84 68 88 L68 46 C68 24 60 8 40 8 Z" />
                    {/* Ghost eyes & spooky mouth */}
                    <ellipse cx="32" cy="36" rx="4" ry="5.5" fill="#17092b" />
                    <ellipse cx="48" cy="36" rx="4" ry="5.5" fill="#17092b" />
                    <ellipse cx="40" cy="50" rx="4.5" ry="6.5" fill="#17092b" />
                  </svg>
                </div>
              </div>
            ))}

          {/* Spooky Cemetery Landscape Silhouette + Glowing Jack-O'-Lantern Pumpkin Heads */}
          <div className="absolute bottom-0 inset-x-0 h-64 sm:h-80 pointer-events-none">
            {/* Rolling Eerie Ground Mist */}
            <div className="absolute bottom-8 inset-x-0 h-28 bg-gradient-to-t from-purple-900/45 via-fuchsia-950/20 to-transparent blur-xl animate-pulse" />

            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              {/* Distant Cemetery Hill */}
              <path
                d="M0 260 Q 240 205 520 245 T 1040 230 T 1440 250 L 1440 320 L 0 320 Z"
                fill="#120621"
              />

              {/* Gnarled Spooky Dead Tree Left */}
              <path
                d="M90 270 L95 160 L50 115 M95 175 L140 130 M92 195 L65 165 M50 115 L30 95 M50 115 L65 90 M140 130 L165 110 M140 130 L130 102"
                stroke="#0b0314"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />

              {/* Gnarled Spooky Dead Tree Right */}
              <path
                d="M1330 265 L1325 150 L1275 105 M1325 170 L1375 120 M1325 190 L1360 160 M1275 105 L1250 85 M1275 105 L1290 80"
                stroke="#0b0314"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />

              {/* Cemetery Tombstones & Gothic Crosses */}
              {/* Tombstone 1 */}
              <path d="M210 265 L210 210 A22 22 0 0 1 254 210 L254 265 Z" fill="#1a0b2e" stroke="#2e1452" strokeWidth="2" />
              <text x="232" y="232" textAnchor="middle" fill="#581c87" fontSize="10" fontWeight="bold">RIP</text>

              {/* Gothic Cross 1 */}
              <path d="M345 260 L345 180 M325 202 L365 202" stroke="#150826" strokeWidth="9" strokeLinecap="round" />

              {/* Crooked Tombstone 2 */}
              <g transform="rotate(-7 480 240)">
                <path d="M460 270 L460 212 A24 24 0 0 1 508 212 L508 270 Z" fill="#17092b" stroke="#3b0764" strokeWidth="2" />
              </g>

              {/* Mausoleum / Crypt Silhouette */}
              <polygon points="690,260 690,195 735,168 780,195 780,260" fill="#120520" stroke="#2e1065" strokeWidth="2" />
              <rect x="722" y="215" width="26" height="45" fill="#07020d" />
              <path d="M735 150 L735 168 M727 158 L743 158" stroke="#120520" strokeWidth="4" />

              {/* Tombstone 3 */}
              <path d="M940 265 L940 205 A25 25 0 0 1 990 205 L990 265 Z" fill="#1a0b2e" stroke="#2e1452" strokeWidth="2" />
              <text x="965" y="230" textAnchor="middle" fill="#581c87" fontSize="10" fontWeight="bold">RIP</text>

              {/* Gothic Cross 2 */}
              <g transform="rotate(6 1120 220)">
                <path d="M1120 265 L1120 185 M1102 206 L1138 206" stroke="#150826" strokeWidth="8" strokeLinecap="round" />
              </g>

              {/* Foreground Dark Cemetery Ground */}
              <path
                d="M0 258 Q 360 238 720 258 T 1440 252 L 1440 320 L 0 320 Z"
                fill="#07020d"
              />

              {/* Glowing Carved Pumpkin Heads (Jack-o'-Lanterns) along the Cemetery */}
              {[
                { x: 155, y: 268, scale: 1.05 },
                { x: 395, y: 274, scale: 0.9 },
                { x: 625, y: 270, scale: 1.15 },
                { x: 855, y: 272, scale: 0.95 },
                { x: 1055, y: 268, scale: 1.1 },
                { x: 1245, y: 274, scale: 0.9 }
              ].map((p, idx) => (
                <g
                  key={idx}
                  transform={`translate(${p.x}, ${p.y}) scale(${p.scale})`}
                >
                  {/* Pumpkin Stem */}
                  <path d="M -3 -24 Q 0 -33 6 -30 L 4 -22 Z" fill="#3f6212" />
                  {/* Pumpkin Body */}
                  <ellipse cx="0" cy="-10" rx="22" ry="16" fill="#ea580c" />
                  <ellipse cx="0" cy="-10" rx="15" ry="16" fill="#f97316" />
                  <ellipse cx="0" cy="-10" rx="8" ry="16" fill="#fb923c" />
                  {/* Glowing Carved Eyes & Grin */}
                  <polygon points="-11,-13 -6,-20 -3,-12" fill="#fef08a" className="animate-pulse" />
                  <polygon points="11,-13 6,-20 3,-12" fill="#fef08a" className="animate-pulse" />
                  <polygon points="0,-11 -3,-7 3,-7" fill="#fde047" />
                  <path
                    d="M -12 -4 L -7 -1 L -4 -4 L 0 -1 L 4 -4 L 7 -1 L 12 -4 L 9 2 L 4 0 L 0 3 L -4 0 L -9 2 Z"
                    fill="#fef08a"
                    className="animate-pulse"
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. CHRISTMAS THEME: Winter Wonderland, Flying Reindeers & Falling Snowflakes
         ===================================================================== */}
      {activeTheme === 'christmas' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#041712] via-[#092920] to-[#11382c]">
          {/* Northern Lights / Festive Aurora Glow */}
          <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-r from-emerald-500/15 via-red-500/10 to-amber-400/15 blur-3xl" />

          {/* Glowing Winter Moon */}
          <div className="absolute top-12 right-[14%] w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-200 shadow-[0_0_80px_25px_rgba(254,243,199,0.35)] opacity-90" />

          {/* Flying Reindeers & Santa Sleigh Animation Across the Sky */}
          {animationsEnabled && (
            <div className="absolute top-[14%] left-0 w-full h-40 overflow-hidden pointer-events-none">
              <div className="animate-reindeer-flight inline-flex items-center">
                <svg
                  className="w-80 sm:w-[440px] h-28 text-amber-200 drop-shadow-[0_0_14px_rgba(251,191,36,0.75)]"
                  viewBox="0 0 500 120"
                  fill="currentColor"
                >
                  {/* Magical Golden Stardust Trail Behind Sleigh */}
                  <circle cx="25" cy="74" r="2.5" fill="#fde047" opacity="0.5" />
                  <circle cx="45" cy="68" r="3" fill="#fde047" opacity="0.7" />
                  <circle cx="65" cy="76" r="2" fill="#fde047" opacity="0.8" />
                  <circle cx="82" cy="65" r="3.5" fill="#fef08a" />

                  {/* Santa's Sleigh */}
                  <g transform="translate(95, 42)">
                    <path
                      d="M0 32 C10 32 16 44 30 44 L75 44 C88 44 96 32 102 22 L92 22 C86 30 82 32 72 32 L50 32 L50 14 C35 14 22 18 14 28 Z"
                      fill="#dc2626"
                      stroke="#fde047"
                      strokeWidth="2"
                    />
                    {/* Sleigh Runners */}
                    <path
                      d="M-5 48 L88 48 C98 48 106 40 108 33"
                      stroke="#fde047"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <line x1="25" y1="44" x2="25" y2="48" stroke="#fde047" strokeWidth="2.5" />
                    <line x1="68" y1="44" x2="68" y2="48" stroke="#fde047" strokeWidth="2.5" />
                    {/* Gift Sack & Santa Silhouette */}
                    <circle cx="32" cy="18" r="11" fill="#991b1b" />
                    <circle cx="58" cy="12" r="8" fill="#fef2f2" />
                    <path d="M48 14 Q58 2 68 14 Z" fill="#dc2626" />
                  </g>

                  {/* Golden Reins Connecting Sleigh to Reindeers */}
                  <path
                    d="M 192 66 Q 245 72 285 58 Q 345 68 395 52"
                    stroke="#fde047"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    fill="none"
                  />

                  {/* Reindeer #1 (Rear) */}
                  <g transform="translate(260, 34) scale(0.85)" className="animate-reindeer-gallop">
                    {/* Body & Legs */}
                    <ellipse cx="35" cy="34" rx="18" ry="9" fill="#d97706" />
                    <path d="M22 38 L10 52 M26 40 L18 55 M46 38 L58 50 M50 36 L64 44" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
                    {/* Neck & Head */}
                    <path d="M48 30 L58 16 L68 20 L55 34 Z" fill="#d97706" />
                    {/* Antlers */}
                    <path d="M56 16 L50 4 M56 12 L62 5 M53 8 L46 8" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
                    {/* Tail */}
                    <polygon points="17,32 10,28 14,36" fill="#fef3c7" />
                  </g>

                  {/* Reindeer #2 (Middle) */}
                  <g transform="translate(335, 28) scale(0.88)" className="animate-reindeer-gallop">
                    <ellipse cx="35" cy="34" rx="18" ry="9" fill="#d97706" />
                    <path d="M22 38 L12 54 M26 40 L22 55 M46 38 L60 48 M50 36 L65 42" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
                    <path d="M48 30 L58 16 L68 20 L55 34 Z" fill="#d97706" />
                    <path d="M56 16 L50 4 M56 12 L62 5 M53 8 L46 8" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
                    <polygon points="17,32 10,28 14,36" fill="#fef3c7" />
                  </g>

                  {/* Reindeer #3 (Lead - Rudolph with Glowing Red Nose) */}
                  <g transform="translate(410, 22) scale(0.92)" className="animate-reindeer-gallop">
                    <ellipse cx="35" cy="34" rx="18" ry="9" fill="#f59e0b" />
                    <path d="M22 38 L10 52 M26 40 L18 55 M46 38 L58 50 M50 36 L64 44" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
                    <path d="M48 30 L58 16 L68 20 L55 34 Z" fill="#f59e0b" />
                    <path d="M56 16 L50 4 M56 12 L62 5 M53 8 L46 8" stroke="#fde047" strokeWidth="2.2" strokeLinecap="round" />
                    {/* Glowing Red Nose */}
                    <circle cx="70" cy="20" r="3.5" fill="#ef4444" />
                    <circle cx="70" cy="20" r="6" fill="#ef4444" opacity="0.45" />
                  </g>
                </svg>
              </div>
            </div>
          )}

          {/* Falling Snowflakes */}
          {animationsEnabled &&
            snowflakes.map((flake) => (
              <div
                key={flake.id}
                className="absolute -top-8 text-white animate-snowfall"
                style={{
                  left: flake.left,
                  animationDuration: `${flake.duration}s`,
                  animationDelay: `${flake.delay}s`,
                  opacity: flake.opacity
                }}
              >
                {flake.isCrystal ? (
                  <span style={{ fontSize: `${flake.size + 4}px` }} className="drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">
                    ❄
                  </span>
                ) : (
                  <div
                    className="rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                    style={{ width: `${flake.size}px`, height: `${flake.size}px` }}
                  />
                )}
              </div>
            ))}

          {/* Snowy Christmas Pine Forest & Cozy Lit Village Landscape */}
          <div className="absolute bottom-0 inset-x-0 h-60 sm:h-72 pointer-events-none">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1440 300"
              preserveAspectRatio="none"
            >
              {/* Distant Snowy Mountains */}
              <path
                d="M0 240 L180 130 L350 230 L560 115 L780 235 L1020 125 L1250 225 L1440 145 L1440 300 L0 300 Z"
                fill="#07221b"
              />

              {/* Snow-Capped Evergreen Pine Trees & Christmas Trees */}
              {[60, 150, 260, 440, 620, 820, 960, 1140, 1290, 1380].map((x, idx) => {
                const scale = 0.75 + (idx % 3) * 0.2;
                return (
                  <g key={idx} transform={`translate(${x}, ${255 - scale * 10}) scale(${scale})`}>
                    <polygon points="0,-95 -32,-45 32,-45" fill="#064e3b" />
                    <polygon points="0,-70 -40,-15 40,-15" fill="#065f46" />
                    <polygon points="0,-42 -48,18 48,18" fill="#047857" />
                    {/* Snow caps */}
                    <polygon points="0,-95 -16,-70 16,-70" fill="#ecfdf5" opacity="0.85" />
                    {/* Christmas tree star & ornaments on select trees */}
                    {idx % 2 === 0 && (
                      <>
                        <circle cx="0" cy="-98" r="4.5" fill="#fde047" />
                        <circle cx="-12" cy="-35" r="3" fill="#ef4444" />
                        <circle cx="14" cy="-25" r="3" fill="#fde047" />
                        <circle cx="-18" cy="2" r="3" fill="#38bdf8" />
                        <circle cx="16" cy="4" r="3" fill="#ef4444" />
                      </>
                    )}
                  </g>
                );
              })}

              {/* Cozy Christmas Village Cottages with Warm Glowing Windows */}
              {[340, 710, 1040].map((hx, i) => (
                <g key={i} transform={`translate(${hx}, 225)`}>
                  <rect x="-28" y="0" width="56" height="36" fill="#1e1b4b" />
                  <polygon points="-34,0 0,-26 34,0" fill="#f8fafc" />
                  <rect x="-14" y="10" width="10" height="10" fill="#fde047" />
                  <rect x="4" y="10" width="10" height="10" fill="#fde047" />
                </g>
              ))}

              {/* Foreground Snowy Hills */}
              <path
                d="M0 255 Q 360 232 720 258 T 1440 248 L 1440 300 L 0 300 Z"
                fill="#e2e8f0"
                opacity="0.22"
              />
              <path
                d="M0 272 Q 420 255 880 274 T 1440 266 L 1440 300 L 0 300 Z"
                fill="#f8fafc"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. NEW YEAR THEME: Night Sky, Current Year Display, Fireworks & Twinkling Stars
         ===================================================================== */}
      {activeTheme === 'new_year' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#020512] via-[#070e29] to-[#11193d]">
          {/* Twinkling Night Stars */}
          {twinklingStars.map((star) => (
            <div
              key={star.id}
              className={`absolute ${animationsEnabled ? 'animate-star-twinkle' : ''}`}
              style={{
                left: star.left,
                top: star.top,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`
              }}
            >
              {star.isFlare ? (
                <svg
                  width={star.size * 5}
                  height={star.size * 5}
                  viewBox="0 0 24 24"
                  fill={star.color}
                  className="drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]"
                >
                  <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
                </svg>
              ) : (
                <div
                  className="rounded-full"
                  style={{
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    backgroundColor: star.color,
                    boxShadow: `0 0 6px ${star.color}`
                  }}
                />
              )}
            </div>
          ))}

          {/* Grand Current Year Emblem in the Night Sky Background */}
          <div className="absolute inset-x-0 top-16 sm:top-20 flex flex-col items-center justify-center pointer-events-none">
            <div className="px-4 py-1 rounded-full border border-yellow-400/30 bg-yellow-500/10 text-yellow-200/80 text-[11px] sm:text-xs font-extrabold tracking-[0.35em] uppercase shadow-[0_0_25px_rgba(234,179,8,0.25)]">
              ✨ Happy New Year ✨
            </div>
            <div
              className="text-[6.5rem] sm:text-[10rem] md:text-[13rem] font-black tracking-tighter leading-none bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600/40 bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(250,204,21,0.32)] opacity-35 select-none"
            >
              {currentYear}
            </div>
          </div>

          {/* Live Fireworks Canvas Layer */}
          <canvas
            ref={fireworksCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Night Skyline Silhouette at Bottom Horizon */}
          <div className="absolute bottom-0 inset-x-0 h-40 pointer-events-none">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1440 160"
              preserveAspectRatio="none"
            >
              <path
                d="M0 160 L0 120 L55 120 L55 85 L110 85 L110 115 L160 115 L160 65 L220 65 L220 110 L290 110 L290 78 L350 78 L350 125 L430 125 L430 50 L495 50 L495 105 L570 105 L570 80 L640 80 L640 118 L720 118 L720 35 L730 10 L740 35 L775 35 L775 110 L850 110 L850 68 L920 68 L920 115 L1010 115 L1010 58 L1080 58 L1080 108 L1160 108 L1160 82 L1230 82 L1230 120 L1310 120 L1310 72 L1380 72 L1380 115 L1440 115 L1440 160 Z"
                fill="#030712"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
