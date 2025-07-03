import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@stores/auth";
import { message } from "ant-design-vue";

// 导入布局组件
const BasicLayout = () => import("@/layouts/BasicLayout.vue");
const BlankLayout = () => import("@/layouts/BlankLayout.vue");

// 公开路由（无需登录）
export const publicRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@views/auth/Login.vue"),
    meta: {
      title: "登录",
      requireAuth: false,
    },
  },
  {
    path: "/403",
    name: "Forbidden",
    component: () => import("@views/error/403.vue"),
    meta: {
      title: "无权限",
      requireAuth: false,
    },
  },
  {
    path: "/404",
    name: "NotFound",
    component: () => import("@views/error/404.vue"),
    meta: {
      title: "页面不存在",
      requireAuth: false,
    },
  },
];

// 基础路由（需要登录）
export const basicRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Root",
    component: BasicLayout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@views/dashboard/Index.vue"),
        meta: {
          title: "仪表盘",
          icon: "DashboardOutlined",
          requireAuth: true,
        },
      },
    ],
  },
];

// 功能模块路由
export const moduleRoutes: RouteRecordRaw[] = [
  // 用户管理 - 简化为单级菜单
  {
    path: "/user/list",
    name: "UserList",
    component: BasicLayout,
    meta: {
      title: "用户管理",
      icon: "UserOutlined",
      requireAuth: true,
      permissions: ["user:list"],
    },
    children: [
      {
        path: "",
        component: () => import("@views/user/UserList.vue"),
        meta: {
          hideMenu: true,
        },
      },
    ],
  },
  {
    path: "/user/detail/:id",
    name: "UserDetail",
    component: BasicLayout,
    meta: {
      title: "用户详情",
      requireAuth: true,
      permissions: ["user:list"],
      hideMenu: true,
    },
    children: [
      {
        path: "",
        component: () => import("@views/user/UserDetail.vue"),
        meta: {
          hideMenu: true,
        },
      },
    ],
  },
  // 角色管理 - 简化为单级菜单
  {
    path: "/role/list",
    name: "RoleList",
    component: BasicLayout,
    meta: {
      title: "角色管理",
      icon: "TeamOutlined",
      requireAuth: true,
      permissions: ["role:list"],
    },
    children: [
      {
        path: "",
        component: () => import("@views/role/RoleList.vue"),
        meta: {
          hideMenu: true,
        },
      },
    ],
  },
  {
    path: "/role/create",
    name: "RoleCreate",
    component: BasicLayout,
    meta: {
      title: "新增角色",
      requireAuth: true,
      permissions: ["role:create"],
      hideMenu: true,
    },
    children: [
      {
        path: "",
        component: () => import("@views/role/RoleDetail.vue"),
        meta: {
          hideMenu: true,
        },
      },
    ],
  },
  {
    path: "/role/edit/:id",
    name: "RoleEdit",
    component: BasicLayout,
    meta: {
      title: "编辑角色",
      requireAuth: true,
      permissions: ["role:update"],
      hideMenu: true,
    },
    children: [
      {
        path: "",
        component: () => import("@views/role/RoleDetail.vue"),
        meta: {
          hideMenu: true,
        },
      },
    ],
  },
  {
    path: "/role/detail/:id",
    name: "RoleDetail",
    component: BasicLayout,
    meta: {
      title: "角色详情",
      requireAuth: true,
      permissions: ["role:list"],
      hideMenu: true,
    },
    children: [
      {
        path: "",
        component: () => import("@views/role/RoleDetail.vue"),
        meta: {
          hideMenu: true,
        },
      },
    ],
  },
  {
    path: "/system",
    name: "SystemManagement",
    component: BasicLayout,
    redirect: "/system/management",
    meta: {
      title: "系统管理",
      icon: "SettingOutlined",
      requireAuth: true,
      permissions: ["system:manage"],
    },
    children: [
      {
        path: "management",
        name: "SystemManagementPage",
        component: () => import("@views/system/SystemManagement.vue"),
        meta: {
          title: "系统管理",
          requireAuth: true,
          permissions: ["system:manage"],
        },
      },
    ],
  },
  {
    path: "/resource",
    name: "ResourceManagement",
    component: BasicLayout,
    redirect: "/resource/menu",
    meta: {
      title: "资源管理",
      icon: "MenuOutlined",
      requireAuth: true,
      permissions: ["resource:list"],
    },
    children: [
      {
        path: "menu",
        name: "MenuManagement",
        component: () => import("@views/resource/MenuManagement.vue"),
        meta: {
          title: "菜单管理",
          requireAuth: true,
          permissions: ["resource:list"],
        },
      },
      {
        path: "permission",
        name: "PermissionManagement",
        component: () => import("@views/resource/PermissionManagement.vue"),
        meta: {
          title: "权限管理",
          requireAuth: true,
          permissions: ["resource:list"],
        },
      },
    ],
  },
  {
    path: "/grant",
    name: "GrantManagement",
    component: BasicLayout,
    redirect: "/grant/role-permission",
    meta: {
      title: "授权中心",
      icon: "SafetyOutlined",
      requireAuth: true,
      permissions: ["grant:list"],
    },
    children: [
      {
        path: "role-permission",
        name: "RolePermissionMatrix",
        component: () => import("@views/grant/RolePermissionMatrix.vue"),
        meta: {
          title: "角色权限矩阵",
          requireAuth: true,
          permissions: ["grant:list"],
        },
      },
      {
        path: "user-role",
        name: "UserRoleGrant",
        component: () => import("@views/grant/UserRoleGrant.vue"),
        meta: {
          title: "用户角色授权",
          requireAuth: true,
          permissions: ["grant:list"],
        },
      },
    ],
  },
  {
    path: "/audit",
    name: "AuditManagement",
    component: BasicLayout,
    redirect: "/audit/logs",
    meta: {
      title: "审计管理",
      icon: "AuditOutlined",
      requireAuth: true,
      permissions: ["audit:list"],
    },
    children: [
      {
        path: "logs",
        name: "OperationLogs",
        component: () => import("@views/audit/OperationLogs.vue"),
        meta: {
          title: "操作日志",
          requireAuth: true,
          permissions: ["audit:list"],
        },
      },
    ],
  },
];

// 所有路由
const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...basicRoutes,
  ...moduleRoutes,
  // 添加重定向路由以保持向后兼容
  {
    path: "/user",
    redirect: "/user/list",
  },
  {
    path: "/role",
    redirect: "/role/list",
  },
  // 404 路由必须放在最后
  {
    path: "/:pathMatch(.*)*",
    redirect: "/404",
  },
];

// 创建路由器
const router = createRouter({
  history: createWebHistory("/"),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 用户中心权限管理系统`;
  }

  // 公开路由直接放行
  if (to.meta?.requireAuth === false) {
    // 如果已登录访问登录页，重定向到首页
    if (to.name === "Login" && authStore.isLoggedIn) {
      next("/");
    } else {
      next();
    }
    return;
  }

  // 检查登录状态
  if (!authStore.isLoggedIn) {
    message.warning("请先登录");
    next({
      path: "/login",
      query: { redirect: to.fullPath },
    });
    return;
  }

  // 检查权限
  const permissions = to.meta?.permissions as string[];
  if (permissions && permissions.length > 0) {
    const hasPermission = authStore.hasAnyPermission(permissions);
    if (!hasPermission) {
      message.error("没有权限访问该页面");
      next("/403");
      return;
    }
  }

  next();
});

export default router;
