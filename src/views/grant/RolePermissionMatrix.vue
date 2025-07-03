<template>
  <div class="role-permission-matrix-container">
    <!-- 筛选和操作区域 -->
    <a-card class="card-container mb-4 flex-shrink-0">
      <div class="toolbar">
        <div class="filter-section">
          <a-select
            v-model:value="selectedSystem"
            placeholder="选择系统"
            style="width: 200px"
            size="small"
            @change="handleSystemChange"
          >
            <a-select-option value="">全部系统</a-select-option>
            <a-select-option value="PERMISSION_SYSTEM"
              >权限管理系统</a-select-option
            >
            <a-select-option value="USER_CENTER">用户中心</a-select-option>
            <a-select-option value="ADMIN">管理后台</a-select-option>
          </a-select>

          <a-select
            v-model:value="selectedGroup"
            placeholder="权限分组"
            style="width: 150px"
            size="small"
            @change="handleGroupChange"
          >
            <a-select-option value="">全部分组</a-select-option>
            <a-select-option value="user">用户管理</a-select-option>
            <a-select-option value="role">角色管理</a-select-option>
            <a-select-option value="resource">资源管理</a-select-option>
            <a-select-option value="system">系统管理</a-select-option>
            <a-select-option value="audit">审计管理</a-select-option>
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

        <div class="action-section">
          <a-button type="primary" size="small" @click="handleBatchSave">
            <SaveOutlined />
            批量保存
          </a-button>

          <a-button size="small" @click="handleRefresh">
            <ReloadOutlined />
            刷新
          </a-button>

          <a-button size="small" @click="handleExport">
            <ExportOutlined />
            导出矩阵
          </a-button>
        </div>
      </div>
    </a-card>

    <!-- 矩阵表格 -->
    <a-card class="card-container flex-1 flex flex-col">
      <a-table
        :columns="matrixColumns"
        :data-source="matrixData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1500, y: 'calc(100vh - 280px)' }"
        size="small"
        @change="handleTableChange"
      >
        <!-- 自定义表头 -->
        <template #headerCell="{ column }">
          <template v-if="column.key?.startsWith('perm_')">
            <div class="permission-header">
              <div class="perm-name">{{ column.title }}</div>
              <div class="perm-code">{{ column.dataIndex }}</div>
            </div>
          </template>
        </template>

        <!-- 自定义单元格 -->
        <template #bodyCell="{ column, record, index }">
          <!-- 角色名称列 -->
          <template v-if="column.key === 'roleName'">
            <div class="role-info">
              <div class="role-name">{{ record.roleName }}</div>
              <div class="role-desc">{{ record.roleDescription }}</div>
            </div>
          </template>

          <!-- 权限复选框 -->
          <template v-else-if="column.key?.startsWith('perm_')">
            <a-checkbox
              :checked="record[column.dataIndex!]"
              @change="(e: any) => handlePermissionChange(record, column.dataIndex!, e.target.checked)"
            />
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import {
  SearchOutlined,
  ReloadOutlined,
  SaveOutlined,
  ExportOutlined,
} from "@ant-design/icons-vue";

interface RolePermissionItem {
  roleId: string;
  roleName: string;
  roleDescription: string;
  [key: string]: any; // 用于存储权限字段
}

const loading = ref(false);
const saving = ref(false);
const selectedSystem = ref("");
const selectedGroup = ref("");
const matrixData = ref<RolePermissionItem[]>([]);
const permissions = ref<any[]>([]);
const roles = ref<any[]>([]);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  size: "small",
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 动态生成表格列
const matrixColumns = computed(() => {
  const columns: any[] = [
    {
      title: "角色名称",
      key: "roleName",
      dataIndex: "roleName",
      width: 200,
      fixed: "left",
    },
  ];

  // 添加权限列
  permissions.value.forEach((perm) => {
    columns.push({
      title: perm.name,
      key: `perm_${perm.id}`,
      dataIndex: perm.code,
      width: 120,
    });
  });

  return columns;
});

onMounted(() => {
  loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 生成模拟数据
    generateMockData();

    message.success("数据加载成功");
  } catch (error) {
    message.error("数据加载失败");
  } finally {
    loading.value = false;
  }
};

const generateMockData = () => {
  // 模拟权限数据
  permissions.value = [
    { id: "1", code: "user:list", name: "查看用户", group: "user" },
    { id: "2", code: "user:create", name: "创建用户", group: "user" },
    { id: "3", code: "user:update", name: "编辑用户", group: "user" },
    { id: "4", code: "user:delete", name: "删除用户", group: "user" },
    { id: "5", code: "role:list", name: "查看角色", group: "role" },
    { id: "6", code: "role:create", name: "创建角色", group: "role" },
    { id: "7", code: "role:update", name: "编辑角色", group: "role" },
    { id: "8", code: "role:delete", name: "删除角色", group: "role" },
  ];

  // 模拟角色数据
  roles.value = [
    { id: "1", name: "系统管理员", description: "拥有所有权限" },
    { id: "2", name: "用户管理员", description: "管理用户相关功能" },
    { id: "3", name: "角色管理员", description: "管理角色相关功能" },
    { id: "4", name: "普通用户", description: "基础查看权限" },
  ];

  // 生成矩阵数据
  matrixData.value = roles.value.map((role) => {
    const item: RolePermissionItem = {
      roleId: role.id,
      roleName: role.name,
      roleDescription: role.description,
    };

    // 为每个权限添加字段
    permissions.value.forEach((perm) => {
      // 模拟一些权限分配
      if (role.id === "1") {
        // 系统管理员拥有所有权限
        item[perm.code] = true;
      } else if (role.id === "2" && perm.group === "user") {
        // 用户管理员拥有用户相关权限
        item[perm.code] = true;
      } else if (role.id === "3" && perm.group === "role") {
        // 角色管理员拥有角色相关权限
        item[perm.code] = true;
      } else if (role.id === "4" && perm.code.includes("list")) {
        // 普通用户只有查看权限
        item[perm.code] = true;
      } else {
        item[perm.code] = false;
      }
    });

    return item;
  });

  pagination.total = matrixData.value.length;
};

const handleSystemChange = () => {
  loadData();
};

const handleGroupChange = () => {
  loadData();
};

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  selectedSystem.value = "";
  selectedGroup.value = "";
  loadData();
};

const handleRefresh = () => {
  loadData();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadData();
};

const handlePermissionChange = (
  record: RolePermissionItem,
  permCode: string,
  checked: boolean
) => {
  record[permCode] = checked;
};

const handleBatchSave = async () => {
  try {
    saving.value = true;

    // 模拟保存API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));

    message.success("权限矩阵保存成功");
  } catch (error) {
    message.error("保存失败");
  } finally {
    saving.value = false;
  }
};

const handleExport = () => {
  message.info("导出功能开发中...");
};
</script>

<style scoped>
.role-permission-matrix-container {
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

.filter-section,
.action-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.permission-header {
  text-align: center;
}

.perm-name {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 2px;
}

.perm-code {
  font-size: 10px;
  color: #666;
  font-family: monospace;
}

.role-info {
  padding: 4px 0;
}

.role-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.role-desc {
  font-size: 12px;
  color: #666;
}

:deep(.ant-card-body) {
  padding: 12px 16px;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 6px 8px;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  padding: 8px 8px;
}

:deep(.ant-table-small .ant-table-thead > tr > th) {
  background: #fafafa;
}

:deep(.ant-checkbox-wrapper) {
  display: flex;
  justify-content: center;
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
