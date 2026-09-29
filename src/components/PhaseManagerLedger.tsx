import React, { useState, useEffect, useRef } from 'react';
import {
  BlueprintPhase,
  DeploymentTask,
  TelemetryLogEntry,
  MicroGearAsset,
} from '../data/blueprintData';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Terminal,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Plus,
  FileText,
} from 'lucide-react';

interface PhaseManagerLedgerProps {
  phases: BlueprintPhase[];
  activePhaseId: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
  onSwitchPhase: (phaseId: 'p1' | 'p2' | 'p3' | 'p4' | 'p5') => void;
  onToggleTask: (phaseId: 'p1' | 'p2' | 'p3' | 'p4' | 'p5', taskId: string) => void;
  onAdvancePhase: () => void;
  logs: TelemetryLogEntry[];
  onAddLog: (entry: Omit<TelemetryLogEntry, 'id' | 'timestamp'>) => void;
  onRefreshPayload: () => void;
  onExportClick?: () => void;
}

export const PhaseManagerLedger: React.FC<PhaseManagerLedgerProps> = ({
  phases,
  activePhaseId,
  onSwitchPhase,
  onToggleTask,
  onAdvancePhase,
  logs,
  onAddLog,
  onRefreshPayload,
  onExportClick,
}) => {
  const activePhase = phases.find((p) => p.id === activePhaseId) || phases[0];
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<MicroGearAsset | null>(null);
  const [showJsonSchemaModal, setShowJsonSchemaModal] = useState<boolean>(false);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getTagClasses = (variant?: string) => {
    switch (variant) {
      case 'amber':
        return 'text-amber-400 bg-amber-950/30 px-2 py-1 rounded border border-amber-900/40';
      case 'emerald':
        return 'text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/40';
      case 'blue':
        return 'text-blue-400 bg-blue-950/30 px-2 py-1 rounded border border-blue-900/40';
      case 'cyan':
        return 'text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/40';
      default:
        return 'text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800';
    }
  };

  const completedTasks = activePhase.tasks.filter((t) => t.completed).length;
  const totalTasks = activePhase.tasks.length;
  const progressPct = Math.round((completedTasks / Math.max(1, totalTasks)) * 100);

  return (
    <section id="phase-workspace" className="py-16 lg:py-24 border-b border-slate-800/90 bg-[#07090E]">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Workspace Title & Operational Summary */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
              <span>NEXUS-GRID BLUEPRINT MANAGER</span>
              <span aria-hidden="true">·</span>
              <span>HYBRID AGILE-WATERFALL FRAMEWORK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Sequential 5-Phase Lifecycle &amp; Telemetry Ledger
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                onAdvancePhase();
                onAddLog({
                  level: 'CMD',
                  message: `User triggered automated milestone advance from UI controller.`,
                });
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Advance Milestone Gate</span>
            </button>
            {onExportClick && (
              <button
                onClick={onExportClick}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                title="Generate high-fidelity PDF summary of all 5 phases and hardware asset matrix"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Project Blueprint</span>
              </button>
            )}
            <button
              onClick={() => setShowJsonSchemaModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors cursor-pointer"
            >
              View JSON Schema
            </button>
          </div>
        </div>

        {/* Main Workspace Layout (Sidebar 5-Phases + Dynamic Content Area) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation (The 5 Phases) */}
          <aside className="lg:col-span-4 xl:col-span-3 border border-slate-800 bg-slate-900/30 rounded-2xl p-6 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Project Lifecycle
              </div>
              <nav className="space-y-2" id="phase-nav">
                {phases.map((phase) => {
                  const isActive = phase.id === activePhaseId;
                  const phaseDone = phase.tasks.filter((t) => t.completed).length;
                  const phaseTotal = phase.tasks.length;
                  return (
                    <button
                      key={phase.id}
                      id={`btn-${phase.id}`}
                      onClick={() => {
                        onSwitchPhase(phase.id);
                        onAddLog({
                          level: 'INFO',
                          message: `Switched viewport focus to ${phase.title.split(':')[0]}.`,
                        });
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition text-left cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <span className="font-mono text-xs font-bold opacity-80">
                          {phase.index}.
                        </span>
                        <span className="text-sm truncate">{phase.shortName}</span>
                      </div>
                      <span className="text-[11px] font-mono opacity-80 shrink-0 ml-2">
                        {phaseDone}/{phaseTotal}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Operational Core Markers */}
            <div className="border-t border-slate-800 pt-6 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Operational Pillars
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span>Scalability</span>
                <span className="text-blue-400 font-mono font-semibold">Tier IV Modular</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span>Reliability</span>
                <span className="text-emerald-400 font-mono font-semibold">99.995% 2N+1</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span>Target PUE</span>
                <span className="text-amber-400 font-mono font-semibold">1.15 Flow</span>
              </div>
            </div>
          </aside>

          {/* Main Dashboard View Container (Render Phase Details) */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-6" id="dashboard-content">
            <div id="content-area" className="space-y-6">
              {/* Phase Overview Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {activePhase.title}
                    </h2>
                    <p className="text-slate-400 mt-1 max-w-3xl text-sm leading-relaxed">
                      {activePhase.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-mono border ${activePhase.color} px-3 py-1 rounded-md bg-slate-950 font-semibold`}
                    >
                      {progressPct === 100 ? 'Complete' : activePhase.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-400 border-t border-slate-800/80">
                  <span className="text-slate-300">ACTIVE CONSTRAINTS:</span>
                  <span>{activePhase.constraints}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-blue-400">
                    GATEWAY READINESS: {progressPct}% ({completedTasks}/{totalTasks} Tasks)
                  </span>
                </div>
              </div>

              {/* Hardware & Micro-Gear Asset Tracking Ledger Matrix + Live Python Telemetry Logger Stream */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Column 1 & 2: Active Components Form Fields & Details */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>⚙️ Active Hardware &amp; Micro-Gear Specifications Matrix</span>
                      </span>
                      <span className="text-xs text-blue-400 font-mono lowercase">
                        JSON Schema Synced
                      </span>
                    </h3>

                    <div className="space-y-3">
                      {activePhase.microGear.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset)}
                          className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 gap-3 hover:border-blue-500/50 transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="text-xs font-mono text-slate-500 block">
                              ASSET-ID: {asset.assetId}
                            </span>
                            <span className="text-sm font-semibold text-slate-200">
                              {asset.name}
                            </span>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                              {asset.description}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0 md:justify-end">
                            {asset.tags.map((tag, idx) => (
                              <div
                                key={idx}
                                className={`text-xs font-mono whitespace-nowrap ${getTagClasses(
                                  tag.variant
                                )}`}
                              >
                                {tag.label ? `${tag.label}: ` : ''}
                                {tag.value}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Deployment Blueprint Tasks List */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider">
                        Active Deployment Blueprint Tasks
                      </h3>
                      <span className="text-xs font-mono text-slate-400">
                        {completedTasks} of {totalTasks} Verified
                      </span>
                    </div>

                    <ul className="space-y-3">
                      {activePhase.tasks.map((task) => (
                        <li
                          key={task.id}
                          onClick={() => {
                            onToggleTask(activePhase.id, task.id);
                            onAddLog({
                              level: task.completed ? 'INFO' : 'SUCCESS',
                              message: `Task ${task.code} (${task.title}) marked as ${
                                task.completed ? 'PENDING' : 'VERIFIED'
                              }.`,
                            });
                          }}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-colors cursor-pointer gap-3 ${
                            task.completed
                              ? 'bg-slate-950/50 border-emerald-900/40 text-slate-300'
                              : 'bg-slate-950/80 border-slate-800/80 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 font-bold ${
                                task.completed
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'border-slate-600 bg-slate-900 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                            <div>
                              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                <span className="text-blue-400 font-semibold">{task.code}</span>
                                <span>·</span>
                                <span>{task.assignedZone}</span>
                              </div>
                              <span
                                className={`text-sm font-medium mt-0.5 block ${
                                  task.completed ? 'line-through text-slate-400' : 'text-slate-100'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 shrink-0">
                            <span className="text-slate-300">{task.inputNode}</span> ➔{' '}
                            <span className="text-blue-400">{task.processNode}</span> ➔{' '}
                            <span className="text-emerald-400">{task.outputNode}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Phase Gateway Metric & Assigned Target System */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-2">
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                      <div className="text-xs font-mono text-slate-400">Phase Gateway Metric</div>
                      <div className="text-base font-bold text-white mt-1">
                        {activePhase.metric}
                      </div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                      <div className="text-xs font-mono text-slate-400">Assigned Target System</div>
                      <div className="text-base font-bold text-blue-400 mt-1">
                        {activePhase.targetSystem}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Live Python Telemetry Logger Stream */}
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                          <span>Python Telemetry Log Output</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">v2.4 RUNTIME</span>
                      </h3>

                      <div
                        ref={logsContainerRef}
                        className="bg-slate-950 rounded-xl p-3.5 font-mono text-[11px] text-slate-300 space-y-2 border border-slate-800 max-h-96 overflow-y-auto"
                      >
                        {logs.map((log) => {
                          let levelClass = 'text-blue-400';
                          if (log.level === 'WARN') levelClass = 'text-amber-400';
                          if (log.level === 'SUCCESS') levelClass = 'text-emerald-400';
                          if (log.level === 'INIT') levelClass = 'text-slate-500';
                          if (log.level === 'CMD') levelClass = 'text-cyan-400';

                          return (
                            <div key={log.id} className="leading-relaxed">
                              <span className="text-slate-500 mr-1.5">[{log.timestamp}]</span>
                              <span className={`${levelClass} font-semibold mr-1.5`}>
                                [{log.level}]
                              </span>
                              <span>{log.message}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Sync: Local CMD Terminal</span>
                      <button
                        onClick={onRefreshPayload}
                        className="text-blue-400 font-semibold cursor-pointer hover:underline flex items-center gap-1.5 bg-transparent border-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Payload</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* JSON Schema Synced Modal */}
      {showJsonSchemaModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowJsonSchemaModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Micro-Gear JSON Schema Sync</h3>
              <button
                onClick={() => setShowJsonSchemaModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                Close [ESC]
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-mono text-blue-300 overflow-x-auto max-h-72">
              {JSON.stringify(
                {
                  $schema: 'https://json-schema.org/draft/2020-12/schema',
                  title: 'NexusGridMicroGearAsset',
                  phase: activePhase.id,
                  activeAssets: activePhase.microGear,
                  telemetryStream: {
                    endpoint: 'http://localhost:5000/api/v1/telemetry/stream',
                    syncRateMs: 50,
                  },
                },
                null,
                2
              )}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setShowJsonSchemaModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
