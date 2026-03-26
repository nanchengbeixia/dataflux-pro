# 🚀 GitHub自动打包exe指南 - 5分钟获得安装包

> 使用GitHub Actions自动编译和打包，你只需要上传代码！

---

## 📋 目录

1. [准备工作](#准备工作)
2. [创建GitHub仓库](#创建github仓库)
3. [上传你的代码](#上传你的代码)
4. [启用自动打包](#启用自动打包)
5. [下载exe文件](#下载exe文件)
6. [常见问题](#常见问题)

---

## 准备工作

### 你需要的东西：
- ✅ GitHub账号（免费，3分钟注册）
- ✅ 我提供的22个代码文件
- ✅ 5分钟时间

### 注册GitHub（如果还没有账号）
```
访问: https://github.com/signup
输入：邮箱、密码、用户名
验证：邮箱验证
完成！
```

---

## 创建GitHub仓库

### 步骤1：新建仓库
```
1. 登录 GitHub.com
2. 点击右上角 "+" → "New repository"
3. 仓库名称: dataflux-pro
4. 描述: DataFlux Pro - 智能文件和表格处理系统
5. 选择: Public（公开）或 Private（私密，推荐）
6. 勾选: "Add a README file"
7. 点击: "Create repository"
```

### 步骤2：创建文件夹结构
```
你的仓库现在应该有这个结构：

dataflux-pro/
├── .github/
│   └── workflows/
│       └── build.yml          ← 自动打包脚本
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── preload.ts
│   │   └── ipc-handlers/
│   │       ├── excel.ts
│   │       ├── files.ts
│   │       ├── search.ts
│   │       └── system.ts
│   └── renderer/
│       ├── App.vue
│       └── FloatingWindow.vue
├── package.json
├── electron-builder.js
├── environment-check.js
├── README.md
└── (其他所有文件)
```

---

## 上传你的代码

### 方法1：Web界面上传（最简单）✅ 推荐

```
1. 进入你的GitHub仓库
2. 点击 "Add file" → "Upload files"
3. 把所有22个文件拖进去
4. 或点击选择文件
5. 完成后点击 "Commit changes"
```

### 方法2：命令行上传（如果你有Git）

```bash
# 1. 克隆仓库到本地
git clone https://github.com/你的用户名/dataflux-pro.git
cd dataflux-pro

# 2. 创建必要的目录结构
mkdir -p .github/workflows src/main/ipc-handlers src/renderer

# 3. 复制所有文件到正确的位置
# (根据上面的文件夹结构放置)

# 4. 上传到GitHub
git add .
git commit -m "Initial commit: Add DataFlux Pro source code"
git push -u origin main
```

---

## 启用自动打包

### 步骤1：添加GitHub Actions工作流文件

```
1. 在你的仓库中
2. 点击 "Add file" → "Create new file"
3. 文件路径: .github/workflows/build.yml
4. 将以下内容粘贴进去（见下面的配置文件内容）
5. 点击 "Commit new file"
```

### 步骤2：GitHub Actions配置文件内容

将以下内容复制到 `.github/workflows/build.yml`：

```yaml
name: Build and Package DataFlux Pro

on:
  push:
    branches:
      - main
      - master
  release:
    types: [created]
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest
    strategy:
      matrix:
        node-version: [16.x]
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --legacy-peer-deps
        timeout-minutes: 30

      - name: Build frontend
        run: npm run build:frontend
        timeout-minutes: 20

      - name: Build backend
        run: npm run build:backend
        timeout-minutes: 10

      - name: Build Windows app
        run: npx electron-builder --win --publish never
        timeout-minutes: 30
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload release assets
        uses: actions/upload-artifact@v3
        with:
          name: DataFlux-Pro-release
          path: |
            release/DataFlux-Pro-Setup-*.exe
            release/DataFlux-Pro-Portable-*.exe
          retention-days: 30

      - name: Create Release
        if: github.event_name == 'release'
        uses: softprops/action-gh-release@v1
        with:
          files: |
            release/DataFlux-Pro-Setup-*.exe
            release/DataFlux-Pro-Portable-*.exe
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 步骤3：触发自动打包

**选择一个方法：**

#### 方法A：自动触发（推荐）
```
当你推送代码到 main 分支时，自动开始打包
1. 提交代码
2. GitHub自动开始编译
3. 等待10-15分钟
4. exe自动生成！
```

#### 方法B：手动触发
```
1. 进入仓库的 "Actions" 标签页
2. 找到 "Build and Package DataFlux Pro" 工作流
3. 点击 "Run workflow"
4. 选择分支（main）
5. 点击 "Run workflow"
6. 等待编译完成
```

#### 方法C：通过Release触发（最正式）
```
1. 在GitHub仓库中，点击右侧 "Releases"
2. 点击 "Create a new release"
3. 标签: v2.0.0
4. 标题: Release v2.0.0
5. 点击 "Publish release"
6. 自动开始打包并上传到Release
```

---

## 下载exe文件

### 查看打包进度

```
1. 进入仓库
2. 点击 "Actions" 标签页
3. 你会看到 "Build and Package DataFlux Pro" 的运行记录
4. 绿色✓ = 成功，红色✗ = 失败
5. 点击进入可看详细日志
```

### 下载编译好的exe

**方法1：从Artifacts下载（推荐）**
```
1. 点击 Actions 中完成的工作流
2. 向下滚动，看到 "Artifacts" 部分
3. 点击 "DataFlux-Pro-release" 下载
4. 解压后得到：
   - DataFlux-Pro-Setup-v2.0.0.exe
   - DataFlux-Pro-Portable-v2.0.0.exe
```

**方法2：从Release下载（如果你创建了Release）**
```
1. 进入 Releases 页面
2. 找到对应版本
3. 点击 "Assets" 展开
4. 下载 .exe 文件
```

---

## 使用下载的exe

### 给最终用户

```
1. 将 DataFlux-Pro-Setup-v2.0.0.exe 分享给用户
2. 用户双击运行
3. 自动检测环境
4. 自动安装
5. 立即使用！
```

### 部署到你的团队

```
方法1：发邮件
  - 发送 .exe 链接给团队成员

方法2：创建共享链接
  - 在GitHub Release页面，右键复制下载链接
  - 分享给任何人

方法3：建立内部下载页面
  - 把exe放在你们的内部服务器
  - 员工从那里下载使用
```

---

## 常见问题

### Q1: 编译失败了怎么办？

**A:** 查看错误日志：
```
1. 进入 Actions
2. 点击失败的工作流
3. 看日志中的错误信息
4. 常见原因：
   - npm依赖问题 → 检查 package.json
   - TypeScript错误 → 检查代码语法
   - 文件路径错误 → 检查文件结构
5. 修改代码后重新推送
```

### Q2: 编译需要多久？

**A:** 
```
首次打包：15-20分钟（包括npm依赖下载）
之后打包：5-10分钟
网络快的话更快
```

### Q3: exe文件在哪里？

**A:**
```
编译完成后，在两个地方可以找到：

1. Artifacts（推荐）
   Actions → 完成的工作流 → Artifacts → DataFlux-Pro-release

2. Release（如果创建了Release）
   Releases → v2.0.0 → Assets
```

### Q4: 能否自动更新版本号？

**A:** 可以，编辑 `package.json`：
```json
{
  "version": "2.0.1",
  "name": "dataflux-pro"
}
```
每次修改版本号并推送，就会生成新版本的exe。

### Q5: 如何设置自动上传到Release？

**A:** 配置文件中已经包含了！
```
当你创建Release标签时，exe会自动上传到Release页面
操作步骤：
1. 创建Release（标签+描述）
2. GitHub自动检测
3. 自动编译exe
4. 自动上传到Release Assets
5. 完成！
```

### Q6: 能否限制谁可以触发编译？

**A:** 可以，编辑 `.github/workflows/build.yml`：
```yaml
on:
  push:
    branches:
      - main
    # 添加权限限制
  workflow_dispatch:
    # 只有维护者可以手动触发
```

### Q7: 编译环境需要特殊配置吗？

**A:** 不需要！GitHub Actions已经提供了：
```
- Windows Server 2022
- Node.js 16.x
- npm 8.x
- 所有必要的构建工具
```
完全自动化！

### Q8: 费用是多少？

**A:** 
```
✓ 完全免费！
✓ 公开仓库：无限构建
✓ 私密仓库：每月2000分钟免费
✓ 足够个人和小团队使用
```

---

## 快速检查清单

完成以下步骤确保一切正常：

- [ ] GitHub账号已创建
- [ ] 仓库已创建（dataflux-pro）
- [ ] 所有22个文件已上传
- [ ] .github/workflows/build.yml 已创建
- [ ] Actions工作流可见
- [ ] 至少运行过一次编译
- [ ] 可以看到编译产物（Artifacts）
- [ ] 可以下载exe文件

---

## 自动打包工作流程图

```
你的本地代码
    ↓
上传到 GitHub
    ↓
GitHub Actions 触发
    ↓
自动编译（Windows环境）
    ├─ npm install
    ├─ npm run build
    ├─ electron-builder
    └─ 生成 exe
    ↓
上传到 Artifacts/Release
    ↓
你下载 exe
    ↓
分发给最终用户
```

---

## 下一步

1. ✅ 创建GitHub仓库
2. ✅ 上传所有代码文件
3. ✅ 创建 .github/workflows/build.yml
4. ✅ 等待首次编译完成（15-20分钟）
5. ✅ 下载生成的exe
6. ✅ 分享给用户使用！

---

## 需要帮助？

遇到问题时：
1. 检查 Actions 日志了解错误
2. 验证文件结构是否正确
3. 确认 package.json 配置无误
4. 查看 GitHub Actions 文档

**祝你使用愉快！** 🚀

---

**版本**: 2.0.0
**最后更新**: 2024年
**自动打包**: ✅ 已启用
