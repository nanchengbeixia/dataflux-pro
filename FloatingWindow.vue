<template>
  <!-- 浮窗组件 -->
  <div 
    v-if="isVisible"
    class="floating-window"
    :class="{ expanded: isExpanded }"
    :style="{ 
      left: position.x + 'px', 
      top: position.y + 'px',
      width: isExpanded ? '400px' : '80px'
    }"
    @mousedown="startDrag"
  >
    <!-- 标题栏 -->
    <div class="floating-header" @dblclick="toggleExpand">
      <span v-if="!isExpanded" class="logo">D</span>
      <span v-else class="title">DataFlux</span>
      <div class="header-buttons">
        <button 
          v-if="isExpanded"
          @click="toggleExpand"
          class="header-btn"
          title="最小化"
        >
          −
        </button>
        <button 
          @click="toggleVisibility"
          class="header-btn"
          title="关闭"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 快速操作按钮 (最小化模式) -->
    <div v-if="!isExpanded" class="quick-buttons">
      <button 
        @click="openFileManager"
        class="quick-btn"
        title="打开文件夹"
      >
        📁
      </button>
      <button 
        @click="openExcelLinker"
        class="quick-btn"
        title="Excel处理"
      >
        📊
      </button>
      <button 
        @click="focusAI"
        class="quick-btn"
        title="AI助手"
      >
        💬
      </button>
      <button 
        @click="openSettings"
        class="quick-btn"
        title="设置"
      >
        ⚙️
      </button>
    </div>

    <!-- 展开面板 -->
    <div v-else class="floating-content">
      <!-- AI助手快速输入 -->
      <div class="ai-quick-input">
        <input
          ref="aiInput"
          v-model="aiCommand"
          type="text"
          placeholder="输入中文命令..."
          class="ai-input"
          @keydown.enter="executeAICommand"
        />
        <button 
          @click="executeAICommand"
          class="ai-send-btn"
          title="执行"
        >
          →
        </button>
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <button 
          @click="openFileManager"
          class="action-btn"
        >
          📁 打开文件夹
        </button>
        <button 
          @click="openExcelLinker"
          class="action-btn"
        >
          📊 Excel处理
        </button>
        <button 
          @click="openSettings"
          class="action-btn"
        >
          ⚙️ 设置
        </button>
      </div>

      <!-- 最近操作 -->
      <div class="recent-actions">
        <h3>最近操作</h3>
        <div class="action-list">
          <div 
            v-for="(action, idx) in recentActions.slice(0, 3)"
            :key="idx"
            class="action-item"
            @click="replayAction(action)"
            :title="`点击重复: ${action.description}`"
          >
            <span class="action-icon">{{ getActionIcon(action.type) }}</span>
            <span class="action-text">{{ action.description }}</span>
            <span class="action-time">{{ getTimeAgo(action.time) }}</span>
          </div>
        </div>
      </div>

      <!-- 处理进度 -->
      <div v-if="isProcessing" class="processing-info">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <p class="progress-text">{{ processingMessage }}</p>
      </div>
    </div>
  </div>

  <!-- 右键菜单快捷方式 -->
  <div id="context-menu-detector" class="hidden"></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

// 状态
const isVisible = ref(true);
const isExpanded = ref(false);
const position = ref({ x: window.innerWidth - 100, y: 100 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// AI命令
const aiCommand = ref('');
const aiInput = ref<HTMLInputElement>();

// 最近操作
const recentActions = ref<any[]>([]);

// 处理进度
const isProcessing = ref(false);
const processingMessage = ref('');
const progress = ref(0);

// 事件监听
const startDrag = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('floating-header')) {
    isDragging.value = true;
    dragOffset.value = {
      x: e.clientX - position.value.x,
      y: e.clientY - position.value.y
    };
  }
};

const moveMouse = (e: MouseEvent) => {
  if (isDragging.value) {
    position.value = {
      x: e.clientX - dragOffset.value.x,
      y: e.clientY - dragOffset.value.y
    };
  }
};

const stopDrag = () => {
  isDragging.value = false;
};

// 方法
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    nextTick(() => {
      aiInput.value?.focus();
    });
  }
};

const toggleVisibility = () => {
  isVisible.value = false;
  // 5秒后自动显示（防止用户误关闭）
  setTimeout(() => {
    isVisible.value = true;
  }, 5000);
};

const openFileManager = () => {
  // 发送事件给主进程
  window.electronAPI?.system.openExplorer('.');
};

const openExcelLinker = () => {
  // 打开Excel联动面板
  window.dispatchEvent(new CustomEvent('open-excel-linker'));
};

const focusAI = () => {
  isExpanded.value = true;
  nextTick(() => {
    aiInput.value?.focus();
  });
};

const openSettings = () => {
  window.dispatchEvent(new CustomEvent('open-settings'));
};

const executeAICommand = async () => {
  if (!aiCommand.value.trim()) return;

  isProcessing.value = true;
  processingMessage.value = '正在处理命令...';
  progress.value = 0;

  try {
    // 调用AI服务
    const result = await window.electronAPI?.ai?.executeCommand?.(aiCommand.value);
    
    if (result?.success) {
      processingMessage.value = result.message || '操作完成！';
      progress.value = 100;

      // 添加到最近操作
      recentActions.value.unshift({
        type: result.type || 'command',
        description: aiCommand.value,
        time: new Date(),
        data: result.data
      });

      // 清空输入
      aiCommand.value = '';
    }
  } catch (error) {
    processingMessage.value = '执行出错: ' + String(error);
  }

  setTimeout(() => {
    isProcessing.value = false;
  }, 3000);
};

const replayAction = async (action: any) => {
  isProcessing.value = true;
  processingMessage.value = '重复执行: ' + action.description;
  progress.value = 0;

  try {
    // 重新执行操作
    await window.electronAPI?.ai?.executeCommand?.(action.description);
    processingMessage.value = '操作完成！';
    progress.value = 100;
  } catch (error) {
    processingMessage.value = '执行出错';
  }

  setTimeout(() => {
    isProcessing.value = false;
  }, 2000);
};

const getActionIcon = (type: string) => {
  const icons: Record<string, string> = {
    'excel': '📊',
    'file': '📁',
    'command': '💬',
    'rename': '✏️',
    'move': '➡️',
    'delete': '🗑️'
  };
  return icons[type] || '•';
};

const getTimeAgo = (time: Date) => {
  const seconds = Math.floor((new Date().getTime() - time.getTime()) / 1000);
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return Math.floor(seconds / 60) + '分钟前';
  if (seconds < 86400) return Math.floor(seconds / 3600) + '小时前';
  return '1天前';
};

// 生命周期
onMounted(() => {
  // 监听拖拽事件
  document.addEventListener('mousemove', moveMouse);
  document.addEventListener('mouseup', stopDrag);

  // 监听全局快捷键
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.code === 'KeyD') {
      isVisible.value = !isVisible.value;
    }
  });

  // 监听处理进度
  window.addEventListener('processing-progress', (e: any) => {
    progress.value = e.detail.progress;
    processingMessage.value = e.detail.message;
  });

  // 初始化最近操作
  loadRecentActions();
});

onUnmounted(() => {
  document.removeEventListener('mousemove', moveMouse);
  document.removeEventListener('mouseup', stopDrag);
});

const loadRecentActions = () => {
  // 从localStorage加载最近操作
  try {
    const saved = localStorage.getItem('dataflux-recent-actions');
    if (saved) {
      recentActions.value = JSON.parse(saved).map((a: any) => ({
        ...a,
        time: new Date(a.time)
      }));
    }
  } catch (error) {
    console.error('加载最近操作失败:', error);
  }
};

// 监听最近操作变化，保存到本地存储
watch(() => recentActions.value, (newVal) => {
  try {
    localStorage.setItem('dataflux-recent-actions', JSON.stringify(
      newVal.slice(0, 20).map(a => ({
        ...a,
        time: a.time.toISOString()
      }))
    ));
  } catch (error) {
    console.error('保存最近操作失败:', error);
  }
}, { deep: true });
</script>

<style scoped lang="scss">
.floating-window {
  position: fixed;
  z-index: 10000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  transition: all 0.3s ease;
  user-select: none;

  &:not(.expanded) {
    width: 80px;
    height: 80px;
  }

  &.expanded {
    width: 400px !important;
    height: 500px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

.floating-header {
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px 12px 0 0;
  color: white;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;

  &:active {
    cursor: grabbing;
  }

  .logo {
    font-size: 24px;
    font-weight: 700;
  }

  .title {
    font-size: 14px;
    flex: 1;
  }

  .header-buttons {
    display: flex;
    gap: 4px;
  }

  .header-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.quick-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;

  .quick-btn {
    padding: 8px;
    border: none;
    background: #f0f0f0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;

    &:hover {
      background: #e0e0e0;
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.floating-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px;
  gap: 12px;
}

.ai-quick-input {
  display: flex;
  gap: 6px;

  .ai-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 12px;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }
  }

  .ai-send-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #667eea;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;

    &:hover {
      background: #5568d3;
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .action-btn {
    padding: 8px 12px;
    border: none;
    background: #f5f5f5;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;

    &:hover {
      background: #e8e8e8;
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

.recent-actions {
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid #eee;
  padding-top: 8px;

  h3 {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
  }

  .action-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .action-item {
    padding: 8px;
    background: #f9f9f9;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 11px;
    transition: all 0.2s;

    &:hover {
      background: #efefef;
    }

    &:active {
      transform: scale(0.98);
    }

    .action-icon {
      font-size: 14px;
    }

    .action-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #333;
    }

    .action-time {
      color: #999;
      font-size: 10px;
    }
  }
}

.processing-info {
  padding: 8px;
  background: #f0f8ff;
  border-radius: 6px;
  border-top: 1px solid #ddd;

  .progress-bar {
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 6px;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }
  }

  .progress-text {
    margin: 0;
    font-size: 11px;
    color: #666;
    text-align: center;
  }
}

.hidden {
  display: none;
}

// 响应式设计
@media (max-height: 600px) {
  .floating-window.expanded {
    height: 100vh - 20px;
  }
}

// 滚动美化
.recent-actions::-webkit-scrollbar {
  width: 4px;
}

.recent-actions::-webkit-scrollbar-track {
  background: transparent;
}

.recent-actions::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;

  &:hover {
    background: #999;
  }
}
</style>

<script lang="ts">
import { watch } from 'vue';
</script>
