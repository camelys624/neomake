import * as React from "react";
import { BRAND_NAME } from "@/lib/constants";
import { siteRoutes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "./AuthDialog";
import { RechargeButton } from "./RechargeButton";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/appState";

const publicNavPaths: Record<string, true> = { "/": true, "/workspace": true, "/tools": true, "/procurement": true, "/#faq": true };

export function AppHeader() {
  const [loginOpen, setLoginOpen] = React.useState(false);
  const { user } = useAuth();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#fbfaf7]/90 backdrop-blur-xl">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-stone-950 focus:px-4 focus:py-2 focus:text-white">跳到主要内容</a>
      <div className="mx-auto flex max-w-[1360px] items-center gap-5 px-6 py-4 lg:px-8">
        <a href={isAdmin ? "/admin" : "/"} className="flex min-h-11 items-center gap-2 rounded-xl text-xl font-black tracking-[-0.04em] text-stone-950">
          <span className="grid size-8 place-items-center rounded-xl bg-[#b77a2b] text-white shadow-sm"><span className="size-3 rounded-sm border-2 border-current rotate-45" /></span>
          {isAdmin ? `${BRAND_NAME} mgmt.` : BRAND_NAME}
        </a>

        {!isAdmin && (
          <nav className="hidden flex-1 items-center justify-center gap-7 md:flex" aria-label="主导航">
            {siteRoutes.filter((route) => Boolean(publicNavPaths[route.path])).map((route) => (
              <a key={route.path} href={route.path} className="rounded-xl px-1 py-2 text-sm font-semibold text-stone-800 transition hover:text-[#b77a2b]">
                {route.label}
              </a>
            ))}
          </nav>
        )}

        {!isAdmin && (
          <div className="ml-auto flex items-center gap-2">
            <RechargeButton onLogin={() => setLoginOpen(true)} />
            {user ? <UserMenu /> : <Button variant="outline" onClick={() => setLoginOpen(true)}>登录</Button>}
          </div>
        )}
      </div>
      <AuthDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
