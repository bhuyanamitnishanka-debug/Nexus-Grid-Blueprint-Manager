import { describe, it, expect } from 'vitest';
import {
  calculateNodeMechanics,
  runSimulationCascade,
  MATERIAL_REGISTRY,
  PhysicsNodeState,
} from '../data/blueprintData';

describe('Physics Simulation: calculateNodeMechanics', () => {
  it('correctly calculates torsional shear stress using Tau = (2 * Torque) / (pi * r^3)', () => {
    const radiusMm = 10.0;
    const radiusM = radiusMm / 1000.0;
    const torqueNm = 100.0;
    const expectedShearStressMpa = Number(
      (((2 * torqueNm) / (Math.PI * Math.pow(radiusM, 3))) / 1e6).toFixed(2)
    );

    const node = calculateNodeMechanics(
      'TEST-NODE-01',
      'Test Node',
      radiusMm,
      20,
      'Wootz_Bronze_Alloy',
      torqueNm,
      1.0
    );

    expect(node.outputTorqueNm).toBe(100.0);
    expect(node.calculatedShearStressMpa).toBe(expectedShearStressMpa);
  });

  it('scales output torque by gear ratio multiplier', () => {
    const node = calculateNodeMechanics(
      'TEST-NODE-02',
      'Gear Ratio Test',
      25.0,
      48,
      'Wootz_Bronze_Alloy',
      150.0,
      2.5 // Gear ratio
    );

    expect(node.inputTorqueNm).toBe(150.0);
    expect(node.outputTorqueNm).toBe(375.0); // 150 * 2.5
    expect(node.gearRatio).toBe(2.5);
  });

  it('evaluates Basquin cyclic fatigue life under endurance limit', () => {
    // Low torque resulting in stress < endurance limit (185 MPa for Wootz_Bronze_Alloy)
    const node = calculateNodeMechanics(
      'TEST-NODE-03',
      'Endurance Test',
      30.0, // Large radius yields low shear stress
      40,
      'Wootz_Bronze_Alloy',
      20.0,
      1.0
    );

    expect(node.calculatedShearStressMpa).toBeLessThan(MATERIAL_REGISTRY.Wootz_Bronze_Alloy.enduranceLimitMpa);
    expect(node.fatigueLifeRemainingCycles).toBe(1e7); // Infinite life ceiling
    expect(node.safetyStatus).toBe('VALID');
  });

  it('triggers CRITICAL_SHEAR_FAILURE when stress exceeds material yield strength', () => {
    // High torque with small radius yields stress > 450 MPa
    const node = calculateNodeMechanics(
      'TEST-NODE-FAIL',
      'Failure Node',
      5.0, // 5mm radius
      10,
      'Wootz_Bronze_Alloy',
      500.0, // Extreme torque
      1.0
    );

    expect(node.calculatedShearStressMpa).toBeGreaterThan(
      MATERIAL_REGISTRY.Wootz_Bronze_Alloy.yieldStrengthMpa
    );
    expect(node.safetyStatus).toBe('CRITICAL_SHEAR_FAILURE');
  });

  it('transitions thermal status accurately based on operating temperature and stress ratio', () => {
    // Low load: COOL_NOMINAL
    const coolNode = calculateNodeMechanics(
      'COOL-01',
      'Cool Node',
      40.0,
      50,
      'Wootz_Bronze_Alloy',
      20.0,
      1.0
    );
    expect(coolNode.thermalStatus).toBe('COOL_NOMINAL');
    expect(coolNode.operatingTemperatureC).toBeLessThan(60.0);

    // High load: WARM_ELEVATED
    const warmNode = calculateNodeMechanics(
      'WARM-01',
      'Warm Node',
      12.5,
      24,
      'Wootz_Bronze_Alloy',
      450.0,
      2.0 // High torque yields stressRatioPct >= 65%
    );
    expect(['WARM_ELEVATED', 'CRITICAL_THERMAL_ALERT']).toContain(warmNode.thermalStatus);
    expect(warmNode.operatingTemperatureC).toBeGreaterThan(50.0);
  });

  it('falls back safely to default material when invalid material key is provided', () => {
    const fallbackNode = calculateNodeMechanics(
      'FALLBACK-01',
      'Fallback Node',
      15.0,
      24,
      'Non_Existent_Alloy',
      100.0,
      1.0
    );

    expect(fallbackNode).toBeDefined();
    expect(fallbackNode.calculatedShearStressMpa).toBeGreaterThan(0);
    expect(fallbackNode.safetyStatus).toBeDefined();
  });
});

describe('Physics Simulation: runSimulationCascade', () => {
  it('cascades torque across all 4 micro-gear nodes at nominal load (1.0x)', () => {
    const nodes: PhysicsNodeState[] = runSimulationCascade(1.0);

    expect(nodes).toHaveLength(4);
    const [node1, node2, node3, node4] = nodes;

    // Node 1: Primary Drive (150 Nm)
    expect(node1.nodeId).toBe('MG-DRIVE-01');
    expect(node1.inputTorqueNm).toBe(150.0);
    expect(node1.outputTorqueNm).toBe(150.0);

    // Node 2: Secondary Reducer (2:1 ratio from Node 1 output)
    expect(node2.nodeId).toBe('MG-TRANS-02');
    expect(node2.inputTorqueNm).toBe(150.0);
    expect(node2.outputTorqueNm).toBe(300.0);

    // Node 3: Robotic Joint (baseTorque * 0.4 * 1.75)
    expect(node3.nodeId).toBe('MG-ROBO-03');
    expect(node3.inputTorqueNm).toBe(60.0);
    expect(node3.outputTorqueNm).toBe(105.0);

    // Node 4: Structural Cam (node2.outputTorqueNm * 0.7 * 1.3)
    expect(node4.nodeId).toBe('STR-CAM-04');
    expect(node4.material).toBe('Structural_H_Steel');
    expect(node4.inputTorqueNm).toBe(210.0);
    expect(node4.outputTorqueNm).toBe(273.0);
  });

  it('scales all node torques proportionally when modifier changes from 0.5x to 3.0x', () => {
    const minLoad = runSimulationCascade(0.5);
    const maxLoad = runSimulationCascade(3.0);

    // 0.5x load check
    expect(minLoad[0].outputTorqueNm).toBe(75.0);
    expect(minLoad[1].outputTorqueNm).toBe(150.0);

    // 3.0x load check
    expect(maxLoad[0].outputTorqueNm).toBe(450.0);
    expect(maxLoad[1].outputTorqueNm).toBe(900.0);

    // Stress and temperature should strictly increase with higher load
    expect(maxLoad[0].calculatedShearStressMpa).toBeGreaterThan(minLoad[0].calculatedShearStressMpa);
    expect(maxLoad[0].operatingTemperatureC).toBeGreaterThan(minLoad[0].operatingTemperatureC);
    expect(maxLoad[0].stressRatioPct).toBeGreaterThan(minLoad[0].stressRatioPct);
  });

  it('triggers critical failure or high fatigue at extreme 3.0x torque stress', () => {
    const stressNodes = runSimulationCascade(3.0);
    const hasElevatedRisk = stressNodes.some(
      (n) => n.safetyStatus === 'CRITICAL_SHEAR_FAILURE' || n.safetyStatus === 'HIGH_FATIGUE_RISK'
    );
    expect(hasElevatedRisk).toBe(true);
  });
});
