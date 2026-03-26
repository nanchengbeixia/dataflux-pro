# 🎯 GitHub自动打包 - 傻瓜式教程（真的很简单！）

> 不需要命令行，完全用浏览器操作！我一步一步教你。

---

## 📌 总结：你要做的就这4步

```
第1步: 在GitHub创建账号和仓库 (3分钟)
   ↓
第2步: 用浏览器上传所有代码文件 (5分钟)
   ↓
第3步: 添加自动打包配置 (2分钟)
   ↓
第4步: 等待GitHub自动打包 (10-15分钟)
   ↓
完成！下载exe文件
```

**就这么简单！不需要任何命令行操作！**

---

## 🚀 第1步：创建GitHub账号（如果没有的话）

### 打开GitHub网站
```
访问: https://github.com
```

### 点击"Sign up"（注册）
找到右上角的 "Sign up" 按钮，点击它

### 填写注册信息
```
Email:        你的邮箱（比如: abc@gmail.com）
Password:     设置密码（至少8个字符）
Username:     用户名（比如: myname）
```

### 完成验证
```
1. 点击"Create account"
2. 选择"Free"免费版本
3. 完成邮箱验证（去你的邮箱点一下验证链接）
```

**注册完成！** ✅

---

## 📁 第2步：创建仓库（储存你的代码的地方）

### 打开GitHub首页
登录后，你会看到GitHub首页

### 创建新仓库
```
方法1（推荐）：
  点击右上角头像 → Settings → 左侧 "Repositories" 
  → "New repository"

方法2：
  点击左侧 "New" 绿色按钮
```

### 填写仓库信息
```
Repository name:    dataflux-pro
Description:        DataFlux Pro - 智能文件处理系统
Visibility:         Public (公开) 或 Private (私密，推荐)
Initialize:         勾选 "Add a README file"
```

### 点击"Create repository"

**仓库创建完成！** ✅

现在你有了一个空的仓库，地址类似：
```
https://github.com/你的用户名/dataflux-pro
```

---

## 📤 第3步：上传你的代码文件

### 你现在有什么：
```
下载的 DataFlux-Pro-v2.0.zip 文件
```

### 第1次操作：解压zip文件
```
1. 找到 DataFlux-Pro-v2.0.zip
2. 右键 → "解压到此处"
3. 现在你有一个文件夹，里面有22个文件
```

### 第2次操作：打开GitHub仓库

在浏览器中打开你刚创建的仓库：
```
https://github.com/你的用户名/dataflux-pro
```

### 第3次操作：上传文件

**方式1：拖拽上传（最简单）** ⭐ 推荐

```
1. 在GitHub仓库页面
2. 看到 "Add file" 按钮
3. 点击 "Add file" → "Upload files"
4. 把解压好的所有文件拖进去
5. 或者点击"choose your files"选择文件
6. 选中所有22个文件
7. 滚到下面，点击 "Commit changes"
```

**方式2：逐个上传**

```
1. 进入GitHub仓库
2. 点击 "Add file" → "Upload files"
3. 一个一个选择文件上传
   （比较慢，但如果拖拽不行可以用这个）
4. 完成后点击 "Commit changes"
```

**等等，我需要按特定文件夹放置吗？**

不需要！你可以：
- 方式1：先在本地整理好文件夹，再上传（更规整）
- 方式2：直接全部上传，GitHub允许你之后修改

### 建议的文件夹结构（在本地先整理好）

```
dataflux-pro-folder/
├── README.md
├── package.json
├── electron-builder.js
├── environment-check.js
├── build-and-package.js
├── .github/
│   └── workflows/
│       └── build.yml
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
└── (其他所有文档)
```

### 怎么做：

```
1. 在你的电脑上新建文件夹: dataflux-pro
2. 下载的所有文件按上面的结构放进去
3. 特别注意：
   - 创建 .github/workflows/ 目录
   - 把 build.yml 放进去
4. 整理好后，全选所有文件
5. 拖进GitHub的 "Upload files" 区域
6. 点击 "Commit changes"
```

**上传完成！** ✅

---

## ⚙️ 第4步：添加自动打包配置（关键！）

### 这是什么？
这是告诉GitHub："当用户上传代码时，自动为我打包exe"的配置文件

### 怎么做？

#### 步骤1：打开GitHub仓库
```
https://github.com/你的用户名/dataflux-pro
```

#### 步骤2：创建新文件
```
点击 "Add file" → "Create new file"
```

#### 步骤3：设置文件位置
在最上面的输入框输入：
```
.github/workflows/build.yml
```

GitHub会自动创建 `.github` 和 `workflows` 文件夹

#### 步骤4：粘贴配置内容
在下面的大框里粘贴以下内容：

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

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --legacy-peer-deps
        timeout-minutes: 30

      - name: Check environment
        run: node environment-check.js
        continue-on-error: true

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
```

#### 步骤5：提交文件
```
滚到下面，点击 "Commit new file"
```

**配置完成！** ✅

---

## ⏳ 第5步：触发自动打包

### 方式1：自动触发（推荐）

当你推送代码时自动打包

**怎么做：**
```
1. 在GitHub仓库中修改任何文件
   (例如编辑 README.md)
2. GitHub自动检测到代码变化
3. 自动开始编译（在后台）
4. 10-15分钟后完成
```

### 方式2：手动触发

在任何时候主动触发打包

**怎么做：**
```
1. 打开 https://github.com/你的用户名/dataflux-pro
2. 点击 "Actions" 标签页
3. 左侧找到 "Build and Package DataFlux Pro"
4. 点击右侧的 "Run workflow"
5. 选择分支（main）
6. 点击绿色的 "Run workflow" 按钮
7. 等待！
```

### 方式3：创建Release触发（最正式）

版本发布时自动打包

**怎么做：**
```
1. 点击仓库右侧的 "Releases"
2. 点击 "Create a new release"
3. 填写信息：
   Tag version:     v2.0.0
   Release title:   Release v2.0.0
   Description:     (可选)
4. 点击 "Publish release"
5. GitHub自动打包并上传到Release
```

---

## 📥 第6步：下载生成的exe文件

### 查看打包进度

```
1. 打开你的GitHub仓库
2. 点击 "Actions" 标签页
3. 你会看到 "Build and Package DataFlux Pro" 的运行记录
4. 如果是绿色✓ = 成功！
5. 如果是红色✗ = 失败（检查日志看错误）
```

### 下载exe文件

**从Artifacts下载：**
```
1. 在Actions页面，点击成功的工作流
2. 向下滚动找到 "Artifacts" 部分
3. 看到 "DataFlux-Pro-release"
4. 点击下载
5. 解压后得到：
   - DataFlux-Pro-Setup-v2.0.0.exe
   - DataFlux-Pro-Portable-v2.0.0.exe
```

**从Release下载：**
```
如果你创建了Release：
1. 点击仓库右侧 "Releases"
2. 找到你创建的版本
3. 点击 "Assets" 展开
4. 下载 .exe 文件
```

---

## ✨ 完成！

### 现在你拥有了：
```
✅ GitHub仓库（存放代码）
✅ 自动打包配置（GitHub自动做）
✅ 可下载的exe文件
```

### 如何使用：
```
1. 修改代码 → 推送到GitHub
2. GitHub自动打包
3. 下载最新的exe
4. 分发给用户
```

---

## 🎓 实际操作示例

### 假设你叫"小王"，GitHub用户名是"xiao-wang"

#### 他的仓库地址：
```
https://github.com/xiao-wang/dataflux-pro
```

#### 他第一次上传代码后：
```
1. 打开 https://github.com/xiao-wang/dataflux-pro
2. 点击 "Actions" 
3. 看到工作流开始运行
4. 等待 15 分钟
5. 绿色✓ 完成！
6. 点击工作流 → Artifacts → DataFlux-Pro-release
7. 下载！
```

#### 他现在可以：
```
1. 给别人分享这个exe链接
2. 别人下载后双击安装
3. 完成！
```

---

## ❓ 常见疑问

### Q: 我没有git命令行工具，可以吗？
**A:** 完全可以！这个教程完全不需要命令行，只用浏览器！

### Q: 我需要配置什么特殊的环境吗？
**A:** 不需要！GitHub为你配置好了所有东西。

### Q: 打包会失败吗？
**A:** 不会！如果代码没有问题，100%成功。

### Q: 每次都要等15分钟吗？
**A:** 是的，但后续次数可能快一点（5-10分钟）。

### Q: 费用是多少？
**A:** 完全免费！GitHub提供充足的免费额度。

### Q: 打包失败了怎么办？
**A:** 点击失败的工作流看日志，通常是代码问题，改好重新推送即可。

### Q: 我能看到打包过程吗？
**A:** 能！点击工作流查看详细日志。

---

## 📋 快速检查清单

打开GitHub仓库，检查以下项目：

- [ ] 仓库名称是 dataflux-pro
- [ ] 能看到所有22个文件已上传
- [ ] `.github/workflows/build.yml` 文件存在
- [ ] 点击 "Actions" 能看到工作流
- [ ] 工作流成功运行过至少一次
- [ ] 能看到 Artifacts 中有exe文件

---

## 🎉 恭喜！

你现在拥有了一个**完全自动化的打包系统**！

```
修改代码 → GitHub自动打包 → 下载exe → 分发使用
```

就这么简单！

---

**版本**: 2.0.0  
**难度**: ⭐ 超级简单  
**所需时间**: 15分钟  
**所需工具**: 只需浏览器和网络  
**成本**: 完全免费  

**祝你成功！** 🚀
