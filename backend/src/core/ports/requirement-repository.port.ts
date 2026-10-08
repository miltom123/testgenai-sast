// ==========================================================================
// Port: IRequirementRepository
// Application/Domain Interface for Requirement Persistence
// ==========================================================================

import { RequirementEntity } from '../domain/entities/requirement.entity';
import { PaginationOptions, PaginatedResult } from './test-case-repository.port';

export interface RequirementFilter {
  projectId: string;
  status?: string;
  search?: string;
}

export interface IRequirementRepository {
  findById(id: string): Promise<RequirementEntity | null>;
  findByProjectId(projectId: string, options?: PaginationOptions, statusFilter?: string): Promise<PaginatedResult<RequirementEntity>>;
  save(requirement: RequirementEntity): Promise<void>;
  createVersion(requirementId: string, authorId: string, summary: string): Promise<number>;
  delete(id: string): Promise<boolean>;
}
