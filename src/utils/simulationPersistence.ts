import { PhysicsNodeState } from '../data/blueprintData';

export interface SubsystemMetrics {
  coolant_level_liters: number;
  coolant_status: 'OPTIMAL' | 'CRITICAL_LOW_FLOW';
  circuit_line_voltage_v: number;
  electrical_status: 'STABLE' | 'VOLTAGE_SURGE_WARNING';
}

export interface BioRegenerationMetrics {
  regeneration_rate_pct: number;
  cellular_density_index: number;
  target_fluid_viscosity_cp: number;
  stability_status: 'STABLE_METABOLIC' | 'BIO_STABILITY_FAILURE';
}

export interface ExceptionHandlerStatus {
  global_state: 'STABLE_OPERATION' | 'SYSTEM_HALT_TRIGGERED';
  error_trap_logs: string;
}

export interface TelemetrySnapshot {
  timestamp: string;
  active_layout_modifier: number;
  subsystems: SubsystemMetrics;
  medical_regeneration?: BioRegenerationMetrics;
  exception_handler_status?: ExceptionHandlerStatus;
  telemetry: Record<
    string,
    {
      node_id: string;
      name?: string;
      output_torque_nm: number;
      calculated_shear_stress_mpa: number;
      safety_status: string;
      temperature_c?: number;
      fatigue_life_cycles?: number;
    }
  >;
}

export const DEFAULT_THERMAL_SAFETY_THRESHOLDS: Record<string, number> = {
  'MG-DRIVE-01': 75.0, // Primary Hybrid Crankshaft Drive: continuous boundary 75°C
  'MG-TRANS-02': 70.0, // Secondary Transmission Reducer: continuous boundary 70°C
  'MG-ROBO-03': 65.0, // Robotic Articulation Joint: bio-stability boundary 65°C
  'STR-CAM-04': 85.0, // Structural Dampening Cam: structural steel boundary 85°C
};

const STORAGE_KEY_JSON = 'nexus_simulation_db_json';
const STORAGE_KEY_CSV = 'nexus_simulation_audit_csv';

export const CSV_HEADER =
  'Timestamp,Load_Modifier,Coolant_Liters,Circuit_Voltage_V,Regen_Rate_Pct,Cell_Density_Indices,System_Stability\n';

/**
 * Calculates environmental subsystems: coolant level (liters) and circuit line voltage (V)
 */
export function calculateSubsystems(modifier: number): SubsystemMetrics {
  const baseCoolantCapacity = 500.0;
  const baseVoltage = 415.0;

  const currentCoolant = Math.max(0.0, baseCoolantCapacity - 45.5 * (modifier - 1.0));
  const currentVoltage = baseVoltage + 35.2 * (modifier - 1.0);

  const coolantStatus: 'OPTIMAL' | 'CRITICAL_LOW_FLOW' =
    currentCoolant < 420.0 ? 'CRITICAL_LOW_FLOW' : 'OPTIMAL';
  const electricalStatus: 'STABLE' | 'VOLTAGE_SURGE_WARNING' =
    currentVoltage > 450.0 ? 'VOLTAGE_SURGE_WARNING' : 'STABLE';

  return {
    coolant_level_liters: Number(currentCoolant.toFixed(1)),
    coolant_status: coolantStatus,
    circuit_line_voltage_v: Number(currentVoltage.toFixed(1)),
    electrical_status: electricalStatus,
  };
}

/**
 * Calculates Class 4: Automated Deep-Tissue Bio-Regeneration Metrics
 */
export function calculateBioRegeneration(modifier: number): BioRegenerationMetrics {
  const baseRegenRate = 94.2;
  const baseDensity = 1.25;

  const currentRegen = Math.min(100.0, baseRegenRate + 2.5 * modifier);
  const currentDensity = Math.max(0.5, baseDensity - 0.35 * (modifier - 1.0));

  return {
    regeneration_rate_pct: Number(currentRegen.toFixed(2)),
    cellular_density_index: Number(currentDensity.toFixed(3)),
    target_fluid_viscosity_cp: 4.5,
    stability_status: currentDensity < 0.7 ? 'BIO_STABILITY_FAILURE' : 'STABLE_METABOLIC',
  };
}

/**
 * Diagnostic Telemetry Exception Handler Trap
 */
export function evaluateExceptionTrap(
  coolant: number,
  voltage: number,
  cellularDensity: number
): ExceptionHandlerStatus {
  if (coolant < 420.0) {
    return {
      global_state: 'SYSTEM_HALT_TRIGGERED',
      error_trap_logs:
        'CRITICAL_LOW_FLOW: Coolant pressure drops below safe threshold limits (<420.0 L).',
    };
  }
  if (voltage > 470.0) {
    return {
      global_state: 'SYSTEM_HALT_TRIGGERED',
      error_trap_logs:
        'VOLTAGE_SURGE_FAULT: Circuit line spikes outside target baseline parameters (>470.0 V).',
    };
  }
  if (cellularDensity < 0.7) {
    return {
      global_state: 'SYSTEM_HALT_TRIGGERED',
      error_trap_logs:
        'BIO_STABILITY_FAILURE: Cellular density degradation detected in regeneration fluid zone (<0.70).',
    };
  }
  return {
    global_state: 'STABLE_OPERATION',
    error_trap_logs: 'All tracking matrices verified normal.',
  };
}

/**
 * Initializes local persistence with full schema if not already present
 */
export function initSimulationPersistence(): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_JSON);
    if (!existing) {
      const baselineTime = new Date(Date.now() - 3600000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const baselineSubsystems = calculateSubsystems(1.0);
      const baselineBio = calculateBioRegeneration(1.0);
      const baselineTrap = evaluateExceptionTrap(
        baselineSubsystems.coolant_level_liters,
        baselineSubsystems.circuit_line_voltage_v,
        baselineBio.cellular_density_index
      );

      const initialJson: TelemetrySnapshot[] = [
        {
          timestamp: baselineTime,
          active_layout_modifier: 1.0,
          subsystems: baselineSubsystems,
          medical_regeneration: baselineBio,
          exception_handler_status: baselineTrap,
          telemetry: {
            'MG-DRIVE-01': {
              node_id: 'MG-DRIVE-01',
              name: 'Primary Hybrid Crankshaft Drive',
              output_torque_nm: 150.0,
              calculated_shear_stress_mpa: 48.89,
              safety_status: 'VALID',
              temperature_c: 35.3,
              fatigue_life_cycles: 10000000,
            },
            'MG-TRANS-02': {
              node_id: 'MG-TRANS-02',
              name: 'Secondary Transmission Reducer',
              output_torque_nm: 300.0,
              calculated_shear_stress_mpa: 12.22,
              safety_status: 'VALID',
              temperature_c: 26.8,
              fatigue_life_cycles: 10000000,
            },
            'MG-ROBO-03': {
              node_id: 'MG-ROBO-03',
              name: 'Operating-Theater Robotic Articulation Joint',
              output_torque_nm: 105.0,
              calculated_shear_stress_mpa: 130.58,
              safety_status: 'VALID',
              temperature_c: 54.0,
              fatigue_life_cycles: 9880000,
            },
            'STR-CAM-04': {
              node_id: 'STR-CAM-04',
              name: 'Heavy Structural Dampening Cam',
              output_torque_nm: 273.0,
              calculated_shear_stress_mpa: 4.06,
              safety_status: 'VALID',
              temperature_c: 25.1,
              fatigue_life_cycles: 10000000,
            },
          },
        },
      ];

      localStorage.setItem(STORAGE_KEY_JSON, JSON.stringify(initialJson, null, 4));

      // Build baseline CSV adhering to user's updated schema
      const initialCsv =
        CSV_HEADER +
        `"${baselineTime}",1.0,${baselineSubsystems.coolant_level_liters},${baselineSubsystems.circuit_line_voltage_v},${baselineBio.regeneration_rate_pct},${baselineBio.cellular_density_index},"${baselineTrap.global_state}"\n`;
      localStorage.setItem(STORAGE_KEY_CSV, initialCsv);
    }
  } catch (err) {
    console.warn('Simulation persistence init error:', err);
  }
}

/**
 * Non-blocking serialization and concurrent appending to both JSON DB and CSV
 */
export function recordSimulationSnapshot(
  modifier: number,
  nodes: PhysicsNodeState[]
): TelemetrySnapshot {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const subsystems = calculateSubsystems(modifier);
  const medical_regeneration = calculateBioRegeneration(modifier);
  const exception_handler_status = evaluateExceptionTrap(
    subsystems.coolant_level_liters,
    subsystems.circuit_line_voltage_v,
    medical_regeneration.cellular_density_index
  );

  const telemetryRecord: TelemetrySnapshot['telemetry'] = {};
  for (const n of nodes) {
    telemetryRecord[n.nodeId] = {
      node_id: n.nodeId,
      name: n.name,
      output_torque_nm: n.outputTorqueNm,
      calculated_shear_stress_mpa: n.calculatedShearStressMpa,
      safety_status: n.safetyStatus,
      temperature_c: n.operatingTemperatureC,
      fatigue_life_cycles: n.fatigueLifeRemainingCycles,
    };
  }

  const snapshot: TelemetrySnapshot = {
    timestamp,
    active_layout_modifier: Number(modifier.toFixed(2)),
    subsystems,
    medical_regeneration,
    exception_handler_status,
    telemetry: telemetryRecord,
  };

  // Perform persistence asynchronously to avoid blocking live 60fps simulation
  setTimeout(() => {
    try {
      // 1. Append to JSON DB
      const existingJsonStr = localStorage.getItem(STORAGE_KEY_JSON) || '[]';
      let jsonList: TelemetrySnapshot[] = [];
      try {
        jsonList = JSON.parse(existingJsonStr);
      } catch {
        jsonList = [];
      }
      jsonList.push(snapshot);
      if (jsonList.length > 250) {
        jsonList = jsonList.slice(jsonList.length - 250);
      }
      localStorage.setItem(STORAGE_KEY_JSON, JSON.stringify(jsonList, null, 4));

      // 2. Append to CSV Audit
      let existingCsv = localStorage.getItem(STORAGE_KEY_CSV) || CSV_HEADER;
      if (!existingCsv.startsWith('Timestamp')) {
        existingCsv = CSV_HEADER;
      }

      const newCsvRow = `"${timestamp}",${snapshot.active_layout_modifier},${subsystems.coolant_level_liters},${subsystems.circuit_line_voltage_v},${medical_regeneration.regeneration_rate_pct},${medical_regeneration.cellular_density_index},"${exception_handler_status.global_state}"\n`;
      localStorage.setItem(STORAGE_KEY_CSV, existingCsv + newCsvRow);
    } catch (err) {
      console.error('Failed to append to simulation persistence storage:', err);
    }
  }, 0);

  return snapshot;
}

/**
 * Filter and eliminate consecutive identical state snapshots
 */
export function optimizeHistoryLogs(): {
  initialCount: number;
  finalCount: number;
  cleanedCount: number;
} {
  try {
    const rawJson = localStorage.getItem(STORAGE_KEY_JSON);
    if (!rawJson) return { initialCount: 0, finalCount: 0, cleanedCount: 0 };

    let history: TelemetrySnapshot[] = [];
    try {
      history = JSON.parse(rawJson);
    } catch {
      return { initialCount: 0, finalCount: 0, cleanedCount: 0 };
    }

    if (history.length <= 1) {
      return { initialCount: history.length, finalCount: history.length, cleanedCount: 0 };
    }

    const initialCount = history.length;
    const optimizedTrace: TelemetrySnapshot[] = [history[0]];

    for (let i = 1; i < history.length; i++) {
      const entry = history[i];
      const prev = optimizedTrace[optimizedTrace.length - 1];

      const duplicateMatch =
        entry.active_layout_modifier === prev.active_layout_modifier &&
        entry.subsystems?.coolant_level_liters === prev.subsystems?.coolant_level_liters &&
        entry.subsystems?.circuit_line_voltage_v === prev.subsystems?.circuit_line_voltage_v;

      if (!duplicateMatch) {
        optimizedTrace.push(entry);
      }
    }

    const finalCount = optimizedTrace.length;
    const cleanedCount = initialCount - finalCount;

    localStorage.setItem(STORAGE_KEY_JSON, JSON.stringify(optimizedTrace, null, 4));

    let updatedCsv = CSV_HEADER;
    for (const snap of optimizedTrace) {
      const sub = snap.subsystems || calculateSubsystems(snap.active_layout_modifier || 1.0);
      const bio = snap.medical_regeneration || calculateBioRegeneration(snap.active_layout_modifier || 1.0);
      const trap =
        snap.exception_handler_status ||
        evaluateExceptionTrap(
          sub.coolant_level_liters,
          sub.circuit_line_voltage_v,
          bio.cellular_density_index
        );
      updatedCsv += `"${snap.timestamp}",${snap.active_layout_modifier},${sub.coolant_level_liters},${sub.circuit_line_voltage_v},${bio.regeneration_rate_pct},${bio.cellular_density_index},"${trap.global_state}"\n`;
    }
    localStorage.setItem(STORAGE_KEY_CSV, updatedCsv);

    return { initialCount, finalCount, cleanedCount };
  } catch (err) {
    console.error('History log optimization error:', err);
    return { initialCount: 0, finalCount: 0, cleanedCount: 0 };
  }
}

export function getJsonDatabase(): TelemetrySnapshot[] {
  try {
    initSimulationPersistence();
    const str = localStorage.getItem(STORAGE_KEY_JSON);
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
}

export function getCsvDatabase(): string {
  try {
    initSimulationPersistence();
    return localStorage.getItem(STORAGE_KEY_CSV) || CSV_HEADER;
  } catch {
    return CSV_HEADER;
  }
}

export function downloadJsonDatabase(): void {
  const data = getJsonDatabase();
  const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'simulation_db.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsvAudit(): void {
  const data = getCsvDatabase();
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'simulation_audit.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCleanHistoryScript(): void {
  const scriptContent = `#!/bin/bash
TARGET_LOG="simulation_db.json"
TEMP_OUTPUT="filtered_history_temp.json"
if [ ! -f "$TARGET_LOG" ]; then echo "[!] Error: targeted log not detected."; exit 1; fi
python3 -c "
import json
with open('$TARGET_LOG', 'r') as f: history = json.load(f)
if not history: exit(0)
opt = [history[0]]
for e in history[1:]:
    p = opt[-1]
    if not (e.get('active_layout_modifier') == p.get('active_layout_modifier') and e.get('subsystems',{}).get('coolant_level_liters') == p.get('subsystems',{}).get('coolant_level_liters')):
        opt.append(e)
with open('$TEMP_OUTPUT', 'w') as out_f: json.dump(opt, out_f, indent=4)
"
if [ -f "$TEMP_OUTPUT" ]; then mv "$TEMP_OUTPUT" "$TARGET_LOG"; fi
`;
  const blob = new Blob([scriptContent], { type: 'application/x-sh' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clean_history.sh';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function clearPersistenceLogs(): void {
  localStorage.removeItem(STORAGE_KEY_JSON);
  localStorage.removeItem(STORAGE_KEY_CSV);
  initSimulationPersistence();
}

export function getPersistenceSummary() {
  const records = getJsonDatabase();
  let maxTemp = 0;
  let criticalCount = 0;
  let minCoolant = 500;
  let maxVoltage = 415;

  for (const rec of records) {
    if (rec.subsystems) {
      if (rec.subsystems.coolant_level_liters < minCoolant) {
        minCoolant = rec.subsystems.coolant_level_liters;
      }
      if (rec.subsystems.circuit_line_voltage_v > maxVoltage) {
        maxVoltage = rec.subsystems.circuit_line_voltage_v;
      }
    }
    for (const n of Object.values(rec.telemetry || {})) {
      if (n.temperature_c && n.temperature_c > maxTemp) maxTemp = n.temperature_c;
      if (n.safety_status === 'CRITICAL_SHEAR_FAILURE') criticalCount++;
    }
  }

  return {
    totalSnapshots: records.length,
    totalNodeTraces: records.length * 4,
    maxRecordedTempC: maxTemp || 35.3,
    minCoolantLiters: minCoolant,
    maxVoltageV: maxVoltage,
    criticalFailuresLogged: criticalCount,
    earliestTimestamp: records[0]?.timestamp || 'N/A',
    latestTimestamp: records[records.length - 1]?.timestamp || 'N/A',
  };
}
