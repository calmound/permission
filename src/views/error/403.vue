<template>
  <div
    class="error-page min-h-screen flex items-center justify-center bg-gray-50"
  >
    <div class="text-center">
      <div class="error-icon mb-8">
        <StopOutlined class="text-8xl text-red-400" />
      </div>

      <h1 class="text-6xl font-bold text-gray-800 mb-4">403</h1>
      <h2 class="text-2xl font-semibold text-gray-600 mb-4">访问被拒绝</h2>
      <p class="text-gray-500 mb-8 max-w-md mx-auto">
        抱歉，您没有权限访问该页面。如果您认为这是一个错误，请联系系统管理员。
      </p>

      <div class="space-x-4">
        <a-button type="primary" @click="goBack">
          <ArrowLeftOutlined />
          返回上页
        </a-button>
        <a-button @click="goHome">
          <HomeOutlined />
          回到首页
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  StopOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
} from "@ant-design/icons-vue";

const router = useRouter();

const goBack = () => {
  router.back();
};

const goHome = () => {
  router.push("/");
};
</script>

<style scoped>
.error-page {
  background-image: radial-gradient(
      circle at 25% 25%,
      rgba(239, 68, 68, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 75% 75%,
      rgba(220, 38, 38, 0.1) 0%,
      transparent 50%
    );
}

.error-icon {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    transform: translate3d(0, -10px, 0);
  }
  70% {
    transform: translate3d(0, -5px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}
</style>
