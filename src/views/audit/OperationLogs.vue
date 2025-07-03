<template>
  <div class="operation-logs-container">
    <!-- 页面标题 -->
    <div class="mb-6 page-header">
      <h1 class="text-2xl font-semibold text-gray-800">操作日志</h1>
      <p class="mt-1 text-gray-500">
        查看系统操作记录，支持多维度筛选和日志分析
      </p>
    </div>

    <!-- 筛选和操作区域 -->
    <a-card class="mb-6 card-container">
      <div class="toolbar">
        <div class="filter-section">
          <a-input
            v-model:value="searchForm.keyword"
            placeholder="搜索操作者或操作内容"
            style="width: 200px"
            @press-enter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>

          <a-select
            v-model:value="searchForm.type"
            placeholder="操作类型"
            style="width: 120px"
            allow-clear
          >
            <a-select-option value="create">新增</a-select-option>
            <a-select-option value="update">修改</a-select-option>
            <a-select-option value="delete">删除</a-select-option>
            <a-select-option value="login">登录</a-select-option>
            <a-select-option value="logout">登出</a-select-option>
          </a-select>

          <a-select
            v-model:value="searchForm.actor"
            placeholder="操作者"
            style="width: 150px"
            allow-clear
            show-search
          >
            <a-select-option
              v-for="user in userOptions"
              :key="user.id"
              :value="user.username"
            >
              {{ user.nickname || user.username }}
            </a-select-option>
          </a-select>

          <a-range-picker
            v-model:value="searchForm.dateRange"
            :show-time="{ format: 'HH:mm' }"
            format="YYYY-MM-DD HH:mm"
            :placeholder="['开始时间', '结束时间']"
          />

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
          <a-button @click="handleExport" v-permission="'audit:export'">
            <ExportOutlined />
            导出日志
          </a-button>

          <a-button @click="handleRefresh">
            <ReloadOutlined />
            刷新
          </a-button>

          <a-dropdown>
            <template #overlay>
              <a-menu @click="handleCleanup">
                <a-menu-item key="30days">
                  <DeleteOutlined />
                  清理30天前日志
                </a-menu-item>
                <a-menu-item key="90days">
                  <DeleteOutlined />
                  清理90天前日志
                </a-menu-item>
                <a-menu-item key="180days">
                  <DeleteOutlined />
                  清理180天前日志
                </a-menu-item>
              </a-menu>
            </template>
            <a-button v-permission="'audit:delete'">
              日志清理
              <DownOutlined />
            </a-button>
          </a-dropdown>
        </div>
      </div>
    </a-card>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="mb-6">
      <a-col :span="6">
        <a-card class="stat-card">
          <a-statistic
            title="今日操作"
            :value="statistics.today"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <CalendarOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <a-statistic
            title="本周操作"
            :value="statistics.week"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <BarChartOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <a-statistic
            title="本月操作"
            :value="statistics.month"
            :value-style="{ color: '#722ed1' }"
          >
            <template #prefix>
              <LineChartOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <a-statistic
            title="总计操作"
            :value="statistics.total"
            :value-style="{ color: '#fa541c' }"
          >
            <template #prefix>
              <FundOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 日志表格 -->
    <a-card class="card-container">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <!-- 操作类型列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">
              <component :is="getTypeIcon(record.type)" class="mr-1" />
              {{ getTypeName(record.type) }}
            </a-tag>
          </template>

          <!-- 操作者列 -->
          <template v-else-if="column.key === 'actor'">
            <div class="flex items-center">
              <a-avatar size="small" class="mr-2">
                {{ record.actor.charAt(0).toUpperCase() }}
              </a-avatar>
              <span>{{ record.actor }}</span>
            </div>
          </template>

          <!-- 操作目标列 -->
          <template v-else-if="column.key === 'target'">
            <a-tag v-if="record.target" color="blue" size="small">
              {{ record.target }}
            </a-tag>
            <span v-else class="text-gray-400">-</span>
          </template>

          <!-- 操作描述列 -->
          <template v-else-if="column.key === 'description'">
            <div class="description-cell">
              <div class="description-text">{{ record.description }}</div>
              <a-button
                v-if="record.details"
                type="link"
                size="small"
                @click="showDetails(record)"
              >
                详情
              </a-button>
            </div>
          </template>

          <!-- IP地址列 -->
          <template v-else-if="column.key === 'ip'">
            <div class="ip-info">
              <div>{{ record.ip }}</div>
              <div class="text-xs text-gray-500">
                {{ record.location || "未知位置" }}
              </div>
            </div>
          </template>

          <!-- 操作时间列 -->
          <template v-else-if="column.key === 'createdAt'">
            <div class="time-info">
              <div>{{ formatDate(record.createdAt) }}</div>
              <div class="text-xs text-gray-500">
                {{ getTimeAgo(record.createdAt) }}
              </div>
            </div>
          </template>

          <!-- 状态列 -->
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'success' ? 'green' : 'red'">
              {{ record.status === "success" ? "成功" : "失败" }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 日志详情弹窗 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="操作详情"
      :width="800"
      :footer="null"
    >
      <div class="log-detail">
        <a-descriptions bordered :column="2">
          <a-descriptions-item label="操作ID">
            {{ currentLog?.id }}
          </a-descriptions-item>
          <a-descriptions-item label="操作类型">
            <a-tag :color="getTypeColor(currentLog?.type)">
              {{ getTypeName(currentLog?.type) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="操作者">
            {{ currentLog?.actor }}
          </a-descriptions-item>
          <a-descriptions-item label="操作目标">
            {{ currentLog?.target || "-" }}
          </a-descriptions-item>
          <a-descriptions-item label="IP地址">
            {{ currentLog?.ip }}
          </a-descriptions-item>
          <a-descriptions-item label="位置信息">
            {{ currentLog?.location || "未知位置" }}
          </a-descriptions-item>
          <a-descriptions-item label="用户代理" :span="2">
            {{ currentLog?.userAgent || "-" }}
          </a-descriptions-item>
          <a-descriptions-item label="操作时间" :span="2">
            {{ formatDate(currentLog?.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="操作描述" :span="2">
            {{ currentLog?.description }}
          </a-descriptions-item>
        </a-descriptions>

        <div v-if="currentLog?.details" class="mt-4">
          <h4>详细信息</h4>
          <a-card size="small">
            <pre class="details-content">{{
              JSON.stringify(currentLog.details, null, 2)
            }}</pre>
          </a-card>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  DeleteOutlined,
  DownOutlined,
  CalendarOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FundOutlined,
  PlusOutlined,
  EditOutlined,
  MinusCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
} from "@ant-design/icons-vue";
import type { OperationLog, User } from "@/types";
import { formatDate } from "@utils/dayjs";

dayjs.extend(relativeTime);

// 扩展OperationLog类型
interface ExtendedOperationLog extends OperationLog {
  location?: string;
  details?: any;
  status?: "success" | "failed";
}

const loading = ref(false);
const dataSource = ref<ExtendedOperationLog[]>([]);
const detailModalVisible = ref(false);
const currentLog = ref<ExtendedOperationLog>();
const userOptions = ref<User[]>([]);

const searchForm = reactive({
  keyword: "",
  type: "",
  actor: "",
  dateRange: [] as any[],
});

const statistics = reactive({
  today: 156,
  week: 1243,
  month: 5678,
  total: 28456,
});

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
    title: "操作类型",
    key: "type",
    width: 120,
  },
  {
    title: "操作者",
    key: "actor",
    width: 120,
  },
  {
    title: "操作目标",
    key: "target",
    width: 100,
  },
  {
    title: "操作描述",
    key: "description",
    ellipsis: true,
  },
  {
    title: "IP地址",
    key: "ip",
    width: 140,
  },
  {
    title: "操作时间",
    key: "createdAt",
    width: 180,
  },
  {
    title: "状态",
    key: "status",
    width: 80,
  },
];

onMounted(() => {
  loadData();
  loadUserOptions();
});

const loadData = async () => {
  loading.value = true;
  try {
    // Mock 数据
    const mockData = generateMockLogs();
    let filteredData = mockData;

    // 应用筛选
    if (searchForm.keyword) {
      filteredData = filteredData.filter(
        (item) =>
          item.actor.includes(searchForm.keyword) ||
          item.description.includes(searchForm.keyword)
      );
    }

    if (searchForm.type) {
      filteredData = filteredData.filter(
        (item) => item.type === searchForm.type
      );
    }

    if (searchForm.actor) {
      filteredData = filteredData.filter(
        (item) => item.actor === searchForm.actor
      );
    }

    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const startDate = dayjs(searchForm.dateRange[0]);
      const endDate = dayjs(searchForm.dateRange[1]);
      filteredData = filteredData.filter((item) => {
        const itemDate = dayjs(item.createdAt);
        return itemDate.isAfter(startDate) && itemDate.isBefore(endDate);
      });
    }

    dataSource.value = filteredData;
    pagination.total = filteredData.length;
  } catch (error) {
    message.error("加载操作日志失败");
  } finally {
    loading.value = false;
  }
};

const loadUserOptions = async () => {
  try {
    // Mock 用户数据
    userOptions.value = [
      {
        id: "1",
        username: "admin",
        nickname: "系统管理员",
        email: "admin@example.com",
        status: "active",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "2",
        username: "user1",
        nickname: "张三",
        email: "zhangsan@example.com",
        status: "active",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "3",
        username: "user2",
        nickname: "李四",
        email: "lisi@example.com",
        status: "active",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ];
  } catch (error) {
    console.error("加载用户选项失败", error);
  }
};

const generateMockLogs = (): ExtendedOperationLog[] => {
  const logs: ExtendedOperationLog[] = [];
  const types = ["create", "update", "delete", "login", "logout"];
  const actors = ["admin", "user1", "user2"];
  const targets = ["用户", "角色", "权限", "资源", "系统配置"];
  const ips = ["192.168.1.100", "192.168.1.101", "192.168.1.102"];
  const locations = ["北京市", "上海市", "深圳市"];

  for (let i = 1; i <= 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const actor = actors[Math.floor(Math.random() * actors.length)];
    const target =
      Math.random() > 0.3
        ? targets[Math.floor(Math.random() * targets.length)]
        : undefined;
    const ip = ips[Math.floor(Math.random() * ips.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];

    logs.push({
      id: i.toString(),
      type,
      actor,
      target,
      description: `${actor} ${getTypeName(type)}了${target || "系统"}`,
      ip,
      location,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      createdAt: dayjs()
        .subtract(Math.floor(Math.random() * 30), "day")
        .format(),
      status: Math.random() > 0.1 ? "success" : "failed",
      details:
        type === "update" ? { oldValue: "旧值", newValue: "新值" } : undefined,
    });
  }

  return logs.sort(
    (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  );
};

const getTypeColor = (type?: string) => {
  const colorMap = {
    create: "green",
    update: "blue",
    delete: "red",
    login: "cyan",
    logout: "orange",
  };
  return colorMap[type as keyof typeof colorMap] || "default";
};

const getTypeIcon = (type?: string) => {
  const iconMap = {
    create: "PlusOutlined",
    update: "EditOutlined",
    delete: "MinusCircleOutlined",
    login: "LoginOutlined",
    logout: "LogoutOutlined",
  };
  return iconMap[type as keyof typeof iconMap] || "PlusOutlined";
};

const getTypeName = (type?: string) => {
  const nameMap = {
    create: "新增",
    update: "修改",
    delete: "删除",
    login: "登录",
    logout: "登出",
  };
  return nameMap[type as keyof typeof nameMap] || type;
};

const getTimeAgo = (time: string) => {
  return dayjs(time).fromNow();
};

const showDetails = (log: OperationLog) => {
  currentLog.value = log;
  detailModalVisible.value = true;
};

const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: "",
    type: "",
    actor: "",
    dateRange: [],
  });
  pagination.current = 1;
  loadData();
};

const handleRefresh = () => {
  loadData();
};

const handleExport = () => {
  message.success("操作日志导出成功");
};

const handleCleanup = ({ key }: { key: string }) => {
  const dayMap = {
    "30days": 30,
    "90days": 90,
    "180days": 180,
  };

  const days = dayMap[key as keyof typeof dayMap];
  message.success(`已清理 ${days} 天前的操作日志`);
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  loadData();
};
</script>

<style scoped>
.operation-logs-container {
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

.card-container,
.stat-card {
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

.description-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.description-text {
  flex: 1;
  margin-right: 8px;
}

.ip-info,
.time-info {
  line-height: 1.2;
}

.log-detail {
  max-height: 600px;
  overflow-y: auto;
}

.details-content {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  max-height: 200px;
  overflow: auto;
}

:deep(.ant-table) {
  background: transparent;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  color: #666;
}

:deep(.ant-statistic-content) {
  font-size: 24px;
  font-weight: 600;
}
</style>
