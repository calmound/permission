<template>
  <div class="permission-management-container">
    <!-- 系统选择器 -->
    <div class="mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-700">管理系统:</label>
        <SystemSelector
          v-model="currentSystemCode"
          mode="manageable"
          :width="'200px'"
          placeholder="请选择系统"
          @change="handleSystemChange"
        />
      </div>
    </div>

    <!-- 搜索和操作区域 -->
    <a-card class="card-container mb-4" v-if="currentSystemCode">
      <div class="toolbar">
        <!-- 搜索表单 -->
        <div class="search-form">
          <a-input
            v-model:value="searchForm.keyword"
            placeholder="搜索权限名称或代码"
            style="width: 240px"
            size="small"
            @press-enter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>

          <a-select
            v-model:value="searchForm.type"
            placeholder="权限类型"
            style="width: 120px"
            size="small"
            allow-clear
          >
            <a-select-option value="MENU">菜单权限</a-select-option>
            <a-select-option value="BUTTON">按钮权限</a-select-option>
            <a-select-option value="API">API权限</a-select-option>
          </a-select>

          <a-select
            v-model:value="searchForm.groupName"
            placeholder="权限分组"
            style="width: 150px"
            size="small"
            allow-clear
          >
            <a-select-option
              v-for="group in permissionGroups"
              :key="group.groupName"
              :value="group.groupName"
            >
              {{ group.groupName }}
            </a-select-option>
          </a-select>

          <a-button type="primary" size="small" @click="handleSearch">
            <SearchOutlined />
            搜索
          </a-button>

          <a-button size="small" @click="handleReset">
            <ReloadOutlined />
            重置
          </a-button>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <a-button
            type="primary"
            size="small"
            @click="handleCreate"
            v-permission="'permission:create'"
          >
            <PlusOutlined />
            新增权限
          </a-button>

          <a-button size="small" @click="showGroupModal = true">
            <SettingOutlined />
            分组管理
          </a-button>

          <a-button size="small" @click="handleRefresh">
            <ReloadOutlined />
            刷新
          </a-button>
        </div>
      </div>
    </a-card>

    <!-- 权限分组统计 -->
    <a-card class="card-container mb-4 flex-shrink-0">
      <div class="group-stats">
        <div
          v-for="group in permissionGroups"
          :key="group.code"
          class="group-item"
          :class="{ active: selectedGroup === group.code }"
          @click="handleGroupFilter(group.code)"
        >
          <div class="group-icon">
            <component :is="group.icon" />
          </div>
          <div class="group-info">
            <div class="group-name">{{ group.name }}</div>
            <div class="group-count">{{ group.count }} 个权限</div>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 权限表格 -->
    <a-card class="card-container flex-1 flex flex-col">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        :scroll="{ x: 1000, y: 'calc(100vh - 380px)' }"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 权限名称列 -->
          <template v-if="column.key === 'name'">
            <div>
              <div class="font-medium text-sm">{{ record.name }}</div>
              <div class="text-xs text-gray-500 mt-1">
                <code class="bg-gray-100 px-1 rounded">{{ record.code }}</code>
              </div>
            </div>
          </template>

          <!-- 权限类型列 -->
          <template v-else-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)" size="small">
              <component :is="getTypeIcon(record.type)" class="mr-1" />
              {{ getTypeName(record.type) }}
            </a-tag>
          </template>

          <!-- 权限分组列 -->
          <template v-else-if="column.key === 'group'">
            <a-tag color="cyan" size="small">
              {{ getGroupName(record.group) }}
            </a-tag>
          </template>

          <!-- 所属系统列 -->
          <template v-else-if="column.key === 'systemCode'">
            <a-tag color="blue" size="small">
              {{ getSystemName(record.systemCode) }}
            </a-tag>
          </template>

          <!-- 状态列 -->
          <template v-else-if="column.key === 'status'">
            <a-tag
              :color="record.status === 'active' ? 'green' : 'red'"
              size="small"
            >
              {{ record.status === "active" ? "启用" : "停用" }}
            </a-tag>
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
                @click="handleEdit(record)"
                v-permission="'permission:update'"
              >
                编辑
              </a-button>

              <a-button type="link" size="small" @click="handleCopy(record)">
                复制权限
              </a-button>

              <a-button
                type="link"
                size="small"
                danger
                @click="handleDelete(record)"
                v-permission="'permission:delete'"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 权限编辑弹窗 -->
    <a-modal
      v-model:open="editModalVisible"
      :title="isEdit ? '编辑权限' : '新增权限'"
      :width="800"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirmLoading="saving"
    >
      <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="权限名称" name="name">
              <a-input
                v-model:value="formData.name"
                placeholder="请输入权限名称"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="权限代码" name="code">
              <a-input
                v-model:value="formData.code"
                placeholder="格式：模块:操作，如 user:create"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="权限类型" name="type">
              <a-select
                v-model:value="formData.type"
                placeholder="请选择权限类型"
              >
                <a-select-option value="API">API权限</a-select-option>
                <a-select-option value="BTN">按钮权限</a-select-option>
                <a-select-option value="MENU">菜单权限</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="所属系统" name="systemCode">
              <a-select
                v-model:value="formData.systemCode"
                placeholder="请选择所属系统"
              >
                <a-select-option value="PERMISSION_SYSTEM"
                  >权限管理系统</a-select-option
                >
                <a-select-option value="USER_CENTER">用户中心</a-select-option>
                <a-select-option value="ADMIN">管理后台</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="权限分组" name="group">
          <a-select
            v-model:value="formData.group"
            placeholder="请选择权限分组"
            allow-clear
          >
            <a-select-option
              v-for="group in permissionGroups"
              :key="group.code"
              :value="group.code"
            >
              {{ group.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="权限描述" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入权限描述"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 分组管理弹窗 -->
    <a-modal
      v-model:open="showGroupModal"
      title="权限分组管理"
      :width="600"
      @ok="handleGroupSave"
      @cancel="showGroupModal = false"
    >
      <div class="group-management">
        <div
          v-for="(group, index) in editingGroups"
          :key="index"
          class="group-edit-item"
        >
          <a-input
            v-model:value="group.name"
            placeholder="分组名称"
            style="width: 200px"
          />
          <a-input
            v-model:value="group.code"
            placeholder="分组代码"
            style="width: 150px"
          />
          <a-button type="text" danger @click="editingGroups.splice(index, 1)">
            <DeleteOutlined />
          </a-button>
        </div>

        <a-button
          type="dashed"
          block
          @click="
            editingGroups.push({
              name: '',
              code: '',
              icon: 'FolderOutlined',
              count: 0,
            })
          "
        >
          <PlusOutlined />
          添加分组
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { message, Modal } from "ant-design-vue";
import type { FormInstance } from "ant-design-vue";
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  DeleteOutlined,
  CopyOutlined,
  UserOutlined,
  SafetyOutlined,
  MenuOutlined,
  ApiOutlined,
  ControlOutlined,
  AppstoreOutlined,
} from "@ant-design/icons-vue";
import SystemSelector from "@/components/common/SystemSelector.vue";
import type { SystemPermission, SystemPermissionSearchParams } from "@/types";
import { systemPermissionApi } from "@/api/resource";

interface Permission {
  id: string;
  name: string;
  code: string;
  type: "API" | "BTN" | "MENU";
  group: string;
  systemCode: string;
  status: "active" | "inactive";
  description?: string;
  createdAt: string;
}

const loading = ref(false);
const saving = ref(false);
const currentSystemCode = ref<string>("");
const dataSource = ref<SystemPermission[]>([]);
const selectedRowKeys = ref<string[]>([]);
const editModalVisible = ref(false);
const showGroupModal = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const selectedGroup = ref("");
const totalCount = ref(0);

const searchForm = reactive({
  keyword: "",
  type: "",
  groupName: "",
});

const formData = reactive({
  name: "",
  code: "",
  type: "API",
  systemCode: "PERMISSION_SYSTEM",
  group: "",
  description: "",
});

const rules = {
  name: [{ required: true, message: "请输入权限名称" }],
  code: [
    { required: true, message: "请输入权限代码" },
    {
      pattern: /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/,
      message: "格式：模块:操作，如 user:create",
    },
  ],
  type: [{ required: true, message: "请选择权限类型" }],
  systemCode: [{ required: true, message: "请选择所属系统" }],
};

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  size: "small",
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const permissionGroups = ref([
  { code: "user", name: "用户管理", icon: "UserOutlined", count: 0 },
  { code: "role", name: "角色管理", icon: "SafetyOutlined", count: 0 },
  { code: "resource", name: "资源管理", icon: "MenuOutlined", count: 0 },
  { code: "system", name: "系统管理", icon: "SettingOutlined", count: 0 },
  { code: "audit", name: "审计管理", icon: "AppstoreOutlined", count: 0 },
]);

const editingGroups = ref([...permissionGroups.value]);

const columns = [
  {
    title: "权限名称",
    key: "name",
    width: 200,
  },
  {
    title: "类型",
    key: "type",
    width: 100,
  },
  {
    title: "分组",
    key: "group",
    width: 100,
  },
  {
    title: "系统",
    key: "systemCode",
    width: 120,
  },
  {
    title: "状态",
    key: "status",
    width: 80,
  },
  {
    title: "创建时间",
    key: "createdAt",
    width: 120,
  },
  {
    title: "操作",
    key: "actions",
    width: 180,
    fixed: "right",
  },
];

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  },
}));

onMounted(() => {
  loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 300));
    const mockData = generateMockData();
    dataSource.value = mockData;
    pagination.total = mockData.length;
    updateGroupCounts(mockData);
  } catch (error) {
    message.error("加载权限列表失败");
  } finally {
    loading.value = false;
  }
};

const generateMockData = (): Permission[] => {
  const permissions: Permission[] = [
    // 用户管理权限
    {
      id: "1",
      name: "查看用户",
      code: "user:list",
      type: "API",
      group: "user",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "查看用户列表权限",
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      name: "创建用户",
      code: "user:create",
      type: "API",
      group: "user",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "创建用户权限",
      createdAt: "2024-01-01",
    },
    {
      id: "3",
      name: "编辑用户",
      code: "user:update",
      type: "API",
      group: "user",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "编辑用户权限",
      createdAt: "2024-01-01",
    },
    {
      id: "4",
      name: "删除用户",
      code: "user:delete",
      type: "API",
      group: "user",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "删除用户权限",
      createdAt: "2024-01-01",
    },
    {
      id: "5",
      name: "导出用户",
      code: "user:export",
      type: "BTN",
      group: "user",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "导出用户数据权限",
      createdAt: "2024-01-01",
    },
    {
      id: "6",
      name: "重置密码",
      code: "user:reset_password",
      type: "BTN",
      group: "user",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "重置用户密码权限",
      createdAt: "2024-01-01",
    },

    // 角色管理权限
    {
      id: "7",
      name: "查看角色",
      code: "role:list",
      type: "API",
      group: "role",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "查看角色列表权限",
      createdAt: "2024-01-01",
    },
    {
      id: "8",
      name: "创建角色",
      code: "role:create",
      type: "API",
      group: "role",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "创建角色权限",
      createdAt: "2024-01-01",
    },
    {
      id: "9",
      name: "编辑角色",
      code: "role:update",
      type: "API",
      group: "role",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "编辑角色权限",
      createdAt: "2024-01-01",
    },
    {
      id: "10",
      name: "删除角色",
      code: "role:delete",
      type: "API",
      group: "role",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "删除角色权限",
      createdAt: "2024-01-01",
    },
    {
      id: "11",
      name: "分配权限",
      code: "role:grant",
      type: "BTN",
      group: "role",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "为角色分配权限",
      createdAt: "2024-01-01",
    },

    // 资源管理权限
    {
      id: "12",
      name: "查看资源",
      code: "resource:list",
      type: "API",
      group: "resource",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "查看资源列表权限",
      createdAt: "2024-01-01",
    },
    {
      id: "13",
      name: "创建资源",
      code: "resource:create",
      type: "API",
      group: "resource",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "创建资源权限",
      createdAt: "2024-01-01",
    },
    {
      id: "14",
      name: "编辑资源",
      code: "resource:update",
      type: "API",
      group: "resource",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "编辑资源权限",
      createdAt: "2024-01-01",
    },

    // 系统管理权限
    {
      id: "15",
      name: "系统配置",
      code: "system:config",
      type: "API",
      group: "system",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "系统配置权限",
      createdAt: "2024-01-01",
    },
    {
      id: "16",
      name: "查看日志",
      code: "audit:list",
      type: "API",
      group: "audit",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "查看操作日志权限",
      createdAt: "2024-01-01",
    },
    {
      id: "17",
      name: "导出日志",
      code: "audit:export",
      type: "BTN",
      group: "audit",
      systemCode: "PERMISSION_SYSTEM",
      status: "active" as const,
      description: "导出操作日志权限",
      createdAt: "2024-01-01",
    },
  ];
  return permissions;
};

const updateGroupCounts = (data: any[]) => {
  permissionGroups.value.forEach((group) => {
    group.count = data.filter((item) => item.group === group.code).length;
  });
};

const getTypeIcon = (type: string) => {
  const iconMap = {
    API: "ApiOutlined",
    BTN: "ControlOutlined",
    MENU: "MenuOutlined",
  };
  return iconMap[type as keyof typeof iconMap] || "ApiOutlined";
};

const getTypeColor = (type: string) => {
  const colorMap = {
    API: "blue",
    BTN: "green",
    MENU: "orange",
  };
  return colorMap[type as keyof typeof colorMap] || "blue";
};

const getTypeName = (type: string) => {
  const nameMap = {
    API: "API权限",
    BTN: "按钮权限",
    MENU: "菜单权限",
  };
  return nameMap[type as keyof typeof nameMap] || type;
};

const getSystemName = (systemCode: string) => {
  const systemMap = {
    PERMISSION_SYSTEM: "权限管理系统",
    USER_CENTER: "用户中心",
    ADMIN: "管理后台",
  };
  return systemMap[systemCode as keyof typeof systemMap] || systemCode;
};

const getGroupName = (groupCode: string) => {
  const group = permissionGroups.value.find((g) => g.code === groupCode);
  return group?.name || groupCode;
};

const formatDate = (dateStr: string) => {
  return dateStr; // 简化处理
};

const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: "",
    type: "",
    systemCode: "",
  });
  selectedGroup.value = "";
  handleSearch();
};

const handleRefresh = () => {
  loadData();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadData();
};

const handleGroupFilter = (groupCode: string) => {
  selectedGroup.value = selectedGroup.value === groupCode ? "" : groupCode;
  handleSearch();
};

const handleCreate = () => {
  isEdit.value = false;
  Object.assign(formData, {
    name: "",
    code: "",
    type: "API",
    systemCode: "PERMISSION_SYSTEM",
    group: "",
    description: "",
  });
  editModalVisible.value = true;
};

const handleEdit = (record: Permission) => {
  isEdit.value = true;
  Object.assign(formData, record);
  editModalVisible.value = true;
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    saving.value = true;

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));

    message.success(isEdit.value ? "权限更新成功" : "权限创建成功");
    editModalVisible.value = false;
    loadData();
  } catch (error) {
    console.error("操作失败:", error);
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  editModalVisible.value = false;
  formRef.value?.resetFields();
};

const handleCopy = (record: Permission) => {
  handleCreate();
  Object.assign(formData, {
    ...record,
    name: record.name + " (副本)",
    code: record.code + "_copy",
  });
};

const handleDelete = (record: Permission) => {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除权限"${record.name}"吗？删除后将无法恢复。`,
    onOk: async () => {
      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 300));
        message.success("删除成功");
        loadData();
      } catch (error) {
        message.error("删除失败");
      }
    },
  });
};

const handleGroupSave = () => {
  permissionGroups.value = [...editingGroups.value];
  showGroupModal.value = false;
  message.success("权限分组保存成功");
};
</script>

<style scoped>
.permission-management-container {
  min-height: 100%;
  height: calc(100vh - 64px);
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.card-container {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.search-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.group-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

.group-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
}

.group-item.active {
  border-color: #1890ff;
  background-color: #f0f7ff;
}

.group-icon {
  margin-right: 8px;
  font-size: 16px;
  color: #1890ff;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.group-count {
  font-size: 12px;
  color: #666;
}

.group-management {
  max-height: 400px;
  overflow-y: auto;
}

.group-edit-item {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
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

/* 确保表格卡片内的表格能够正确伸缩 */
.flex-1 :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.flex-1 :deep(.ant-table-wrapper) {
  flex: 1;
}
</style>
