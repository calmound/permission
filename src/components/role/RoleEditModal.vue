<template>
  <a-modal
    v-model:open="visible"
    :title="isEdit ? '编辑角色' : '新增角色'"
    :width="1000"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirmLoading="loading"
    :bodyStyle="{ padding: '20px', maxHeight: '80vh', overflowY: 'auto' }"
  >
    <div class="role-edit-content">
      <a-tabs v-model:activeKey="activeTab" class="mt-4">
        <!-- 基本信息标签页 -->
        <a-tab-pane key="basic" tab="📋 基本信息">
          <a-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            layout="vertical"
            class="mt-4"
          >
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="角色名称" name="name">
                  <a-input
                    v-model:value="formData.name"
                    placeholder="请输入角色名称"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="所属系统" name="systemCode">
                  <a-select
                    v-model:value="formData.systemCode"
                    placeholder="请选择所属系统"
                    :disabled="isEdit"
                  >
                    <a-select-option value="PERMISSION_SYSTEM">
                      权限管理系统
                    </a-select-option>
                    <a-select-option value="USER_CENTER"
                      >用户中心</a-select-option
                    >
                    <a-select-option value="ADMIN">管理后台</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="角色描述" name="description">
              <a-textarea
                v-model:value="formData.description"
                placeholder="请输入角色描述"
                :rows="3"
              />
            </a-form-item>

            <!-- 操作提示 -->
            <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="text-sm text-blue-800">
                💡 基本信息设置完成后，请切换到"权限配置"标签页配置角色权限
              </div>
            </div>
          </a-form>
        </a-tab-pane>

        <!-- 权限配置标签页 -->
        <a-tab-pane key="permissions" tab="🔒 权限配置">
          <div class="permission-config-content">
            <div class="mb-4">
              <h4 class="text-lg font-medium mb-2">权限配置</h4>
              <p class="text-sm text-gray-600">
                为角色分配相应的菜单和操作权限
              </p>
            </div>

            <!-- 权限配置标签页 -->
            <a-tabs v-model:activeKey="permissionTab" class="permission-tabs">
              <!-- 菜单权限 -->
              <a-tab-pane key="menus" tab="菜单权限">
                <div class="permission-section">
                  <div class="section-header mb-3">
                    <h5 class="text-base font-medium">页面访问权限</h5>
                    <p class="text-gray-500 text-sm">
                      控制用户可以访问的页面和菜单
                    </p>
                  </div>
                  <a-spin :spinning="menuLoading">
                    <a-tree
                      v-model:checkedKeys="checkedMenus"
                      :tree-data="menuTreeData"
                      :height="300"
                      checkable
                      :selectable="false"
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
              <a-tab-pane key="buttons" tab="按钮权限">
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
                            <component
                              :is="group.icon"
                              class="mr-2 text-blue-500"
                            />
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
                              @click="
                                selectAllInGroup(group.permissions, false)
                              "
                            >
                              清空
                            </a-button>
                          </div>
                        </div>
                        <div
                          class="group-content p-3 border border-t-0 rounded-b-lg"
                        >
                          <div class="grid grid-cols-2 gap-3">
                            <a-checkbox
                              v-for="permission in group.permissions"
                              :key="permission.code"
                              :checked="
                                checkedPermissions.includes(permission.code)
                              "
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
        </a-tab-pane>

        <!-- 成员管理标签页 -->
        <a-tab-pane key="members" tab="👥 成员管理" :disabled="!isEdit">
          <div v-if="!isEdit" class="text-center py-8 text-gray-500">
            新建角色时暂不支持成员管理，请先保存角色后再管理成员
          </div>
          <div v-else class="member-management-content">
            <div class="mb-4">
              <h4 class="text-lg font-medium mb-2">成员管理</h4>
              <p class="text-sm text-gray-600">管理拥有此角色的用户</p>
            </div>

            <!-- 成员管理操作 -->
            <div class="member-actions mb-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <a-button type="primary" @click="showAddMemberModal = true">
                    <PlusOutlined />
                    添加成员
                  </a-button>
                  <a-button
                    :disabled="selectedMemberKeys.length === 0"
                    @click="handleBatchRemove"
                  >
                    批量移除
                  </a-button>
                </div>
                <div class="flex items-center space-x-2">
                  <a-input-search
                    v-model:value="searchKeyword"
                    placeholder="搜索成员..."
                    style="width: 200px"
                    @search="handleSearch"
                  />
                  <a-button @click="loadRoleMembers">
                    <ReloadOutlined />
                  </a-button>
                </div>
              </div>
            </div>

            <!-- 成员列表 -->
            <a-spin :spinning="memberLoading">
              <a-table
                :data-source="filteredMembers"
                :columns="memberColumns"
                :row-selection="memberRowSelection"
                :pagination="memberPagination"
                :scroll="{ y: 300 }"
                size="small"
                class="member-table"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'avatar'">
                    <a-avatar size="small" :src="record.avatar">
                      {{
                        record.nickname?.charAt(0) || record.username?.charAt(0)
                      }}
                    </a-avatar>
                  </template>
                  <template v-else-if="column.key === 'userInfo'">
                    <div class="user-info">
                      <div class="font-medium">
                        {{ record.nickname || record.username }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ record.email }}
                      </div>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <a-tag
                      :color="record.status === 'active' ? 'green' : 'red'"
                    >
                      {{ record.status === "active" ? "启用" : "停用" }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'joinTime'">
                    {{ formatDate(record.joinTime || record.createdAt) }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <a-space size="small">
                      <a-button
                        type="link"
                        size="small"
                        @click="viewUserDetail(record)"
                      >
                        查看
                      </a-button>
                      <a-popconfirm
                        title="确定要将此用户从角色中移除吗？"
                        @confirm="handleRemoveMember(record)"
                      >
                        <a-button type="link" size="small" danger
                          >移除</a-button
                        >
                      </a-popconfirm>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </a-spin>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 添加成员弹窗 -->
    <a-modal
      v-model:open="showAddMemberModal"
      title="添加角色成员"
      :width="600"
      @ok="handleAddMembers"
      @cancel="showAddMemberModal = false"
      :confirmLoading="addingMembers"
    >
      <div class="add-member-content">
        <div class="mb-4">
          <a-input-search
            v-model:value="userSearchKeyword"
            placeholder="搜索用户..."
            @search="searchUsers"
            class="w-full"
          />
        </div>
        <a-spin :spinning="userLoading">
          <a-transfer
            v-model:target-keys="selectedMemberIds"
            :data-source="availableUsers"
            :titles="['可选用户', '已选用户']"
            :render="(item: any) => `${item.title} (${item.email})`"
            show-search
            :filter-option="filterUsers"
            @change="handleMemberTransferChange"
          />
        </a-spin>
      </div>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { message } from "ant-design-vue";
import {
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  SafetyOutlined,
  MenuOutlined,
  ApiOutlined,
} from "@ant-design/icons-vue";
import type { FormInstance } from "ant-design-vue";
import type { Role, User, Resource } from "../../types";
import { roleApi } from "@api/role";
import { userApi } from "@api/user";
import { resourceApi } from "@api/resource";
import { formatDate } from "@utils/dayjs";

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

// 基本状态
const visible = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();
const isEdit = ref(false);
const activeTab = ref("basic");

// 表单数据
const formData = reactive({
  name: "",
  description: "",
  systemCode: "PERMISSION_SYSTEM",
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入角色名称" },
    { min: 2, max: 50, message: "角色名称长度为2-50个字符" },
  ],
  systemCode: [{ required: true, message: "请选择所属系统" }],
};

// 权限配置相关
const permissionTab = ref("menus");
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

// 成员管理相关
const memberLoading = ref(false);
const roleMembers = ref<User[]>([]);
const selectedMemberKeys = ref<string[]>([]);
const searchKeyword = ref("");
const showAddMemberModal = ref(false);
const addingMembers = ref(false);
const userLoading = ref(false);
const availableUsers = ref<any[]>([]);
const selectedMemberIds = ref<string[]>([]);
const userSearchKeyword = ref("");

// 成员表格配置
const memberColumns = [
  { title: "头像", key: "avatar", width: 60 },
  { title: "用户信息", key: "userInfo", width: 200 },
  { title: "用户名", dataIndex: "username", width: 120 },
  { title: "状态", key: "status", width: 80 },
  { title: "加入时间", key: "joinTime", width: 120 },
  { title: "操作", key: "actions", width: 100 },
];

const memberRowSelection = {
  selectedRowKeys: selectedMemberKeys,
  onChange: (keys: string[]) => {
    selectedMemberKeys.value = keys;
  },
};

const memberPagination = {
  pageSize: 10,
  showSizeChanger: false,
  showQuickJumper: false,
};

// 计算属性
const filteredMembers = computed(() => {
  if (!searchKeyword.value) return roleMembers.value;
  return roleMembers.value.filter(
    (member) =>
      member.username.includes(searchKeyword.value) ||
      member.nickname?.includes(searchKeyword.value) ||
      member.email?.includes(searchKeyword.value)
  );
});

// 监听器
watch(
  () => props.open,
  (newVal) => {
    visible.value = newVal;
    if (newVal) {
      // 无论新建还是编辑，都要加载菜单树
      loadMenuTree();

      if (props.role) {
        isEdit.value = true;
        Object.assign(formData, {
          name: props.role.name,
          description: props.role.description || "",
          systemCode: props.role.systemCode || "PERMISSION_SYSTEM",
        });
        // 编辑时加载权限和成员数据
        loadRolePermissions();
        loadRoleMembers();
      } else {
        isEdit.value = false;
        activeTab.value = "basic";
        Object.assign(formData, {
          name: "",
          description: "",
          systemCode: "PERMISSION_SYSTEM",
        });
      }
    }
  }
);

watch(visible, (newVal) => {
  if (!newVal) {
    emit("update:open", false);
    formRef.value?.resetFields();
    resetData();
  }
});

// 方法
const resetData = () => {
  checkedMenus.value = [];
  checkedPermissions.value = [];
  menuTreeData.value = [];
  roleMembers.value = [];
  selectedMemberKeys.value = [];
  searchKeyword.value = "";
  showAddMemberModal.value = false;
  availableUsers.value = [];
  selectedMemberIds.value = [];
  userSearchKeyword.value = "";
};

// loadRoleData 函数已被移除，功能已分离到各个独立的加载函数中

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
  if (!props.role) return;

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

const loadRoleMembers = async () => {
  if (!props.role) return;

  try {
    memberLoading.value = true;
    const members = await roleApi.getRoleMembers(props.role.id);
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

const selectAllInGroup = (permissions: any[], select: boolean) => {
  const codes = permissions.map((p) => p.code);
  if (select) {
    codes.forEach((code) => {
      if (!checkedPermissions.value.includes(code)) {
        checkedPermissions.value.push(code);
      }
    });
  } else {
    checkedPermissions.value = checkedPermissions.value.filter(
      (code) => !codes.includes(code)
    );
  }
};

const handlePermissionChange = (code: string, checked: boolean) => {
  if (checked) {
    if (!checkedPermissions.value.includes(code)) {
      checkedPermissions.value.push(code);
    }
  } else {
    checkedPermissions.value = checkedPermissions.value.filter(
      (c) => c !== code
    );
  }
};

const clearAllPermissions = () => {
  checkedPermissions.value = [];
  checkedMenus.value = [];
};

const handleSearch = () => {
  // 搜索逻辑已在 filteredMembers 计算属性中处理
};

const handleBatchRemove = async () => {
  if (selectedMemberKeys.value.length === 0) return;

  try {
    for (const memberId of selectedMemberKeys.value) {
      await roleApi.removeRoleMember(props.role!.id, memberId);
    }
    message.success("批量移除成功");
    selectedMemberKeys.value = [];
    loadRoleMembers();
  } catch (error) {
    message.error("批量移除失败");
  }
};

const handleRemoveMember = async (member: User) => {
  try {
    await roleApi.removeRoleMember(props.role!.id, member.id);
    message.success("移除成功");
    loadRoleMembers();
  } catch (error) {
    message.error("移除失败");
  }
};

const viewUserDetail = (user: User) => {
  // 查看用户详情逻辑
  console.log("查看用户详情:", user);
};

const searchUsers = async () => {
  // 搜索用户逻辑
  try {
    userLoading.value = true;
    const response = await userApi.getUsers({
      keyword: userSearchKeyword.value,
    });
    availableUsers.value = response.items.map((user: User) => ({
      key: user.id,
      title: user.nickname || user.username,
      email: user.email,
    }));
  } catch (error) {
    console.error("搜索用户失败:", error);
  } finally {
    userLoading.value = false;
  }
};

const filterUsers = (inputValue: string, option: any) => {
  return option.title.toLowerCase().includes(inputValue.toLowerCase());
};

const handleMemberTransferChange = (keys: string[]) => {
  selectedMemberIds.value = keys;
};

const handleAddMembers = async () => {
  if (selectedMemberIds.value.length === 0) return;

  try {
    addingMembers.value = true;
    for (const memberId of selectedMemberIds.value) {
      await roleApi.addRoleMember(props.role!.id, memberId);
    }
    message.success("添加成员成功");
    showAddMemberModal.value = false;
    selectedMemberIds.value = [];
    loadRoleMembers();
  } catch (error) {
    message.error("添加成员失败");
  } finally {
    addingMembers.value = false;
  }
};

const handleOk = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value && props.role) {
      // 编辑角色
      await roleApi.updateRole(props.role.id, formData);

      // 如果配置了权限，保存权限配置
      if (checkedPermissions.value.length > 0) {
        await roleApi.updateRolePermissions(
          props.role.id,
          checkedPermissions.value
        );
      }

      message.success("角色更新成功");
    } else {
      // 新增角色
      const newRole = await roleApi.createRole(formData);

      // 如果配置了权限，保存权限配置
      if (checkedPermissions.value.length > 0) {
        await roleApi.updateRolePermissions(
          newRole.id,
          checkedPermissions.value
        );
      }

      message.success("角色创建成功");
    }

    visible.value = false;
    emit("success");
  } catch (error: any) {
    if (error?.errorFields) {
      return; // 表单验证错误
    }
    message.error(isEdit.value ? "角色更新失败" : "角色创建失败");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};
</script>

<style scoped>
.role-edit-content {
  max-width: 100%;
  overflow-x: hidden;
}

.permission-group {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.permission-summary {
  border: 1px solid #91caff;
}

.member-table {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

:deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

:deep(.ant-input),
:deep(.ant-select),
:deep(.ant-textarea) {
  width: 100%;
}

:deep(.ant-tabs-content) {
  padding: 0;
}

:deep(.permission-tabs .ant-tabs-content) {
  padding: 16px 0;
}
</style>
