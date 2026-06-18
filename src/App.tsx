import { AdminPage } from "@/pages/AdminPage";
import { LandingPage } from "@/pages/LandingPage";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { AccountPage } from "@/pages/AccountPage";
import { ProcurementPage } from "@/pages/ProcurementPage";
import { RechargePage } from "@/pages/RechargePage";
import { ToolsPage } from "@/pages/ToolsPage";

export function App() {
  const path = location.pathname;
  if (path.startsWith("/admin")) return <AdminPage />;
  if (path === "/workspace") return <WorkspacePage />;
  if (path === "/tools") return <ToolsPage />;
  if (path === "/procurement") return <ProcurementPage />;
  if (path === "/recharge") return <RechargePage />;
  if (path === "/account") return <AccountPage />;
  return <LandingPage />;
}
