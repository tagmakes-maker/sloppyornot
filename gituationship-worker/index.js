// gituationship.com serves site/gituationship/ from the Sloppy or Not Pages site,
// which redeploys on every merge to main. The pitch slides live at /slides.
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname === "/slides" ? "/pitch/gituationship" : "/gituationship" + url.pathname;
    return fetch("https://sloppyornot.com" + path + url.search, { cf: { cacheTtl: 60 } });
  },
};
