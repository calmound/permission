<template>
  <a-layout class="layout-container">
    <!-- 顶部导航栏 -->
    <a-layout-header class="layout-header">
      <AppHeader />
    </a-layout-header>

    <!-- 主体内容 -->
    <a-layout class="layout-content">
      <!-- 侧边菜单 -->
      <a-layout-sider
        v-model:collapsed="collapsed"
        collapsible
        :width="240"
        class="bg-white border-r border-gray-200"
      >
        <AppSider :collapsed="collapsed" />
      </a-layout-sider>

      <!-- 内容区域 -->
      <a-layout-content class="layout-main">
        <!-- 面包屑导航 -->
        <div
          class="breadcrumb-container bg-white px-6 py-3 border-b border-gray-200"
        >
          <AppBreadcrumb />
        </div>

        <!-- 页面内容 -->
        <div class="page-container">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AppHeader from "@components/layout/AppHeader.vue";
import AppSider from "@components/layout/AppSider.vue";
import AppBreadcrumb from "@components/layout/AppBreadcrumb.vue";

// 侧边栏折叠状态
const collapsed = ref(false);
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-header {
  padding: 0;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.layout-content {
  height: calc(100vh - 64px);
}

.layout-main {
  background: #f5f5f5;
  overflow: auto;
}

.breadcrumb-container {
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-container {
  min-height: calc(100% - 53px);
}
</style>
