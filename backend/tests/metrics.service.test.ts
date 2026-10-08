import { describe, it, expect } from 'vitest';
import { computeProjectMetrics, ProjectLike } from '../src/modules/metrics/metrics.service';

const tc = (status: string, extra: Partial<{ evidenceStatus: string; type: string; source: string }> = {}) => ({
  status,
  evidenceStatus: extra.evidenceStatus ?? 'derived',
  type: extra.type ?? 'positive',
  source: extra.source ?? 'AI_GENERATED',
});

describe('computeProjectMetrics', () => {
  it('devuelve ceros para un proyecto vacío', () => {
    const m = computeProjectMetrics({ requirements: [] } as ProjectLike);
    expect(m.summary.totalRequirements).toBe(0);
    expect(m.summary.coveragePercent).toBe(0);
    expect(m.aiEconomics.totalTokens).toBe(0);
  });

  it('calcula cobertura y tasas ISTQB correctamente', () => {
    const project: ProjectLike = {
      requirements: [
        { testCases: [tc('APPROVED'), tc('PENDING')], aiGenerations: [] },
        { testCases: [tc('REJECTED')], aiGenerations: [] },
      ],
    };
    const m = computeProjectMetrics(project);
    expect(m.summary.totalCases).toBe(3);
    expect(m.summary.approvedCases).toBe(1);
    expect(m.summary.coveredRequirements).toBe(1); // solo 1 de 2 requisitos tiene aprobado
    expect(m.summary.coveragePercent).toBe(50);
    expect(m.istqbRates.approvalRate).toBeCloseTo(33.3, 1);
  });

  it('agrega la economía de IA (tokens, costo, latencia)', () => {
    const project: ProjectLike = {
      requirements: [
        {
          testCases: [],
          aiGenerations: [
            { inputTokens: 100, outputTokens: 50, estimatedCost: 0.002, responseTimeMs: 800 },
            { inputTokens: 200, outputTokens: 100, estimatedCost: 0.004, responseTimeMs: 1200 },
          ],
        },
      ],
    };
    const m = computeProjectMetrics(project);
    expect(m.aiEconomics.totalGenerations).toBe(2);
    expect(m.aiEconomics.totalTokens).toBe(450);
    expect(m.aiEconomics.totalCostUsd).toBeCloseTo(0.006, 4);
    expect(m.aiEconomics.averageLatencyMs).toBe(1000);
  });
});
