<template>
  <div class="flex flex-col h-full app-sider">
    <!-- 菜单头部 -->
    <div v-if="!collapsed" class="p-4 border-b border-gray-200 sider-header">
      <h3 class="text-sm font-medium text-gray-600">功能菜单</h3>
    </div>

    <!-- 菜单内容 -->
    <div class="flex-1 overflow-y-auto">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        :inline-collapsed="collapsed"
        class="border-0"
        @click="handleMenuClick"
      >
        <template v-for="item in menuItems" :key="item.key">
          <!-- 单级菜单 -->
          <a-menu-item
            v-if="!item.children || item.children.length === 0"
            :key="'item-' + item.key"
            :disabled="item.disabled"
          >
            <template #icon>
              <component :is="item.icon" v-if="item.icon" />
            </template>
            <span>{{ item.title }}</span>
          </a-menu-item>

          <!-- 多级菜单 -->
          <a-sub-menu
            v-else
            :key="'submenu-' + item.key"
            :disabled="item.disabled"
          >
            <template #icon>
              <component :is="item.icon" v-if="item.icon" />
            </template>
            <template #title>{{ item.title }}</template>

            <a-menu-item
              v-for="child in item.children"
              :key="'child-' + child.key"
              :disabled="child.disabled"
            >
              <template #icon>
                <component :is="child.icon" v-if="child.icon" />
              </template>
              <span>{{ child.title }}</span>
            </a-menu-item>
          </a-sub-menu>
        </template>
      </a-menu>
    </div>

    <!-- 底部折叠按钮 -->
    <div v-if="!collapsed" class="p-2 border-t border-gray-200 sider-footer">
      <div class="text-xs text-center text-gray-400">Version 1.0.0</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  SafetyOutlined,
  AuditOutlined,
} from "@ant-design/icons-vue";
import { useAuthStore } from "@stores/auth";

interface Props {
  collapsed: boolean;
}

interface MenuItem {
  key: string;
  title: string;
  icon?: any;
  path?: string;
  disabled?: boolean;
  children?: MenuItem[];
}

const props = defineProps<Props>();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 菜单状态
const selectedKeys = ref<string[]>([]);
const openKeys = ref<string[]>([]);

// 菜单配置
const menuConfig: MenuItem[] = [
  {
    key: "dashboard",
    title: "仪表盘",
    icon: DashboardOutlined,
    path: "/dashboard",
  },
  {
    key: "user-list",
    title: "用户管理",
    icon: UserOutlined,
    path: "/user/list",
  },
  {
    key: "role-list",
    title: "角色管理",
    icon: TeamOutlined,
    path: "/role/list",
  },
  {
    key: "resource",
    title: "资源管理",
    icon: MenuOutlined,
    children: [
      {
        key: "system-management",
        title: "系统管理",
        path: "/system/management",
      },
      {
        key: "menu-management",
        title: "菜单管理",
        path: "/resource/menu",
      },
      {
        key: "permission-management",
        title: "权限管理",
        path: "/resource/permission",
      },
    ],
  },
  {
    key: "grant",
    title: "授权中心",
    icon: SafetyOutlined,
    children: [
      {
        key: "role-permission-matrix",
        title: "角色权限矩阵",
        path: "/grant/role-permission",
      },
      {
        key: "user-role-grant",
        title: "用户角色授权",
        path: "/grant/user-role",
      },
    ],
  },
  {
    key: "audit",
    title: "审计管理",
    icon: AuditOutlined,
    children: [
      {
        key: "operation-logs",
        title: "操作日志",
        path: "/audit/logs",
      },
    ],
  },
];

// 根据权限过滤菜单
const menuItems = computed(() => {
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter((item) => {
      // 检查权限
      const permission = getMenuPermission(item.key);
      if (permission && !authStore.hasPermission(permission)) {
        return false;
      }

      // 递归过滤子菜单
      if (item.children) {
        item.children = filterMenuItems(item.children);
        // 如果子菜单全部被过滤掉，则隐藏父菜单
        return item.children.length > 0;
      }

      return true;
    });
  };

  return filterMenuItems([...menuConfig]);
});

// 获取菜单对应的权限码
const getMenuPermission = (key: string): string => {
  const permissionMap: Record<string, string> = {
    "user-list": "user:list",
    "role-list": "role:list",
    resource: "resource:list",
    "system-management": "system:manage",
    "menu-management": "resource:list",
    "permission-management": "resource:list",
    grant: "grant:list",
    "role-permission-matrix": "grant:list",
    "user-role-grant": "grant:list",
    audit: "audit:list",
    "operation-logs": "audit:list",
  };
  return permissionMap[key] || "";
};

// 菜单点击事件
const handleMenuClick = ({ key }: { key: string }) => {
  // 移除key前缀（item-、child-、submenu-）获取原始key
  const cleanKey = key.replace(/^(item-|child-|submenu-)/, "");

  const findMenuItem = (
    items: MenuItem[],
    targetKey: string
  ): MenuItem | null => {
    for (const item of items) {
      if (item.key === targetKey) {
        return item;
      }
      if (item.children) {
        const found = findMenuItem(item.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

  const menuItem = findMenuItem(menuConfig, cleanKey);
  if (menuItem?.path) {
    router.push(menuItem.path);
  }
};

// 根据当前路由设置选中状态
const updateMenuState = () => {
  const path = route.path;

  // 查找匹配的菜单项
  const findMenuByPath = (items: MenuItem[], targetPath: string): string[] => {
    for (const item of items) {
      if (item.path === targetPath) {
        // 单级菜单使用item-前缀
        return [`item-${item.key}`];
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.path === targetPath) {
            // 子菜单使用child-前缀
            return [`child-${child.key}`];
          }
        }
      }
    }
    return [];
  };

  const keys = findMenuByPath(menuConfig, path);
  if (keys.length > 0) {
    selectedKeys.value = keys;
  }

  // 设置展开的菜单
  if (!props.collapsed) {
    const openKey = menuConfig.find((item) =>
      item.children?.some((child) => child.path === path)
    )?.key;
    if (openKey) {
      // 展开的菜单使用submenu-前缀
      openKeys.value = [`submenu-${openKey}`];
    }
  }
};

// 监听路由变化
watch(() => route.path, updateMenuState, { immediate: true });

// 监听折叠状态变化
watch(
  () => props.collapsed,
  (collapsed) => {
    if (!collapsed) {
      // 展开时恢复之前的展开状态
      updateMenuState();
    } else {
      // 折叠时清空展开状态
      openKeys.value = [];
    }
  }
);
</script>

<style scoped>
.app-sider {
  background: #fff;
}

.sider-header {
  background: #fafafa;
}

:deep(.ant-menu-inline-collapsed) {
  width: 80px;
}

:deep(.ant-menu-item) {
  margin: 0;
  margin-bottom: 4px;
  border-radius: 6px;
}

:deep(.ant-menu-submenu-title) {
  margin: 0;
  margin-bottom: 4px;
  border-radius: 6px;
}

:deep(.ant-menu-item-selected) {
  background-color: #e6f7ff;
  border-right: 3px solid #1890ff;
}

:deep(.ant-menu-item:hover) {
  color: #1890ff;
}
</style>
