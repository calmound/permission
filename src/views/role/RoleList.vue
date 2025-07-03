<template>
  <div class="role-list-container">
    <!-- 搜索和操作区域 -->
    <a-card class="card-container mb-4 flex-shrink-0">
      <div class="table-toolbar">
        <!-- 搜索表单 -->
        <div class="table-search">
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">筛选系统:</label>
            <SystemSelector
              v-model="currentSystemCode"
              mode="manageable"
              :width="'180px'"
              placeholder="选择要管理的系统"
              @change="handleSystemChange"
            />
          </div>

          <a-input
            v-model:value="searchForm.keyword"
            placeholder="搜索角色名称"
            style="width: 240px"
            size="small"
            @press-enter="handleSearch"
            :disabled="!currentSystemCode"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>

          <a-button
            type="primary"
            size="small"
            @click="handleSearch"
            :disabled="!currentSystemCode"
          >
            <SearchOutlined />
            搜索
          </a-button>

          <a-button
            size="small"
            @click="handleReset"
            :disabled="!currentSystemCode"
          >
            <ReloadOutlined />
            重置
          </a-button>
        </div>

        <!-- 操作按钮 -->
        <div class="flex space-x-2">
          <a-button
            type="primary"
            size="small"
            @click="handleCreate"
            v-permission="'role:create'"
          >
            <PlusOutlined />
            新增角色
          </a-button>

          <a-button size="small" @click="handleRefresh">
            <ReloadOutlined />
            刷新
          </a-button>
        </div>
      </div>

      <!-- 说明文字 -->
      <div
        v-if="!currentSystemCode"
        class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div class="text-sm text-blue-800">
          💡 请先选择要管理的系统，然后查看该系统下的角色列表
        </div>
      </div>
    </a-card>

    <!-- 角色表格 -->
    <a-card
      class="card-container flex-1 flex flex-col"
      v-if="currentSystemCode"
    >
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        :scroll="{ x: 1000, y: 'calc(100vh - 280px)' }"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 角色名称列 -->
          <template v-if="column.key === 'name'">
            <div>
              <div class="font-medium text-sm">{{ record.name }}</div>
              <div v-if="record.description" class="text-xs text-gray-500 mt-1">
                {{ record.description }}
              </div>
            </div>
          </template>

          <!-- 成员数量列 -->
          <template v-else-if="column.key === 'members'">
            <a-badge
              :count="record.members || 0"
              :number-style="{ backgroundColor: '#52c41a' }"
            >
              <span class="text-sm">{{ record.members || 0 }} 人</span>
            </a-badge>
          </template>

          <!-- 系统归属列 -->
          <template v-else-if="column.key === 'systemCode'">
            <a-tag color="blue" size="small">{{
              getSystemName(record.systemCode)
            }}</a-tag>
          </template>

          <!-- 创建时间列 -->
          <template v-else-if="column.key === 'createdAt'">
            <span class="text-xs">{{ formatDate(record.createdAt) }}</span>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'actions'">
            <a-space size="small" wrap>
              <a-button
                type="link"
                size="small"
                @click="handleView(record)"
                v-permission="'role:list'"
              >
                查看
              </a-button>

              <a-button
                type="link"
                size="small"
                @click="handleEdit(record)"
                v-permission="'role:update'"
              >
                编辑
              </a-button>

              <a-button
                type="link"
                size="small"
                danger
                @click="handleDelete(record)"
              >
                删除角色
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 角色详情抽屉 -->
    <RoleDetailDrawer
      v-model:open="detailDrawerVisible"
      :role-id="selectedRoleId"
      :system-code="currentSystemCode"
    />

    <!-- 角色编辑弹窗 -->
    <RoleEditModal
      v-model:open="editModalVisible"
      :role="selectedRole"
      @success="handleEditSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message, Modal } from "ant-design-vue";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";
import SystemSelector from "@/components/common/SystemSelector.vue";
import type { Role, SystemRole } from "@/types";
import { roleApi } from "@/api/role";
import { formatDate } from "@/utils/dayjs";
import RoleDetailDrawer from "@/components/role/RoleDetailDrawer.vue";
import RoleEditModal from "@/components/role/RoleEditModal.vue";

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const currentSystemCode = ref<string>("");
const dataSource = ref<SystemRole[]>([]);
const selectedRowKeys = ref<string[]>([]);
const selectedRole = ref<SystemRole | null>(null);
const selectedRoleId = ref<string>("");

// 弹窗控制
const detailDrawerVisible = ref(false);
const editModalVisible = ref(false);

const searchForm = reactive({
  keyword: "",
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  size: "small",
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const columns = [
  {
    title: "角色名称",
    dataIndex: "name",
    key: "name",
    width: 200,
  },
  {
    title: "成员数",
    dataIndex: "members",
    key: "members",
    width: 100,
  },
  {
    title: "系统",
    dataIndex: "systemCode",
    key: "systemCode",
    width: 120,
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 120,
  },
  {
    title: "操作",
    key: "actions",
    width: 160,
    fixed: "right",
  },
];

// 行选择配置
const rowSelection = {
  selectedRowKeys: selectedRowKeys,
  onChange: (selectedKeys: string[]) => {
    selectedRowKeys.value = selectedKeys;
  },
  getCheckboxProps: (record: Role) => ({
    disabled: false,
    name: record.name,
  }),
};

// 检查路由参数
const checkRouteParams = () => {
  const action = route.query.action as string;

  if (action === "create") {
    // 清除URL参数，避免刷新时重复触发
    router.replace({ query: {} });
    // 延迟触发，确保页面已渲染
    setTimeout(() => {
      handleCreate();
    }, 100);
  }
};

onMounted(() => {
  // 不在mounted时自动加载，等待系统选择
  checkRouteParams();
});

// 处理系统选择变化
const handleSystemChange = (systemCode: string | undefined) => {
  currentSystemCode.value = systemCode || "";
  selectedRole.value = null;
  selectedRoleId.value = "";

  if (systemCode) {
    loadData();
  } else {
    dataSource.value = [];
  }
};

// 监听路由变化
watch(
  () => route.query.action,
  (action) => {
    if (action === "create") {
      router.replace({ query: {} });
      handleCreate();
    }
  }
);

const loadData = async () => {
  if (!currentSystemCode.value) return;

  loading.value = true;
  try {
    const params = {
      ...searchForm,
      cursor: pagination.current > 1 ? `page_${pagination.current}` : undefined,
      limit: pagination.pageSize,
    };
    const response = await roleApi.getSystemRoles(
      currentSystemCode.value,
      params
    );
    dataSource.value = response.items || [];
    pagination.total = response.total || 0;
  } catch (error) {
    message.error("加载角色列表失败");
  } finally {
    loading.value = false;
  }
};

const getSystemName = (systemCode: string) => {
  const systemMap = {
    PERMISSION_SYSTEM: "权限管理系统",
    USER_CENTER: "用户中心",
    ADMIN: "管理后台",
  };
  return systemMap[systemCode as keyof typeof systemMap] || systemCode;
};

const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: "",
    systemCode: "",
  });
  pagination.current = 1;
  loadData();
};

const handleRefresh = () => {
  loadData();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  loadData();
};

const handleCreate = () => {
  selectedRole.value = null;
  editModalVisible.value = true;
};

const handleView = (record: SystemRole) => {
  selectedRoleId.value = record.id;
  detailDrawerVisible.value = true;
};

const handleEdit = (record: SystemRole) => {
  selectedRole.value = record;
  editModalVisible.value = true;
};

const handleDelete = (record: SystemRole) => {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除角色"${record.name}"吗？删除后将无法恢复。`,
    okText: "确定",
    cancelText: "取消",
    onOk: async () => {
      try {
        await roleApi.deleteRole(record.id);
        message.success("删除成功");
        loadData();
      } catch (error) {
        message.error("删除失败");
      }
    },
  });
};

// 处理成功回调
const handleEditSuccess = () => {
  editModalVisible.value = false;
  loadData();
};
</script>

<style scoped>
.role-list-container {
  min-height: 100%;
  padding: 16px;
}

.card-container {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  padding: 12px 0;
}

.table-search {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.ant-card-body) {
  padding: 12px 16px;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 8px 12px;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  padding: 8px 12px;
}

:deep(.ant-table-small .ant-table-thead > tr > th) {
  background: #fafafa;
}
</style>
