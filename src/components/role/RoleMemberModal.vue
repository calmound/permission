<template>
  <a-modal
    v-model:open="visible"
    title="管理角色成员"
    :width="800"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirmLoading="loading"
    :bodyStyle="{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }"
  >
    <div v-if="roleInfo" class="role-member-management">
      <!-- 角色信息 -->
      <a-card size="small" class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-lg font-medium mb-1">{{ roleInfo.name }}</h4>
            <p class="text-gray-500 text-sm">
              {{ roleInfo.description || "暂无描述" }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <a-tag color="blue">{{ roleInfo.systemCode }}</a-tag>
            <a-tag color="green">成员：{{ roleMembers.length }} 人</a-tag>
          </div>
        </div>
      </a-card>

      <!-- 成员管理操作 -->
      <div class="member-actions mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <a-button type="primary" @click="showAddMemberModal = true">
              <PlusOutlined />
              添加成员
            </a-button>
            <a-button
              :disabled="selectedMemberKeys.length === 0"
              @click="handleBatchRemove"
            >
              批量移除
            </a-button>
          </div>
          <div class="flex items-center space-x-2">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索成员..."
              style="width: 200px"
              @search="handleSearch"
            />
            <a-button @click="loadRoleMembers">
              <ReloadOutlined />
            </a-button>
          </div>
        </div>
      </div>

      <!-- 成员列表 -->
      <a-spin :spinning="memberLoading">
        <a-table
          :data-source="filteredMembers"
          :columns="memberColumns"
          :row-selection="memberRowSelection"
          :pagination="memberPagination"
          :scroll="{ y: 300 }"
          size="small"
          class="member-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'avatar'">
              <a-avatar size="small" :src="record.avatar">
                {{ record.nickname?.charAt(0) || record.username?.charAt(0) }}
              </a-avatar>
            </template>
            <template v-else-if="column.key === 'userInfo'">
              <div class="user-info">
                <div class="font-medium">
                  {{ record.nickname || record.username }}
                </div>
                <div class="text-xs text-gray-500">{{ record.email }}</div>
              </div>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="record.status === 'active' ? 'green' : 'red'">
                {{ record.status === "active" ? "启用" : "停用" }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'joinTime'">
              {{ formatDate(record.joinTime || record.createdAt) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space size="small">
                <a-button
                  type="link"
                  size="small"
                  @click="viewUserDetail(record)"
                >
                  查看
                </a-button>
                <a-popconfirm
                  title="确定要将此用户从角色中移除吗？"
                  @confirm="handleRemoveMember(record)"
                >
                  <a-button type="link" size="small" danger> 移除 </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-spin>
    </div>

    <!-- 添加成员弹窗 -->
    <a-modal
      v-model:open="showAddMemberModal"
      title="添加角色成员"
      :width="600"
      @ok="handleAddMembers"
      @cancel="showAddMemberModal = false"
      :confirmLoading="addingMembers"
    >
      <div class="add-member-content">
        <div class="mb-4">
          <a-input-search
            v-model:value="userSearchKeyword"
            placeholder="搜索用户..."
            @search="searchUsers"
            class="w-full"
          />
        </div>
        <a-spin :spinning="userLoading">
          <a-transfer
            v-model:target-keys="selectedMemberIds"
            :data-source="availableUsers"
            :titles="['可选用户', '已选用户']"
            :render="(item: any) => `${item.title} (${item.email})`"
            show-search
            :filter-option="filterUsers"
            @change="handleMemberTransferChange"
          />
        </a-spin>
      </div>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons-vue";
import type { Role, User } from "../../types";
import { roleApi } from "@api/role";
import { userApi } from "@api/user";
import { formatDate } from "@utils/dayjs";

interface Props {
  open: boolean;
  role?: Role | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);
const loading = ref(false);
const roleInfo = ref<Role | null>(null);

// 成员管理相关
const memberLoading = ref(false);
const roleMembers = ref<User[]>([]);
const selectedMemberKeys = ref<string[]>([]);
const searchKeyword = ref("");

// 添加成员相关
const showAddMemberModal = ref(false);
const addingMembers = ref(false);
const userLoading = ref(false);
const availableUsers = ref<any[]>([]);
const selectedMemberIds = ref<string[]>([]);
const userSearchKeyword = ref("");

// 表格配置
const memberColumns = [
  {
    title: "头像",
    key: "avatar",
    width: 60,
  },
  {
    title: "用户信息",
    key: "userInfo",
    width: 200,
  },
  {
    title: "用户名",
    dataIndex: "username",
    key: "username",
    width: 120,
  },
  {
    title: "状态",
    key: "status",
    width: 80,
  },
  {
    title: "加入时间",
    key: "joinTime",
    width: 120,
  },
  {
    title: "操作",
    key: "actions",
    width: 100,
    fixed: "right",
  },
];

const memberPagination = {
  pageSize: 10,
  showSizeChanger: false,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 人`,
};

const memberRowSelection = {
  selectedRowKeys: selectedMemberKeys,
  onChange: (selectedKeys: string[]) => {
    selectedMemberKeys.value = selectedKeys;
  },
};

// 过滤后的成员列表
const filteredMembers = computed(() => {
  if (!searchKeyword.value) {
    return roleMembers.value;
  }
  const keyword = searchKeyword.value.toLowerCase();
  return roleMembers.value.filter(
    (member) =>
      member.username?.toLowerCase().includes(keyword) ||
      member.nickname?.toLowerCase().includes(keyword) ||
      member.email?.toLowerCase().includes(keyword)
  );
});

watch(
  () => props.open,
  (newVal) => {
    visible.value = newVal;
    if (newVal && props.role) {
      roleInfo.value = props.role;
      loadRoleMembers();
    }
  }
);

watch(visible, (newVal) => {
  if (!newVal) {
    emit("update:open", false);
    resetForm();
  }
});

const loadRoleMembers = async () => {
  if (!props.role?.id) return;

  try {
    memberLoading.value = true;
    const members = await roleApi.getRoleMembers(props.role.id);
    roleMembers.value = members;
  } catch (error) {
    console.error("加载角色成员失败:", error);
    message.error("加载角色成员失败");
  } finally {
    memberLoading.value = false;
  }
};

const loadAvailableUsers = async () => {
  try {
    userLoading.value = true;
    const response = await userApi.getUsers({
      limit: 100,
      keyword: userSearchKeyword.value,
    });

    // 过滤掉已经是成员的用户
    const memberIds = roleMembers.value.map((m) => m.id);
    const users = response.items.filter((user) => !memberIds.includes(user.id));

    availableUsers.value = users.map((user: User) => ({
      key: user.id,
      title: user.nickname || user.username,
      email: user.email,
      disabled: false,
    }));
  } catch (error) {
    message.error("加载用户列表失败");
  } finally {
    userLoading.value = false;
  }
};

const handleSearch = () => {
  // 搜索功能已通过 computed 实现
};

const searchUsers = () => {
  loadAvailableUsers();
};

const filterUsers = (inputValue: string, option: any) => {
  return (
    option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
    option.email.toLowerCase().includes(inputValue.toLowerCase())
  );
};

const viewUserDetail = (user: User) => {
  // 这里可以打开用户详情
  message.info(`查看用户详情: ${user.username}`);
};

const handleRemoveMember = async (user: User) => {
  try {
    // TODO: 调用移除成员API
    await roleApi.removeRoleMember(roleInfo.value!.id, user.id);
    message.success("成员移除成功");
    loadRoleMembers();
  } catch (error) {
    message.error("成员移除失败");
  }
};

const handleBatchRemove = () => {
  if (selectedMemberKeys.value.length === 0) {
    message.warning("请选择要移除的成员");
    return;
  }

  Modal.confirm({
    title: "确认移除",
    content: `确定要移除选中的 ${selectedMemberKeys.value.length} 个成员吗？`,
    onOk: async () => {
      try {
        // TODO: 调用批量移除API
        for (const userId of selectedMemberKeys.value) {
          await roleApi.removeRoleMember(roleInfo.value!.id, userId);
        }
        message.success("批量移除成功");
        selectedMemberKeys.value = [];
        loadRoleMembers();
      } catch (error) {
        message.error("批量移除失败");
      }
    },
  });
};

const handleMemberTransferChange = (targetKeys: string[]) => {
  selectedMemberIds.value = targetKeys;
};

const handleAddMembers = async () => {
  if (selectedMemberIds.value.length === 0) {
    message.warning("请选择要添加的成员");
    return;
  }

  try {
    addingMembers.value = true;
    // TODO: 调用添加成员API
    for (const userId of selectedMemberIds.value) {
      await roleApi.addRoleMember(roleInfo.value!.id, userId);
    }
    message.success("成员添加成功");
    showAddMemberModal.value = false;
    selectedMemberIds.value = [];
    loadRoleMembers();
  } catch (error) {
    message.error("成员添加失败");
  } finally {
    addingMembers.value = false;
  }
};

const resetForm = () => {
  selectedMemberKeys.value = [];
  searchKeyword.value = "";
  showAddMemberModal.value = false;
  selectedMemberIds.value = [];
  userSearchKeyword.value = "";
};

const handleOk = () => {
  visible.value = false;
  emit("success");
};

const handleCancel = () => {
  visible.value = false;
};

// 监听添加成员弹窗打开，加载可用用户
watch(showAddMemberModal, (newVal) => {
  if (newVal) {
    loadAvailableUsers();
  }
});
</script>

<style scoped>
.role-member-management {
  max-width: 100%;
  overflow-x: hidden;
}

.member-table {
  max-width: 100%;
}

.member-table :deep(.ant-table-tbody > tr > td) {
  padding: 8px;
}

.user-info {
  min-width: 0;
}

.add-member-content {
  max-width: 100%;
  overflow-x: hidden;
}

:deep(.ant-transfer) {
  width: 100%;
}

:deep(.ant-transfer-list) {
  width: calc(50% - 15px);
}

:deep(.ant-table-wrapper) {
  overflow-x: auto;
}
</style>
