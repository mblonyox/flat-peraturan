/// <reference lib="deno.unstable" />

await Deno.mkdir("./_temp_", { recursive: true });
export const kv = await Deno.openKv("./_temp_/state.db");
