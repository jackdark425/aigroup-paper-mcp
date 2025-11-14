import { IDriver } from '../../types/driver.js';
import { PlatformSource } from '../../types/paper.js';
import { Logger } from '../../core/logger.js';
import { platformHealthMonitor } from '../../core/platform-health.js';
import { searchStrategyManager } from '../../core/search-strategy.js';
import { SearchQuery } from '../../types/search.js';

const drivers = new Map<PlatformSource, IDriver>();
const logger = new Logger('DriverFactory');

export function registerDriver(driver: IDriver): void {
  drivers.set(driver.source, driver);
  logger.info(`Registered driver: ${driver.name}`);
}

export function getDriver(source: PlatformSource): IDriver | undefined {
  return drivers.get(source);
}

export function getAllDrivers(): IDriver[] {
  return Array.from(drivers.values());
}

export function getEnabledDrivers(): IDriver[] {
  return getAllDrivers();
}

/**
 * 智能选择驱动器
 * 基于搜索查询和平台健康状态选择最佳驱动器
 */
export function selectSmartDrivers(
  query: SearchQuery,
  requestedSources?: PlatformSource[]
): IDriver[] {
  // 如果指定了平台，使用指定的平台
  if (requestedSources && requestedSources.length > 0) {
    const selectedDrivers = requestedSources
      .map(source => getDriver(source))
      .filter((d): d is IDriver => d !== undefined);
    
    // 临时禁用健康检查，直接返回所有驱动器
    // TODO: 修复健康检查系统
    logger.warn('健康检查已临时禁用，返回所有请求的平台');
    return selectedDrivers;
  }

  // 如果没有指定平台，返回所有启用的驱动器
  const allDrivers = getEnabledDrivers();
  logger.warn('健康检查已临时禁用，返回所有可用平台');
  return allDrivers;

  // 使用搜索策略管理器智能选择平台
  const strategyResult = searchStrategyManager.selectPlatforms(query);
  
  const selectedDrivers = strategyResult.platforms
    .map(source => getDriver(source))
    .filter((d): d is IDriver => d !== undefined);

  logger.info('智能选择驱动器', {
    selected: strategyResult.platforms,
    confidence: strategyResult.confidence,
    fallbacks: strategyResult.fallbackPlatforms
  });

  return selectedDrivers;
}

/**
 * 获取健康的驱动器
 */
export function getHealthyDrivers(sources?: PlatformSource[]): IDriver[] {
  const allDrivers = sources 
    ? sources.map(s => getDriver(s)).filter((d): d is IDriver => d !== undefined)
    : getAllDrivers();

  return allDrivers.filter(driver => 
    platformHealthMonitor.isHealthy(driver.source)
  );
}

/**
 * 执行驱动器健康检查
 */
export async function checkDriversHealth(
  sources?: PlatformSource[]
): Promise<Map<PlatformSource, boolean>> {
  const driversToCheck = sources
    ? sources.map(s => getDriver(s)).filter((d): d is IDriver => d !== undefined)
    : getAllDrivers();

  const checks = driversToCheck.map(driver => ({
    source: driver.source,
    healthCheckFn: () => driver.healthCheck()
  }));

  const results = await platformHealthMonitor.checkMultiplePlatforms(checks);
  
  const healthMap = new Map<PlatformSource, boolean>();
  results.forEach(result => {
    healthMap.set(result.source, result.healthy);
  });

  return healthMap;
}

/**
 * 获取驱动器性能指标
 */
export function getDriverMetrics() {
  return platformHealthMonitor.getAllMetrics();
}

/**
 * 重置驱动器健康状态
 */
export function resetDriverHealth(source: PlatformSource): void {
  platformHealthMonitor.resetPlatformHealth(source);
}