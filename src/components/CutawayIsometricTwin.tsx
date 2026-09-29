import React, { useState } from 'react';
import { Crosshair, Zap, Wind, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CutawayIsometricTwinProps {
  onSelectPhase: (phaseId: 'p1' | 'p2' | 'p3' | 'p4' | 'p5') => void;
  onLogEvent: (level: 'INFO' | 'WARN' | 'SUCCESS' | 'CMD', msg: string) => void;
}

export const CutawayIsometricTwin: React.FC<CutawayIsometricTwinProps> = ({
  onSelectPhase,
  onLogEvent,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('zone-b');
  const [utilityBlackout, setUtilityBlackout] = useState<boolean>(false);
  const [loadPct, setLoadPct] = useState<number>(85);

  const activeKw = Math.round((6400 * loadPct) / 100);
  const currentPue = Number((1.12 + (loadPct > 90 ? 0.04 : 0.02) + (utilityBlackout ? 0.03 : 0)).toFixed(2));
  const coldTempC = Number((15.5 + (loadPct - 50) * 0.025).toFixed(1));
  const hotExhaustTempC = Number((coldTempC + 12 + (loadPct / 100) * 3.5).toFixed(1));

  const handleToggleBlackout = () => {
    const nextState = !utilityBlackout;
    setUtilityBlackout(nextState);
    if (nextState) {
      onLogEvent('WARN', 'SIMULATED UTILITY BLACKOUT TRIGGERED: Main grid 13.8kV feeds interrupted.');
      setTimeout(() => {
        onLogEvent('SUCCESS', 'V16 Diesel Generators synchronised in 6.8s. 2N+1 Island Mode Active.');
      }, 700);
    } else {
      onLogEvent('INFO', 'Utility grid feeds restored. Transfer switch returned to normal bus.');
    }
  };

  return (
    <section id="isometric-digital-twin" className="py-16 lg:py-24 border-b border-slate-800/90 bg-[#07090E]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
              <span>IMAGE 03 SYSTEM ARCHITECTURE</span>
              <span aria-hidden="true">·</span>
              <span>ISOMETRIC 3D DIGITAL TWIN</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              4-Zone Facility Cutaway &amp; Stress Simulator
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleBlackout}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer border ${
                utilityBlackout
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {utilityBlackout ? '▲ Grid Failure: Running on Diesel' : 'Simulate Utility Blackout'}
            </button>
          </div>
        </div>

        {/* Live Controls & Telemetry Tray */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-400">SERVER HALL IT LOAD</span>
              <span className="text-white font-semibold">{loadPct}% ({activeKw} kW)</span>
            </div>
            <input
              type="range"
              min={30}
              max={110}
              value={loadPct}
              onChange={(e) => setLoadPct(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between px-4 md:border-x border-slate-800">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">FACILITY PUE</span>
              <span className="text-lg font-mono font-bold text-emerald-400">{currentPue}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400 block">CONTAINMENT ΔT</span>
              <span className="text-sm font-mono font-bold text-cyan-300">
                {coldTempC}°C ➔ {hotExhaustTempC}°C
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">POWER SOURCE:</span>
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${
                utilityBlackout
                  ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
              }`}
            >
              {utilityBlackout ? 'N+1 Diesel Alternators' : 'Dual 13.8kV Utility Nominal'}
            </span>
          </div>
        </div>

        {/* Isometric Cutaway Blueprint Canvas */}
        <div className="relative aspect-[16/9] w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden select-none">
          <svg viewBox="0 0 1000 580" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="cyanPlume" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="amberPower" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
                <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Isometric Drafting Blueprint Table Perimeter */}
            <polygon points="50,370 560,45 950,225 440,550" fill="#0A0E17" stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.35" />
            <line x1="50" y1="370" x2="440" y2="550" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="440" y1="550" x2="950" y2="225" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.5" />
            <text x="210" y="480" fill="#38BDF8" fontSize="11" fontFamily="monospace" transform="rotate(27 210 480)">
              85.0m WEST WING
            </text>
            <text x="670" y="410" fill="#38BDF8" fontSize="11" fontFamily="monospace" transform="rotate(-27 670 410)">
              140.0m MASTER CONTAINMENT
            </text>

            {/* Room 1: West Power Wing (Generators & LiFePO4 Array) */}
            <g
              className="cursor-pointer"
              onClick={() => {
                setSelectedZone('zone-a');
                onSelectPhase('p3');
              }}
            >
              <polygon points="120,320 280,215 420,295 250,400" fill="#131924" stroke="#F59E0B" strokeWidth="1.6" />
              {/* Generators */}
              <polygon points="170,325 210,300 250,325 210,350" fill={utilityBlackout ? '#F59E0B' : '#CA8A04'} stroke="#EAB308" strokeWidth="1.5" />
              <polygon points="230,290 270,265 310,290 270,315" fill={utilityBlackout ? '#F59E0B' : '#CA8A04'} stroke="#EAB308" strokeWidth="1.5" />
              <circle cx="210" cy="325" r="5" fill="#FEF08A" />
              <circle cx="270" cy="290" r="5" fill="#FEF08A" />
              {/* Overhead Yellow Power Conduits */}
              <path d="M 200,325 L 260,280 L 410,310 L 530,280" fill="none" stroke="url(#amberPower)" strokeWidth={utilityBlackout ? 4.5 : 3} className={utilityBlackout ? 'animate-flow-fast' : 'animate-flow-line'} />
            </g>

            {/* Room 2: Center Server Hall (4 Rows of Cabinets & Cold Aisle Containment) */}
            <g
              className="cursor-pointer"
              onClick={() => {
                setSelectedZone('zone-b');
                onSelectPhase('p4');
              }}
            >
              <polygon points="280,215 540,65 710,155 450,310" fill="#0C1524" stroke="#38BDF8" strokeWidth="1.8" />
              {[0, 1, 2, 3].map((r) => {
                const ox = r * 45;
                const oy = -r * 25;
                return (
                  <g key={r} transform={`translate(${ox}, ${oy})`}>
                    <polygon points="350,250 375,235 465,285 440,300" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.4" />
                    <path d="M 365,255 Q 395,215 445,265" fill="none" stroke="url(#cyanPlume)" strokeWidth={3.8} className={loadPct > 80 ? 'animate-flow-fast' : 'animate-flow-line'} />
                  </g>
                );
              })}
            </g>

            {/* Room 3: North-East HVAC Chiller Plant */}
            <g
              className="cursor-pointer"
              onClick={() => {
                setSelectedZone('zone-c');
                onSelectPhase('p3');
              }}
            >
              <polygon points="540,65 650,125 580,170 470,110" fill="#0F1F33" stroke="#3B82F6" strokeWidth="1.5" />
              <circle cx="550" cy="120" r="16" fill="#1E293B" stroke="#60A5FA" strokeWidth="2" />
              <circle cx="590" cy="140" r="16" fill="#1E293B" stroke="#60A5FA" strokeWidth="2" />
              <path d="M 565,130 L 490,170 L 450,210" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeDasharray="5 5" className="animate-flow-line" />
            </g>

            {/* Room 4: South-East NOC Command Suite */}
            <g
              className="cursor-pointer"
              onClick={() => {
                setSelectedZone('zone-d');
                onSelectPhase('p5');
              }}
            >
              <polygon points="620,195 800,185 725,295 540,230" fill="#0C241B" stroke="#10B981" strokeWidth="1.6" />
              <rect x="620" y="215" width="22" height="12" fill="#06B6D4" stroke="#22D3EE" rx="2" />
              <rect x="646" y="215" width="22" height="12" fill="#06B6D4" stroke="#22D3EE" rx="2" />
              <rect x="672" y="215" width="22" height="12" fill="#06B6D4" stroke="#22D3EE" rx="2" />
              {/* Glass Door Mantrap Airlock */}
              <rect x="560" y="250" width="24" height="30" fill="#38BDF8" fillOpacity="0.25" stroke="#38BDF8" strokeWidth="1.2" />
            </g>

            {/* Zone Inspection Badges */}
            <g transform="translate(220, 370)" className="cursor-pointer" onClick={() => setSelectedZone('zone-a')}>
              <circle r="12" fill="#F59E0B" />
              <text y="4" textAnchor="middle" fill="#020617" fontSize="10" fontWeight="bold">A</text>
            </g>
            <g transform="translate(490, 240)" className="cursor-pointer" onClick={() => setSelectedZone('zone-b')}>
              <circle r="12" fill="#38BDF8" />
              <text y="4" textAnchor="middle" fill="#020617" fontSize="10" fontWeight="bold">B</text>
            </g>
            <g transform="translate(570, 110)" className="cursor-pointer" onClick={() => setSelectedZone('zone-c')}>
              <circle r="12" fill="#60A5FA" />
              <text y="4" textAnchor="middle" fill="#020617" fontSize="10" fontWeight="bold">C</text>
            </g>
            <g transform="translate(680, 240)" className="cursor-pointer" onClick={() => setSelectedZone('zone-d')}>
              <circle r="12" fill="#10B981" />
              <text y="4" textAnchor="middle" fill="#020617" fontSize="10" fontWeight="bold">D</text>
            </g>
          </svg>

          {/* Bottom Floating Legend / Zone Detail */}
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="text-white font-bold">
                {selectedZone === 'zone-a' && 'ZONE A: N+1 DIESEL GENERATOR & UPS WING'}
                {selectedZone === 'zone-b' && 'ZONE B: 4-ROW SERVER HALL & CYAN COLD-AISLE CONTAINMENT'}
                {selectedZone === 'zone-c' && 'ZONE C: DUAL CENTRIFUGAL CHILLER PLANT'}
                {selectedZone === 'zone-d' && 'ZONE D: 24/7 NETWORK OPERATIONS CENTER & MANTRAP AIRLOCK'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="text-amber-400">━━ Power Bus</span>
              <span className="text-cyan-400">━━ Cold Aisle</span>
              <span className="text-blue-400">━━ Chilled Loop</span>
              <span className="text-emerald-400">━━ NOC Link</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
