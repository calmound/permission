// API 响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页类型
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginationResponse<T> {
  items: T[];
  nextCursor?: string;
  total?: number;
}

// 用户相关类型 - 全局用户（存储在用户中心）
export interface GlobalUser {
  id: string;
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: "active" | "inactive";
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, any>;
}

// User接口继承GlobalUser并添加系统权限信息
export interface User extends GlobalUser {
  deptId?: string;
  deptName?: string;
  systemAccess: UserSystemAccess[]; // 用户的系统权限列表（必需字段）

  // 兼容性字段（已废弃，仅为向后兼容保留）
  systemCode?: string; // @deprecated 请使用systemAccess
  roleIds?: string[]; // @deprecated 请使用systemAccess中的roles
  rolesCount?: number; // @deprecated 可通过systemAccess计算得出
}

export interface CreateUserDto {
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  password: string;
  status?: "active" | "inactive";
  systemCodes?: string[]; // 选择的系统列表
  customFields?: Record<string, any>;
}

export interface UpdateUserDto {
  nickname?: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive";
  systemCodes?: string[]; // 更新系统归属
  customFields?: Record<string, any>;
}

// 批量角色分配DTO
export interface BatchAssignRolesDto {
  userId: string;
  systemRoles: Array<{
    systemCode: string;
    roleId: string;
  }>;
}

// 用户系统权限管理DTO
export interface GrantSystemAccessDto {
  userId: string;
  systemCode: string;
  roleIds: string[];
  expiredAt?: string;
  grantedBy: string;
  description?: string;
}

export interface UpdateUserSystemRolesDto {
  userId: string;
  systemCode: string;
  roleIds: string[];
  expiredAt?: string;
}

// 角色相关类型（兼容性保持）
export interface Role {
  id: string;
  name: string;
  level?: number;
  description?: string;
  systemCode?: string;
  members?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  level?: number;
  description?: string;
  systemCode: string; // 现在必填，明确角色所属系统
}

export interface UpdateRoleDto {
  name?: string;
  level?: number;
  description?: string;
}

// 系统角色管理DTO
export interface CreateSystemRoleDto {
  name: string;
  description: string;
  systemCode: string;
  level?: number;
  permissions?: string[];
}

export interface UpdateSystemRoleDto {
  name?: string;
  description?: string;
  level?: number;
}

export interface UpdateRolePermissionsDto {
  roleId: string;
  systemCode: string;
  permissions: string[];
}

// 资源/权限相关类型
export type ResourceType = "M" | "V" | "A"; // Module/View/Action

export interface Resource {
  id: string;
  parentId?: string;
  name: string;
  type: ResourceType;
  url?: string;
  component?: string;
  icon?: string;
  permCode?: string;
  keepAlive?: boolean;
  systemCode?: string;
  sort?: number;
  createdAt: string;
  updatedAt: string;
  children?: Resource[];
}

export interface CreateResourceDto {
  parentId?: string;
  name: string;
  type: ResourceType;
  url?: string;
  component?: string;
  icon?: string;
  permCode?: string;
  keepAlive?: boolean;
  systemCode?: string;
  sort?: number;
}

export interface UpdateResourceDto {
  name?: string;
  url?: string;
  component?: string;
  icon?: string;
  permCode?: string;
  keepAlive?: boolean;
  sort?: number;
}

// 系统菜单管理DTO
export interface CreateSystemMenuDto {
  systemCode: string;
  parentId?: string;
  name: string;
  type: "M" | "V" | "A";
  url?: string;
  component?: string;
  icon?: string;
  sort: number;
  keepAlive?: boolean;
  visible?: boolean;
  autoGeneratePermissions?: boolean; // 是否自动生成权限
  permissionTypes?: ("list" | "create" | "edit" | "delete")[]; // 自动生成的权限类型
}

export interface UpdateSystemMenuDto {
  name?: string;
  type?: "M" | "V" | "A";
  url?: string;
  component?: string;
  icon?: string;
  sort?: number;
  keepAlive?: boolean;
  visible?: boolean;
}

// 系统权限管理DTO
export interface CreateSystemPermissionDto {
  systemCode: string;
  code: string;
  name: string;
  type: "MENU" | "BUTTON" | "API";
  groupName?: string;
  relatedMenuId?: string;
  apiPath?: string;
  description?: string;
}

export interface UpdateSystemPermissionDto {
  code?: string;
  name?: string;
  type?: "MENU" | "BUTTON" | "API";
  groupName?: string;
  relatedMenuId?: string;
  apiPath?: string;
  description?: string;
}

// 菜单权限关联DTO
export interface AddMenuPermissionDto {
  menuId: string;
  permissionId: string;
  relationType: "auto" | "manual";
}

// 权限验证DTO
export interface VerifyPermissionDto {
  systemCode: string;
  permissionCode: string;
  token: string;
}

// 菜单类型（继承自Resource，用于前端菜单渲染）
export interface Menu extends Resource {
  meta?: {
    title: string;
    icon?: string;
    keepAlive?: boolean;
    requireAuth?: boolean;
  };
}

// 权限相关类型
export interface Permission {
  id: string;
  code: string;
  name: string;
  type: "API" | "BTN";
  menuId?: string;
  systemCode?: string;
}

// 授权相关类型
export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
}

// 系统相关类型
export interface System {
  code: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
}

// 多系统权限管理相关类型
export interface UserSystemAccess {
  userId: string; // 关联全局用户
  systemCode: string; // 系统标识
  systemName: string; // 系统名称（冗余字段，便于显示）
  roleId?: string; // 该用户在此系统的角色ID（单角色）
  roleName?: string; // 角色名称（冗余字段，便于显示）
  status: "active" | "inactive" | "expired";
  grantedAt: string;
  grantedBy: string;
  expiredAt?: string;

  // 兼容性字段
  roles?: string[]; // @deprecated 改为单角色设计
}

// 系统角色 - 按系统隔离
export interface SystemRole {
  id: string;
  systemCode: string; // 所属系统
  name: string;
  description: string;
  permissions: string[]; // 权限码列表
  level?: number;
  members?: number;
  createdAt: string;
  updatedAt: string;
}

// 系统菜单 - 按系统隔离
export interface SystemMenu {
  id: string;
  systemCode: string; // 所属系统
  parentId?: string;
  name: string;
  type: "M" | "V" | "A"; // 目录/菜单/按钮
  url?: string;
  component?: string;
  icon?: string;
  sort: number;
  relatedPermissions: string[]; // 关联权限
  keepAlive?: boolean;
  visible?: boolean; // 是否在菜单中显示
  createdAt: string;
  updatedAt: string;
  children?: SystemMenu[];
}

// 系统权限 - 按系统隔离
export interface SystemPermission {
  id: string;
  systemCode: string; // 所属系统
  code: string; // 权限编码
  name: string; // 权限名称
  type: "MENU" | "BUTTON" | "API"; // 权限类型
  groupName?: string; // 权限分组
  relatedMenuId?: string; // 关联菜单
  apiPath?: string; // API路径
  description?: string; // 权限描述
  createdAt: string;
  updatedAt: string;
}

// 菜单权限关联
export interface MenuPermissionRelation {
  menuId: string;
  permissionId: string;
  systemCode: string;
  relationType: "auto" | "manual"; // 自动生成或手动关联
}

// 角色权限配置
export interface RolePermissionConfig {
  roleId: string;
  systemCode: string;
  permissions: {
    permissionId: string;
    granted: boolean;
    grantedAt: string;
    grantedBy: string;
  }[];
}

// 部门类型
export interface Department {
  id: string;
  parentId?: string;
  name: string;
  code?: string;
  sort?: number;
  children?: Department[];
}

// 操作日志类型
export interface OperationLog {
  id: string;
  type: string;
  actor: string;
  target?: string;
  description: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

// 登录相关类型
export interface LoginDto {
  username: string;
  password: string;
  captcha?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  permissions: string[];
  menus: Menu[];
}

// 表单相关类型
export interface FormState {
  loading: boolean;
  errors: Record<string, string>;
}

// 表格相关类型
export interface TableColumn {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
  sorter?: boolean;
  ellipsis?: boolean;
}

// 搜索/筛选相关类型
export interface UserSearchParams extends PaginationParams {
  keyword?: string;
  status?: "active" | "inactive";
  systemCode?: string; // 按系统筛选用户
  createdAt?: [string, string];
}

export interface RoleSearchParams extends PaginationParams {
  keyword?: string;
  systemCode?: string; // 角色所属系统
  level?: number;
}

export interface ResourceSearchParams extends PaginationParams {
  keyword?: string;
  type?: ResourceType;
  systemCode?: string;
  parentId?: string;
}

export interface SystemMenuSearchParams extends PaginationParams {
  keyword?: string;
  systemCode: string; // 必填，指定查询的系统
  type?: "M" | "V" | "A";
  parentId?: string;
}

export interface SystemPermissionSearchParams extends PaginationParams {
  keyword?: string;
  systemCode: string; // 必填，指定查询的系统
  type?: "MENU" | "BUTTON" | "API";
  groupName?: string;
  relatedMenuId?: string;
}

export interface UserSystemAccessSearchParams extends PaginationParams {
  userId?: string;
  systemCode?: string;
  status?: "active" | "inactive" | "expired";
}

export interface LogSearchParams extends PaginationParams {
  type?: string;
  actor?: string;
  startDate?: string;
  endDate?: string;
}
