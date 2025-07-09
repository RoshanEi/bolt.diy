import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class ChutesProvider extends BaseProvider {
  name = 'Chutes';
  getApiKeyLink = 'https://chutes.ai';

  config = {
    apiTokenKey: 'CHUTES_API_KEY',
    baseUrlKey: 'CHUTES_API_BASE_URL',
    baseUrl: 'https://api.chutes.ai'
  };

  staticModels: ModelInfo[] = [
    // Add default models here if known
    { name: 'chutes-default', label: 'Chutes Default', provider: 'Chutes', maxTokenAllowed: 8000 }
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { apiKey, baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'CHUTES_API_BASE_URL',
      defaultApiTokenKey: 'CHUTES_API_KEY',
    });

    if (!apiKey) {
      throw `Missing Api Key configuration for ${this.name} provider`;
    }

    try {
      const response = await fetch(`${baseUrl || 'https://api.chutes.ai'}/v1/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const res = await response.json();
      const staticModelIds = this.staticModels.map((m) => m.name);

      const models = res.data?.filter((model: any) => !staticModelIds.includes(model.id)) || [];

      return models.map((m: any) => ({
        name: m.id,
        label: m.id,
        provider: this.name,
        maxTokenAllowed: m.context_window || 8000,
      }));
    } catch (error) {
      console.error('Error fetching Chutes models:', error);
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey, baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'CHUTES_API_BASE_URL',
      defaultApiTokenKey: 'CHUTES_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    // Support for dynamic chute base URLs
    let modelBaseUrl = baseUrl || 'https://api.chutes.ai';
    
    // Check if this is a chute-specific model that needs a custom URL
    if (model.includes('/')) {
      const [username, modelName] = model.split('/');
      modelBaseUrl = `https://${username}-${modelName}.chutes.ai`;
    }

    const openai = createOpenAI({
      baseURL: `${modelBaseUrl}/v1`,
      apiKey,
    });

    return openai(model);
  }
} 