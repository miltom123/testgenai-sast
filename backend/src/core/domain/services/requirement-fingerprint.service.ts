// ==========================================================================
// Domain Service: RequirementFingerprintService
// Deterministic Cryptographic Fingerprint for AI Prompt Caching & Deduplication
// ==========================================================================

import { createHash } from 'crypto';

export interface FingerprintInputs {
  code: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  provider: string;
  model: string;
}

export interface IFingerprintStrategy {
  compute(inputs: FingerprintInputs): string;
}

export class Sha256FingerprintStrategy implements IFingerprintStrategy {
  public compute(inputs: FingerprintInputs): string {
    const raw = [
      inputs.code.trim().toUpperCase(),
      inputs.title.trim(),
      inputs.description.trim(),
      inputs.acceptanceCriteria.trim(),
      inputs.provider.trim().toLowerCase(),
      inputs.model.trim().toLowerCase(),
    ].join('::');

    return createHash('sha256').update(raw, 'utf-8').digest('hex');
  }
}

export class RequirementFingerprintService {
  private static defaultStrategy: IFingerprintStrategy = new Sha256FingerprintStrategy();

  public static setStrategy(strategy: IFingerprintStrategy): void {
    this.defaultStrategy = strategy;
  }

  public static compute(inputs: FingerprintInputs): string {
    return this.defaultStrategy.compute(inputs);
  }
}
