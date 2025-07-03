<template>
  <a-modal
    v-model:open="visible"
    :title="isEdit ? '编辑角色' : '新增角色'"
    :width="800"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirmLoading="loading"
    :bodyStyle="{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }"
  >
    <div class="role-edit-content">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
        class="mt-4"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="角色名称" name="name">
              <a-input
                v-model:value="formData.name"
                placeholder="请输入角色名称"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="角色等级" name="level">
              <a-rate v-model:value="formData.level" :count="5" allow-half />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="所属系统" name="systemCode">
          <a-select
            v-model:value="formData.systemCode"
            placeholder="请选择所属系统"
          >
            <a-select-option value="PERMISSION_SYSTEM">
              权限管理系统
            </a-select-option>
            <a-select-option value="USER_CENTER">用户中心</a-select-option>
            <a-select-option value="ADMIN">管理后台</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="角色描述" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入角色描述"
            :rows="3"
          />
        </a-form-item>

        <!-- 操作提示 -->
        <a-alert v-if="isEdit" type="info" show-icon class="mt-4">
          <template #message>
            <div>
              <div class="font-medium mb-1">角色基本信息修改</div>
              <div class="text-sm">
                如需配置权限，请保存后使用"配置权限"功能；
                如需管理成员，请保存后使用"管理成员"功能。
              </div>
            </div>
          </template>
        </a-alert>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { message } from "ant-design-vue";
import type { FormInstance } from "ant-design-vue";
import type { Role } from "../../types";
import { roleApi } from "@api/role";

interface Props {
  open: boolean;
  role?: Role | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();
const isEdit = ref(false);

const formData = reactive({
  name: "",
  description: "",
  level: 1,
  systemCode: "PERMISSION_SYSTEM",
});

const rules = {
  name: [
    { required: true, message: "请输入角色名称" },
    { min: 2, max: 50, message: "角色名称长度为2-50个字符" },
  ],
  systemCode: [{ required: true, message: "请选择所属系统" }],
};

watch(
  () => props.open,
  (newVal) => {
    visible.value = newVal;
    if (newVal) {
      if (props.role) {
        isEdit.value = true;
        Object.assign(formData, {
          name: props.role.name,
          description: props.role.description || "",
          level: props.role.level || 1,
          systemCode: props.role.systemCode || "PERMISSION_SYSTEM",
        });
      } else {
        isEdit.value = false;
        Object.assign(formData, {
          name: "",
          description: "",
          level: 1,
          systemCode: "PERMISSION_SYSTEM",
        });
      }
    }
  }
);

watch(visible, (newVal) => {
  if (!newVal) {
    emit("update:open", false);
    formRef.value?.resetFields();
  }
});

const handleOk = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value && props.role) {
      // 编辑角色
      await roleApi.updateRole(props.role.id, formData);
      message.success("角色更新成功");
    } else {
      // 新增角色
      await roleApi.createRole(formData);
      message.success("角色创建成功");
    }

    visible.value = false;
    emit("success");
  } catch (error: any) {
    if (error?.errorFields) {
      return; // 表单验证错误
    }
    message.error(isEdit.value ? "角色更新失败" : "角色创建失败");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};
</script>

<style scoped>
.role-edit-content {
  max-width: 100%;
  overflow-x: hidden;
}

:deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

:deep(.ant-input),
:deep(.ant-select),
:deep(.ant-textarea) {
  width: 100%;
}
</style>
