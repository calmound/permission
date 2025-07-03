import { request } from '@utils/http'
import type { LoginDto, LoginResponse, User, Menu } from '@types/index'

export const authApi = {
  // 登录
  login(data: LoginDto): Promise<LoginResponse> {
    return request.post('/auth/login', data)
  },

  // 登出
  logout(): Promise<void> {
    return request.post('/auth/logout')
  },

  // 刷新token
  refresh(data: { refreshToken: string }): Promise<{ token: string }> {
    return request.post('/auth/refresh', data)
  },

  // 获取当前用户信息
  getUserInfo(): Promise<User> {
    return request.get('/auth/user')
  },

  // 获取当前用户权限
  getPermissions(): Promise<string[]> {
    return request.get('/auth/permissions')
  },

  // 获取当前用户菜单
  getMenus(): Promise<Menu[]> {
    return request.get('/auth/menus')
  }
} 