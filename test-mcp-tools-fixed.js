/**
 * MCP工具修复验证脚本
 * 测试所有工具的返回值是否符合JSON Schema定义
 */

import { MCPServer } from './src/services/mcp-server.js';

const server = new MCPServer();

async function testTool(toolName, args) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试工具: ${toolName}`);
  console.log(`参数:`, JSON.stringify(args, null, 2));
  console.log('-'.repeat(60));
  
  try {
    const startTime = Date.now();
    
    // 模拟工具调用（这里需要访问内部handler）
    // 由于我们修改了handlers，我们可以直接导入测试
    let result;
    
    switch(toolName) {
      case 'list_categories':
        const { handleListCategories } = await import('./src/services/mcp/tools/handlers/list-categories.handler.js');
        result = await handleListCategories(args);
        break;
      case 'search_papers':
        const { handleSearchPapers } = await import('./src/services/mcp/tools/handlers/search-papers.handler.js');
        result = await handleSearchPapers(args);
        break;
      case 'fetch_latest':
        const { handleFetchLatest } = await import('./src/services/mcp/tools/handlers/fetch-latest.handler.js');
        result = await handleFetchLatest(args);
        break;
      case 'fetch_paper':
        const { handleFetchPaper } = await import('./src/services/mcp/tools/handlers/fetch-paper.handler.js');
        result = await handleFetchPaper(args);
        break;
      case 'advanced_search':
        const { handleAdvancedSearch } = await import('./src/services/mcp/tools/handlers/advanced-search.handler.js');
        result = await handleAdvancedSearch(args);
        break;
      case 'trend_analysis':
        const { handleTrendAnalysis } = await import('./src/services/mcp/tools/handlers/trend-analysis.handler.js');
        result = await handleTrendAnalysis(args);
        break;
      default:
        throw new Error(`未知工具: ${toolName}`);
    }
    
    const elapsed = Date.now() - startTime;
    
    if (result.isError) {
      console.log('❌ 工具调用失败');
      console.log('错误:', result.content[0].text);
      return { success: false, error: result.content[0].text };
    }
    
    console.log('✅ 工具调用成功');
    console.log(`⏱️  耗时: ${elapsed}ms`);
    
    // 验证structuredContent
    if (result.structuredContent) {
      console.log('\n📊 结构化输出验证:');
      const structured = result.structuredContent;
      
      // 通用验证
      const issues = validateStructuredContent(toolName, structured);
      
      if (issues.length === 0) {
        console.log('✅ 所有字段格式正确');
        console.log('结构化数据:', JSON.stringify(structured, null, 2));
      } else {
        console.log('❌ 发现格式问题:');
        issues.forEach(issue => console.log(`  - ${issue}`));
      }
      
      return { success: issues.length === 0, issues };
    } else {
      console.log('⚠️  缺少structuredContent');
      return { success: false, error: '缺少structuredContent' };
    }
    
  } catch (error) {
    console.log('❌ 测试失败');
    console.log('错误:', error.message);
    console.log(error.stack);
    return { success: false, error: error.message };
  }
}

function validateStructuredContent(toolName, data) {
  const issues = [];
  
  switch(toolName) {
    case 'list_categories':
      if (!Array.isArray(data.categories)) {
        issues.push('categories必须是数组');
      } else if (data.categories.length > 0) {
        data.categories.forEach((cat, idx) => {
          if (!cat.source) issues.push(`categories[${idx}].source 缺失`);
          if (!cat.category) issues.push(`categories[${idx}].category 缺失`);
        });
      }
      break;
      
    case 'search_papers':
      if (!Array.isArray(data.results)) {
        issues.push('results必须是数组');
      } else {
        data.results.forEach((paper, idx) => {
          validatePaper(paper, `results[${idx}]`, issues);
        });
      }
      if (typeof data.total !== 'number') {
        issues.push('total必须是数字');
      }
      if (!Array.isArray(data.sources)) {
        issues.push('sources必须是数组');
      }
      break;
      
    case 'fetch_latest':
      if (!Array.isArray(data.papers)) {
        issues.push('papers必须是数组');
      } else {
        data.papers.forEach((paper, idx) => {
          validatePaper(paper, `papers[${idx}]`, issues);
        });
      }
      if (typeof data.total !== 'number') {
        issues.push('total必须是数字');
      }
      if (typeof data.category !== 'string') {
        issues.push('category必须是字符串');
      }
      break;
      
    case 'fetch_paper':
      if (!data.paper) {
        issues.push('paper对象缺失');
      } else {
        validatePaper(data.paper, 'paper', issues);
      }
      break;
      
    case 'advanced_search':
      if (!Array.isArray(data.results)) {
        issues.push('results必须是数组');
      } else {
        data.results.forEach((paper, idx) => {
          if (!paper.id) issues.push(`results[${idx}].id 缺失`);
          if (!paper.title) issues.push(`results[${idx}].title 缺失`);
          if (!Array.isArray(paper.authors)) {
            issues.push(`results[${idx}].authors 必须是数组`);
          } else if (paper.authors.some(a => typeof a !== 'string')) {
            issues.push(`results[${idx}].authors 必须是字符串数组`);
          }
        });
      }
      if (typeof data.total !== 'number') {
        issues.push('total必须是数字');
      }
      break;
      
    case 'trend_analysis':
      if (!Array.isArray(data.trends)) {
        issues.push('trends必须是数组');
      } else {
        data.trends.forEach((trend, idx) => {
          if (!trend.period) issues.push(`trends[${idx}].period 缺失`);
          if (typeof trend.paperCount !== 'number') {
            issues.push(`trends[${idx}].paperCount 必须是数字`);
          }
          if (!Array.isArray(trend.topKeywords)) {
            issues.push(`trends[${idx}].topKeywords 必须是数组`);
          }
        });
      }
      if (typeof data.topic !== 'string') {
        issues.push('topic必须是字符串');
      }
      if (typeof data.totalPapers !== 'number') {
        issues.push('totalPapers必须是数字');
      }
      break;
  }
  
  return issues;
}

function validatePaper(paper, path, issues) {
  if (!paper.id) issues.push(`${path}.id 缺失`);
  if (!paper.title) issues.push(`${path}.title 缺失`);
  if (!paper.source) issues.push(`${path}.source 缺失`);
  
  // 最重要：验证authors格式
  if (!Array.isArray(paper.authors)) {
    issues.push(`${path}.authors 必须是数组`);
  } else {
    const hasObjectAuthor = paper.authors.some(a => typeof a === 'object');
    const hasStringAuthor = paper.authors.some(a => typeof a === 'string');
    
    if (hasObjectAuthor) {
      issues.push(`${path}.authors 包含对象，必须是字符串数组`);
    }
    if (paper.authors.length > 0 && !hasStringAuthor && !hasObjectAuthor) {
      issues.push(`${path}.authors 格式异常`);
    }
  }
}

async function runTests() {
  console.log('\n🧪 MCP工具修复验证测试');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // 测试1: list_categories
  results.push(await testTool('list_categories', { 
    source: 'arxiv' 
  }));
  
  // 测试2: search_papers
  results.push(await testTool('search_papers', {
    query: 'machine learning',
    sources: ['arxiv'],
    limit: 5
  }));
  
  // 测试3: fetch_latest
  results.push(await testTool('fetch_latest', {
    source: 'arxiv',
    category: 'cs.AI',
    limit: 3
  }));
  
  // 测试4: fetch_paper
  results.push(await testTool('fetch_paper', {
    id: '2301.00001',
    source: 'arxiv'
  }));
  
  // 测试5: advanced_search
  results.push(await testTool('advanced_search', {
    query: 'neural networks AND deep learning',
    sources: ['arxiv'],
    limit: 3
  }));
  
  // 测试6: trend_analysis
  results.push(await testTool('trend_analysis', {
    topic: 'transformer',
    sources: ['arxiv'],
    period: 'month',
    limit: 10
  }));
  
  // 汇总结果
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 测试结果汇总');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  
  console.log(`总计: ${results.length} 个测试`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！MCP工具已成功修复。');
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步检查。');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});