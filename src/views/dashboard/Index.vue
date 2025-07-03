<template>
  <div class="dashboard-container">
    <!-- 欢迎区域 -->
    <div class="mb-6 welcome-section">
      <a-card class="card-container">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <a-avatar :src="authStore.user?.avatar" :size="64" class="mr-4">
              {{ authStore.user?.username?.charAt(0).toUpperCase() }}
            </a-avatar>
            <div>
              <h2 class="mb-1 text-xl font-semibold text-gray-800">
                {{ getGreeting() }}，{{
                  authStore.user?.nickname || authStore.user?.username
                }}！
              </h2>
              <p class="text-gray-500">
                今天是{{ getCurrentDate() }}，祝您工作愉快！
              </p>
            </div>
          </div>
          <div class="hidden md:block">
            <a-statistic
              title="今日登录时间"
              :value="loginTime"
              :precision="0"
              suffix="次"
              class="text-right"
            />
          </div>
        </div>
      </a-card>
    </div>

    <!-- 统计卡片 -->
    <div class="mb-6 stats-section">
      <a-row :gutter="16">
        <a-col
          :xs="24"
          :sm="12"
          :md="6"
          v-for="stat in stats"
          :key="stat.title"
        >
          <a-card class="mb-4 stat-card card-container" hoverable>
            <a-statistic
              :title="stat.title"
              :value="stat.value"
              :precision="stat.precision || 0"
              :suffix="stat.suffix"
              :prefix="stat.prefix"
              :value-style="{ color: stat.color }"
            >
              <template #prefix>
                <component :is="stat.icon" :style="{ color: stat.color }" />
              </template>
            </a-statistic>
            <div class="mt-2 stat-trend">
              <span class="text-xs text-gray-500">
                较昨日
                <span
                  :class="stat.trend >= 0 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ stat.trend >= 0 ? "+" : "" }}{{ stat.trend }}%
                </span>
              </span>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 图表区域 -->
    <div class="mb-6 charts-section">
      <a-row :gutter="16">
        <!-- 用户活跃度趋势 -->
        <a-col :xs="24" :lg="12">
          <a-card title="用户活跃度趋势" class="mb-4 card-container">
            <div
              class="flex items-center justify-center h-64 rounded chart-placeholder bg-gray-50"
            >
              <div class="text-center text-gray-500">
                <BarChartOutlined class="mb-2 text-4xl" />
                <p>图表数据加载中...</p>
              </div>
            </div>
          </a-card>
        </a-col>

        <!-- 权限分布 -->
        <a-col :xs="24" :lg="12">
          <a-card title="权限分布" class="mb-4 card-container">
            <div
              class="flex items-center justify-center h-64 rounded chart-placeholder bg-gray-50"
            >
              <div class="text-center text-gray-500">
                <PieChartOutlined class="mb-2 text-4xl" />
                <p>图表数据加载中...</p>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 快捷操作和最近活动 -->
    <a-row :gutter="16">
      <!-- 快捷操作 -->
      <a-col :xs="24" :lg="12">
        <a-card title="快捷操作" class="card-container">
          <div class="grid grid-cols-2 gap-4">
            <a-button
              v-for="action in quickActions"
              :key="action.key"
              :type="action.type"
              :icon="action.icon"
              size="large"
              block
              @click="handleQuickAction(action.key)"
              v-permission="action.permission"
            >
              {{ action.title }}
            </a-button>
          </div>
        </a-card>
      </a-col>

      <!-- 最近活动 -->
      <a-col :xs="24" :lg="12">
        <a-card title="最近活动" class="card-container">
          <a-list :data-source="recentActivities" :loading="activitiesLoading">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <a-avatar :style="{ backgroundColor: item.color }">
                      <component :is="item.icon" />
                    </a-avatar>
                  </template>
                  <template #title>
                    {{ item.title }}
                  </template>
                  <template #description>
                    {{ item.description }}
                  </template>
                </a-list-item-meta>
                <div class="text-xs text-gray-400">
                  {{ formatTime(item.time) }}
                </div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  AuditOutlined,
  PlusOutlined,
  SettingOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons-vue";
import { useAuthStore } from "@stores/auth";
import { formatDateWithWeek, formatRelativeTime } from "@utils/dayjs";

const router = useRouter();
const authStore = useAuthStore();

// 状态
const loginTime = ref(1);
const activitiesLoading = ref(false);

// 统计数据
const stats = ref([
  {
    title: "总用户数",
    value: 1234,
    icon: UserOutlined,
    color: "#1890ff",
    trend: 5.2,
  },
  {
    title: "角色数量",
    value: 28,
    icon: TeamOutlined,
    color: "#52c41a",
    trend: 12.5,
  },
  {
    title: "权限点",
    value: 156,
    icon: SafetyOutlined,
    color: "#faad14",
    trend: -2.1,
  },
  {
    title: "今日操作",
    value: 89,
    icon: AuditOutlined,
    color: "#f5222d",
    trend: 8.7,
  },
]);

// 快捷操作
const quickActions = ref([
  {
    key: "create-user",
    title: "新增用户",
    icon: PlusOutlined,
    type: "primary",
    permission: "user:create",
  },
  {
    key: "create-role",
    title: "新增角色",
    icon: PlusOutlined,
    type: "default",
    permission: "role:create",
  },
  {
    key: "system-settings",
    title: "系统设置",
    icon: SettingOutlined,
    type: "default",
    permission: "system:config",
  },
  {
    key: "view-logs",
    title: "查看日志",
    icon: AuditOutlined,
    type: "default",
    permission: "audit:list",
  },
]);

// 最近活动
const recentActivities = ref([
  {
    title: "用户张三登录系统",
    description: "来自IP: 192.168.1.100",
    time: "2024-01-15 10:30:00",
    icon: UserOutlined,
    color: "#1890ff",
  },
  {
    title: "管理员创建新角色",
    description: "角色名称: 财务专员",
    time: "2024-01-15 09:45:00",
    icon: TeamOutlined,
    color: "#52c41a",
  },
  {
    title: "权限配置变更",
    description: "更新了用户管理权限",
    time: "2024-01-15 09:20:00",
    icon: SafetyOutlined,
    color: "#faad14",
  },
]);

// 获取问候语
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
};

// 获取当前日期
const getCurrentDate = (): string => {
  return formatDateWithWeek(new Date());
};

// 格式化时间
const formatTime = (time: string): string => {
  return formatRelativeTime(time);
};

// 处理快捷操作
const handleQuickAction = (key: string) => {
  switch (key) {
    case "create-user":
      router.push("/user/list?action=create");
      break;
    case "create-role":
      router.push("/role/list?action=create");
      break;
    case "system-settings":
      router.push("/settings");
      break;
    case "view-logs":
      router.push("/audit/logs");
      break;
  }
};

// 加载数据
const loadDashboardData = async () => {
  try {
    // TODO: 实现真实的数据加载
    // const [statsData, activitiesData] = await Promise.all([
    //   dashboardApi.getStats(),
    //   dashboardApi.getRecentActivities()
    // ])
    // stats.value = statsData
    // recentActivities.value = activitiesData
  } catch (error) {
    console.error("加载仪表盘数据失败:", error);
  }
};

onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100%;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.chart-placeholder {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
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
