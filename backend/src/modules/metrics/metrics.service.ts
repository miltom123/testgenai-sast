// ==============================================================================
// Servicio de Métricas e Indicadores de Calidad ISTQB y Economía de IA
// Lógica pura de cálculo sin dependencias de transporte.
// ==============================================================================

export interface TestCaseMetricInput {
  status?: string;
  evidenceStatus?: string;
  type?: string;
  source?: string;
  isObsolete?: boolean;
}

export interface AiGenerationMetricInput {
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number | null;
  responseTimeMs?: number;
  status?: string;
  requirementId?: string;
}

export interface RequirementMetricInput {
  id?: string;
  status?: string;
  testCases?: TestCaseMetricInput[];
  aiGenerations?: AiGenerationMetricInput[];
}

export interface ProjectMetricInput {
  id?: string;
  name?: string;
  requirements?: RequirementMetricInput[];
}

export type ProjectLike = ProjectMetricInput;

export function computeProjectMetrics(project: ProjectMetricInput) {
  const reqs = project.requirements || [];
  // Filtrar requisitos activos (no obsoletos/archivados)
  const activeRequirements = reqs.filter((r) => r.status !== 'OBSOLETE');
  const totalRequirements = activeRequirements.length;

  let coveredRequirements = 0;

  // Casos vigentes (no obsoletos)
  let totalCases = 0;
  let approvedCases = 0;
  let modifiedCases = 0;
  let rejectedCases = 0;
  let pendingCases = 0;
  let obsoleteCases = 0;

  // Distribución de evidencia en casos vigentes
  const evidenceDistribution = {
    derived: 0,
    suggested: 0,
    ambiguous: 0,
    conflict: 0,
    pending: 0,
  };

  // Distribución por tipo ISTQB en casos vigentes
  const typeDistribution: Record<string, number> = {
    positive: 0,
    negative: 0,
    alternative: 0,
    boundary: 0,
    validation: 0,
  };

  let totalGenerations = 0;
  let successfulGenerations = 0;
  let failedGenerations = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;
  let hasKnownCost = false;
  let totalLatencyMs = 0;
  const processedRequirementIds = new Set<string>();

  for (const req of activeRequirements) {
    let reqHasApprovedVigente = false;

    for (const tc of req.testCases || []) {
      if (tc.isObsolete) {
        obsoleteCases++;
        continue;
      }

      totalCases++;
      const tcStatus = tc.status || 'PENDING';
      if (tcStatus === 'APPROVED') {
        approvedCases++;
        reqHasApprovedVigente = true;
      } else if (tcStatus === 'MODIFIED') {
        modifiedCases++;
      } else if (tcStatus === 'REJECTED') {
        rejectedCases++;
      } else if (tcStatus === 'PENDING') {
        pendingCases++;
      }

      const evKey = (tc.evidenceStatus || 'derived') as keyof typeof evidenceDistribution;
      if (evidenceDistribution[evKey] !== undefined) {
        evidenceDistribution[evKey]++;
      } else {
        evidenceDistribution.pending++;
      }

      const tcType = (tc.type || 'positive').toLowerCase();
      if (typeDistribution[tcType] !== undefined) {
        typeDistribution[tcType]++;
      }
    }

    if (reqHasApprovedVigente) {
      coveredRequirements++;
    }

    for (const gen of req.aiGenerations || []) {
      totalGenerations++;
      const genStatus = gen.status || 'SUCCEEDED';
      if (genStatus === 'SUCCEEDED') {
        successfulGenerations++;
        if (gen.requirementId) {
          processedRequirementIds.add(gen.requirementId);
        }
        totalInputTokens += gen.inputTokens || 0;
        totalOutputTokens += gen.outputTokens || 0;
        if (gen.estimatedCost !== null && gen.estimatedCost !== undefined) {
          totalCostUsd += gen.estimatedCost;
          hasKnownCost = true;
        }
        totalLatencyMs += gen.responseTimeMs || 0;
      } else {
        failedGenerations++;
      }
    }
  }

  const coveragePercent =
    totalRequirements > 0 ? Math.round((coveredRequirements / totalRequirements) * 1000) / 10 : 0;

  const averageLatencyMs =
    successfulGenerations > 0 ? Math.round(totalLatencyMs / successfulGenerations) : 0;

  const distinctRequirementsProcessed = processedRequirementIds.size;
  const costPerProcessedRequirement =
    distinctRequirementsProcessed > 0 && hasKnownCost
      ? Math.round((totalCostUsd / distinctRequirementsProcessed) * 10000) / 10000
      : null;

  const approvalRate = totalCases > 0 ? Math.round((approvedCases / totalCases) * 1000) / 10 : 0;
  const rejectionRate = totalCases > 0 ? Math.round((rejectedCases / totalCases) * 1000) / 10 : 0;
  const modificationRate = totalCases > 0 ? Math.round((modifiedCases / totalCases) * 1000) / 10 : 0;

  const rates = {
    approvalRate,
    rejectionRate,
    modificationRate,
  };

  const aiEconomy = {
    totalGenerations,
    successfulGenerations,
    failedGenerations,
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    totalCostUsd: hasKnownCost ? Math.round(totalCostUsd * 10000) / 10000 : 0,
    averageLatencyMs,
    distinctRequirementsProcessed,
    costPerProcessedRequirement,
  };

  return {
    summary: {
      totalRequirements,
      coveredRequirements,
      coveragePercent,
      totalCases,
      approvedCases,
      modifiedCases,
      rejectedCases,
      pendingCases,
      obsoleteCases,
    },
    rates,
    istqbRates: rates,
    evidenceDistribution,
    typeDistribution,
    aiEconomy,
    aiEconomics: aiEconomy,
  };
}
