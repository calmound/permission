import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { message } from "ant-design-vue";
import type { ApiResponse } from "@/types";
import { useAuthStore } from "@stores/auth";
import { MockInterceptor } from "../mocks";

// 创建axios实例
const http = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
http.interceptors.request.use(
  async (config) => {
    // 开发环境使用Mock数据
    if (true) {
      // 开发环境Mock，生产环境时设为false
      try {
        console.log(
          "[Mock] 拦截请求:",
          config.method?.toUpperCase(),
          config.url
        );
        const mockResponse = await MockInterceptor.handleRequest(config);
        return Promise.reject({
          isMockResponse: true,
          data: mockResponse,
        });
      } catch (error: any) {
        if (
          error.message?.includes("Mock API not found") ||
          error.message?.includes("Auth API should be handled")
        ) {
          // 如果Mock中没有处理该API，继续正常请求
          console.log("[Mock] API未找到，使用正常请求:", error.message);
        } else {
          // Mock处理出错，返回Mock错误
          return Promise.reject({
            isMockError: true,
            error,
          });
        }
      }
    }

    // 添加认证token
    const authStore = useAuthStore();
    const token = authStore.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message: msg, data } = response.data;

    // 业务成功
    if (code === 0) {
      return data;
    }

    // 业务失败
    message.error(msg || "请求失败");
    return Promise.reject(new Error(msg || "请求失败"));
  },
  (error) => {
    // 处理Mock响应
    if (error.isMockResponse) {
      console.log("[Mock] 返回Mock数据:", error.data);
      const mockData = error.data;
      // 检查Mock数据格式
      if (
        mockData &&
        typeof mockData === "object" &&
        "code" in mockData &&
        "data" in mockData
      ) {
        // 标准ApiResponse格式
        if (mockData.code === 0) {
          return Promise.resolve(mockData.data);
        } else {
          message.error(mockData.message || "Mock请求失败");
          return Promise.reject(new Error(mockData.message || "Mock请求失败"));
        }
      } else {
        // 直接返回原始数据
        return Promise.resolve(mockData);
      }
    }

    // 处理Mock错误
    if (error.isMockError) {
      console.error("[Mock] Mock处理错误:", error.error);
      message.error(error.error.message || "Mock处理失败");
      return Promise.reject(error.error);
    }

    const { response } = error;

    if (response) {
      const { status, data } = response;

      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          const authStore = useAuthStore();
          authStore.logout();
          message.error("登录已过期，请重新登录");
          break;
        case 403:
          message.error("没有权限访问该资源");
          break;
        case 404:
          message.error("请求的资源不存在");
          break;
        case 500:
          message.error("服务器内部错误");
          break;
        default:
          message.error(data?.message || "网络错误");
      }
    } else {
      message.error("网络连接失败");
    }

    return Promise.reject(error);
  }
);

// 通用请求方法
export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return http.get(url, config);
  },

  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return http.post(url, data, config);
  },

  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return http.put(url, data, config);
  },

  patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return http.patch(url, data, config);
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return http.delete(url, config);
  },
};

export default http;
