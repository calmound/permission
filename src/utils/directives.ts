import type { App, DirectiveBinding } from "vue";
import { useAuthStore } from "@stores/auth";

// 权限检查指令
const permission = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding);
  },
};

function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
  const { value } = binding;

  if (!value) {
    return;
  }

  const authStore = useAuthStore();

  let hasPermission = false;

  if (typeof value === "string") {
    // 单个权限
    hasPermission = authStore.hasPermission(value);
  } else if (Array.isArray(value)) {
    // 多个权限，满足其中一个即可
    hasPermission = authStore.hasAnyPermission(value);
  }

  if (!hasPermission) {
    // 移除元素或隐藏元素
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    } else {
      el.style.display = "none";
    }
  } else {
    // 确保元素可见
    if (el.style.display === "none") {
      el.style.display = "";
    }
  }
}

// 角色检查指令
const role = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding);
  },
};

function checkRole(el: HTMLElement, binding: DirectiveBinding) {
  const { value } = binding;

  if (!value) {
    return;
  }

  const authStore = useAuthStore();

  let hasRole = false;

  if (typeof value === "string") {
    // 单个角色
    hasRole = authStore.hasRole(value);
  } else if (Array.isArray(value)) {
    // 多个角色，满足其中一个即可
    hasRole = value.some((role) => authStore.hasRole(role));
  }

  if (!hasRole) {
    // 移除元素或隐藏元素
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    } else {
      el.style.display = "none";
    }
  } else {
    // 确保元素可见
    if (el.style.display === "none") {
      el.style.display = "";
    }
  }
}

// 权限禁用指令（显示但禁用）
const permissionDisabled = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding;
    const authStore = useAuthStore();
    const hasPermission = authStore.hasPermission(value);

    if (!hasPermission) {
      el.classList.add("permission-denied");
      // 禁用所有交互
      el.style.pointerEvents = "none";
      el.style.opacity = "0.5";

      // 如果是按钮，设置disabled属性
      if (el.tagName === "BUTTON" || el.querySelector("button")) {
        const button =
          el.tagName === "BUTTON" ? el : el.querySelector("button");
        if (button) {
          (button as HTMLButtonElement).disabled = true;
        }
      }
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding;
    const authStore = useAuthStore();
    const hasPermission = authStore.hasPermission(value);

    if (hasPermission) {
      el.classList.remove("permission-denied");
      el.style.pointerEvents = "";
      el.style.opacity = "";

      const button = el.tagName === "BUTTON" ? el : el.querySelector("button");
      if (button) {
        (button as HTMLButtonElement).disabled = false;
      }
    } else {
      el.classList.add("permission-denied");
      el.style.pointerEvents = "none";
      el.style.opacity = "0.5";

      const button = el.tagName === "BUTTON" ? el : el.querySelector("button");
      if (button) {
        (button as HTMLButtonElement).disabled = true;
      }
    }
  },
};

// 设置指令
export function setupDirectives(app: App) {
  app.directive("permission", permission);
  app.directive("role", role);
  app.directive("permission-disabled", permissionDisabled);
}

// 权限检查工具函数
export function hasPermission(permission: string): boolean {
  const authStore = useAuthStore();
  return authStore.hasPermission(permission);
}

export function hasRole(role: string): boolean {
  const authStore = useAuthStore();
  return authStore.hasRole(role);
}

export function hasAnyPermission(permissions: string[]): boolean {
  const authStore = useAuthStore();
  return permissions.some((permission) => authStore.hasPermission(permission));
}

export function hasAllPermissions(permissions: string[]): boolean {
  const authStore = useAuthStore();
  return permissions.every((permission) => authStore.hasPermission(permission));
}

export default {
  permission,
  role,
};
