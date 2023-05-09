import { readCSV, readTXT, writeCSV } from "flat";
import { parse } from "xml/mod.ts";
import { node } from "xml/utils/types.ts";
import { DOMParser } from "deno_dom/deno-dom-wasm.ts";

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
const invalid = "peraturan.go.id/invalid_urls.txt";
const limit = 1000;

console.log("Parsing sitemap.xml:");
const size = await Deno.open(input).then((file) => file.stat()).then(
  (fileInfo) => fileInfo.size,
);
const sitemap = parse(await readTXT(input), {
  progress: (bytes) => printProgress(bytes, size),
});
console.log("\nSitemap parsing completed.");

const datas = await readCSV(output).catch((
  _reason,
) => (<unknown> [] as Record<string, unknown>[]));

const invalidUrls = await Deno.readTextFile(invalid).then((txt) =>
  txt.trim().split("\n")
).catch((_) => [] as string[]);

const urlset = sitemap.urlset as node;
const urls = (urlset.url as UrlTag[]).map((url) => url.loc);
const newUrls = urls.filter((url) =>
  !datas.some((data) => data.url === url) && !invalidUrls.includes(url)
);
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
    invalidUrls.push(url);
    console.error(error);
  }
}
console.log("Processing new url(s) completed.");

await Deno.writeTextFile(invalid, invalidUrls.join("\n"));
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
