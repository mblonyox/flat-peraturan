import {
  readCSV,
  readTXT,
  writeCSV,
} from "https://deno.land/x/flat@0.0.15/mod.ts";
import { parse } from "https://deno.land/x/xml@2.1.1/mod.ts";
import { node } from "https://deno.land/x/xml@2.1.1/utils/types.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

interface UrlTag {
  loc: string;
  lastmod?: string;
  priority?: number;
}

interface Data {
  [key: string]: unknown;
  url: string;
}

const input = Deno.args[0];
const output = "peraturan.go.id/data.csv";
const limit = 1000;

console.log("Parsing sitemap.xml:");
const size = await Deno.open(input).then((file) => file.stat()).then(
  (fileInfo) => fileInfo.size,
);
const sitemap = parse(await readTXT(input), {
  progress: (bytes) => printProgress(bytes, size),
});

const datas = await readCSV(output).catch((
  _reason,
) => (<unknown> [] as Record<string, unknown>[]));
console.log("\nLoad saved datas.");

const urlset = sitemap.urlset as node;
const urls = (urlset.url as UrlTag[]).map((url) => url.loc);
const newUrls = urls.filter((url) => !datas.some((data) => data.url === url));
console.log(`\n${newUrls.length} new url(s) found.`);

const processed = newUrls.slice(0, limit);
const total = processed.length;
console.log(`\nProcessing ${processed.length} of new url(s):`);
for (const [current, url] of processed.entries()) {
  printProgress(current, total);
  if (datas.some((data) => url === data.url)) continue;
  try {
    const data = await getData(url);
    datas.push(data);
  } catch (error) {
    console.error(error);
  }
}

await writeCSV(output, datas);
console.log("\nWrite saved datas.");

function printProgress(current: number, total: number) {
  Deno.stdout.writeSync(
    new TextEncoder().encode(
      `\r${Math.ceil(100 * current / total)}% => ${current + 1} / ${total}`,
    ),
  );
}

async function getData(url: string): Promise<Data> {
  const res = await fetch(url);
  const html = await res.text();
  const data = <Data> { url };
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) throw new Error("Invalid HTML Document.");
  const tableW2 = doc.getElementById("w2");
  if (!tableW2) {
    throw new Error('Cannot get the table with id "w2" element in document.');
  }
  for (const rowEl of tableW2.getElementsByTagName("tr")) {
    const key = rowEl.firstElementChild?.innerText;
    const value = rowEl.lastElementChild?.innerText.replaceAll("\n", " ");
    if (key) data[key] = value;
  }
  const tableW3 = doc.getElementById("w3");
  for (const rowEl of tableW3?.getElementsByTagName("tr") ?? []) {
    const key = rowEl.firstElementChild?.innerText;
    const value = rowEl.lastElementChild?.innerText.replaceAll("\n", " ");
    if (key) data[key] = value;
  }
  return data;
}
