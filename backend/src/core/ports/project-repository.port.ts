// ==========================================================================
// Port: IProjectRepository
// Application/Domain Interface for Project Persistence
// ==========================================================================

import { ProjectEntity } from '../domain/entities/project.entity';
import { PaginationOptions, PaginatedResult } from './test-case-repository.port';

export interface ProjectFilter {
  ownerId?: string;
  status?: string;
  search?: string;
}

export interface IProjectRepository {
  findById(id: string): Promise<ProjectEntity | null>;
  findByOwner(ownerId: string, options?: PaginationOptions): Promise<PaginatedResult<ProjectEntity>>;
  create(project: ProjectEntity): Promise<ProjectEntity>;
  update(id: string, data: Partial<ProjectEntity>): Promise<ProjectEntity>;
  archive(id: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
