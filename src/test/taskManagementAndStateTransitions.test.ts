import { describe, it, expect } from 'vitest';
import {
  INITIAL_PHASES,
  INITIAL_LOGS,
  BlueprintPhase,
  TelemetryLogEntry,
} from '../data/blueprintData';

describe('Task Management & Phase State Transitions', () => {
  it('toggles task completion and recalculates phase status', () => {
    // Clone initial phases
    let phases: BlueprintPhase[] = JSON.parse(JSON.stringify(INITIAL_PHASES));
    const targetPhaseId = 'p2';
    const phaseIndex = phases.findIndex((p) => p.id === targetPhaseId);
    expect(phaseIndex).toBeGreaterThanOrEqual(0);

    const taskToToggle = phases[phaseIndex].tasks[0];
    const initialCompleted = taskToToggle.completed;

    // Simulate handleToggleTask function from App.tsx
    const toggleTask = (pList: BlueprintPhase[], pId: string, tId: string): BlueprintPhase[] => {
      return pList.map((phase) => {
        if (phase.id !== pId) return phase;
        const updatedTasks = phase.tasks.map((task) =>
          task.id === tId ? { ...task, completed: !task.completed } : task
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
      });
    };

    // Toggle once
    phases = toggleTask(phases, targetPhaseId, taskToToggle.id);
    const updatedTask = phases[phaseIndex].tasks.find((t) => t.id === taskToToggle.id);
    expect(updatedTask?.completed).toBe(!initialCompleted);

    // If all tasks are completed, phase status should be 'Complete'
    phases[phaseIndex].tasks.forEach((t) => (t.completed = true));
    phases = toggleTask(phases, targetPhaseId, 'non-existent'); // force recalculate
    const allDonePhase = phases.find((p) => p.id === targetPhaseId);
    expect(allDonePhase?.status).toBe('Complete');

    // If all tasks are incomplete, phase status should be 'Pending'
    phases[phaseIndex].tasks.forEach((t) => (t.completed = false));
    phases = toggleTask(phases, targetPhaseId, 'non-existent');
    const noneDonePhase = phases.find((p) => p.id === targetPhaseId);
    expect(noneDonePhase?.status).toBe('Pending');
  });

  it('handles phase milestone advancement sequentially ("Advance Gate" logic)', () => {
    let phases: BlueprintPhase[] = JSON.parse(JSON.stringify(INITIAL_PHASES));
    let activePhaseId: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' = 'p2';

    // Simulate handleAdvancePhase from App.tsx
    const advancePhase = () => {
      const cloned: BlueprintPhase[] = JSON.parse(JSON.stringify(phases));
      const currentIdx = cloned.findIndex((p) => p.id === activePhaseId);

      const pendingTask = cloned[currentIdx].tasks.find((t) => !t.completed);
      if (pendingTask) {
        pendingTask.completed = true;
        phases = cloned;
        return { taskCompleted: pendingTask.code, advancedGate: false };
      } else if (currentIdx < cloned.length - 1) {
        const nextPhase = cloned[currentIdx + 1];
        nextPhase.status = 'In Progress';
        activePhaseId = nextPhase.id;
        phases = cloned;
        return { taskCompleted: null, advancedGate: true, nextPhaseId: nextPhase.id };
      }
      return { taskCompleted: null, advancedGate: false };
    };

    // Complete all tasks in Phase 2
    phases.find((p) => p.id === 'p2')!.tasks.forEach((t) => (t.completed = true));

    // Advancing gate should now advance to Phase 3 (p3)
    const result = advancePhase();
    expect(result.advancedGate).toBe(true);
    expect(activePhaseId).toBe('p3');
    expect(phases.find((p) => p.id === 'p3')?.status).toBe('In Progress');
  });

  it('adds telemetry log entries with formatted timestamp and level', () => {
    let logs: TelemetryLogEntry[] = [...INITIAL_LOGS];

    const addLog = (entry: Omit<TelemetryLogEntry, 'id' | 'timestamp'>) => {
      const now = new Date();
      const ts = now.toISOString().replace('T', ' ').substring(0, 19);
      const newEntry: TelemetryLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: ts,
        ...entry,
      };
      logs = [...logs, newEntry];
    };

    const initialCount = logs.length;
    addLog({
      level: 'WARN',
      message: 'Test warning log: micro-gear thermal threshold test.',
    });

    expect(logs.length).toBe(initialCount + 1);
    const lastLog = logs[logs.length - 1];
    expect(lastLog.level).toBe('WARN');
    expect(lastLog.message).toContain('thermal threshold test');
    expect(lastLog.id).toBeDefined();
    expect(lastLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
