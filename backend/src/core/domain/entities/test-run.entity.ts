// ==========================================================================
// Domain Entity: TestRunEntity
// Encapsulates QA Execution Cycle Invariants
// ==========================================================================

export type ExecutionStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED' | 'PENDING';

export interface TestExecutionResultProps {
  id?: string;
  testRunId: string;
  testCaseId: string;
  code: string;
  title: string;
  status: ExecutionStatus;
  durationSeconds: number;
  executedAt?: Date | null;
  executedBy?: string | null;
  evidenceText?: string | null;
  defectNotes?: string | null;
  defectLogged: boolean;
}

export interface TestRunEntityProps {
  id: string;
  projectId: string;
  name: string;
  environment: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
  executions?: TestExecutionResultProps[];
}

export class TestRunEntity {
  public readonly id: string;
  public readonly projectId: string;
  private _name: string;
  private _environment: string;
  private _status: 'IN_PROGRESS' | 'COMPLETED';
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  private _executions: TestExecutionResultProps[];

  constructor(props: TestRunEntityProps) {
    if (!props.name || props.name.trim().length < 2) {
      throw new Error('El nombre del ciclo de ejecución debe tener al menos 2 caracteres.');
    }

    this.id = props.id;
    this.projectId = props.projectId;
    this._name = props.name.trim();
    this._environment = props.environment || 'QA Sandbox';
    this._status = props.status || 'IN_PROGRESS';
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this._executions = props.executions || [];
  }

  get name(): string {
    return this._name;
  }

  get environment(): string {
    return this._environment;
  }

  get status(): 'IN_PROGRESS' | 'COMPLETED' {
    return this._status;
  }

  get executions(): ReadonlyArray<TestExecutionResultProps> {
    return this._executions;
  }

  public complete(): void {
    this._status = 'COMPLETED';
  }

  public getMetrics() {
    const total = this._executions.length;
    const passed = this._executions.filter((e) => e.status === 'PASSED').length;
    const failed = this._executions.filter((e) => e.status === 'FAILED').length;
    const blocked = this._executions.filter((e) => e.status === 'BLOCKED').length;
    const skipped = this._executions.filter((e) => e.status === 'SKIPPED').length;
    const pending = this._executions.filter((e) => e.status === 'PENDING').length;
    const executed = total - pending;
    const passRate = executed > 0 ? parseFloat(((passed / executed) * 100).toFixed(2)) : 0;
    const totalDurationSeconds = this._executions.reduce((acc, e) => acc + (e.durationSeconds || 0), 0);
    const avgDurationSeconds = executed > 0 ? parseFloat((totalDurationSeconds / executed).toFixed(1)) : 0;

    return {
      runId: this.id,
      name: this._name,
      environment: this._environment,
      totalCases: total,
      executedCases: executed,
      passed,
      failed,
      blocked,
      skipped,
      pending,
      passRatePercent: passRate,
      defectsLogged: this._executions.filter((e) => e.defectLogged).length,
      totalDurationSeconds,
      avgDurationSeconds,
      isCompleted: pending === 0,
    };
  }
}
