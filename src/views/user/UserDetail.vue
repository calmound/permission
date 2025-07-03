<template>
  <div class="p-6">
    <a-page-header :title="userInfo?.username || '用户详情'" @back="handleBack">
      <template #extra>
        <a-button type="primary" @click="handleEdit">
          <EditOutlined />
          编辑
        </a-button>
        <a-button @click="handleResetPassword">
          <KeyOutlined />
          重置密码
        </a-button>
        <a-button
          :type="userInfo?.status === 'active' ? 'default' : 'primary'"
          @click="handleToggleStatus"
        >
          {{ userInfo?.status === "active" ? "停用" : "启用" }}
        </a-button>
      </template>
    </a-page-header>

    <div v-if="loading" class="text-center py-8">
      <a-spin size="large" />
    </div>

    <div v-else-if="userInfo" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <a-button
                type="primary"
                size="small"
                :disabled="!userInfo?.systemAccess?.length"
                @click="handleBatchAssignRoles"
              >
                批量分配
              </a-button>
            </div>
          </template>

          <div v-if="loading" class="text-center py-4">
            <a-spin />
          </div>
          <div v-else-if="userInfo?.systemAccess?.length" class="space-y-3">
            <div
              v-for="access in userInfo.systemAccess"
              :key="access.systemCode"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <!-- 系统信息头部 -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    :style="{
                      backgroundColor: getSystemColor(access.systemCode),
                    }"
                  >
                    {{ access.systemName.charAt(0) }}
                  </div>
                  <div>
                    <div class="font-semibold text-base">
                      {{ access.systemName }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ access.systemCode }}
                    </div>
                  </div>
                </div>
                <a-tag
                  :color="
                    access.status === 'active'
                      ? 'green'
                      : access.status === 'expired'
                      ? 'orange'
                      : 'red'
                  "
                  class="text-xs"
                >
                  {{ getStatusText(access.status) }}
                </a-tag>
              </div>

              <!-- 权限详情 -->
              <div class="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div class="text-xs text-gray-500 mb-1">当前角色</div>
                  <div
                    v-if="access.roleName"
                    class="text-sm font-medium text-green-600"
                  >
                    {{ access.roleName }}
                  </div>
                  <div v-else class="text-sm text-gray-400">未分配</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">授权时间</div>
                  <div class="text-sm">{{ formatDate(access.grantedAt) }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">授权人</div>
                  <div class="text-sm">{{ access.grantedBy }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">过期时间</div>
                  <div class="text-sm">
                    {{
                      access.expiredAt ? formatDate(access.expiredAt) : "永久"
                    }}
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex gap-2 pt-2 border-t border-gray-100">
                <a-button size="small" @click="handleEditSystemRole(access)">
                  重新分配
                </a-button>
                <a-button
                  size="small"
                  danger
                  @click="handleRemoveSystemAccess(access)"
                >
                  移除权限
                </a-button>
                <a-button
                  v-if="access.status === 'expired'"
                  size="small"
                  type="primary"
                  @click="handleRenewAccess(access)"
                >
                  续期
                </a-button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <div class="text-gray-500 mb-4">用户尚未分配任何系统权限</div>
            <a-button type="primary" @click="handleEdit">
              编辑用户系统归属
            </a-button>
          </div>
        </a-card>

        <!-- 权限概览 -->
        <a-card title="权限概览">
          <div class="space-y-4">
            <div>
              <div class="text-sm text-gray-500">系统权限统计</div>
              <div class="flex gap-4 mt-1">
                <div class="text-center">
                  <div class="text-lg font-semibold text-green-600">
                    {{ activeSystemsCount }}
                  </div>
                  <div class="text-xs text-gray-500">已分配</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-semibold text-gray-400">
                    {{ totalSystemsCount - activeSystemsCount }}
                  </div>
                  <div class="text-xs text-gray-500">未分配</div>
                </div>
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">最近登录</div>
              <div class="font-medium">
                {{ formatDate(userInfo.lastLoginAt) }}
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

    <!-- 角色分配模态框 -->
    <UserRoleModal
      v-model:open="roleModalVisible"
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
import UserRoleModal from "@components/user/UserRoleModal.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const userInfo = ref<User | null>(null);
const editModalVisible = ref(false);
const roleModalVisible = ref(false);

// 计算属性
const activeSystemsCount = computed(() => {
  return (
    userInfo.value?.systemAccess?.filter((s) => s.status === "active").length ||
    0
  );
});

const totalSystemsCount = computed(() => {
  return userInfo.value?.systemAccess?.length || 0;
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
    message.error("加载用户详情失败");
  } finally {
    loading.value = false;
  }
};

// 新方法
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
  const statusMap = {
    active: "✅ 活跃",
    inactive: "❌ 无权限",
    expired: "⚠️ 已过期",
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

const handleBatchAssignRoles = () => {
  roleModalVisible.value = true;
};

const handleEditSystemRole = (access: any) => {
  // 可以扩展为单个系统的角色编辑
  roleModalVisible.value = true;
};

const handleRemoveSystemAccess = async (access: any) => {
  if (!userInfo.value) return;

  try {
    await userApi.revokeSystemAccess(userInfo.value.id, access.systemCode);
    message.success("系统权限移除成功");
    handleRefresh();
  } catch (error) {
    message.error("系统权限移除失败");
  }
};

const handleRenewAccess = async (access: any) => {
  // 续期逻辑
  try {
    await userApi.updateUserSystemRoles({
      userId: userInfo.value!.id,
      systemCode: access.systemCode,
      roleIds: [access.roleId],
      expiredAt: undefined, // 设为永久
    });
    message.success("权限续期成功");
    handleRefresh();
  } catch (error) {
    message.error("权限续期失败");
  }
};

const handleBack = () => {
  router.push("/user/list");
};

const handleEdit = () => {
  editModalVisible.value = true;
};

const handleResetPassword = async () => {
  if (!userInfo.value) return;

  try {
    await userApi.resetPassword(userInfo.value.id);
    message.success("密码重置成功");
  } catch (error) {
    message.error("密码重置失败");
  }
};

const handleToggleStatus = async () => {
  if (!userInfo.value) return;

  const newStatus = userInfo.value.status === "active" ? "inactive" : "active";
  try {
    await userApi.updateStatus(userInfo.value.id, newStatus);
    userInfo.value.status = newStatus;
    message.success("状态更新成功");
  } catch (error) {
    message.error("状态更新失败");
  }
};

const handleAssignRole = () => {
  roleModalVisible.value = true;
};

const handleRefresh = () => {
  loadUserDetail();
};

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("zh-CN");
};

const getSystemName = (systemCode: string) => {
  const systemMap = {
    PERMISSION_SYSTEM: "权限管理系统",
    USER_CENTER: "用户中心",
    ADMIN: "管理后台",
  };
  return systemMap[systemCode as keyof typeof systemMap] || systemCode;
};
</script>
