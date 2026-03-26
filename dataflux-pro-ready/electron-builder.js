# electron-builder.js - 一键打包配置文件

/**
 * DataFlux Pro - Electron Builder 配置
 * 用途：自动生成Windows exe安装包
 */

module.exports = {
  // 应用信息
  appId: "com.dataflux.pro",
  productName: "DataFlux Pro",
  
  directories: {
    output: "release",
    buildResources: "public",
    extraFiles: [
      {
        from: "scripts",
        to: "scripts",
        filter: ["**/*"]
      }
    ]
  },

  files: [
    "dist/**/*",
    "public/**/*",
    "node_modules/**/*",
    "package.json"
  ],

  // ============ Windows特定配置 ============
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64", "ia32"]
      },
      {
        target: "portable",
        arch: ["x64"]
      }
    ],
    certificateFile: null,
    certificatePassword: null,
    // 额外的构建资源
    extraMetadata: {
      name: "dataflux-pro"
    }
  },

  // NSIS安装程序配置
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    
    // 创建快捷方式
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "DataFlux Pro",
    
    // 安装程序显示
    installerIcon: "public/icons/installer.ico",
    uninstallerIcon: "public/icons/uninstaller.ico",
    installerHeader: "public/icons/installerHeader.bmp",
    installerSidebar: "public/icons/installerSidebar.bmp",
    
    // 自定义安装页面
    include: "scripts/installer.nsh",
    
    // 高级选项
    artifactName: "${productName}-Setup-v${version}.${ext}",
    
    // 安装完成后的操作
    runAfterFinish: true,
  },

  // 便携版本配置
  portable: {
    artifactName: "${productName}-Portable-v${version}.${ext}"
  },

  // ============ Windows安装程序外观 ============
  win: {
    iconUrl: "https://example.com/icon.ico",
    certificateFile: null,
    certificatePassword: null,
  },

  // ============ 代码签名（可选） ============
  // 如需发布到公众，建议添加代码签名
  /*
  certificateFile: "path/to/certificate.pfx",
  certificatePassword: process.env.WIN_CSC_KEY_PASSWORD,
  */

  // ============ 自动更新配置 ============
  publish: {
    provider: "github",
    owner: "yourname",
    repo: "dataflux-pro",
    releaseType: "release"
  },

  // ============ 构建钩子 ============
  beforePack: async (context) => {
    console.log("✓ 开始打包前的准备...");
    // 可以在这里执行清理、检查等操作
  },

  afterPack: async (context) => {
    console.log("✓ 打包完成");
  }
};
