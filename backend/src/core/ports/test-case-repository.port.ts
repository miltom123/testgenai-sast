// ==========================================================================
// Port: ITestCaseRepository
// Application/Domain Interface for Test Case Persistence
// ==========================================================================

import { TestCaseEntity } from '../domain/entities/test-case.entity';

export interface TestCaseFilter {
  requirementId?: string;
  projectId?: string;
  status?: string;
  search?: string;
}

export interface PaginationOptions {
  skip: number;
  take: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface ITestCaseRepository {
  findById(id: string): Promise<TestCaseEntity | null>;
  findByRequirementId(requirementId: string): Promise<TestCaseEntity[]>;
  findByProjectId(projectId: string, options?: PaginationOptions): Promise<PaginatedResult<TestCaseEntity>>;
  save(testCase: TestCaseEntity): Promise<void>;
  saveBatch(testCases: TestCaseEntity[]): Promise<void>;
  delete(id: string): Promise<boolean>;
}

