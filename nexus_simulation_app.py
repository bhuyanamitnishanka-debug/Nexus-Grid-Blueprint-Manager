#!/usr/bin/env python3
"""
Nexus-Grid Multi-System Simulation Platform
- Mechanical Gear Physics & Torsional Shear Stress
- Liquid Chemical Coolant Loop & 415V Circuit Line Voltage
- Class 4: Bio-Regeneration Medical Subsystem (Deep-Tissue Regeneration)
- Telemetry Exception Handler with System Halt Trap
- 3D WebGL (Three.js) Pipeline Vector Mesh Interface
- Dual-Persistence Layer (simulation_db.json & simulation_audit.csv)
"""

import json
import csv
import os
import math
import logging
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, HTTPServer
import threading

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] Nexus Core Engine: %(message)s',
    datefmt='%H:%M:%S'
)

JSON_DB_FILE = "simulation_db.json"
CSV_AUDIT_FILE = "simulation_audit.csv"

# =====================================================================
# CUSTOM SUB-SYSTEM CUSTOM EXCEPTIONS
# =====================================================================
class SubsystemVitalsException(Exception):
    """Custom exception raised when environmental or bio-telemetry metrics cross critical boundaries."""
    def __init__(self, message: str, diagnostics: dict):
        super().__init__(message)
        self.diagnostics = diagnostics

# =====================================================================
# DATA PERSISTENCE LAYER MODULES
# =====================================================================
class DataPersistenceManager:
    @staticmethod
    def initialize_storage():
        if not os.path.exists(JSON_DB_FILE):
            with open(JSON_DB_FILE, 'w') as f:
                json.dump([], f)
        if not os.path.exists(CSV_AUDIT_FILE):
            with open(CSV_AUDIT_FILE, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    "Timestamp", "Load_Modifier", "Coolant_Liters", "Circuit_Voltage_V",
                    "Regen_Rate_Pct", "Cell_Density_Indices", "System_Stability"
                ])

    @staticmethod
    def commit_snapshot(state_snapshot: dict):
        try:
            with open(JSON_DB_FILE, 'r+') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = []
                data.append(state_snapshot)
                f.seek(0)
                f.truncate()
                json.dump(data, f, indent=4)
        except Exception as e:
            logging.error(f"JSON save error: {str(e)}")

        try:
            with open(CSV_AUDIT_FILE, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    state_snapshot["timestamp"],
                    state_snapshot["active_layout_modifier"],
                    state_snapshot["subsystems"]["coolant_level_liters"],
                    state_snapshot["subsystems"]["circuit_line_voltage_v"],
                    state_snapshot["medical_regeneration"]["regeneration_rate_pct"],
                    state_snapshot["medical_regeneration"]["cellular_density_index"],
                    state_snapshot["exception_handler_status"]["global_state"]
                ])
        except Exception as e:
            logging.error(f"CSV save error: {str(e)}")

# =====================================================================
# CORE SIMULATION ENGINE WITH BIO-TELEMETRY & EXCEPTION HANDLER
# =====================================================================
class MicroGearNode:
    def __init__(self, node_id: str, radius_mm: float):
        self.node_id = node_id
        self.radius_m = radius_mm / 1000.0
        self.yield_strength_mpa = 450.0
        self.output_torque_nm = 0.0
        self.calculated_shear_stress_mpa = 0.0
        self.safety_status = "VALID"

    def calculate_mechanics(self, incoming_torque_nm: float, multiplier: float):
        self.output_torque_nm = incoming_torque_nm * multiplier
        self.calculated_shear_stress_mpa = ((2 * self.output_torque_nm) / (math.pi * math.pow(self.radius_m, 3))) / 1e6
        self.safety_status = "CRITICAL_SHEAR_FAILURE" if self.calculated_shear_stress_mpa > self.yield_strength_mpa else "VALID"

    def to_payload(self) -> dict:
        return {
            "node_id": self.node_id,
            "calculated_shear_stress_mpa": round(self.calculated_shear_stress_mpa, 2),
            "output_torque_nm": round(self.output_torque_nm, 2),
            "safety_status": self.safety_status
        }

class LiveSimulationEngine:
    def __init__(self):
        self.active_layout_modifier = 1.0
        self.base_coolant_capacity = 500.0  
        self.base_voltage = 415.0  
        
        # Fourth Class of Medicine: Automated Deep-Tissue Regeneration Parameters
        self.base_regeneration_rate = 94.2  # % efficacy base boundary
        self.cellular_density_index = 1.25  # Standard biological cell volume index
        
        self.nodes = {
            "MG-DRIVE-01": MicroGearNode("MG-DRIVE-01", 12.5),
            "MG-TRANS-02": MicroGearNode("MG-TRANS-02", 25.0),
            "MG-ROBO-03": MicroGearNode("MG-ROBO-03", 8.0),
            "STR-CAM-04": MicroGearNode("STR-CAM-04", 35.0)
        }

        self.global_state = "STABLE_OPERATION"
        self.last_exception_msg = "No faults registered."
        self.run_engine_loop()

    def run_engine_loop(self):
        """Simulates simultaneous engineering mechanics and cellular regeneration metrics."""
        # 1. Standard Hardware Physics
        base_torque = 150.0 * self.active_layout_modifier
        self.nodes["MG-DRIVE-01"].calculate_mechanics(base_torque, 1.0)
        self.nodes["MG-TRANS-02"].calculate_mechanics(base_torque, 2.0)
        self.nodes["MG-ROBO-03"].calculate_mechanics(base_torque * 0.4, 1.75)
        self.nodes["STR-CAM-04"].calculate_mechanics(base_torque * 1.4, 1.3)

        self.current_coolant_level = max(0.0, self.base_coolant_capacity - (45.5 * (self.active_layout_modifier - 1.0)))
        self.current_voltage = self.base_voltage + (35.2 * (self.active_layout_modifier - 1.0))
        
        # 2. Automated Deep-Tissue Regeneration Calculations
        self.current_regen_rate = min(100.0, self.base_regeneration_rate + (2.5 * self.active_layout_modifier))
        self.current_cellular_density = max(0.5, self.cellular_density_index - (0.35 * (self.active_layout_modifier - 1.0)))

        # 3. Robust Exception Handler Block
        try:
            diagnostics = {
                "coolant": self.current_coolant_level,
                "voltage": self.current_voltage,
                "cellular_density": self.current_cellular_density
            }
            
            if self.current_coolant_level < 420.0:
                raise SubsystemVitalsException("CRITICAL_LOW_FLOW: Coolant pressure drops below safe threshold limits.", diagnostics)
            if self.current_voltage > 470.0:
                raise SubsystemVitalsException("VOLTAGE_SURGE_FAULT: Circuit line spikes outside target baseline parameters.", diagnostics)
            if self.current_cellular_density < 0.70:
                raise SubsystemVitalsException("BIO_STABILITY_FAILURE: Cellular density degradation detected in regeneration fluid zone.", diagnostics)
                
            self.global_state = "STABLE_OPERATION"
            self.last_exception_msg = "All tracking matrices verified normal."
            
        except SubsystemVitalsException as e:
            self.global_state = "SYSTEM_HALT_TRIGGERED"
            self.last_exception_msg = str(e)
            logging.warning(f"Exception Handler Trap: {str(e)}")

    def process_layout_change(self, modifier_value: float) -> dict:
        self.active_layout_modifier = modifier_value
        self.run_engine_loop()
        snapshot = self.get_current_state()
        DataPersistenceManager.commit_snapshot(snapshot)
        return snapshot

    def get_current_state(self) -> dict:
        return {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "active_layout_modifier": self.active_layout_modifier,
            "subsystems": {
                "coolant_level_liters": round(self.current_coolant_level, 1),
                "circuit_line_voltage_v": round(self.current_voltage, 1)
            },
            "medical_regeneration": {
                "regeneration_rate_pct": round(self.current_regen_rate, 2),
                "cellular_density_index": round(self.current_cellular_density, 3),
                "target_fluid_viscosity_cp": "4.5"
            },
            "exception_handler_status": {
                "global_state": self.global_state,
                "error_trap_logs": self.last_exception_msg
            },
            "telemetry": {nid: node.to_payload() for nid, node in self.nodes.items()}
        }

SIM_ENGINE = LiveSimulationEngine()

# =====================================================================
# EMBEDDED DASHBOARD WITH THREE.JS 3D PIPELINE WEBGL RENDERER
# =====================================================================
HTML_INTERFACE_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <title>Nexus Integrated Simulation Matrix</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body class="bg-slate-950 text-slate-100 p-6 md:p-8 font-sans min-h-screen">
    <div class="max-w-6xl mx-auto space-y-6">
        
        <!-- Top App Bar -->
        <div class="border border-slate-800 bg-slate-900/60 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 class="text-xl font-bold tracking-tight text-white">Nexus-Grid Multi-System Simulation Console</h1>
                <p class="text-xs text-slate-400 mt-0.5">Bio-Mechanical Automation Hub & Cellular Telemetry Tracker</p>
            </div>
            <div class="flex items-center gap-3">
                <div id="globalStateBadge" class="text-xs font-mono px-3 py-1 rounded border border-emerald-500/40 bg-emerald-950/20 text-emerald-400">STABLE_OPERATION</div>
                <a href="/simulation_db.json" class="text-xs font-mono px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700">JSON DB</a>
                <a href="/simulation_audit.csv" class="text-xs font-mono px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700">CSV Audit</a>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Sidebar Layout Controls -->
            <div class="space-y-4">
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <h3 class="text-xs font-semibold uppercase text-slate-400 tracking-wider">Simulation Force Driver</h3>
                    <input type="range" id="layoutSlider" min="0.5" max="3.0" step="0.1" value="1.0" class="w-full cursor-pointer accent-blue-500" oninput="updateSim(this.value)">
                    <div class="text-center font-mono text-xs text-blue-400 font-bold" id="lblMod">1.0x Load Coefficient</div>
                    <div class="text-[11px] font-mono text-slate-500 flex justify-between">
                        <span>0.5x Min</span>
                        <span>1.0x Nom</span>
                        <span class="text-rose-400">3.0x Max Stress</span>
                    </div>
                </div>

                <!-- Exception Handler Status Panel -->
                <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                    <div class="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold">
                        <span>🛡️ Exception Handler Monitor</span>
                    </div>
                    <div id="errorLogBox" class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                        Running active diagnostic tracing...
                    </div>
                </div>
            </div>

            <!-- Main Telemetry & 3D WebGL Pipeline Area (2 cols) -->
            <div class="lg:col-span-2 space-y-6">
                <!-- 3D Pipeline Mesh Viewport -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden">
                    <div class="flex justify-between items-center mb-2 px-2">
                        <span class="text-xs font-mono text-cyan-400">3D Pipeline WebGL Flow Vector</span>
                        <span class="text-[10px] font-mono text-slate-500">Three.js Mesh Rendering</span>
                    </div>
                    <div id="webglContainer" class="w-full h-64 bg-slate-950 rounded-xl overflow-hidden relative"></div>
                </div>

                <!-- Bio-Regeneration & Subsystem Container -->
                <div id="telemetryContainer" class="space-y-4"></div>
            </div>
        </div>
    </div>

    <script>
        let scene, camera, renderer, fluidMesh;

        function init3DViewport() {
            const container = document.getElementById('webglContainer');
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
            camera.position.z = 4.2;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setClearColor(0x06080d, 1);
            container.appendChild(renderer.domElement);

            const light = new THREE.DirectionalLight(0xffffff, 1.2);
            light.position.set(2, 2, 4).normalize();
            scene.add(light);
            scene.add(new THREE.AmbientLight(0x334155));

            const geometry = new THREE.CylinderGeometry(0.7, 0.7, 2.6, 32, 1, true);
            const material = new THREE.MeshPhongMaterial({
                color: 0x00d2ff,
                wireframe: true,
                transparent: true,
                opacity: 0.85
            });
            fluidMesh = new THREE.Mesh(geometry, material);
            fluidMesh.rotation.x = 1.57;
            scene.add(fluidMesh);

            animate3D();
        }

        function animate3D() {
            requestAnimationFrame(animate3D);
            if (fluidMesh) {
                fluidMesh.rotation.z += 0.015;
            }
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        }

        async function updateSim(val) {
            document.getElementById('lblMod').innerText = val + 'x Load Coefficient';
            const res = await fetch('/api/layout_change', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({modifier: parseFloat(val)})
            });
            renderDashboard(await res.json());
        }

        function renderDashboard(data) {
            const med = data.medical_regeneration;
            const sub = data.subsystems;
            const handler = data.exception_handler_status;

            if (fluidMesh) {
                if (handler.global_state !== "STABLE_OPERATION") {
                    fluidMesh.material.color.setHex(0xf43f5e);
                } else {
                    fluidMesh.material.color.setHex(0x00d2ff);
                }
            }

            const badge = document.getElementById('globalStateBadge');
            badge.innerText = handler.global_state;
            badge.className = handler.global_state === "STABLE_OPERATION"
                ? "text-xs font-mono px-3 py-1 rounded border border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                : "text-xs font-mono px-3 py-1 rounded border border-rose-500/50 bg-rose-950/40 text-rose-400 animate-pulse";

            document.getElementById('errorLogBox').innerHTML = `<span class="${handler.global_state === 'STABLE_OPERATION' ? 'text-blue-400' : 'text-rose-400'}">${handler.error_trap_logs}</span>`;

            document.getElementById('telemetryContainer').innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                        <span class="text-xs font-mono text-cyan-400 font-semibold block">🧬 Class 4: Bio-Regeneration Telemetry</span>
                        <div class="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                            <div>
                                <span class="text-[10px] text-slate-500 block">REGEN EFFICACY</span>
                                <span class="text-lg font-bold text-white">${med.regeneration_rate_pct}%</span>
                            </div>
                            <div>
                                <span class="text-[10px] text-slate-500 block">CELL DENSITY VOL</span>
                                <span class="text-lg font-bold ${med.cellular_density_index < 0.7 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}">${med.cellular_density_index}</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                        <span class="text-xs font-mono text-amber-400 font-semibold block">⚡ Environmental Subsystems</span>
                        <div class="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                            <div>
                                <span class="text-[10px] text-slate-500 block">COOLANT LEVEL</span>
                                <span class="text-lg font-bold ${sub.coolant_level_liters < 420 ? 'text-rose-400 animate-pulse' : 'text-white'}">${sub.coolant_level_liters} L</span>
                            </div>
                            <div>
                                <span class="text-[10px] text-slate-500 block">LINE VOLTAGE</span>
                                <span class="text-lg font-bold ${sub.circuit_line_voltage_v > 470 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}">${sub.circuit_line_voltage_v} V</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        async function init() {
            init3DViewport();
            const res = await fetch('/api/telemetry');
            renderDashboard(await res.json());

            window.addEventListener('resize', () => {
                const container = document.getElementById('webglContainer');
                if (container && camera && renderer) {
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(container.clientWidth, container.clientHeight);
                }
            });
        }
        window.onload = init;
    </script>
</body>
</html>
"""

# =====================================================================
# NETWORK CONTROLLER ENDPOINT ROUTER
# =====================================================================
class SimulationRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/telemetry':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(SIM_ENGINE.get_current_state()).encode('utf-8'))
        elif self.path == '/simulation_db.json':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            with open(JSON_DB_FILE, 'rb') as f:
                self.wfile.write(f.read())
        elif self.path == '/simulation_audit.csv':
            self.send_response(200)
            self.send_header('Content-Type', 'text/csv')
            self.end_headers()
            with open(CSV_AUDIT_FILE, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML_INTERFACE_TEMPLATE.encode('utf-8'))

    def do_POST(self):
        if self.path == '/api/layout_change':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode('utf-8'))
            modifier = float(payload.get("modifier", 1.0))
            updated_state = SIM_ENGINE.process_layout_change(modifier)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(updated_state).encode('utf-8'))

def launch_server():
    DataPersistenceManager.initialize_storage()
    SIM_ENGINE.process_layout_change(1.0)
    server = HTTPServer(('', 8080), SimulationRequestHandler)
    logging.info("Nexus Core Engine Server listening on port 8080")
    server.serve_forever()

if __name__ == '__main__':
    launch_server()
