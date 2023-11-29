import { Element, getPageHtml } from "~/utils/dom.ts";
import { stringify } from "qs";
import { sendMessage } from "~/peraturan.go.id/message.ts";

export const rootUrl = "https://peraturan.go.id/cariglobal";

function getOptionValues(parent: Element) {
  return parent.getElementsByTagName("option").map((el) =>
    el.getAttribute("value")
  ).filter((v): v is string => !!v);
}

export async function start() {
  const html = await getPageHtml(rootUrl);
  const jenisSelectEl = html?.getElementById(
    "peraturansearch-jenis_peraturan_id",
  );
  if (!jenisSelectEl) throw new Error("No Jenis Peraturan select input.");
  for (const jenis_peraturan_id of getOptionValues(jenisSelectEl)) {
    const html = await getPageHtml(
      "https://peraturan.go.id/pemrakarsa?id=" + jenis_peraturan_id,
    );
    const pemrakarsa_ids = html?.documentElement
      ? getOptionValues(html.documentElement)
      : [""];
    for (const pemrakarsa_id of pemrakarsa_ids) {
      const params = {
        PeraturanSearch: {
          jenis_peraturan_id,
          pemrakarsa_id,
          tahun: "",
          tentang: "",
        },
      };
      const url = new URL("https://peraturan.go.id/cari?" + stringify(params));
      await sendMessage({
        type: "index",
        urlString: url.toString(),
      });
    }
  }
}
