export function autoReply(body: string) {
  if (body.includes("充值")) return "充值问题已记录，客服会协助确认支付状态。";
  if (body.includes("采购")) return "采购需求已记录，后台会尽快处理。";
  return "收到，我们会尽快回复。";
}
