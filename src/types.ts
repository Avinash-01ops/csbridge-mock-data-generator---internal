export type DbType = 'postgres' | 'oracle' | 'mssql';

export type ProviderType = 'default' | 'default_auto' | 'enhanced' | 'enhanced_auto';

export interface DbConfig {
  type: DbType;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface GenerationConfig {
  numberOfEvents: number;
  eventTypes: string[];
  providerType: ProviderType;
  dbConfig: DbConfig;
}

export interface GenerationResult {
  success: boolean;
  message: string;
  eventsCreated: number;
}

export interface ConnectionResult {
  success: boolean;
  message: string;
}

declare global {
  interface Window {
    dbApi: {
      testConnection: (dbConfig: DbConfig) => Promise<ConnectionResult>;
      generateData: (config: GenerationConfig) => Promise<GenerationResult>;
    };
  }
}

export { };
