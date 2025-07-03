<template>
  <a-breadcrumb class="app-breadcrumb">
    <a-breadcrumb-item>
      <router-link to="/" class="flex items-center">
        <HomeOutlined class="mr-1" />
        首页
      </router-link>
    </a-breadcrumb-item>

    <a-breadcrumb-item
      v-for="(item, index) in breadcrumbItems"
      :key="item.path"
    >
      <router-link
        v-if="index < breadcrumbItems.length - 1 && item.path"
        :to="item.path"
        class="text-gray-600 hover:text-blue-500"
      >
        {{ item.title }}
      </router-link>
      <span v-else class="text-gray-800 font-medium">
        {{ item.title }}
      </span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { HomeOutlined } from "@ant-design/icons-vue";

interface BreadcrumbItem {
  title: string;
  path?: string;
}

const route = useRoute();

// 面包屑配置
const breadcrumbConfig: Record<string, BreadcrumbItem[]> = {
  "/dashboard": [{ title: "仪表盘" }],
  "/user/list": [{ title: "用户管理", path: "/user" }, { title: "用户列表" }],
  "/user/detail": [
    { title: "用户管理", path: "/user" },
    { title: "用户列表", path: "/user/list" },
    { title: "用户详情" },
  ],
  "/role/list": [{ title: "角色管理", path: "/role" }, { title: "角色列表" }],
  "/role/detail": [
    { title: "角色管理", path: "/role" },
    { title: "角色列表", path: "/role/list" },
    { title: "角色详情" },
  ],
  "/resource/menu": [
    { title: "资源管理", path: "/resource" },
    { title: "菜单管理" },
  ],
  "/resource/permission": [
    { title: "资源管理", path: "/resource" },
    { title: "权限管理" },
  ],
  "/grant/role-permission": [
    { title: "授权中心", path: "/grant" },
    { title: "角色权限矩阵" },
  ],
  "/grant/user-role": [
    { title: "授权中心", path: "/grant" },
    { title: "用户角色授权" },
  ],
  "/audit/logs": [{ title: "审计管理", path: "/audit" }, { title: "操作日志" }],
};

// 动态生成面包屑
const breadcrumbItems = computed(() => {
  const path = route.path;

  // 优先使用精确匹配
  if (breadcrumbConfig[path]) {
    return breadcrumbConfig[path];
  }

  // 处理动态路由，如 /user/detail/123
  const pathSegments = path.split("/").filter(Boolean);
  if (pathSegments.length >= 3) {
    const basePath = `/${pathSegments[0]}/${pathSegments[1]}`;
    if (breadcrumbConfig[basePath]) {
      return breadcrumbConfig[basePath];
    }
  }

  // 根据 meta.title 生成面包屑
  const matched = route.matched.filter((item) => item.meta?.title);
  return matched.map((item) => ({
    title: item.meta.title as string,
    path: item.path === route.path ? undefined : item.path,
  }));
});
</script>

<style scoped>
.app-breadcrumb {
  margin: 0;
}

:deep(.ant-breadcrumb-link) {
  color: #666;
}

:deep(.ant-breadcrumb-separator) {
  color: #ccc;
}
</style>
