<template>
  <div
    class="flex items-center justify-center min-h-screen login-container bg-gradient-to-br from-blue-50 to-indigo-100"
  >
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-2xl login-box">
      <!-- Logo 和标题 -->
      <div class="mb-8 text-center">
        <!-- <img
          src="/logo.svg"
          alt="Logo"
          class="w-12 h-12 mx-auto mb-4"
          @error="onLogoError"
        /> -->
        <h1 class="mb-2 text-2xl font-bold text-gray-800">
          用户中心权限管理系统
        </h1>
        <p class="text-sm text-gray-500">请使用您的账号登录系统</p>
      </div>

      <!-- 登录表单 -->
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        @finish="handleLogin"
        layout="vertical"
        class="login-form"
      >
        <a-form-item name="username" label="用户名">
          <a-input
            v-model:value="formData.username"
            size="large"
            placeholder="请输入用户名"
            autocomplete="username"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="password" label="密码">
          <a-input-password
            v-model:value="formData.password"
            size="large"
            placeholder="请输入密码"
            autocomplete="current-password"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item name="captcha" label="验证码" v-if="showCaptcha">
          <div class="flex space-x-2">
            <a-input
              v-model:value="formData.captcha"
              size="large"
              placeholder="请输入验证码"
              class="flex-1"
            />
            <div class="cursor-pointer captcha-image" @click="refreshCaptcha">
              <img :src="captchaUrl" alt="验证码" class="h-10 border rounded" />
            </div>
          </div>
        </a-form-item>

        <a-form-item class="mb-6">
          <div class="flex items-center justify-between">
            <a-checkbox v-model:checked="rememberMe"> 记住我 </a-checkbox>
            <a-button type="link" class="p-0" @click="showForgotPassword">
              忘记密码？
            </a-button>
          </div>
        </a-form-item>

        <a-form-item class="mb-0">
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            :loading="loading"
            block
            class="h-12"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 底部信息 -->
      <div class="mt-8 text-xs text-center text-gray-400">
        <p>© 2024 用户中心权限管理系统. All rights reserved.</p>
        <p>Version 1.0.0</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import { useAuthStore } from "@stores/auth";
import type { LoginDto } from "@/types/index";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 表单数据
const formData = reactive<LoginDto>({
  username: "",
  password: "",
  captcha: "",
});

// 表单状态
const formRef = ref();
const loading = ref(false);
const rememberMe = ref(false);
const showCaptcha = ref(false);
const captchaUrl = ref("");

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 50, message: "用户名长度为3-50个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 50, message: "密码长度为6-50个字符", trigger: "blur" },
  ],
  captcha: [
    {
      required: () => showCaptcha.value,
      message: "请输入验证码",
      trigger: "blur",
    },
  ],
};

// 处理登录
const handleLogin = async () => {
  try {
    loading.value = true;

    const success = await authStore.login(formData);

    if (success) {
      // 登录成功，重定向到目标页面
      const redirect = (route.query.redirect as string) || "/";
      router.push(redirect);
    } else {
      // 登录失败，可能需要显示验证码
      if (!showCaptcha.value) {
        showCaptcha.value = true;
        refreshCaptcha();
      }
    }
  } catch (error: any) {
    console.error("登录失败:", error);

    // 如果是验证码错误，刷新验证码
    if (error.message?.includes("验证码")) {
      refreshCaptcha();
    }
  } finally {
    loading.value = false;
  }
};

// 刷新验证码
const refreshCaptcha = () => {
  captchaUrl.value = `/api/auth/captcha?${Date.now()}`;
};

// 忘记密码
const showForgotPassword = () => {
  message.info("请联系系统管理员重置密码");
};

// Logo 错误处理
const onLogoError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.style.display = "none";
};

// 组件挂载
onMounted(() => {
  // 如果已经登录，直接跳转
  if (authStore.isLoggedIn) {
    router.push("/");
  }

  // 从localStorage恢复记住的用户名
  const savedUsername = localStorage.getItem("rememberedUsername");
  if (savedUsername) {
    formData.username = savedUsername;
    rememberMe.value = true;
  }
});

// 监听记住我选项
watch(
  () => rememberMe.value,
  (remember) => {
    if (remember && formData.username) {
      localStorage.setItem("rememberedUsername", formData.username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }
  }
);
</script>

<style scoped>
.login-container {
  background-image: radial-gradient(
      circle at 25% 25%,
      rgba(59, 130, 246, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 75% 75%,
      rgba(99, 102, 241, 0.1) 0%,
      transparent 50%
    );
}

.login-box {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-form :deep(.ant-form-item-label) {
  font-weight: 500;
}

.captcha-image {
  display: flex;
  align-items: center;
}

.captcha-image img {
  transition: opacity 0.3s ease;
}

.captcha-image:hover img {
  opacity: 0.8;
}
</style>
