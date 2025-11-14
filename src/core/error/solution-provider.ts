/**
 * 解决方案提供器模块
 */

import { ErrorCategory, ErrorSolution } from '../../types/error.js';

/**
 * 解决方案提供器 - 为不同错误类型提供详细的解决方案
 */
export class SolutionProvider {
  /**
   * 获取错误解决方案
   */
  static getSolutions(category: ErrorCategory): ErrorSolution[] {
    const solutions: ErrorSolution[] = [];

    switch (category) {
      case ErrorCategory.NETWORK_TIMEOUT:
      case ErrorCategory.NETWORK_CONNECTION:
        solutions.push({
          title: '网络连接问题排查',
          description: '检查并修复网络连接问题',
          steps: [
            '确认计算机已连接到互联网',
            '尝试打开其他网站验证网络连接',
            '检查防火墙设置是否阻止了连接',
            '如使用代理，确认代理配置正确',
            '尝试禁用VPN后重试',
            '联系网络管理员检查网络限制'
          ],
          estimatedTime: 5,
          requiresSupport: false
        });
        break;

      case ErrorCategory.API_RATE_LIMIT:
        solutions.push({
          title: 'API限流处理',
          description: '等待并调整请求频率',
          steps: [
            '等待 1-5 分钟后重试',
            '在代码中添加请求间隔（建议至少1秒）',
            '考虑使用批量操作减少请求次数',
            '如需大量请求，联系平台申请更高额度',
            '使用多个平台分散请求'
          ],
          estimatedTime: 5,
          requiresSupport: false
        });
        break;

      case ErrorCategory.API_AUTH_FAILED:
        solutions.push({
          title: 'API认证配置',
          description: '配置或更新API密钥',
          steps: [
            '检查 .env 文件是否存在',
            '确认相关平台的API密钥已正确配置',
            '验证API密钥格式（无多余空格或换行）',
            '前往平台网站确认密钥有效性',
            '如密钥过期，申请新的API密钥',
            '重启应用使配置生效'
          ],
          documentationUrl: 'README.md',
          estimatedTime: 10,
          requiresSupport: false
        });
        break;

      case ErrorCategory.API_QUOTA_EXCEEDED:
        solutions.push({
          title: 'API配额管理',
          description: '处理API配额超限问题',
          steps: [
            '查看平台配额使用情况',
            '等待配额重置（通常为每日或每月）',
            '申请提高API配额限制',
            '使用其他平台作为备选',
            '优化查询策略减少API调用',
            '考虑升级到付费计划'
          ],
          estimatedTime: 30,
          requiresSupport: true
        });
        break;

      case ErrorCategory.DATA_PARSE_ERROR:
      case ErrorCategory.DATA_FORMAT_ERROR:
        solutions.push({
          title: '数据格式问题',
          description: '处理数据解析错误',
          steps: [
            '等待几分钟后重试（可能是临时问题）',
            '尝试使用不同的搜索参数',
            '检查平台是否正在维护',
            '使用其他平台获取数据',
            '如问题持续，提交错误报告'
          ],
          estimatedTime: 10,
          requiresSupport: true
        });
        break;

      case ErrorCategory.CONFIG_INVALID_PARAM:
      case ErrorCategory.VALIDATION_FAILED:
        solutions.push({
          title: '参数验证',
          description: '修正无效的参数',
          steps: [
            '检查错误信息中指出的具体参数',
            '参考文档了解参数的有效值范围',
            '确保所有必需参数都已提供',
            '检查参数类型是否正确（字符串、数字等）',
            '移除不支持的可选参数',
            '使用示例配置作为参考'
          ],
          documentationUrl: 'README.md',
          estimatedTime: 5,
          requiresSupport: false
        });
        break;

      case ErrorCategory.RESOURCE_NOT_FOUND:
        solutions.push({
          title: '优化搜索策略',
          description: '调整搜索以找到相关结果',
          steps: [
            '使用更通用的关键词',
            '移除过于具体的限定词',
            '尝试使用同义词或相关术语',
            '扩大搜索的时间范围',
            '在不同平台上搜索',
            '检查拼写是否正确'
          ],
          estimatedTime: 5,
          requiresSupport: false
        });
        break;

      default:
        solutions.push({
          title: '通用故障排除',
          description: '基本的问题诊断步骤',
          steps: [
            '查看详细的错误日志',
            '确认输入参数正确',
            '稍后重试操作',
            '检查是否有系统更新',
            '查阅相关文档',
            '如问题持续，联系技术支持'
          ],
          estimatedTime: 15,
          requiresSupport: true
        });
    }

    return solutions;
  }
}