<template>
  <a-drawer
    v-model:open="visible"
    title="用户详情"
    :width="700"
    :bodyStyle="{
      padding: '0',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }"
    placement="right"
    @close="handleClose"
  >
    <div class="flex-1 overflow-y-auto" style="padding: 20px">
      <div v-if="userInfo" class="space-y-6">
        <!-- 基本信息 -->
        <a-card title="📋 基本信息" size="small">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-gray-500 text-sm">用户名</div>
              <div class="font-medium">{{ userInfo.username }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-sm">昵称</div>
              <div class="font-medium">{{ userInfo.nickname || "-" }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-sm">邮箱</div>
              <div class="font-medium text-sm">{{ userInfo.email || "-" }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-sm">手机号</div>
              <div class="font-medium">{{ userInfo.phone || "-" }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-sm">状态</div>
              <a-tag :color="userInfo.status === 'active' ? 'green' : 'red'">
                {{ userInfo.status === "active" ? "启用" : "停用" }}
              </a-tag>
            </div>
            <div>
              <div class="text-gray-500 text-sm">创建时间</div>
              <div class="font-medium text-sm">
                {{ formatDate(userInfo.createdAt) }}
              </div>
            </div>
          </div>
        </a-card>

        <!-- 系统权限 -->
        <a-card size="small">
          <template #title>
            <div class="flex items-center justify-between">
              <span>🎯 系统权限</span>
              <a-tag color="blue" v-if="activeSystemsCount > 0">
                {{ activeSystemsCount }} 个系统
              </a-tag>
            </div>
          </template>

          <div
            v-if="userInfo.systemAccess && userInfo.systemAccess.length > 0"
            class="space-y-4"
          >
            <!-- 权限概览 -->
            <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">
                  {{ activeSystemsCount }}
                </div>
                <div class="text-sm text-gray-600">已授权系统</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">
                  {{ assignedRolesCount }}
                </div>
                <div class="text-sm text-gray-600">分配角色</div>
              </div>
            </div>

            <!-- 系统权限详情 -->
            <div class="space-y-3">
              <div
                v-for="access in userInfo.systemAccess"
                :key="access.systemCode"
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <!-- 系统图标 -->
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    :style="{
                      backgroundColor: getSystemColor(access.systemCode),
                    }"
                  >
                    {{ access.systemName.charAt(0) }}
                  </div>

                  <!-- 系统信息 -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <h4 class="font-medium text-gray-900 truncate">
                        {{ access.systemName }}
                      </h4>
                      <a-tag
                        :color="getStatusColor(access.status)"
                        size="small"
                      >
                        {{ getStatusText(access.status) }}
                      </a-tag>
                    </div>

                    <div class="text-sm text-gray-500 mb-2">
                      {{ access.systemCode }}
                    </div>

                    <!-- 角色信息 -->
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-600">角色：</span>
                      <a-tag v-if="access.roleName" color="blue" size="small">
                        {{ access.roleName }}
                      </a-tag>
                      <span v-else class="text-sm text-gray-400"
                        >未分配角色</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🔒</div>
            <div>该用户暂未分配任何系统权限</div>
            <div class="text-sm mt-1">请联系管理员进行权限分配</div>
          </div>
        </a-card>
      </div>

      <div v-else-if="!loading" class="text-center py-8 text-gray-500">
        <div class="text-4xl mb-2">😵</div>
        <div>用户信息加载失败</div>
      </div>

      <div v-else class="text-center py-8">
        <a-spin size="large" />
        <div class="mt-2 text-gray-500">正在加载...</div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { message } from "ant-design-vue";
import type { User } from "@/types";
import { userApi } from "@api/user";

interface Props {
  open: boolean;
  userId?: string;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "refresh"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);
const loading = ref(false);
const userInfo = ref<User | null>(null);

// 计算属性
const activeSystemsCount = computed(() => {
  if (!userInfo.value?.systemAccess) return 0;
  return userInfo.value.systemAccess.filter(
    (access) => access.status === "active"
  ).length;
});

const assignedRolesCount = computed(() => {
  if (!userInfo.value?.systemAccess) return 0;
  return userInfo.value.systemAccess.filter(
    (access) => access.roleId && access.status === "active"
  ).length;
});

const expiredSystemsCount = computed(() => {
  if (!userInfo.value?.systemAccess) return 0;
  return userInfo.value.systemAccess.filter(
    (access) => access.status === "expired"
  ).length;
});

watch(
  () => props.open,
  (newVal) => {
    visible.value = newVal;
    if (newVal && props.userId) {
      loadUserDetail();
    }
  }
);

watch(visible, (newVal) => {
  if (!newVal) {
    emit("update:open", false);
  }
});

const loadUserDetail = async () => {
  if (!props.userId) return;

  loading.value = true;
  try {
    const response = await userApi.getUser(props.userId);
    userInfo.value = response;
  } catch (error) {
    console.error("加载用户详情失败:", error);
    message.error("加载用户详情失败");
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  userInfo.value = null;
};

// 工具方法
const formatDate = (date: string) => {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

const getStatusColor = (status: string) => {
  const colorMap = {
    active: "green",
    inactive: "red",
    expired: "orange",
  };
  return colorMap[status as keyof typeof colorMap] || "default";
};

const getStatusText = (status: string) => {
  const textMap = {
    active: "激活",
    inactive: "停用",
    expired: "已过期",
  };
  return textMap[status as keyof typeof textMap] || status;
};
</script>

<style scoped>
:deep(.ant-card-head-title) {
  font-size: 14px;
  font-weight: 600;
}

:deep(.ant-card-body) {
  padding: 16px;
}

:deep(.ant-tag) {
  margin: 0;
}
</style>
