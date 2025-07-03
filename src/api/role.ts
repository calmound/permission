import { request } from "@utils/http";
import type {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  RoleSearchParams,
  PaginationResponse,
  SystemRole,
  CreateSystemRoleDto,
  UpdateSystemRoleDto,
  UpdateRolePermissionsDto,
  RolePermissionConfig,
} from "@/types";

export const roleApi = {
  // 获取角色列表
  getRoles(params?: RoleSearchParams): Promise<PaginationResponse<Role>> {
    return request.get("/roles", { params });
  },

  // 获取角色详情
  getRole(id: string): Promise<Role> {
    return request.get(`/roles/${id}`);
  },

  // 创建角色
  createRole(data: CreateRoleDto): Promise<Role> {
    return request.post("/roles", data);
  },

  // 更新角色
  updateRole(id: string, data: UpdateRoleDto): Promise<Role> {
    return request.put(`/roles/${id}`, data);
  },

  // 删除角色
  deleteRole(id: string): Promise<void> {
    return request.delete(`/roles/${id}`);
  },

  // 获取角色权限
  getRolePermissions(id: string): Promise<string[]> {
    return request.get(`/roles/${id}/perms`);
  },

  // 更新角色权限
  updateRolePermissions(id: string, resourceIds: string[]): Promise<void> {
    return request.put(`/roles/${id}/perms`, { resourceIds });
  },

  // 获取角色成员
  getRoleMembers(id: string): Promise<any[]> {
    return request.get(`/roles/${id}/members`);
  },

  // 添加角色成员
  addRoleMember(roleId: string, userId: string): Promise<void> {
    return request.post(`/roles/${roleId}/members`, { userId });
  },

  // 移除角色成员
  removeRoleMember(roleId: string, userId: string): Promise<void> {
    return request.delete(`/roles/${roleId}/members/${userId}`);
  },

  // 系统角色管理API

  // 获取指定系统的角色列表
  getSystemRoles(
    systemCode: string,
    params?: Partial<RoleSearchParams>
  ): Promise<PaginationResponse<SystemRole>> {
    return request.get(`/systems/${systemCode}/roles`, { params });
  },

  // 获取系统角色详情
  getSystemRole(systemCode: string, roleId: string): Promise<SystemRole> {
    return request.get(`/systems/${systemCode}/roles/${roleId}`);
  },

  // 创建系统角色
  createSystemRole(data: CreateSystemRoleDto): Promise<SystemRole> {
    return request.post(`/systems/${data.systemCode}/roles`, data);
  },

  // 更新系统角色
  updateSystemRole(
    systemCode: string,
    roleId: string,
    data: UpdateSystemRoleDto
  ): Promise<SystemRole> {
    return request.put(`/systems/${systemCode}/roles/${roleId}`, data);
  },

  // 删除系统角色
  deleteSystemRole(systemCode: string, roleId: string): Promise<void> {
    return request.delete(`/systems/${systemCode}/roles/${roleId}`);
  },

  // 获取系统角色的权限配置
  getSystemRolePermissions(
    systemCode: string,
    roleId: string
  ): Promise<RolePermissionConfig> {
    return request.get(`/systems/${systemCode}/roles/${roleId}/permissions`);
  },

  // 更新系统角色权限配置
  updateSystemRolePermissions(data: UpdateRolePermissionsDto): Promise<void> {
    return request.put(
      `/systems/${data.systemCode}/roles/${data.roleId}/permissions`,
      {
        permissions: data.permissions,
      }
    );
  },

  // 获取系统角色成员列表
  getSystemRoleMembers(systemCode: string, roleId: string): Promise<any[]> {
    return request.get(`/systems/${systemCode}/roles/${roleId}/members`);
  },

  // 批量更新角色权限
  batchUpdateRolePermissions(data: {
    systemCode: string;
    updates: UpdateRolePermissionsDto[];
  }): Promise<void> {
    return request.post(
      `/systems/${data.systemCode}/roles/permissions/batch`,
      data.updates
    );
  },

  // 复制角色权限配置
  copyRolePermissions(data: {
    fromSystemCode: string;
    fromRoleId: string;
    toSystemCode: string;
    toRoleId: string;
  }): Promise<void> {
    return request.post("/roles/permissions/copy", data);
  },

  // 获取角色权限树（用于权限配置界面）
  getRolePermissionTree(systemCode: string, roleId: string): Promise<any[]> {
    return request.get(
      `/systems/${systemCode}/roles/${roleId}/permission-tree`
    );
  },
};
