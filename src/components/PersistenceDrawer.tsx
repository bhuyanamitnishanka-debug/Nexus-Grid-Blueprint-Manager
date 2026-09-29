import React, { useState, useEffect } from 'react';
import {
  getJsonDatabase,
  getCsvDatabase,
  downloadJsonDatabase,
  downloadCsvAudit,
  downloadCleanHistoryScript,
  optimizeHistoryLogs,
  clearPersistenceLogs,
  getPersistenceSummary,
  TelemetrySnapshot,
} from '../utils/simulationPersistence';
import {
  Database,
  FileSpreadsheet,
  FileCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  X,
  Server,
  Terminal,
  ShieldCheck,
  Flame,
  Zap,
  Droplets,
  Sparkles,
  Filter,
} from 'lucide-react';

interface PersistenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogEvent: (level: 'INFO' | 'WARN' | 'SUCCESS' | 'CMD', msg: string) => void;
}

export const PersistenceDrawer: React.FC<PersistenceDrawerProps> = ({
  isOpen,
  onClose,
  onLogEvent,
}) => {
  const [activeTab, setActiveTab] = useState<'CSV' | 'JSON' | 'PYTHON' | 'SCRIPT'>('CSV');
  const [copied, setCopied] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [dbSnapshots, setDbSnapshots] = useState<TelemetrySnapshot[]>([]);
  const [csvRaw, setCsvRaw] = useState<string>('');
  const [stats, setStats] = useState(getPersistenceSummary());
  const [lastOptimizedResult, setLastOptimizedResult] = useState<{
    initialCount: number;
    finalCount: number;
    cleanedCount: number;
  } | null>(null);

  const refreshData = () => {
    setDbSnapshots(getJsonDatabase());
    setCsvRaw(getCsvDatabase());
    setStats(getPersistenceSummary());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onLogEvent('SUCCESS', `Copied ${label} to clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    downloadCsvAudit();
    onLogEvent('SUCCESS', 'Downloaded simulation_audit.csv spreadsheet.');
  };

  const handleDownloadJson = () => {
    downloadJsonDatabase();
    onLogEvent('SUCCESS', 'Downloaded simulation_db.json database.');
  };

  const handleDownloadScript = () => {
    downloadCleanHistoryScript();
    onLogEvent('SUCCESS', 'Downloaded clean_history.sh optimization script.');
  };

  const handleRunOptimizer = () => {
    const res = optimizeHistoryLogs();
    setLastOptimizedResult(res);
    refreshData();
    if (res.cleanedCount > 0) {
      onLogEvent(
        'SUCCESS',
        `Log filtration complete: eliminated ${res.cleanedCount} redundant duplication snapshots.`
      );
    } else {
      onLogEvent('INFO', 'Log filtration complete: zero redundant snapshots detected.');
    }
  };

  const handleClear = () => {
    if (window.confirm('Reset persistent storage database to baseline?')) {
      clearPersistenceLogs();
      refreshData();
      onLogEvent('INFO', 'Persistence storage reset to baseline configuration.');
    }
  };

  // Flattened CSV rows for table viewing
  const csvLines = csvRaw.trim().split('\n');
  const rows = csvLines
    .slice(1)
    .reverse()
    .filter((line) => {
      if (!filterQuery) return true;
      return line.toLowerCase().includes(filterQuery.toLowerCase());
    })
    .slice(0, 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0D14] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Dual-Format Data Persistence &amp; Subsystem Master
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                  CONCURRENT ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated serialization tracking gear stress, chemical coolant levels, and circuit line voltages.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Metrics Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#080B11] border-b border-slate-800/80 text-xs font-mono">
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">TOTAL SNAPSHOTS</span>
            <span className="text-white font-bold text-sm">{stats.totalSnapshots} Events</span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">COOLANT LEVEL MIN</span>
            <span
              className={`font-bold text-sm ${
                stats.minCoolantLiters < 420 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'
              }`}
            >
              {stats.minCoolantLiters.toFixed(1)} L
            </span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">PEAK BUS VOLTAGE</span>
            <span
              className={`font-bold text-sm ${
                stats.maxVoltageV > 450 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {stats.maxVoltageV.toFixed(1)} V AC
            </span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">FAILURES DETECTED</span>
            <span
              className={`font-bold text-sm ${
                stats.criticalFailuresLogged > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {stats.criticalFailuresLogged} Critical
            </span>
          </div>
        </div>

        {/* Navigation Tabs & Actions Bar */}
        <div className="px-4 py-3 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('CSV')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'CSV'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>simulation_audit.csv</span>
            </button>
            <button
              onClick={() => setActiveTab('JSON')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'JSON'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>simulation_db.json</span>
            </button>
            <button
              onClick={() => setActiveTab('SCRIPT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SCRIPT'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>clean_history.sh Tool</span>
            </button>
            <button
              onClick={() => setActiveTab('PYTHON')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PYTHON'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>nexus_simulation_app.py</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Run Optimizer Button */}
            <button
              onClick={handleRunOptimizer}
              className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Execute log filter optimization to eliminate redundant identical consecutive snapshots"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filter Duplicates</span>
            </button>

            {activeTab === 'CSV' && (
              <button
                onClick={handleDownloadCsv}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}

            {activeTab === 'JSON' && (
              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            )}

            {activeTab === 'SCRIPT' && (
              <button
                onClick={handleDownloadScript}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .sh</span>
              </button>
            )}

            <button
              onClick={() => {
                const content =
                  activeTab === 'CSV'
                    ? csvRaw
                    : activeTab === 'JSON'
                    ? JSON.stringify(dbSnapshots, null, 4)
                    : activeTab === 'SCRIPT'
                    ? CLEAN_SCRIPT_SAMPLE
                    : PYTHON_CODE_SAMPLE;
                handleCopy(content, activeTab);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={refreshData}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
              title="Refresh persistence store"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClear}
              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-lg transition cursor-pointer"
              title="Reset database to baseline"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Optimizer Feedback Banner if executed */}
        {lastOptimizedResult && (
          <div className="bg-emerald-950/50 border-b border-emerald-500/40 p-2.5 px-4 text-xs font-mono text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>
                Log filtration cycle complete: Cleaned{' '}
                <strong>{lastOptimizedResult.cleanedCount}</strong> redundant duplication snapshots (
                {lastOptimizedResult.initialCount} ➔ {lastOptimizedResult.finalCount} records).
              </span>
            </div>
            <button
              onClick={() => setLastOptimizedResult(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab 1: CSV Audit Spreadsheet Viewer with Subsystem Metrics */}
        {activeTab === 'CSV' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter by node ID, status, coolant, voltage..."
                className="w-full max-w-sm px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] font-mono text-slate-500 shrink-0">
                Schema: Timestamp, Load, Coolant, Voltage, Coolant Status, Electrical Status, Node ID, Torque, Stress, Safety
              </span>
            </div>

            <div className="flex-1 border border-slate-800 rounded-xl overflow-auto bg-[#07090E]">
              <table className="w-full text-[11px] font-mono text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 select-none">
                  <tr>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Load</th>
                    <th className="p-2.5">Coolant (L)</th>
                    <th className="p-2.5">Voltage (V)</th>
                    <th className="p-2.5">Coolant State</th>
                    <th className="p-2.5">Electrical State</th>
                    <th className="p-2.5">Node ID</th>
                    <th className="p-2.5">Torque</th>
                    <th className="p-2.5">Stress (MPa)</th>
                    <th className="p-2.5">Safety Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rows.map((row, idx) => {
                    const cols = row.split(',').map((c) => c.replace(/"/g, ''));
                    if (cols.length < 10) return null;
                    const [
                      timestamp,
                      loadCoeff,
                      coolantLiters,
                      circuitVoltage,
                      coolantState,
                      electricalState,
                      nodeId,
                      outputTorque,
                      shearStress,
                      safetyStatus,
                    ] = cols;

                    const isCritShear = safetyStatus === 'CRITICAL_SHEAR_FAILURE';
                    const isLowCoolant = coolantState === 'CRITICAL_LOW_FLOW';
                    const isVoltageSurge = electricalState === 'VOLTAGE_SURGE_WARNING';

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isCritShear ? 'bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="p-2.5 text-slate-400 whitespace-nowrap">{timestamp}</td>
                        <td className="p-2.5 text-blue-400 font-semibold">{loadCoeff}x</td>
                        <td
                          className={`p-2.5 font-bold ${
                            isLowCoolant ? 'text-rose-400 animate-pulse' : 'text-cyan-400'
                          }`}
                        >
                          {coolantLiters} L
                        </td>
                        <td
                          className={`p-2.5 font-bold ${
                            isVoltageSurge ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                          }`}
                        >
                          {circuitVoltage} V
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isLowCoolant
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            }`}
                          >
                            {coolantState}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isVoltageSurge
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {electricalState}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-white whitespace-nowrap">{nodeId}</td>
                        <td className="p-2.5 text-slate-200">{outputTorque} Nm</td>
                        <td
                          className={`p-2.5 font-semibold ${
                            parseFloat(shearStress) > 200 ? 'text-rose-400' : 'text-slate-300'
                          }`}
                        >
                          {shearStress}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                              isCritShear
                                ? 'bg-rose-950 text-rose-300 border border-rose-500'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {safetyStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: JSON Database Inspector */}
        {activeTab === 'JSON' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2 text-xs font-mono text-slate-400">
              <span>Structured JSON Database with Subsystems &amp; Telemetry ({dbSnapshots.length} Records)</span>
              <span className="text-cyan-400">Path: /simulation_db.json</span>
            </div>
            <pre className="flex-1 bg-[#06080D] border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-auto leading-relaxed select-text">
              {JSON.stringify(dbSnapshots, null, 4)}
            </pre>
          </div>
        )}

        {/* Tab 3: Shell Script Tool (clean_history.sh) */}
        {activeTab === 'SCRIPT' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Filter className="w-4 h-4" />
                <span>clean_history.sh — Automated History Log Filter Optimization Tool</span>
              </div>
              <button
                onClick={handleRunOptimizer}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute Optimization Now</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When validating systems continuously, dragging the slider writes near-identical logs. This automated utility parses{' '}
              <code className="text-cyan-400">simulation_db.json</code> and eliminates consecutive entries where{' '}
              <code className="text-white">active_layout_modifier</code>, <code className="text-cyan-400">coolant_level_liters</code>, and{' '}
              <code className="text-amber-400">circuit_line_voltage_v</code> remain identical.
            </p>
            <pre className="flex-1 bg-[#06080D] border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-auto leading-relaxed select-text">
              {CLEAN_SCRIPT_SAMPLE}
            </pre>
          </div>
        )}

        {/* Tab 4: Python Backend Service */}
        {activeTab === 'PYTHON' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Server className="w-4 h-4" />
                <span>nexus_simulation_app.py — Subsystem Simulation Daemon &amp; HTTP Server</span>
              </div>
              <span className="text-slate-400">Command: python3 nexus_simulation_app.py</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exposes <code className="text-cyan-400">/api/telemetry</code> and <code className="text-cyan-400">/api/layout_change</code>,
              calculating coolant level dissipation and circuit voltage load variance alongside gear physics.
            </p>
            <pre className="flex-1 bg-[#06080D] border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-auto leading-relaxed select-text">
              {PYTHON_CODE_SAMPLE}
            </pre>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Telemetry synchronized with Part 1 DataPersistenceManager schema</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer font-medium"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

const CLEAN_SCRIPT_SAMPLE = `#!/bin/bash
# =====================================================================
# NEXUS-GRID HISTORY LOG FILTER OPTIMIZATION TOOL
# =====================================================================

TARGET_LOG="simulation_db.json"
TEMP_OUTPUT="filtered_history_temp.json"

if [ ! -f "$TARGET_LOG" ]; then
    echo "[!] Error: Targeted configuration history source tracking log '$TARGET_LOG' not detected."
    exit 1
fi

echo "[*] Commencing layout tracking filter analysis on '$TARGET_LOG'..."

python3 -c "
import json

try:
    with open('$TARGET_LOG', 'r') as f:
        history = json.load(f)
except Exception:
    print('[!] Parse failure. File empty or format disrupted.'); exit(1)

if not history:
    print('[-] Trace log ledger tracking maps contain zero active records.'); exit(0)

optimized_trace = [history[0]]

for entry in history[1:]:
    prev = optimized_trace[-1]
    duplicate_match = (
        entry.get('active_layout_modifier') == prev.get('active_layout_modifier') and
        entry.get('subsystems', {}).get('coolant_level_liters') == prev.get('subsystems', {}).get('coolant_level_liters') and
        entry.get('subsystems', {}).get('circuit_line_voltage_v') == prev.get('subsystems', {}).get('circuit_line_voltage_v')
    )
    if not duplicate_match:
        optimized_trace.append(entry)

with open('$TEMP_OUTPUT', 'w') as out_f:
    json.dump(optimized_trace, out_f, indent=4)

initial_count = len(history)
final_count = len(optimized_trace)
print(f'[SUCCESS] Log filtration cycle complete. Cleaned {initial_count - final_count} redundant duplication snapshots.')
"

if [ -f "$TEMP_OUTPUT" ]; then
    mv "$TEMP_OUTPUT" "$TARGET_LOG"
    echo "[*] Clean database changes committed back to permanent file tracker."
fi
`;

const PYTHON_CODE_SAMPLE = `import json
import csv
import os
import math
import logging
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, HTTPServer
import threading

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] Nexus Core: %(message)s',
    datefmt='%H:%M:%S'
)

JSON_DB_FILE = "simulation_db.json"
CSV_AUDIT_FILE = "simulation_audit.csv"

# Advanced Subsystem Math: Coolant dissipation scale & load variance
current_coolant_level = max(0.0, 500.0 - (45.5 * (active_layout_modifier - 1.0)))
current_voltage = 415.0 + (35.2 * (active_layout_modifier - 1.0))

coolant_status = "CRITICAL_LOW_FLOW" if current_coolant_level < 420.0 else "OPTIMAL"
electrical_status = "VOLTAGE_SURGE_WARNING" if current_voltage > 450.0 else "STABLE"
`;
