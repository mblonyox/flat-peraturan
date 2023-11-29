import { Element, getPageHtml, HTMLDocument } from "~/utils/dom.ts";
import { sendMessage } from "~/peraturan.go.id/message.ts";
import { kv } from "~/utils/kv.ts";

function getFirstPageUrl(url: URL) {
  const searchParams = new URLSearchParams(url.searchParams);
  searchParams.delete("page");
  return new URL(`${url.pathname}?${searchParams.toString()}`, url);
}

function getTotalCount(html: HTMLDocument) {
  const el = html.querySelector(".filters_listing");
  if (!el) throw new Error("No Filters Listing element found.");
  const text = /dari ([\d\.]+) Peraturan/.exec(el.innerText)?.at(1);
  if (!text) return 0;
  return parseInt(text.replace(".", ""));
}

function getDetailHrefs(html: HTMLDocument) {
  const nodes = html.querySelectorAll("a[title='lihat detail']");
  const hrefs = Array.from(nodes).map((n) =>
    (n as Element).getAttribute("href")
  );
  return hrefs.filter((v): v is string => !!v);
}

function getNextPageHref(html: HTMLDocument) {
  const el = html.querySelector("ul.pagination li.next a");
  if (!el) return null;
  return el.getAttribute("href");
}

async function getTotal(url: URL) {
  const entry = await kv.get<number>([
    "url",
    getFirstPageUrl(url).toString(),
    "total",
  ]);
  return entry.value;
}

async function setTotal(url: URL, total: number) {
  await kv.set(["total", url.toString()], total);
}

export async function processIndexPage(url: URL) {
  const html = await getPageHtml(url);
  if (!html) return;
  const total = getTotalCount(html);
  const prevTotal = await getTotal(url);
  if (total !== prevTotal) {
    const hrefs = getDetailHrefs(html);
    for (const href of hrefs) {
      await sendMessage({
        type: "detail",
        urlString: new URL(href, url).toString(),
      });
    }
    const nextHref = getNextPageHref(html);
    if (nextHref) {
      await sendMessage({
        type: "index",
        urlString: new URL(nextHref, url).toString(),
      });
    } else {
      await setTotal(url, total);
    }
  }
}
