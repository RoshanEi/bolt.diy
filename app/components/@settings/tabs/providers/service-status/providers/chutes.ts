import { BaseProviderChecker } from '../base-provider';
import type { ProviderConfig, StatusCheckResult } from '../types';

export class ChutesStatusChecker extends BaseProviderChecker {
  async checkStatus(): Promise<StatusCheckResult> {
    try {
      // Check status page
      const statusResponse = await fetch(this.config.statusUrl);
      const statusOk = statusResponse.ok;

      return {
        status: statusOk ? 'operational' : 'degraded',
        message: statusOk ? 'Chutes status page is accessible' : 'Chutes status page is not responding normally',
        incidents: [],
      };
    } catch (error) {
      console.error('Error checking Chutes status:', error);
      return {
        status: 'down',
        message: 'Unable to connect to Chutes status page',
        incidents: ['Connection error'],
      };
    }
  }

  async checkApi(apiKey: string): Promise<StatusCheckResult> {
    const startTime = Date.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };

      const response = await fetch(`${this.config.apiUrl}`, {
        method: 'GET',
        headers,
      });

      const responseTime = Date.now() - startTime;
      const apiOk = response.ok;

      let result: StatusCheckResult = {
        status: apiOk ? 'operational' : 'degraded',
        message: apiOk 
          ? `API is operational (response time: ${responseTime}ms)` 
          : 'API is responding with errors',
        incidents: [],
      };

      return result;
    } catch (error) {
      console.error('Error checking Chutes API:', error);
      return {
        status: 'down',
        message: 'Unable to connect to Chutes API',
        incidents: ['Connection error'],
      };
    }
  }
} 