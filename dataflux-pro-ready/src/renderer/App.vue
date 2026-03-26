<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-left">
        <img src="@/assets/logo.svg" alt="DataFlux Pro" class="app-logo">
        <h1 class="app-title">DataFlux Pro</h1>
      </div>

      <nav class="header-nav">
        <button 
          v-for="tab in mainTabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['nav-btn', { active: activeTab === tab.id }]"
        >
          {{ tab.name }}
        </button>
      </nav>

      <div class="header-right">
        <button @click="toggleDarkMode" class="icon-btn" title="切换深色模式">
          🌙
        </button>
        <button @click="showSettings" class="icon-btn" title="设置">
          ⚙️
        </button>
      </div>
    </header>

    <!-- 主容器 -->
    <main class="app-main">
      <!-- 表格处理模块 -->
      <section v-show="activeTab === 'excel'" class="module-section">
        <ExcelModule />
      </section>

      <!-- 文件处理模块 -->
      <section v-show="activeTab === 'files'" class="module-section">
        <FileModule />
      </section>

      <!-- 数据关联模块 -->
      <section v-show="activeTab === 'search'" class="module-section">
        <SearchModule />
      </section>

      <!-- 任务管理模块 -->
      <section v-show="activeTab === 'tasks'" class="module-section">
        <TaskModule />
      </section>
    </main>

    <!-- 底部状态栏 -->
    <footer class="app-footer">
      <div class="status-info">
        <span class="status-item">
          <span class="status-label">状态:</span>
          <span :class="['status-value', statusClass]">{{ statusMessage }}</span>
        </span>
        <span v-if="currentOperation" class="status-item">
          <span class="progress-info">{{ currentOperation }}...</span>
        </span>
      </div>

      <div class="footer-right">
        <span class="version">v1.0.0</span>
      </div>
    </footer>

    <!-- 通知容器 -->
    <div class="notification-container">
      <div 
        v-for="notif in notifications" 
        :key="notif.id"
        :class="['notification', `notification-${notif.type}`]"
      >
        {{ notif.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ExcelModule from '@/components/modules/ExcelModule.vue';
import FileModule from '@/components/modules/FileModule.vue';
import SearchModule from '@/components/modules/SearchModule.vue';
import TaskModule from '@/components/modules/TaskModule.vue';
import { useStore } from '@/store';

// 状态管理
const store = useStore();

// 本地状态
const activeTab = ref('excel');
const isDarkMode = ref(false);
const notifications = ref<any[]>([]);
const statusMessage = ref('就绪');
const currentOperation = ref<string | null>(null);

// 主导航标签
const mainTabs = [
  { id: 'excel', name: '📊 表格处理' },
  { id: 'files', name: '📁 文件管理' },
  { id: 'search', name: '🔗 数据关联' },
  { id: 'tasks', name: '⚡ 自动化' }
];

// 计算属性
const statusClass = computed(() => {
  if (currentOperation.value) return 'status-processing';
  if (statusMessage.value.includes('错误')) return 'status-error';
  if (statusMessage.value.includes('成功')) return 'status-success';
  return 'status-ready';
});

// 方法
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', String(isDarkMode.value));
};

const showSettings = () => {
  console.log('显示设置面板');
  // TODO: 实现设置面板
};

const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });

  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id);
  }, 3000);
};

// 生命周期
onMounted(async () => {
  // 恢复深色模式设置
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode) {
    isDarkMode.value = JSON.parse(savedDarkMode);
  }

  // 检查环境
  try {
    statusMessage.value = '正在检查环境...';
    const result = await window.electronAPI.system.checkEnvironment();
    
    if (result.allPassed) {
      statusMessage.value = '✓ 环境检查完成，系统就绪';
    } else {
      statusMessage.value = '⚠ 环境检查发现问题，请检查设置';
      addNotification('环境检查发现问题，请查看详情', 'warning');
    }
  } catch (error) {
    statusMessage.value = '✗ 环境检查失败';
    addNotification('环境检查失败: ' + String(error), 'error');
  }

  // 监听操作进度
  window.electronAPI.on('operation-progress', (data: any) => {
    currentOperation.value = data.operation;
    statusMessage.value = data.message;
  });

  window.electronAPI.on('operation-complete', (data: any) => {
    currentOperation.value = null;
    statusMessage.value = data.message;
    if (data.success) {
      addNotification(data.message, 'success');
    } else {
      addNotification(data.message, 'error');
    }
  });
});

// 暴露给子组件使用
const appContext = {
  addNotification,
  setStatus: (message: string) => {
    statusMessage.value = message;
  },
  setOperation: (operation: string | null) => {
    currentOperation.value = operation;
  }
};

provide('appContext', appContext);
</script>

<style scoped lang="scss">
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  color: #333;
  transition: background-color 0.3s ease, color 0.3s ease;

  &.dark-mode {
    background: #1e1e1e;
    color: #e0e0e0;

    .app-header {
      background: #2a2a2a;
      border-color: #404040;
    }

    .app-main {
      background: #1e1e1e;
    }

    .app-footer {
      background: #2a2a2a;
      border-color: #404040;
    }

    .nav-btn {
      color: #e0e0e0;

      &:hover {
        background: #404040;
      }

      &.active {
        color: #4a9eff;
        border-color: #4a9eff;
      }
    }
  }
}

/* 顶部导航栏 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .app-logo {
    width: 32px;
    height: 32px;
  }

  .app-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-nav {
    display: flex;
    gap: 8px;
    flex: 1;
    margin-left: 40px;
  }

  .nav-btn {
    padding: 8px 16px;
    background: transparent;
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    transition: all 0.3s ease;

    &:hover {
      background: #f0f0f0;
      color: #333;
    }

    &.active {
      color: #667eea;
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #f0f0f0;
    }
  }
}

/* 主容器 */
.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;

  .module-section {
    animation: fadeIn 0.3s ease;
  }
}

/* 底部状态栏 */
.app-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #999;

  .status-info {
    display: flex;
    gap: 20px;
  }

  .status-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .status-label {
    color: #666;
  }

  .status-value {
    font-weight: 600;

    &.status-ready {
      color: #667eea;
    }

    &.status-processing {
      color: #f59e0b;
      animation: pulse 1s infinite;
    }

    &.status-success {
      color: #10b981;
    }

    &.status-error {
      color: #ef4444;
    }
  }

  .progress-info {
    color: #f59e0b;
  }

  .footer-right {
    color: #999;
  }

  .version {
    font-size: 11px;
  }
}

/* 通知容器 */
.notification-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.notification {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 8px;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &-success {
    background: #d1fae5;
    color: #065f46;
  }

  &-error {
    background: #fee2e2;
    color: #7f1d1d;
  }

  &-warning {
    background: #fef3c7;
    color: #78350f;
  }

  &-info {
    background: #dbeafe;
    color: #0c2340;
  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>

<script>
import { provide } from 'vue';
</script>
