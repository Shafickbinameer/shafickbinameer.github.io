/*
 * Layout: the parts every page shares, written once here.
 *
 * - The small name in the top-left corner (not on home, where the big
 *   name is the page)
 * - The top-right icons: terminal, sound, theme
 * - The menu
 *
 * Each page loads this as a plain script (not deferred) at the end of
 * <body>, so these parts are in place before the page is first drawn
 * and before the other scripts look for them:
 *
 *   <script src="js/layout.js"></script>
 *
 * To add a page: add it to PAGES below, then give the new HTML file a
 * matching <body data-page="..."> and that script tag.
 *
 * Pages in a subfolder (like projects/portfolio.html) also set:
 *   data-root="../"           how to get back to the top folder
 *   data-section="projects"   which menu item to keep marked
 *   data-path="~/shafick/projects/portfolio"   the path the menu shows
 */
(function () {
  const PAGES = [
    { name: "home", href: "index.html", key: "1" },
    { name: "about", href: "about.html", key: "2" },
    { name: "projects", href: "projects.html", key: "3" },
    { name: "contact", href: "contact.html", key: "4" },
  ];
  const NAME = "Mohammed Shafick";
  const HOME_PATH = "~/shafick";

  const { page, section, root = "", path: customPath } = document.body.dataset;
  const fullPath = customPath || (page === "home" ? HOME_PATH : `${HOME_PATH}/${page}`);
  // The menu is narrow: deep paths drop the "shafick" part so the end
  // (the page you're on) stays visible, e.g. ~/projects/portfolio
  const path = fullPath.length > 24 ? fullPath.replace(HOME_PATH, "~") : fullPath;

  const siteName = `<a class="site-name" href="${root}index.html">${NAME}</a>`;

  const tools = `
    <div class="tools">
      <button class="tool" type="button" data-terminal-open data-tip="terminal  /" aria-label="Open terminal" aria-haspopup="dialog" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true">
          <rect x="3" y="4.5" width="18" height="15" />
          <path d="M7 9.5l3 2.5-3 2.5M12.5 15H17" />
        </svg>
      </button>
      <button class="tool" type="button" data-sound-toggle data-tip="mute  m" aria-label="Typing sounds" aria-pressed="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
          <path class="tool__sound-on" d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" />
          <path class="tool__sound-off" d="M16 9.5l5 5M21 9.5l-5 5" />
        </svg>
      </button>
      <button class="tool" type="button" data-theme-toggle data-tip="theme  t" aria-label="Switch theme">
        <svg class="tool__theme-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6" />
          <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
        </svg>
      </button>
    </div>`;

  // The page you're on gets aria-current="page"; on a page inside a section
  // (a single project), that section's item gets aria-current="true"
  const current = (p) => (p.name === page ? ' aria-current="page"' : p.name === section ? ' aria-current="true"' : "");

  const links = PAGES.map(
    (p) =>
      `<li><a class="menu__link" href="${root}${p.href}" data-key="${p.key}"${current(p)}>` +
      `<span class="menu__label">${p.name}</span><kbd class="menu__key">${p.key}</kbd></a></li>`
  ).join("\n          ");

  const menu = `
    <nav class="menu" aria-label="Main">
      <div class="menu__inner">
        <p class="menu__path" aria-hidden="true">${path}</p>
        <ul class="menu__list" role="list">
          ${links}
        </ul>
      </div>
    </nav>`;

  // The strip behind the corner name and icons on phones (see .topbar in
  // components.css). Not on home, which has no corner name and doesn't scroll.
  const topbar = `<div class="topbar" aria-hidden="true"></div>`;

  // The corner name goes first in the page (after "Skip to content"), so
  // keyboard users reach it in the same order they see it
  if (page !== "home") {
    const skip = document.querySelector(".skip-link");
    if (skip) skip.insertAdjacentHTML("afterend", topbar + siteName);
    else document.body.insertAdjacentHTML("afterbegin", topbar + siteName);
  }

  // Icons and menu go where this script sits
  document.currentScript.insertAdjacentHTML("beforebegin", tools + menu);
})();
