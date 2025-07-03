import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { message } from "ant-design-vue";
import type { User, Menu, LoginDto, LoginResponse } from "@/types/index";
import { authApi } from "@api/auth";
import router from "@/router";

// 开发模式配置
const DEV_MODE = process.env.NODE_ENV === "development";
const MOCK_LOGIN_ENABLED = true; // 可以通过这个开关控制是否启用模拟登录

// 模拟数据
const MOCK_ACCOUNTS = [
  {
    username: "admin",
    password: "123456",
    user: {
      id: "1",
      username: "admin",
      nickname: "系统管理员",
      email: "admin@example.com",
      avatar: "",
      status: "active" as const,
      roleIds: ["admin"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    permissions: [
      "user:list",
      "user:create",
      "user:update",
      "user:delete",
      "role:list",
      "role:create",
      "role:update",
      "role:delete",
      "resource:list",
      "resource:create",
      "resource:update",
      "resource:delete",
      "audit:list",
      "system:config",
    ],
    menus: [
      {
        id: "1",
        name: "仪表盘",
        type: "M" as const,
        url: "/dashboard",
        component: "Dashboard",
        icon: "DashboardOutlined",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        meta: {
          title: "仪表盘",
          icon: "DashboardOutlined",
          requireAuth: true,
        },
        children: [],
      },
      {
        id: "2",
        name: "用户管理",
        type: "M" as const,
        url: "/user",
        component: "UserManagement",
        icon: "UserOutlined",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        meta: {
          title: "用户管理",
          icon: "UserOutlined",
          requireAuth: true,
        },
        children: [
          {
            id: "2-1",
            parentId: "2",
            name: "用户列表",
            type: "V" as const,
            url: "/user/list",
            component: "UserList",
            icon: "",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            meta: {
              title: "用户列表",
              requireAuth: true,
            },
            children: [],
          },
        ],
      },
      {
        id: "3",
        name: "角色管理",
        type: "M" as const,
        url: "/role",
        component: "RoleManagement",
        icon: "TeamOutlined",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        meta: {
          title: "角色管理",
          icon: "TeamOutlined",
          requireAuth: true,
        },
        children: [],
      },
      {
        id: "4",
        name: "资源管理",
        type: "M" as const,
        url: "/resource",
        component: "ResourceManagement",
        icon: "AppstoreOutlined",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        meta: {
          title: "资源管理",
          icon: "AppstoreOutlined",
          requireAuth: true,
        },
        children: [],
      },
    ],
  },
  {
    username: "user",
    password: "123456",
    user: {
      id: "2",
      username: "user",
      nickname: "普通用户",
      email: "user@example.com",
      avatar: "",
      status: "active" as const,
      roleIds: ["user"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    permissions: ["user:list", "user:view"],
    menus: [
      {
        id: "1",
        name: "仪表盘",
        type: "M" as const,
        url: "/dashboard",
        component: "Dashboard",
        icon: "DashboardOutlined",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        meta: {
          title: "仪表盘",
          icon: "DashboardOutlined",
          requireAuth: true,
        },
        children: [],
      },
      {
        id: "2",
        name: "用户管理",
        type: "M" as const,
        url: "/user",
        component: "UserManagement",
        icon: "UserOutlined",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        meta: {
          title: "用户管理",
          icon: "UserOutlined",
          requireAuth: true,
        },
        children: [
          {
            id: "2-1",
            parentId: "2",
            name: "用户列表",
            type: "V" as const,
            url: "/user/list",
            component: "UserList",
            icon: "",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            meta: {
              title: "用户列表",
              requireAuth: true,
            },
            children: [],
          },
        ],
      },
    ],
  },
];

export const useAuthStore = defineStore("auth", () => {
  // 状态
  const token = ref<string>(localStorage.getItem("token") || "");
  const refreshToken = ref<string>(localStorage.getItem("refreshToken") || "");
  const user = ref<User | null>(null);
  const permissions = ref<string[]>([]);
  const menus = ref<Menu[]>([]);
  const loading = ref(false);

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const userRoles = computed(() => user.value?.roleIds || []);

  // 模拟登录函数
  const mockLogin = async (loginData: LoginDto): Promise<boolean> => {
    const account = MOCK_ACCOUNTS.find(
      (acc) =>
        acc.username === loginData.username &&
        acc.password === loginData.password
    );

    if (!account) {
      message.error("用户名或密码错误");
      return false;
    }

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 生成模拟token
    const mockToken = `mock_token_${account.user.id}_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_token_${
      account.user.id
    }_${Date.now()}`;

    // 保存认证信息
    token.value = mockToken;
    refreshToken.value = mockRefreshToken;
    user.value = account.user;
    permissions.value = account.permissions;
    menus.value = account.menus;

    // 持久化存储
    localStorage.setItem("token", mockToken);
    localStorage.setItem("refreshToken", mockRefreshToken);
    localStorage.setItem("user", JSON.stringify(account.user));

    message.success(`欢迎回来，${account.user.nickname}！`);
    return true;
  };

  // 登录
  const login = async (loginData: LoginDto): Promise<boolean> => {
    try {
      loading.value = true;

      // 如果是开发模式且启用了模拟登录，使用模拟登录
      if (DEV_MODE && MOCK_LOGIN_ENABLED) {
        return await mockLogin(loginData);
      }

      // 否则使用真实API
      const response: LoginResponse = await authApi.login(loginData);

      // 保存认证信息
      token.value = response.token;
      refreshToken.value = response.refreshToken;
      user.value = response.user;
      permissions.value = response.permissions;
      menus.value = response.menus;

      // 持久化存储
      localStorage.setItem("token", response.token);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      message.success("登录成功");
      return true;
    } catch (error) {
      message.error("登录失败");
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 登出
  const logout = async () => {
    try {
      // 调用后端登出接口
      await authApi.logout();
    } catch (error) {
      console.warn("登出接口调用失败:", error);
    } finally {
      // 清除本地状态
      clearAuthData();

      // 跳转到登录页
      router.push("/login");
      message.success("已安全退出");
    }
  };

  // 刷新token
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const response = await authApi.refresh({
        refreshToken: refreshToken.value,
      });

      token.value = response.token;
      localStorage.setItem("token", response.token);

      return true;
    } catch (error) {
      // 刷新失败，重新登录
      logout();
      return false;
    }
  };

  // 获取用户信息
  const getUserInfo = async (): Promise<void> => {
    try {
      const userInfo = await authApi.getUserInfo();
      user.value = userInfo;
      localStorage.setItem("user", JSON.stringify(userInfo));
    } catch (error) {
      console.error("获取用户信息失败:", error);
    }
  };

  // 获取权限列表
  const getPermissions = async (): Promise<void> => {
    try {
      const userPermissions = await authApi.getPermissions();
      permissions.value = userPermissions;
    } catch (error) {
      console.error("获取权限列表失败:", error);
    }
  };

  // 获取菜单列表
  const getMenus = async (): Promise<void> => {
    try {
      const userMenus = await authApi.getMenus();
      menus.value = userMenus;
    } catch (error) {
      console.error("获取菜单列表失败:", error);
    }
  };

  // 清除认证数据
  const clearAuthData = () => {
    token.value = "";
    refreshToken.value = "";
    user.value = null;
    permissions.value = [];
    menus.value = [];

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  // 权限检查
  const hasPermission = (permission: string): boolean => {
    if (!permission) return true;
    return permissions.value.includes(permission);
  };

  // 角色检查
  const hasRole = (role: string): boolean => {
    if (!role) return true;
    return userRoles.value.includes(role);
  };

  // 检查多个权限（任一）
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!permissionList || permissionList.length === 0) return true;
    return permissionList.some((permission) => hasPermission(permission));
  };

  // 检查多个权限（全部）
  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!permissionList || permissionList.length === 0) return true;
    return permissionList.every((permission) => hasPermission(permission));
  };

  // 初始化（从localStorage恢复状态）
  const initialize = () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser);
      } catch (error) {
        console.error("解析用户信息失败:", error);
        clearAuthData();
      }
    }
  };

  return {
    // 状态
    token,
    refreshToken,
    user,
    permissions,
    menus,
    loading,

    // 计算属性
    isLoggedIn,
    userRoles,

    // 方法
    login,
    logout,
    refreshAccessToken,
    getUserInfo,
    getPermissions,
    getMenus,
    clearAuthData,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    initialize,
  };
});
