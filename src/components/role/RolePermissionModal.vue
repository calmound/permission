<template>
  <a-modal
    v-model:open="visible"
    title="配置角色权限"
    :width="1000"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirmLoading="loading"
    :bodyStyle="{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }"
  >
    <div v-if="roleInfo" class="role-permission-config">
      <!-- 角色信息 -->
      <a-card size="small" class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-lg font-medium mb-1">{{ roleInfo.name }}</h4>
            <p class="text-gray-500 text-sm">
              {{ roleInfo.description || "暂无描述" }}
            </p>
          </div>
          <a-tag color="blue">{{ roleInfo.systemCode }}</a-tag>
        </div>
      </a-card>

      <!-- 权限配置标签页 -->
      <a-tabs v-model:activeKey="activeTab" class="permission-tabs">
        <!-- 菜单权限 -->
        <a-tab-pane key="menus" tab="菜单权限">
          <div class="permission-section">
            <div class="section-header mb-3">
              <h5 class="text-base font-medium">页面访问权限</h5>
              <p class="text-gray-500 text-sm">控制用户可以访问的页面和菜单</p>
            </div>
            <a-spin :spinning="menuLoading">
              <a-tree
                v-model:checkedKeys="checkedMenus"
                :tree-data="menuTreeData"
                :height="300"
                checkable
                :selectable="false"
                :fieldNames="{
                  children: 'children',
                  title: 'title',
                  key: 'key',
                }"
                class="w-full"
              >
                <template #title="{ title, icon, url }">
                  <span class="flex items-center">
                    <component :is="icon" v-if="icon" class="mr-2" />
                    <span>{{ title }}</span>
                    <span v-if="url" class="ml-2 text-xs text-gray-400">{{
                      url
                    }}</span>
                  </span>
                </template>
              </a-tree>
            </a-spin>
          </div>
        </a-tab-pane>

        <!-- 按钮权限 -->
        <a-tab-pane key="permissions" tab="按钮权限">
          <div class="permission-section">
            <div class="section-header mb-4">
              <h5 class="text-base font-medium">操作权限配置</h5>
              <p class="text-gray-500 text-sm">
                控制用户可以执行的具体操作和按钮权限
              </p>
            </div>
            <a-spin :spinning="permissionLoading">
              <div class="space-y-4">
                <div
                  v-for="group in permissionGroups"
                  :key="group.name"
                  class="permission-group"
                >
                  <div
                    class="group-header flex items-center justify-between p-3 bg-gray-50 rounded-t-lg"
                  >
                    <div class="flex items-center">
                      <component :is="group.icon" class="mr-2 text-blue-500" />
                      <span class="font-medium">{{ group.name }}</span>
                      <span class="ml-2 text-sm text-gray-500">
                        ({{ getCheckedCount(group.permissions) }}/{{
                          group.permissions.length
                        }})
                      </span>
                    </div>
                    <div class="space-x-2">
                      <a-button
                        size="small"
                        @click="selectAllInGroup(group.permissions, true)"
                      >
                        全选
                      </a-button>
                      <a-button
                        size="small"
                        @click="selectAllInGroup(group.permissions, false)"
                      >
                        清空
                      </a-button>
                    </div>
                  </div>
                  <div class="group-content p-3 border border-t-0 rounded-b-lg">
                    <div class="grid grid-cols-2 gap-3">
                      <a-checkbox
                        v-for="permission in group.permissions"
                        :key="permission.code"
                        :checked="checkedPermissions.includes(permission.code)"
                        @change="(e: any) => handlePermissionChange(permission.code, e.target.checked)"
                        class="flex items-center"
                      >
                        <div class="ml-2 flex-1 min-w-0">
                          <div class="font-medium text-sm">
                            {{ permission.name }}
                          </div>
                          <div class="text-xs text-gray-500 truncate">
                            {{ permission.code }}
                          </div>
                        </div>
                      </a-checkbox>
                    </div>
                  </div>
                </div>
              </div>
            </a-spin>
          </div>
        </a-tab-pane>
      </a-tabs>

      <!-- 权限统计 -->
      <div class="permission-summary mt-4 p-3 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm text-blue-600">
            已选择权限：{{ checkedPermissions.length }} 项
          </span>
          <a-button size="small" @click="clearAllPermissions">
            清空所有权限
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { message } from "ant-design-vue";
import {
  UserOutlined,
  SafetyOutlined,
  MenuOutlined,
  ApiOutlined,
} from "@ant-design/icons-vue";
import type { Role, Resource } from "../../types";
import { roleApi } from "@api/role";
import { resourceApi } from "@api/resource";

interface Props {
  open: boolean;
  role?: Role | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);
const loading = ref(false);
const roleInfo = ref<Role | null>(null);
const activeTab = ref("menus");

// 权限配置相关
const menuLoading = ref(false);
const permissionLoading = ref(false);
const checkedMenus = ref<string[]>([]);
const checkedPermissions = ref<string[]>([]);
const menuTreeData = ref<any[]>([]);

// 权限分组数据
const permissionGroups = ref([
  {
    name: "用户管理",
    icon: "UserOutlined",
    permissions: [
      { code: "user:list", name: "查看用户" },
      { code: "user:create", name: "创建用户" },
      { code: "user:update", name: "编辑用户" },
      { code: "user:delete", name: "删除用户" },
      { code: "user:export", name: "导出用户" },
      { code: "user:reset_password", name: "重置密码" },
    ],
  },
  {
    name: "角色管理",
    icon: "SafetyOutlined",
    permissions: [
      { code: "role:list", name: "查看角色" },
      { code: "role:create", name: "创建角色" },
      { code: "role:update", name: "编辑角色" },
      { code: "role:delete", name: "删除角色" },
      { code: "role:grant", name: "分配权限" },
    ],
  },
  {
    name: "资源管理",
    icon: "MenuOutlined",
    permissions: [
      { code: "resource:list", name: "查看资源" },
      { code: "resource:create", name: "创建资源" },
      { code: "resource:update", name: "编辑资源" },
      { code: "resource:delete", name: "删除资源" },
    ],
  },
  {
    name: "系统管理",
    icon: "ApiOutlined",
    permissions: [
      { code: "system:config", name: "系统配置" },
      { code: "audit:list", name: "查看日志" },
      { code: "audit:export", name: "导出日志" },
    ],
  },
]);

watch(
  () => props.open,
  (newVal) => {
    visible.value = newVal;
    if (newVal && props.role) {
      roleInfo.value = props.role;
      loadRolePermissions();
      loadMenuTree();
    }
  }
);

watch(visible, (newVal) => {
  if (!newVal) {
    emit("update:open", false);
  }
});

const loadMenuTree = async () => {
  try {
    menuLoading.value = true;
    const response = await resourceApi.getResourceTree();
    menuTreeData.value = transformMenuData(response);
  } catch (error) {
    console.error("加载菜单树失败:", error);
  } finally {
    menuLoading.value = false;
  }
};

const transformMenuData = (resources: Resource[]): any[] => {
  return resources.map((item: Resource) => ({
    key: item.id,
    title: item.name,
    icon: item.icon,
    url: item.url,
    children: item.children ? transformMenuData(item.children) : undefined,
  }));
};

const loadRolePermissions = async () => {
  if (!props.role?.id) return;

  try {
    permissionLoading.value = true;
    const permissions = await roleApi.getRolePermissions(props.role.id);
    checkedPermissions.value = permissions;
  } catch (error) {
    console.error("加载角色权限失败:", error);
  } finally {
    permissionLoading.value = false;
  }
};

const getCheckedCount = (permissions: any[]) => {
  return permissions.filter((p) => checkedPermissions.value.includes(p.code))
    .length;
};

const handlePermissionChange = (code: string, checked: boolean) => {
  if (checked) {
    if (!checkedPermissions.value.includes(code)) {
      checkedPermissions.value.push(code);
    }
  } else {
    const index = checkedPermissions.value.indexOf(code);
    if (index > -1) {
      checkedPermissions.value.splice(index, 1);
    }
  }
};

const selectAllInGroup = (permissions: any[], selectAll: boolean) => {
  permissions.forEach((permission) => {
    handlePermissionChange(permission.code, selectAll);
  });
};

const clearAllPermissions = () => {
  checkedPermissions.value = [];
  checkedMenus.value = [];
};

const handleOk = async () => {
  if (!roleInfo.value?.id) return;

  loading.value = true;
  try {
    await roleApi.updateRolePermissions(
      roleInfo.value.id,
      checkedPermissions.value
    );
    message.success("权限配置保存成功");
    visible.value = false;
    emit("success");
  } catch (error) {
    message.error("权限配置保存失败");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};
</script>

<style scoped>
.role-permission-config {
  max-width: 100%;
  overflow-x: hidden;
}

.permission-tabs :deep(.ant-tabs-content) {
  overflow-x: hidden;
}

.permission-section {
  max-width: 100%;
}

.permission-group {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.group-content {
  max-height: 200px;
  overflow-y: auto;
}

:deep(.ant-checkbox-wrapper) {
  width: 100%;
}

:deep(.ant-tree) {
  background: transparent;
}

:deep(.ant-tree .ant-tree-node-content-wrapper) {
  width: 100%;
  overflow: hidden;
}
</style>
