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
        <!-- 搜索框 -->
        <a-input
          v-model:value="searchKeyword"
          placeholder="搜索菜单名称"
          style="width: 200px"
          allow-clear
          @change="handleSearch"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>
        <!-- 批量操作 -->
        <a-dropdown v-if="selectedRowKeys.length > 0">
          <a-button>
            批量操作 ({{ selectedRowKeys.length }})
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item key="show" @click="handleBatchToggleVisible(true)">
                <EyeOutlined />
                批量显示
              </a-menu-item>
              <a-menu-item key="hide" @click="handleBatchToggleVisible(false)">
                <EyeInvisibleOutlined />
                批量隐藏
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="delete" danger @click="handleBatchDelete">
                <DeleteOutlined />
                批量删除
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
      <a-space>
        <a-button @click="handleRefresh" :disabled="!currentSystemCode">
          <ReloadOutlined />
          刷新
        </a-button>
        <a-button
          type="primary"
          :disabled="!currentSystemCode"
          @click="handleCreate"
        >
          <PlusOutlined />
          新增菜单
        </a-button>
      </a-space>
    </div>

    <!-- Tree Table -->
    <a-card>
      <a-table
        :columns="columns"
        :data-source="filteredTreeData"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :expand-icon-column-index="0"
        :default-expand-all-rows="false"
        size="middle"
        bordered
        :row-selection="{
          selectedRowKeys: selectedRowKeys,
          onChange: (keys: string[]) => (selectedRowKeys = keys),
          type: 'checkbox',
        }"
      >
        <!-- 菜单名称列 -->
        <template #name="{ text, record }">
          <div class="flex items-center">
            <FolderOutlined
              v-if="record.type === 'M'"
              class="mr-2 text-blue-500"
            />
            <FileOutlined
              v-else-if="record.type === 'V'"
              class="mr-2 text-green-500"
            />
            <ControlOutlined v-else class="mr-2 text-orange-500" />
            <span class="font-medium">{{ text }}</span>
          </div>
        </template>

        <!-- 类型列 -->
        <template #type="{ text }">
          <a-tag :color="getTypeColor(text)">
            {{ getTypeName(text) }}
          </a-tag>
        </template>

        <!-- 路由地址列 -->
        <template #url="{ text }">
          <span v-if="text" class="text-blue-600">{{ text }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <!-- 组件路径列 -->
        <template #component="{ text }">
          <span v-if="text" class="text-purple-600 font-mono text-sm">{{
            text
          }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <!-- 图标列 -->
        <template #icon="{ text }">
          <span v-if="text" class="text-gray-600">{{ text }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <!-- 状态列 -->
        <template #visible="{ text, record }">
          <a-switch
            :checked="text"
            :loading="(record as any)._statusLoading"
            size="small"
            @change="(checked: boolean) => handleToggleVisible(record, checked)"
          />
        </template>

        <!-- 操作列 -->
        <template #action="{ record }">
          <a-space size="small">
            <a-tooltip title="编辑">
              <a-button size="small" type="text" @click="handleEdit(record)">
                <EditOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="新增子菜单" v-if="record.type !== 'A'">
              <a-button
                size="small"
                type="text"
                @click="handleCreateChild(record)"
              >
                <PlusOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="删除">
              <a-button
                size="small"
                type="text"
                danger
                @click="handleDelete(record)"
              >
                <DeleteOutlined />
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 分步骤新建菜单模态框 -->
    <a-modal
      v-model:open="createModalVisible"
      title="新增菜单"
      :width="600"
      :footer="null"
      @cancel="handleCreateCancel"
    >
      <a-steps :current="currentStep" class="mb-6">
        <a-step title="选择系统" />
        <a-step title="选择父菜单" />
        <a-step title="菜单信息" />
      </a-steps>

      <!-- 步骤1: 选择系统 -->
      <div v-if="currentStep === 0">
        <a-form layout="vertical">
          <a-form-item label="目标系统" required>
            <SystemSelector
              v-model="stepForm.systemCode"
              mode="manageable"
              placeholder="请选择要添加菜单的系统"
              style="width: 100%"
            />
          </a-form-item>
        </a-form>
        <div class="text-right mt-4">
          <a-space>
            <a-button @click="handleCreateCancel">取消</a-button>
            <a-button
              type="primary"
              :disabled="!stepForm.systemCode"
              @click="handleStepNext"
            >
              下一步
            </a-button>
          </a-space>
        </div>
      </div>

      <!-- 步骤2: 选择父菜单 -->
      <div v-if="currentStep === 1">
        <a-form layout="vertical">
          <a-form-item label="父菜单" help="不选择表示创建根级菜单">
            <a-tree-select
              v-model:value="stepForm.parentId"
              :tree-data="parentMenuOptions"
              :field-names="{
                children: 'children',
                label: 'name',
                value: 'id',
              }"
              placeholder="请选择父菜单（可选）"
              allow-clear
              tree-default-expand-all
            />
          </a-form-item>
        </a-form>
        <div class="text-right mt-4">
          <a-space>
            <a-button @click="handleStepPrev">上一步</a-button>
            <a-button type="primary" @click="handleStepNext">下一步</a-button>
          </a-space>
        </div>
      </div>

      <!-- 步骤3: 菜单信息 -->
      <div v-if="currentStep === 2">
        <a-form :model="stepForm" layout="vertical">
          <a-form-item label="菜单名称" required>
            <a-input
              v-model:value="stepForm.name"
              placeholder="请输入菜单名称"
            />
          </a-form-item>
          <a-form-item label="类型" required>
            <a-radio-group v-model:value="stepForm.type">
              <a-radio value="M">目录</a-radio>
              <a-radio value="V">菜单</a-radio>
              <a-radio value="A">按钮</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="路由地址" v-if="stepForm.type !== 'M'">
            <a-input
              v-model:value="stepForm.url"
              placeholder="请输入路由地址"
            />
          </a-form-item>
          <a-form-item label="组件路径" v-if="stepForm.type === 'V'">
            <a-input
              v-model:value="stepForm.component"
              placeholder="请输入组件路径"
            />
          </a-form-item>
          <a-form-item label="图标" v-if="stepForm.type !== 'A'">
            <a-input
              v-model:value="stepForm.icon"
              placeholder="请输入图标名称"
            />
          </a-form-item>
          <a-form-item label="排序">
            <a-input-number
              v-model:value="stepForm.sort"
              :min="0"
              style="width: 100%"
              placeholder="请输入排序值"
            />
          </a-form-item>
          <a-form-item label="是否显示" v-if="stepForm.type !== 'A'">
            <a-switch
              v-model:checked="stepForm.visible"
              checked-children="显示"
              un-checked-children="隐藏"
            />
          </a-form-item>
        </a-form>
        <div class="text-right mt-4">
          <a-space>
            <a-button @click="handleStepPrev">上一步</a-button>
            <a-button type="primary" @click="handleStepSave">完成</a-button>
          </a-space>
        </div>
      </div>
    </a-modal>

    <!-- 编辑菜单模态框 -->
    <a-modal
      v-model:open="editModalVisible"
      title="编辑菜单"
      @ok="handleEditSave"
      @cancel="handleEditCancel"
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
        <a-form-item label="是否显示" v-if="editForm.type !== 'A'">
          <a-switch
            v-model:checked="editForm.visible"
            checked-children="显示"
            un-checked-children="隐藏"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import { message, Modal as modal } from "ant-design-vue";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  FileOutlined,
  ControlOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons-vue";
import SystemSelector from "@/components/common/SystemSelector.vue";
import type { SystemMenu } from "@/types";
import { systemMenuApi } from "@/api/resource";

const loading = ref(false);
const currentSystemCode = ref<string>("");
const treeData = ref<SystemMenu[]>([]);
const searchKeyword = ref<string>("");
const selectedRowKeys = ref<string[]>([]);

// 编辑相关
const editModalVisible = ref(false);
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
  visible: true,
});

// 分步创建相关
const createModalVisible = ref(false);
const currentStep = ref(0);
const parentMenuOptions = ref<SystemMenu[]>([]);
const stepForm = reactive({
  systemCode: "",
  parentId: "",
  name: "",
  type: "V" as "M" | "V" | "A",
  url: "",
  component: "",
  icon: "",
  sort: 0,
  visible: true,
});

// 表格列配置
const columns = [
  {
    title: "菜单名称",
    dataIndex: "name",
    key: "name",
    width: 200,
    slots: { customRender: "name" },
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
    width: 80,
    slots: { customRender: "type" },
  },
  {
    title: "路由地址",
    dataIndex: "url",
    key: "url",
    width: 150,
    slots: { customRender: "url" },
  },
  {
    title: "组件路径",
    dataIndex: "component",
    key: "component",
    width: 180,
    slots: { customRender: "component" },
  },
  {
    title: "图标",
    dataIndex: "icon",
    key: "icon",
    width: 100,
    slots: { customRender: "icon" },
  },
  {
    title: "排序",
    dataIndex: "sort",
    key: "sort",
    width: 80,
    align: "center" as const,
  },
  {
    title: "状态",
    dataIndex: "visible",
    key: "visible",
    width: 80,
    slots: { customRender: "visible" },
  },
  {
    title: "操作",
    key: "action",
    width: 120,
    fixed: "right" as const,
    slots: { customRender: "action" },
  },
];

// 搜索过滤
const filteredTreeData = computed(() => {
  if (!searchKeyword.value) {
    return treeData.value;
  }

  const filterTree = (nodes: SystemMenu[]): SystemMenu[] => {
    return nodes.reduce((filtered: SystemMenu[], node) => {
      const matchesSearch = node.name
        .toLowerCase()
        .includes(searchKeyword.value.toLowerCase());
      const filteredChildren = node.children ? filterTree(node.children) : [];

      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children:
            filteredChildren.length > 0 ? filteredChildren : node.children,
        });
      }

      return filtered;
    }, []);
  };

  return filterTree(treeData.value);
});

onMounted(() => {
  // 不在mounted时自动加载，等待系统选择
});

// 处理系统选择变化
const handleSystemChange = (systemCode: string | undefined) => {
  currentSystemCode.value = systemCode || "";

  if (systemCode) {
    loadTreeData(systemCode);
  } else {
    treeData.value = [];
  }
};

// 处理搜索
const handleSearch = () => {
  // 搜索由computed属性filteredTreeData自动处理
};

// 处理刷新
const handleRefresh = () => {
  if (currentSystemCode.value) {
    loadTreeData(currentSystemCode.value);
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

// 过滤出可作为父菜单的选项（只能选择目录和菜单）
const filterParentMenuOptions = (menus: SystemMenu[]): SystemMenu[] => {
  return menus.reduce((filtered: SystemMenu[], menu) => {
    if (menu.type === "M" || menu.type === "V") {
      const item: SystemMenu = {
        ...menu,
        children: menu.children
          ? filterParentMenuOptions(menu.children)
          : undefined,
      };
      filtered.push(item);
    }
    return filtered;
  }, []);
};

// 新建菜单
const handleCreate = () => {
  if (!currentSystemCode.value) {
    message.warning("请先选择要管理的系统");
    return;
  }
  resetStepForm();
  stepForm.systemCode = currentSystemCode.value;
  currentStep.value = 0;
  createModalVisible.value = true;
  // 加载父菜单选项
  loadParentMenuOptions(currentSystemCode.value);
};

// 新建子菜单
const handleCreateChild = (parentMenu: SystemMenu) => {
  resetStepForm();
  stepForm.systemCode = parentMenu.systemCode;
  stepForm.parentId = parentMenu.id;
  currentStep.value = 2; // 直接跳到菜单信息步骤
  createModalVisible.value = true;
};

// 加载父菜单选项
const loadParentMenuOptions = async (systemCode: string) => {
  try {
    const response = await systemMenuApi.getSystemMenuTree(systemCode);
    parentMenuOptions.value = filterParentMenuOptions(response);
  } catch (error) {
    message.error("加载父菜单选项失败");
    parentMenuOptions.value = [];
  }
};

// 步骤导航
const handleStepNext = async () => {
  if (currentStep.value === 0) {
    // 第一步：加载选中系统的菜单选项
    if (stepForm.systemCode) {
      await loadParentMenuOptions(stepForm.systemCode);
      currentStep.value = 1;
    }
  } else if (currentStep.value === 1) {
    currentStep.value = 2;
  }
};

const handleStepPrev = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// 完成创建
const handleStepSave = async () => {
  if (!stepForm.name) {
    message.error("请填写菜单名称");
    return;
  }

  try {
    await systemMenuApi.createSystemMenu({
      systemCode: stepForm.systemCode,
      parentId: stepForm.parentId || undefined,
      name: stepForm.name,
      type: stepForm.type,
      url: stepForm.url || undefined,
      component: stepForm.component || undefined,
      icon: stepForm.icon || undefined,
      sort: stepForm.sort || 0,
      visible: stepForm.visible,
      keepAlive: false,
    });
    message.success("创建成功");
    createModalVisible.value = false;
    loadTreeData();
  } catch (error) {
    message.error("创建失败");
  }
};

// 取消创建
const handleCreateCancel = () => {
  createModalVisible.value = false;
  resetStepForm();
  currentStep.value = 0;
};

const resetStepForm = () => {
  Object.assign(stepForm, {
    systemCode: "",
    parentId: "",
    name: "",
    type: "V",
    url: "",
    component: "",
    icon: "",
    sort: 0,
    visible: true,
  });
};

// 编辑菜单
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
    visible: node.visible !== false, // 默认为true
  });
  editModalVisible.value = true;
};

// 保存编辑
const handleEditSave = async () => {
  if (!currentSystemCode.value) {
    message.error("请先选择系统");
    return;
  }

  try {
    await systemMenuApi.updateSystemMenu(currentSystemCode.value, editForm.id, {
      name: editForm.name,
      type: editForm.type,
      url: editForm.url || undefined,
      component: editForm.component || undefined,
      icon: editForm.icon || undefined,
      sort: editForm.sort || 0,
      visible: editForm.visible,
      keepAlive: false,
    });
    message.success("更新成功");
    editModalVisible.value = false;
    loadTreeData();
  } catch (error) {
    message.error("更新失败");
  }
};

// 取消编辑
const handleEditCancel = () => {
  editModalVisible.value = false;
  resetEditForm();
};

const resetEditForm = () => {
  Object.assign(editForm, {
    id: "",
    name: "",
    type: "V",
    parentId: "",
    url: "",
    component: "",
    icon: "",
    sort: 0,
    systemCode: "",
    visible: true,
  });
};

// 删除菜单
const handleDelete = (node: SystemMenu) => {
  if (!currentSystemCode.value) return;

  const hasChildren = node.children && node.children.length > 0;
  const content = hasChildren
    ? `确定要删除菜单"${node.name}"吗？该菜单下有 ${node.children?.length} 个子菜单，删除后将一并移除！`
    : `确定要删除菜单"${node.name}"吗？`;

  modal.confirm({
    title: "确认删除",
    content,
    okText: "确定",
    cancelText: "取消",
    type: "warning",
    onOk: async () => {
      try {
        await systemMenuApi.deleteSystemMenu(currentSystemCode.value, node.id);
        message.success("删除成功");
        loadTreeData();
      } catch (error) {
        message.error("删除失败");
      }
    },
  });
};

// 切换菜单显示状态
const handleToggleVisible = async (node: SystemMenu, visible: boolean) => {
  if (!currentSystemCode.value) return;

  // 设置加载状态
  (node as any)._statusLoading = true;

  try {
    await systemMenuApi.updateSystemMenu(currentSystemCode.value, node.id, {
      visible,
    });
    node.visible = visible;
    message.success(visible ? "已显示" : "已隐藏");
  } catch (error) {
    message.error("状态更新失败");
  } finally {
    (node as any)._statusLoading = false;
  }
};

// 批量切换显示状态
const handleBatchToggleVisible = async (visible: boolean) => {
  if (!currentSystemCode.value || selectedRowKeys.value.length === 0) return;

  try {
    const promises = selectedRowKeys.value.map((id) =>
      systemMenuApi.updateSystemMenu(currentSystemCode.value, id, { visible })
    );
    await Promise.all(promises);

    message.success(`批量${visible ? "显示" : "隐藏"}成功`);
    selectedRowKeys.value = [];
    loadTreeData();
  } catch (error) {
    message.error(`批量${visible ? "显示" : "隐藏"}失败`);
  }
};

// 批量删除
const handleBatchDelete = () => {
  if (!currentSystemCode.value || selectedRowKeys.value.length === 0) return;

  modal.confirm({
    title: "确认批量删除",
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 个菜单吗？删除后无法恢复！`,
    okText: "确定",
    cancelText: "取消",
    type: "warning",
    onOk: async () => {
      try {
        const promises = selectedRowKeys.value.map((id) =>
          systemMenuApi.deleteSystemMenu(currentSystemCode.value, id)
        );
        await Promise.all(promises);

        message.success("批量删除成功");
        selectedRowKeys.value = [];
        loadTreeData();
      } catch (error) {
        message.error("批量删除失败");
      }
    },
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
