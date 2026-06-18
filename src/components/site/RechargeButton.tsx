import { Button } from "@/components/ui/button";
import { useAuth } from "@/appState";
export function RechargeButton({ onLogin }: { onLogin: () => void }) { const { user } = useAuth(); return <Button className="border-[#b77a2b] bg-[#b77a2b] text-white hover:border-[#a66d25] hover:bg-[#a66d25]" onClick={() => { if (!user) onLogin(); else location.href = "/recharge"; }}>充值</Button>; }
