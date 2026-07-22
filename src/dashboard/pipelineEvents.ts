import { EventEmitter } from 'events';

export type RunKind = 'hybrid' | 'trending';
export type StepStatus = 'running' | 'done' | 'error';
export type RunStatus = 'running' | 'success' | 'error';

export interface PipelineStep {
  phase: string;
  label: string;
  status: StepStatus;
  detail?: string;
  timestamp: string;
}

export interface PipelineRun {
  id: string;
  kind: RunKind;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  steps: PipelineStep[];
  summary?: string;
}

const MAX_HISTORY = 10;

/**
 * Tracks live pipeline execution state (current + recent runs) for the
 * dashboard's "pipeline en vivo" panel. Process-local only, mirrors the
 * numbered logger.info() steps already in pipeline.ts rather than
 * replacing them.
 */
class PipelineEvents extends EventEmitter {
  private history: PipelineRun[] = [];
  private current: PipelineRun | null = null;

  startRun(kind: RunKind): PipelineRun {
    const run: PipelineRun = {
      id: `run-${Date.now()}`,
      kind,
      status: 'running',
      startedAt: new Date().toISOString(),
      steps: [],
    };
    this.current = run;
    this.emit('run-start', run);
    return run;
  }

  emitStep(phase: string, label: string, status: StepStatus, detail?: string): void {
    if (!this.current) return;
    const step: PipelineStep = { phase, label, status, detail, timestamp: new Date().toISOString() };
    this.current.steps.push(step);
    this.emit('step', { runId: this.current.id, step });
  }

  endRun(status: RunStatus, summary?: string): void {
    if (!this.current) return;
    this.current.status = status;
    this.current.finishedAt = new Date().toISOString();
    this.current.summary = summary;
    this.history.unshift(this.current);
    this.history = this.history.slice(0, MAX_HISTORY);
    this.emit('run-end', this.current);
    this.current = null;
  }

  getCurrentRun(): PipelineRun | null {
    return this.current;
  }

  getLastRun(): PipelineRun | null {
    return this.current ?? this.history[0] ?? null;
  }

  getHistory(): PipelineRun[] {
    return this.history;
  }
}

export const pipelineEvents = new PipelineEvents();
export default pipelineEvents;
