<template>
  <div class="user-list-container">
    <!-- 搜索和操作区域 -->
    <a-card class="flex-shrink-0 mb-4 card-container">
      <div class="table-toolbar">
        <!-- 搜索表单 -->
        <div class="table-search">
          <a-input
            v-model:value="searchParams.keyword"
            placeholder="搜索用户名、昵称、邮箱"
            style="width: 240px"
            size="small"
            @press-enter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>

          <a-select
            v-model:value="searchParams.status"
            placeholder="用户状态"
            style="width: 120px"
            size="small"
            allow-clear
          >
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">停用</a-select-option>
          </a-select>

          <a-select
            v-model:value="searchParams.systemCode"
            placeholder="所属系统"
            style="width: 180px"
            size="small"
            allow-clear
          >
            <a-select-option value="">全部系统</a-select-option>
            <a-select-option value="PERMISSION_SYSTEM"
              >权限管理系统</a-select-option
            >
            <a-select-option value="USER_CENTER">用户中心</a-select-option>
            <a-select-option value="ADMIN">管理后台</a-select-option>
          </a-select>

          <a-button type="primary" size="small" @click="handleSearch">
            <SearchOutlined />
            搜索
          </a-button>

          <a-button size="small" @click="handleReset">重置</a-button>
        </div>

        <!-- 操作按钮 -->
        <div class="flex space-x-2">
          <a-button
            type="primary"
            size="small"
            @click="handleCreate"
            v-permission="'user:create'"
          >
            <PlusOutlined />
            新增用户
          </a-button>

          <a-button
            :disabled="selectedRowKeys.length === 0"
            danger
            size="small"
            @click="handleBatchDelete"
            v-permission="'user:delete'"
          >
            <DeleteOutlined />
            批量删除
          </a-button>

          <a-button
            size="small"
            @click="handleExport"
            v-permission="'user:export'"
          >
            <ExportOutlined />
            导出
          </a-button>

          <a-button size="small" @click="handleRefresh">
            <ReloadOutlined />
            刷新
          </a-button>
        </div>
      </div>
    </a-card>

    <!-- 用户表格 -->
    <a-card class="flex flex-col flex-1 card-container">
      <a-table
        :columns="columns"
        :data-source="users"
        :row-key="(record: User) => record.id"
        :pagination="pagination"
        :loading="loading"
        :row-selection="rowSelection"
        :scroll="{ x: 1200, y: 'calc(100vh - 280px)' }"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 用户名列 -->
          <template v-if="column.key === 'username'">
            <div class="flex items-center">
              <a-avatar :src="record.avatar" :size="28" class="mr-2">
                {{ record.username?.charAt(0).toUpperCase() }}
              </a-avatar>
              <div>
                <div class="text-sm font-medium">{{ record.username }}</div>
                <div class="text-xs text-gray-500">
                  {{ record.nickname }}
                </div>
              </div>
            </div>
          </template>

          <!-- 联系方式列 -->
          <template v-else-if="column.key === 'contact'">
            <div class="space-y-1">
              <div v-if="record.email" class="flex items-center text-xs">
                <MailOutlined class="mr-1 text-gray-400" />
                {{ record.email }}
              </div>
              <div v-if="record.phone" class="flex items-center text-xs">
                <PhoneOutlined class="mr-1 text-gray-400" />
                {{ maskPhone(record.phone) }}
              </div>
            </div>
          </template>

          <!-- 所属系统列 -->
          <template v-else-if="column.key === 'systemCode'">
            <a-tag v-if="record.systemCode" color="blue" size="small">
              {{ getSystemName(record.systemCode) }}
            </a-tag>
            <span v-else class="text-xs text-gray-400">未绑定</span>
          </template>

          <!-- 角色列 -->
          <template v-else-if="column.key === 'roles'">
            <a-badge
              :count="record.rolesCount || 0"
              :number-style="{ backgroundColor: '#52c41a' }"
            >
              <a-button
                type="link"
                size="small"
                @click="handleViewRoles(record)"
              >
                查看角色
              </a-button>
            </a-badge>
          </template>

          <!-- 状态列 -->
          <template v-else-if="column.key === 'status'">
            <a-switch
              :checked="record.status === 'active'"
              size="small"
              @change="(checked: boolean) => handleStatusChange(record, checked)"
              :loading="loading"
            />
          </template>

          <!-- 最近登录列 -->
          <template v-else-if="column.key === 'lastLoginAt'">
            <span v-if="record.lastLoginAt" class="text-xs">
              {{ formatTime(record.lastLoginAt) }}
            </span>
            <span v-else class="text-xs text-gray-400">从未登录</span>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'actions'">
            <a-space size="small" wrap>
              <a-button
                type="link"
                size="small"
                @click="handleView(record)"
                v-permission="'user:list'"
              >
                查看
              </a-button>

              <a-button
                type="link"
                size="small"
                @click="handleEdit(record)"
                v-permission="'user:update'"
              >
                编辑
              </a-button>

              <a-button
                type="link"
                size="small"
                @click="handleResetPassword(record)"
                v-permission="'user:update'"
              >
                重置密码
              </a-button>

              <a-button
                type="link"
                size="small"
                danger
                @click="handleDelete(record)"
                v-permission="'user:delete'"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 用户详情抽屉 -->
    <UserDetailDrawer
      v-model:open="detailVisible"
      :user-id="selectedUserId"
      @refresh="handleRefresh"
    />

    <!-- 用户编辑弹窗 -->
    <UserEditModal
      v-model:open="editVisible"
      :user="selectedUser"
      @success="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message, Modal } from "ant-design-vue";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons-vue";
import { userApi } from "@api/user";
import type { User, UserSearchParams } from "../../types";
import { formatDate } from "@utils/dayjs";
import UserDetailDrawer from "@components/user/UserDetailDrawer.vue";
import UserEditModal from "@components/user/UserEditModal.vue";

const router = useRouter();
const route = useRoute();

// 状态
const loading = ref(false);
const users = ref<User[]>([]);
const selectedRowKeys = ref<string[]>([]);
const selectedUserId = ref<string>("");
const selectedUser = ref<User | null>(null);

// 弹窗状态
const detailVisible = ref(false);
const editVisible = ref(false);
const editMode = ref<"create" | "edit">("create");

// 搜索参数
const searchParams = reactive<UserSearchParams>({
  keyword: "",
  status: undefined,
  systemCode: undefined,
  limit: 20,
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  size: "small",
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 表格列配置
const columns = [
  {
    title: "用户名",
    dataIndex: "username",
    key: "username",
    width: 180,
    fixed: "left",
  },
  {
    title: "联系方式",
    key: "contact",
    width: 180,
  },
  {
    title: "所属系统",
    key: "systemCode",
    width: 120,
  },
  {
    title: "角色",
    key: "roles",
    width: 80,
    align: "center",
  },
  {
    title: "状态",
    key: "status",
    width: 80,
    align: "center",
  },
  {
    title: "最近登录",
    key: "lastLoginAt",
    width: 120,
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 120,
    customRender: ({ text }: any) => formatDate(text),
  },
  {
    title: "操作",
    key: "actions",
    width: 240,
    fixed: "right",
  },
];

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  },
}));

// 加载用户列表
const loadUsers = async () => {
  try {
    loading.value = true;
    const params = {
      ...searchParams,
      cursor: pagination.current > 1 ? `page_${pagination.current}` : undefined,
    };

    const response = await userApi.getUsers(params);
    users.value = response.items;
    pagination.total = response.total || 0;
  } catch (error) {
    console.error("加载用户列表失败:", error);
    message.error("加载用户列表失败");
  } finally {
    loading.value = false;
  }
};

// 获取系统名称
const getSystemName = (systemCode: string) => {
  const systemMap = {
    PERMISSION_SYSTEM: "权限管理系统",
    USER_CENTER: "用户中心",
    ADMIN: "管理后台",
  };
  return systemMap[systemCode as keyof typeof systemMap] || systemCode;
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadUsers();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchParams, {
    keyword: "",
    status: undefined,
    systemCode: undefined,
  });
  handleSearch();
};

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadUsers();
};

// 新增用户
const handleCreate = () => {
  editMode.value = "create";
  selectedUserId.value = "";
  selectedUser.value = null;
  editVisible.value = true;
};

// 查看用户
const handleView = (record: User) => {
  selectedUserId.value = record.id;
  selectedUser.value = record;
  detailVisible.value = true;
};

// 编辑用户
const handleEdit = (record: User) => {
  editMode.value = "edit";
  selectedUserId.value = record.id;
  selectedUser.value = record;
  editVisible.value = true;
};

// 删除用户
const handleDelete = (record: User) => {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除用户"${record.username}"吗？此操作不可撤销。`,
    onOk: async () => {
      try {
        await userApi.deleteUser(record.id);
        message.success("删除成功");
        handleRefresh();
      } catch (error) {
        message.error("删除失败");
      }
    },
  });
};

// 批量删除
const handleBatchDelete = () => {
  Modal.confirm({
    title: "确认批量删除",
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个用户吗？此操作不可撤销。`,
    onOk: async () => {
      try {
        await Promise.all(
          selectedRowKeys.value.map((id) => userApi.deleteUser(id))
        );
        message.success("批量删除成功");
        selectedRowKeys.value = [];
        handleRefresh();
      } catch (error) {
        message.error("批量删除失败");
      }
    },
  });
};

// 状态切换
const handleStatusChange = async (record: User, checked: boolean) => {
  try {
    const status = checked ? "active" : "inactive";
    await userApi.updateStatus(record.id, status);
    record.status = status;
    message.success(`${checked ? "启用" : "停用"}成功`);
    // 刷新列表数据
    loadUsers();
  } catch (error) {
    message.error(`${checked ? "启用" : "停用"}失败`);
  }
};

// 重置密码
const handleResetPassword = async (record: User) => {
  Modal.confirm({
    title: "确认重置密码",
    content: `确定要重置用户"${record.username}"的密码吗？`,
    onOk: async () => {
      try {
        const result = await userApi.resetPassword(record.id);
        Modal.success({
          title: "密码重置成功",
          content: `新密码：${result.password}`,
          width: 400,
        });
      } catch (error) {
        message.error("密码重置失败");
      }
    },
  });
};

// 导出
const handleExport = () => {
  message.info("导出功能开发中...");
};

// 刷新
const handleRefresh = () => {
  selectedRowKeys.value = [];
  loadUsers();
};

// 手机号脱敏
const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 7) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
};

// 格式化时间
const formatTime = (time: string): string => {
  return formatDate(time);
};

// 检查路由参数
const checkRouteParams = () => {
  const action = route.query.action as string;

  if (action === "create") {
    // 清除URL参数，避免刷新时重复触发
    router.replace({ query: {} });
    // 延迟打开模态框，确保页面已渲染
    setTimeout(() => {
      handleCreate();
    }, 100);
  }
};

onMounted(() => {
  loadUsers();
  checkRouteParams();
});

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
</script>

<style scoped>
.user-list-container {
  min-height: 100%;
  height: calc(100vh - 64px);
  padding: 16px;
  display: flex;
  flex-direction: column;
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
