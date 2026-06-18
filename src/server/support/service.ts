import { autoReply } from "./autoReply";
import { newId, nowIso, state } from "@/server/dataStore";

export function sendSupportMessage(input: { userId?: string | null; body: string }) {
  if (!input.body.trim()) throw new Error("消息不能为空");
  const at = nowIso();
  let conversation = state.supportConversations.find((item) => (input.userId ? item.userId === input.userId : item.guestName === "访客") && item.status === "open");
  if (!conversation) {
    conversation = { id: newId("conv"), userId: input.userId ?? null, guestName: input.userId ? null : "访客", status: "open", createdAt: at, updatedAt: at };
    state.supportConversations.push(conversation);
  }
  const userMessage = { id: newId("msg"), conversationId: conversation.id, sender: "user" as const, body: input.body, createdAt: at };
  const assistantMessage = { id: newId("msg"), conversationId: conversation.id, sender: "assistant" as const, body: autoReply(input.body), createdAt: nowIso() };
  state.supportMessages.push(userMessage, assistantMessage);
  return { conversation, messages: [userMessage, assistantMessage] };
}
