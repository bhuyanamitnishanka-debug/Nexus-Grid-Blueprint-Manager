#!/usr/bin/env python3
# Volume 18 Fault Isolation System Class
class NexusCoreException(Exception):
    def __init__(self, system_id, threshold_breached, current_value, safe_limit):
        self.system_id = system_id
        self.threshold_breached = threshold_breached
        self.current_value = current_value
        self.safe_limit = safe_limit
        super().__init__(f"System [{system_id}] breached safe limit: {threshold_breached} (Value: {current_value}, Limit: {safe_limit})")

class Volume18ExceptionTracker:
    @staticmethod
    def inspect_vitals(snapshot):
        coolant = snapshot.get("subsystems", {}).get("coolant_level_liters", 500.0)
        if coolant < 420.0:
            raise NexusCoreException("COOLANT_LOOP", "LOW_FLUID_PRESSURE_CRITICAL", coolant, 420.0)
        voltage = snapshot.get("subsystems", {}).get("circuit_line_voltage_v", 415.0)
        if voltage > 470.0:
            raise NexusCoreException("POWER_GRID", "VOLTAGE_SURGE_SPIKE_DETECTED", voltage, 470.0)
        density = snapshot.get("medical_regeneration", {}).get("cellular_density_index", 1.25)
        if density < 0.70:
            raise NexusCoreException("BIO_MATRIX", "CELLULAR_DENSITY_DEGRADATION_CRITICAL", density, 0.70)
        return None
