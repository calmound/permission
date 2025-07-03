import { request } from "@utils/http";
import type {
  User,
  GlobalUser,
  CreateUserDto,
  UpdateUserDto,
  UserSearchParams,
  PaginationResponse,
  UserSystemAccess,
  GrantSystemAccessDto,
  UpdateUserSystemRolesDto,
  UserSystemAccessSearchParams,
  BatchAssignRolesDto,
} from "@/types";

export const userApi = {
  // 获取用户列表
  getUsers(params?: UserSearchParams): Promise<PaginationResponse<User>> {
    return request.get("/users", { params });
  },

  // 获取用户详情
  getUser(id: string): Promise<User> {
    return request.get(`/users/${id}`);
  },

  // 创建用户
  createUser(data: CreateUserDto): Promise<User> {
    return request.post("/users", data);
  },

  // 更新用户
  updateUser(id: string, data: UpdateUserDto): Promise<User> {
    return request.put(`/users/${id}`, data);
  },

  // 删除用户
  deleteUser(id: string): Promise<void> {
    return request.delete(`/users/${id}`);
  },

  // 重置密码
  resetPassword(id: string): Promise<{ password: string }> {
    return request.post(`/users/${id}/reset-password`);
  },

  // 更新用户状态
  updateStatus(id: string, status: "active" | "inactive"): Promise<void> {
    return request.patch(`/users/${id}/status`, { status });
  },

  // 获取用户角色
  getUserRoles(id: string): Promise<string[]> {
    return request.get(`/users/${id}/roles`);
  },

  // 更新用户角色（兼容性保持）
  updateUserRoles(id: string, roleIds: string[]): Promise<void> {
    return request.put(`/users/${id}/roles`, { roleIds });
  },

  // 多系统权限管理API

  // 获取用户的系统权限列表
  getUserSystemAccess(userId: string): Promise<UserSystemAccess[]> {
    return request.get(`/users/${userId}/system-access`);
  },

  // 为用户授权系统访问权限
  grantSystemAccess(data: GrantSystemAccessDto): Promise<void> {
    return request.post("/users/system-access", data);
  },

  // 更新用户在特定系统的角色
  updateUserSystemRoles(data: UpdateUserSystemRolesDto): Promise<void> {
    return request.put(
      `/users/${data.userId}/system-access/${data.systemCode}/roles`,
      {
        roleIds: data.roleIds,
        expiredAt: data.expiredAt,
      }
    );
  },

  // 移除用户的系统访问权限
  revokeSystemAccess(userId: string, systemCode: string): Promise<void> {
    return request.delete(`/users/${userId}/system-access/${systemCode}`);
  },

  // 获取用户系统权限列表（分页）
  getUserSystemAccessList(
    params: UserSystemAccessSearchParams
  ): Promise<PaginationResponse<UserSystemAccess>> {
    return request.get("/users/system-access", { params });
  },

  // 批量授权用户系统权限
  batchGrantSystemAccess(data: {
    userIds: string[];
    systemCode: string;
    roleIds: string[];
    expiredAt?: string;
    grantedBy: string;
  }): Promise<void> {
    return request.post("/users/system-access/batch", data);
  },

  // 获取全局用户信息（不包含系统特定信息）
  getGlobalUser(id: string): Promise<GlobalUser> {
    return request.get(`/users/${id}/global`);
  },

  // 更新全局用户信息
  updateGlobalUser(id: string, data: Partial<GlobalUser>): Promise<GlobalUser> {
    return request.put(`/users/${id}/global`, data);
  },

  // 验证用户系统权限
  verifyUserSystemPermission(params: {
    userId: string;
    systemCode: string;
    permissionCode: string;
  }): Promise<{ hasPermission: boolean }> {
    return request.get("/users/verify-permission", { params });
  },

  // 批量分配用户角色
  batchAssignRoles(data: {
    userId: string;
    systemRoles: Array<{
      systemCode: string;
      roleId: string;
    }>;
  }): Promise<void> {
    return request.post(`/users/${data.userId}/batch-assign-roles`, {
      systemRoles: data.systemRoles,
    });
  },
};
