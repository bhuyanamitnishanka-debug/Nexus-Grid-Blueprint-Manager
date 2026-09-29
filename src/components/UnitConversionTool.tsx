import React, { useState } from 'react';
import {
  UnitSystem,
  convertTorque,
  convertStress,
  convertTemperature,
  convertForce,
  convertLengthMm,
  convertVolume,
  convertMass,
  ENGINEERING_CONVERSION_FACTORS,
  UNIT_CONVERSIONS,
} from '../utils/unitConversion';
import { PhysicsNodeState } from '../data/blueprintData';
import {
  ArrowLeftRight,
  Gauge,
  Flame,
  Droplets,
  Zap,
  Calculator,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Scale,
  Sparkles,
} from 'lucide-react';

interface UnitConversionToolProps {
  currentSystem: UnitSystem;
  onToggleSystem: (system: UnitSystem) => void;
  activeModifier?: number;
  physicsNodes?: PhysicsNodeState[];
  coolantLiters?: number;
  variant?: 'full' | 'compact' | 'hud';
}

export const UnitConversionTool: React.FC<UnitConversionToolProps> = ({
  currentSystem,
  onToggleSystem,
  activeModifier = 1.0,
  physicsNodes = [],
  coolantLiters = 480.0,
  variant = 'full',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(variant === 'full');
  const [calculatorCategory, setCalculatorCategory] = useState<string>('Torque / Moment');
  const [calcInputVal, setCalcInputVal] = useState<number>(150);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Derive key active physics metrics
  const activeTorqueNm = 150 * activeModifier;
  const maxStressMpa = physicsNodes.length > 0
    ? Math.max(...physicsNodes.map((n) => n.calculatedShearStressMpa))
    : 172.5 * activeModifier;
  const maxTempC = physicsNodes.length > 0
    ? Math.max(...physicsNodes.map((n) => n.operatingTemperatureC))
    : 48.5 * activeModifier;
  const nominalForceN = 120.0 * activeModifier;
  const primaryRadiusMm = physicsNodes[0]?.radiusMm || 45.0;

  // Real-time converted values
  const convertedTorque = convertTorque(activeTorqueNm, currentSystem);
  const convertedStress = convertStress(maxStressMpa, currentSystem);
  const convertedTemp = convertTemperature(maxTempC, currentSystem);
  const convertedCoolant = convertVolume(coolantLiters, currentSystem);
  const convertedForce = convertForce(nominalForceN, currentSystem);
  const convertedRadius = convertLengthMm(primaryRadiusMm, currentSystem);

  const handleCopyFormula = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Dynamic interactive calculation in Sandbox
  const computeSandboxValue = () => {
    switch (calculatorCategory) {
      case 'Torque / Moment':
        return currentSystem === 'metric'
          ? `${(calcInputVal * UNIT_CONVERSIONS.TORQUE_NM_TO_LBFFT).toFixed(2)} lbf·ft (${(calcInputVal * UNIT_CONVERSIONS.TORQUE_NM_TO_LBFIN).toFixed(1)} lbf·in)`
          : `${(calcInputVal * UNIT_CONVERSIONS.TORQUE_LBFFT_TO_NM).toFixed(2)} N·m`;
      case 'Torsional Shear Stress':
        return currentSystem === 'metric'
          ? `${(calcInputVal * UNIT_CONVERSIONS.STRESS_MPA_TO_PSI).toFixed(1)} psi (${(calcInputVal * 0.145038).toFixed(3)} ksi)`
          : `${(calcInputVal * UNIT_CONVERSIONS.STRESS_PSI_TO_MPA).toFixed(3)} MPa`;
      case 'External Force / Load':
        return currentSystem === 'metric'
          ? `${(calcInputVal * UNIT_CONVERSIONS.FORCE_N_TO_LBF).toFixed(2)} lbf`
          : `${(calcInputVal * UNIT_CONVERSIONS.FORCE_LBF_TO_N).toFixed(2)} N`;
      case 'Thermal Operating Temperature':
        return currentSystem === 'metric'
          ? `${((calcInputVal * 9) / 5 + 32).toFixed(1)} °F`
          : `${(((calcInputVal - 32) * 5) / 9).toFixed(1)} °C`;
      case 'Structural Dimensions / Radius':
        return currentSystem === 'metric'
          ? `${(calcInputVal * UNIT_CONVERSIONS.LENGTH_MM_TO_IN).toFixed(3)} in`
          : `${(calcInputVal * UNIT_CONVERSIONS.LENGTH_IN_TO_MM).toFixed(2)} mm`;
      case 'Component Mass':
        return currentSystem === 'metric'
          ? `${(calcInputVal * UNIT_CONVERSIONS.MASS_KG_TO_LBS).toFixed(2)} lbs`
          : `${(calcInputVal * UNIT_CONVERSIONS.MASS_LBS_TO_KG).toFixed(2)} kg`;
      case 'Coolant Fluid Reservoir':
        return currentSystem === 'metric'
          ? `${(calcInputVal * UNIT_CONVERSIONS.VOLUME_L_TO_GAL).toFixed(2)} gal`
          : `${(calcInputVal * UNIT_CONVERSIONS.VOLUME_GAL_TO_L).toFixed(2)} L`;
      default:
        return 'N/A';
    }
  };

  return (
    <div
      data-testid="unit-conversion-tool"
      className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl transition-all"
    >
      {/* Header bar with Master Toggle Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Unit Conversion Tool &amp; Live Telemetry Scaler
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold uppercase">
                Real-Time
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Instantaneous bidirectional conversion across all kinematics &amp; physics telemetry outputs.
            </p>
          </div>
        </div>

        {/* Master Real-Time Toggle Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => onToggleSystem('metric')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentSystem === 'metric'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌐 METRIC (SI)</span>
              {currentSystem === 'metric' && <Check className="w-3 h-3 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => onToggleSystem('imperial')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentSystem === 'imperial'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚙️ IMPERIAL (US)</span>
              {currentSystem === 'imperial' && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
            title={isExpanded ? 'Collapse Tool Details' : 'Expand Tool Details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Live Simulation Output Propagation HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3.5">
        {/* Metric 1: Base Torque */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>DRIVE TORQUE</span>
            <Gauge className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="mt-1">
            <span className="text-base font-mono font-bold text-white block">
              {convertedTorque.formatted}{' '}
              <span className="text-[11px] font-normal text-cyan-400">{convertedTorque.unit}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block truncate">
              Raw: {activeTorqueNm.toFixed(0)} N·m
            </span>
          </div>
        </div>

        {/* Metric 2: Peak Shear Stress */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>PEAK SHEAR (τ)</span>
            <Layers className="w-3 h-3 text-amber-400" />
          </div>
          <div className="mt-1">
            <span className="text-base font-mono font-bold text-white block">
              {convertedStress.formatted}{' '}
              <span className="text-[11px] font-normal text-amber-400">{convertedStress.unit}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block truncate">
              Raw: {maxStressMpa.toFixed(1)} MPa
            </span>
          </div>
        </div>

        {/* Metric 3: Gear Temperature */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>MAX TEMP</span>
            <Flame className="w-3 h-3 text-rose-400" />
          </div>
          <div className="mt-1">
            <span className="text-base font-mono font-bold text-white block">
              {convertedTemp.formatted}{' '}
              <span className="text-[11px] font-normal text-rose-400">{convertedTemp.unit}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block truncate">
              Raw: {maxTempC.toFixed(1)} °C
            </span>
          </div>
        </div>

        {/* Metric 4: Coolant Volume */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>RESERVOIR</span>
            <Droplets className="w-3 h-3 text-blue-400" />
          </div>
          <div className="mt-1">
            <span className="text-base font-mono font-bold text-white block">
              {convertedCoolant.formatted}{' '}
              <span className="text-[11px] font-normal text-blue-400">{convertedCoolant.unit}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block truncate">
              Raw: {coolantLiters.toFixed(1)} L
            </span>
          </div>
        </div>

        {/* Metric 5: Tool Thrust Force */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>TOOL THRUST</span>
            <Scale className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="mt-1">
            <span className="text-base font-mono font-bold text-white block">
              {convertedForce.formatted}{' '}
              <span className="text-[11px] font-normal text-emerald-400">{convertedForce.unit}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block truncate">
              Raw: {nominalForceN.toFixed(0)} N
            </span>
          </div>
        </div>

        {/* Metric 6: Primary Gear Radius */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>GEAR RADIUS</span>
            <Sparkles className="w-3 h-3 text-purple-400" />
          </div>
          <div className="mt-1">
            <span className="text-base font-mono font-bold text-white block">
              {convertedRadius.formatted}{' '}
              <span className="text-[11px] font-normal text-purple-400">{convertedRadius.unit}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block truncate">
              Raw: {primaryRadiusMm.toFixed(1)} mm
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Sandbox & Conversion Rates Reference */}
      {isExpanded && (
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Interactive Dynamic Calculator Sandbox */}
            <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Bidirectional Dynamic Sandbox
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Mode: {currentSystem === 'metric' ? 'Metric → Imperial' : 'Imperial → Metric'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Select Engineering Domain:
                  </label>
                  <select
                    value={calculatorCategory}
                    onChange={(e) => setCalculatorCategory(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {ENGINEERING_CONVERSION_FACTORS.map((f) => (
                      <option key={f.category} value={f.category}>
                        {f.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Input Value ({currentSystem === 'metric' ? 'Metric' : 'Imperial'}):
                  </label>
                  <input
                    type="number"
                    value={calcInputVal}
                    onChange={(e) => setCalcInputVal(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Dynamic Evaluated Result Box */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Calculated Physical Equivalency:
                  </span>
                  <span className="text-base font-mono font-extrabold text-cyan-300">
                    {computeSandboxValue()}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 bg-cyan-950 text-cyan-400 rounded border border-cyan-800">
                  {currentSystem === 'metric' ? 'SI ➔ US' : 'US ➔ SI'}
                </span>
              </div>
            </div>

            {/* Engineering Standard Conversion Factors Guide */}
            <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Conversion Rate Constants Matrix
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500">ISO / NIST / ASTM</span>
              </div>

              <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 text-[11px] font-mono">
                {ENGINEERING_CONVERSION_FACTORS.map((factor, idx) => (
                  <div
                    key={factor.category}
                    className="p-2 bg-slate-900/90 rounded border border-slate-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <span className="text-slate-200 font-bold block">{factor.category}</span>
                      <span className="text-slate-400 text-[10px] block truncate">
                        {factor.formula}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyFormula(factor.formula, `factor-${idx}`)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition shrink-0 cursor-pointer"
                    >
                      {copiedKey === `factor-${idx}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
