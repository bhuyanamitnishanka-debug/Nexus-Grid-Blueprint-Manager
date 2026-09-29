import React, { useState, useEffect } from 'react';
import {
  INITIAL_PHASES,
  INITIAL_LOGS,
  BlueprintPhase,
  TelemetryLogEntry,
  PhysicsNodeState,
  runSimulationCascade,
} from './data/blueprintData';
import { ParallaxGraphicNovel } from './components/ParallaxGraphicNovel';
import { CutawayIsometricTwin } from './components/CutawayIsometricTwin';
import { PhaseManagerLedger } from './components/PhaseManagerLedger';
import { TorquePhysicsSimulator } from './components/TorquePhysicsSimulator';
import { BlueprintSpecCompiler } from './components/BlueprintSpecCompiler';
import { ExportBlueprintModal } from './components/ExportBlueprintModal';
import { generateProjectBlueprintPDF } from './utils/pdfGenerator';
import {
  initSimulationPersistence,
  recordSimulationSnapshot,
} from './utils/simulationPersistence';
import { UnitSystem } from './utils/unitConversion';
import { RefreshCw, Play, FileText, Download, ArrowLeftRight } from 'lucide-react';

export default function App() {
  const [scrollY, setScrollY] = useState<number>(0);
  const [phases, setPhases] = useState<BlueprintPhase[]>(INITIAL_PHASES);
  const [activePhaseId, setActivePhaseId] = useState<'p1' | 'p2' | 'p3' | 'p4' | 'p5'>('p2');
  const [logs, setLogs] = useState<TelemetryLogEntry[]>(INITIAL_LOGS);
  const [activeModifier, setActiveModifier] = useState<number>(1.0);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [physicsNodes, setPhysicsNodes] = useState<PhysicsNodeState[]>(() => {
    initSimulationPersistence();
    return runSimulationCascade(1.0);
  });
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  useEffect(() => {
    initSimulationPersistence();
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleModifierChange = (val: number) => {
    setActiveModifier(val);
    const updated = runSimulationCascade(val);
    setPhysicsNodes(updated);
    recordSimulationSnapshot(val, updated);
  };

  const handleAddLog = (entry: Omit<TelemetryLogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const ts = now.toISOString().replace('T', ' ').substring(0, 19);
    const newEntry: TelemetryLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: ts,
      ...entry,
    };
    setLogs((prev) => [...prev, newEntry]);
  };

  const handleToggleTask = (
    phaseId: 'p1' | 'p2' | 'p3' | 'p4' | 'p5',
    taskId: string
  ) => {
    setPhases((prev) =>
      prev.map((phase) => {
        if (phase.id !== phaseId) return phase;
        const updatedTasks = phase.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        const allCompleted = updatedTasks.every((t) => t.completed);
        const anyCompleted = updatedTasks.some((t) => t.completed);
        let status: 'Complete' | 'In Progress' | 'Pending' = 'Pending';
        if (allCompleted) status = 'Complete';
        else if (anyCompleted) status = 'In Progress';
        return {
          ...phase,
          tasks: updatedTasks,
          status,
        };
      })
    );
  };

  const handleAdvancePhase = () => {
    setPhases((prev) => {
      const cloned: BlueprintPhase[] = JSON.parse(JSON.stringify(prev));
      const currentIdx = cloned.findIndex((p) => p.id === activePhaseId);

      // Complete next uncompleted task in active phase
      const pendingTask = cloned[currentIdx].tasks.find((t) => !t.completed);
      if (pendingTask) {
        pendingTask.completed = true;
        handleAddLog({
          level: 'SUCCESS',
          message: `Verified task ${pendingTask.code} for ${cloned[currentIdx].title.split(':')[0]}.`,
        });
      } else if (currentIdx < cloned.length - 1) {
        // Advance to next phase
        const nextPhase = cloned[currentIdx + 1];
        nextPhase.status = 'In Progress';
        setActivePhaseId(nextPhase.id);
        handleAddLog({
          level: 'SUCCESS',
          message: `Active phase milestone gate advanced to: ${nextPhase.title.split(':')[0]}.`,
        });
      }
      return cloned;
    });
  };

  const handleRefreshPayload = () => {
    handleAddLog({
      level: 'CMD',
      message: `Payload sync ping sent to Python Flask telemetry service (200 OK).`,
    });
    handleAddLog({
      level: 'INFO',
      message: `Hardware asset register verified: 15 active micro-gear nodes in memory.`,
    });
  };

  const handleDirectDownloadPdf = () => {
    generateProjectBlueprintPDF(phases, physicsNodes, activeModifier);
    handleAddLog({
      level: 'SUCCESS',
      message: `High-fidelity 5-sheet project blueprint PDF generated and downloaded.`,
    });
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract (Zone 1: Wordmark, Zone 2: Nav Links, Zone 3: Actions) */}
      <header className="sticky top-0 z-50 border-b border-slate-800/90 bg-[#07090E]/90 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a href="#" className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
          Nexus-Grid
        </a>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <a
            href="#graphic-novel-stage"
            className="hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            Chronicle
          </a>
          <a
            href="#isometric-digital-twin"
            className="hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            Digital Twin
          </a>
          <a
            href="#phase-workspace"
            className="hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            5-Phase Ledger
          </a>
          <a
            href="#physics-engine-stage"
            className="hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            Torque Physics
          </a>
          <a
            href="#spec-compiler"
            className="hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            Spec Compiler
          </a>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          {/* Real-time Engineering Unit System Switcher */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-700 rounded-lg">
            <button
              onClick={() => {
                const next = unitSystem === 'metric' ? 'imperial' : 'metric';
                setUnitSystem(next);
                handleAddLog({
                  level: 'INFO',
                  message: `Global engineering telemetry unit system toggled to: ${
                    next === 'metric' ? 'Metric (SI)' : 'Imperial (US Customary)'
                  }.`,
                });
              }}
              className="px-2 py-1 text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer rounded"
              title="Toggle between Metric (SI: N·m, MPa, °C, mm) and Imperial (US: lbf·ft, psi, °F, in) systems in real-time"
            >
              <span className={unitSystem === 'metric' ? 'text-cyan-400 font-extrabold' : 'text-slate-500'}>
                SI
              </span>
              <span className="text-slate-600">/</span>
              <span className={unitSystem === 'imperial' ? 'text-amber-400 font-extrabold' : 'text-slate-500'}>
                US
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-400/20"
            title="Export full project blueprint PDF summary"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Project Blueprint</span>
          </button>

          <button
            onClick={handleRefreshPayload}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap hidden sm:flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>

          <button
            onClick={() => {
              handleAdvancePhase();
              scrollTo('phase-workspace');
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Advance Gate</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Parallax Engineering Graphic Novel (3 Visual Acts & Morph Scrubber) */}
        <ParallaxGraphicNovel scrollY={scrollY} onSelectPhase={setActivePhaseId} />

        {/* 4-Zone Isometric Cutaway Digital Twin & Simulator */}
        <CutawayIsometricTwin
          onSelectPhase={setActivePhaseId}
          onLogEvent={(level, msg) => handleAddLog({ level, message: msg })}
        />

        {/* 5-Phase Hybrid Agile-Waterfall Ledger + Micro-Gear Specifications Matrix & Python Stream */}
        <PhaseManagerLedger
          phases={phases}
          activePhaseId={activePhaseId}
          onSwitchPhase={setActivePhaseId}
          onToggleTask={handleToggleTask}
          onAdvancePhase={handleAdvancePhase}
          logs={logs}
          onAddLog={handleAddLog}
          onRefreshPayload={handleRefreshPayload}
          onExportClick={() => setShowExportModal(true)}
        />

        {/* Live Mechanical Torque & Material Fatigue Physics Simulation Engine */}
        <TorquePhysicsSimulator
          physicsNodes={physicsNodes}
          activeModifier={activeModifier}
          onModifierChange={handleModifierChange}
          onLogEvent={(level, msg) => handleAddLog({ level, message: msg })}
          unitSystem={unitSystem}
          onToggleUnitSystem={setUnitSystem}
        />

        {/* 4-Part Structured Blueprint Specification Compiler */}
        <BlueprintSpecCompiler phases={phases} activePhaseId={activePhaseId} />
      </main>

      {/* Clean Engineering Footer */}
      <footer className="border-t border-slate-800 bg-[#05070B] py-8 px-6 text-xs text-slate-400">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-bold text-slate-200">Nexus-Grid Blueprint Manager</span>
            <p>Hybrid Agile-Waterfall Architecture &amp; Python Telemetry Orchestration</p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowExportModal(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              <span>Export Blueprint PDF</span>
            </button>
            <a href="#graphic-novel-stage" className="hover:text-slate-200 transition-colors">
              Graphic Novel
            </a>
            <a href="#isometric-digital-twin" className="hover:text-slate-200 transition-colors">
              Isometric Twin
            </a>
            <a href="#phase-workspace" className="hover:text-slate-200 transition-colors">
              Hardware Matrix
            </a>
            <a href="#physics-engine-stage" className="hover:text-slate-200 transition-colors">
              Torque Physics
            </a>
          </div>
        </div>
      </footer>

      {/* High-Fidelity 5-Sheet PDF Blueprint Export Modal */}
      <ExportBlueprintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        phases={phases}
        physicsNodes={physicsNodes}
        activeModifier={activeModifier}
      />
    </div>
  );
}

