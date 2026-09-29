import { describe, it, expect } from 'vitest';
import {
  runSimulationCascade,
  calculateNodeMechanics,
  MATERIAL_REGISTRY,
  PhysicsNodeState,
} from '../data/blueprintData';
import {
  calculateSubsystems,
  calculateBioRegeneration,
  evaluateExceptionTrap,
  recordSimulationSnapshot,
  DEFAULT_THERMAL_SAFETY_THRESHOLDS,
  TelemetrySnapshot,
} from './simulationPersistence';

describe('Physics Simulation Cascade & Mechanics Edge Cases', () => {
  describe('runSimulationCascade Edge Cases', () => {
    it('handles zero modifier load without producing NaN or Infinity', () => {
      const nodes = runSimulationCascade(0);
      expect(nodes).toHaveLength(4);

      for (const node of nodes) {
        expect(Number.isNaN(node.outputTorqueNm)).toBe(false);
        expect(Number.isFinite(node.outputTorqueNm)).toBe(true);
        expect(Number.isNaN(node.calculatedShearStressMpa)).toBe(false);
        expect(Number.isFinite(node.calculatedShearStressMpa)).toBe(true);
        expect(node.outputTorqueNm).toBe(0);
        expect(node.calculatedShearStressMpa).toBe(0);
        expect(node.safetyStatus).toBe('VALID');
        expect(node.thermalStatus).toBe('COOL_NOMINAL');
        expect(node.operatingTemperatureC).toBe(24.0); // Baseline ambient
      }
    });

    it('handles negative modifier load gracefully', () => {
      const nodes = runSimulationCascade(-1.0);
      expect(nodes).toHaveLength(4);

      for (const node of nodes) {
        expect(Number.isNaN(node.outputTorqueNm)).toBe(false);
        expect(Number.isNaN(node.calculatedShearStressMpa)).toBe(false);
        expect(node.outputTorqueNm).toBeLessThan(0);
      }
    });

    it('handles extreme ultra-high loads (e.g. 5.0x and 10.0x) without numerical overflow', () => {
      const nodes10x = runSimulationCascade(10.0);
      expect(nodes10x).toHaveLength(4);

      for (const node of nodes10x) {
        expect(Number.isFinite(node.outputTorqueNm)).toBe(true);
        expect(Number.isFinite(node.calculatedShearStressMpa)).toBe(true);
        expect(Number.isFinite(node.operatingTemperatureC)).toBe(true);
      }

      // At 10x, shear failure must be triggered across stressed nodes
      const criticalNodes = nodes10x.filter((n) => n.safetyStatus === 'CRITICAL_SHEAR_FAILURE');
      expect(criticalNodes.length).toBeGreaterThan(0);

      // Stress ratio percentage should be capped at 180% per model design
      for (const node of nodes10x) {
        expect(node.stressRatioPct).toBeLessThanOrEqual(180);
      }
    });

    it('maintains strict kinematic torque linkage between all 4 interconnected nodes', () => {
      const modifier = 1.6;
      const nodes = runSimulationCascade(modifier);

      const [node1, node2, node3, node4] = nodes;

      // Node 1: Base Torque = 150 * modifier
      const expectedBase = 150.0 * modifier;
      expect(node1.outputTorqueNm).toBeCloseTo(expectedBase, 2);

      // Node 2: Driven by Node 1 output with 2.0 reduction multiplier
      expect(node2.inputTorqueNm).toBeCloseTo(node1.outputTorqueNm, 2);
      expect(node2.outputTorqueNm).toBeCloseTo(node1.outputTorqueNm * 2.0, 2);

      // Node 3: Driven by baseTorque * 0.4 with 1.75 multiplier
      expect(node3.inputTorqueNm).toBeCloseTo(expectedBase * 0.4, 2);
      expect(node3.outputTorqueNm).toBeCloseTo(expectedBase * 0.4 * 1.75, 2);

      // Node 4: Driven by Node 2 output * 0.7 with 1.3 multiplier
      expect(node4.inputTorqueNm).toBeCloseTo(node2.outputTorqueNm * 0.7, 2);
      expect(node4.outputTorqueNm).toBeCloseTo(node2.outputTorqueNm * 0.7 * 1.3, 2);
    });
  });

  describe('calculateNodeMechanics Parameter Edge Cases', () => {
    it('handles zero radius safely without divide-by-zero throwing', () => {
      const node = calculateNodeMechanics(
        'ZERO-RAD',
        'Zero Radius Shaft',
        0,
        12,
        'Wootz_Bronze_Alloy',
        100.0,
        1.0
      );

      expect(node.calculatedShearStressMpa).toBe(0);
      expect(node.fatigueLifeRemainingCycles).toBe(1e7);
      expect(node.safetyStatus).toBe('VALID');
    });

    it('handles negative radius safely', () => {
      const node = calculateNodeMechanics(
        'NEG-RAD',
        'Negative Radius Shaft',
        -10.0,
        12,
        'Wootz_Bronze_Alloy',
        100.0,
        1.0
      );

      expect(Number.isFinite(node.calculatedShearStressMpa)).toBe(true);
    });

    it('handles high speed RPM thermal escalation accurately', () => {
      // Nominal speed: 200 RPM
      const nodeNominalRpm = calculateNodeMechanics(
        'RPM-200',
        'Nominal RPM Node',
        12.5,
        24,
        'Wootz_Bronze_Alloy',
        200.0,
        1.0,
        1e5,
        'Context',
        200
      );

      // High speed: 1200 RPM
      const nodeHighRpm = calculateNodeMechanics(
        'RPM-1200',
        'High RPM Node',
        12.5,
        24,
        'Wootz_Bronze_Alloy',
        200.0,
        1.0,
        1e5,
        'Context',
        1200
      );

      expect(nodeHighRpm.operatingTemperatureC).toBeGreaterThan(nodeNominalRpm.operatingTemperatureC);
      expect(nodeHighRpm.calculatedShearStressMpa).toBe(nodeNominalRpm.calculatedShearStressMpa);
    });

    it('handles unknown material by falling back to Wootz_Bronze_Alloy without failure', () => {
      const fallbackNode = calculateNodeMechanics(
        'UNKNOWN-MAT',
        'Unknown Alloy',
        15.0,
        20,
        'NonExistent_Titanium_Matrix',
        150.0,
        1.0
      );

      expect(fallbackNode).toBeDefined();
      expect(fallbackNode.calculatedShearStressMpa).toBeGreaterThan(0);
      expect(fallbackNode.safetyStatus).toBeDefined();
    });
  });
});

describe('Structural Load Calculations & Material Yield Integrity', () => {
  it('calculates structural steel load balancing accurately on STR-CAM-04', () => {
    // STR-CAM-04 uses Structural_H_Steel with radius 35.0 mm and 1.3 multiplier
    const nodes = runSimulationCascade(1.0);
    const strCam = nodes.find((n) => n.nodeId === 'STR-CAM-04');
    expect(strCam).toBeDefined();
    if (!strCam) return;

    expect(strCam.material).toBe('Structural_H_Steel');
    expect(strCam.radiusMm).toBe(35.0);
    expect(strCam.teethCount).toBe(64);
    expect(strCam.applicationContext).toContain('Structural Steel Column Load Balancing');

    // Expected torque calculation:
    // Base = 150 Nm -> Node 1 = 150 Nm -> Node 2 = 300 Nm
    // Node 4 input = 300 * 0.7 = 210 Nm -> Node 4 output = 210 * 1.3 = 273 Nm
    expect(strCam.inputTorqueNm).toBe(210.0);
    expect(strCam.outputTorqueNm).toBe(273.0);

    // Verify shear stress against theoretical equation:
    // radiusM = 0.035 m
    // Tau = (2 * 273) / (pi * 0.035^3) / 1e6
    const expectedTauMpa = Number(
      (((2 * 273.0) / (Math.PI * Math.pow(0.035, 3))) / 1e6).toFixed(2)
    );
    expect(strCam.calculatedShearStressMpa).toBe(expectedTauMpa);

    // Structural steel yield limit is 250 MPa; at 1.0x stress is ~4.06 MPa, safely within elastic region
    expect(strCam.calculatedShearStressMpa).toBeLessThan(MATERIAL_REGISTRY.Structural_H_Steel.yieldStrengthMpa);
    expect(strCam.safetyStatus).toBe('VALID');
  });

  it('verifies structural yield threshold boundary when extreme structural load is applied', () => {
    // Direct stress calculation on Structural_H_Steel:
    // Yield strength = 250 MPa, Endurance limit = 125 MPa
    // Radius = 35mm -> Tau = (2 * Torque) / (pi * 0.035^3) / 1e6 = Torque * 0.01487
    // To reach yield (250 MPa), Torque needed ≈ 250 / 0.01487 ≈ 16,812 Nm
    const yieldTorque = 17000.0;
    const yieldedStructure = calculateNodeMechanics(
      'STR-CAM-YIELD',
      'Heavy Structural Cam at Yield',
      35.0,
      64,
      'Structural_H_Steel',
      yieldTorque,
      1.0,
      1e5,
      'Structural Steel Column Load Balancing'
    );

    expect(yieldedStructure.calculatedShearStressMpa).toBeGreaterThan(
      MATERIAL_REGISTRY.Structural_H_Steel.yieldStrengthMpa
    );
    expect(yieldedStructure.safetyStatus).toBe('CRITICAL_SHEAR_FAILURE');
    expect(yieldedStructure.stressRatioPct).toBeGreaterThanOrEqual(100);
  });

  it('validates Basquin fatigue curve exponents between bronze and structural steel', () => {
    // Wootz_Bronze_Alloy: fatigueExponentB = -0.08, enduranceLimit = 210 MPa
    // Structural_H_Steel: fatigueExponentB = -0.12, enduranceLimit = 125 MPa
    expect(MATERIAL_REGISTRY.Structural_H_Steel.fatigueExponentB).toBe(-0.12);
    expect(MATERIAL_REGISTRY.Structural_H_Steel.enduranceLimitMpa).toBe(125.0);
    expect(MATERIAL_REGISTRY.Wootz_Bronze_Alloy.fatigueExponentB).toBe(-0.08);
    expect(MATERIAL_REGISTRY.Wootz_Bronze_Alloy.enduranceLimitMpa).toBe(210.0);

    // Apply moderate structural stress above endurance limit (150 MPa > 125 MPa)
    const fatigueNode = calculateNodeMechanics(
      'STR-FATIGUE',
      'Cyclic Fatigue Beam',
      20.0,
      40,
      'Structural_H_Steel',
      1900.0, // Induces stress ~151 MPa
      1.0,
      100000,
      'Structural Column Fatigue'
    );

    expect(fatigueNode.calculatedShearStressMpa).toBeGreaterThan(
      MATERIAL_REGISTRY.Structural_H_Steel.enduranceLimitMpa
    );
    expect(fatigueNode.calculatedShearStressMpa).toBeLessThan(
      MATERIAL_REGISTRY.Structural_H_Steel.yieldStrengthMpa
    );
    // Life should be finite (less than ceiling 1e7)
    expect(fatigueNode.fatigueLifeRemainingCycles).toBeLessThan(1e7);
  });

  it('verifies STR-CAM-04 thermal safety threshold against pre-defined 85.0°C limit', () => {
    expect(DEFAULT_THERMAL_SAFETY_THRESHOLDS['STR-CAM-04']).toBe(85.0);

    // Under nominal 1.0x load, STR-CAM-04 temperature is nominal (~25°C)
    const nominalNodes = runSimulationCascade(1.0);
    const nominalCam = nominalNodes.find((n) => n.nodeId === 'STR-CAM-04')!;
    expect(nominalCam.operatingTemperatureC).toBeLessThan(85.0);
    expect(nominalCam.thermalStatus).toBe('COOL_NOMINAL');
  });
});

describe('Telemetry State Transitions & Exception Trap Edge Cases', () => {
  describe('Environmental Subsystems Boundary Testing', () => {
    it('clamps minimum coolant volume to 0.0 L under extreme load modifiers', () => {
      // Coolant = max(0.0, 500.0 - 45.5 * (modifier - 1.0))
      // When modifier >= 12.0, coolant calculation goes negative without clamp
      const extremeSubsystem = calculateSubsystems(20.0);
      expect(extremeSubsystem.coolant_level_liters).toBe(0.0);
      expect(extremeSubsystem.coolant_status).toBe('CRITICAL_LOW_FLOW');
    });

    it('identifies exact transition point for CRITICAL_LOW_FLOW at 420.0 L', () => {
      // 500.0 - 45.5 * (mod - 1.0) = 420.0 => 45.5 * (mod - 1) = 80 => mod - 1 = 1.758 => mod ≈ 2.758
      const safeSubsystem = calculateSubsystems(2.7);
      expect(safeSubsystem.coolant_level_liters).toBeGreaterThanOrEqual(420.0);
      expect(safeSubsystem.coolant_status).toBe('OPTIMAL');

      const breachedSubsystem = calculateSubsystems(2.8);
      expect(breachedSubsystem.coolant_level_liters).toBeLessThan(420.0);
      expect(breachedSubsystem.coolant_status).toBe('CRITICAL_LOW_FLOW');
    });

    it('identifies exact transition point for VOLTAGE_SURGE_WARNING at 450.0 V', () => {
      // 415.0 + 35.2 * (mod - 1.0) = 450.0 => 35.2 * (mod - 1) = 35 => mod - 1 = 0.994 => mod ≈ 1.994
      const stableVoltage = calculateSubsystems(1.9);
      expect(stableVoltage.circuit_line_voltage_v).toBeLessThanOrEqual(450.0);
      expect(stableVoltage.electrical_status).toBe('STABLE');

      const surgeVoltage = calculateSubsystems(2.1);
      expect(surgeVoltage.circuit_line_voltage_v).toBeGreaterThan(450.0);
      expect(surgeVoltage.electrical_status).toBe('VOLTAGE_SURGE_WARNING');
    });
  });

  describe('Class 4 Deep-Tissue Bio-Regeneration Telemetry Boundary Testing', () => {
    it('clamps maximum regeneration rate to 100.0% under extreme modifiers', () => {
      const extremeBio = calculateBioRegeneration(15.0);
      expect(extremeBio.regeneration_rate_pct).toBe(100.0);
    });

    it('clamps minimum cellular density index to 0.50 under extreme modifiers', () => {
      const extremeBio = calculateBioRegeneration(15.0);
      expect(extremeBio.cellular_density_index).toBe(0.5);
      expect(extremeBio.stability_status).toBe('BIO_STABILITY_FAILURE');
    });

    it('identifies exact transition boundary for BIO_STABILITY_FAILURE at 0.70', () => {
      // Density = max(0.5, 1.25 - 0.35 * (mod - 1.0))
      // 1.25 - 0.35 * (mod - 1.0) = 0.70 => 0.35 * (mod - 1) = 0.55 => mod - 1 = 1.571 => mod ≈ 2.571
      const safeBio = calculateBioRegeneration(2.5);
      expect(safeBio.cellular_density_index).toBeGreaterThanOrEqual(0.7);
      expect(safeBio.stability_status).toBe('STABLE_METABOLIC');

      const failedBio = calculateBioRegeneration(2.6);
      expect(failedBio.cellular_density_index).toBeLessThan(0.7);
      expect(failedBio.stability_status).toBe('BIO_STABILITY_FAILURE');
    });

    it('maintains fluid viscosity invariant at 4.5 cP across all modifier values', () => {
      expect(calculateBioRegeneration(0.5).target_fluid_viscosity_cp).toBe(4.5);
      expect(calculateBioRegeneration(1.0).target_fluid_viscosity_cp).toBe(4.5);
      expect(calculateBioRegeneration(3.0).target_fluid_viscosity_cp).toBe(4.5);
    });
  });

  describe('evaluateExceptionTrap Priority & Compound Fault Handling', () => {
    it('prioritizes CRITICAL_LOW_FLOW when multiple fault thresholds are violated simultaneously', () => {
      // Low coolant (<420), high voltage (>470), and low density (<0.7) all at once
      const compoundTrap = evaluateExceptionTrap(400.0, 485.0, 0.6);
      expect(compoundTrap.global_state).toBe('SYSTEM_HALT_TRIGGERED');
      expect(compoundTrap.error_trap_logs).toContain('CRITICAL_LOW_FLOW');
    });

    it('prioritizes VOLTAGE_SURGE_FAULT when coolant is nominal but voltage and bio fail', () => {
      const voltageBioTrap = evaluateExceptionTrap(450.0, 480.0, 0.65);
      expect(voltageBioTrap.global_state).toBe('SYSTEM_HALT_TRIGGERED');
      expect(voltageBioTrap.error_trap_logs).toContain('VOLTAGE_SURGE_FAULT');
    });

    it('triggers BIO_STABILITY_FAILURE when only cellular density is degraded', () => {
      const bioOnlyTrap = evaluateExceptionTrap(460.0, 430.0, 0.68);
      expect(bioOnlyTrap.global_state).toBe('SYSTEM_HALT_TRIGGERED');
      expect(bioOnlyTrap.error_trap_logs).toContain('BIO_STABILITY_FAILURE');
    });
  });

  describe('Micro-Gear Thermal Safety Threshold Overrun Verification', () => {
    it('correctly flags thermal threshold breaches against DEFAULT_THERMAL_SAFETY_THRESHOLDS', () => {
      const highLoadNodes = runSimulationCascade(2.8);

      // Check each node against its specific thermal threshold
      const breached = highLoadNodes.filter((node) => {
        const threshold = DEFAULT_THERMAL_SAFETY_THRESHOLDS[node.nodeId] || 75.0;
        return node.operatingTemperatureC > threshold;
      });

      // At 2.8x, node MG-ROBO-03 exceeds its 65°C safety boundary
      expect(breached.length).toBeGreaterThan(0);
      const roboJoint = highLoadNodes.find((n) => n.nodeId === 'MG-ROBO-03');
      expect(roboJoint).toBeDefined();
      if (roboJoint) {
        expect(roboJoint.operatingTemperatureC).toBeGreaterThan(
          DEFAULT_THERMAL_SAFETY_THRESHOLDS['MG-ROBO-03']
        );
      }
    });

    it('recovers all nodes under safety threshold when load is derated to nominal 1.0x', () => {
      const nominalNodes = runSimulationCascade(1.0);
      const breached = nominalNodes.filter((node) => {
        const threshold = DEFAULT_THERMAL_SAFETY_THRESHOLDS[node.nodeId] || 75.0;
        return node.operatingTemperatureC > threshold;
      });

      expect(breached).toHaveLength(0);
    });
  });

  describe('Persistence Snapshot Record Integrity', () => {
    it('generates fully populated telemetry snapshot conforming to ISO schema', () => {
      const nodes = runSimulationCascade(1.4);
      const snapshot: TelemetrySnapshot = recordSimulationSnapshot(1.4, nodes);

      expect(snapshot.timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(snapshot.active_layout_modifier).toBe(1.4);
      expect(snapshot.subsystems.coolant_level_liters).toBeDefined();
      expect(snapshot.subsystems.circuit_line_voltage_v).toBeDefined();
      expect(snapshot.medical_regeneration?.cellular_density_index).toBeDefined();
      expect(snapshot.exception_handler_status?.global_state).toBeDefined();

      // Telemetry records for all 4 nodes
      expect(Object.keys(snapshot.telemetry)).toEqual([
        'MG-DRIVE-01',
        'MG-TRANS-02',
        'MG-ROBO-03',
        'STR-CAM-04',
      ]);

      for (const nodeId of Object.keys(snapshot.telemetry)) {
        const entry = snapshot.telemetry[nodeId];
        expect(entry.node_id).toBe(nodeId);
        expect(entry.output_torque_nm).toBeGreaterThan(0);
        expect(entry.calculated_shear_stress_mpa).toBeGreaterThan(0);
        expect(entry.safety_status).toBeDefined();
      }
    });
  });
});
