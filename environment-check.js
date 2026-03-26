#!/usr/bin/env node

/**
 * DataFlux Pro - 环境检测脚本
 * 在安装前检查系统环境和依赖
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('🔍 正在检查系统环境...\n');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

/**
 * 检查Windows版本
 */
function checkWindowsVersion() {
  try {
    const release = os.release();
    const version = parseFloat(release);

    // Windows 7 = 6.1, Windows 10 = 10.0
    if (version >= 6.1) {
      checks.passed.push({
        name: 'Windows版本',
        message: `✓ Windows ${release} (${getWindowsName(release)})`
      });
      return true;
    } else {
      checks.failed.push({
        name: 'Windows版本',
        message: `✗ 版本过旧: ${release}，需要 Windows 7 SP1 或更高版本`,
        solution: '请升级到更新的Windows版本'
      });
      return false;
    }
  } catch (error) {
    checks.warnings.push({
      name: 'Windows版本检查',
      message: '⚠ 无法检查版本，假设已支持'
    });
    return true;
  }
}

/**
 * 检查Node.js
 */
function checkNodeJs() {
  try {
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(version.substring(1).split('.')[0]);

    if (majorVersion >= 16) {
      checks.passed.push({
        name: 'Node.js',
        message: `✓ ${version}`
      });
      return true;
    } else {
      checks.failed.push({
        name: 'Node.js',
        message: `✗ 版本 ${version} 过旧`,
        solution: '请下载 Node.js 16.0.0 或更高版本: https://nodejs.org/'
      });
      return false;
    }
  } catch (error) {
    checks.failed.push({
      name: 'Node.js',
      message: '✗ 未安装或无法识别',
      solution: '请下载并安装 Node.js 16+: https://nodejs.org/'
    });
    return false;
  }
}

/**
 * 检查npm
 */
function checkNpm() {
  try {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    checks.passed.push({
      name: 'npm',
      message: `✓ ${version}`
    });
    return true;
  } catch (error) {
    checks.failed.push({
      name: 'npm',
      message: '✗ 未安装或无法识别',
      solution: 'npm 通常与 Node.js 一起安装'
    });
    return false;
  }
}

/**
 * 检查Git
 */
function checkGit() {
  try {
    const version = execSync('git --version', { encoding: 'utf8' }).trim();
    checks.passed.push({
      name: 'Git',
      message: `✓ ${version}`
    });
    return true;
  } catch (error) {
    checks.warnings.push({
      name: 'Git',
      message: '⚠ 未安装（可选）',
      solution: '仅在需要版本控制时安装: https://git-scm.com/'
    });
    return true; // 不是必需的
  }
}

/**
 * 检查Office/WPS
 */
function checkOffice() {
  const commonPaths = [
    'C:\\Program Files\\Microsoft Office',
    'C:\\Program Files (x86)\\Microsoft Office',
    'C:\\Program Files\\WPS Office',
    'C:\\Program Files (x86)\\WPS Office'
  ];

  const found = {
    excel: false,
    wps: false,
    paths: []
  };

  for (const basePath of commonPaths) {
    try {
      if (fs.existsSync(basePath)) {
        found.paths.push(basePath);
        if (basePath.includes('Microsoft')) found.excel = true;
        if (basePath.includes('WPS')) found.wps = true;
      }
    } catch (error) {
      // 忽略错误，继续检查
    }
  }

  if (found.excel || found.wps) {
    const installed = [];
    if (found.excel) installed.push('Microsoft Excel');
    if (found.wps) installed.push('WPS Spreadsheet');

    checks.passed.push({
      name: 'Office/WPS',
      message: `✓ 已安装: ${installed.join(', ')}`
    });
    return true;
  } else {
    checks.failed.push({
      name: 'Office/WPS',
      message: '✗ 未找到 Microsoft Office 或 WPS',
      solution: '请安装至少一个:\n  - Microsoft Office 2010+\n  - WPS Office'
    });
    return false;
  }
}

/**
 * 检查.NET Framework
 */
function checkDotNetFramework() {
  try {
    // Windows only - 简化检查
    // 在实际应用中应该检查注册表
    if (os.platform() !== 'win32') {
      checks.warnings.push({
        name: '.NET Framework',
        message: '⚠ 非Windows系统，跳过检查'
      });
      return true;
    }

    checks.passed.push({
      name: '.NET Framework',
      message: '✓ 已安装（假设）'
    });
    return true;
  } catch (error) {
    checks.warnings.push({
      name: '.NET Framework',
      message: '⚠ 检查失败，假设已安装'
    });
    return true;
  }
}

/**
 * 检查Python（可选）
 */
function checkPython() {
  try {
    const version = execSync('python --version', { encoding: 'utf8' }).trim();
    checks.passed.push({
      name: 'Python',
      message: `✓ ${version} (可选)`
    });
    return true;
  } catch (error) {
    checks.warnings.push({
      name: 'Python',
      message: '⚠ 未安装（可选，仅用于高级数据处理）',
      solution: '如需要可从以下地址安装: https://www.python.org/'
    });
    return true; // 可选
  }
}

/**
 * 检查磁盘空间
 */
function checkDiskSpace() {
  try {
    // 简化检查：假设有足够空间
    const requiredMB = 500;
    checks.passed.push({
      name: '磁盘空间',
      message: `✓ 至少需要 ${requiredMB}MB（假设足够）`
    });
    return true;
  } catch (error) {
    checks.warnings.push({
      name: '磁盘空间',
      message: '⚠ 无法检查（假设足够）'
    });
    return true;
  }
}

/**
 * 辅助方法：获取Windows名称
 */
function getWindowsName(release) {
  const versions = {
    '6.1': 'Windows 7',
    '6.2': 'Windows 8',
    '6.3': 'Windows 8.1',
    '10.0': 'Windows 10/11'
  };

  for (const [key, name] of Object.entries(versions)) {
    if (release.startsWith(key)) {
      return name;
    }
  }

  return '未知版本';
}

/**
 * 显示检查结果
 */
function showResults() {
  console.log('\n' + '='.repeat(60));
  console.log('✓ 通过检查');
  console.log('='.repeat(60));

  for (const check of checks.passed) {
    console.log(`${check.message}`);
  }

  if (checks.warnings.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('⚠ 警告');
    console.log('='.repeat(60));

    for (const check of checks.warnings) {
      console.log(`${check.message}`);
      if (check.solution) {
        console.log(`  → ${check.solution}`);
      }
    }
  }

  if (checks.failed.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('✗ 检查失败');
    console.log('='.repeat(60));

    for (const check of checks.failed) {
      console.log(`\n${check.message}`);
      if (check.solution) {
        console.log(`  → 解决方案: ${check.solution}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('错误: 系统环境不满足要求！');
    console.log('请先解决上述问题，然后重试。');
    console.log('='.repeat(60));

    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✓ 环境检查完成！环境满足要求。');
  console.log('='.repeat(60));
  console.log('\n接下来可以运行:');
  console.log('  npm install    # 安装依赖');
  console.log('  npm run dev    # 启动开发服务器');
  console.log('');
}

/**
 * 主函数
 */
async function main() {
  // 执行所有检查
  checkWindowsVersion();
  checkNodeJs();
  checkNpm();
  checkGit();
  checkOffice();
  checkDotNetFramework();
  checkPython();
  checkDiskSpace();

  // 显示结果
  showResults();
}

// 运行检查
main().catch(error => {
  console.error('检查过程中出错:', error);
  process.exit(1);
});
