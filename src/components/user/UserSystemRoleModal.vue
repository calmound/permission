<template>
  <a-modal
    :open="visible"
    :title="modalTitle"
    :width="600"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :destroy-on-close="true"
  >
    <div class="py-4">
      <!-- 系统信息显示 -->
      <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
        <div
          class="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-semibold"
          :style="{ backgroundColor: getSystemColor(systemInfo?.code || '') }"
        >
          {{ systemInfo?.name?.charAt(0) || "S" }}
        </div>
        <div>
          <div class="font-semibold text-lg">
            🏢 系统：{{ systemInfo?.name || "未知系统" }}
          </div>
          <div class="text-sm text-gray-500">{{ systemInfo?.code }}</div>
        </div>
      </div>

      <!-- 当前状态 -->
      <div
        v-if="currentRole"
        class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div class="text-sm font-medium text-blue-800">
          当前角色：{{ currentRole }}
        </div>
      </div>

      <!-- 角色选择 -->
      <div class="space-y-1">
        <div class="text-sm font-medium text-gray-700 mb-3">请选择角色：</div>

        <a-radio-group
          v-model:value="selectedRole"
          class="w-full"
          @change="handleRoleChange"
        >
          <div class="space-y-3">
            <!-- 可用角色列表 -->
            <div
              v-for="role in availableRoles"
              :key="role.id"
              class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <a-radio :value="role.id" class="w-full">
                <div class="flex-1 ml-2">
                  <div class="font-medium">{{ role.name }}</div>
                  <div class="text-sm text-gray-500 mt-1">
                    {{ role.description }}
                  </div>
                  <!-- 权限预览 -->
                  <div
                    v-if="role.permissions && role.permissions.length > 0"
                    class="mt-2"
                  >
                    <div class="text-xs text-gray-400 mb-1">包含权限：</div>
                    <div class="flex flex-wrap gap-1">
                      <a-tag
                        v-for="permission in role.permissions.slice(0, 3)"
                        :key="permission"
                        size="small"
                        class="text-xs"
                      >
                        {{ formatPermissionName(permission) }}
                      </a-tag>
                      <span
                        v-if="role.permissions.length > 3"
                        class="text-xs text-gray-400"
                      >
                        +{{ role.permissions.length - 3 }}个权限
                      </span>
                    </div>
                  </div>
                </div>
              </a-radio>
            </div>

            <!-- 移除权限选项 -->
            <div
              class="border border-red-200 rounded-lg p-3 hover:bg-red-50 transition-colors"
            >
              <a-radio value="REMOVE" class="w-full">
                <div class="flex-1 ml-2">
                  <div class="font-medium text-red-600">移除权限</div>
                  <div class="text-sm text-red-500 mt-1">
                    不再拥有此系统的任何权限
                  </div>
                </div>
              </a-radio>
            </div>
          </div>
        </a-radio-group>
      </div>

      <!-- 权限详情预览 -->
      <div
        v-if="selectedRoleInfo && selectedRole !== 'REMOVE'"
        class="mt-6 p-4 bg-blue-50 rounded-lg"
      >
        <div class="text-sm font-medium text-blue-800 mb-2">权限详情：</div>
        <div class="space-y-1">
          <div
            v-for="permission in selectedRoleInfo.permissions"
            :key="permission"
            class="text-sm text-blue-700 flex items-center gap-2"
          >
            <span class="w-1 h-1 bg-blue-500 rounded-full"></span>
            {{ formatPermissionName(permission) }}
          </div>
        </div>
      </div>

      <!-- 移除确认 -->
      <div
        v-if="selectedRole === 'REMOVE'"
        class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
      >
        <div class="text-sm font-medium text-red-800 mb-1">
          ⚠️ 确认移除权限？
        </div>
        <div class="text-sm text-red-600">
          用户将失去在
          <strong>{{ systemInfo?.name }}</strong>
          系统中的所有权限，无法访问相关功能。
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "ant-design-vue";
import type { SystemRole, System } from "@/types";
import { systemApi } from "@/api/system";

// Props
interface Props {
  visible: boolean;
  userId: string;
  systemInfo?: System;
  currentRole?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentRole: "",
});

// Emits
const emit = defineEmits<{
  close: [];
  success: [];
}>();

// 响应式数据
const loading = ref(false);
const selectedRole = ref<string | null>(null);
const availableRoles = ref<SystemRole[]>([]);

// 计算属性
const modalTitle = computed(() => {
  return `为用户分配角色`;
});

const selectedRoleInfo = computed(() => {
  if (!selectedRole.value || selectedRole.value === "REMOVE") return null;
  return availableRoles.value.find((role) => role.id === selectedRole.value);
});

// 监听visible变化
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      selectedRole.value = props.currentRole || null;
      loadAvailableRoles();
    }
  }
);

// 方法
const loadAvailableRoles = async () => {
  if (!props.systemInfo?.code) return;

  try {
    const response = await systemApi.getSystemRoles(props.systemInfo.code);
    availableRoles.value = response.data.items;
  } catch (error) {
    console.error("加载角色列表失败:", error);
    message.error("加载角色列表失败");
  }
};

const handleRoleChange = () => {
  // 角色选择变化时的处理
};

const handleSubmit = async () => {
  if (!selectedRole.value) {
    message.warning("请选择一个角色");
    return;
  }

  loading.value = true;
  try {
    if (selectedRole.value === "REMOVE") {
      // 移除用户系统权限
      // await userApi.removeSystemAccess(props.userId, props.systemInfo?.code)
      message.success("权限移除成功");
    } else {
      // 分配用户系统角色
      // await userApi.assignSystemRole(props.userId, props.systemInfo?.code, selectedRole.value)
      message.success("角色分配成功");
    }

    emit("success");
  } catch (error) {
    message.error("操作失败");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit("close");
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

const formatPermissionName = (permission: string) => {
  // 格式化权限名称显示
  return permission
    .replace(/[_:]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};
</script>

<style scoped>
.ant-radio-wrapper {
  width: 100%;
}

.ant-radio {
  align-self: flex-start;
  margin-top: 2px;
}

:deep(.ant-radio-group) {
  width: 100%;
}

:deep(.ant-radio-wrapper) {
  display: flex;
  align-items: flex-start;
  padding: 0;
  margin: 0;
}

:deep(.ant-radio + *) {
  flex: 1;
}
</style>
