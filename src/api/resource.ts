import { request } from "@utils/http";
import type {
  Resource,
  CreateResourceDto,
  UpdateResourceDto,
  ResourceSearchParams,
  PaginationResponse,
  SystemMenu,
  CreateSystemMenuDto,
  UpdateSystemMenuDto,
  SystemMenuSearchParams,
  SystemPermission,
  CreateSystemPermissionDto,
  UpdateSystemPermissionDto,
  SystemPermissionSearchParams,
  AddMenuPermissionDto,
  MenuPermissionRelation,
  VerifyPermissionDto,
} from "@/types";

export const resourceApi = {
  // 获取资源树
  getResourceTree(systemCode?: string): Promise<Resource[]> {
    return request.get("/resources/tree", {
      params: { systemCode },
    });
  },

  // 获取资源列表
  getResources(
    params?: ResourceSearchParams
  ): Promise<PaginationResponse<Resource>> {
    return request.get("/resources", { params });
  },

  // 获取资源详情
  getResource(id: string): Promise<Resource> {
    return request.get(`/resources/${id}`);
  },

  // 创建资源
  createResource(data: CreateResourceDto): Promise<Resource> {
    return request.post("/resources", data);
  },

  // 更新资源
  updateResource(id: string, data: UpdateResourceDto): Promise<Resource> {
    return request.put(`/resources/${id}`, data);
  },

  // 删除资源
  deleteResource(id: string): Promise<void> {
    return request.delete(`/resources/${id}`);
  },

  // 检查唯一性
  checkUnique(
    field: string,
    value: string,
    excludeId?: string
  ): Promise<boolean> {
    return request.get("/resources/check-unique", {
      params: { field, value, excludeId },
    });
  },

  // 移动资源（排序）
  moveResource(
    id: string,
    targetParentId: string,
    sort: number
  ): Promise<void> {
    return request.patch(`/resources/${id}/move`, {
      targetParentId,
      sort,
    });
  },
};

// 系统菜单管理API
export const systemMenuApi = {
  // 获取系统菜单树
  getSystemMenuTree(systemCode: string): Promise<SystemMenu[]> {
    return request.get(`/systems/${systemCode}/menus/tree`);
  },

  // 获取系统菜单列表
  getSystemMenus(
    params: SystemMenuSearchParams
  ): Promise<PaginationResponse<SystemMenu>> {
    return request.get(`/systems/${params.systemCode}/menus`, { params });
  },

  // 获取系统菜单详情
  getSystemMenu(systemCode: string, menuId: string): Promise<SystemMenu> {
    return request.get(`/systems/${systemCode}/menus/${menuId}`);
  },

  // 创建系统菜单
  createSystemMenu(data: CreateSystemMenuDto): Promise<SystemMenu> {
    return request.post(`/systems/${data.systemCode}/menus`, data);
  },

  // 更新系统菜单
  updateSystemMenu(
    systemCode: string,
    menuId: string,
    data: UpdateSystemMenuDto
  ): Promise<SystemMenu> {
    return request.put(`/systems/${systemCode}/menus/${menuId}`, data);
  },

  // 删除系统菜单
  deleteSystemMenu(systemCode: string, menuId: string): Promise<void> {
    return request.delete(`/systems/${systemCode}/menus/${menuId}`);
  },

  // 获取菜单关联的权限
  getMenuPermissions(
    systemCode: string,
    menuId: string
  ): Promise<SystemPermission[]> {
    return request.get(`/systems/${systemCode}/menus/${menuId}/permissions`);
  },

  // 添加菜单权限关联
  addMenuPermission(
    systemCode: string,
    menuId: string,
    data: AddMenuPermissionDto
  ): Promise<void> {
    return request.post(
      `/systems/${systemCode}/menus/${menuId}/permissions`,
      data
    );
  },

  // 删除菜单权限关联
  removeMenuPermission(
    systemCode: string,
    menuId: string,
    permissionId: string
  ): Promise<void> {
    return request.delete(
      `/systems/${systemCode}/menus/${menuId}/permissions/${permissionId}`
    );
  },

  // 移动菜单（排序）
  moveSystemMenu(
    systemCode: string,
    menuId: string,
    data: {
      targetParentId?: string;
      sort: number;
    }
  ): Promise<void> {
    return request.patch(`/systems/${systemCode}/menus/${menuId}/move`, data);
  },
};

// 系统权限管理API
export const systemPermissionApi = {
  // 获取系统权限列表
  getSystemPermissions(
    params: SystemPermissionSearchParams
  ): Promise<PaginationResponse<SystemPermission>> {
    return request.get(`/systems/${params.systemCode}/permissions`, { params });
  },

  // 获取系统权限详情
  getSystemPermission(
    systemCode: string,
    permissionId: string
  ): Promise<SystemPermission> {
    return request.get(`/systems/${systemCode}/permissions/${permissionId}`);
  },

  // 创建系统权限
  createSystemPermission(
    data: CreateSystemPermissionDto
  ): Promise<SystemPermission> {
    return request.post(`/systems/${data.systemCode}/permissions`, data);
  },

  // 更新系统权限
  updateSystemPermission(
    systemCode: string,
    permissionId: string,
    data: UpdateSystemPermissionDto
  ): Promise<SystemPermission> {
    return request.put(
      `/systems/${systemCode}/permissions/${permissionId}`,
      data
    );
  },

  // 删除系统权限
  deleteSystemPermission(
    systemCode: string,
    permissionId: string
  ): Promise<void> {
    return request.delete(`/systems/${systemCode}/permissions/${permissionId}`);
  },

  // 批量创建权限（通常用于菜单自动生成权限）
  batchCreatePermissions(
    systemCode: string,
    data: {
      menuId: string;
      permissionTypes: ("list" | "create" | "edit" | "delete")[];
    }
  ): Promise<SystemPermission[]> {
    return request.post(`/systems/${systemCode}/permissions/batch`, data);
  },

  // 复制权限配置
  copyPermissions(data: {
    fromSystemCode: string;
    toSystemCode: string;
    permissionIds: string[];
  }): Promise<void> {
    return request.post("/permissions/copy", data);
  },

  // 验证权限
  verifyPermission(
    data: VerifyPermissionDto
  ): Promise<{ hasPermission: boolean }> {
    return request.post("/permissions/verify", data);
  },

  // 获取权限分组
  getPermissionGroups(
    systemCode: string
  ): Promise<{ groupName: string; count: number }[]> {
    return request.get(`/systems/${systemCode}/permissions/groups`);
  },
};
