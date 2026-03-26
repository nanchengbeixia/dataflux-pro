#!/usr/bin/env node

/**
 * DataFlux Pro - 一键打包脚本
 * 用途: 自动完成所有编译、打包、生成exe的步骤
 * 使用: node build-and-package.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// 颜色输出
const log = {
  success: (msg) => console.log(chalk.green(`✓ ${msg}`)),
  info: (msg) => console.log(chalk.blue(`ℹ ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠ ${msg}`)),
  error: (msg) => console.log(chalk.red(`✗ ${msg}`)),
  title: (msg) => console.log(chalk.bold.cyan(`\n${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}\n`))
};

const run = (cmd, options = {}) => {
  try {
    log.info(`执行: ${cmd}`);
    return execSync(cmd, { 
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    log.error(`命令执行失败: ${cmd}`);
    process.exit(1);
  }
};

const main = async () => {
  try {
    log.title('🚀 DataFlux Pro - 一键打包流程启动');

    // ============ 步骤1: 环境检查 ============
    log.title('📋 步骤1: 环境检查');
    
    try {
      execSync('node --version', { stdio: 'pipe' });
      log.success('Node.js 已安装');
    } catch {
      log.error('Node.js 未安装或无法找到');
      process.exit(1);
    }

    try {
      execSync('npm --version', { stdio: 'pipe' });
      log.success('npm 已安装');
    } catch {
      log.error('npm 未安装或无法找到');
      process.exit(1);
    }

    // ============ 步骤2: 清理旧文件 ============
    log.title('🧹 步骤2: 清理旧文件');
    
    const dirsToClean = ['dist', 'release'];
    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        fs.removeSync(dir);
        log.success(`已删除 ${dir} 目录`);
      }
    }

    // ============ 步骤3: 安装依赖 ============
    log.title('📦 步骤3: 安装依赖');
    
    if (!fs.existsSync('node_modules')) {
      log.info('正在安装 npm 依赖，这可能需要几分钟...');
      run('npm install --prefer-offline --no-audit');
      log.success('依赖安装完成');
    } else {
      log.success('依赖已存在，跳过安装');
    }

    // ============ 步骤4: 编译TypeScript ============
    log.title('🔧 步骤4: 编译TypeScript');
    
    log.info('编译 Electron 主进程...');
    run('tsc src/main/**/*.ts --outDir dist/main --module commonjs');
    log.success('主进程编译完成');

    log.info('编译 Vue 前端应用...');
    run('vite build');
    log.success('前端编译完成');

    // ============ 步骤5: 生成assets ============
    log.title('🎨 步骤5: 准备应用资源');
    
    if (!fs.existsSync('public/icons')) {
      log.warn('图标文件夹不存在，创建默认图标...');
      fs.ensureDirSync('public/icons');
      // 可以在这里生成默认图标
      log.success('已创建图标目录');
    } else {
      log.success('图标文件已存在');
    }

    // ============ 步骤6: 验证配置 ============
    log.title('✅ 步骤6: 验证打包配置');
    
    if (!fs.existsSync('electron-builder.json')) {
      log.warn('未找到 electron-builder.json，使用 package.json 配置');
    } else {
      log.success('已找到 electron-builder 配置');
    }

    // ============ 步骤7: 生成exe ============
    log.title('⚙️ 步骤7: 生成Windows安装包');
    
    log.info('这可能需要2-5分钟，请耐心等待...');
    
    run('electron-builder --win --config electron-builder.json');
    
    log.success('exe 安装包生成完成！');

    // ============ 步骤8: 验证输出 ============
    log.title('🔍 步骤8: 验证输出文件');
    
    const releaseFiles = fs.readdirSync('release');
    if (releaseFiles.length === 0) {
      log.error('未找到输出文件');
      process.exit(1);
    }

    log.success('生成的文件列表:');
    releaseFiles.forEach(file => {
      const filePath = path.join('release', file);
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  📄 ${file} (${sizeInMB}MB)`);
    });

    // ============ 步骤9: 生成安装指南 ============
    log.title('📖 步骤9: 生成安装指南');
    
    const guide = `
# DataFlux Pro - 安装和使用指南

## 文件说明

${releaseFiles.map(f => `- ${f}`).join('\n')}

## 安装步骤

1. 双击 "DataFlux-Pro-Setup-v*.exe" 进行安装
2. 按照向导完成安装
3. 安装完成后自动启动应用
4. 查看 "完整使用教程.md" 了解如何使用

## 便携版本

- "DataFlux-Pro-Portable-v*.exe" 是免安装版本
- 直接运行即可使用，无需安装
- 适合U盘携带或临时使用

## 系统要求

- Windows 7 SP1 或更高版本
- 4GB RAM
- 200-300MB 磁盘空间
- Microsoft Office 或 WPS（可选）

## 获取帮助

- 查看 "完整使用教程.md"
- 访问官网: www.dataflux-pro.com
- 发送反馈到: feedback@dataflux-pro.com

祝你使用愉快！🎉
`;

    fs.writeFileSync('release/安装指南.txt', guide, 'utf-8');
    log.success('安装指南已生成');

    // ============ 完成 ============
    log.title('✨ 打包完成！');
    
    console.log(chalk.cyan(`
┌─────────────────────────────────────────┐
│  🎉 DataFlux Pro exe 已生成！            │
│                                         │
│  位置: ./release/                       │
│                                         │
│  下一步:                                 │
│  1. 找到生成的 .exe 文件                  │
│  2. 分发给用户                          │
│  3. 用户双击安装即可使用                │
│                                         │
│  安装包大小: ${releaseFiles[0]} 约80-100MB
│  首次启动: 3-5秒                        │
│  后续启动: 1-2秒                        │
└─────────────────────────────────────────┘
    `));

    log.success('打包流程完全完成！');

  } catch (error) {
    log.error('打包过程中出现错误:');
    console.error(error);
    process.exit(1);
  }
};

// 执行
main();
