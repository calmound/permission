<template>
  <div class="user-system-permission-config">
    <div class="mb-4">
      <h3 class="text-lg font-medium mb-2">系统权限配置</h3>
      <p class="text-gray-600 text-sm">
        管理用户在各个系统中的访问权限和角色分配
      </p>
    </div>

    <div class="space-y-4">
      <!-- 已授权的系统 -->
      <div
        v-for="access in userSystemAccess"
        :key="access.systemCode"
        class="border border-gray-200 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <CheckCircleOutlined class="text-green-500" />
              <span class="font-medium text-lg">{{
                getSystemName(access.systemCode)
              }}</span>
            </div>
            <a-tag :color="getStatusColor(access.status)">
              {{ getStatusText(access.status) }}
            </a-tag>
          </div>
          <div class="flex items-center space-x-2">
            <a-button size="small" @click="handleEditRoles(access)">
              编辑角色
            </a-button>
            <a-button size="small" @click="handleViewPermissions(access)">
              查看权限明细
            </a-button>
            <a-button size="small" danger @click="handleRevokeAccess(access)">
              移除权限
            </a-button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-600">当前角色:</label>
            <div class="mt-1">
              <span v-if="access.roles.length === 0" class="text-gray-400"
                >暂无角色</span
              >
              <div v-else class="flex flex-wrap gap-1">
                <a-tag
                  v-for="roleId in access.roles"
                  :key="roleId"
                  color="blue"
                >
                  {{ getRoleName(access.systemCode, roleId) }}
                </a-tag>
              </div>
            </div>
          </div>
          <div>
            <label class="text-sm text-gray-600">授权信息:</label>
            <div class="mt-1 text-sm">
              <div>授权时间: {{ formatDate(access.grantedAt) }}</div>
              <div>授权人: {{ access.grantedBy }}</div>
              <div v-if="access.expiredAt">
                到期时间: {{ formatDate(access.expiredAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 未授权的系统 -->
      <div
        v-for="system in unauthorizedSystems"
        :key="system.code"
        class="border border-gray-200 rounded-lg p-4 bg-gray-50"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <MinusCircleOutlined class="text-gray-400" />
              <span class="font-medium">{{ system.name }}</span>
            </div>
            <a-tag color="default">未授权</a-tag>
          </div>
          <a-button
            size="small"
            type="primary"
            @click="handleGrantAccess(system)"
          >
            授权访问
          </a-button>
        </div>
      </div>

      <!-- 添加系统权限按钮 -->
      <div
        class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
      >
        <a-button type="dashed" @click="showGrantModal = true">
          <PlusOutlined />
          添加系统权限
        </a-button>
      </div>
    </div>

    <!-- 授权访问Modal -->
    <a-modal
      v-model:open="showGrantModal"
      title="授权系统访问"
      @ok="handleConfirmGrant"
      @cancel="handleCancelGrant"
    >
      <a-form :model="grantForm" layout="vertical">
        <a-form-item label="选择系统" required>
          <a-select
            v-model:value="grantForm.systemCode"
            placeholder="请选择要授权的系统"
            @change="handleSystemChange"
          >
            <a-select-option
              v-for="system in availableSystemsForGrant"
              :key="system.code"
              :value="system.code"
            >
              {{ system.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="分配角色" required>
          <a-select
            v-model:value="grantForm.roleIds"
            mode="multiple"
            placeholder="请选择角色"
            :loading="rolesLoading"
          >
            <a-select-option
              v-for="role in availableRoles"
              :key="role.id"
              :value="role.id"
            >
              {{ role.name }}
              <span class="text-gray-500 text-xs ml-2">{{
                role.description
              }}</span>
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="授权期限">
          <a-radio-group v-model:value="grantForm.expirationType">
            <a-radio value="permanent">永久有效</a-radio>
            <a-radio value="temporary">指定时间</a-radio>
          </a-radio-group>
          <a-date-picker
            v-if="grantForm.expirationType === 'temporary'"
            v-model:value="grantForm.expiredAt"
            show-time
            placeholder="选择到期时间"
            class="mt-2 w-full"
          />
        </a-form-item>

        <a-form-item label="授权说明">
          <a-textarea
            v-model:value="grantForm.description"
            placeholder="请输入授权说明（可选）"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 角色编辑Modal -->
    <a-modal
      v-model:open="showRoleEditModal"
      title="编辑用户角色"
      @ok="handleConfirmEditRoles"
      @cancel="handleCancelEditRoles"
    >
      <a-form :model="roleEditForm" layout="vertical">
        <a-form-item label="系统" required>
          <a-input :value="getSystemName(roleEditForm.systemCode)" disabled />
        </a-form-item>

        <a-form-item label="分配角色" required>
          <a-select
            v-model:value="roleEditForm.roleIds"
            mode="multiple"
            placeholder="请选择角色"
            :loading="rolesLoading"
          >
            <a-select-option
              v-for="role in availableRoles"
              :key="role.id"
              :value="role.id"
            >
              {{ role.name }}
              <span class="text-gray-500 text-xs ml-2">{{
                role.description
              }}</span>
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="授权期限">
          <a-radio-group v-model:value="roleEditForm.expirationType">
            <a-radio value="permanent">永久有效</a-radio>
            <a-radio value="temporary">指定时间</a-radio>
          </a-radio-group>
          <a-date-picker
            v-if="roleEditForm.expirationType === 'temporary'"
            v-model:value="roleEditForm.expiredAt"
            show-time
            placeholder="选择到期时间"
            class="mt-2 w-full"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 权限明细Modal -->
    <a-modal
      v-model:open="showPermissionModal"
      title="权限明细"
      :footer="null"
      width="800px"
    >
      <div v-if="selectedSystemAccess">
        <h4 class="mb-4">
          {{ getSystemName(selectedSystemAccess.systemCode) }} - 权限详情
        </h4>
        <a-tree
          v-if="permissionTree.length > 0"
          :tree-data="permissionTree"
          :check-strictly="false"
          show-line
          :default-expanded-keys="expandedKeys"
        >
          <template #title="{ title, type, hasPermission }">
            <span :class="{ 'text-gray-400': !hasPermission }">
              <component :is="getPermissionIcon(type)" class="mr-1" />
              {{ title }}
              <a-tag
                v-if="!hasPermission"
                color="red"
                size="small"
                class="ml-2"
              >
                无权限
              </a-tag>
            </span>
          </template>
        </a-tree>
        <div v-else class="text-center text-gray-500 py-8">暂无权限信息</div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import {
  CheckCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  FolderOutlined,
  FileOutlined,
  ControlOutlined,
} from "@ant-design/icons-vue";
import { userApi } from "@/api/user";
import { roleApi } from "@/api/role";
import { systemApi } from "@/api/system";
import type {
  UserSystemAccess,
  System,
  SystemRole,
  GrantSystemAccessDto,
  UpdateUserSystemRolesDto,
} from "@/types";
import { formatDate } from "@/utils/dayjs";

interface Props {
  userId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const rolesLoading = ref(false);
const userSystemAccess = ref<UserSystemAccess[]>([]);
const allSystems = ref<System[]>([]);
const availableRoles = ref<SystemRole[]>([]);
const permissionTree = ref<any[]>([]);
const expandedKeys = ref<string[]>([]);

// Modal状态
const showGrantModal = ref(false);
const showRoleEditModal = ref(false);
const showPermissionModal = ref(false);
const selectedSystemAccess = ref<UserSystemAccess | null>(null);

// 表单数据
const grantForm = ref({
  systemCode: "",
  roleIds: [] as string[],
  expirationType: "permanent" as "permanent" | "temporary",
  expiredAt: null as any,
  description: "",
});

const roleEditForm = ref({
  systemCode: "",
  roleIds: [] as string[],
  expirationType: "permanent" as "permanent" | "temporary",
  expiredAt: null as any,
});

// 计算属性
const unauthorizedSystems = computed(() => {
  return allSystems.value.filter(
    (system) =>
      !userSystemAccess.value.some(
        (access) => access.systemCode === system.code
      )
  );
});

const availableSystemsForGrant = computed(() => {
  return allSystems.value.filter(
    (system) =>
      system.status === "active" &&
      !userSystemAccess.value.some(
        (access) => access.systemCode === system.code
      )
  );
});

// 获取系统名称
const getSystemName = (systemCode: string) => {
  const system = allSystems.value.find((s) => s.code === systemCode);
  return system?.name || systemCode;
};

// 获取角色名称
const getRoleName = (systemCode: string, roleId: string) => {
  // 这里应该根据systemCode和roleId获取角色名称
  // 为了简化，直接返回roleId
  return roleId;
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "green";
    case "inactive":
      return "red";
    case "expired":
      return "orange";
    default:
      return "default";
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "正常";
    case "inactive":
      return "已停用";
    case "expired":
      return "已过期";
    default:
      return "未知";
  }
};

// 获取权限图标
const getPermissionIcon = (type: string) => {
  switch (type) {
    case "M":
      return FolderOutlined;
    case "V":
      return FileOutlined;
    case "A":
      return ControlOutlined;
    default:
      return FileOutlined;
  }
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const [systemAccess, systems] = await Promise.all([
      userApi.getUserSystemAccess(props.userId),
      systemApi.getSystems(),
    ]);
    userSystemAccess.value = systemAccess;
    allSystems.value = systems;
  } catch (error) {
    message.error("加载用户系统权限失败");
    console.error("Load user system access error:", error);
  } finally {
    loading.value = false;
  }
};

// 加载系统角色
const loadSystemRoles = async (systemCode: string) => {
  rolesLoading.value = true;
  try {
    const result = await roleApi.getSystemRoles(systemCode);
    availableRoles.value = result.items || [];
  } catch (error) {
    message.error("加载系统角色失败");
    console.error("Load system roles error:", error);
  } finally {
    rolesLoading.value = false;
  }
};

// 处理系统选择变化
const handleSystemChange = (systemCode: string) => {
  grantForm.value.roleIds = [];
  if (systemCode) {
    loadSystemRoles(systemCode);
  }
};

// 授权访问
const handleGrantAccess = (system: System) => {
  grantForm.value.systemCode = system.code;
  grantForm.value.roleIds = [];
  grantForm.value.expirationType = "permanent";
  grantForm.value.expiredAt = null;
  grantForm.value.description = "";
  loadSystemRoles(system.code);
  showGrantModal.value = true;
};

// 确认授权
const handleConfirmGrant = async () => {
  try {
    const data: GrantSystemAccessDto = {
      userId: props.userId,
      systemCode: grantForm.value.systemCode,
      roleIds: grantForm.value.roleIds,
      grantedBy: "current-user", // 应该从当前登录用户获取
      description: grantForm.value.description,
    };

    if (
      grantForm.value.expirationType === "temporary" &&
      grantForm.value.expiredAt
    ) {
      data.expiredAt = grantForm.value.expiredAt.format("YYYY-MM-DD HH:mm:ss");
    }

    await userApi.grantSystemAccess(data);
    message.success("授权成功");
    showGrantModal.value = false;
    loadData();
  } catch (error) {
    message.error("授权失败");
    console.error("Grant system access error:", error);
  }
};

// 取消授权
const handleCancelGrant = () => {
  showGrantModal.value = false;
};

// 编辑角色
const handleEditRoles = (access: UserSystemAccess) => {
  roleEditForm.value.systemCode = access.systemCode;
  roleEditForm.value.roleIds = [...access.roles];
  roleEditForm.value.expirationType = access.expiredAt
    ? "temporary"
    : "permanent";
  roleEditForm.value.expiredAt = access.expiredAt
    ? new Date(access.expiredAt)
    : null;
  loadSystemRoles(access.systemCode);
  showRoleEditModal.value = true;
};

// 确认编辑角色
const handleConfirmEditRoles = async () => {
  try {
    const data: UpdateUserSystemRolesDto = {
      userId: props.userId,
      systemCode: roleEditForm.value.systemCode,
      roleIds: roleEditForm.value.roleIds,
    };

    if (
      roleEditForm.value.expirationType === "temporary" &&
      roleEditForm.value.expiredAt
    ) {
      data.expiredAt = roleEditForm.value.expiredAt.format(
        "YYYY-MM-DD HH:mm:ss"
      );
    }

    await userApi.updateUserSystemRoles(data);
    message.success("更新角色成功");
    showRoleEditModal.value = false;
    loadData();
  } catch (error) {
    message.error("更新角色失败");
    console.error("Update user system roles error:", error);
  }
};

// 取消编辑角色
const handleCancelEditRoles = () => {
  showRoleEditModal.value = false;
};

// 查看权限明细
const handleViewPermissions = async (access: UserSystemAccess) => {
  selectedSystemAccess.value = access;
  try {
    // 这里应该加载用户在该系统的权限树
    // 为了简化，暂时使用空数组
    permissionTree.value = [];
    expandedKeys.value = [];
    showPermissionModal.value = true;
  } catch (error) {
    message.error("加载权限明细失败");
    console.error("Load permission details error:", error);
  }
};

// 移除权限
const handleRevokeAccess = async (access: UserSystemAccess) => {
  try {
    await userApi.revokeSystemAccess(props.userId, access.systemCode);
    message.success("移除权限成功");
    loadData();
  } catch (error) {
    message.error("移除权限失败");
    console.error("Revoke system access error:", error);
  }
};

onMounted(() => {
  loadData();
});

// 暴露刷新方法给父组件
defineExpose({
  refresh: loadData,
});
</script>

<style scoped>
.user-system-permission-config {
  max-width: 100%;
}

:deep(.ant-tag) {
  margin-right: 4px;
}

:deep(.ant-tree-title) {
  display: flex;
  align-items: center;
}
</style>
