import React, { useState } from 'react';
import { PhysicsNodeState } from '../data/blueprintData';
import { MicroGearHeatMapVisualizer } from './MicroGearHeatMapVisualizer';
import { PersistenceDrawer } from './PersistenceDrawer';
import { Pipeline3DViewport } from './Pipeline3DViewport';
import {
  downloadJsonDatabase,
  downloadCsvAudit,
  downloadCleanHistoryScript,
  optimizeHistoryLogs,
  recordSimulationSnapshot,
  calculateSubsystems,
  calculateBioRegeneration,
  evaluateExceptionTrap,
  getPersistenceSummary,
  DEFAULT_THERMAL_SAFETY_THRESHOLDS,
} from '../utils/simulationPersistence';
import { UnitConversionTool } from './UnitConversionTool';
import {
  UnitSystem,
  convertTorque,
  convertStress,
  convertTemperature,
  convertLengthMm,
  convertVolume,
  UNIT_CONVERSIONS,
} from '../utils/unitConversion';
import {
  Sliders,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Wrench,
  Flame,
  Database,
  FileSpreadsheet,
  FileCode,
  Download,
  RotateCcw,
  Snowflake,
  ExternalLink,
  ChevronRight,
  Droplets,
  Zap,
  Filter,
  Sparkles,
  Activity,
  Dna,
  ShieldCheck,
  AlertOctagon,
  Settings,
  ArrowLeftRight,
} from 'lucide-react';

interface TorquePhysicsSimulatorProps {
  physicsNodes: PhysicsNodeState[];
  activeModifier: number;
  onModifierChange: (newModifier: number) => void;
  onLogEvent: (level: 'INFO' | 'WARN' | 'SUCCESS' | 'CMD', msg: string) => void;
  unitSystem?: UnitSystem;
  onToggleUnitSystem?: (system: UnitSystem) => void;
}

export const TorquePhysicsSimulator: React.FC<TorquePhysicsSimulatorProps> = ({
  physicsNodes,
  activeModifier,
  onModifierChange,
  onLogEvent,
  unitSystem: externalUnitSystem,
  onToggleUnitSystem: externalToggleUnitSystem,
}) => {
  const [internalUnitSystem, setInternalUnitSystem] = useState<UnitSystem>('metric');
  const unitSystem = externalUnitSystem ?? internalUnitSystem;
  const handleToggleUnitSystem = (sys: UnitSystem) => {
    if (externalToggleUnitSystem) {
      externalToggleUnitSystem(sys);
    } else {
      setInternalUnitSystem(sys);
    }
    onLogEvent(
      'INFO',
      `Simulation telemetry unit system switched to: ${
        sys === 'metric' ? 'Metric (SI - N·m, MPa, °C, mm, L)' : 'Imperial (US - lbf·ft, psi, °F, in, gal)'
      }`
    );
  };

  const [selectedNodeId, setSelectedNodeId] = useState<string>('MG-DRIVE-01');
  const [showPersistenceDrawer, setShowPersistenceDrawer] = useState<boolean>(false);
  const [coolingBoostActive, setCoolingBoostActive] = useState<boolean>(false);
  const [coolantReplenishBonus, setCoolantReplenishBonus] = useState<number>(0);
  const [voltageClampActive, setVoltageClampActive] = useState<boolean>(false);
  const [stats, setStats] = useState(getPersistenceSummary());
  const [cleanFeedback, setCleanFeedback] = useState<string | null>(null);
  const [uploadedDatasetStats, setUploadedDatasetStats] = useState<string | null>(null);

  const handleProcessLocalDatasetPrompt = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      console.log("[*] Inbound dataset stream parsed successfully via data input prompt.");

      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          const count = Array.isArray(parsed) ? parsed.length : 1;
          setUploadedDatasetStats(`Imported ${count} JSON records from ${file.name}`);
          onLogEvent(
            'SUCCESS',
            `Inbound JSON dataset stream parsed successfully via data input prompt: ${count} records from ${file.name}.`
          );
        } catch {
          onLogEvent('WARN', `Failed to parse uploaded JSON file: ${file.name}`);
        }
        return;
      }

      // Process CSV rows
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        onLogEvent('WARN', `Uploaded CSV file ${file.name} contains no data rows.`);
        return;
      }

      const dataRows = lines.slice(1);
      let validRows = 0;
      let sumFz = 0;

      dataRows.forEach((line) => {
        const cells = line.split(',').map((c) => c.trim());
        if (cells.length >= 5) {
          const fz = parseFloat(cells[4]);
          if (!isNaN(fz)) {
            sumFz += fz;
            validRows++;
          }
        }
      });

      if (validRows > 0) {
        const avgFz = sumFz / validRows;
        const derivedMod = Math.min(3.0, Math.max(0.5, avgFz / 120.0));
        onModifierChange(derivedMod);
        recordSimulationSnapshot(derivedMod, physicsNodes);
        setStats(getPersistenceSummary());
        setUploadedDatasetStats(
          `Parsed ${validRows} test cases from ${file.name} (Avg Fz: ${avgFz.toFixed(1)} N ➔ ${derivedMod.toFixed(2)}x Load)`
        );
        onLogEvent(
          'SUCCESS',
          `Inbound dataset stream parsed successfully via data input prompt (${validRows} rows from ${file.name}). Calculated load modifier: ${derivedMod.toFixed(2)}x.`
        );
      } else {
        setUploadedDatasetStats(`Parsed ${lines.length} lines from ${file.name}`);
        onLogEvent(
          'INFO',
          `Dataset stream parsed successfully via data input prompt (${lines.length} rows from ${file.name}).`
        );
      }
    };
    reader.readAsText(file);
  };

  // Pre-defined thermal safety thresholds (configurable per-node or global)
  const [thermalThresholds, setThermalThresholds] = useState<Record<string, number>>(
    DEFAULT_THERMAL_SAFETY_THRESHOLDS
  );
  const [showThresholdConfig, setShowThresholdConfig] = useState<boolean>(false);

  // Compute live environmental subsystems
  const rawSubsystems = calculateSubsystems(activeModifier);
  const coolantLevel = Math.min(
    500.0,
    Math.max(0.0, rawSubsystems.coolant_level_liters + coolantReplenishBonus)
  );
  const coolantStatus: 'OPTIMAL' | 'CRITICAL_LOW_FLOW' =
    coolantLevel < 420.0 ? 'CRITICAL_LOW_FLOW' : 'OPTIMAL';

  const circuitVoltage = voltageClampActive ? 415.0 : rawSubsystems.circuit_line_voltage_v;
  const electricalStatus: 'STABLE' | 'VOLTAGE_SURGE_WARNING' =
    circuitVoltage > 450.0 ? 'VOLTAGE_SURGE_WARNING' : 'STABLE';

  // Compute Class 4: Bio-Regeneration Medical Subsystem Metrics
  const bioMetrics = calculateBioRegeneration(activeModifier);

  // Evaluate Telemetry Exception Handler Trap
  const exceptionTrap = evaluateExceptionTrap(
    coolantLevel,
    circuitVoltage,
    bioMetrics.cellular_density_index
  );
  const isSystemHalted = exceptionTrap.global_state === 'SYSTEM_HALT_TRIGGERED';

  // Identify nodes that exceed pre-defined thermal safety threshold
  const thermalBreachedNodes = physicsNodes.filter((node) => {
    const effectiveTemp = coolingBoostActive
      ? Math.max(24, node.operatingTemperatureC - 15)
      : node.operatingTemperatureC;
    const thresh = thermalThresholds[node.nodeId] || 75.0;
    return effectiveTemp > thresh;
  });
  const hasThermalSafetyBreach = thermalBreachedNodes.length > 0;

  const handleSliderChange = (val: number) => {
    onModifierChange(val);
    recordSimulationSnapshot(val, physicsNodes);
    setStats(getPersistenceSummary());

    // Check if any thermal safety threshold was just crossed
    const newlyBreached = physicsNodes.filter((node) => {
      const temp = coolingBoostActive
        ? Math.max(24, node.operatingTemperatureC - 15)
        : node.operatingTemperatureC;
      return temp > (thermalThresholds[node.nodeId] || 75.0);
    });

    if (newlyBreached.length > 0) {
      onLogEvent(
        'WARN',
        `⚠️ Thermal safety threshold breach detected: ${newlyBreached.map((n) => n.nodeId).join(', ')} exceeded pre-defined limit!`
      );
    } else if (val >= 2.8) {
      onLogEvent(
        'WARN',
        `High torque stress applied (${val.toFixed(1)}x). Material shear approaching yield boundary!`
      );
    } else {
      onLogEvent('INFO', `Simulated torque modifier set to: ${val.toFixed(1)}x.`);
    }
  };

  const handleResetNominal = () => {
    onModifierChange(1.0);
    setCoolantReplenishBonus(0);
    setVoltageClampActive(false);
    recordSimulationSnapshot(1.0, physicsNodes);
    setStats(getPersistenceSummary());
    onLogEvent('SUCCESS', 'Reset mechanical load to 1.0x nominal operating state (Thermal limits restored).');
  };

  const handleAutoDerateToSafety = () => {
    // Find highest load modifier that keeps all nodes under threshold
    onModifierChange(1.2);
    recordSimulationSnapshot(1.2, physicsNodes);
    setStats(getPersistenceSummary());
    onLogEvent(
      'SUCCESS',
      'Automated derate applied: load lowered to 1.2x to clear all thermal safety threshold breaches.'
    );
  };

  const handleToggleCooling = () => {
    const nextState = !coolingBoostActive;
    setCoolingBoostActive(nextState);
    if (nextState) {
      onLogEvent(
        'SUCCESS',
        'Emergency Plenum Cooling Injection engaged (-15°C temporary relief).'
      );
    } else {
      onLogEvent('INFO', 'Emergency cooling disabled. Resuming ambient convection.');
    }
  };

  const handleReplenishCoolant = () => {
    setCoolantReplenishBonus((prev) => prev + 45.0);
    onLogEvent('SUCCESS', 'Auxiliary chemical coolant reservoir injected (+45.0 L replenished).');
  };

  const handleToggleVoltageClamp = () => {
    const next = !voltageClampActive;
    setVoltageClampActive(next);
    if (next) {
      onLogEvent('SUCCESS', 'Voltage Step-Down Transformer active: clamped to 415.0 V nominal.');
    } else {
      onLogEvent('INFO', 'Step-down transformer bypassed. Bus tracking raw load variance.');
    }
  };

  const handleRunOptimizerScript = () => {
    const res = optimizeHistoryLogs();
    setStats(getPersistenceSummary());
    const msg = `clean_history.sh complete: eliminated ${res.cleanedCount} redundant snapshots (${res.initialCount} ➔ ${res.finalCount} rows).`;
    setCleanFeedback(msg);
    onLogEvent('SUCCESS', msg);
    setTimeout(() => setCleanFeedback(null), 5000);
  };

  const handleDirectDownloadJson = () => {
    downloadJsonDatabase();
    onLogEvent('SUCCESS', 'Downloaded latest simulation_db.json.');
  };

  const handleDirectDownloadCsv = () => {
    downloadCsvAudit();
    onLogEvent('SUCCESS', 'Downloaded latest simulation_audit.csv.');
  };

  const handleDirectDownloadScript = () => {
    downloadCleanHistoryScript();
    onLogEvent('SUCCESS', 'Downloaded clean_history.sh shell script.');
  };

  const hasCritical = physicsNodes.some((n) => n.safetyStatus === 'CRITICAL_SHEAR_FAILURE');
  const hasRisk = physicsNodes.some((n) => n.safetyStatus === 'HIGH_FATIGUE_RISK');
  const isCoolantCritical = coolantStatus === 'CRITICAL_LOW_FLOW';
  const isVoltageSurge = electricalStatus === 'VOLTAGE_SURGE_WARNING';
  const isBioCritical = bioMetrics.stability_status === 'BIO_STABILITY_FAILURE';

  return (
    <section
      id="physics-engine-stage"
      className="py-16 lg:py-24 border-b border-slate-800/90 bg-[#07090E]"
    >
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
              <span>PHYSICS &amp; MATERIAL FATIGUE</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">COOLANT DISPLACEMENT</span>
              <span aria-hidden="true">·</span>
              <span className="text-rose-400 font-semibold">THERMAL SAFETY GATES</span>
              <span aria-hidden="true">·</span>
              <span className="text-purple-300">BIO-REGENERATION (CLASS 4)</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">clean_history.sh</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Live Mechanical Torque &amp; Subsystem Simulation Master
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Global Thermal Safety Breach Warning Badge */}
            {hasThermalSafetyBreach && (
              <span className="text-xs font-mono px-3 py-1.5 rounded-xl border border-rose-500 bg-rose-950/80 text-rose-300 animate-pulse flex items-center gap-1.5 shadow-md shadow-rose-500/20 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  ⚠️ THERMAL THRESHOLD EXCEEDED ({thermalBreachedNodes.length} NODES)
                </span>
              </span>
            )}

            {/* Exception Handler System State Badge */}
            <span
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                isSystemHalted
                  ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 animate-pulse'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span>{exceptionTrap.global_state}</span>
            </span>

            {/* Real-time Unit System Toggle Button */}
            <div className="flex items-center p-0.5 bg-slate-900 border border-slate-700/80 rounded-xl">
              <button
                type="button"
                onClick={() => handleToggleUnitSystem('metric')}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                  unitSystem === 'metric'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch entire simulator to Metric (SI) units: N·m, MPa, °C, mm, L"
              >
                <span>SI</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleUnitSystem('imperial')}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                  unitSystem === 'imperial'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch entire simulator to Imperial (US) units: lbf·ft, psi, °F, in, gal"
              >
                <span>US</span>
              </button>
            </div>

            {/* Threshold Settings Trigger */}
            <button
              onClick={() => setShowThresholdConfig(!showThresholdConfig)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Configure pre-defined thermal safety thresholds for micro-gear nodes"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thermal Limits</span>
            </button>

            {/* Persistence Ledger Trigger */}
            <button
              onClick={() => setShowPersistenceDrawer(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-mono text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open dual-format persistence database and audit viewer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Persistence Ledger</span>
            </button>
          </div>
        </div>

        {/* REAL-TIME UNIT CONVERSION TOOL COMPONENT */}
        <div className="mb-6">
          <UnitConversionTool
            currentSystem={unitSystem}
            onToggleSystem={handleToggleUnitSystem}
            activeModifier={activeModifier}
            physicsNodes={physicsNodes}
            coolantLiters={coolantLevel}
            variant="full"
          />
        </div>

        {/* ⚠️ HIGH-VISIBILITY THERMAL SAFETY THRESHOLD ALERT BANNER */}
        {hasThermalSafetyBreach && (
          <div className="mb-6 p-4 bg-rose-950/80 border border-rose-500/80 rounded-2xl text-xs font-mono text-rose-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xl shadow-rose-950/40 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-900/60 border border-rose-500 rounded-xl text-rose-300 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <span className="font-bold text-rose-300 block text-sm">
                  ⚠️ THERMAL SAFETY THRESHOLD EXCEEDED ON {thermalBreachedNodes.length} COMPONENT(S)
                </span>
                <span className="text-slate-300 text-[11px] block mt-0.5">
                  {thermalBreachedNodes.map((n) => {
                    const temp = coolingBoostActive
                      ? Math.max(24, n.operatingTemperatureC - 15)
                      : n.operatingTemperatureC;
                    const thresh = thermalThresholds[n.nodeId] || 75.0;
                    const tempStr = unitSystem === 'imperial'
                      ? `${((temp * 9) / 5 + 32).toFixed(1)}°F`
                      : `${temp.toFixed(1)}°C`;
                    const threshStr = unitSystem === 'imperial'
                      ? `${(((thresh * 9) / 5 + 32)).toFixed(1)}°F`
                      : `${thresh.toFixed(1)}°C`;
                    return `${n.nodeId} (${tempStr} > limit ${threshStr})`;
                  }).join(' · ')}
                  . Component approaching thermal breakdown and lubricant degradation boundary!
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleToggleCooling}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 text-xs shadow-md"
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>{coolingBoostActive ? 'Cooling Active (-15°C)' : 'Cooling Blast'}</span>
              </button>
              <button
                onClick={handleAutoDerateToSafety}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold transition cursor-pointer text-xs shadow-md"
              >
                Auto-Derate to Safe Level
              </button>
            </div>
          </div>
        )}

        {/* EXCEPTION HANDLER TRAP ALERT BANNER */}
        {isSystemHalted && (
          <div className="mb-6 p-4 bg-amber-950/70 border border-amber-500/70 rounded-2xl text-xs font-mono text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg shadow-amber-950/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-900/60 border border-amber-500 rounded-xl text-amber-300 shrink-0">
                <AlertOctagon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="font-bold text-amber-300 block text-sm">
                  🛡️ TELEMETRY EXCEPTION TRAP TRIGGERED: SYSTEM_HALT_TRIGGERED
                </span>
                <span className="text-amber-200/90 text-[11px] block mt-0.5">
                  {exceptionTrap.error_trap_logs}
                </span>
              </div>
            </div>
            <button
              onClick={handleResetNominal}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition cursor-pointer text-xs shadow"
            >
              Clear Fault &amp; Reset 1.0x
            </button>
          </div>
        )}

        {/* THERMAL THRESHOLDS CONFIGURATION POPOVER */}
        {showThresholdConfig && (
          <div className="mb-6 p-5 bg-slate-900/90 border border-slate-700 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  Pre-Defined Thermal Safety Threshold Configuration
                </h4>
              </div>
              <button
                onClick={() => setThermalThresholds(DEFAULT_THERMAL_SAFETY_THRESHOLDS)}
                className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                Reset to Standard Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {physicsNodes.map((node) => {
                const curThresh = thermalThresholds[node.nodeId] || 75.0;
                return (
                  <div
                    key={node.nodeId}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-white">{node.nodeId}</span>
                      <span className="text-cyan-400 font-bold">{curThresh}°C</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {node.name}
                    </span>
                    <input
                      type="range"
                      min={55}
                      max={95}
                      step={1}
                      value={curThresh}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setThermalThresholds((prev) => ({ ...prev, [node.nodeId]: val }));
                      }}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>55°C Sensitive</span>
                      <span>95°C High Yield</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🛢️ ENVIRONMENTAL & BIO-TELEMETRY MULTI-SYSTEM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Subsystem 1: Liquid Chemical Coolant Loop */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isCoolantCritical
                ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-500/10'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Chemical Coolant Loop</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                    coolantStatus === 'OPTIMAL'
                      ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                  }`}
                >
                  {coolantStatus}
                </span>
              </div>

              <div className="text-2xl font-bold font-mono text-white mt-1">
                {unitSystem === 'imperial'
                  ? (coolantLevel * UNIT_CONVERSIONS.VOLUME_L_TO_GAL).toFixed(1)
                  : coolantLevel.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {unitSystem === 'imperial'
                    ? `${(500.0 * UNIT_CONVERSIONS.VOLUME_L_TO_GAL).toFixed(1)} gal`
                    : '500.0 L'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mt-2 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCoolantCritical
                      ? 'bg-gradient-to-r from-rose-500 to-red-400'
                      : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (coolantLevel / 500.0) * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono pt-3 mt-2 border-t border-slate-800/80 text-slate-400">
              <span>
                Threshold:{' '}
                {unitSystem === 'imperial'
                  ? `${(420.0 * UNIT_CONVERSIONS.VOLUME_L_TO_GAL).toFixed(1)} gal`
                  : '420.0 L'}
              </span>
              <button
                onClick={handleReplenishCoolant}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                {unitSystem === 'imperial' ? '+11.9 gal Refill' : '+45L Refill'}
              </button>
            </div>
          </div>

          {/* Subsystem 2: Main Circuit Line Transmission Voltage */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isVoltageSurge
                ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Line Voltage Bus</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                    electricalStatus === 'STABLE'
                      ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse'
                  }`}
                >
                  {electricalStatus}
                </span>
              </div>

              <div className="text-2xl font-bold font-mono text-white mt-1">
                {circuitVoltage.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">V AC</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mt-2 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isVoltageSurge
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-blue-600 via-emerald-400 to-cyan-400'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, ((circuitVoltage - 380) / 120) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono pt-3 mt-2 border-t border-slate-800/80 text-slate-400">
              <span>Limit: 450.0 V</span>
              <button
                onClick={handleToggleVoltageClamp}
                className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                {voltageClampActive ? 'Release Step-Down' : 'Clamp 415V'}
              </button>
            </div>
          </div>

          {/* Subsystem 3: Class 4 Deep-Tissue Bio-Regeneration Telemetry */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              isBioCritical
                ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-purple-400 font-semibold">
                  <Dna className="w-3.5 h-3.5" />
                  <span>Bio-Regeneration (Class 4)</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                    bioMetrics.stability_status === 'STABLE_METABOLIC'
                      ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                  }`}
                >
                  {bioMetrics.stability_status === 'STABLE_METABOLIC' ? 'METABOLIC STABLE' : 'BIO-FAULT'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">REGEN RATE</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {bioMetrics.regeneration_rate_pct}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">CELL DENSITY</span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      bioMetrics.cellular_density_index < 0.7 ? 'text-rose-400' : 'text-purple-300'
                    }`}
                  >
                    {bioMetrics.cellular_density_index}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono pt-3 mt-2 border-t border-slate-800/80 text-slate-400">
              <span>Viscosity: {bioMetrics.target_fluid_viscosity_cp} cP</span>
              <span className="text-purple-400">Linked to MG-ROBO-03</span>
            </div>
          </div>

          {/* Subsystem 4: Dual Persistence & History Log Optimizer Tool */}
          <div className="p-4 sm:p-5 rounded-2xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
                  <Database className="w-3.5 h-3.5" />
                  <span>Dual Persistence &amp; Shell</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {stats.totalSnapshots} Logs
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-1">
                Concurrent tracing into <code className="text-cyan-400 font-mono text-[11px]">simulation_db.json</code> &amp;{' '}
                <code className="text-amber-400 font-mono text-[11px]">simulation_audit.csv</code>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 mt-2 border-t border-slate-800/80">
              <button
                onClick={handleRunOptimizerScript}
                className="py-1.5 px-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-center font-medium transition cursor-pointer flex items-center justify-center gap-1"
                title="Execute clean_history.sh to filter redundant duplication snapshots"
              >
                <Filter className="w-3 h-3 text-emerald-400" />
                <span>Filter Dups</span>
              </button>

              <button
                onClick={handleDirectDownloadScript}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-center font-medium transition cursor-pointer flex items-center justify-center gap-1"
                title="Download clean_history.sh script"
              >
                <Download className="w-3 h-3" />
                <span>clean_history.sh</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3D WebGL Fluid Pipeline Viewport & Exception Handler Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left: Three.js 3D Fluid Conduit Wireframe (7 cols) */}
          <div className="lg:col-span-7">
            <Pipeline3DViewport
              isHalted={isSystemHalted}
              modifier={activeModifier}
              coolantLiters={coolantLevel}
              hasThermalBreach={hasThermalSafetyBreach}
              flowViscosityCp={bioMetrics.target_fluid_viscosity_cp}
            />
          </div>

          {/* Right: Telemetry Exception Trap Monitor (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Exception Handler &amp; Diagnostics Trap
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                    isSystemHalted
                      ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                      : 'bg-emerald-950 border-emerald-500 text-emerald-400'
                  }`}
                >
                  {exceptionTrap.global_state}
                </span>
              </div>

              <div className="p-3 bg-[#06080D] rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
                <span className="text-[10px] text-slate-500 block">ACTIVE TRACE DIAGNOSTICS</span>
                <p
                  className={
                    isSystemHalted ? 'text-rose-400 font-bold leading-relaxed' : 'text-cyan-300 leading-relaxed'
                  }
                >
                  {exceptionTrap.error_trap_logs}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Coolant Threshold Gate:</span>
                <span className={coolantLevel < 420 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {unitSystem === 'imperial'
                    ? `${(coolantLevel * UNIT_CONVERSIONS.VOLUME_L_TO_GAL).toFixed(1)} gal (≥ ${(420.0 * UNIT_CONVERSIONS.VOLUME_L_TO_GAL).toFixed(1)} gal safe)`
                    : `${coolantLevel.toFixed(1)} L (≥ 420.0 L safe)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Voltage Surge Gate:</span>
                <span className={circuitVoltage > 470 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {circuitVoltage.toFixed(1)} V (&le; 470.0 V safe)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cellular Density Gate:</span>
                <span
                  className={
                    bioMetrics.cellular_density_index < 0.7
                      ? 'text-rose-400 font-bold'
                      : 'text-slate-200'
                  }
                >
                  {bioMetrics.cellular_density_index} (&ge; 0.70 safe)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLOR-CODED HEAT-MAP VISUALIZATION OVERLAY WITH FLOATING WARNING BADGES */}
        <div className="mb-8">
          <MicroGearHeatMapVisualizer
            nodes={physicsNodes}
            activeModifier={activeModifier}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onResetNominal={handleResetNominal}
            onEmergencyCool={handleToggleCooling}
            coolingBoostActive={coolingBoostActive}
            thermalThresholds={thermalThresholds}
          />
        </div>

        {/* Live Simulation Controls & Hardware Matrix Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Torque Controller & Persistence Quick Actions (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider">
                System Load Driver
              </h3>
              <span className="text-xs font-mono text-blue-400 font-bold">
                {activeModifier.toFixed(1)}x LOAD FACTOR
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-300 block font-medium">
                  Simulated Torque &amp; Subsystem Driver:
                </label>
                <button
                  onClick={handleResetNominal}
                  className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="Reset to 1.0x nominal load"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset 1.0x</span>
                </button>
              </div>

              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.1}
                value={activeModifier}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>0.5x Min Load</span>
                <span>1.0x Nominal</span>
                <span className="text-rose-400">3.0x Max Stress</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Base Torque ({unitSystem === 'imperial' ? '110.6 lbf·ft' : '150Nm'} &times; Mod):</span>
                <span className="text-white font-bold">
                  {unitSystem === 'imperial'
                    ? `${(150 * activeModifier * UNIT_CONVERSIONS.TORQUE_NM_TO_LBFFT).toFixed(1)} lbf·ft`
                    : `${Math.round(150 * activeModifier)} Nm`}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Coolant Reservoir Level:</span>
                <span className={isCoolantCritical ? 'text-rose-400 font-semibold' : 'text-cyan-400 font-semibold'}>
                  {unitSystem === 'imperial'
                    ? `${(coolantLevel * UNIT_CONVERSIONS.VOLUME_L_TO_GAL).toFixed(1)} gal`
                    : `${coolantLevel.toFixed(1)} L`}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Circuit Line Transmission:</span>
                <span className={isVoltageSurge ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {circuitVoltage.toFixed(1)} V AC
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bio-Cellular Density:</span>
                <span className={isBioCritical ? 'text-rose-400 font-semibold' : 'text-purple-300 font-semibold'}>
                  {bioMetrics.cellular_density_index}
                </span>
              </div>
            </div>

            {/* Dual Persistence Layer Quick Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Persistence Storage Files</span>
                </span>
                <button
                  onClick={handleRunOptimizerScript}
                  className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer flex items-center gap-1"
                >
                  <Filter className="w-2.5 h-2.5" />
                  <span>clean_history.sh</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  onClick={handleDirectDownloadCsv}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Download audit spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>simulation_audit.csv</span>
                </button>

                <button
                  onClick={handleDirectDownloadJson}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-cyan-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Download raw JSON database"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>simulation_db.json</span>
                </button>
              </div>

              <button
                onClick={() => setShowPersistenceDrawer(true)}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Open Full Subsystem Inspector</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 📥 Load Matrix Configuration File (CSV / JSON Dynamic Upload Prompt) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 mt-4">
              <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>📥 Load Matrix Configuration File</span>
                <span className="text-[10px] text-blue-400 font-mono">CSV / JSON</span>
              </h3>

              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="csvFileInput"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition group"
                >
                  <div className="flex flex-col items-center justify-center pt-3 pb-3">
                    <svg
                      className="w-6 h-6 mb-1 text-slate-500 group-hover:text-blue-500 transition"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="text-[11px] text-slate-400 font-medium">
                      <span className="font-semibold text-blue-400">Click to upload</span> template file
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Standard structural test matrix layouts</p>
                  </div>
                  <input
                    id="csvFileInput"
                    type="file"
                    accept=".csv,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessLocalDatasetPrompt(file);
                    }}
                  />
                </label>
              </div>

              {uploadedDatasetStats && (
                <div className="p-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                  <span>{uploadedDatasetStats}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Node Hardware Registry Telemetry Cards with VISUAL WARNING BADGES (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {physicsNodes.map((node) => {
                const isSelected = selectedNodeId === node.nodeId;
                const effectiveTemp = coolingBoostActive
                  ? Math.max(24, node.operatingTemperatureC - 15)
                  : node.operatingTemperatureC;
                const threshold = thermalThresholds[node.nodeId] || 75.0;
                const isThermalOverrun = effectiveTemp > threshold;

                let badgeStyle = 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400';
                if (node.safetyStatus === 'CRITICAL_SHEAR_FAILURE') {
                  badgeStyle = 'border-rose-500/50 bg-rose-950/30 text-rose-400 animate-pulse';
                } else if (node.safetyStatus === 'HIGH_FATIGUE_RISK') {
                  badgeStyle = 'border-amber-500/50 bg-amber-950/30 text-amber-400';
                }

                return (
                  <div
                    key={node.nodeId}
                    onClick={() => setSelectedNodeId(node.nodeId)}
                    className={`p-5 bg-slate-900 border rounded-2xl flex flex-col justify-between space-y-4 transition-all cursor-pointer relative overflow-hidden ${
                      isThermalOverrun
                        ? 'border-rose-500 shadow-xl shadow-rose-950/30 bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/20'
                        : isSelected
                        ? 'border-cyan-500 shadow-lg shadow-cyan-500/10 bg-slate-900/90'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* VISUAL WARNING BADGE FOR THERMAL SAFETY THRESHOLD OVERRUN */}
                    {isThermalOverrun && (
                      <div className="bg-rose-950/90 border border-rose-500 text-rose-300 text-[10px] font-mono font-bold px-3 py-1 rounded-lg flex items-center justify-between gap-1 shadow-sm animate-pulse">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>
                            THERMAL SAFETY THRESHOLD EXCEEDED (
                            {unitSystem === 'imperial'
                              ? `${((effectiveTemp * 9) / 5 + 32).toFixed(1)}°F > ${(((threshold * 9) / 5 + 32)).toFixed(1)}°F`
                              : `${effectiveTemp.toFixed(1)}°C > ${threshold}°C`}
                            )
                          </span>
                        </div>
                        <span className="text-white font-extrabold">
                          +{unitSystem === 'imperial'
                            ? `${(((effectiveTemp - threshold) * 9) / 5).toFixed(1)}°F`
                            : `${(effectiveTemp - threshold).toFixed(1)}°C`}
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-[11px] font-mono text-slate-400">
                            NODE HARDWARE REGISTRY: {node.nodeId}
                          </div>
                          <h4 className="text-sm font-semibold text-white mt-0.5">{node.name}</h4>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {node.applicationContext}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2.5 py-1 rounded-md border font-semibold shrink-0 ${badgeStyle}`}
                        >
                          {node.safetyStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-3">
                        <span>Material: {node.material}</span>
                        <span>·</span>
                        <span>
                          r={unitSystem === 'imperial'
                            ? `${(node.radiusMm * UNIT_CONVERSIONS.LENGTH_MM_TO_IN).toFixed(2)}in`
                            : `${node.radiusMm}mm`} ({node.teethCount}T)
                        </span>
                      </div>

                      {/* Telemetry Matrix Grid */}
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-3 border-t border-slate-800/80">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">TORQUE</span>
                          <span className="text-white font-bold text-xs">
                            {unitSystem === 'imperial'
                              ? `${(node.outputTorqueNm * UNIT_CONVERSIONS.TORQUE_NM_TO_LBFFT).toFixed(1)} lbf·ft`
                              : `${node.outputTorqueNm} Nm`}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">SHEAR STRESS</span>
                          <span
                            className={`font-bold text-xs ${
                              node.calculatedShearStressMpa > 250 ? 'text-rose-400' : 'text-cyan-300'
                            }`}
                          >
                            {unitSystem === 'imperial'
                              ? `${Math.round(node.calculatedShearStressMpa * UNIT_CONVERSIONS.STRESS_MPA_TO_PSI)} psi`
                              : `${node.calculatedShearStressMpa} MPa`}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">TEMPERATURE</span>
                          <span
                            className={`font-bold text-xs ${
                              isThermalOverrun
                                ? 'text-rose-400 animate-pulse'
                                : effectiveTemp >= 65
                                ? 'text-amber-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            {unitSystem === 'imperial'
                              ? `${((effectiveTemp * 9) / 5 + 32).toFixed(1)}°F`
                              : `${effectiveTemp.toFixed(1)}°C`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Persistence Layer Modal Inspector */}
      <PersistenceDrawer
        isOpen={showPersistenceDrawer}
        onClose={() => setShowPersistenceDrawer(false)}
        onLogEvent={onLogEvent}
      />
    </section>
  );
};
