import type { AxiosRequestConfig } from "axios";
import type {
  User,
  Role,
  Resource,
  ApiResponse,
  PaginationResponse,
  System,
  SystemMenu,
  SystemPermission,
  SystemRole,
} from "../types";

// Mock数据生成器
class MockGenerator {
  private static userIdCounter = 1;
  private static roleIdCounter = 1;
  private static resourceIdCounter = 2000;

  // 生成用户数据
  static generateUsers(count: number = 50): User[] {
    const users: User[] = [];
    const firstNames = [
      "张",
      "李",
      "王",
      "赵",
      "陈",
      "刘",
      "杨",
      "黄",
      "周",
      "吴",
    ];
    const lastNames = [
      "伟",
      "芳",
      "娜",
      "敏",
      "静",
      "雷",
      "强",
      "磊",
      "军",
      "洋",
    ];
    const domains = ["qq.com", "163.com", "gmail.com", "company.com"];
    const systemsInfo = [
      { code: "PERMISSION_SYSTEM", name: "权限管理系统" },
      { code: "USER_CENTER", name: "用户中心" },
      { code: "ADMIN", name: "管理后台" },
    ];
    const roleNames = [
      "系统管理员",
      "用户管理员",
      "角色管理员",
      "审计员",
      "普通用户",
    ];

    for (let i = 0; i < count; i++) {
      const id = String(this.userIdCounter++);
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const nickname = firstName + lastName;
      const username = `user${id}`;
      const domain = domains[Math.floor(Math.random() * domains.length)];

      // 生成系统权限访问列表
      const systemAccess = [];
      const accessCount = Math.floor(Math.random() * 3) + 1; // 1-3个系统

      const selectedSystems = systemsInfo
        .sort(() => Math.random() - 0.5)
        .slice(0, accessCount);

      for (const system of selectedSystems) {
        const roleId = `role_${system.code}_${
          Math.floor(Math.random() * 5) + 1
        }`;
        const roleName =
          roleNames[Math.floor(Math.random() * roleNames.length)];
        const grantedAt = new Date(
          Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
        ).toISOString();

        systemAccess.push({
          userId: id,
          systemCode: system.code,
          systemName: system.name,
          roleId,
          roleName,
          status:
            Math.random() > 0.1
              ? ("active" as const)
              : Math.random() > 0.5
              ? ("expired" as const)
              : ("inactive" as const),
          grantedAt,
          grantedBy: `admin${Math.floor(Math.random() * 3) + 1}`,
          expiredAt:
            Math.random() > 0.7
              ? new Date(
                  Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000
                ).toISOString()
              : undefined,
        });
      }

      users.push({
        id,
        username,
        nickname,
        email: `${username}@${domain}`,
        phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(
          8,
          "0"
        )}`,
        status: Math.random() > 0.1 ? "active" : "inactive",
        systemAccess,
        // 兼容性字段
        systemCode: selectedSystems[0]?.code,
        roleIds: systemAccess.map((a) => a.roleId),
        rolesCount: systemAccess.length,
        lastLoginAt:
          Math.random() > 0.3
            ? new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ).toISOString()
            : undefined,
        createdAt: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return users;
  }

  // 生成角色数据
  static generateRoles(count: number = 20): Role[] {
    const roles: Role[] = [];
    const roleNames = [
      "系统管理员",
      "用户管理员",
      "角色管理员",
      "资源管理员",
      "审计员",
      "财务专员",
      "人事专员",
      "销售员",
      "客服专员",
      "技术支持",
      "产品经理",
      "项目经理",
    ];
    const systems = ["PERMISSION_SYSTEM", "USER_CENTER", "ADMIN"];

    for (let i = 0; i < count; i++) {
      const id = String(this.roleIdCounter++);
      const systemCode = systems[Math.floor(Math.random() * systems.length)];

      roles.push({
        id,
        name:
          roleNames[i % roleNames.length] +
          (Math.floor(i / roleNames.length) > 0
            ? Math.floor(i / roleNames.length) + 1
            : ""),
        description: `${roleNames[i % roleNames.length]}的描述`,
        level: Math.floor(Math.random() * 5) + 1,
        systemCode,
        members: Math.floor(Math.random() * 50),
        createdAt: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return roles;
  }

  // 生成资源数据
  static generateResources(): Resource[] {
    const resources: Resource[] = [
      {
        id: "1",
        name: "用户管理",
        type: "M",
        icon: "UserOutlined",
        sort: 1,
        systemCode: "PERMISSION_SYSTEM",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        children: [
          {
            id: "1-1",
            parentId: "1",
            name: "用户列表",
            type: "V",
            url: "/user/list",
            permCode: "user:list",
            sort: 1,
            systemCode: "PERMISSION_SYSTEM",
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
          {
            id: "1-2",
            parentId: "1",
            name: "新增用户",
            type: "A",
            permCode: "user:create",
            sort: 2,
            systemCode: "PERMISSION_SYSTEM",
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
      },
      {
        id: "2",
        name: "角色管理",
        type: "M",
        icon: "SafetyOutlined",
        sort: 2,
        systemCode: "PERMISSION_SYSTEM",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        children: [
          {
            id: "2-1",
            parentId: "2",
            name: "角色列表",
            type: "V",
            url: "/role/list",
            permCode: "role:list",
            sort: 1,
            systemCode: "PERMISSION_SYSTEM",
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
          },
        ],
      },
    ];

    return resources;
  }

  // 生成系统数据
  static generateSystems(): System[] {
    return [
      {
        code: "PERMISSION_SYSTEM",
        name: "权限管理系统",
        description: "统一的权限管理和用户管理系统",
        status: "active",
      },
      {
        code: "USER_CENTER",
        name: "用户中心",
        description: "统一的用户身份认证和基础信息管理",
        status: "active",
      },
      {
        code: "ADMIN",
        name: "管理后台",
        description: "系统管理和配置后台",
        status: "active",
      },
    ];
  }

  // 生成系统菜单数据
  static generateSystemMenus(systemCode: string): SystemMenu[] {
    const baseMenus = [
      {
        id: `${systemCode}_menu_1`,
        parentId: undefined,
        name: "用户管理",
        type: "M" as const,
        icon: "UserOutlined",
        sort: 1,
        systemCode,
        relatedPermissions: [`${systemCode.toLowerCase()}:user:view`],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: `${systemCode}_menu_2`,
        parentId: `${systemCode}_menu_1`,
        name: "用户列表",
        type: "V" as const,
        url: "/user/list",
        sort: 1,
        systemCode,
        relatedPermissions: [`${systemCode.toLowerCase()}:user:list`],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: `${systemCode}_menu_3`,
        parentId: undefined,
        name: "角色管理",
        type: "M" as const,
        icon: "SafetyOutlined",
        sort: 2,
        systemCode,
        relatedPermissions: [`${systemCode.toLowerCase()}:role:view`],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    return baseMenus;
  }

  // 生成系统权限数据
  static generateSystemPermissions(systemCode: string): SystemPermission[] {
    const basePermissions = [
      {
        id: `${systemCode}_perm_1`,
        code: `${systemCode.toLowerCase()}:user:view`,
        name: "用户查看",
        description: "查看用户信息的权限",
        groupName: "用户管理",
        type: "MENU" as const,
        systemCode,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: `${systemCode}_perm_2`,
        code: `${systemCode.toLowerCase()}:user:list`,
        name: "用户列表",
        description: "查看用户列表的权限",
        groupName: "用户管理",
        type: "API" as const,
        apiPath: "/api/users",
        systemCode,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: `${systemCode}_perm_3`,
        code: `${systemCode.toLowerCase()}:user:create`,
        name: "用户创建",
        description: "创建新用户的权限",
        groupName: "用户管理",
        type: "BUTTON" as const,
        systemCode,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: `${systemCode}_perm_4`,
        code: `${systemCode.toLowerCase()}:role:view`,
        name: "角色查看",
        description: "查看角色信息的权限",
        groupName: "角色管理",
        type: "MENU" as const,
        systemCode,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    return basePermissions;
  }
}

// Mock数据存储
export class MockDataStore {
  private static users = MockGenerator.generateUsers();
  private static roles = MockGenerator.generateRoles();
  private static resources = MockGenerator.generateResources();
  private static systems = MockGenerator.generateSystems();

  // 用户相关
  static getUsers(params: any = {}): PaginationResponse<User> {
    let filteredUsers = [...this.users];

    // 搜索过滤
    if (params.keyword) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.username.includes(params.keyword) ||
          user.nickname?.includes(params.keyword) ||
          user.email?.includes(params.keyword)
      );
    }

    // 状态过滤
    if (params.status) {
      filteredUsers = filteredUsers.filter(
        (user) => user.status === params.status
      );
    }

    // 分页
    const limit = params.limit || 20;
    const page = params.cursor
      ? parseInt(params.cursor.replace("page_", ""))
      : 1;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filteredUsers.slice(start, end),
      total: filteredUsers.length,
      nextCursor: end < filteredUsers.length ? `page_${page + 1}` : undefined,
    };
  }

  static getUser(id: string): User | null {
    return this.users.find((user) => user.id === id) || null;
  }

  static createUser(userData: any): User {
    // 处理系统权限
    const systemAccess = [];
    if (userData.systemCodes && userData.systemCodes.length > 0) {
      const systemsInfo = [
        { code: "PERMISSION_SYSTEM", name: "权限管理系统" },
        { code: "USER_CENTER", name: "用户中心" },
        { code: "ADMIN", name: "管理后台" },
      ];

      for (const systemCode of userData.systemCodes) {
        const systemInfo = systemsInfo.find((s) => s.code === systemCode);
        if (systemInfo) {
          systemAccess.push({
            userId: String(Date.now()),
            systemCode: systemInfo.code,
            systemName: systemInfo.name,
            roleId: undefined, // 待分配
            roleName: undefined,
            status: "inactive" as const, // 新创建的用户默认无权限
            grantedAt: new Date().toISOString(),
            grantedBy: "system",
            expiredAt: undefined,
          });
        }
      }
    }

    const newUser: User = {
      id: String(Date.now()),
      username: userData.username,
      nickname: userData.nickname,
      email: userData.email,
      phone: userData.phone,
      status: userData.status || "active",
      systemAccess,
      // 兼容性字段
      systemCode: userData.systemCodes?.[0] || "PERMISSION_SYSTEM",
      roleIds: [],
      rolesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.unshift(newUser);
    return newUser;
  }

  static updateUser(id: string, userData: any): User | null {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    return this.users[userIndex];
  }

  static deleteUser(id: string): boolean {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
  }

  // 角色相关
  static getRoles(params: any = {}): PaginationResponse<Role> {
    let filteredRoles = [...this.roles];

    if (params.keyword) {
      filteredRoles = filteredRoles.filter((role) =>
        role.name.includes(params.keyword)
      );
    }

    const limit = params.limit || 20;
    const page = params.cursor
      ? parseInt(params.cursor.replace("page_", ""))
      : 1;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filteredRoles.slice(start, end),
      total: filteredRoles.length,
      nextCursor: end < filteredRoles.length ? `page_${page + 1}` : undefined,
    };
  }

  static getRole(id: string): Role | null {
    return this.roles.find((role) => role.id === id) || null;
  }

  static createRole(roleData: any): Role {
    const newRole: Role = {
      id: String(Date.now()),
      name: roleData.name,
      description: roleData.description,
      level: roleData.level || 1,
      systemCode: roleData.systemCode || "PERMISSION_SYSTEM",
      members: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.roles.unshift(newRole);
    return newRole;
  }

  static updateRole(id: string, roleData: any): Role | null {
    const roleIndex = this.roles.findIndex((role) => role.id === id);
    if (roleIndex === -1) return null;

    this.roles[roleIndex] = {
      ...this.roles[roleIndex],
      ...roleData,
      updatedAt: new Date().toISOString(),
    };

    return this.roles[roleIndex];
  }

  static deleteRole(id: string): boolean {
    const roleIndex = this.roles.findIndex((role) => role.id === id);
    if (roleIndex === -1) return false;

    this.roles.splice(roleIndex, 1);
    return true;
  }

  // 资源相关
  static getResources(): Resource[] {
    return this.resources;
  }

  // 系统相关
  static getSystems(): System[] {
    return this.systems;
  }

  static getManageableSystems(): System[] {
    // 模拟用户可管理的系统（当前用户可管理所有系统）
    return this.systems.filter((system) => system.status === "active");
  }

  static getAccessibleSystems(): System[] {
    // 模拟用户可访问的系统
    return this.systems.filter((system) => system.status === "active");
  }

  static getSystemMenuTree(systemCode: string): SystemMenu[] {
    const menus = MockGenerator.generateSystemMenus(systemCode);
    // 构建树形结构
    const menuMap = new Map();
    const rootMenus: SystemMenu[] = [];

    menus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    menus.forEach((menu) => {
      const menuItem = menuMap.get(menu.id);
      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parent = menuMap.get(menu.parentId);
        parent.children.push(menuItem);
      } else {
        rootMenus.push(menuItem);
      }
    });

    return rootMenus;
  }

  static getSystemPermissions(
    systemCode: string,
    params: any = {}
  ): PaginationResponse<SystemPermission> {
    const permissions = MockGenerator.generateSystemPermissions(systemCode);

    // 根据参数过滤
    let filtered = permissions;
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = permissions.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.code.toLowerCase().includes(keyword)
      );
    }
    if (params.type) {
      filtered = filtered.filter((p) => p.type === params.type);
    }
    if (params.groupName) {
      filtered = filtered.filter((p) => p.groupName === params.groupName);
    }

    const limit = params.limit || 20;
    const page = params.cursor
      ? parseInt(params.cursor.replace("page_", ""))
      : 1;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filtered.slice(start, end),
      total: filtered.length,
      nextCursor: end < filtered.length ? `page_${page + 1}` : undefined,
    };
  }

  static getSystemRoles(
    systemCode: string,
    params: any = {}
  ): PaginationResponse<SystemRole> {
    // 为指定系统生成角色
    const systemRoles: SystemRole[] = [
      {
        id: `${systemCode}_role_1`,
        systemCode,
        name: "系统管理员",
        description: `${systemCode}系统的管理员角色`,
        permissions: [
          `${systemCode.toLowerCase()}:user:view`,
          `${systemCode.toLowerCase()}:user:list`,
          `${systemCode.toLowerCase()}:user:create`,
          `${systemCode.toLowerCase()}:role:view`,
        ],
        level: 1,
        members: 5,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: `${systemCode}_role_2`,
        systemCode,
        name: "普通用户",
        description: `${systemCode}系统的普通用户角色`,
        permissions: [
          `${systemCode.toLowerCase()}:user:view`,
          `${systemCode.toLowerCase()}:user:list`,
        ],
        level: 3,
        members: 20,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    // 根据参数过滤
    let filtered = systemRoles;
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = systemRoles.filter(
        (r) =>
          r.name.toLowerCase().includes(keyword) ||
          r.description.toLowerCase().includes(keyword)
      );
    }

    const limit = params.limit || 20;
    const page = params.cursor
      ? parseInt(params.cursor.replace("page_", ""))
      : 1;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filtered.slice(start, end),
      total: filtered.length,
      nextCursor: end < filtered.length ? `page_${page + 1}` : undefined,
    };
  }

  // 系统管理方法
  static getSystem(code: string): System | null {
    return this.systems.find((s) => s.code === code) || null;
  }

  static addSystem(systemData: System): System {
    const newSystem = {
      ...systemData,
    };
    this.systems.push(newSystem);
    return newSystem;
  }

  static updateSystem(code: string, data: Partial<System>): System | null {
    const index = this.systems.findIndex((s) => s.code === code);
    if (index === -1) return null;

    this.systems[index] = {
      ...this.systems[index],
      ...data,
    };
    return this.systems[index];
  }

  static updateSystemStatus(
    code: string,
    status: "active" | "inactive"
  ): System | null {
    return this.updateSystem(code, { status });
  }

  static deleteSystem(code: string): boolean {
    const index = this.systems.findIndex((s) => s.code === code);
    if (index === -1) return false;

    this.systems.splice(index, 1);
    return true;
  }
}

// 创建Mock响应
function createMockResponse<T>(data: T, message = "操作成功"): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
  };
}

// 模拟网络延迟
function delay(ms: number = 300 + Math.random() * 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mock拦截器
export class MockInterceptor {
  static async handleRequest(config: AxiosRequestConfig): Promise<any> {
    await delay(); // 模拟网络延迟

    const { url, method, data, params } = config;
    const normalizedUrl = url?.replace(/^\/api/, "") || "";

    console.log(`[Mock] ${method?.toUpperCase()} ${normalizedUrl}`, {
      data,
      params,
    });

    try {
      // 用户API
      if (normalizedUrl.startsWith("/users")) {
        return this.handleUserApi(normalizedUrl, method!, data, params);
      }

      // 角色API
      if (normalizedUrl.startsWith("/roles")) {
        return this.handleRoleApi(normalizedUrl, method!, data, params);
      }

      // 资源API
      if (normalizedUrl.startsWith("/resources")) {
        return this.handleResourceApi(normalizedUrl, method!, data, params);
      }

      // Dashboard API
      if (normalizedUrl.startsWith("/dashboard")) {
        return this.handleDashboardApi(normalizedUrl, method!, data, params);
      }

      // 审计日志API
      if (normalizedUrl.startsWith("/audit")) {
        return this.handleAuditApi(normalizedUrl, method!, data, params);
      }

      // 系统API
      if (normalizedUrl.startsWith("/systems")) {
        return this.handleSystemApi(normalizedUrl, method!, data, params);
      }

      // 认证API (已在auth store中处理)
      if (normalizedUrl.startsWith("/auth")) {
        throw new Error("Auth API should be handled by auth store mock");
      }

      // 默认404
      throw new Error(`Mock API not found: ${method} ${normalizedUrl}`);
    } catch (error) {
      console.error("[Mock Error]", error);
      throw error;
    }
  }

  private static handleUserApi(
    url: string,
    method: string,
    data: any,
    params: any
  ) {
    const httpMethod = method.toUpperCase();

    if (httpMethod === "GET" && url === "/users") {
      return createMockResponse(MockDataStore.getUsers(params));
    }

    if (httpMethod === "GET" && url.match(/^\/users\/(\w+)$/)) {
      const id = url.split("/")[2];
      const user = MockDataStore.getUser(id);
      if (!user) throw new Error("用户不存在");
      return createMockResponse(user);
    }

    if (httpMethod === "POST" && url === "/users") {
      const newUser = MockDataStore.createUser(data);
      return createMockResponse(newUser, "用户创建成功");
    }

    if (httpMethod === "PUT" && url.match(/^\/users\/(\w+)$/)) {
      const id = url.split("/")[2];
      const updatedUser = MockDataStore.updateUser(id, data);
      if (!updatedUser) throw new Error("用户不存在");
      return createMockResponse(updatedUser, "用户更新成功");
    }

    if (httpMethod === "DELETE" && url.match(/^\/users\/(\w+)$/)) {
      const id = url.split("/")[2];
      const deleted = MockDataStore.deleteUser(id);
      if (!deleted) throw new Error("用户不存在");
      return createMockResponse(null, "用户删除成功");
    }

    if (
      httpMethod === "POST" &&
      url.match(/^\/users\/(\w+)\/reset-password$/)
    ) {
      return createMockResponse({ password: "123456" }, "密码重置成功");
    }

    if (httpMethod === "PATCH" && url.match(/^\/users\/(\w+)\/status$/)) {
      const id = url.split("/")[2];
      const user = MockDataStore.getUser(id);
      if (!user) throw new Error("用户不存在");

      const updatedUser = MockDataStore.updateUser(id, { status: data.status });
      return createMockResponse(updatedUser, "状态更新成功");
    }

    if (httpMethod === "GET" && url.match(/^\/users\/(\w+)\/roles$/)) {
      const id = url.split("/")[2];
      const user = MockDataStore.getUser(id);
      return createMockResponse(user?.roleIds || []);
    }

    if (httpMethod === "PUT" && url.match(/^\/users\/(\w+)\/roles$/)) {
      const id = url.split("/")[2];
      const updatedUser = MockDataStore.updateUser(id, {
        roleIds: data.roleIds,
      });
      return createMockResponse(updatedUser, "角色分配成功");
    }

    // 获取用户系统权限
    if (httpMethod === "GET" && url.match(/^\/users\/(\w+)\/system-access$/)) {
      const userId = url.split("/")[2];
      // 模拟用户系统权限数据
      const systemAccess = [
        {
          systemCode: "PERMISSION_SYSTEM",
          systemName: "权限管理系统",
          status: "active",
          currentRole: "系统管理员",
          grantedAt: "2024-01-01T00:00:00Z",
        },
        {
          systemCode: "USER_CENTER",
          systemName: "用户中心",
          status: "active",
          currentRole: "身份管理员",
          grantedAt: "2024-01-01T00:00:00Z",
        },
        {
          systemCode: "ADMIN",
          systemName: "管理后台",
          status: "inactive",
          currentRole: null,
          grantedAt: null,
        },
      ];
      return createMockResponse(systemAccess);
    }

    // 分配用户系统角色
    if (httpMethod === "POST" && url.match(/^\/users\/(\w+)\/system-access$/)) {
      return createMockResponse(null, "系统角色分配成功");
    }

    // 移除用户系统权限
    if (
      httpMethod === "DELETE" &&
      url.match(/^\/users\/(\w+)\/system-access\/(\w+)$/)
    ) {
      return createMockResponse(null, "系统权限移除成功");
    }

    // 批量分配用户角色
    if (
      httpMethod === "POST" &&
      url.match(/^\/users\/(\w+)\/batch-assign-roles$/)
    ) {
      const userId = url.split("/")[2];
      const user = MockDataStore.getUser(userId);
      if (!user) throw new Error("用户不存在");

      // 更新用户的系统权限
      const systemsInfo = [
        { code: "PERMISSION_SYSTEM", name: "权限管理系统" },
        { code: "USER_CENTER", name: "用户中心" },
        { code: "ADMIN", name: "管理后台" },
      ];

      const updatedSystemAccess = data.systemRoles.map((sr: any) => {
        const systemInfo = systemsInfo.find((s) => s.code === sr.systemCode);
        const roleNames = [
          "系统管理员",
          "用户管理员",
          "角色管理员",
          "审计员",
          "普通用户",
        ];
        const roleName =
          roleNames[Math.floor(Math.random() * roleNames.length)];

        return {
          userId,
          systemCode: sr.systemCode,
          systemName: systemInfo?.name || sr.systemCode,
          roleId: sr.roleId,
          roleName,
          status: "active" as const,
          grantedAt: new Date().toISOString(),
          grantedBy: "admin",
          expiredAt: undefined,
        };
      });

      MockDataStore.updateUser(userId, {
        systemAccess: updatedSystemAccess,
        roleIds: data.systemRoles.map((sr: any) => sr.roleId),
        rolesCount: data.systemRoles.length,
      });

      return createMockResponse(null, "批量角色分配成功");
    }

    throw new Error(`User API not found: ${httpMethod} ${url}`);
  }

  private static handleRoleApi(
    url: string,
    method: string,
    data: any,
    params: any
  ) {
    const httpMethod = method.toUpperCase();

    if (httpMethod === "GET" && url === "/roles") {
      return createMockResponse(MockDataStore.getRoles(params));
    }

    if (httpMethod === "GET" && url.match(/^\/roles\/(\w+)$/)) {
      const id = url.split("/")[2];
      const role = MockDataStore.getRole(id);
      if (!role) throw new Error("角色不存在");
      return createMockResponse(role);
    }

    if (httpMethod === "POST" && url === "/roles") {
      const newRole = MockDataStore.createRole(data);
      return createMockResponse(newRole, "角色创建成功");
    }

    if (httpMethod === "PUT" && url.match(/^\/roles\/(\w+)$/)) {
      const id = url.split("/")[2];
      const updatedRole = MockDataStore.updateRole(id, data);
      if (!updatedRole) throw new Error("角色不存在");
      return createMockResponse(updatedRole, "角色更新成功");
    }

    if (httpMethod === "DELETE" && url.match(/^\/roles\/(\w+)$/)) {
      const id = url.split("/")[2];
      const deleted = MockDataStore.deleteRole(id);
      if (!deleted) throw new Error("角色不存在");
      return createMockResponse(null, "角色删除成功");
    }

    if (httpMethod === "GET" && url.match(/^\/roles\/(\w+)\/perms$/)) {
      return createMockResponse(["user:list", "user:create", "role:list"]);
    }

    if (httpMethod === "PUT" && url.match(/^\/roles\/(\w+)\/perms$/)) {
      return createMockResponse(null, "权限分配成功");
    }

    if (httpMethod === "GET" && url.match(/^\/roles\/(\w+)\/members$/)) {
      const roleId = url.split("/")[2];
      const role = MockDataStore.getRole(roleId);
      if (!role) throw new Error("角色不存在");

      // 随机返回一些用户作为角色成员
      const allUsers = MockDataStore.getUsers({ limit: 100 }).items;
      const memberCount = Math.min(role.members || 0, allUsers.length);
      const members = allUsers.slice(0, memberCount);

      return createMockResponse(members);
    }

    if (httpMethod === "POST" && url.match(/^\/roles\/(\w+)\/members$/)) {
      const roleId = url.split("/")[2];
      const role = MockDataStore.getRole(roleId);
      if (!role) throw new Error("角色不存在");

      // 添加成员
      return createMockResponse(null, "成员添加成功");
    }

    if (
      httpMethod === "DELETE" &&
      url.match(/^\/roles\/(\w+)\/members\/(\w+)$/)
    ) {
      const roleId = url.split("/")[2];
      const userId = url.split("/")[4];
      const role = MockDataStore.getRole(roleId);
      if (!role) throw new Error("角色不存在");

      // 移除成员
      return createMockResponse(null, "成员移除成功");
    }

    throw new Error(`Role API not found: ${httpMethod} ${url}`);
  }

  private static handleResourceApi(
    url: string,
    method: string,
    data: any,
    params: any
  ) {
    const httpMethod = method.toUpperCase();

    if (httpMethod === "GET" && url === "/resources") {
      return createMockResponse(MockDataStore.getResources());
    }

    if (httpMethod === "GET" && url === "/resources/tree") {
      return createMockResponse(MockDataStore.getResources());
    }

    throw new Error(`Resource API not found: ${httpMethod} ${url}`);
  }

  private static handleDashboardApi(
    url: string,
    method: string,
    data: any,
    params: any
  ) {
    const httpMethod = method.toUpperCase();

    if (httpMethod === "GET" && url === "/dashboard/stats") {
      return createMockResponse({
        userCount: 1234,
        roleCount: 28,
        resourceCount: 156,
        todayOperations: 89,
      });
    }

    if (httpMethod === "GET" && url === "/dashboard/activities") {
      return createMockResponse([
        {
          id: "1",
          type: "login",
          actor: "张三",
          description: "用户登录系统",
          ip: "192.168.1.100",
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          type: "role_create",
          actor: "管理员",
          description: "创建角色：财务专员",
          ip: "192.168.1.101",
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
      ]);
    }

    throw new Error(`Dashboard API not found: ${httpMethod} ${url}`);
  }

  private static handleAuditApi(
    url: string,
    method: string,
    data: any,
    params: any
  ) {
    const httpMethod = method.toUpperCase();

    if (httpMethod === "GET" && url === "/audit/logs") {
      // 生成模拟审计日志
      const logs = [];
      const actions = [
        "login",
        "logout",
        "create_user",
        "update_user",
        "delete_user",
        "create_role",
        "update_role",
      ];
      const actors = ["张三", "李四", "王五", "管理员", "系统"];

      for (let i = 0; i < 50; i++) {
        logs.push({
          id: String(i + 1),
          type: actions[Math.floor(Math.random() * actions.length)],
          actor: actors[Math.floor(Math.random() * actors.length)],
          target: `用户${Math.floor(Math.random() * 100) + 1}`,
          description: `执行了${
            actions[Math.floor(Math.random() * actions.length)]
          }操作`,
          ip: `192.168.1.${Math.floor(Math.random() * 255) + 1}`,
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          createdAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });
      }

      // 分页处理
      const limit = params.limit || 20;
      const page = params.cursor
        ? parseInt(params.cursor.replace("page_", ""))
        : 1;
      const start = (page - 1) * limit;
      const end = start + limit;

      return createMockResponse({
        items: logs.slice(start, end),
        total: logs.length,
        nextCursor: end < logs.length ? `page_${page + 1}` : undefined,
      });
    }

    throw new Error(`Audit API not found: ${httpMethod} ${url}`);
  }

  private static handleSystemApi(
    url: string,
    method: string,
    data: any,
    params: any
  ) {
    const httpMethod = method.toUpperCase();

    // 获取用户可管理的系统
    if (httpMethod === "GET" && url === "/systems/manageable") {
      return createMockResponse(MockDataStore.getManageableSystems());
    }

    // 获取用户可访问的系统
    if (httpMethod === "GET" && url === "/systems/accessible") {
      return createMockResponse(MockDataStore.getAccessibleSystems());
    }

    // 获取所有系统
    if (httpMethod === "GET" && url === "/systems") {
      return createMockResponse(MockDataStore.getSystems());
    }

    // 获取系统菜单树
    if (httpMethod === "GET" && url.match(/^\/systems\/(\w+)\/menus\/tree$/)) {
      const systemCode = url.split("/")[2];
      return createMockResponse(MockDataStore.getSystemMenuTree(systemCode));
    }

    // 获取系统权限列表
    if (httpMethod === "GET" && url.match(/^\/systems\/(\w+)\/permissions$/)) {
      const systemCode = url.split("/")[2];
      return createMockResponse(
        MockDataStore.getSystemPermissions(systemCode, params)
      );
    }

    // 获取系统角色列表
    if (httpMethod === "GET" && url.match(/^\/systems\/(\w+)\/roles$/)) {
      const systemCode = url.split("/")[2];
      return createMockResponse(
        MockDataStore.getSystemRoles(systemCode, params)
      );
    }

    // 创建系统角色
    if (httpMethod === "POST" && url.match(/^\/systems\/(\w+)\/roles$/)) {
      const systemCode = url.split("/")[2];
      const roleData = {
        ...data,
        id: `${systemCode}_role_${Date.now()}`,
        systemCode,
        members: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return createMockResponse(roleData, "角色创建成功");
    }

    // 获取系统角色详情
    if (httpMethod === "GET" && url.match(/^\/systems\/(\w+)\/roles\/(\w+)$/)) {
      const systemCode = url.split("/")[2];
      const roleId = url.split("/")[4];

      // 模拟角色详情
      const roleDetail = {
        id: roleId,
        systemCode,
        name: "模拟角色",
        description: "这是一个模拟的角色详情",
        permissions: [
          `${systemCode.toLowerCase()}:user:view`,
          `${systemCode.toLowerCase()}:user:list`,
        ],
        level: 2,
        members: 10,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      return createMockResponse(roleDetail);
    }

    // 更新系统角色
    if (httpMethod === "PUT" && url.match(/^\/systems\/(\w+)\/roles\/(\w+)$/)) {
      const systemCode = url.split("/")[2];
      const roleId = url.split("/")[4];

      const updatedRole = {
        ...data,
        id: roleId,
        systemCode,
        updatedAt: new Date().toISOString(),
      };

      return createMockResponse(updatedRole, "角色更新成功");
    }

    // 删除系统角色
    if (
      httpMethod === "DELETE" &&
      url.match(/^\/systems\/(\w+)\/roles\/(\w+)$/)
    ) {
      return createMockResponse(null, "角色删除成功");
    }

    // 获取角色权限
    if (
      httpMethod === "GET" &&
      url.match(/^\/systems\/(\w+)\/roles\/(\w+)\/permissions$/)
    ) {
      const systemCode = url.split("/")[2];
      return createMockResponse([
        `${systemCode.toLowerCase()}:user:view`,
        `${systemCode.toLowerCase()}:user:list`,
        `${systemCode.toLowerCase()}:role:view`,
      ]);
    }

    // 更新角色权限
    if (
      httpMethod === "PUT" &&
      url.match(/^\/systems\/(\w+)\/roles\/(\w+)\/permissions$/)
    ) {
      return createMockResponse(null, "权限配置成功");
    }

    // 获取角色成员
    if (
      httpMethod === "GET" &&
      url.match(/^\/systems\/(\w+)\/roles\/(\w+)\/members$/)
    ) {
      const users = MockDataStore.getUsers({ limit: 10 }).items;
      return createMockResponse(users);
    }

    // 添加角色成员
    if (
      httpMethod === "POST" &&
      url.match(/^\/systems\/(\w+)\/roles\/(\w+)\/members$/)
    ) {
      return createMockResponse(null, "成员添加成功");
    }

    // 移除角色成员
    if (
      httpMethod === "DELETE" &&
      url.match(/^\/systems\/(\w+)\/roles\/(\w+)\/members\/(\w+)$/)
    ) {
      return createMockResponse(null, "成员移除成功");
    }

    // 创建系统
    if (httpMethod === "POST" && url === "/systems") {
      const newSystem = {
        ...data,
      };
      MockDataStore.addSystem(newSystem);
      return createMockResponse(newSystem, "系统创建成功");
    }

    // 获取单个系统
    if (httpMethod === "GET" && url.match(/^\/systems\/(\w+)$/)) {
      const systemCode = url.split("/")[2];
      const system = MockDataStore.getSystem(systemCode);
      if (!system) throw new Error("系统不存在");
      return createMockResponse(system);
    }

    // 更新系统
    if (httpMethod === "PUT" && url.match(/^\/systems\/(\w+)$/)) {
      const systemCode = url.split("/")[2];
      const updatedSystem = MockDataStore.updateSystem(systemCode, data);
      if (!updatedSystem) throw new Error("系统不存在");
      return createMockResponse(updatedSystem, "系统更新成功");
    }

    // 更新系统状态
    if (httpMethod === "PATCH" && url.match(/^\/systems\/(\w+)\/status$/)) {
      const systemCode = url.split("/")[2];
      const updatedSystem = MockDataStore.updateSystemStatus(
        systemCode,
        data.status
      );
      if (!updatedSystem) throw new Error("系统不存在");
      return createMockResponse(null, "系统状态更新成功");
    }

    // 删除系统
    if (httpMethod === "DELETE" && url.match(/^\/systems\/(\w+)$/)) {
      const systemCode = url.split("/")[2];
      const deleted = MockDataStore.deleteSystem(systemCode);
      if (!deleted) throw new Error("系统不存在");
      return createMockResponse(null, "系统删除成功");
    }

    throw new Error(`System API not found: ${httpMethod} ${url}`);
  }
}
