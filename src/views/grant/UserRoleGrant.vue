<template>
  <div class="user-role-grant-container">
    <!-- 页面标题 -->
    <div class="page-header mb-6">
      <h1 class="text-2xl font-semibold text-gray-800">用户角色授权</h1>
      <p class="text-gray-500 mt-1">
        管理用户与角色的授权关系，支持批量分配和权限继承
      </p>
    </div>

    <!-- 筛选和操作区域 -->
    <a-card class="card-container mb-6">
      <div class="toolbar">
        <div class="filter-section">
          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索用户或角色"
            style="width: 200px"
            @press-enter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>

          <a-select
            v-model:value="selectedSystem"
            placeholder="选择系统"
            style="width: 200px"
            @change="handleSystemChange"
          >
            <a-select-option value="">全部系统</a-select-option>
            <a-select-option value="PERMISSION_SYSTEM"
              >权限管理系统</a-select-option
            >
            <a-select-option value="USER_CENTER">用户中心</a-select-option>
            <a-select-option value="ADMIN">管理后台</a-select-option>
          </a-select>

          <a-button type="primary" @click="handleSearch">
            <SearchOutlined />
            搜索
          </a-button>

          <a-button @click="handleReset">
            <ReloadOutlined />
            重置
          </a-button>
        </div>

        <div class="action-section">
          <a-button type="primary" @click="showBatchGrantModal = true">
            <UserAddOutlined />
            批量授权
          </a-button>

          <a-button @click="handleRefresh">
            <ReloadOutlined />
            刷新
          </a-button>

          <a-button @click="handleExport">
            <ExportOutlined />
            导出授权
          </a-button>
        </div>
      </div>
    </a-card>

    <!-- 授权表格 -->
    <a-card class="card-container">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        row-key="id"
        @change="handleTableChange"
      >
        <!-- 用户信息列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <div class="flex items-center">
              <a-avatar :src="record.user.avatar" size="small" class="mr-2">
                {{
                  record.user.nickname?.charAt(0) ||
                  record.user.username.charAt(0)
                }}
              </a-avatar>
              <div>
                <div class="font-medium">
                  {{ record.user.nickname || record.user.username }}
                </div>
                <div class="text-xs text-gray-500">{{ record.user.email }}</div>
              </div>
            </div>
          </template>

          <!-- 当前角色列 -->
          <template v-else-if="column.key === 'roles'">
            <div class="space-y-1">
              <a-tag
                v-for="role in record.roles"
                :key="role.id"
                :color="getRoleColor(role.level)"
                size="small"
              >
                {{ role.name }}
              </a-tag>
            </div>
          </template>

          <!-- 权限数量列 -->
          <template v-else-if="column.key === 'permissions'">
            <a-badge
              :count="record.permissionCount"
              :number-style="{ backgroundColor: '#1890ff' }"
            />
          </template>

          <!-- 状态列 -->
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.user.status === 'active' ? 'green' : 'red'">
              {{ record.user.status === "active" ? "正常" : "停用" }}
            </a-tag>
          </template>

          <!-- 最后登录列 -->
          <template v-else-if="column.key === 'lastLogin'">
            <span class="text-sm">
              {{
                record.user.lastLoginAt
                  ? formatDate(record.user.lastLoginAt)
                  : "从未登录"
              }}
            </span>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button
                type="link"
                size="small"
                @click="handleGrantRoles(record)"
                v-permission="'user:update'"
              >
                分配角色
              </a-button>

              <a-button
                type="link"
                size="small"
                @click="handleViewPermissions(record)"
                v-permission="'user:list'"
              >
                查看权限
              </a-button>

              <a-popconfirm
                title="确定清空此用户的所有角色吗？"
                @confirm="handleClearRoles(record)"
                v-permission="'user:update'"
              >
                <a-button type="link" size="small" class="text-red-500">
                  清空角色
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 角色分配弹窗 -->
    <a-modal
      v-model:open="grantModalVisible"
      title="分配角色"
      :width="600"
      @ok="handleSaveRoles"
      @cancel="grantModalVisible = false"
      :confirmLoading="saving"
    >
      <div class="grant-modal-content">
        <div class="user-info mb-4">
          <a-descriptions :column="2" size="small">
            <a-descriptions-item label="用户">
              {{ currentUser?.nickname || currentUser?.username }}
            </a-descriptions-item>
            <a-descriptions-item label="邮箱">
              {{ currentUser?.email }}
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <a-divider>角色选择</a-divider>

        <div class="role-selection">
          <a-transfer
            v-model:target-keys="selectedRoleIds"
            :data-source="availableRoles"
            :titles="['可选角色', '已分配角色']"
            :render="(item) => item.name"
            :show-search="true"
            :filter-option="
              (inputValue, option) => option.name.includes(inputValue)
            "
          >
            <template #children="{ direction, selectedKeys, onItemSelect }">
              <a-list
                size="small"
                :data-source="direction === 'left' ? leftRoles : rightRoles"
              >
                <template #renderItem="{ item }">
                  <a-list-item
                    @click="
                      onItemSelect(item.key, !selectedKeys.includes(item.key))
                    "
                    :class="{ selected: selectedKeys.includes(item.key) }"
                    class="cursor-pointer"
                  >
                    <div class="role-item">
                      <div class="role-name">{{ item.name }}</div>
                      <div class="role-desc">{{ item.description }}</div>
                      <a-tag size="small" :color="getRoleColor(item.level)">
                        等级 {{ item.level }}
                      </a-tag>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </template>
          </a-transfer>
        </div>
      </div>
    </a-modal>

    <!-- 批量授权弹窗 -->
    <a-modal
      v-model:open="showBatchGrantModal"
      title="批量授权"
      :width="700"
      @ok="handleBatchGrant"
      @cancel="showBatchGrantModal = false"
    >
      <div class="batch-grant-content">
        <a-steps :current="batchStep" size="small" class="mb-6">
          <a-step title="选择用户" />
          <a-step title="选择角色" />
          <a-step title="确认授权" />
        </a-steps>

        <!-- 步骤1：选择用户 -->
        <div v-if="batchStep === 0" class="step-content">
          <h4>选择要授权的用户</h4>
          <a-transfer
            v-model:target-keys="batchUsers"
            :data-source="allUsers"
            :titles="['全部用户', '已选用户']"
            :render="
              (item) => `${item.nickname || item.username} (${item.email})`
            "
            :show-search="true"
          />
        </div>

        <!-- 步骤2：选择角色 -->
        <div v-if="batchStep === 1" class="step-content">
          <h4>选择要分配的角色</h4>
          <a-checkbox-group v-model:value="batchRoles" class="w-full">
            <a-row :gutter="[16, 16]">
              <a-col :span="12" v-for="role in allRoles" :key="role.id">
                <a-checkbox :value="role.id">
                  <div class="role-checkbox-item">
                    <div class="font-medium">{{ role.name }}</div>
                    <div class="text-xs text-gray-500">
                      {{ role.description }}
                    </div>
                  </div>
                </a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </div>

        <!-- 步骤3：确认授权 -->
        <div v-if="batchStep === 2" class="step-content">
          <h4>确认授权信息</h4>
          <a-descriptions bordered size="small">
            <a-descriptions-item label="用户数量">
              {{ batchUsers.length }} 个
            </a-descriptions-item>
            <a-descriptions-item label="角色数量">
              {{ batchRoles.length }} 个
            </a-descriptions-item>
            <a-descriptions-item label="授权关系">
              {{ batchUsers.length * batchRoles.length }} 条
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <div class="step-actions mt-4">
          <a-button v-if="batchStep > 0" @click="batchStep--">上一步</a-button>
          <a-button
            v-if="batchStep < 2"
            type="primary"
            @click="batchStep++"
            :disabled="
              (batchStep === 0 && batchUsers.length === 0) ||
              (batchStep === 1 && batchRoles.length === 0)
            "
          >
            下一步
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 用户权限查看弹窗 -->
    <a-modal
      v-model:open="permissionModalVisible"
      title="用户权限详情"
      :width="800"
      :footer="null"
    >
      <div class="permission-detail">
        <a-tabs>
          <a-tab-pane key="direct" tab="直接权限">
            <a-table
              :columns="permissionColumns"
              :data-source="userDirectPermissions"
              :pagination="false"
              size="small"
            />
          </a-tab-pane>
          <a-tab-pane key="inherited" tab="继承权限">
            <a-table
              :columns="permissionColumns"
              :data-source="userInheritedPermissions"
              :pagination="false"
              size="small"
            />
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import {
  SearchOutlined,
  ReloadOutlined,
  UserAddOutlined,
  ExportOutlined,
} from "@ant-design/icons-vue";
import type { User, Role } from "@/types";
import { formatDate } from "@utils/dayjs";

interface UserRoleItem {
  id: string;
  user: User;
  roles: Role[];
  permissionCount: number;
}

const loading = ref(false);
const saving = ref(false);
const searchKeyword = ref("");
const selectedSystem = ref("");
const selectedRowKeys = ref<string[]>([]);
const grantModalVisible = ref(false);
const showBatchGrantModal = ref(false);
const permissionModalVisible = ref(false);
const batchStep = ref(0);

// 数据
const dataSource = ref<UserRoleItem[]>([]);
const currentUser = ref<User>();
const selectedRoleIds = ref<string[]>([]);
const allUsers = ref<any[]>([]);
const allRoles = ref<Role[]>([]);
const batchUsers = ref<string[]>([]);
const batchRoles = ref<string[]>([]);
const userDirectPermissions = ref<any[]>([]);
const userInheritedPermissions = ref<any[]>([]);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const columns = [
  {
    title: "用户信息",
    key: "user",
    width: 200,
  },
  {
    title: "当前角色",
    key: "roles",
    width: 250,
  },
  {
    title: "权限数量",
    key: "permissions",
    width: 100,
    align: "center",
  },
  {
    title: "状态",
    key: "status",
    width: 80,
  },
  {
    title: "最后登录",
    key: "lastLogin",
    width: 150,
  },
  {
    title: "操作",
    key: "actions",
    width: 200,
    fixed: "right",
  },
];

const permissionColumns = [
  { title: "权限名称", dataIndex: "name", key: "name" },
  { title: "权限代码", dataIndex: "code", key: "code" },
  { title: "权限类型", dataIndex: "type", key: "type" },
  { title: "来源角色", dataIndex: "source", key: "source" },
];

const rowSelection = {
  selectedRowKeys: selectedRowKeys,
  onChange: (selectedKeys: string[]) => {
    selectedRowKeys.value = selectedKeys;
  },
};

const availableRoles = computed(() => {
  return allRoles.value.map((role) => ({
    key: role.id,
    name: role.name,
    description: role.description,
    level: role.level,
  }));
});

const leftRoles = computed(() => {
  return availableRoles.value.filter(
    (role) => !selectedRoleIds.value.includes(role.key)
  );
});

const rightRoles = computed(() => {
  return availableRoles.value.filter((role) =>
    selectedRoleIds.value.includes(role.key)
  );
});

onMounted(() => {
  loadData();
  loadRoles();
});

const loadData = async () => {
  loading.value = true;
  try {
    // Mock 数据
    const mockData = generateMockUserRoles();
    dataSource.value = mockData;
    pagination.total = mockData.length;

    // 转换为批量授权用的用户列表
    allUsers.value = mockData.map((item) => ({
      key: item.user.id,
      ...item.user,
    }));
  } catch (error) {
    message.error("加载用户角色数据失败");
  } finally {
    loading.value = false;
  }
};

const loadRoles = async () => {
  try {
    // Mock 角色数据
    allRoles.value = [
      {
        id: "1",
        name: "系统管理员",
        level: 1,
        description: "拥有系统最高权限",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "2",
        name: "用户管理员",
        level: 2,
        description: "负责用户管理相关功能",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "3",
        name: "角色管理员",
        level: 2,
        description: "负责角色权限管理",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "4",
        name: "审计员",
        level: 3,
        description: "查看系统操作日志",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "5",
        name: "普通用户",
        level: 4,
        description: "基础用户权限",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ];
  } catch (error) {
    message.error("加载角色数据失败");
  }
};

const generateMockUserRoles = (): UserRoleItem[] => {
  const users: User[] = [
    {
      id: "1",
      username: "admin",
      nickname: "系统管理员",
      email: "admin@example.com",
      status: "active",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      lastLoginAt: "2024-01-15",
    },
    {
      id: "2",
      username: "user1",
      nickname: "张三",
      email: "zhangsan@example.com",
      status: "active",
      createdAt: "2024-01-02",
      updatedAt: "2024-01-02",
      lastLoginAt: "2024-01-14",
    },
    {
      id: "3",
      username: "user2",
      nickname: "李四",
      email: "lisi@example.com",
      status: "active",
      createdAt: "2024-01-03",
      updatedAt: "2024-01-03",
      lastLoginAt: "2024-01-13",
    },
    {
      id: "4",
      username: "user3",
      nickname: "王五",
      email: "wangwu@example.com",
      status: "inactive",
      createdAt: "2024-01-04",
      updatedAt: "2024-01-04",
    },
    {
      id: "5",
      username: "user4",
      nickname: "赵六",
      email: "zhaoliu@example.com",
      status: "active",
      createdAt: "2024-01-05",
      updatedAt: "2024-01-05",
      lastLoginAt: "2024-01-12",
    },
  ];

  const roles: Role[] = [
    {
      id: "1",
      name: "系统管理员",
      level: 1,
      description: "拥有系统最高权限",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "2",
      name: "用户管理员",
      level: 2,
      description: "负责用户管理相关功能",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "3",
      name: "普通用户",
      level: 4,
      description: "基础用户权限",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  ];

  return users.map((user, index) => ({
    id: user.id,
    user,
    roles: index === 0 ? [roles[0]] : index < 3 ? [roles[1]] : [roles[2]],
    permissionCount: index === 0 ? 16 : index < 3 ? 8 : 3,
  }));
};

const getRoleColor = (level?: number) => {
  const colors = {
    1: "red",
    2: "orange",
    3: "blue",
    4: "green",
  };
  return colors[level as keyof typeof colors] || "default";
};

const handleGrantRoles = (record: UserRoleItem) => {
  currentUser.value = record.user;
  selectedRoleIds.value = record.roles.map((role) => role.id);
  grantModalVisible.value = true;
};

const handleSaveRoles = async () => {
  try {
    saving.value = true;
    // 模拟保存
    message.success("角色分配成功");
    grantModalVisible.value = false;
    loadData();
  } catch (error) {
    message.error("角色分配失败");
  } finally {
    saving.value = false;
  }
};

const handleViewPermissions = (record: UserRoleItem) => {
  currentUser.value = record.user;

  // Mock 权限数据
  userDirectPermissions.value = [
    { name: "查看用户", code: "user:list", type: "API", source: "用户管理员" },
    {
      name: "创建用户",
      code: "user:create",
      type: "API",
      source: "用户管理员",
    },
  ];

  userInheritedPermissions.value = [
    { name: "查看角色", code: "role:list", type: "API", source: "基础权限" },
    {
      name: "查看资源",
      code: "resource:list",
      type: "API",
      source: "基础权限",
    },
  ];

  permissionModalVisible.value = true;
};

const handleClearRoles = async (record: UserRoleItem) => {
  try {
    message.success(
      `已清空用户 ${record.user.nickname || record.user.username} 的所有角色`
    );
    loadData();
  } catch (error) {
    message.error("清空角色失败");
  }
};

const handleBatchGrant = async () => {
  try {
    message.success(
      `成功为 ${batchUsers.value.length} 个用户分配了 ${batchRoles.value.length} 个角色`
    );
    showBatchGrantModal.value = false;
    batchStep.value = 0;
    batchUsers.value = [];
    batchRoles.value = [];
    loadData();
  } catch (error) {
    message.error("批量授权失败");
  }
};

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  searchKeyword.value = "";
  selectedSystem.value = "";
  loadData();
};

const handleSystemChange = () => {
  loadData();
};

const handleRefresh = () => {
  loadData();
};

const handleExport = () => {
  message.success("用户角色数据导出成功");
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  loadData();
};
</script>

<style scoped>
.user-role-grant-container {
  min-height: 100%;
  background: #f5f5f5;
  padding: 24px;
}

.page-header {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-container {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-section,
.action-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.grant-modal-content {
  max-height: 500px;
}

.role-selection {
  height: 300px;
}

.role-item {
  width: 100%;
}

.role-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.role-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.batch-grant-content {
  min-height: 400px;
}

.step-content h4 {
  margin-bottom: 16px;
  font-weight: 600;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.role-checkbox-item {
  margin-left: 8px;
}

.permission-detail {
  max-height: 400px;
  overflow-y: auto;
}

:deep(.ant-transfer) {
  .ant-transfer-list {
    height: 300px;
  }
}

:deep(.ant-list-item.selected) {
  background: #e6f7ff;
}

:deep(.ant-table) {
  background: transparent;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}
</style>
