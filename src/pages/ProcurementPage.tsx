import * as React from "react";
import { toast } from "sonner";
import { useAuth } from "@/appState";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { paintCatalog, type PaintCatalogColor } from "@/lib/paintCatalog";
import type { PaintOrderItem } from "@/lib/types";
import { createPaintOrder } from "@/server/procurement";
import { Page, requireUser } from "./common";

export function ProcurementPage() {
  const { user } = useAuth();
  const [color, setColor] = React.useState<PaintCatalogColor>(paintCatalog[4]);
  const [weight, setWeight] = React.useState(100);
  const [qty, setQty] = React.useState(2);
  const [cart, setCart] = React.useState<PaintOrderItem[]>([]);

  return <Page><div className="grid gap-4 md:grid-cols-4">{paintCatalog.map((c) => <Card key={c.colorName}><div className="size-10 rounded-full border" style={{ background: c.colorHex }} /><CardTitle>{c.colorName}</CardTitle><Button onClick={() => setColor(c)}>选择</Button></Card>)}</div><Card className="mt-6"><Select value={weight} onChange={(e) => setWeight(Number(e.target.value))}>{color.weights.map((w) => <option key={w} value={w}>{w}g</option>)}</Select><Input className="mt-3" type="number" min={1} max={99} value={qty} onChange={(e) => setQty(Number(e.target.value))} /><Button className="mt-3" onClick={() => setCart([...cart, { colorName: color.colorName, colorHex: color.colorHex, weightGrams: weight, quantity: qty }])}>加入采购车</Button><Table><THead><TR><TH>颜色</TH><TH>规格</TH><TH>数量</TH></TR></THead><TBody>{cart.map((i, idx) => <TR key={idx}><TD>{i.colorName}</TD><TD>{i.weightGrams}g</TD><TD>{i.quantity}</TD></TR>)}</TBody></Table><Button onClick={() => { try { createPaintOrder(requireUser(user?.id), cart); toast.success("采购需求已发送到后台"); } catch (e) { toast.error(e instanceof Error ? e.message : "提交失败"); } }}>发送采购需求</Button></Card></Page>;
}
