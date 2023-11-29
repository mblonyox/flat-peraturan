import { kv } from "~/utils/kv.ts";
import { getPendingMessages, Message } from "~/peraturan.go.id/message.ts";
import { processIndexPage } from "~/peraturan.go.id/index-page.ts";
import { processDetailPage } from "~/peraturan.go.id/detail-page.ts";
import { start } from "~/peraturan.go.id/root-page.ts";

async function handleMessage(message: Message) {
  try {
    if (message.type === "index") {
      await processIndexPage(new URL(message.urlString));
    }
    if (message.type === "detail") {
      await processDetailPage(new URL(message.urlString));
    }
  } catch (error) {
    console.error({ error, message });
    console.log(message.urlString);
  }
}

if (import.meta.main) {
  let pending = 0;
  const messages = getPendingMessages();
  for await (const { value, key } of messages) {
    pending++;
    console.log(`[Processing pending queue #${pending}] `);
    await handleMessage(value);
    await kv.delete(key);
  }
  if (!pending && Deno.env.get("INPUT_START")) {
    console.log("[Start processing.]");
    start();
  }
  kv.listenQueue((v) => handleMessage(v as Message));
}
