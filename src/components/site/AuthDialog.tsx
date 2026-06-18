import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOCAL_SMS_CODE } from "@/lib/constants";
import { useAuth } from "@/appState";

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const auth = useAuth();
  const [phone, setPhone] = React.useState("16600000000");
  const [code, setCode] = React.useState(LOCAL_SMS_CODE);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  async function run(action: () => Promise<void>) { try { setError(""); await action(); onOpenChange(false); } catch (err) { setError(err instanceof Error ? err.message : "登录失败"); } }
  return <Dialog open={open}><DialogContent><DialogHeader><DialogTitle>登录 / 注册</DialogTitle><p className="text-sm text-stone-600">使用手机号进入 AI 鞋履设计工作台，验证码为本地演示码。</p></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="auth-phone">手机号</Label><Input id="auth-phone" value={phone} autoComplete="tel" onChange={(event) => setPhone(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="auth-code">验证码</Label><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Input id="auth-code" value={code} inputMode="numeric" onChange={(event) => setCode(event.target.value)} /><Button variant="outline" onClick={() => auth.sendCode(phone)}>发送验证码</Button></div></div><Button className="w-full" onClick={() => void run(() => auth.loginCode(phone, code))}>验证码登录</Button><div className="space-y-2"><Label htmlFor="auth-password">密码</Label><Input id="auth-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => void run(() => auth.loginPassword(phone, password))}>密码登录</Button><Button variant="outline" onClick={() => void run(() => auth.register(phone, password, code))}>注册</Button></div>{error && <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}</div></DialogContent></Dialog>;
}
