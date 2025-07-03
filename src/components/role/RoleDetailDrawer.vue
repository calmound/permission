<template>
  <a-drawer
    v-model:open="visible"
    title="角色详情"
    :width="800"
    :bodyStyle="{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }"
    placement="right"
    @close="handleClose"
  >
    <div v-if="roleInfo" class="space-y-6">
      <!-- 基本信息 -->
      <a-card title="基本信息" size="small">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-gray-500">角色名称</div>
            <div class="font-medium">{{ roleInfo.name }}</div>
          </div>
          <div>
            <div class="text-gray-500">角色等级</div>
            <a-rate :value="roleInfo.level" disabled />
          </div>
          <div>
            <div class="text-gray-500">所属系统</div>
            <a-tag color="blue">{{ roleInfo.systemCode }}</a-tag>
          </div>
          <div>
            <div class="text-gray-500">成员数量</div>
            <div class="font-medium">{{ roleInfo.members || 0 }} 人</div>
          </div>
          <div class="col-span-2">
            <div class="text-gray-500">角色描述</div>
            <div class="font-medium">
              {{ roleInfo.description || "暂无描述" }}
            </div>
          </div>
          <div>
            <div class="text-gray-500">创建时间</div>
            <div class="font-medium">{{ formatDate(roleInfo.createdAt) }}</div>
          </div>
          <div>
            <div class="text-gray-500">更新时间</div>
            <div class="font-medium">{{ formatDate(roleInfo.updatedAt) }}</div>
          </div>
        </div>
      </a-card>

      <!-- 权限配置 -->
      <a-card title="权限配置" size="small">
        <a-tabs v-model:activeKey="activeTab">
          <!-- 菜单权限 -->
          <a-tab-pane key="menus" tab="菜单权限">
            <div class="py-4">
              <div class="mb-4 text-sm text-gray-600">
                控制角色可以访问哪些页面和菜单
              </div>
              <a-spin :spinning="menuLoading">
                <a-tree
                  v-if="menuTreeData.length > 0"
                  :tree-data="menuTreeData"
                  :checked-keys="checkedMenus"
                  checkable
                  disabled
                >
                  <template #title="{ title, icon, url }">
                    <span class="flex items-center">
                      <component
                        v-if="icon"
                        :is="icon"
                        class="mr-2 text-gray-500"
                      />
                      <span>{{ title }}</span>
                      <span v-if="url" class="ml-2 text-xs text-gray-400">{{
                        url
                      }}</span>
                    </span>
                  </template>
                </a-tree>
                <a-empty v-else description="暂无菜单数据" />
              </a-spin>
            </div>
          </a-tab-pane>

          <!-- 按钮权限 -->
          <a-tab-pane key="buttons" tab="按钮权限">
            <div class="py-4">
              <div class="mb-4 text-sm text-gray-600">
                控制角色可以执行的具体操作和API调用
              </div>
              <a-spin :spinning="permissionLoading">
                <div class="space-y-4">
                  <div
                    v-for="group in permissionGroups"
                    :key="group.name"
                    class="border rounded-lg p-4"
                  >
                    <div class="font-medium mb-3 flex items-center">
                      <component :is="group.icon" class="mr-2 text-blue-500" />
                      {{ group.name }}
                      <a-badge
                        :count="getCheckedCount(group.permissions)"
                        class="ml-2"
                      />
                    </div>
                    <div
                      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
                    >
                      <div
                        v-for="perm in group.permissions"
                        :key="perm.code"
                        class="flex items-center p-2 border rounded"
                        :class="
                          checkedPermissions.includes(perm.code)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50'
                        "
                      >
                        <a-checkbox
                          :checked="checkedPermissions.includes(perm.code)"
                          disabled
                          class="mr-2"
                        />
                        <div>
                          <div class="text-sm font-medium">{{ perm.name }}</div>
                          <div class="text-xs text-gray-500">
                            {{ perm.code }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </a-spin>
            </div>
          </a-tab-pane>

          <!-- 角色成员 -->
          <a-tab-pane key="members" tab="角色成员">
            <div class="py-4">
              <div class="mb-4 text-sm text-gray-600">拥有此角色的用户列表</div>
              <a-spin :spinning="memberLoading">
                <a-list
                  :data-source="roleMembers"
                  :pagination="memberPagination"
                >
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta>
                        <template #title>
                          <div class="flex items-center">
                            <a-avatar :src="item.avatar" class="mr-3">
                              {{ item.username.charAt(0).toUpperCase() }}
                            </a-avatar>
                            <div>
                              <div class="font-medium">{{ item.username }}</div>
                              <div class="text-sm text-gray-500">
                                {{ item.email || item.phone }}
                              </div>
                            </div>
                          </div>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                </a-list>
              </a-spin>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-card>

      <!-- 操作按钮 -->
      <div class="flex gap-2">
        <a-button
          type="primary"
          @click="handleEdit"
          v-permission="'role:update'"
        >
          <EditOutlined />
          编辑角色
        </a-button>
        <a-button @click="handleManagePermissions" v-permission="'role:update'">
          <SafetyOutlined />
          配置权限
        </a-button>
        <a-button @click="handleManageMembers" v-permission="'role:update'">
          <UserOutlined />
          管理成员
        </a-button>
        <a-popconfirm
          title="确定删除此角色吗？删除后无法恢复！"
          @confirm="handleDelete"
          v-permission="'role:delete'"
        >
          <a-button danger>
            <DeleteOutlined />
            删除角色
          </a-button>
        </a-popconfirm>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  EditOutlined,
  SafetyOutlined,
  DeleteOutlined,
  UserOutlined,
  MenuOutlined,
  ApiOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import type { Role, User, Resource } from "../../types";
import { roleApi } from "@api/role";
import { resourceApi } from "@api/resource";
import { formatDate } from "@utils/dayjs";

interface Props {
  open: boolean;
  roleId?: string;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "edit", role: Role): void;
  (e: "manage-permissions", role: Role): void;
  (e: "manage-members", role: Role): void;
  (e: "refresh"): void;
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
const memberLoading = ref(false);
const checkedMenus = ref<string[]>([]);
const checkedPermissions = ref<string[]>([]);
const menuTreeData = ref<any[]>([]);
const roleMembers = ref<User[]>([]);

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

const memberPagination = {
  pageSize: 10,
  showSizeChanger: false,
  showQuickJumper: false,
};

watch(
  () => props.open,
  (newVal) => {
    visible.value = newVal;
    if (newVal && props.roleId) {
      loadRoleDetail();
    }
  }
);

watch(visible, (newVal) => {
  if (!newVal) {
    emit("update:open", false);
  }
});

const loadRoleDetail = async () => {
  if (!props.roleId) return;

  loading.value = true;
  try {
    const response = await roleApi.getRole(props.roleId);
    roleInfo.value = response;

    // 加载权限配置
    await Promise.all([
      loadMenuTree(),
      loadRolePermissions(),
      loadRoleMembers(),
    ]);
  } catch (error) {
    message.error("加载角色详情失败");
  } finally {
    loading.value = false;
  }
};

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
  if (!props.roleId) return;

  try {
    permissionLoading.value = true;
    const permissions = await roleApi.getRolePermissions(props.roleId);
    checkedPermissions.value = permissions;
  } catch (error) {
    console.error("加载角色权限失败:", error);
  } finally {
    permissionLoading.value = false;
  }
};

const loadRoleMembers = async () => {
  if (!props.roleId) return;

  try {
    memberLoading.value = true;
    const members = await roleApi.getRoleMembers(props.roleId);
    roleMembers.value = members;
  } catch (error) {
    console.error("加载角色成员失败:", error);
  } finally {
    memberLoading.value = false;
  }
};

const getCheckedCount = (permissions: any[]) => {
  return permissions.filter((p) => checkedPermissions.value.includes(p.code))
    .length;
};

const handleClose = () => {
  visible.value = false;
  roleInfo.value = null;
  checkedMenus.value = [];
  checkedPermissions.value = [];
  menuTreeData.value = [];
  roleMembers.value = [];
};

const handleEdit = () => {
  if (roleInfo.value) {
    emit("edit", roleInfo.value);
  }
};

const handleManagePermissions = () => {
  if (roleInfo.value) {
    emit("manage-permissions", roleInfo.value);
  }
};

const handleManageMembers = () => {
  if (roleInfo.value) {
    emit("manage-members", roleInfo.value);
  }
};

const handleDelete = async () => {
  if (!roleInfo.value) return;

  try {
    await roleApi.deleteRole(roleInfo.value.id);
    message.success("角色删除成功");
    visible.value = false;
    emit("refresh");
  } catch (error) {
    message.error("角色删除失败");
  }
};
</script>
