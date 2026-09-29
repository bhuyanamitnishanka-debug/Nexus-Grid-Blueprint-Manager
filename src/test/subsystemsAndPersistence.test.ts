import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSubsystems,
  calculateBioRegeneration,
  evaluateExceptionTrap,
  recordSimulationSnapshot,
  getPersistenceSummary,
  optimizeHistoryLogs,
  initSimulationPersistence,
  DEFAULT_THERMAL_SAFETY_THRESHOLDS,
} from '../utils/simulationPersistence';
import { runSimulationCascade } from '../data/blueprintData';

describe('Subsystems & Environmental Telemetry', () => {
  it('calculates coolant level and status across load boundaries', () => {
    // At nominal 1.0x modifier: 500.0 L and OPTIMAL
    const nominal = calculateSubsystems(1.0);
    expect(nominal.coolant_level_liters).toBe(500.0);
    expect(nominal.coolant_status).toBe('OPTIMAL');

    // At 2.8x modifier: drops below 420.0 L threshold
    const stressed = calculateSubsystems(2.8);
    expect(stressed.coolant_level_liters).toBeLessThan(420.0);
    expect(stressed.coolant_status).toBe('CRITICAL_LOW_FLOW');
  });

  it('calculates circuit line transmission voltage and surge alert', () => {
    // At nominal 1.0x: 415.0 V and STABLE
    const nominal = calculateSubsystems(1.0);
    expect(nominal.circuit_line_voltage_v).toBe(415.0);
    expect(nominal.electrical_status).toBe('STABLE');

    // At 2.2x modifier: voltage exceeds 450.0 V
    const surge = calculateSubsystems(2.2);
    expect(surge.circuit_line_voltage_v).toBeGreaterThan(450.0);
    expect(surge.electrical_status).toBe('VOLTAGE_SURGE_WARNING');
  });
});

describe('Class 4: Deep-Tissue Bio-Regeneration Telemetry', () => {
  it('calculates bio-regeneration rate and cellular density index', () => {
    const nominal = calculateBioRegeneration(1.0);
    expect(nominal.regeneration_rate_pct).toBe(96.7);
    expect(nominal.cellular_density_index).toBe(1.25);
    expect(nominal.target_fluid_viscosity_cp).toBe(4.5);
    expect(nominal.stability_status).toBe('STABLE_METABOLIC');

    // High modifier drives cellular density below 0.70
    const degraded = calculateBioRegeneration(2.7);
    expect(degraded.cellular_density_index).toBeLessThan(0.7);
    expect(degraded.stability_status).toBe('BIO_STABILITY_FAILURE');
  });
});

describe('Telemetry Exception Handler: evaluateExceptionTrap', () => {
  it('returns STABLE_OPERATION when all parameters are within safety gates', () => {
    const status = evaluateExceptionTrap(480.0, 420.0, 1.15);
    expect(status.global_state).toBe('STABLE_OPERATION');
    expect(status.error_trap_logs).toContain('normal');
  });

  it('triggers SYSTEM_HALT_TRIGGERED when coolant drops below 420.0 L', () => {
    const status = evaluateExceptionTrap(415.0, 420.0, 1.15);
    expect(status.global_state).toBe('SYSTEM_HALT_TRIGGERED');
    expect(status.error_trap_logs).toContain('CRITICAL_LOW_FLOW');
  });

  it('triggers SYSTEM_HALT_TRIGGERED when line voltage exceeds 470.0 V', () => {
    const status = evaluateExceptionTrap(480.0, 475.0, 1.15);
    expect(status.global_state).toBe('SYSTEM_HALT_TRIGGERED');
    expect(status.error_trap_logs).toContain('VOLTAGE_SURGE_FAULT');
  });

  it('triggers SYSTEM_HALT_TRIGGERED when cellular density falls below 0.70', () => {
    const status = evaluateExceptionTrap(480.0, 430.0, 0.65);
    expect(status.global_state).toBe('SYSTEM_HALT_TRIGGERED');
    expect(status.error_trap_logs).toContain('BIO_STABILITY_FAILURE');
  });
});

describe('Persistence Layer & Log Optimization (clean_history)', () => {
  beforeEach(() => {
    localStorage.clear();
    initSimulationPersistence();
  });

  it('initializes persistence with baseline snapshots', () => {
    const summary = getPersistenceSummary();
    expect(summary.totalSnapshots).toBeGreaterThan(0);
    expect(summary.minCoolantLiters).toBeDefined();
    expect(summary.maxVoltageV).toBeDefined();
  });

  it('records new simulation snapshot into localStorage databases', async () => {
    const initialSummary = getPersistenceSummary();
    const testNodes = runSimulationCascade(1.5);

    recordSimulationSnapshot(1.5, testNodes);
    // Wait for async persistence setTimeout to commit
    await new Promise((resolve) => setTimeout(resolve, 30));

    const updatedSummary = getPersistenceSummary();
    expect(updatedSummary.totalSnapshots).toBe(initialSummary.totalSnapshots + 1);
  });

  it('cleans consecutive redundant snapshots with optimizeHistoryLogs', async () => {
    const testNodes = runSimulationCascade(1.0);

    // Record identical snapshots
    recordSimulationSnapshot(1.0, testNodes);
    await new Promise((resolve) => setTimeout(resolve, 30));

    recordSimulationSnapshot(1.0, testNodes);
    await new Promise((resolve) => setTimeout(resolve, 30));

    recordSimulationSnapshot(1.0, testNodes);
    await new Promise((resolve) => setTimeout(resolve, 30));

    const beforeOpt = getPersistenceSummary();
    const optResult = optimizeHistoryLogs();
    const afterOpt = getPersistenceSummary();

    expect(optResult.cleanedCount).toBeGreaterThan(0);
    expect(afterOpt.totalSnapshots).toBeLessThan(beforeOpt.totalSnapshots);
  });

  it('contains valid default thermal safety thresholds for all 4 micro-gear nodes', () => {
    expect(DEFAULT_THERMAL_SAFETY_THRESHOLDS['MG-DRIVE-01']).toBe(75.0);
    expect(DEFAULT_THERMAL_SAFETY_THRESHOLDS['MG-TRANS-02']).toBe(70.0);
    expect(DEFAULT_THERMAL_SAFETY_THRESHOLDS['MG-ROBO-03']).toBe(65.0);
    expect(DEFAULT_THERMAL_SAFETY_THRESHOLDS['STR-CAM-04']).toBe(85.0);
  });
});
