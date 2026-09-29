import React, { useState } from 'react';
import { PhysicsNodeState } from '../data/blueprintData';
import {
  Flame,
  Activity,
  Layers,
  Thermometer,
  AlertTriangle,
  Play,
  Pause,
  RotateCw,
  Eye,
  Info,
  ShieldAlert,
  Snowflake,
  Sparkles,
} from 'lucide-react';

interface MicroGearHeatMapVisualizerProps {
  nodes: PhysicsNodeState[];
  activeModifier: number;
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string;
  onResetNominal: () => void;
  onEmergencyCool: () => void;
  coolingBoostActive: boolean;
  thermalThresholds?: Record<string, number>;
}

export type HeatMapViewMode = 'THERMAL_HEATMAP' | 'SHEAR_STRESS' | 'KINEMATIC_VECTORS';

/**
 * Generates an SVG path for an involute-style spur gear with tooth profiles
 */
function generateGearPath(
  cx: number,
  cy: number,
  teeth: number,
  pitchRadius: number,
  toothDepth: number
): string {
  const outerRadius = pitchRadius + toothDepth / 2;
  const rootRadius = Math.max(8, pitchRadius - toothDepth / 2);
  const angleStep = (2 * Math.PI) / teeth;
  const quarterStep = angleStep / 4;

  let path = '';
  for (let i = 0; i < teeth; i++) {
    const a0 = i * angleStep;
    const a1 = a0 + quarterStep * 0.9;
    const a2 = a0 + quarterStep * 2;
    const a3 = a0 + quarterStep * 2.9;

    const r0x = cx + rootRadius * Math.cos(a0);
    const r0y = cy + rootRadius * Math.sin(a0);

    const o1x = cx + outerRadius * Math.cos(a1);
    const o1y = cy + outerRadius * Math.sin(a1);

    const o2x = cx + outerRadius * Math.cos(a2);
    const o2y = cy + outerRadius * Math.sin(a2);

    const r3x = cx + rootRadius * Math.cos(a3);
    const r3y = cy + rootRadius * Math.sin(a3);

    if (i === 0) {
      path += `M ${r0x} ${r0y} `;
    } else {
      path += `L ${r0x} ${r0y} `;
    }
    path += `L ${o1x} ${o1y} L ${o2x} ${o2y} L ${r3x} ${r3y} `;
  }
  path += 'Z';
  return path;
}

export const MicroGearHeatMapVisualizer: React.FC<MicroGearHeatMapVisualizerProps> = ({
  nodes,
  activeModifier,
  onSelectNode,
  selectedNodeId,
  onResetNominal,
  onEmergencyCool,
  coolingBoostActive,
  thermalThresholds,
}) => {
  const [viewMode, setViewMode] = useState<HeatMapViewMode>('THERMAL_HEATMAP');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Map nodes by ID for fast lookup
  const nodeMap = new Map(nodes.map((n) => [n.nodeId, n]));
  const node1 = nodeMap.get('MG-DRIVE-01') || nodes[0];
  const node2 = nodeMap.get('MG-TRANS-02') || nodes[1];
  const node3 = nodeMap.get('MG-ROBO-03') || nodes[2];
  const node4 = nodeMap.get('STR-CAM-04') || nodes[3];

  // Pre-defined thermal safety thresholds
  const defaultThresholds: Record<string, number> = {
    'MG-DRIVE-01': 75.0,
    'MG-TRANS-02': 70.0,
    'MG-ROBO-03': 65.0,
    'STR-CAM-04': 85.0,
  };
  const activeThresholds = { ...defaultThresholds, ...(thermalThresholds || {}) };

  // Selected node telemetry details
  const activeNode = nodeMap.get(selectedNodeId) || node1;

  // Determine critical thresholds and thermal safety breaches
  const breachedNodes = nodes.filter((n) => {
    const temp = coolingBoostActive
      ? Math.max(24, n.operatingTemperatureC - 15)
      : n.operatingTemperatureC;
    return temp > (activeThresholds[n.nodeId] || 75.0);
  });

  const criticalNodes = nodes.filter(
    (n) => n.safetyStatus === 'CRITICAL_SHEAR_FAILURE' || n.operatingTemperatureC >= 90
  );
  const elevatedNodes = nodes.filter(
    (n) =>
      (n.safetyStatus === 'HIGH_FATIGUE_RISK' || n.operatingTemperatureC >= 65) &&
      !criticalNodes.includes(n)
  );

  /**
   * Calculates color and opacity according to current mode and values
   */
  const getGearColors = (node: PhysicsNodeState) => {
    const temp = coolingBoostActive ? Math.max(24, node.operatingTemperatureC - 15) : node.operatingTemperatureC;
    const stressRatio = node.stressRatioPct;

    if (viewMode === 'THERMAL_HEATMAP') {
      if (temp >= 95 || node.safetyStatus === 'CRITICAL_SHEAR_FAILURE') {
        return {
          core: '#f43f5e',
          mid: '#ef4444',
          outer: '#fb7185',
          border: '#fda4af',
          glow: 'rgba(239, 68, 68, 0.75)',
          label: 'CRITICAL FAILURE RISK',
          badgeClass: 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse',
        };
      }
      if (temp >= 75) {
        return {
          core: '#f97316',
          mid: '#ea580c',
          outer: '#fdba74',
          border: '#fdba74',
          glow: 'rgba(249, 115, 22, 0.6)',
          label: 'APPROACHING THRESHOLD',
          badgeClass: 'bg-orange-950/80 border-orange-500 text-orange-300',
        };
      }
      if (temp >= 55) {
        return {
          core: '#eab308',
          mid: '#ca8a04',
          outer: '#fef08a',
          border: '#fde047',
          glow: 'rgba(234, 179, 8, 0.5)',
          label: 'ELEVATED FRICTION HEAT',
          badgeClass: 'bg-amber-950/80 border-amber-500 text-amber-300',
        };
      }
      return {
        core: '#06b6d4',
        mid: '#0891b2',
        outer: '#67e8f9',
        border: '#a5f3fc',
        glow: 'rgba(6, 182, 212, 0.4)',
        label: 'OPTIMAL THERMAL NOMINAL',
        badgeClass: 'bg-cyan-950/80 border-cyan-500 text-cyan-300',
      };
    } else if (viewMode === 'SHEAR_STRESS') {
      if (stressRatio >= 100 || node.safetyStatus === 'CRITICAL_SHEAR_FAILURE') {
        return {
          core: '#dc2626',
          mid: '#991b1b',
          outer: '#f87171',
          border: '#fca5a5',
          glow: 'rgba(220, 38, 38, 0.8)',
          label: 'SHEAR YIELD BOUNDARY EXCEEDED',
          badgeClass: 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse',
        };
      }
      if (stressRatio >= 70) {
        return {
          core: '#f59e0b',
          mid: '#d97706',
          outer: '#fcd34d',
          border: '#fde68a',
          glow: 'rgba(245, 158, 11, 0.6)',
          label: 'HIGH FATIGUE STRESS',
          badgeClass: 'bg-amber-950 border-amber-500 text-amber-300',
        };
      }
      return {
        core: '#10b981',
        mid: '#059669',
        outer: '#6ee7b7',
        border: '#a7f3d0',
        glow: 'rgba(16, 185, 129, 0.4)',
        label: 'NOMINAL ELASTIC STRAIN',
        badgeClass: 'bg-emerald-950 border-emerald-500 text-emerald-300',
      };
    } else {
      // Kinematic Vectors mode
      return {
        core: '#3b82f6',
        mid: '#1d4ed8',
        outer: '#93c5fd',
        border: '#bfdbfe',
        glow: 'rgba(59, 130, 246, 0.5)',
        label: 'KINEMATIC VELOCITY ACTIVE',
        badgeClass: 'bg-blue-950 border-blue-500 text-blue-300',
      };
    }
  };

  // Coordinates for the 4 meshed gears on canvas 800x480
  const layout = {
    // Node 1: Primary Drive (left-center)
    node1: { cx: 220, cy: 220, pitchR: 68, teeth: 24, depth: 14, rotDir: 1, baseSpeedSec: 6 },
    // Node 2: Secondary Transmission Reducer (center, meshing with Node 1)
    // Distance = 68 + 108 = 176 => cx = 220 + 176 = 396
    node2: { cx: 396, cy: 220, pitchR: 108, teeth: 48, depth: 16, rotDir: -1, baseSpeedSec: 12 },
    // Node 3: Medical/Automation Articulation Joint (offset upper right)
    node3: { cx: 580, cy: 130, pitchR: 48, teeth: 18, depth: 12, rotDir: 1, baseSpeedSec: 4.5 },
    // Node 4: Heavy Structural Dampening Cam (lower right, meshing with Node 2)
    // Offset angle ~ 40 deg down-right from Node 2
    node4: { cx: 575, cy: 335, pitchR: 120, teeth: 64, depth: 18, rotDir: 1, baseSpeedSec: 16 },
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top Header & Visualizer Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Flame className="w-3.5 h-3.5" />
            <span>THERMAL GRADIENT &amp; COMPONENT STRESS HEAT-MAP</span>
            <span aria-hidden="true">·</span>
            <span>MICRO-GEAR MESH KINEMATICS</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Color-Coded Micro-Gear Thermal Failure Overlay</span>
            {coolingBoostActive && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 flex items-center gap-1 animate-pulse">
                <Snowflake className="w-3 h-3" />
                COOLING BOOST ACTIVE (-15°C)
              </span>
            )}
          </h3>
        </div>

        {/* View Mode Pill Switcher & Animation Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-900 border border-slate-700/80 p-0.5 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setViewMode('THERMAL_HEATMAP')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'THERMAL_HEATMAP'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Thermal Heat-Map</span>
            </button>
            <button
              onClick={() => setViewMode('SHEAR_STRESS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'SHEAR_STRESS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Shear Stress (MPa)</span>
            </button>
            <button
              onClick={() => setViewMode('KINEMATIC_VECTORS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'KINEMATIC_VECTORS'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kinematics &amp; Pitch</span>
            </button>
          </div>

          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
              isRotating
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle rotation animation"
          >
            {isRotating ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3" />}
            <span>{isRotating ? 'Rotating' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Thermal Safety Threshold & Critical Failure Alarm Banner */}
      {breachedNodes.length > 0 && (
        <div className="bg-rose-950/80 border-b border-rose-500/70 p-3.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-200 animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-rose-300">
                ⚠️ THERMAL SAFETY THRESHOLD EXCEEDED ({breachedNodes.length} NODE{breachedNodes.length > 1 ? 'S' : ''}):
              </span>{' '}
              {breachedNodes.map((n) => {
                const temp = coolingBoostActive ? Math.max(24, n.operatingTemperatureC - 15) : n.operatingTemperatureC;
                const thresh = activeThresholds[n.nodeId] || 75.0;
                return `${n.nodeId} (${temp.toFixed(1)}°C > ${thresh}°C)`;
              }).join(', ')}. Contact friction approaching thermal breakdown limit!
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEmergencyCool}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Snowflake className="w-3 h-3" />
              <span>{coolingBoostActive ? 'Cooling Active' : 'Cooling Injection'}</span>
            </button>
            <button
              onClick={onResetNominal}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-mono text-[11px] font-semibold transition cursor-pointer"
            >
              Auto-Derate to 1.0x
            </button>
          </div>
        </div>
      )}

      {/* Main Visualizer Stage */}
      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
        {/* Left Column: Interactive SVG Gear Assembly & Thermal Mesh (8 Cols) */}
        <div className="xl:col-span-8 relative bg-[#06080D] border border-slate-800/90 rounded-2xl p-2 sm:p-4 overflow-hidden">
          {/* Subtle Blueprint Drafting Grid Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Canvas */}
          <svg
            viewBox="0 0 780 460"
            className="w-full h-auto select-none overflow-visible"
            style={{ minHeight: '340px' }}
          >
            <defs>
              {/* Radial Gradients for Thermal Overlays */}
              {nodes.map((node) => {
                const colors = getGearColors(node);
                return (
                  <radialGradient
                    key={`rad-${node.nodeId}`}
                    id={`thermal-grad-${node.nodeId}`}
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop offset="0%" stopColor={colors.core} stopOpacity="0.95" />
                    <stop offset="45%" stopColor={colors.mid} stopOpacity="0.8" />
                    <stop offset="85%" stopColor={colors.outer} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={colors.border} stopOpacity="0.15" />
                  </radialGradient>
                );
              })}

              {/* Dynamic Aura Glow Filter */}
              <filter id="thermal-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="critical-pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="16" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Meshing Kinematic Transmission Lines */}
            <g stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3">
              {/* Shaft link between Node 1 and Node 2 */}
              <line
                x1={layout.node1.cx}
                y1={layout.node1.cy}
                x2={layout.node2.cx}
                y2={layout.node2.cy}
              />
              {/* Shaft link from Node 2 to Node 4 */}
              <line
                x1={layout.node2.cx}
                y1={layout.node2.cy}
                x2={layout.node4.cx}
                y2={layout.node4.cy}
              />
              {/* Auxiliary Robotic link from Node 2 to Node 3 */}
              <line
                x1={layout.node2.cx}
                y1={layout.node2.cy}
                x2={layout.node3.cx}
                y2={layout.node3.cy}
                stroke="#0284c7"
                strokeWidth="1"
              />
            </g>

            {/* Contact Mesh Points Friction Glow */}
            {/* Mesh 1: between Node 1 & Node 2 (cx: 308, cy: 220) */}
            <g transform="translate(308, 220)">
              <circle
                r="10"
                fill={node1.operatingTemperatureC > 70 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.3)'}
                className={node1.operatingTemperatureC > 70 ? 'animate-ping' : ''}
              />
              <circle
                r="3"
                fill={node1.operatingTemperatureC > 70 ? '#f43f5e' : '#38bdf8'}
              />
            </g>

            {/* Mesh 2: between Node 2 & Node 4 */}
            <g transform="translate(485, 277)">
              <circle
                r="9"
                fill={node4.operatingTemperatureC > 70 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.3)'}
                className={node4.operatingTemperatureC > 70 ? 'animate-ping' : ''}
              />
              <circle
                r="3"
                fill={node4.operatingTemperatureC > 70 ? '#f43f5e' : '#38bdf8'}
              />
            </g>

            {/* Gear 1: MG-DRIVE-01 */}
            {renderGearNode(
              node1,
              layout.node1,
              isRotating,
              selectedNodeId === node1.nodeId,
              hoveredNodeId === node1.nodeId,
              onSelectNode,
              setHoveredNodeId,
              getGearColors(node1),
              viewMode,
              coolingBoostActive,
              activeThresholds[node1.nodeId] || 75.0
            )}

            {/* Gear 2: MG-TRANS-02 */}
            {renderGearNode(
              node2,
              layout.node2,
              isRotating,
              selectedNodeId === node2.nodeId,
              hoveredNodeId === node2.nodeId,
              onSelectNode,
              setHoveredNodeId,
              getGearColors(node2),
              viewMode,
              coolingBoostActive,
              activeThresholds[node2.nodeId] || 70.0
            )}

            {/* Gear 3: MG-ROBO-03 (Modular Surgical Robotics) */}
            {renderGearNode(
              node3,
              layout.node3,
              isRotating,
              selectedNodeId === node3.nodeId,
              hoveredNodeId === node3.nodeId,
              onSelectNode,
              setHoveredNodeId,
              getGearColors(node3),
              viewMode,
              coolingBoostActive,
              activeThresholds[node3.nodeId] || 65.0
            )}

            {/* Gear 4: STR-CAM-04 (Structural Dampening Cam) */}
            {renderGearNode(
              node4,
              layout.node4,
              isRotating,
              selectedNodeId === node4.nodeId,
              hoveredNodeId === node4.nodeId,
              onSelectNode,
              setHoveredNodeId,
              getGearColors(node4),
              viewMode,
              coolingBoostActive,
              activeThresholds[node4.nodeId] || 85.0
            )}
          </svg>

          {/* Color Gradient Scale Bar Overlay at Bottom */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              <span>{viewMode === 'THERMAL_HEATMAP' ? 'Thermal Gradient:' : 'Stress Gradient:'}</span>
            </div>

            {/* Gradient Strip */}
            <div className="flex-1 max-w-md w-full">
              <div
                className="h-2 rounded-full w-full"
                style={{
                  background:
                    viewMode === 'THERMAL_HEATMAP'
                      ? 'linear-gradient(to right, #06b6d4 0%, #10b981 30%, #eab308 60%, #f97316 80%, #ef4444 100%)'
                      : viewMode === 'SHEAR_STRESS'
                      ? 'linear-gradient(to right, #10b981 0%, #3b82f6 40%, #f59e0b 75%, #ef4444 100%)'
                      : 'linear-gradient(to right, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>{viewMode === 'THERMAL_HEATMAP' ? '24°C Nominal' : '0 MPa'}</span>
                <span>{viewMode === 'THERMAL_HEATMAP' ? '55°C Safe' : '100 MPa'}</span>
                <span>{viewMode === 'THERMAL_HEATMAP' ? '75°C Elevated' : '180 MPa'}</span>
                <span className="text-rose-400 font-bold">
                  {viewMode === 'THERMAL_HEATMAP' ? '95°C+ Critical Failure' : '280 MPa Yield'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Click any gear to inspect</span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Node High-Density Telemetry HUD (4 Cols) */}
        <div className="xl:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block">
                Component Telemetry HUD
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">{activeNode.name}</h4>
            </div>
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded-md border font-semibold ${
                getGearColors(activeNode).badgeClass
              }`}
            >
              {activeNode.nodeId}
            </span>
          </div>

          {/* Subsystem Application Context */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-[10px] text-slate-400 font-mono block">APPLICATION CONTEXT</span>
            <span className="text-slate-200 font-medium block mt-0.5">
              {activeNode.applicationContext}
            </span>
          </div>

          {/* Thermal Metrics Matrix */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 block">CORE TEMPERATURE</span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-lg font-bold ${
                    activeNode.operatingTemperatureC >= 90
                      ? 'text-rose-400 animate-pulse'
                      : activeNode.operatingTemperatureC >= 65
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {coolingBoostActive
                    ? (activeNode.operatingTemperatureC - 15).toFixed(1)
                    : activeNode.operatingTemperatureC}
                  °C
                </span>
                <span className="text-[11px] text-slate-500">
                  (
                  {(
                    (coolingBoostActive
                      ? activeNode.operatingTemperatureC - 15
                      : activeNode.operatingTemperatureC) *
                      1.8 +
                    32
                  ).toFixed(0)}
                  °F)
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 block">THERMAL HEADROOM</span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-lg font-bold ${
                    activeNode.operatingTemperatureC >= 85 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {Math.max(
                    0,
                    (activeNode.material === 'Structural_H_Steel' ? 110 : 95) -
                      (coolingBoostActive
                        ? activeNode.operatingTemperatureC - 15
                        : activeNode.operatingTemperatureC)
                  ).toFixed(1)}
                  °C
                </span>
                <span className="text-[10px] text-slate-500">to limit</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 block">SHEAR STRESS (TAU)</span>
              <span
                className={`text-base font-bold block ${
                  activeNode.calculatedShearStressMpa > 200 ? 'text-rose-400' : 'text-slate-200'
                }`}
              >
                {activeNode.calculatedShearStressMpa} MPa
              </span>
              <span className="text-[10px] text-slate-500 block">
                {activeNode.stressRatioPct}% yield
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 block">FATIGUE LIFE</span>
              <span className="text-base font-bold text-amber-400 block truncate">
                {activeNode.fatigueLifeRemainingCycles.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">Basquin Cycles</span>
            </div>
          </div>

          {/* Physical Specifications Ledger */}
          <div className="space-y-1.5 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Radius &amp; Teeth:</span>
              <span className="text-slate-200">
                {activeNode.radiusMm} mm ({activeNode.teethCount}T)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Material Spec:</span>
              <span className="text-slate-200">{activeNode.material.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Dynamic Gear Ratio:</span>
              <span className="text-cyan-400 font-semibold">{activeNode.gearRatio}:1</span>
            </div>
            <div className="flex justify-between">
              <span>Output Torque:</span>
              <span className="text-white font-bold">{activeNode.outputTorqueNm} Nm</span>
            </div>
          </div>

          {/* Failure Mitigation Action */}
          {(() => {
            const curTemp = coolingBoostActive
              ? Math.max(24, activeNode.operatingTemperatureC - 15)
              : activeNode.operatingTemperatureC;
            const thresh = activeThresholds[activeNode.nodeId] || 75.0;
            const isBreached = curTemp > thresh;

            if (isBreached) {
              return (
                <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-xl text-xs space-y-2 shadow-lg shadow-rose-500/10 animate-pulse">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>⚠️ THERMAL SAFETY THRESHOLD EXCEEDED</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed font-mono">
                    Current core temp ({curTemp.toFixed(1)}°C) exceeds pre-defined safety threshold of {thresh}°C by +{(curTemp - thresh).toFixed(1)}°C. Accelerated bearing fatigue and thermal shear risk active.
                  </p>
                  <button
                    onClick={onResetNominal}
                    className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition text-xs cursor-pointer shadow"
                  >
                    Auto-Derate to 1.0x (Restore Safe Margin)
                  </button>
                </div>
              );
            } else if (activeNode.operatingTemperatureC >= 65) {
              return (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Thermal Margin Alert ({curTemp.toFixed(1)}°C / {thresh}°C limit)</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Contact tooth friction is generating accelerated thermal rise. Approaching safety threshold.
                  </p>
                  <button
                    onClick={onResetNominal}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-xs cursor-pointer"
                  >
                    Reset Load to 1.0x (Cool Down)
                  </button>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
};

/**
 * Helper to render individual SVG gear with rotation, thermal gradients, and interactive hover
 */
function renderGearNode(
  node: PhysicsNodeState,
  cfg: {
    cx: number;
    cy: number;
    pitchR: number;
    teeth: number;
    depth: number;
    rotDir: number;
    baseSpeedSec: number;
  },
  isRotating: boolean,
  isSelected: boolean,
  isHovered: boolean,
  onSelectNode: (id: string) => void,
  setHoveredNodeId: (id: string | null) => void,
  colors: {
    core: string;
    mid: string;
    outer: string;
    border: string;
    glow: string;
    label: string;
    badgeClass: string;
  },
  viewMode: HeatMapViewMode,
  coolingActive: boolean,
  thermalThreshold: number = 75.0
) {
  const gearPath = generateGearPath(0, 0, cfg.teeth, cfg.pitchR, cfg.depth);
  const rotSec = cfg.baseSpeedSec;
  const isCritical = node.operatingTemperatureC >= 90 || node.safetyStatus === 'CRITICAL_SHEAR_FAILURE';
  const displayTemp = coolingActive
    ? Math.max(24, node.operatingTemperatureC - 15).toFixed(1)
    : node.operatingTemperatureC.toFixed(1);
  const isThermalBreached = parseFloat(displayTemp) > thermalThreshold;

  return (
    <g
      key={node.nodeId}
      transform={`translate(${cfg.cx}, ${cfg.cy})`}
      className="cursor-pointer transition-transform duration-300"
      onClick={() => onSelectNode(node.nodeId)}
      onMouseEnter={() => setHoveredNodeId(node.nodeId)}
      onMouseLeave={() => setHoveredNodeId(null)}
    >
      {/* Visual Warning Badge Over Micro-Gear When Thermal Safety Threshold Exceeded */}
      {isThermalBreached && (
        <g transform={`translate(0, ${-cfg.pitchR - 22})`} className="animate-bounce">
          <rect
            x="-68"
            y="-11"
            width="136"
            height="22"
            rx="6"
            fill="#881337"
            stroke="#f43f5e"
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            ⚠️ {displayTemp}°C &gt; {thermalThreshold}°C LIMIT
          </text>
        </g>
      )}

      {/* Outer Radiating Thermal Halo */}
      <circle
        r={cfg.pitchR + 24}
        fill="none"
        stroke={isThermalBreached ? '#f43f5e' : colors.glow}
        strokeWidth={isCritical || isThermalBreached ? '4' : '2'}
        strokeDasharray={isCritical || isThermalBreached ? '4 4' : 'none'}
        className={isCritical || isThermalBreached ? 'animate-pulse' : ''}
        opacity={isHovered || isSelected ? 0.9 : 0.4}
      />

      {/* Pulsing Thermal Breach Shockwave */}
      {isThermalBreached && (
        <circle
          r={cfg.pitchR + 32}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="1.5"
          strokeDasharray="6 3"
          className="animate-spin"
          style={{ animationDuration: '8s' }}
          opacity={0.8}
        />
      )}

      {/* Isothermal Contour Ring (showing 60°C / 80°C boundary) */}
      <circle
        r={cfg.pitchR + 10}
        fill="none"
        stroke={colors.border}
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.6"
      />

      {/* Rotating Gear Sprocket */}
      <g
        style={{
          transformOrigin: '0px 0px',
          animation: isRotating
            ? `spin-${node.nodeId} ${rotSec}s linear infinite ${cfg.rotDir < 0 ? 'reverse' : 'normal'}`
            : 'none',
        }}
      >
        <style>{`
          @keyframes spin-${node.nodeId} {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Gear Teeth Body with Thermal Radial Gradient */}
        <path
          d={gearPath}
          fill={`url(#thermal-grad-${node.nodeId})`}
          stroke={colors.border}
          strokeWidth={isSelected ? '2.5' : '1.5'}
          filter={isCritical ? 'url(#critical-pulse-glow)' : 'none'}
        />

        {/* Lightening Cutout Holes (Mechanical Aesthetic) */}
        {cfg.pitchR > 50 && (
          <g fill="#07090e" stroke={colors.border} strokeWidth="1">
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const hx = (cfg.pitchR * 0.55) * Math.cos(rad);
              const hy = (cfg.pitchR * 0.55) * Math.sin(rad);
              return <circle key={angle} cx={hx} cy={hy} r={cfg.pitchR * 0.16} />;
            })}
          </g>
        )}
      </g>

      {/* Center Static Hub & Telemetry Badge */}
      <circle
        r={Math.max(22, cfg.pitchR * 0.38)}
        fill="#07090e"
        stroke={isSelected ? '#38bdf8' : colors.border}
        strokeWidth={isSelected ? '3' : '2'}
      />

      {/* Center Keyway Axis Point */}
      <circle r="5" fill="#334155" />

      {/* Center Temperature & Node Label Text */}
      <text
        x="0"
        y="-4"
        textAnchor="middle"
        className="text-[10px] font-mono font-bold fill-white"
        style={{ pointerEvents: 'none' }}
      >
        {displayTemp}°C
      </text>

      <text
        x="0"
        y="11"
        textAnchor="middle"
        className={`text-[8px] font-mono font-semibold ${
          isCritical ? 'fill-rose-400' : 'fill-slate-400'
        }`}
        style={{ pointerEvents: 'none' }}
      >
        {node.nodeId}
      </text>

      {/* Floating Critical Alert Icon */}
      {isCritical && (
        <g transform="translate(0, -32)">
          <circle r="10" fill="#dc2626" />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            !
          </text>
        </g>
      )}

      {/* Selection Ring */}
      {isSelected && (
        <circle
          r={cfg.pitchR + 28}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="animate-spin"
          style={{ animationDuration: '20s' }}
        />
      )}
    </g>
  );
}
