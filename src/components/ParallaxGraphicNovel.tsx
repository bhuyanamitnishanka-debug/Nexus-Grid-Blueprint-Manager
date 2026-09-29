import React, { useState } from 'react';
import { Sliders, Play, Pause, Compass, Layers, ArrowDownRight, Crosshair } from 'lucide-react';

interface ParallaxGraphicNovelProps {
  scrollY: number;
  onSelectPhase: (phaseId: 'p1' | 'p2' | 'p3' | 'p4' | 'p5') => void;
}

export const ParallaxGraphicNovel: React.FC<ParallaxGraphicNovelProps> = ({
  scrollY,
  onSelectPhase,
}) => {
  const [morphPosition, setMorphPosition] = useState<number>(55);
  const [isAutoSweeping, setIsAutoSweeping] = useState<boolean>(false);
  const [activeCallout, setActiveCallout] = useState<string>('c2');

  const handleSweepToggle = () => {
    setIsAutoSweeping((prev) => !prev);
  };

  React.useEffect(() => {
    if (!isAutoSweeping) return;
    let dir = 1;
    const interval = setInterval(() => {
      setMorphPosition((prev) => {
        const next = prev + dir * 0.7;
        if (next >= 95) {
          dir = -1;
          return 95;
        }
        if (next <= 8) {
          dir = 1;
          return 8;
        }
        return Number(next.toFixed(1));
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoSweeping]);

  const splitLeft = Math.max(5, Math.min(85, morphPosition - 18));
  const splitRight = Math.max(15, Math.min(95, morphPosition + 18));
  const parallaxOffset = Math.min(scrollY * 0.15, 60);

  return (
    <section id="graphic-novel-stage" className="py-16 lg:py-24 border-b border-slate-800/90 bg-blueprint-grid relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Editorial Chapter Header + Core Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-400">
              <span>ACT I · ACT II · ACT III</span>
              <span aria-hidden="true">·</span>
              <span>ENGINEERING GRAPHIC NOVEL CHRONICLE</span>
              <span aria-hidden="true">·</span>
              <span>PARALLAX TIMELINE</span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              From Concept Sketch to Digital Twin Architecture.
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed max-w-[65ch]">
              Track the transformation of a mission-critical data center across three architectural mediums:
              from manual graphite pencil strokes and tower crane clearances (Act I), to structural steel wireframe coordination (Act II),
              and the living thermodynamic digital twin with cold-aisle airflows and yellow power busways (Act III).
            </p>
          </div>

          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-8 space-y-3">
            <div className="text-xs font-mono text-slate-400">
              OPERATIONAL CORE PILLARS · TIER IV SPECIFICATION
            </div>
            <div className="grid grid-cols-3 gap-3 border-y border-slate-800/90 py-3">
              <div>
                <div className="text-xs text-slate-400">Scalability</div>
                <div className="text-lg font-mono font-semibold text-cyan-400 mt-0.5">Tier IV</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">6.4MW Modular</div>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <div className="text-xs text-slate-400">Reliability</div>
                <div className="text-lg font-mono font-semibold text-emerald-400 mt-0.5">99.995%</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">2N+1 Active</div>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <div className="text-xs text-slate-400">Target PUE</div>
                <div className="text-lg font-mono font-semibold text-amber-400 mt-0.5">1.15</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">ΔT 14.2°C Plume</div>
              </div>
            </div>
          </div>
        </div>

        {/* Morph Scrubber Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-t-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 mr-1">VISUAL STAGE:</span>
            <button
              onClick={() => {
                setIsAutoSweeping(false);
                setMorphPosition(85);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                morphPosition >= 70
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              1. Hand Sketch (Act I)
            </button>
            <button
              onClick={() => {
                setIsAutoSweeping(false);
                setMorphPosition(50);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                morphPosition > 30 && morphPosition < 70
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              2. Vector Wireframe (Act II)
            </button>
            <button
              onClick={() => {
                setIsAutoSweeping(false);
                setMorphPosition(15);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                morphPosition <= 30
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              3. Digital Twin (Act III)
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Sliders className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input
              type="range"
              min={5}
              max={95}
              value={morphPosition}
              onChange={(e) => {
                setIsAutoSweeping(false);
                setMorphPosition(Number(e.target.value));
              }}
              className="w-full accent-blue-500 cursor-ew-resize h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-xs font-mono text-cyan-300 tabular-nums w-20 text-right shrink-0">
              X-RAY: {morphPosition}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSweepToggle}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isAutoSweeping ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-blue-400" />}
              <span>{isAutoSweeping ? 'Pause Auto-Sweep' : 'Auto-Sweep'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Split-Curtain Graphic Novel Stage */}
        <div className="relative h-[480px] sm:h-[560px] w-full bg-slate-950 border-x border-b border-slate-800 rounded-b-2xl overflow-hidden select-none">
          {/* ACT III: The System Architecture Digital Twin (Base Right Layer) */}
          <div
            className="absolute inset-0 bg-slate-950"
            style={{ transform: `translate3d(0, ${parallaxOffset * 0.2}px, 0)` }}
          >
            {/* High-Precision SVG Isometric Cutaway Data Center Rendering */}
            <svg viewBox="0 0 1200 680" className="w-full h-full object-cover">
              <defs>
                <linearGradient id="cyanColdPlume" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="amberPowerLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {/* Blueprint Grid Floor */}
              <polygon points="120,440 680,80 1120,290 540,640" fill="#0A0E17" stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.4" />
              <line x1="120" y1="440" x2="540" y2="640" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.6" />
              <line x1="540" y1="640" x2="1120" y2="290" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.6" />

              {/* Room 1: West Power Wing (Generators & UPS) */}
              <polygon points="200,380 380,265 520,350 340,465" fill="#171C26" stroke="#F59E0B" strokeWidth="1.6" strokeOpacity="0.8" />
              {/* Yellow Diesel Generators */}
              <polygon points="250,385 290,360 340,390 300,415" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
              <polygon points="320,345 360,320 410,350 370,375" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
              {/* Overhead Yellow Power Conduits */}
              <path d="M 280,385 L 360,335 L 530,370 L 680,340" fill="none" stroke="url(#amberPowerLine)" strokeWidth="4" className="animate-flow-line" />

              {/* Room 2: Center Server Hall (4 Rows of Racks + Cyan Plumes) */}
              <polygon points="380,265 670,95 860,195 560,365" fill="#0E1626" stroke="#38BDF8" strokeWidth="1.8" />
              {/* Server Rows */}
              {[0, 1, 2, 3].map((idx) => {
                const offX = idx * 55;
                const offY = -idx * 30;
                return (
                  <g key={idx} transform={`translate(${offX}, ${offY})`}>
                    <polygon points="460,310 490,290 600,350 570,370" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.4" />
                    {/* Cyan Cold Aisle Airflow Plume */}
                    <path d="M 480,315 Q 520,265 580,325" fill="none" stroke="url(#cyanColdPlume)" strokeWidth="4" className="animate-flow-fast" />
                  </g>
                );
              })}

              {/* Room 3: North-East HVAC Chiller Plant */}
              <polygon points="670,95 800,165 720,215 590,145" fill="#111B2E" stroke="#3B82F6" strokeWidth="1.5" />
              <circle cx="680" cy="160" r="18" fill="#1E293B" stroke="#60A5FA" strokeWidth="2" />
              <circle cx="730" cy="185" r="18" fill="#1E293B" stroke="#60A5FA" strokeWidth="2" />
              <path d="M 700,170 L 610,220 L 560,260" fill="none" stroke="#60A5FA" strokeWidth="3" strokeDasharray="6 4" className="animate-flow-line" />

              {/* Room 4: South-East NOC Command Center */}
              <polygon points="770,240 980,230 890,365 700,285" fill="#0F241E" stroke="#10B981" strokeWidth="1.6" />
              {/* NOC Monitors */}
              <rect x="760" y="270" width="30" height="15" fill="#06B6D4" stroke="#22D3EE" rx="2" />
              <rect x="795" y="270" width="30" height="15" fill="#06B6D4" stroke="#22D3EE" rx="2" />
              <rect x="830" y="270" width="30" height="15" fill="#06B6D4" stroke="#22D3EE" rx="2" />
            </svg>
          </div>

          {/* ACT II: The Vector Perspective (Middle Layer with diagonal clip) */}
          <div
            className="absolute inset-0 bg-slate-950"
            style={{
              clipPath: `polygon(0 0, ${splitRight}% 0, ${Math.max(0, splitRight - 8)}% 100%, 0 100%)`,
              transform: `translate3d(0, ${parallaxOffset * 0.12}px, 0)`,
            }}
          >
            {/* SVG Wireframe CAD Blueprint */}
            <svg viewBox="0 0 1200 680" className="w-full h-full object-cover">
              {/* Dark CAD blueprint background grid */}
              <rect width="1200" height="680" fill="#060911" />
              {/* Structural Steel Trusses & Orthogonal Grid */}
              <g stroke="#06B6D4" strokeWidth="1.2" strokeOpacity="0.75" fill="none">
                {/* 3D Isometric Steel Framing Grid */}
                <line x1="80" y1="420" x2="620" y2="70" />
                <line x1="160" y1="470" x2="700" y2="120" />
                <line x1="240" y1="520" x2="780" y2="170" />
                <line x1="320" y1="570" x2="860" y2="220" />

                <line x1="80" y1="420" x2="480" y2="650" />
                <line x1="220" y1="330" x2="620" y2="560" />
                <line x1="360" y1="240" x2="760" y2="470" />
                <line x1="500" y1="150" x2="900" y2="380" />

                {/* Vertical Steel Column Stanchions */}
                <line x1="220" y1="330" x2="220" y2="180" strokeWidth="2" stroke="#38BDF8" />
                <line x1="360" y1="240" x2="360" y2="90" strokeWidth="2" stroke="#38BDF8" />
                <line x1="500" y1="150" x2="500" y2="10" strokeWidth="2" stroke="#38BDF8" />
                <line x1="480" y1="650" x2="480" y2="490" strokeWidth="2" stroke="#38BDF8" />

                {/* Subterranean Pilings */}
                <line x1="220" y1="330" x2="220" y2="440" strokeDasharray="4 4" stroke="#F59E0B" />
                <line x1="360" y1="240" x2="360" y2="350" strokeDasharray="4 4" stroke="#F59E0B" />
                <line x1="480" y1="650" x2="480" y2="760" strokeDasharray="4 4" stroke="#F59E0B" />

                {/* Crane Load Radius Arc */}
                <circle cx="280" cy="360" r="140" stroke="#F59E0B" strokeDasharray="6 6" strokeWidth="1.5" />
                <line x1="280" y1="360" x2="390" y2="270" stroke="#F59E0B" strokeWidth="2" />
                <text x="310" y="305" fill="#F59E0B" fontSize="11" fontFamily="monospace">62.5m CRANE JIB</text>
              </g>
            </svg>
          </div>

          {/* ACT I: The Hand Sketch Input (Left Layer with diagonal clip) */}
          <div
            className="absolute inset-0 bg-[#F3EFE6]"
            style={{
              clipPath: `polygon(0 0, ${splitLeft}% 0, ${Math.max(0, splitLeft - 8)}% 100%, 0 100%)`,
              transform: `translate3d(0, ${parallaxOffset * 0.05}px, 0)`,
            }}
          >
            {/* SVG Hand-Drawn Ink & Graphite Sketch */}
            <svg viewBox="0 0 1200 680" className="w-full h-full object-cover">
              {/* Paper Texture and Fine Graphite Lines */}
              <g stroke="#1E293B" strokeWidth="1.3" fill="none" opacity="0.85">
                {/* Two-point perspective vanishing lines */}
                <line x1="50" y1="360" x2="650" y2="100" stroke="#0284C7" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="50" y1="360" x2="450" y2="620" stroke="#0284C7" strokeWidth="0.8" strokeDasharray="3 3" />

                {/* Hand-drawn construction crane mast */}
                <line x1="260" y1="520" x2="260" y2="160" strokeWidth="2.5" />
                <line x1="275" y1="520" x2="275" y2="160" strokeWidth="2.5" />
                {/* Lacing */}
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <line key={i} x1="260" y1={200 + i * 45} x2="275" y2={220 + i * 45} strokeWidth="1.4" />
                ))}
                {/* Horizontal Crane Jib */}
                <line x1="140" y1="170" x2="520" y2="170" strokeWidth="2.2" />
                <line x1="267" y1="110" x2="140" y2="170" strokeWidth="1.4" />
                <line x1="267" y1="110" x2="440" y2="170" strokeWidth="1.4" />
                {/* Hoist cable */}
                <line x1="410" y1="170" x2="410" y2="340" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="4 2" />

                {/* Rough Building Footprint Sketch */}
                <polygon points="200,430 460,280 680,410 420,560" strokeWidth="2" />
                <line x1="200" y1="430" x2="200" y2="370" strokeWidth="2" />
                <line x1="420" y1="560" x2="420" y2="500" strokeWidth="2" />
                <line x1="680" y1="410" x2="680" y2="350" strokeWidth="2" />

                {/* Hand-lettered dimension callouts */}
                <text x="140" y="475" fill="#1E293B" fontSize="13" fontFamily="sans-serif" fontStyle="italic">
                  140m Master Span ➔
                </text>
                <text x="310" y="585" fill="#1E293B" fontSize="13" fontFamily="sans-serif" fontStyle="italic">
                  85m West Wing
                </text>
              </g>
            </svg>
          </div>

          {/* Diagonal Dividing Line Indicators */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 pointer-events-none"
            style={{ left: `${splitLeft}%` }}
          >
            <div className="absolute top-4 -translate-x-1/2 bg-slate-900/90 text-slate-100 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">
              ACT I: SKETCH
            </div>
          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] pointer-events-none"
            style={{ left: `${splitRight}%` }}
          >
            <div className="absolute top-4 -translate-x-1/2 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap font-bold">
              ACT II: VECTOR ➔ ACT III: TWIN
            </div>
          </div>

          {/* Interactive Callout Hotspots */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Pin 1: West Wing Diesel Generators */}
            <button
              onClick={() => {
                setActiveCallout('c1');
                onSelectPhase('p3');
              }}
              style={{ left: '26%', top: '56%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer"
            >
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold shadow-lg border transition-all ${
                  activeCallout === 'c1'
                    ? 'bg-amber-500 text-slate-950 border-white ring-4 ring-amber-500/30'
                    : 'bg-slate-950/90 text-amber-400 border-amber-500/50 hover:bg-slate-900'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>ZONE-A: 3.2MW GEN</span>
              </div>
            </button>

            {/* Pin 2: Center Core Server Hall */}
            <button
              onClick={() => {
                setActiveCallout('c2');
                onSelectPhase('p4');
              }}
              style={{ left: '52%', top: '44%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer"
            >
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold shadow-lg border transition-all ${
                  activeCallout === 'c2'
                    ? 'bg-cyan-400 text-slate-950 border-white ring-4 ring-cyan-400/30'
                    : 'bg-slate-950/90 text-cyan-300 border-cyan-500/50 hover:bg-slate-900'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>ZONE-B: 48 RACKS</span>
              </div>
            </button>

            {/* Pin 3: NOC Command Suite */}
            <button
              onClick={() => {
                setActiveCallout('c3');
                onSelectPhase('p5');
              }}
              style={{ left: '78%', top: '48%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer"
            >
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold shadow-lg border transition-all ${
                  activeCallout === 'c3'
                    ? 'bg-emerald-400 text-slate-950 border-white ring-4 ring-emerald-400/30'
                    : 'bg-slate-950/90 text-emerald-300 border-emerald-500/50 hover:bg-slate-900'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>ZONE-D: NOC ROOM</span>
              </div>
            </button>
          </div>

          {/* Bottom Progression Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto text-xs font-mono">
            <span className="font-bold text-white whitespace-nowrap">NEXUS-GRID BLUEPRINT MANAGER</span>
            <div className="flex items-center gap-4">
              <span className="text-blue-400">PHASE 01: CONCEPT</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">PHASE 02: STRUCTURAL</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">PHASE 03: POWER &amp; COOLING</span>
              <span className="text-slate-600">|</span>
              <span className="text-blue-400">PHASE 04: INFRA &amp; CABLING</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400">PHASE 05: DELIVERY &amp; NOC</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
