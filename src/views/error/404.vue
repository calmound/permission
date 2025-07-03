<template>
  <div
    class="error-page min-h-screen flex items-center justify-center bg-gray-50"
  >
    <div class="text-center">
      <div class="error-icon mb-8">
        <FileSearchOutlined class="text-8xl text-blue-400" />
      </div>

      <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-gray-600 mb-4">页面不存在</h2>
      <p class="text-gray-500 mb-8 max-w-md mx-auto">
        抱歉，您访问的页面不存在。可能是页面已被删除，或您输入了错误的地址。
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
  FileSearchOutlined,
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
      rgba(59, 130, 246, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 75% 75%,
      rgba(37, 99, 235, 0.1) 0%,
      transparent 50%
    );
}

.error-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}
</style>
