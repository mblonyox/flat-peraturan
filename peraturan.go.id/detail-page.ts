import { Element, getPageHtml, HTMLDocument } from "~/utils/dom.ts";

function parseTable(el: Element) {
  const data: Record<string, string> = {};
  for (const rowEl of el.getElementsByTagName("tr")) {
    const key = rowEl.firstElementChild?.innerText;
    const value = rowEl.lastElementChild?.innerText.replaceAll("\n", " ");
    if (key && value) data[key] = value;
  }
  return data;
}

function getDokumenUrls(html: HTMLDocument) {
  const el = html.getElementsByClassName("share-buttons").find((el) =>
    el.innerText === "Dokumen Peraturan :"
  );
  return el?.getElementsByTagName("a").map((a) =>
    a.getAttribute("href") ?? ""
  ) ?? [];
}

function getData(html: HTMLDocument) {
  const data: Record<string, unknown> = {};
  const tableW2 = html.getElementById("w2");
  if (tableW2) {
    Object.assign(data, parseTable(tableW2));
  }
  const tableW3 = html.getElementById("w3");
  if (tableW3) {
    Object.assign(data, parseTable(tableW3));
  }
  return data;
}

function saveData(data: unknown) {
  return Deno.writeTextFile("./data.txt", JSON.stringify(data), {
    append: true,
    create: true,
  });
}

export async function processDetailPage(url: URL) {
  const html = await getPageHtml(url);
  if (!html) return;
  const data = getData(html);
  data.pdfs = getDokumenUrls(html);
  saveData;
}
