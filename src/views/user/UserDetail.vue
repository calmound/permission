<template>
  <div class="p-6">
    <a-page-header :title="userInfo?.username || '用户详情'" @back="handleBack">
      <template #extra>
        <a-button
          :type="userInfo?.status === 'active' ? 'default' : 'primary'"
          @click="handleToggleStatus"
        >
          {{ userInfo?.status === "active" ? "停用" : "启用" }}
        </a-button>
      </template>
    </a-page-header>

    <div v-if="loading" class="py-8 text-center">
      <a-spin size="large" />
    </div>

    <div v-else-if="userInfo" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- 基本信息 -->
      <div class="lg:col-span-2">
        <a-card title="基本信息" class="mb-6">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="用户名">{{
              userInfo.username
            }}</a-descriptions-item>
            <a-descriptions-item label="昵称">{{
              userInfo.nickname || "-"
            }}</a-descriptions-item>
            <a-descriptions-item label="邮箱">{{
              userInfo.email || "-"
            }}</a-descriptions-item>
            <a-descriptions-item label="手机号">{{
              userInfo.phone || "-"
            }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="userInfo.status === 'active' ? 'green' : 'red'">
                {{ userInfo.status === "active" ? "启用" : "停用" }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="所属系统">
              <a-tag v-if="userInfo.systemCode" color="blue">
                {{ getSystemName(userInfo.systemCode) }}
              </a-tag>
              <span v-else class="text-gray-400">未绑定</span>
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">{{
              formatDate(userInfo.createdAt)
            }}</a-descriptions-item>
            <a-descriptions-item label="更新时间">{{
              formatDate(userInfo.updatedAt)
            }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 操作日志 -->
        <a-card title="最近操作">
          <a-empty description="暂无操作记录" />
        </a-card>
      </div>

      <!-- 侧边信息 -->
      <div>
        <!-- 系统权限管理 -->
        <a-card class="mb-6">
          <template #title>
            <div class="flex items-center justify-between">
              <span>🏢 系统权限管理</span>
            </div>
          </template>

          <div v-if="loading" class="py-4 text-center">
            <a-spin />
          </div>
          <div v-else-if="userInfo?.systemAccess?.length" class="space-y-3">
            <div
              v-for="access in userInfo.systemAccess"
              :key="access.systemCode"
              class="p-4 border border-gray-200 rounded-lg"
              :class="{
                'border-orange-300 bg-orange-50': access.status === 'expired',
              }"
            >
              <!-- 系统信息头部 -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-lg"
                    :style="{
                      backgroundColor: getSystemColor(access.systemCode),
                    }"
                  >
                    {{ access.systemName.charAt(0) }}
                  </div>
                  <div>
                    <div class="text-base font-semibold">
                      {{ access.systemName }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ access.systemCode }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <a-tag :color="getStatusColor(access.status)" size="small">
                    {{ getStatusText(access.status) }}
                  </a-tag>
                  <!-- 已过期特殊提示 -->
                  <span
                    v-if="access.status === 'expired'"
                    class="text-xs text-orange-600"
                  >
                    ⚠️ 需要续期
                  </span>
                </div>
              </div>

              <!-- 角色信息 -->
              <div class="flex items-center gap-2 mb-3">
                <span class="text-sm text-gray-600">角色：</span>
                <a-tag v-if="access.roleName" color="blue" size="small">
                  {{ access.roleName }}
                </a-tag>
                <span v-else class="text-sm text-gray-400">未分配角色</span>
              </div>
            </div>
          </div>

          <!-- 已过期权限提醒 -->
          <div
            v-if="expiredSystemsCount > 0"
            class="p-3 mt-4 border border-orange-200 rounded-lg bg-orange-50"
          >
            <div class="flex items-center gap-2 text-orange-800">
              <span class="text-lg">⚠️</span>
              <div>
                <div class="text-sm font-medium">权限过期提醒</div>
                <div class="text-xs">
                  该用户有
                  {{ expiredSystemsCount }} 个系统权限已过期，请联系管理员处理
                </div>
              </div>
            </div>
          </div>

          <div v-else class="py-8 text-center">
            <div class="mb-4 text-gray-500">用户尚未分配任何系统权限</div>
            <div class="text-sm text-gray-400">请联系管理员进行权限分配</div>
          </div>
        </a-card>

        <!-- 权限概览 -->
        <a-card title="🔍 权限概览">
          <div class="space-y-4">
            <!-- 统计数据 -->
            <div class="grid grid-cols-3 gap-2">
              <div class="p-3 text-center rounded-lg bg-blue-50">
                <div class="text-lg font-bold text-blue-600">
                  {{ activeSystemsCount }}
                </div>
                <div class="text-xs text-gray-600">已授权系统</div>
              </div>
              <div class="p-3 text-center rounded-lg bg-green-50">
                <div class="text-lg font-bold text-green-600">
                  {{ assignedRolesCount }}
                </div>
                <div class="text-xs text-gray-600">分配角色</div>
              </div>
              <div class="p-3 text-center rounded-lg bg-orange-50">
                <div class="text-lg font-bold text-orange-600">
                  {{ expiredSystemsCount }}
                </div>
                <div class="text-xs text-gray-600">已过期权限</div>
              </div>
            </div>

            <!-- 最近登录信息 -->
            <div class="pt-2 border-t border-gray-100">
              <div class="mb-1 text-sm text-gray-500">最近登录</div>
              <div class="text-sm font-medium">
                {{ formatDate(userInfo?.lastLoginAt) }}
              </div>
            </div>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 编辑模态框 -->
    <UserEditModal
      v-model:open="editModalVisible"
      :user="userInfo"
      @success="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { EditOutlined, KeyOutlined, UserOutlined } from "@ant-design/icons-vue";
import type { User, System, UserSystemAccess } from "@/types";
import { userApi } from "@api/user";
import { systemApi } from "@api/system";
import UserEditModal from "@components/user/UserEditModal.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const userInfo = ref<User | null>(null);
const editModalVisible = ref(false);

// 计算属性
const activeSystemsCount = computed(() => {
  return (
    userInfo.value?.systemAccess?.filter((s) => s.status === "active").length ||
    0
  );
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

onMounted(() => {
  loadUserDetail();
});

const loadUserDetail = async () => {
  const userId = route.params.id as string;
  if (!userId) {
    message.error("用户ID不能为空");
    return;
  }

  loading.value = true;
  try {
    const response = await userApi.getUser(userId);
    userInfo.value = response;
  } catch (error) {
    console.error("加载用户详情失败:", error);
    message.error("加载用户详情失败");
  } finally {
    loading.value = false;
  }
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

const getStatusText = (status: string) => {
  const textMap = {
    active: "激活",
    inactive: "停用",
    expired: "已过期",
  };
  return textMap[status as keyof typeof textMap] || status;
};

const getStatusColor = (status: string) => {
  const colorMap = {
    active: "green",
    inactive: "red",
    expired: "orange",
  };
  return colorMap[status as keyof typeof colorMap] || "default";
};

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSystemName = (systemCode: string) => {
  const systemMap = {
    PERMISSION_SYSTEM: "权限管理系统",
    USER_CENTER: "用户中心",
    ADMIN: "管理后台",
  };
  return systemMap[systemCode as keyof typeof systemMap] || systemCode;
};

// 事件处理
const handleToggleStatus = async () => {
  if (!userInfo.value) return;

  const newStatus = userInfo.value.status === "active" ? "inactive" : "active";
  try {
    await userApi.updateStatus(userInfo.value.id, newStatus);
    userInfo.value.status = newStatus;
    message.success("状态更新成功");
  } catch (error) {
    console.error("状态更新失败:", error);
    message.error("状态更新失败");
  }
};

const handleBack = () => {
  router.push("/user/list");
};

const handleRefresh = () => {
  loadUserDetail();
};
</script>
