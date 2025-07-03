<template>
  <div class="flex items-center justify-between h-16 px-6 bg-white app-header">
    <!-- 左侧：Logo 和标题 -->
    <div class="flex items-center">
      <div class="flex items-center logo">
        <!-- <img
          src="/logo.svg"
          alt="Logo"
          class="w-8 h-8 mr-3"
          @error="onImageError"
        /> -->
        <h1 class="text-xl font-semibold text-gray-800">
          用户中心权限管理系统
        </h1>
      </div>
    </div>

    <!-- 右侧：全屏切换、用户菜单 -->
    <div class="flex items-center space-x-4">
      <!-- 全屏切换 -->
      <component
        :is="isFullscreen ? 'FullscreenExitOutlined' : 'FullscreenOutlined'"
        class="text-lg text-gray-600 cursor-pointer hover:text-blue-500"
        @click="toggleFullscreen"
      />

      <!-- 用户菜单 -->
      <a-dropdown>
        <div
          class="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-gray-50"
        >
          <a-avatar :src="authStore.user?.avatar" :size="32" class="mr-2">
            {{ authStore.user?.username?.charAt(0).toUpperCase() }}
          </a-avatar>
          <span class="text-sm text-gray-700">
            {{ authStore.user?.nickname || authStore.user?.username }}
          </span>
          <DownOutlined class="ml-1 text-xs text-gray-400" />
        </div>

        <template #overlay>
          <a-menu>
            <a-menu-item key="profile" @click="goToProfile">
              <UserOutlined class="mr-2" />
              个人资料
            </a-menu-item>
            <a-menu-item key="settings" @click="goToSettings">
              <SettingOutlined class="mr-2" />
              账户设置
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="logout" @click="handleLogout">
              <LogoutOutlined class="mr-2" />
              退出登录
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Modal } from "ant-design-vue";
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons-vue";
import { useAuthStore } from "@stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// 状态
const isFullscreen = ref(false);

// 全屏切换
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
};

// 监听全屏状态变化
document.addEventListener("fullscreenchange", () => {
  isFullscreen.value = !!document.fullscreenElement;
});

// 个人资料
const goToProfile = () => {
  router.push("/profile");
};

// 账户设置
const goToSettings = () => {
  router.push("/settings");
};

// 退出登录
const handleLogout = () => {
  Modal.confirm({
    title: "确认退出",
    content: "您确定要退出登录吗？",
    okText: "确定",
    cancelText: "取消",
    onOk: () => {
      authStore.logout();
    },
  });
};

// Logo 错误处理
const onImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.style.display = "none";
};
</script>

<style scoped>
.app-header {
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.logo img {
  transition: transform 0.3s ease;
}

.logo img:hover {
  transform: scale(1.1);
}
</style>
