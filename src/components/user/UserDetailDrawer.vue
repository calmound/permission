<template>
  <a-drawer
    v-model:open="visible"
    title="用户详情"
    :width="600"
    :bodyStyle="{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }"
    placement="right"
    @close="handleClose"
  >
    <div v-if="userInfo" class="space-y-6">
      <!-- 基本信息 -->
      <a-card title="基本信息" size="small">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-gray-500">用户名</div>
            <div class="font-medium">{{ userInfo.username }}</div>
          </div>
          <div>
            <div class="text-gray-500">昵称</div>
            <div class="font-medium">{{ userInfo.nickname || "-" }}</div>
          </div>
          <div>
            <div class="text-gray-500">邮箱</div>
            <div class="font-medium">{{ userInfo.email || "-" }}</div>
          </div>
          <div>
            <div class="text-gray-500">手机号</div>
            <div class="font-medium">{{ userInfo.phone || "-" }}</div>
          </div>
          <div>
            <div class="text-gray-500">状态</div>
            <a-tag :color="userInfo.status === 'active' ? 'green' : 'red'">
              {{ userInfo.status === "active" ? "启用" : "停用" }}
            </a-tag>
          </div>
          <div>
            <div class="text-gray-500">创建时间</div>
            <div class="font-medium">{{ formatDate(userInfo.createdAt) }}</div>
          </div>
        </div>
      </a-card>

      <!-- 角色信息 -->
      <a-card title="角色信息" size="small">
        <div
          v-if="userInfo.roleIds && userInfo.roleIds.length > 0"
          class="space-y-2"
        >
          <a-tag v-for="roleId in userInfo.roleIds" :key="roleId" color="blue">
            角色ID: {{ roleId }}
          </a-tag>
        </div>
        <div v-else class="text-gray-500">暂无角色</div>
      </a-card>

      <!-- 操作按钮 -->
      <div class="flex gap-2">
        <a-button type="primary" @click="handleEdit">
          <EditOutlined />
          编辑
        </a-button>
        <a-button @click="handleResetPassword">
          <KeyOutlined />
          重置密码
        </a-button>
        <a-button
          :type="userInfo.status === 'active' ? 'default' : 'primary'"
          @click="handleToggleStatus"
        >
          {{ userInfo.status === "active" ? "停用" : "启用" }}
        </a-button>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { EditOutlined, KeyOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import type { User } from "@/types";
import { userApi } from "@api/user";

interface Props {
  open: boolean;
  userId?: string;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "edit", user: User): void;
  (e: "refresh"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);
const loading = ref(false);
const userInfo = ref<User | null>(null);

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
    message.error("加载用户详情失败");
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  userInfo.value = null;
};

const handleEdit = () => {
  if (userInfo.value) {
    emit("edit", userInfo.value);
  }
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
    emit("refresh");
  } catch (error) {
    message.error("状态更新失败");
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("zh-CN");
};
</script>
