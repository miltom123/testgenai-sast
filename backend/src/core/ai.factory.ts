// ==========================================================================
// AI Provider Registry & Factory - Open/Closed Principle
// Soporta exclusivamente adaptadores reales: Gemini y OpenAI.
// Sin fallbacks simulados ni generadores mock en el producto.
// ==========================================================================

import { IAIProvider } from './interfaces/ai-provider.interface';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { env } from '../config/env';

export type AIProviderFactoryFn = () => IAIProvider;

export class AIFactory {
  private static registry: Map<string, AIProviderFactoryFn> = new Map();
  private static instances: Map<string, IAIProvider> = new Map();

  static {
    this.registerProvider('gemini', () => new GeminiAdapter());
    this.registerProvider('openai', () => new OpenAIAdapter());
  }

  public static registerProvider(name: string, factoryFn: AIProviderFactoryFn): void {
    const key = name.trim().toLowerCase();
    this.registry.set(key, factoryFn);
    this.instances.delete(key);
  }

  public static getProvider(providerName?: string): IAIProvider {
    const selected = (providerName || env.AI_PROVIDER_DEFAULT || 'gemini').trim().toLowerCase();

    if (this.instances.has(selected)) {
      return this.instances.get(selected)!;
    }

    const factoryFn = this.registry.get(selected);
    if (!factoryFn) {
      throw new Error(
        `[AIFactory] Proveedor de IA '${selected}' no soportado. Los proveedores reales permitidos son: ${Array.from(
          this.registry.keys()
        ).join(', ')}.`
      );
    }

    const instance = factoryFn();
    this.instances.set(selected, instance);
    return instance;
  }

  public static hasProvider(name: string): boolean {
    return this.registry.has(name.trim().toLowerCase());
  }

  public static getAvailableProviders(): string[] {
    return Array.from(this.registry.keys());
  }
}
