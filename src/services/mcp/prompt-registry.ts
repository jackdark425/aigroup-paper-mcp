import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { Logger } from '../../core/logger.js';

/**
 * MCP提示词注册器
 * 负责注册所有MCP提示词
 */
export class PromptRegistry {
  private logger: Logger;

  constructor(private server: McpServer) {
    this.logger = new Logger('PromptRegistry');
  }

  /**
   * 注册所有提示词
   */
  registerAll(): void {
    this.registerLiteratureReviewPrompt();
    this.registerResearchGapPrompt();
    this.registerPaperComparisonPrompt();
    
    this.logger.info('已注册 3 个提示词');
  }

  /**
   * 注册文献综述提示词
   */
  private registerLiteratureReviewPrompt(): void {
    this.server.registerPrompt(
      'literature_review',
      {
        title: '文献综述助手',
        description: '为特定研究主题生成全面的文献综述',
        argsSchema: {
          topic: completable(z.string(), (value) => {
            const suggestions = [
              'machine learning', 'deep learning', 'artificial intelligence',
              'natural language processing', 'computer vision', 'reinforcement learning',
              'neural networks', 'transformer models', 'large language models',
              'quantum computing', 'bioinformatics', 'climate science'
            ];
            return Promise.resolve(suggestions.filter(s => s.startsWith(value.toLowerCase())));
          }),
          timeframe: completable(
            z.enum(['recent', 'past_year', 'past_5_years', 'all_time']),
            (value) => {
              const options = ['recent', 'past_year', 'past_5_years', 'all_time'] as const;
              return Promise.resolve(options.filter(t => t.startsWith(value)));
            }
          )
        }
      },
      ({ topic, timeframe }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请为研究主题"${topic}"生成一个全面的文献综述。请包括：
1. 该领域的关键发展和里程碑
2. 主要研究方向和子领域
3. 有影响力的论文和作者
4. 当前的研究趋势和挑战
5. 未来发展方向

时间范围：${timeframe}`
            }
          }
        ]
      })
    );
  }

  /**
   * 注册研究差距分析提示词
   */
  private registerResearchGapPrompt(): void {
    this.server.registerPrompt(
      'research_gap_analysis',
      {
        title: '研究差距分析',
        description: '分析特定研究领域中的研究差距和机会',
        argsSchema: {
          domain: completable(z.string(), (value) => {
            const domains = [
              'computer science', 'biology', 'physics', 'chemistry',
              'medicine', 'engineering', 'mathematics', 'economics'
            ];
            return Promise.resolve(domains.filter(d => d.startsWith(value.toLowerCase())));
          }),
          subtopic: z.string().describe('要分析的具体子主题或技术')
        }
      },
      ({ domain, subtopic }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请分析在${domain}领域中，关于"${subtopic}"的研究差距和机会。请识别：
1. 现有研究的局限性
2. 尚未充分探索的方向
3. 方法论上的改进机会
4. 跨学科合作的可能性
5. 实际应用中的挑战`
            }
          }
        ]
      })
    );
  }

  /**
   * 注册论文比较分析提示词
   */
  private registerPaperComparisonPrompt(): void {
    this.server.registerPrompt(
      'paper_comparison',
      {
        title: '论文比较分析',
        description: '比较和分析多篇相关论文',
        argsSchema: {
          paperIds: z.string().describe('要比较的论文ID列表（逗号分隔）'),
          aspect: completable(
            z.enum(['methodology', 'results', 'impact', 'novelty', 'comprehensive']),
            (value) => {
              const aspects = ['methodology', 'results', 'impact', 'novelty', 'comprehensive'] as const;
              return Promise.resolve(aspects.filter(a => a.startsWith(value)));
            }
          ).describe('比较的侧重点')
        }
      },
      ({ paperIds, aspect }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请比较以下论文（${paperIds}），侧重点：${aspect}。
请提供：
1. 各论文的核心贡献
2. 方法论的异同
3. 结果的对比
4. 优缺点分析
5. 应用场景的差异`
            }
          }
        ]
      })
    );
  }
}