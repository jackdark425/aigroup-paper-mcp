/**
 * 错误建议引擎 - 主入口
 * 提供错误分类、建议生成、解决方案提供等功能
 */

// 类型导出供外部使用
export type {
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  ErrorSuggestion,
  ErrorSolution,
  EnhancedErrorInfo,
  RetryConfig,
  FallbackConfig
} from '../types/error.js';

// 导入子模块
import { ErrorClassifier } from './error/error-classifier.js';
import { SuggestionGenerator } from './error/suggestion-generator.js';
import { SolutionProvider } from './error/solution-provider.js';
import { ErrorEnhancementEngine } from './error/error-enhancement-engine.js';
import { DEFAULT_RETRY_CONFIG, DEFAULT_FALLBACK_CONFIG } from './error/error-configs.js';

// 导出子模块类（保持向后兼容）
export { ErrorClassifier } from './error/error-classifier.js';
export { SuggestionGenerator } from './error/suggestion-generator.js';
export { SolutionProvider } from './error/solution-provider.js';
export { ErrorEnhancementEngine } from './error/error-enhancement-engine.js';

// 导出配置
export { DEFAULT_RETRY_CONFIG, DEFAULT_FALLBACK_CONFIG };

/**
 * 错误建议引擎 - 统一的API接口
 */
export const errorSuggestionEngine = {
  classify: ErrorClassifier.classify.bind(ErrorClassifier),
  enhance: ErrorEnhancementEngine.enhance.bind(ErrorEnhancementEngine),
  generateSuggestions: SuggestionGenerator.generate.bind(SuggestionGenerator),
  getSolutions: SolutionProvider.getSolutions.bind(SolutionProvider)
};