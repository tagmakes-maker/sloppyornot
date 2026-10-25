// gituationship.com serves site/gituationship/ from the Sloppy or Not Pages site,
// which redeploys on every merge to main. The pitch slides live at /slides.
const ORIGIN = "https://sloppyornot.com";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname === "/slides" ? "/pitch/gituationship" : "/gituationship" + url.pathname;
    const res = await fetch(ORIGIN + path + url.search, { cf: { cacheTtl: 60 } });
    if (res.status !== 404) return res;
    // Pages answers a miss with the Sloppy or Not 404, so swap in ours
    const page = await fetch(ORIGIN + "/gituationship/404", { cf: { cacheTtl: 60 } });
    return new Response(page.body, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
