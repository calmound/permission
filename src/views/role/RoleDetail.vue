<template>
  <div class="role-detail-redirect">
    <a-result
      status="info"
      title="角色管理已优化"
      sub-title="角色的查看和编辑功能已迁移至弹窗交互方式，提供更好的用户体验。"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" @click="goToRoleList">
            <UnorderedListOutlined />
            返回角色列表
          </a-button>
          <a-button @click="goToDashboard">
            <DashboardOutlined />
            返回首页
          </a-button>
        </a-space>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  UnorderedListOutlined,
  DashboardOutlined,
} from "@ant-design/icons-vue";

const router = useRouter();

const goToRoleList = () => {
  router.push("/role/list");
};

const goToDashboard = () => {
  router.push("/dashboard");
};
</script>

<style scoped>
.role-detail-redirect {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}
</style>
