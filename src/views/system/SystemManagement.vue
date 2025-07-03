<template>
  <div class="p-6 bg-white rounded-lg">
    <!-- 页面标题和操作栏 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">系统管理</h1>
        <p class="mt-1 text-gray-600">管理权限中心接入的业务系统</p>
      </div>
      <a-button type="primary" @click="handleAdd">
        <PlusOutlined />
        添加系统
      </a-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="flex gap-4 mb-6">
      <a-input-search
        v-model:value="searchParams.keyword"
        placeholder="搜索系统名称或编码"
        class="w-80"
        @search="handleSearch"
        allow-clear
      />
      <a-select
        v-model:value="searchParams.status"
        placeholder="系统状态"
        class="w-32"
        allow-clear
        @change="handleSearch"
      >
        <a-select-option value="active">启用</a-select-option>
        <a-select-option value="inactive">禁用</a-select-option>
      </a-select>
    </div>

    <!-- 系统列表 -->
    <a-table
      :columns="columns"
      :data-source="systems"
      :loading="loading"
      :pagination="false"
      row-key="code"
      class="border border-gray-200 rounded-lg"
    >
      <!-- 系统名称 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <div class="flex items-center gap-3">
            <div
              class="flex items-center justify-center w-10 h-10 font-semibold text-white rounded-lg"
              :style="{ backgroundColor: getSystemColor(record.code) }"
            >
              {{ record.name.charAt(0) }}
            </div>
            <div>
              <div class="font-medium text-gray-900">{{ record.name }}</div>
              <div class="text-sm text-gray-500">{{ record.code }}</div>
            </div>
          </div>
        </template>

        <!-- 系统状态 -->
        <template v-else-if="column.key === 'status'">
          <a-tag
            :color="record.status === 'active' ? 'green' : 'red'"
            class="px-3 py-1"
          >
            {{ record.status === "active" ? "启用" : "禁用" }}
          </a-tag>
        </template>

        <!-- 操作 -->
        <template v-else-if="column.key === 'actions'">
          <div class="flex gap-2">
            <a-button size="small" @click="handleEdit(record)">
              <EditOutlined />
              编辑
            </a-button>
            <a-button
              size="small"
              :type="record.status === 'active' ? 'default' : 'primary'"
              @click="handleToggleStatus(record)"
            >
              <PoweroffOutlined />
              {{ record.status === "active" ? "禁用" : "启用" }}
            </a-button>
            <a-popconfirm
              title="确定要删除这个系统吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a-button size="small" danger>
                <DeleteOutlined />
                删除
              </a-button>
            </a-popconfirm>
          </div>
        </template>
      </template>
    </a-table>

    <!-- 系统编辑Modal -->
    <SystemEditModal
      :visible="editModalVisible"
      :system="editingSystem"
      @close="handleModalClose"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PoweroffOutlined,
} from "@ant-design/icons-vue";
import type { System } from "@/types";
import { systemApi } from "@/api/system";
import SystemEditModal from "@/components/system/SystemEditModal.vue";

// 响应式数据
const loading = ref(false);
const systems = ref<System[]>([]);
const editModalVisible = ref(false);
const editingSystem = ref<System | null>(null);

// 搜索参数
const searchParams = reactive({
  keyword: "",
  status: undefined as "active" | "inactive" | undefined,
});

// 表格列配置
const columns = [
  {
    title: "系统信息",
    key: "name",
    width: 300,
  },
  {
    title: "描述",
    dataIndex: "description",
    key: "description",
  },
  {
    title: "状态",
    key: "status",
    width: 100,
    align: "center" as const,
  },
  {
    title: "操作",
    key: "actions",
    width: 200,
    align: "center" as const,
  },
];

// 方法
const loadSystems = async () => {
  try {
    loading.value = true;
    const response = await systemApi.getSystems(searchParams);
    systems.value = response.data;
  } catch (error) {
    message.error("加载系统列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  loadSystems();
};

const handleAdd = () => {
  editingSystem.value = null;
  editModalVisible.value = true;
};

const handleEdit = (system: System) => {
  editingSystem.value = system;
  editModalVisible.value = true;
};

const handleToggleStatus = async (system: System) => {
  try {
    const newStatus = system.status === "active" ? "inactive" : "active";
    await systemApi.updateSystemStatus(system.code, newStatus);
    message.success(`系统已${newStatus === "active" ? "启用" : "禁用"}`);
    loadSystems();
  } catch (error) {
    message.error("状态更新失败");
  }
};

const handleDelete = async (system: System) => {
  try {
    await systemApi.deleteSystem(system.code);
    message.success("系统删除成功");
    loadSystems();
  } catch (error) {
    message.error("系统删除失败");
  }
};

const handleModalClose = () => {
  editModalVisible.value = false;
  editingSystem.value = null;
};

const handleModalSuccess = () => {
  editModalVisible.value = false;
  editingSystem.value = null;
  loadSystems();
};

// 获取系统颜色
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

// 生命周期
onMounted(() => {
  loadSystems();
});
</script>

<style scoped>
.ant-table :deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
}

.ant-table :deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f7fa;
}
</style>
