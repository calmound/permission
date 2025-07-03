import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

// 扩展dayjs插件
dayjs.extend(relativeTime);

// 设置中文本地化
dayjs.locale("zh-cn");

// 导出配置好的dayjs
export default dayjs;

// 导出常用的格式化函数
export const formatDate = (date: string | Date, format = "YYYY-MM-DD") => {
  return dayjs(date).format(format);
};

export const formatDateTime = (
  date: string | Date,
  format = "YYYY-MM-DD HH:mm:ss"
) => {
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow();
};

export const formatDateWithWeek = (date: string | Date) => {
  return dayjs(date).format("YYYY年MM月DD日 dddd");
};
