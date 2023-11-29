import { kv } from "~/utils/kv.ts";

const backupKey = ["undelivered"];

export type Message = { type: "index" | "detail"; urlString: string };

export function getPendingMessages() {
  return kv.list<Message>({ prefix: backupKey });
}

export function sendMessage(message: Message) {
  console.log(`[Sent Message to queue: ${message.type} ${message.urlString}]`);
  return kv.enqueue(message, {
    keysIfUndelivered: [[...backupKey, Date.now()]],
  });
}
