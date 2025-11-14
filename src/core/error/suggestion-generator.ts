/**
 * 建议生成器模块
 */

import { ErrorCategory, ErrorSuggestion } from '../../types/error.js';
import { PlatformSource } from '../../types/paper.js';
import { smartSuggestionEngine } from '../smart-suggestions.js';

/**
 * 建议生成器 - 为错误生成具体的操作建议
 */
export class SuggestionGenerator {
  /**
   * 生成错误建议
   */
  static generate(
    category: ErrorCategory,
    context?: {
      query?: string;
      platform?: string;
      parameters?: Record<string, any>;
    }
  ): ErrorSuggestion[] {
    const suggestions: ErrorSuggestion[] = [];

    switch (category) {
      case ErrorCategory.NETWORK_TIMEOUT:
      case ErrorCategory.NETWORK_CONNECTION:
        suggestions.push({
          type: 'manual_action',
          title: '检查网络连接',
          description: '请确认您的网络连接正常，并且可以访问外部网站',
          actions: [
            '检查您的互联网连接',
            '尝试访问其他网站确认网络正常',
            '如果使用代理或VPN，请检查其配置',
            '稍后重试此操作'
          ],
          confidence: 0.9,
          priority: 10
        });

        if (context?.platform) {
          suggestions.push({
            type: 'alternative_platform',
            title: '尝试其他平台',
            description: `${context.platform} 可能暂时不可用，建议尝试其他学术平台`,
            alternativePlatforms: this.getAlternativePlatforms(context.platform as PlatformSource),
            confidence: 0.8,
            priority: 8
          });
        }
        break;

      case ErrorCategory.API_RATE_LIMIT:
        suggestions.push({
          type: 'manual_action',
          title: '等待后重试',
          description: '已达到API请求限制，请稍后再试',
          actions: [
            '等待 1-5 分钟后重试',
            '减少搜索频率',
            '考虑分批处理查询'
          ],
          confidence: 1.0,
          priority: 10
        });

        if (context?.platform) {
          suggestions.push({
            type: 'alternative_platform',
            title: '使用备选平台',
            description: '在等待期间，可以使用其他平台继续搜索',
            alternativePlatforms: this.getAlternativePlatforms(context.platform as PlatformSource),
            confidence: 0.9,
            priority: 9
          });
        }
        break;

      case ErrorCategory.API_AUTH_FAILED:
        suggestions.push({
          type: 'configuration_fix',
          title: '检查API密钥',
          description: '认证失败，请检查API密钥配置',
          actions: [
            '检查 .env 文件中的API密钥是否正确',
            '确认API密钥未过期',
            '如需要，重新申请API密钥',
            '参考文档配置相关环境变量'
          ],
          confidence: 1.0,
          priority: 10
        });
        break;

      case ErrorCategory.RESOURCE_NOT_FOUND:
        if (context?.query) {
          const querySuggestions = smartSuggestionEngine.analyzeQuery(
            context.query,
            context.platform ? [context.platform as PlatformSource] : undefined
          );

          if (querySuggestions.queryCorrections.length > 0) {
            suggestions.push({
              type: 'alternative_query',
              title: '尝试修正后的查询',
              description: '未找到结果，建议尝试以下优化后的查询',
              alternativeQuery: querySuggestions.processedQuery,
              actions: querySuggestions.queryCorrections.map(c => 
                `${c.reason}: "${c.original}" → "${c.suggested}"`
              ),
              confidence: querySuggestions.confidence,
              priority: 9
            });
          }

          suggestions.push({
            type: 'alternative_query',
            title: '简化查询',
            description: '尝试使用更少、更通用的关键词',
            actions: [
              '移除过于具体的术语',
              '使用更通用的关键词',
              '尝试使用同义词',
              '扩大搜索范围'
            ],
            confidence: 0.7,
            priority: 7
          });
        }

        if (context?.platform) {
          suggestions.push({
            type: 'alternative_platform',
            title: '搜索其他平台',
            description: '该平台可能没有相关内容，建议尝试其他学术数据库',
            alternativePlatforms: this.getAlternativePlatforms(context.platform as PlatformSource),
            confidence: 0.8,
            priority: 8
          });
        }
        break;

      case ErrorCategory.DATA_PARSE_ERROR:
      case ErrorCategory.DATA_FORMAT_ERROR:
        suggestions.push({
          type: 'manual_action',
          title: '数据解析失败',
          description: '平台返回的数据格式异常',
          actions: [
            '稍后重试，可能是临时问题',
            '尝试使用不同的搜索参数',
            '如问题持续，请联系技术支持并提供错误详情'
          ],
          confidence: 0.8,
          priority: 7
        });

        if (context?.platform) {
          suggestions.push({
            type: 'alternative_platform',
            title: '切换到其他平台',
            description: '该平台可能正在维护或更新API',
            alternativePlatforms: this.getAlternativePlatforms(context.platform as PlatformSource),
            confidence: 0.7,
            priority: 6
          });
        }
        break;

      case ErrorCategory.CONFIG_INVALID_PARAM:
      case ErrorCategory.VALIDATION_FAILED:
        if (context?.parameters) {
          suggestions.push({
            type: 'parameter_adjustment',
            title: '调整搜索参数',
            description: '某些参数可能不符合要求',
            actions: [
              '检查所有必需参数是否已提供',
              '确认参数值在有效范围内',
              '参考文档了解参数要求'
            ],
            parameterAdjustments: this.suggestParameterAdjustments(context.parameters),
            confidence: 0.8,
            priority: 9
          });
        }
        break;

      default:
        suggestions.push({
          type: 'manual_action',
          title: '重试操作',
          description: '发生了未预期的错误',
          actions: [
            '稍后重试此操作',
            '检查输入参数是否正确',
            '如问题持续，请查看日志获取详细信息'
          ],
          confidence: 0.5,
          priority: 5
        });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取替代平台
   */
  private static getAlternativePlatforms(currentPlatform: PlatformSource): string[] {
    const platformGroups: Record<string, PlatformSource[]> = {
      preprint: [PlatformSource.ARXIV, PlatformSource.BIORXIV, PlatformSource.MEDRXIV],
      biomedical: [PlatformSource.PUBMED, PlatformSource.PMC, PlatformSource.EUROPEPMC, PlatformSource.BIORXIV, PlatformSource.MEDRXIV],
      general: [PlatformSource.OPENALEX, PlatformSource.SEMANTIC_SCHOLAR, PlatformSource.CROSSREF, PlatformSource.CORE],
      cryptography: [PlatformSource.IACR]
    };

    for (const [, platforms] of Object.entries(platformGroups)) {
      if (platforms.includes(currentPlatform)) {
        return platforms.filter(p => p !== currentPlatform);
      }
    }

    return platformGroups.general.filter(p => p !== currentPlatform);
  }

  /**
   * 建议参数调整
   */
  private static suggestParameterAdjustments(parameters: Record<string, any>): Record<string, any> {
    const adjustments: Record<string, any> = {};

    if (parameters.limit && parameters.limit > 100) {
      adjustments.limit = 50;
    }

    if (parameters.offset && parameters.offset > 1000) {
      adjustments.offset = 0;
      adjustments.limit = 100;
    }

    return adjustments;
  }
}