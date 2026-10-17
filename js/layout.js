/*
 * Layout: the parts every page shares, written once here.
 *
 * - The small name in the top-left corner (not on home, where the big
 *   name is the page)
 * - The top-right icons: terminal, sound, theme
 * - The menu
 * - The boot screen, on the first page of a visit (second part of this file)
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

/*
 * Boot screen: once per visit (on whichever page you open first), a short
 * terminal boot log covers the page while it loads, then fades away.
 *
 * Pressing a key or tapping during it also wakes the typing sounds, which
 * browsers keep silent until the visitor's first interaction (sound.js),
 * so the intro can type in with sound. main.js waits for Boot.done before
 * typing the page in. Skipped with reduced motion on, or if storage is
 * blocked (it couldn't remember it had already run).
 */
(function () {
  const STORAGE_KEY = "ms-booted";
  const LINES = ["fonts", "paper grain", "keyboard", "~/projects"];
  const MAX_WAIT = 3000; // never hold the page longer than this for loading

  const root = document.documentElement;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let firstVisit = false;
  try {
    firstVisit = !sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch (e) {
    /* storage blocked: no boot screen */
  }
  if (!firstVisit || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.Boot = { done: Promise.resolve() };
    return;
  }

  // Decorative: screen readers go straight to the page underneath
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="boot" aria-hidden="true">
      <div class="boot__log">
        <p><span class="boot__prompt">~/shafick $</span> <span class="boot__cmd"></span></p>
        <ul class="boot__lines" role="list"></ul>
        <p class="menu__progress"><span>[</span><span class="menu__bar">${"<i class=\"menu__cell\"></i>".repeat(10)}</span><span>]</span><span class="menu__pct">0%</span></p>
        <p class="boot__hint">press any key for sound</p>
      </div>
    </div>`
  );
  root.classList.add("booting");

  const boot = document.querySelector(".boot");
  const cmd = boot.querySelector(".boot__cmd");
  const list = boot.querySelector(".boot__lines");
  const cells = boot.querySelectorAll(".menu__cell");
  const pct = boot.querySelector(".menu__pct");
  const hint = boot.querySelector(".boot__hint");
  const started = Date.now();
  let hurry = false;

  const sound = (kind) => window.Sound && window.Sound.key(kind);
  const pause = (ms) => (hurry ? Promise.resolve() : wait(ms));

  function progress(amount) {
    const filled = Math.round(amount * cells.length);
    cells.forEach((cell, i) => cell.classList.toggle("is-on", i < filled));
    pct.textContent = `${Math.round(amount * 100)}%`;
  }

  function line(html) {
    const li = document.createElement("li");
    li.innerHTML = html;
    list.append(li);
    sound("enter");
  }

  // A key or tap speeds things along. sound.js has already woken the audio
  // by now (its listener is on window, which runs first); stopping the key
  // here keeps it from also working as a shortcut (m, t, 1-4, /)
  function onInput(event) {
    hurry = true;
    if (event.type === "keydown") event.stopPropagation();
    hint.textContent = window.Sound && window.Sound.enabled ? "sound on" : "sound off (m to turn on)";
    hint.classList.add("is-answered");
  }
  document.addEventListener("keydown", onInput, true);
  document.addEventListener("pointerdown", onInput, true);

  const loaded = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });

  async function run() {
    await pause(250);
    for (const ch of "./start") {
      cmd.textContent += ch;
      sound("key");
      await pause(55);
    }
    await pause(200);

    for (let i = 0; i < LINES.length; i++) {
      line(`<span class="boot__ok">[ ok ]</span> ${LINES[i]}`);
      progress((i + 1) / (LINES.length + 1));
      await pause(170);
    }

    // Hold for the page itself (images, fonts), but never too long
    await Promise.race([loaded, wait(Math.max(0, MAX_WAIT - (Date.now() - started)))]);
    progress(1);
    line(`<span class="boot__ok">ready.</span>`);
    await pause(hurry ? 150 : 450);

    document.removeEventListener("keydown", onInput, true);
    document.removeEventListener("pointerdown", onInput, true);
    root.classList.remove("booting");
    boot.classList.add("is-done");
    boot.addEventListener("transitionend", () => boot.remove(), { once: true });
  }

  // The page starts typing in as the boot screen begins to fade
  window.Boot = { done: run().then(() => wait(150)) };
})();
