import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  convertTorque,
  convertForce,
  convertStress,
  convertTemperature,
  convertLengthMm,
  convertLengthM,
  convertMass,
  convertVolume,
  UNIT_CONVERSIONS,
  ENGINEERING_CONVERSION_FACTORS,
} from '../utils/unitConversion';
import { UnitConversionTool } from '../components/UnitConversionTool';

describe('Engineering Unit Conversion Calculations', () => {
  it('converts torque between N·m and lbf·ft accurately', () => {
    const metricTorque = convertTorque(150, 'metric');
    expect(metricTorque.value).toBe(150);
    expect(metricTorque.unit).toBe('N·m');
    expect(metricTorque.formatted).toBe('150.0');

    const imperialTorque = convertTorque(150, 'imperial');
    expect(imperialTorque.unit).toBe('lbf·ft');
    expect(imperialTorque.value).toBeCloseTo(150 * UNIT_CONVERSIONS.TORQUE_NM_TO_LBFFT, 4);
    expect(parseFloat(imperialTorque.formatted)).toBeCloseTo(110.6, 1);
  });

  it('converts force between Newtons and lbf accurately', () => {
    const metricForce = convertForce(120, 'metric');
    expect(metricForce.unit).toBe('N');
    expect(metricForce.value).toBe(120);

    const imperialForce = convertForce(120, 'imperial');
    expect(imperialForce.unit).toBe('lbf');
    expect(imperialForce.value).toBeCloseTo(120 * UNIT_CONVERSIONS.FORCE_N_TO_LBF, 3);
    expect(parseFloat(imperialForce.formatted)).toBeCloseTo(27.0, 1);
  });

  it('converts torsional shear stress between MPa and psi accurately', () => {
    const metricStress = convertStress(172.5, 'metric');
    expect(metricStress.unit).toBe('MPa');
    expect(metricStress.value).toBe(172.5);

    const imperialStress = convertStress(172.5, 'imperial');
    expect(imperialStress.unit).toBe('psi');
    expect(imperialStress.value).toBeCloseTo(172.5 * UNIT_CONVERSIONS.STRESS_MPA_TO_PSI, 1);
    expect(parseInt(imperialStress.formatted, 10)).toBe(25019);
  });

  it('converts temperature between Celsius and Fahrenheit accurately', () => {
    const metricTemp = convertTemperature(100, 'metric');
    expect(metricTemp.formatted).toBe('100.0');
    expect(metricTemp.unit).toBe('°C');

    const imperialTemp = convertTemperature(100, 'imperial');
    expect(imperialTemp.formatted).toBe('212.0');
    expect(imperialTemp.unit).toBe('°F');

    const freezingTemp = convertTemperature(0, 'imperial');
    expect(freezingTemp.formatted).toBe('32.0');
    expect(freezingTemp.unit).toBe('°F');
  });

  it('converts linear dimensions between mm and inches', () => {
    const metricRadius = convertLengthMm(25.4, 'metric');
    expect(metricRadius.unit).toBe('mm');
    expect(metricRadius.value).toBe(25.4);

    const imperialRadius = convertLengthMm(25.4, 'imperial');
    expect(imperialRadius.unit).toBe('in');
    expect(parseFloat(imperialRadius.formatted)).toBeCloseTo(1.0, 2);
  });

  it('converts fluid volume between Liters and US Gallons', () => {
    const metricVol = convertVolume(500, 'metric');
    expect(metricVol.unit).toBe('L');
    expect(metricVol.value).toBe(500);

    const imperialVol = convertVolume(500, 'imperial');
    expect(imperialVol.unit).toBe('gal');
    expect(parseFloat(imperialVol.formatted)).toBeCloseTo(132.1, 1);
  });

  it('verifies conversion factors table definitions', () => {
    expect(ENGINEERING_CONVERSION_FACTORS.length).toBeGreaterThanOrEqual(7);
    const torqueFactor = ENGINEERING_CONVERSION_FACTORS.find((f) => f.category === 'Torque / Moment');
    expect(torqueFactor).toBeDefined();
    expect(torqueFactor?.formula).toContain('0.737562');
  });
});

describe('UnitConversionTool Component UI & Interactivity', () => {
  it('renders with metric units by default', () => {
    const onToggle = vi.fn();
    render(
      <UnitConversionTool
        currentSystem="metric"
        onToggleSystem={onToggle}
        activeModifier={1.0}
      />
    );

    expect(screen.getByText('Unit Conversion Tool & Live Telemetry Scaler')).toBeInTheDocument();
    expect(screen.getByText('🌐 METRIC (SI)')).toBeInTheDocument();
    expect(screen.getByText('⚙️ IMPERIAL (US)')).toBeInTheDocument();
    expect(screen.getByText('DRIVE TORQUE')).toBeInTheDocument();
    expect(screen.getByText('150.0')).toBeInTheDocument();
    expect(screen.getByText('N·m')).toBeInTheDocument();
  });

  it('allows clicking the toggle switch to change to Imperial system', () => {
    const onToggle = vi.fn();
    render(
      <UnitConversionTool
        currentSystem="metric"
        onToggleSystem={onToggle}
        activeModifier={1.0}
      />
    );

    const imperialBtn = screen.getByText('⚙️ IMPERIAL (US)');
    fireEvent.click(imperialBtn);
    expect(onToggle).toHaveBeenCalledWith('imperial');
  });

  it('renders converted imperial values when currentSystem is imperial', () => {
    const onToggle = vi.fn();
    render(
      <UnitConversionTool
        currentSystem="imperial"
        onToggleSystem={onToggle}
        activeModifier={1.0}
      />
    );

    expect(screen.getByText('110.6')).toBeInTheDocument();
    expect(screen.getByText('lbf·ft')).toBeInTheDocument();
  });

  it('updates dynamic sandbox calculations when typing a value', () => {
    const onToggle = vi.fn();
    render(
      <UnitConversionTool
        currentSystem="metric"
        onToggleSystem={onToggle}
        activeModifier={1.0}
        variant="full"
      />
    );

    const input = screen.getByDisplayValue('150');
    fireEvent.change(input, { target: { value: '200' } });
    expect(screen.getByText(/147.51 lbf·ft/)).toBeInTheDocument();
  });
});
