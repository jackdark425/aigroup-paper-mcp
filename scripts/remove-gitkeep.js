#!/usr/bin/env node

/**
 * 删除项目中所有.gitkeep文件的脚本
 * 用法: node scripts/remove-gitkeep.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

/**
 * 递归查找并删除.gitkeep文件
 */
function removeGitkeepFiles(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (error) {
    console.error(`无法读取目录: ${dir}`, error.message);
    return;
  }

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 递归处理子目录
      removeGitkeepFiles(filePath);
    } else if (file === '.gitkeep') {
      // 删除.gitkeep文件
      try {
        fs.unlinkSync(filePath);
        console.log(`✅ 删除: ${path.relative(projectRoot, filePath)}`);
      } catch (error) {
        console.error(`❌ 删除失败: ${filePath}`, error.message);
      }
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始查找并删除.gitkeep文件...\n');
  
  const startTime = Date.now();
  removeGitkeepFiles(projectRoot);
  
  const endTime = Date.now();
  console.log(`\n✨ 完成! 耗时: ${(endTime - startTime) / 1000}秒`);
}

// 运行脚本
main();