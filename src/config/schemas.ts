import { z } from 'zod';

export const DriverConfigSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  timeout: z.number().positive().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  rateLimit: z.object({
    maxTokens: z.number().positive(),
    refillRate: z.number().positive()
  }).optional(),
  customHeaders: z.record(z.string()).optional()
});

export const CacheConfigSchema = z.object({
  enabled: z.boolean().default(true),
  ttl: z.number().positive().default(3600),
  maxSize: z.number().positive().default(100)
});

export const LoggingConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  format: z.enum(['json', 'simple']).default('simple'),
  destination: z.enum(['console', 'file', 'both']).default('console'),
  filePath: z.string().optional()
});

export const AppConfigSchema = z.object({
  server: z.object({
    name: z.string().default('aigroup-paper-mcp'),
    version: z.string().default('0.1.0'),
    environment: z.enum(['development', 'production', 'test']).default('development')
  }),
  drivers: z.record(DriverConfigSchema),
  cache: CacheConfigSchema,
  logging: LoggingConfigSchema
});