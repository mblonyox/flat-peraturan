import { DOMParser } from "deno_dom/deno-dom-wasm.ts";
export { Element, HTMLDocument } from "deno_dom/deno-dom-wasm.ts";

const domParser = new DOMParser();

export async function getPageHtml(url: URL | string) {
  const response = await fetch(url);
  if (!response.ok) return null;
  const text = await response.text();
  return domParser.parseFromString(text, "text/html");
}
