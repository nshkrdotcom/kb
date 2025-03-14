// frontend/src/services/health-check-service.ts
import apiClient from './api/api-client';
import { toast } from 'react-toastify';

interface HealthCheckResponse {
  status: string;
  api: string;
  database: string;
  services: Record<string, string>;
}

export class HealthCheckService {
  private isCheckingHealth = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  // Check backend health
  public async checkHealth(): Promise<boolean> {
    if (this.isCheckingHealth) return true;
    
    this.isCheckingHealth = true;
    
    try {
      const response = await apiClient.get<HealthCheckResponse>('/health');
      
      // All systems operational
      if (response.status === 'ok') {
        this.isCheckingHealth = false;
        return true;
      }
      
      // Check for specific subsystem failures
      if (response.database !== 'ok') {
        console.error('Database health check failed');
        toast.error('Database connection issue. Some features may be unavailable.');
      }
      
      // Check for failing services
      const failingServices = Object.entries(response.services)
        .filter(([_, status]) => status !== 'ok')
        .map(([name, _]) => name);
      
      if (failingServices.length > 0) {
        console.error('Service health check failed:', failingServices);
        toast.warning(`Some services are experiencing issues: ${failingServices.join(', ')}`);
      }
      
      this.isCheckingHealth = false;
      return response.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Unable to connect to the server. Please check your connection.');
      
      this.isCheckingHealth = false;
      return false;
    }
  }
  
  // Start periodic health checks
  public startPeriodicHealthChecks(intervalMs: number = 60000): void {
    // Stop any existing interval
    this.stopPeriodicHealthChecks();
    
    // Start new interval
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);
  }
  
  // Stop periodic health checks
  public stopPeriodicHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const healthCheckService = new HealthCheckService();