// ==========================================================================
// Port: ITestRunRepository
// Application/Domain Interface for Test Run & Execution Persistence
// ==========================================================================

import { TestRunEntity, TestExecutionResultProps } from '../domain/entities/test-run.entity';

export interface ITestRunRepository {
  findById(id: string): Promise<TestRunEntity | null>;
  findByProjectId(projectId: string): Promise<TestRunEntity[]>;
  create(run: TestRunEntity, initialCases: Array<{ testCaseId: string; code: string; title: string }>): Promise<TestRunEntity>;
  recordExecution(
    runId: string,
    caseId: string,
    status: string,
    durationSeconds: number,
    evidenceText?: string,
    executedBy?: string
  ): Promise<TestExecutionResultProps>;
  logDefect(runId: string, caseId: string, defectNotes: string): Promise<TestExecutionResultProps>;
}
