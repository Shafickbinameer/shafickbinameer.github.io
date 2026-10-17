/*
 * Menu: the bottom-right menu, run like a small terminal program.
 *
 * - Status line: pointing at an item retypes the path and a short hint
 * - Leaving the page types "cd <page>" while the page fades out
 * - One ">" marker slides to the item you point at. j / k (or the arrow
 *   keys once you're in the menu) move it, Enter opens
 * - Text progress bar for how far down the page you are
 * - Folds into a small tab while you scroll down; scrolling up, hovering
 *   or tabbing into it opens it again
 * - Shortcuts: 1-4 open a page, t switches the theme, m mutes typing sounds
 *   ("/" for the terminal lives in terminal.js)
 *
 * Everything here is extra: without JavaScript the plain menu still works.
 */
(function () {
  /* --- Edit these ------------------------------------------------------- */

  const HINTS = {
    home: "start here",
    about: "who I am",
    projects: "things I've built",
    contact: "say hello",
    404: "page not found",
  };

  /* ---------------------------------------------------------------------- */

  const menu = document.querySelector(".menu");
  if (!menu) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const page = document.body.dataset.page;
  const links = Array.from(menu.querySelectorAll("a[data-key]"));

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  /* --- Shortcuts and keyboard navigation -------------------------------- */

  let items = [];

  function step(direction) {
    if (!items.length) return;
    const from = items.indexOf(document.activeElement);
    const start = from === -1 ? Math.max(0, items.findIndex((i) => i.getAttribute("aria-current"))) : from;
    const next = from === -1 && direction > 0 ? items[start] : items[(start + direction + items.length) % items.length];
    openMenu();
    next.focus({ preventScroll: true });
  }

  window.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest("input, textarea, select, [contenteditable]")) return;
    if (document.querySelector("dialog[open]")) return;

    const key = event.key.toLowerCase();
    const inMenu = menu.contains(document.activeElement);

    if (key === "j" || (inMenu && key === "arrowdown")) {
      event.preventDefault();
      step(1);
      return;
    }
    if (key === "k" || (inMenu && key === "arrowup")) {
      event.preventDefault();
      step(-1);
      return;
    }
    if (key === "escape" && inMenu) {
      document.activeElement.blur();
      return;
    }

    if (event.repeat) return;

    if (key === "t" && window.Theme) {
      window.Theme.toggle();
      return;
    }

    if (key === "m" && window.Sound) {
      window.Sound.toggle();
      return;
    }

    const link = links.find((a) => a.dataset.key === key);
    if (link && link.getAttribute("aria-current") !== "page") {
      if (window.Transition) window.Transition.go(link.href);
      else window.location.href = link.href;
    }
  });

  /* --- Typing in the status line ---------------------------------------- */

  // Changes an element's text like someone editing it: backspaces to the
  // part both texts share, then types the rest. `fresh` clears it first.
  function retype(el, text, { fresh = false } = {}) {
    cancelAnimationFrame(el.typeFrame);
    if (reduceMotion.matches) {
      el.textContent = text;
      return;
    }

    const from = fresh ? "" : el.textContent;
    if (fresh) el.textContent = "";

    let keep = 0;
    while (keep < from.length && keep < text.length && from[keep] === text[keep]) keep++;

    const frames = [];
    let time = 0;
    for (let i = from.length - 1; i >= keep; i--) frames.push({ at: (time += 7), text: from.slice(0, i), key: "back" });
    for (let i = keep + 1; i <= text.length; i++) frames.push({ at: (time += 14), text: text.slice(0, i), key: "key" });
    if (!frames.length) return;

    let start = null;
    let shown = -1;
    function frame(now) {
      if (start === null) start = now;
      const before = shown;
      while (shown + 1 < frames.length && frames[shown + 1].at <= now - start) shown++;
      if (shown !== before) {
        el.textContent = frames[shown].text;
        if (window.Sound) window.Sound.key(frames[shown].key);
      }
      if (shown < frames.length - 1) el.typeFrame = requestAnimationFrame(frame);
    }
    el.typeFrame = requestAnimationFrame(frame);
  }

  /* --- Build the extras ------------------------------------------------- */

  function init() {
    const inner = menu.querySelector(".menu__inner");
    const pathEl = menu.querySelector(".menu__path");
    const list = menu.querySelector(".menu__list");
    const herePath = pathEl.textContent.trim();
    const homePath = "~/shafick"; // fixed: deep pages show a shortened path

    items = links;
    items.forEach((item) => {
      item.dataset.name = item.querySelector(".menu__label").textContent.trim();
    });
    const current = links.find((a) => a.hasAttribute("aria-current")) || null;
    const pathFor = (name) => (name === "home" ? homePath : `${homePath}/${name}`);
    const phone = window.matchMedia("(max-width: 700px)");

    // "# hint" comment: sits just outside the menu's left edge, on the row
    // of the item you point at (outside the fold, so it isn't clipped)
    const hintEl = make("p", "menu__hint");
    hintEl.setAttribute("aria-hidden", "true");
    menu.append(hintEl);

    // Items + the sliding marker
    const body = make("div", "menu__body");
    const marker = make("span", "menu__marker no-anim", ">");
    marker.setAttribute("aria-hidden", "true");
    list.before(body);
    body.append(list, marker);

    // Progress bar
    const meta = make("div", "menu__meta");
    meta.setAttribute("aria-hidden", "true");

    const progress = make("div", "menu__progress");
    const bar = make("span", "menu__bar");
    const cells = Array.from({ length: 10 }, () => bar.appendChild(make("i", "menu__cell")));
    const pct = make("span", "menu__pct", "0%");
    progress.append(make("span", "", "["), bar, make("span", "", "]"), pct);
    meta.append(progress);

    // Fold: everything above collapses; the peek tab replaces it
    const fold = make("div", "menu__fold");
    const foldInner = make("div", "menu__fold-inner");
    foldInner.append(pathEl, body, meta);
    fold.append(foldInner);

    const peekWrap = make("div", "menu__peek-wrap");
    const peek = make("button", "menu__peek");
    peek.type = "button";
    peek.setAttribute("aria-label", "Open menu");
    peek.setAttribute("aria-expanded", "true");
    const peekPct = make("span", "menu__peek-pct");
    const peekLabel = make("span", "menu__peek-label");
    peekLabel.append(make("span", "menu__peek-mark", ">_"), " menu");
    peek.append(peekLabel, peekPct);
    peekWrap.append(peek);

    inner.append(fold, peekWrap);
    menu.classList.add("is-enhanced");

    /* Selection: hover or keyboard focus ------------------------------- */

    let hovered = null;
    let leaving = false;
    let shownItem; // what the status line currently describes

    const focusedItem = () => items.find((i) => i === document.activeElement && i.matches(":focus-visible")) || null;

    function placeMarker(item) {
      marker.classList.toggle("is-hidden", !item);
      if (item) marker.style.transform = `translateY(${item.offsetTop}px)`;
    }

    // Shows the hint beside an item (or hides it when item is null)
    function showHint(item, text, { command = false } = {}) {
      if (!item) {
        hintEl.classList.remove("is-shown");
        return;
      }
      const y = item.getBoundingClientRect().top - menu.getBoundingClientRect().top;
      hintEl.style.setProperty("--hint-y", `${Math.round(y)}px`);
      retype(hintEl, text, { fresh: !hintEl.classList.contains("is-shown") || command });
      hintEl.classList.add("is-shown");
      hintEl.classList.toggle("is-command", command);
    }

    function refresh() {
      if (leaving) return;
      const active = hovered || focusedItem();
      placeMarker(active || current);
      items.forEach((i) => i.classList.toggle("is-selected", i === active));

      if (active === shownItem) return;
      shownItem = active;
      retype(pathEl, active ? pathFor(active.dataset.name) : herePath);
      showHint(active, active && `# ${HINTS[active.dataset.name] || ""}`);
    }

    items.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        hovered = item;
        refresh();
      });
      item.addEventListener("focus", refresh);
      item.addEventListener("blur", () => setTimeout(refresh));
    });
    menu.addEventListener("mouseleave", () => {
      hovered = null;
      refresh();
    });

    shownItem = null;
    placeMarker(current);
    requestAnimationFrame(() => requestAnimationFrame(() => marker.classList.remove("no-anim")));

    /* "cd <page>" while the page fades out ---------------------------- */

    window.addEventListener("site:leave", (event) => {
      // Phones: a folded menu stays folded, rather than popping open just
      // before the next page loads (and loads with it folded again)
      if (phone.matches && menu.classList.contains("is-collapsed")) return;
      const href = new URL(event.detail.href, window.location.href).href;
      const link = links.find((a) => a.href === href);
      const name = link ? link.dataset.name : href.split("/").pop();
      leaving = true;
      openMenu();
      if (link) placeMarker(link);
      retype(pathEl, link ? pathFor(name) : herePath);
      showHint(link || current, `$ cd ${name === "home" ? "~" : name}`, { command: true });
    });

    // Back button can restore this page from memory mid-"cd": reset it
    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      leaving = false;
      hovered = null;
      shownItem = undefined;
      refresh();
    });

    /* Progress bar ----------------------------------------------------- */

    function updateProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const scrollable = max > 40;
      const amount = scrollable ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const filled = Math.round(amount * cells.length);
      const label = `${Math.round(amount * 100)}%`;

      menu.classList.toggle("has-progress", scrollable);
      menu.style.setProperty("--progress", amount.toFixed(3));
      cells.forEach((cell, i) => cell.classList.toggle("is-on", i < filled));
      pct.textContent = label;
      peekPct.textContent = scrollable ? label : "";
    }

    /* Folding ---------------------------------------------------------- */

    // Big screens: folds while you scroll down. Phones: always folded, until
    // you tap the tab; tapping outside, scrolling or Esc folds it again.
    let lastY = window.scrollY;
    let scrollingDown = false;
    let pointerInside = false;
    let tapOpen = false;

    function updateFold() {
      const focusInside = menu.contains(document.activeElement) && document.activeElement !== peek;
      const collapse = phone.matches
        ? !tapOpen && !leaving
        : scrollingDown && !pointerInside && !focusInside && !leaving;
      menu.classList.toggle("is-collapsed", collapse);
      peek.setAttribute("aria-expanded", String(!collapse));
      // Don't leave keyboard focus on a link that's now hidden
      if (collapse && focusInside) peek.focus({ preventScroll: true });
    }

    openMenu = function () {
      scrollingDown = false;
      tapOpen = true;
      updateFold();
    };

    function closeOnPhone() {
      if (!phone.matches || !tapOpen) return;
      tapOpen = false;
      updateFold();
    }

    document.addEventListener("pointerdown", (event) => {
      if (!menu.contains(event.target)) closeOnPhone();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeOnPhone();
    });
    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      tapOpen = false;
      updateFold();
    });

    // Start folded on phones without playing the fold animation
    menu.classList.add("no-fold-anim");
    updateFold();
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.remove("no-fold-anim")));

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const y = window.scrollY;
          if (y > lastY + 4 && y > 120) scrollingDown = true;
          else if (y < lastY - 4 || y <= 120) scrollingDown = false;
          if (phone.matches && Math.abs(y - lastY) > 4) tapOpen = false;
          lastY = y;
          updateProgress();
          updateFold();
        });
      },
      { passive: true }
    );

    menu.addEventListener("mouseenter", () => {
      pointerInside = true;
      updateFold();
    });
    menu.addEventListener("mouseleave", () => {
      pointerInside = false;
      updateFold();
    });
    menu.addEventListener("focusin", updateFold);
    menu.addEventListener("focusout", () => setTimeout(updateFold));

    peek.addEventListener("click", () => {
      openMenu();
      (current || items[0]).focus({ preventScroll: true });
    });

    window.addEventListener("resize", () => {
      updateProgress();
      updateFold();
      placeMarker(hovered || focusedItem() || current);
    });

    // Fonts change line heights, so re-place the marker once they're in
    if (document.fonts) document.fonts.ready.then(() => placeMarker(hovered || focusedItem() || current));

    updateProgress();
  }

  let openMenu = function () {};

  // Run after every deferred script, so the terminal button exists
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
