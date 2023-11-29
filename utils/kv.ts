/// <reference lib="deno.unstable" />

export const kv = await Deno.openKv("./state.db");
