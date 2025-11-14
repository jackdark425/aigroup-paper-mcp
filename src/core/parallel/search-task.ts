/**
 * 搜索任务管理模块
 */

import { IDriver } from '../../types/driver.js';
import { PlatformSource } from '../../types/paper.js';
import { platformHealthMonitor } from '../platform-health.js';

/**
 * 搜索任务
 */
export interface SearchTask {
  source: PlatformSource;
  driver: IDriver;
  priority: number;
  estimate: {
    latency: number;
    reliability: number;
  };
}

/**
 * 搜索任务管理器
 */
export class SearchTaskManager {
  /**
   * 创建搜索任务并评估优先级
   */
  static createSearchTasks(drivers: IDriver[]): SearchTask[] {
    return drivers.map(driver => {
      const healthMetrics = platformHealthMonitor.getMetrics(driver.source);
      
      return {
        source: driver.source,
        driver,
        // 优先级 = 成功率 * 100 - 平均延迟（毫秒） / 10
        priority: healthMetrics.successRate * 100 - healthMetrics.averageLatency / 10,
        estimate: {
          latency: healthMetrics.averageLatency || 1000,
          reliability: healthMetrics.successRate
        }
      };
    }).sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * 计算最优并发数
   */
  static calculateOptimalConcurrency(tasks: SearchTask[], maxConcurrency: number): number {
    let concurrency = maxConcurrency;

    const healthyTasks = tasks.filter(task => task.estimate.reliability > 0.7);
    const unhealthyTasks = tasks.length - healthyTasks.length;

    if (unhealthyTasks > tasks.length * 0.3) {
      concurrency = Math.max(2, Math.floor(concurrency * 0.6));
    }

    const avgEstimatedLatency = tasks.reduce((sum, task) => 
      sum + task.estimate.latency, 0) / tasks.length;
    
    if (avgEstimatedLatency > 5000) {
      concurrency = Math.min(maxConcurrency, Math.ceil(concurrency * 1.5));
    }

    return Math.max(1, Math.min(concurrency, tasks.length));
  }
}