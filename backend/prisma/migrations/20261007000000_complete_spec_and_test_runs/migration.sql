-- Migración aditiva para alinear PostgreSQL con los doce modelos actuales.
-- No elimina tablas, columnas ni registros existentes.

ALTER TABLE "projects" ALTER COLUMN "budget_usd" SET DEFAULT 10.0;

ALTER TABLE "projects" ADD COLUMN "next_use_case_number" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "spec_generations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT,
    "engine_version" TEXT NOT NULL,
    "depth" TEXT NOT NULL DEFAULT 'standard',
    "input_name" TEXT NOT NULL,
    "input_description" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "actors_detected" JSONB NOT NULL DEFAULT '[]',
    "modules_detected" JSONB NOT NULL DEFAULT '[]',
    "entities_detected" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "use_cases_created" INTEGER NOT NULL DEFAULT 0,
    "requirements_created" INTEGER NOT NULL DEFAULT 0,
    "test_cases_created" INTEGER NOT NULL DEFAULT 0,
    "use_cases_skipped" INTEGER NOT NULL DEFAULT 0,
    "requirements_skipped" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spec_generations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "use_cases" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "generation_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "preconditions" JSONB NOT NULL DEFAULT '[]',
    "main_flow" JSONB NOT NULL DEFAULT '[]',
    "alternative_flows" JSONB NOT NULL DEFAULT '[]',
    "exception_flows" JSONB NOT NULL DEFAULT '[]',
    "postconditions" JSONB NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'AUTO_SPEC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "use_cases_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "requirements" ADD COLUMN "use_case_id" TEXT;

ALTER TABLE "requirements" ALTER COLUMN "status" SET DEFAULT 'READY';

ALTER TABLE "requirements" ADD COLUMN "derivation_hints" JSONB;

ALTER TABLE "test_cases" ADD COLUMN "technique" TEXT;

ALTER TABLE "test_cases" ALTER COLUMN "source" SET DEFAULT 'MANUAL';

CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'QA Sandbox',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "test_execution_results" (
    "id" TEXT NOT NULL,
    "test_run_id" TEXT NOT NULL,
    "test_case_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "executed_at" TIMESTAMP(3),
    "executed_by" TEXT,
    "evidence_text" TEXT,
    "defect_notes" TEXT,
    "defect_logged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_execution_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "spec_generations_project_id_idx" ON "spec_generations"("project_id");

CREATE INDEX "spec_generations_user_id_idx" ON "spec_generations"("user_id");

CREATE INDEX "use_cases_project_id_idx" ON "use_cases"("project_id");

CREATE INDEX "use_cases_generation_id_idx" ON "use_cases"("generation_id");

CREATE UNIQUE INDEX "use_cases_project_id_code_key" ON "use_cases"("project_id", "code");

CREATE INDEX "requirements_use_case_id_idx" ON "requirements"("use_case_id");

CREATE INDEX "test_cases_source_idx" ON "test_cases"("source");

CREATE INDEX "test_runs_project_id_idx" ON "test_runs"("project_id");

CREATE INDEX "test_runs_status_idx" ON "test_runs"("status");

CREATE INDEX "test_execution_results_test_run_id_idx" ON "test_execution_results"("test_run_id");

CREATE INDEX "test_execution_results_test_case_id_idx" ON "test_execution_results"("test_case_id");

CREATE INDEX "test_execution_results_status_idx" ON "test_execution_results"("status");

ALTER TABLE "spec_generations" ADD CONSTRAINT "spec_generations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spec_generations" ADD CONSTRAINT "spec_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "spec_generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "requirements" ADD CONSTRAINT "requirements_use_case_id_fkey" FOREIGN KEY ("use_case_id") REFERENCES "use_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "test_execution_results" ADD CONSTRAINT "test_execution_results_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "test_execution_results" ADD CONSTRAINT "test_execution_results_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
