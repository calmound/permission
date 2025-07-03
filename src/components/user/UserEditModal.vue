<template>
  <a-modal
    v-model:open="visible"
    :title="isEdit ? '编辑用户' : '新增用户'"
    :width="900"
    :bodyStyle="{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirmLoading="loading"
  >
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
              <a-form-item label="用户名" name="username">
                <a-input
                  v-model:value="formData.username"
                  :disabled="isEdit"
                  placeholder="请输入用户名"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="昵称" name="nickname">
                <a-input
                  v-model:value="formData.nickname"
                  placeholder="请输入昵称"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="邮箱" name="email">
                <a-input
                  v-model:value="formData.email"
                  placeholder="请输入邮箱"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="手机号" name="phone">
                <a-input
                  v-model:value="formData.phone"
                  placeholder="请输入手机号"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="状态" name="status">
                <a-select
                  v-model:value="formData.status"
                  placeholder="请选择状态"
                >
                  <a-select-option value="active">启用</a-select-option>
                  <a-select-option value="inactive">停用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col v-if="!isEdit" :span="12">
              <a-form-item label="密码" name="password">
                <a-input-password
                  v-model:value="formData.password"
                  placeholder="请输入密码"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="text-sm text-blue-800">
              💡
              提示：基本信息设置完成后，请切换到"系统权限"标签页配置用户的系统访问权限
            </div>
          </div>
        </a-form>
      </a-tab-pane>

      <!-- 系统权限标签页 -->
      <a-tab-pane key="permissions" tab="🎯 系统权限">
        <div class="space-y-6">
          <!-- 权限配置表格 -->
          <div>
            <h3 class="text-lg font-semibold mb-4 text-gray-800">
              系统权限配置
            </h3>
            <a-table
              :columns="permissionColumns"
              :data-source="systemPermissions"
              :pagination="false"
              size="middle"
              bordered
              class="permission-table"
            >
              <template #bodyCell="{ column, record, index }">
                <!-- 系统信息列 -->
                <template v-if="column.key === 'system'">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      :style="{ backgroundColor: getSystemColor(record.code) }"
                    >
                      {{ record.name.charAt(0) }}
                    </div>
                    <div>
                      <div class="font-medium">{{ record.name }}</div>
                      <div class="text-xs text-gray-500">{{ record.code }}</div>
                    </div>
                  </div>
                </template>

                <!-- 启用状态列 -->
                <template v-else-if="column.key === 'enabled'">
                  <a-switch
                    v-model:checked="record.enabled"
                    @change="handleSystemToggle(record, $event)"
                    checkedChildren="启用"
                    unCheckedChildren="禁用"
                  />
                </template>

                <!-- 角色选择列 -->
                <template v-else-if="column.key === 'role'">
                  <a-select
                    v-model:value="record.selectedRoleId"
                    placeholder="选择角色"
                    style="width: 180px"
                    :disabled="!record.enabled"
                    :loading="record.rolesLoading"
                    allow-clear
                    @change="handleRoleChange(record, $event)"
                  >
                    <a-select-option
                      v-for="role in record.availableRoles"
                      :key="role.id"
                      :value="role.id"
                    >
                      {{ role.name }}
                      <a-tag
                        v-if="role.level"
                        size="small"
                        color="blue"
                        class="ml-1"
                      >
                        L{{ role.level }}
                      </a-tag>
                    </a-select-option>
                  </a-select>
                </template>

                <!-- 操作列 -->
                <template v-else-if="column.key === 'action'">
                  <a-space>
                    <a-button
                      size="small"
                      type="text"
                      @click="showSystemRoleDetails(record)"
                      :disabled="!record.availableRoles?.length"
                    >
                      查看角色
                    </a-button>
                    <a-button
                      v-if="record.selectedRoleId"
                      size="small"
                      type="text"
                      @click="showRolePermissions(record)"
                    >
                      查看权限
                    </a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>

          <!-- 权限预览 -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold mb-3 text-gray-800">🔍 权限预览</h4>
            <div v-if="enabledSystemsCount === 0" class="text-gray-500 text-sm">
              请至少启用一个系统并分配角色
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="system in enabledSystems"
                :key="system.code"
                class="flex justify-between items-center py-2 px-3 bg-white rounded border"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    :style="{ backgroundColor: getSystemColor(system.code) }"
                  >
                    {{ system.name.charAt(0) }}
                  </div>
                  <span class="font-medium">{{ system.name }}</span>
                </div>
                <div class="text-sm">
                  <span
                    v-if="system.selectedRoleId"
                    class="text-green-600 font-medium"
                  >
                    {{ getRoleName(system) }}
                  </span>
                  <span v-else class="text-orange-500">待分配角色</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 角色详情Modal -->
    <a-modal
      v-model:open="roleDetailVisible"
      :title="`${selectedSystemName} - 角色列表`"
      :width="700"
      :footer="null"
      :bodyStyle="{ maxHeight: '60vh', overflowY: 'auto' }"
    >
      <div v-if="currentSystemRoles.length > 0" class="space-y-3">
        <div
          v-for="role in currentSystemRoles"
          :key="role.id"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-medium">{{ role.name }}</span>
                <a-tag v-if="role.level" size="small" color="blue">
                  L{{ role.level }}
                </a-tag>
              </div>
              <div v-if="role.description" class="text-sm text-gray-600 mb-2">
                {{ role.description }}
              </div>
              <div class="text-xs text-gray-500">
                权限数量：{{ role.permissions?.length || 0 }}
              </div>
            </div>
            <a-button
              size="small"
              type="text"
              @click="showRolePermissionsFromDetail(role)"
            >
              查看权限
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 权限详情Modal -->
    <a-modal
      v-model:open="permissionModalVisible"
      title="角色权限详情"
      :width="600"
      :footer="null"
    >
      <div v-if="selectedRole">
        <h4 class="font-semibold mb-3">{{ selectedRole.name }}</h4>
        <div v-if="selectedRole.description" class="text-gray-600 mb-4">
          {{ selectedRole.description }}
        </div>
        <a-divider />
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="permission in selectedRole.permissions"
            :key="permission"
            class="flex items-center gap-2 py-1"
          >
            <a-tag size="small">{{ permission }}</a-tag>
          </div>
        </div>
      </div>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import type { FormInstance } from "ant-design-vue";
import type { User, System, SystemRole } from "@/types";
import { userApi } from "@api/user";
import { systemApi } from "@api/system";
import { roleApi } from "@api/role";

interface SystemPermissionConfig {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  selectedRoleId: string | null;
  availableRoles: SystemRole[];
  rolesLoading: boolean;
}

interface Props {
  open: boolean;
  user?: User | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();
const isEdit = ref(false);
const activeTab = ref("basic");
const availableSystems = ref<System[]>([]);
const systemPermissions = ref<SystemPermissionConfig[]>([]);

// 角色详情相关
const roleDetailVisible = ref(false);
const selectedSystemName = ref("");
const currentSystemRoles = ref<SystemRole[]>([]);

// 权限详情相关
const permissionModalVisible = ref(false);
const selectedRole = ref<SystemRole | null>(null);

const formData = reactive({
  username: "",
  nickname: "",
  email: "",
  phone: "",
  password: "",
  status: "active" as "active" | "inactive",
});

const rules = {
  username: [
    { required: true, message: "请输入用户名" },
    { min: 3, max: 20, message: "用户名长度为3-20位" },
  ],
  email: [{ type: "email", message: "请输入正确的邮箱格式" }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少6位", trigger: "blur" },
  ],
};

// 权限表格列定义
const permissionColumns = [
  {
    title: "系统",
    key: "system",
    width: 200,
  },
  {
    title: "启用状态",
    key: "enabled",
    width: 100,
    align: "center" as const,
  },
  {
    title: "角色选择",
    key: "role",
    width: 200,
  },
  {
    title: "操作",
    key: "action",
    width: 150,
    align: "center" as const,
  },
];

// 计算属性
const enabledSystemsCount = computed(() => {
  return systemPermissions.value.filter((sp) => sp.enabled).length;
});

const enabledSystems = computed(() => {
  return systemPermissions.value.filter((sp) => sp.enabled);
});

// 加载可用系统
const loadAvailableSystems = async () => {
  try {
    const systemData = await systemApi.getSystems();

    // 确保 systemData 是数组
    const systems = Array.isArray(systemData) ? systemData : [];
    const activeSystems = systems.filter(
      (system) => system && system.status === "active"
    );
    availableSystems.value = activeSystems;

    // 初始化系统权限配置
    if (!isEdit.value) {
      initSystemPermissions(activeSystems);
    }
  } catch (error) {
    console.error("加载系统列表失败:", error);
    message.error("获取系统列表失败");
  }
};

// 初始化系统权限配置
const initSystemPermissions = (systems: System[]) => {
  systemPermissions.value = systems.map((system) => ({
    code: system.code,
    name: system.name,
    description: system.description || "",
    enabled: false,
    selectedRoleId: null,
    availableRoles: [],
    rolesLoading: false,
  }));
};

// 工具方法

const getSystemColor = (code: string) => {
  const colors = [
    "#1890ff",
    "#52c41a",
    "#faad14",
    "#f5222d",
    "#722ed1",
    "#13c2c2",
    "#eb2f96",
    "#fa8c16",
  ];
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getSystemName = (systemCode: string) => {
  const system = availableSystems.value.find((s) => s.code === systemCode);
  return system?.name || systemCode;
};

const getSystemRole = (systemCode: string) => {
  if (!props.user?.systemAccess) return null;
  const access = props.user.systemAccess.find(
    (a) => a.systemCode === systemCode
  );
  return access?.roleName || null;
};

// 新的系统权限管理方法
const handleSystemToggle = async (
  system: SystemPermissionConfig,
  enabled: boolean
) => {
  console.log(`[UserEditModal] 系统开关切换:`, system.code, enabled);
  system.enabled = enabled;
  if (enabled) {
    // 启用系统时加载可用角色
    console.log(`[UserEditModal] 启用系统，加载角色:`, system.code);
    await loadSystemRoles(system);
  } else {
    // 禁用系统时清空角色选择
    console.log(`[UserEditModal] 禁用系统，清空角色:`, system.code);
    system.selectedRoleId = null;
    system.availableRoles = [];
  }
};

const handleRoleChange = (
  system: SystemPermissionConfig,
  roleId: string | null
) => {
  system.selectedRoleId = roleId;
};

const loadSystemRoles = async (system: SystemPermissionConfig) => {
  try {
    system.rolesLoading = true;
    console.log(`[UserEditModal] 开始加载系统角色:`, system.code);
    const response = await roleApi.getSystemRoles(system.code);
    console.log(`[UserEditModal] 角色加载成功:`, response);
    system.availableRoles = response.items || [];
    console.log(`[UserEditModal] 设置角色列表:`, system.availableRoles);
  } catch (error) {
    console.error(`加载系统 ${system.code} 角色失败:`, error);
    message.error(`加载${system.name}角色失败`);
    system.availableRoles = [];
  } finally {
    system.rolesLoading = false;
  }
};

const showSystemRoleDetails = (system: SystemPermissionConfig) => {
  selectedSystemName.value = system.name;
  currentSystemRoles.value = system.availableRoles;
  roleDetailVisible.value = true;
};

const showRolePermissions = (system: SystemPermissionConfig) => {
  if (system.selectedRoleId) {
    const role = system.availableRoles.find(
      (r) => r.id === system.selectedRoleId
    );
    if (role) {
      selectedRole.value = role;
      permissionModalVisible.value = true;
    }
  }
};

const showRolePermissionsFromDetail = (role: SystemRole) => {
  selectedRole.value = role;
  permissionModalVisible.value = true;
};

const getRoleName = (system: SystemPermissionConfig) => {
  if (!system.selectedRoleId) return "";
  const role = system.availableRoles.find(
    (r) => r.id === system.selectedRoleId
  );
  return role?.name || "";
};

watch(
  () => props.open,
  async (newVal) => {
    visible.value = newVal;
    if (newVal) {
      await loadAvailableSystems();
      if (props.user) {
        isEdit.value = true;
        activeTab.value = "basic";
        Object.assign(formData, {
          username: props.user.username,
          nickname: props.user.nickname || "",
          email: props.user.email || "",
          phone: props.user.phone || "",
          status: props.user.status,
          password: "",
        });

        // 初始化系统权限配置（编辑模式）
        await initEditModeSystemPermissions();
      } else {
        isEdit.value = false;
        activeTab.value = "basic";
        Object.assign(formData, {
          username: "",
          nickname: "",
          email: "",
          phone: "",
          password: "",
          status: "active",
        });
        // 新建模式下系统权限已在loadAvailableSystems中初始化
      }
    }
  }
);

// 编辑模式下初始化系统权限配置
const initEditModeSystemPermissions = async () => {
  if (!props.user || !availableSystems.value.length) return;

  // 为所有可用系统创建配置项
  systemPermissions.value = availableSystems.value.map((system) => {
    const userAccess = props.user?.systemAccess?.find(
      (access) => access.systemCode === system.code
    );

    return {
      code: system.code,
      name: system.name,
      description: system.description || "",
      enabled: !!userAccess,
      selectedRoleId: userAccess?.roleId || null,
      availableRoles: [],
      rolesLoading: false,
    };
  });

  // 为已启用的系统加载角色列表
  const enabledSystems = systemPermissions.value.filter((sp) => sp.enabled);
  for (const system of enabledSystems) {
    await loadSystemRoles(system);
  }
};

watch(visible, (newVal) => {
  if (!newVal) {
    emit("update:open", false);
  }
});

const handleOk = async () => {
  try {
    // 验证基本信息表单
    await formRef.value?.validate();

    // 检查系统权限配置
    const enabledSystemsWithoutRole = systemPermissions.value.filter(
      (sp) => sp.enabled && !sp.selectedRoleId
    );

    if (systemPermissions.value.filter((sp) => sp.enabled).length === 0) {
      message.warning("请至少启用一个系统");
      return;
    }

    if (enabledSystemsWithoutRole.length > 0) {
      const systemNames = enabledSystemsWithoutRole
        .map((sp) => sp.name)
        .join("、");
      message.warning(`请为以下系统分配角色：${systemNames}`);
      activeTab.value = "permissions"; // 切换到权限配置标签页
      return;
    }

    loading.value = true;

    // 构建系统权限数据
    const systemRoleAssignments = systemPermissions.value
      .filter((sp) => sp.enabled && sp.selectedRoleId)
      .map((sp) => ({
        systemCode: sp.code,
        roleId: sp.selectedRoleId,
      }));

    if (isEdit.value && props.user) {
      // 更新用户基本信息
      await userApi.updateUser(props.user.id, {
        nickname: formData.nickname,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
      });

      // 批量分配系统角色
      if (systemRoleAssignments.length > 0) {
        await userApi.batchAssignRoles({
          userId: props.user.id,
          systemRoles: systemRoleAssignments,
        });
      }

      message.success("用户信息和权限更新成功");
    } else {
      // 创建新用户
      const newUser = await userApi.createUser({
        username: formData.username,
        nickname: formData.nickname,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        status: formData.status,
        systemCodes: systemPermissions.value
          .filter((sp) => sp.enabled)
          .map((sp) => sp.code),
      });

      // 为新用户分配系统角色
      if (systemRoleAssignments.length > 0) {
        await userApi.batchAssignRoles({
          userId: newUser.id,
          systemRoles: systemRoleAssignments,
        });
      }

      message.success("用户创建成功，权限配置完成");
    }

    emit("success");
    handleCancel();
  } catch (error) {
    console.error("操作失败:", error);
    message.error(isEdit.value ? "用户更新失败" : "用户创建失败");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
  formRef.value?.resetFields();
  systemPermissions.value = [];
  activeTab.value = "basic";
  roleDetailVisible.value = false;
  permissionModalVisible.value = false;
  selectedRole.value = null;
};

onMounted(() => {
  loadAvailableSystems();
});
</script>

<style scoped>
.permission-table {
  font-size: 13px;
}

.permission-table :deep(.ant-table-tbody > tr > td) {
  padding: 12px 16px;
}

.permission-table :deep(.ant-table-thead > tr > th) {
  padding: 12px 16px;
  font-weight: 600;
}

.permission-table :deep(.ant-switch) {
  margin: 0;
}

.permission-table :deep(.ant-select) {
  font-size: 13px;
}

.permission-table :deep(.ant-btn) {
  font-size: 12px;
}
</style>
