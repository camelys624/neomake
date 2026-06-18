export const siteRoutes = [
  { path: "/", label: "首页" },
  { path: "/workspace", label: "AI 工作台" },
  { path: "/tools", label: "图片工具" },
  { path: "/procurement", label: "颜料采购" },
  { path: "/#faq", label: "帮助中心" },
  { path: "/account", label: "用户信息" },
  { path: "/recharge", label: "充值" },
  { path: "/admin", label: "后台" },
] as const;

export type SiteRoutePath = (typeof siteRoutes)[number]["path"];
