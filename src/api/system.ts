import http from "@/utils/http";
import type {
  System,
  SystemRole,
  ApiResponse,
  VerifyPermissionDto,
} from "@/types";

export const systemApi = {
  // 获取所有系统（系统管理）
  getSystems(params?: {
    keyword?: string;
    status?: "active" | "inactive";
  }): Promise<ApiResponse<System[]>> {
    return http.get("/systems", { params });
  },

  // 获取单个系统
  getSystem(systemCode: string): Promise<ApiResponse<System>> {
    return http.get(`/systems/${systemCode}`);
  },

  // 创建系统
  createSystem(data: {
    code: string;
    name: string;
    description?: string;
    status: "active" | "inactive";
  }): Promise<ApiResponse<System>> {
    return http.post("/systems", data);
  },

  // 更新系统
  updateSystem(
    systemCode: string,
    data: {
      name?: string;
      description?: string;
      status?: "active" | "inactive";
    }
  ): Promise<ApiResponse<System>> {
    return http.put(`/systems/${systemCode}`, data);
  },

  // 更新系统状态
  updateSystemStatus(
    systemCode: string,
    status: "active" | "inactive"
  ): Promise<ApiResponse<void>> {
    return http.patch(`/systems/${systemCode}/status`, { status });
  },

  // 删除系统
  deleteSystem(systemCode: string): Promise<ApiResponse<void>> {
    return http.delete(`/systems/${systemCode}`);
  },

  // 获取用户可管理的系统
  getUserManageableSystems(userId?: string): Promise<ApiResponse<System[]>> {
    return http.get("/systems/manageable", {
      params: userId ? { userId } : undefined,
    });
  },

  // 获取用户可访问的系统
  getUserAccessibleSystems(userId?: string): Promise<ApiResponse<System[]>> {
    return http.get("/systems/accessible", {
      params: userId ? { userId } : undefined,
    });
  },

  // 验证用户在指定系统中的权限
  verifySystemPermission(
    data: VerifyPermissionDto
  ): Promise<ApiResponse<boolean>> {
    return http.post("/systems/verify-permission", data);
  },

  // 获取系统配置信息
  getSystemConfig(
    systemCode: string
  ): Promise<ApiResponse<Record<string, any>>> {
    return http.get(`/systems/${systemCode}/config`);
  },

  // 更新系统配置
  updateSystemConfig(
    systemCode: string,
    config: Record<string, any>
  ): Promise<ApiResponse<void>> {
    return http.put(`/systems/${systemCode}/config`, config);
  },

  // 检查系统编码唯一性
  checkSystemCodeUnique(
    code: string,
    excludeCode?: string
  ): Promise<ApiResponse<boolean>> {
    return http.get("/systems/check-unique", {
      params: { code, excludeCode },
    });
  },

  // 获取系统角色列表
  getSystemRoles(
    systemCode: string,
    params?: { keyword?: string; status?: "active" | "inactive" }
  ): Promise<ApiResponse<{ items: SystemRole[]; total: number }>> {
    return http.get(`/systems/${systemCode}/roles`, { params });
  },
};
