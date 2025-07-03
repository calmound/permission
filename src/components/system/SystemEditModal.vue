<template>
  <a-modal
    :open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :width="600"
    :destroy-on-close="true"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      class="mt-6"
    >
      <a-form-item label="系统编码" name="code">
        <a-input
          v-model:value="formData.code"
          placeholder="请输入系统编码"
          :disabled="isEdit"
        />
        <div class="text-xs text-gray-500 mt-1">
          系统唯一标识，创建后不可修改
        </div>
      </a-form-item>

      <a-form-item label="系统名称" name="name">
        <a-input v-model:value="formData.name" placeholder="请输入系统名称" />
      </a-form-item>

      <a-form-item label="系统描述" name="description">
        <a-textarea
          v-model:value="formData.description"
          placeholder="请输入系统描述"
          :rows="3"
        />
      </a-form-item>

      <a-form-item label="系统状态" name="status">
        <a-radio-group v-model:value="formData.status">
          <a-radio value="active">启用</a-radio>
          <a-radio value="inactive">禁用</a-radio>
        </a-radio-group>
        <div class="text-xs text-gray-500 mt-1">
          禁用后该系统将无法进行权限验证
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { message, type FormInstance } from "ant-design-vue";
import type { System } from "@/types";
import { systemApi } from "@/api/system";

// Props
interface Props {
  visible: boolean;
  system?: System | null;
}

const props = withDefaults(defineProps<Props>(), {
  system: null,
});

// Emits
const emit = defineEmits<{
  close: [];
  success: [];
}>();

// 响应式数据
const loading = ref(false);
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive({
  code: "",
  name: "",
  description: "",
  status: "active" as "active" | "inactive",
});

// 计算属性
const isEdit = computed(() => !!props.system);
const modalTitle = computed(() => (isEdit.value ? "编辑系统" : "添加系统"));

// 表单验证规则
const rules = {
  code: [
    { required: true, message: "请输入系统编码" },
    { min: 2, max: 50, message: "系统编码长度为2-50个字符" },
    {
      pattern: /^[A-Z_][A-Z0-9_]*$/,
      message: "系统编码只能包含大写字母、数字和下划线，且以字母或下划线开头",
    },
  ],
  name: [
    { required: true, message: "请输入系统名称" },
    { min: 2, max: 100, message: "系统名称长度为2-100个字符" },
  ],
  description: [{ max: 500, message: "系统描述不能超过500个字符" }],
  status: [{ required: true, message: "请选择系统状态" }],
};

// 监听visible变化，重置表单
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm();
    }
  }
);

// 监听system变化，填充表单
watch(
  () => props.system,
  (system) => {
    if (system && props.visible) {
      Object.assign(formData, {
        code: system.code,
        name: system.name,
        description: system.description || "",
        status: system.status,
      });
    }
  },
  { immediate: true }
);

// 方法
const resetForm = () => {
  formRef.value?.resetFields();
  if (!props.system) {
    Object.assign(formData, {
      code: "",
      name: "",
      description: "",
      status: "active",
    });
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value) {
      // 编辑系统
      await systemApi.updateSystem(formData.code, {
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
      message.success("系统更新成功");
    } else {
      // 创建系统
      await systemApi.createSystem(formData);
      message.success("系统创建成功");
    }

    emit("success");
  } catch (error) {
    if (error instanceof Error) {
      // 表单验证错误
      return;
    }
    message.error(isEdit.value ? "系统更新失败" : "系统创建失败");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit("close");
};
</script>

<style scoped>
.ant-form-item {
  margin-bottom: 20px;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
}

:deep(.ant-input),
:deep(.ant-textarea) {
  border-radius: 6px;
}

:deep(.ant-radio-group) {
  display: flex;
  gap: 16px;
}
</style>
