<template>
  <div class="system-selector">
    <a-select
      v-model:value="selectedSystem"
      :placeholder="placeholder"
      :loading="loading"
      :disabled="disabled"
      :style="{ width: width }"
      :size="size"
      show-search
      :filter-option="filterOption"
      @change="handleChange"
    >
      <a-select-option
        v-for="system in availableSystems"
        :key="system.code"
        :value="system.code"
        :disabled="system.status === 'inactive'"
      >
        <div class="flex items-center justify-between">
          <span>{{ system.name }}</span>
          <a-tag v-if="system.status === 'inactive'" color="red" size="small">
            已停用
          </a-tag>
        </div>
      </a-select-option>
    </a-select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { message } from "ant-design-vue";
import { systemApi } from "@/api/system";
import type { System } from "@/types";

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  width?: string;
  size?: "small" | "middle" | "large";
  mode?: "manageable" | "accessible" | "all"; // 可管理的系统 | 可访问的系统 | 所有系统
  allowEmpty?: boolean; // 是否允许不选择系统
  emptyLabel?: string; // 空选项的标签
}

interface Emits {
  (e: "update:modelValue", value: string | undefined): void;
  (e: "change", value: string | undefined, system?: System): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "请选择系统",
  disabled: false,
  width: "200px",
  size: "middle",
  mode: "manageable",
  allowEmpty: false,
  emptyLabel: "全部系统",
});

const emit = defineEmits<Emits>();

const loading = ref(false);
const systems = ref<System[]>([]);
const selectedSystem = ref<string | undefined>(props.modelValue);

// 可用的系统列表
const availableSystems = computed(() => {
  const systemList = [...systems.value];

  // 如果允许空选择，添加空选项
  if (props.allowEmpty) {
    systemList.unshift({
      code: "",
      name: props.emptyLabel,
      status: "active",
    } as System);
  }

  return systemList;
});

// 加载系统列表
const loadSystems = async () => {
  loading.value = true;
  try {
    let systemList: System[] = [];

    switch (props.mode) {
      case "manageable":
        systemList = await systemApi.getUserManageableSystems();
        break;
      case "accessible":
        systemList = await systemApi.getUserAccessibleSystems();
        break;
      case "all":
        systemList = await systemApi.getSystems();
        break;
    }

    systems.value = systemList;

    // 如果当前选中的系统不在可用列表中，清空选择
    if (
      selectedSystem.value &&
      !systemList.find((s) => s.code === selectedSystem.value)
    ) {
      selectedSystem.value = undefined;
      handleChange(undefined);
    }

    // 如果没有选中系统且有可用系统，自动选择第一个
    if (!selectedSystem.value && systemList.length > 0 && !props.allowEmpty) {
      const firstActiveSystem = systemList.find((s) => s.status === "active");
      if (firstActiveSystem) {
        selectedSystem.value = firstActiveSystem.code;
        handleChange(firstActiveSystem.code);
      }
    }
  } catch (error) {
    message.error("加载系统列表失败");
    console.error("Load systems error:", error);
  } finally {
    loading.value = false;
  }
};

// 处理选择变化
const handleChange = (value: string | undefined) => {
  selectedSystem.value = value;
  emit("update:modelValue", value);

  const selectedSystemInfo = systems.value.find((s) => s.code === value);
  emit("change", value, selectedSystemInfo);
};

// 搜索过滤
const filterOption = (input: string, option: any) => {
  const system = systems.value.find((s) => s.code === option.value);
  if (!system) return false;

  return (
    system.name.toLowerCase().includes(input.toLowerCase()) ||
    system.code.toLowerCase().includes(input.toLowerCase())
  );
};

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    selectedSystem.value = newValue;
  }
);

// 监听模式变化，重新加载系统列表
watch(
  () => props.mode,
  () => {
    loadSystems();
  }
);

onMounted(() => {
  loadSystems();
});

// 暴露方法给父组件
defineExpose({
  refresh: loadSystems,
  getSystems: () => systems.value,
  getSelectedSystem: () =>
    systems.value.find((s) => s.code === selectedSystem.value),
});
</script>

<style scoped>
.system-selector {
  display: inline-block;
}

:deep(.ant-select-selection-item) {
  font-weight: 500;
}

:deep(.ant-select-disabled .ant-select-selection-item) {
  color: rgba(0, 0, 0, 0.25);
}
</style>
