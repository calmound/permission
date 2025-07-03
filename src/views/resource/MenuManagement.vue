<template>
  <div class="p-4">
    <!-- 系统选择器和操作按钮 -->
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
      <a-button
        type="primary"
        :disabled="!currentSystemCode"
        @click="handleCreate"
      >
        <PlusOutlined />
        新增菜单
      </a-button>
    </div>

    <a-card>
      <div class="flex">
        <!-- 左侧树形菜单 -->
        <div class="w-1/3 pr-4">
          <a-tree
            v-model:selectedKeys="selectedKeys"
            :tree-data="treeData"
            :field-names="{ children: 'children', title: 'name', key: 'id' }"
            @select="handleTreeSelect"
          >
            <template #title="{ name, type }">
              <span>
                <FolderOutlined v-if="type === 'M'" class="mr-1" />
                <FileOutlined v-else-if="type === 'V'" class="mr-1" />
                <ControlOutlined v-else class="mr-1" />
                {{ name }}
              </span>
            </template>
          </a-tree>
        </div>

        <!-- 右侧详情面板 -->
        <div class="w-2/3 pl-4 border-l">
          <div v-if="selectedNode">
            <div class="mb-4 flex justify-between items-center">
              <h3 class="text-lg font-medium">{{ selectedNode.name }}</h3>
              <a-space>
                <a-button size="small" @click="handleEdit(selectedNode)"
                  >编辑</a-button
                >
                <a-button
                  size="small"
                  danger
                  @click="handleDelete(selectedNode)"
                  >删除</a-button
                >
              </a-space>
            </div>

            <a-descriptions :column="1" bordered size="small">
              <a-descriptions-item label="类型">
                <a-tag :color="getTypeColor(selectedNode.type)">
                  {{ getTypeName(selectedNode.type) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="路由地址" v-if="selectedNode.url">
                {{ selectedNode.url }}
              </a-descriptions-item>
              <a-descriptions-item
                label="组件路径"
                v-if="selectedNode.component"
              >
                {{ selectedNode.component }}
              </a-descriptions-item>
              <a-descriptions-item label="关联权限">
                <div v-if="relatedPermissions.length > 0" class="space-y-1">
                  <a-tag
                    v-for="permission in relatedPermissions"
                    :key="permission.id"
                    color="blue"
                    size="small"
                  >
                    {{ permission.code }} - {{ permission.name }}
                  </a-tag>
                </div>
                <span v-else class="text-gray-400">暂无关联权限</span>
              </a-descriptions-item>
              <a-descriptions-item label="图标" v-if="selectedNode.icon">
                {{ selectedNode.icon }}
              </a-descriptions-item>
              <a-descriptions-item label="排序">
                {{ selectedNode.sort || 0 }}
              </a-descriptions-item>
              <a-descriptions-item
                label="缓存"
                v-if="selectedNode.type === 'V'"
              >
                {{ selectedNode.keepAlive ? "是" : "否" }}
              </a-descriptions-item>
              <a-descriptions-item label="系统">
                {{ selectedNode.systemCode }}
              </a-descriptions-item>
            </a-descriptions>

            <!-- 子节点列表 -->
            <div v-if="selectedNode.children?.length" class="mt-6">
              <h4 class="mb-2">子节点</h4>
              <a-table
                :columns="childColumns"
                :data-source="selectedNode.children"
                :pagination="false"
                size="small"
                row-key="id"
              />
            </div>
          </div>
          <div v-else class="text-center text-gray-500 py-8">
            请选择左侧菜单项查看详情
          </div>
        </div>
      </div>
    </a-card>

    <!-- 编辑模态框 -->
    <a-modal
      v-model:open="editModalVisible"
      :title="editForm.id ? '编辑菜单' : '新增菜单'"
      @ok="handleSave"
      @cancel="handleCancel"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="菜单名称" required>
          <a-input v-model:value="editForm.name" />
        </a-form-item>
        <a-form-item label="类型" required>
          <a-radio-group v-model:value="editForm.type">
            <a-radio value="M">目录</a-radio>
            <a-radio value="V">菜单</a-radio>
            <a-radio value="A">按钮</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="父级菜单">
          <a-tree-select
            v-model:value="editForm.parentId"
            :tree-data="treeData"
            :field-names="{ children: 'children', label: 'name', value: 'id' }"
            placeholder="请选择父级菜单"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="路由地址" v-if="editForm.type !== 'M'">
          <a-input v-model:value="editForm.url" />
        </a-form-item>
        <a-form-item label="组件路径" v-if="editForm.type === 'V'">
          <a-input v-model:value="editForm.component" />
        </a-form-item>
        <a-form-item label="图标" v-if="editForm.type !== 'A'">
          <a-input v-model:value="editForm.icon" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="editForm.sort" :min="0" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { message } from "ant-design-vue";
import {
  PlusOutlined,
  FolderOutlined,
  FileOutlined,
  ControlOutlined,
} from "@ant-design/icons-vue";
import SystemSelector from "@/components/common/SystemSelector.vue";
import type { Resource, SystemMenu, SystemPermission } from "@/types";
import {
  resourceApi,
  systemMenuApi,
  systemPermissionApi,
} from "@/api/resource";

const loading = ref(false);
const currentSystemCode = ref<string>("");
const treeData = ref<SystemMenu[]>([]);
const selectedKeys = ref<string[]>([]);
const selectedNode = ref<SystemMenu | null>(null);
const editModalVisible = ref(false);
const relatedPermissions = ref<SystemPermission[]>([]);

const editForm = reactive({
  id: "",
  name: "",
  type: "V" as "M" | "V" | "A",
  parentId: "",
  url: "",
  component: "",
  icon: "",
  sort: 0,
  systemCode: "",
});

const childColumns = [
  { title: "名称", dataIndex: "name", key: "name" },
  { title: "类型", dataIndex: "type", key: "type" },
  { title: "排序", dataIndex: "sort", key: "sort" },
];

onMounted(() => {
  // 不在mounted时自动加载，等待系统选择
});

// 处理系统选择变化
const handleSystemChange = (systemCode: string | undefined) => {
  currentSystemCode.value = systemCode || "";
  selectedKeys.value = [];
  selectedNode.value = null;
  relatedPermissions.value = [];

  if (systemCode) {
    loadTreeData(systemCode);
  } else {
    treeData.value = [];
  }
};

const loadTreeData = async (systemCode?: string) => {
  const targetSystemCode = systemCode || currentSystemCode.value;
  if (!targetSystemCode) {
    treeData.value = [];
    return;
  }

  loading.value = true;
  try {
    const response = await systemMenuApi.getSystemMenuTree(targetSystemCode);
    treeData.value = response;
  } catch (error) {
    message.error("加载菜单树失败");
  } finally {
    loading.value = false;
  }
};

// 加载选中菜单的关联权限
const loadMenuPermissions = async (menuId: string) => {
  if (!currentSystemCode.value) return;

  try {
    const permissions = await systemMenuApi.getMenuPermissions(
      currentSystemCode.value,
      menuId
    );
    relatedPermissions.value = permissions;
  } catch (error) {
    console.error("加载菜单权限失败:", error);
    relatedPermissions.value = [];
  }
};

const handleTreeSelect = (keys: string[], info: any) => {
  if (keys.length > 0) {
    selectedNode.value = info.node;
    // 加载选中菜单的关联权限
    loadMenuPermissions(info.node.id);
  } else {
    selectedNode.value = null;
    relatedPermissions.value = [];
  }
};

const handleCreate = () => {
  if (!currentSystemCode.value) {
    message.warning("请先选择要管理的系统");
    return;
  }
  resetForm();
  editForm.systemCode = currentSystemCode.value;
  editModalVisible.value = true;
};

const handleEdit = (node: SystemMenu) => {
  Object.assign(editForm, {
    id: node.id,
    name: node.name,
    type: node.type,
    parentId: node.parentId || "",
    url: node.url || "",
    component: node.component || "",
    icon: node.icon || "",
    sort: node.sort || 0,
    systemCode: node.systemCode,
  });
  editModalVisible.value = true;
};

const handleDelete = async (node: SystemMenu) => {
  if (!currentSystemCode.value) return;

  try {
    await systemMenuApi.deleteSystemMenu(currentSystemCode.value, node.id);
    message.success("删除成功");
    loadTreeData();
  } catch (error) {
    message.error("删除失败");
  }
};

const handleSave = async () => {
  if (!currentSystemCode.value) {
    message.error("请先选择系统");
    return;
  }

  try {
    if (editForm.id) {
      await systemMenuApi.updateSystemMenu(
        currentSystemCode.value,
        editForm.id,
        editForm
      );
      message.success("更新成功");
    } else {
      await systemMenuApi.createSystemMenu({
        systemCode: currentSystemCode.value,
        parentId: editForm.parentId,
        name: editForm.name,
        type: editForm.type,
        url: editForm.url,
        component: editForm.component,
        icon: editForm.icon,
        sort: editForm.sort || 0,
        visible: true,
        keepAlive: false,
      });
      message.success("创建成功");
    }
    editModalVisible.value = false;
    loadTreeData();
  } catch (error) {
    message.error("保存失败");
  }
};

const handleCancel = () => {
  editModalVisible.value = false;
  resetForm();
};

const resetForm = () => {
  Object.assign(editForm, {
    id: "",
    name: "",
    type: "V",
    parentId: "",
    url: "",
    component: "",
    icon: "",
    sort: 0,
    systemCode: currentSystemCode.value || "",
  });
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "M":
      return "blue";
    case "V":
      return "green";
    case "A":
      return "orange";
    default:
      return "default";
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case "M":
      return "目录";
    case "V":
      return "菜单";
    case "A":
      return "按钮";
    default:
      return "未知";
  }
};
</script>
