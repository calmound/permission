<template>
  <div class="permission-tree-select">
    <a-tree
      v-model:checkedKeys="checkedKeys"
      :tree-data="treeData"
      :checkable="true"
      :check-strictly="false"
      :selectable="false"
      :default-expanded-keys="expandedKeys"
      @check="handleCheck"
    >
      <template #title="{ title, type, code }">
        <div class="flex items-center space-x-2">
          <component :is="getIcon(type)" />
          <span>{{ title }}</span>
          <a-tag v-if="code" size="small" color="blue">{{ code }}</a-tag>
        </div>
      </template>
    </a-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  FolderOutlined,
  FileOutlined,
  ControlOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons-vue";

interface TreeNode {
  key: string;
  title: string;
  type: "M" | "V" | "A" | "P"; // Menu/View/Action/Permission
  code?: string;
  children?: TreeNode[];
}

interface Props {
  treeData: TreeNode[];
  value?: string[];
  disabled?: boolean;
}

interface Emits {
  (e: "update:value", value: string[]): void;
  (e: "change", value: string[], checkedNodes: TreeNode[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const checkedKeys = ref<string[]>(props.value || []);
const expandedKeys = ref<string[]>([]);

// 获取图标
const getIcon = (type: string) => {
  switch (type) {
    case "M":
      return FolderOutlined;
    case "V":
      return FileOutlined;
    case "A":
      return ControlOutlined;
    case "P":
      return SafetyCertificateOutlined;
    default:
      return FileOutlined;
  }
};

// 处理选择变化
const handleCheck = (keys: string[], info: any) => {
  checkedKeys.value = keys;
  emit("update:value", keys);
  emit("change", keys, info.checkedNodes);
};

// 初始化展开的键
const initExpandedKeys = () => {
  const keys: string[] = [];
  const traverse = (nodes: TreeNode[]) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        keys.push(node.key);
        traverse(node.children);
      }
    });
  };
  traverse(props.treeData);
  expandedKeys.value = keys;
};

// 监听外部值变化
watch(
  () => props.value,
  (newValue) => {
    if (newValue) {
      checkedKeys.value = newValue;
    }
  }
);

// 监听树数据变化
watch(
  () => props.treeData,
  () => {
    initExpandedKeys();
  },
  { immediate: true }
);
</script>

<style scoped>
.permission-tree-select {
  max-height: 400px;
  overflow-y: auto;
}

:deep(.ant-tree-title) {
  flex: 1;
}
</style>
