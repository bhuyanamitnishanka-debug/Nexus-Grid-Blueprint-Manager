export type UnitSystem = 'metric' | 'imperial';

export interface FormattedUnitValue {
  value: number;
  formatted: string;
  unit: string;
  fullString: string;
  system: UnitSystem;
}

export const UNIT_CONVERSIONS = {
  // Torque: N·m to lbf·ft
  TORQUE_NM_TO_LBFFT: 0.737562149,
  TORQUE_LBFFT_TO_NM: 1 / 0.737562149,
  
  // Torque: N·m to lbf·in
  TORQUE_NM_TO_LBFIN: 8.85074579,
  TORQUE_LBFIN_TO_NM: 1 / 8.85074579,

  // Force: N to lbf
  FORCE_N_TO_LBF: 0.224808943,
  FORCE_LBF_TO_N: 1 / 0.224808943,

  // Stress / Pressure: MPa to psi
  STRESS_MPA_TO_PSI: 145.0377377,
  STRESS_PSI_TO_MPA: 1 / 145.0377377,

  // Length: mm to inches
  LENGTH_MM_TO_IN: 0.0393700787,
  LENGTH_IN_TO_MM: 25.4,

  // Length: m to feet
  LENGTH_M_TO_FT: 3.2808399,
  LENGTH_FT_TO_M: 1 / 3.2808399,

  // Mass: kg to lbs
  MASS_KG_TO_LBS: 2.20462262,
  MASS_LBS_TO_KG: 1 / 2.20462262,

  // Volume: L to US gallons
  VOLUME_L_TO_GAL: 0.264172052,
  VOLUME_GAL_TO_L: 1 / 0.264172052,

  // Acceleration: m/s^2 to ft/s^2
  ACCEL_MS2_TO_FTS2: 3.2808399,
  ACCEL_FTS2_TO_MS2: 1 / 3.2808399,
};

/** Convert torque from N·m to target system */
export function convertTorque(
  torqueNm: number,
  system: UnitSystem,
  decimals: number = 1
): FormattedUnitValue {
  if (system === 'metric') {
    return {
      value: torqueNm,
      formatted: torqueNm.toFixed(decimals),
      unit: 'N·m',
      fullString: `${torqueNm.toFixed(decimals)} N·m`,
      system,
    };
  }
  const val = torqueNm * UNIT_CONVERSIONS.TORQUE_NM_TO_LBFFT;
  return {
    value: val,
    formatted: val.toFixed(decimals),
    unit: 'lbf·ft',
    fullString: `${val.toFixed(decimals)} lbf·ft`,
    system,
  };
}

/** Convert force from Newtons to target system */
export function convertForce(
  forceN: number,
  system: UnitSystem,
  decimals: number = 1
): FormattedUnitValue {
  if (system === 'metric') {
    return {
      value: forceN,
      formatted: forceN.toFixed(decimals),
      unit: 'N',
      fullString: `${forceN.toFixed(decimals)} N`,
      system,
    };
  }
  const val = forceN * UNIT_CONVERSIONS.FORCE_N_TO_LBF;
  return {
    value: val,
    formatted: val.toFixed(decimals),
    unit: 'lbf',
    fullString: `${val.toFixed(decimals)} lbf`,
    system,
  };
}

/** Convert shear stress from MPa to target system (psi) */
export function convertStress(
  stressMpa: number,
  system: UnitSystem,
  decimals: number = 1
): FormattedUnitValue {
  if (system === 'metric') {
    return {
      value: stressMpa,
      formatted: stressMpa.toFixed(decimals),
      unit: 'MPa',
      fullString: `${stressMpa.toFixed(decimals)} MPa`,
      system,
    };
  }
  const val = stressMpa * UNIT_CONVERSIONS.STRESS_MPA_TO_PSI;
  return {
    value: val,
    formatted: val.toFixed(0),
    unit: 'psi',
    fullString: `${val.toFixed(0)} psi`,
    system,
  };
}

/** Convert temperature from Celsius to target system (Fahrenheit) */
export function convertTemperature(
  tempC: number,
  system: UnitSystem,
  decimals: number = 1
): FormattedUnitValue {
  if (system === 'metric') {
    return {
      value: tempC,
      formatted: tempC.toFixed(decimals),
      unit: '°C',
      fullString: `${tempC.toFixed(decimals)}°C`,
      system,
    };
  }
  const val = (tempC * 9) / 5 + 32;
  return {
    value: val,
    formatted: val.toFixed(decimals),
    unit: '°F',
    fullString: `${val.toFixed(decimals)}°F`,
    system,
  };
}

/** Convert length / radius from mm to target system (inches) */
export function convertLengthMm(
  lengthMm: number,
  system: UnitSystem,
  decimals: number = 2
): FormattedUnitValue {
  if (system === 'metric') {
    return {
      value: lengthMm,
      formatted: lengthMm.toFixed(decimals),
      unit: 'mm',
      fullString: `${lengthMm.toFixed(decimals)} mm`,
      system,
    };
  }
  const val = lengthMm * UNIT_CONVERSIONS.LENGTH_MM_TO_IN;
  return {
    value: val,
    formatted: val.toFixed(decimals),
    unit: 'in',
    fullString: `${val.toFixed(decimals)} in`,
    system,
  };
}

/** Convert length / offset from meters to target system (feet) */
export function convertLengthM(
  lengthM: number,
  system: UnitSystem,
  decimals: number = 3
): FormattedUnitValue {
  if (system === 'metric') {
    return {
      value: lengthM,
      formatted: lengthM.toFixed(decimals),
      unit: 'm',
      fullString: `${lengthM.toFixed(decimals)} m`,
      system,
    };
  }
  const val = lengthM * UNIT_CONVERSIONS.LENGTH_M_TO_FT;
  return {
    value: val,
    formatted: val.toFixed(decimals),
    unit: 'ft',
    fullString: `${val.toFixed(decimals)} ft`,
    system,
  };
}

/** Convert mass from kg to target system (lbs) */
export function convertMass(
  massKg: number,
  system: UnitSystem,
  decimals: number = 1
): FormattedUnitValue {
  if (system === 'metric') {
    return {
      value: massKg,
      formatted: massKg.toFixed(decimals),
      unit: 'kg',
      fullString: `${massKg.toFixed(decimals)} kg`,
      system,
    };
  }
  const val = massKg * UNIT_CONVERSIONS.MASS_KG_TO_LBS;
  return {
    value: val,
    formatted: val.toFixed(decimals),
    unit: 'lbs',
    fullString: `${val.toFixed(decimals)} lbs`,
    system,
  };
}

/** Convert fluid volume from Liters to target system (US Gallons) */
export function convertVolume(
  volumeL: number,
  system: UnitSystem,
  decimals: number = 1
): FormattedUnitValue {
  if (system === 'metric') {
    return {
      value: volumeL,
      formatted: volumeL.toFixed(decimals),
      unit: 'L',
      fullString: `${volumeL.toFixed(decimals)} L`,
      system,
    };
  }
  const val = volumeL * UNIT_CONVERSIONS.VOLUME_L_TO_GAL;
  return {
    value: val,
    formatted: val.toFixed(decimals),
    unit: 'gal',
    fullString: `${val.toFixed(decimals)} gal`,
    system,
  };
}

export interface UnitConversionFactor {
  category: string;
  metricUnit: string;
  imperialUnit: string;
  formula: string;
  factor: number;
  description: string;
}

export const ENGINEERING_CONVERSION_FACTORS: UnitConversionFactor[] = [
  {
    category: 'Torque / Moment',
    metricUnit: 'N·m (Newton-meter)',
    imperialUnit: 'lbf·ft (Pound-foot)',
    formula: '1 N·m = 0.737562 lbf·ft',
    factor: UNIT_CONVERSIONS.TORQUE_NM_TO_LBFFT,
    description: 'Rotational kinetic wrench and torsional shaft moment load.',
  },
  {
    category: 'Torsional Shear Stress',
    metricUnit: 'MPa (Megapascal)',
    imperialUnit: 'psi (Pounds/sq inch)',
    formula: '1 MPa = 145.038 psi',
    factor: UNIT_CONVERSIONS.STRESS_MPA_TO_PSI,
    description: 'Calculated via τ = 2T / (π · r³), elastic shear threshold.',
  },
  {
    category: 'External Force / Load',
    metricUnit: 'N (Newton)',
    imperialUnit: 'lbf (Pound-force)',
    formula: '1 N = 0.224809 lbf',
    factor: UNIT_CONVERSIONS.FORCE_N_TO_LBF,
    description: 'End-effector dynamic thrust, tool friction, and gravitational dead weight.',
  },
  {
    category: 'Thermal Operating Temperature',
    metricUnit: '°C (Celsius)',
    imperialUnit: '°F (Fahrenheit)',
    formula: 'T(°F) = T(°C) × 1.8 + 32',
    factor: 1.8,
    description: 'Micro-gear tooth frictional junction and coolant loop temperature.',
  },
  {
    category: 'Structural Dimensions / Radius',
    metricUnit: 'mm (Millimeter)',
    imperialUnit: 'in (Inches)',
    formula: '1 mm = 0.039370 in',
    factor: UNIT_CONVERSIONS.LENGTH_MM_TO_IN,
    description: 'Pitch circle radius (r) and module parameters in DH link rows.',
  },
  {
    category: 'Link Length & Offset',
    metricUnit: 'm (Meter)',
    imperialUnit: 'ft (Feet)',
    formula: '1 m = 3.28084 ft',
    factor: UNIT_CONVERSIONS.LENGTH_M_TO_FT,
    description: 'Denavit-Hartenberg link distance d_i and length a_i kinematic bounds.',
  },
  {
    category: 'Component Mass',
    metricUnit: 'kg (Kilogram)',
    imperialUnit: 'lbs (Pounds mass)',
    formula: '1 kg = 2.20462 lbs',
    factor: UNIT_CONVERSIONS.MASS_KG_TO_LBS,
    description: 'Structural weight contributing to downward gravity wrench Fz = m × 9.81.',
  },
  {
    category: 'Coolant Fluid Reservoir',
    metricUnit: 'L (Liters)',
    imperialUnit: 'gal (US Gallons)',
    formula: '1 L = 0.264172 gal',
    factor: UNIT_CONVERSIONS.VOLUME_L_TO_GAL,
    description: 'Chemical thermal dissipation reservoir active volumetric capacity.',
  },
];
