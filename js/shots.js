/*
 * Shots: draws each project screenshot in, top to bottom, the first time it
 * scrolls into view (the animation itself is in components.css, under
 * "Screenshots"). With reduced motion on, or without JS, images just show.
 *
 * Also runs tabbed screenshots: a figure with data-shot-tabs has tab buttons
 * in its title bar, each showing one picture (role="tabpanel") and one
 * caption (data-shot-caption). Switching tabs draws the new picture in again.
 */
(function () {
  const root = document.documentElement;
  const body = document.body;
  const screens = document.querySelectorAll(".shot__screen");

  /* --- Tabbed screenshots ------------------------------------------------ */

  // Plays the draw-in again on a screen, if the animation is running at all
  function redraw(screen) {
    if (!root.classList.contains("shots-anim") || !screen.classList.contains("is-shown")) return;
    screen.classList.remove("is-shown");
    void screen.offsetWidth; // restart the CSS animation
    screen.classList.add("is-shown");
  }

  document.querySelectorAll("[data-shot-tabs]").forEach((figure) => {
    const screen = figure.querySelector(".shot__screen");
    const tabs = Array.from(figure.querySelectorAll('[role="tab"]'));
    const name = figure.querySelector("[data-shot-tab-name]");
    const captions = figure.querySelectorAll("[data-shot-caption]");

    function select(tab, focus) {
      tabs.forEach((other) => {
        const on = other === tab;
        other.setAttribute("aria-selected", on);
        other.tabIndex = on ? 0 : -1;
        document.getElementById(other.getAttribute("aria-controls")).hidden = !on;
      });
      const label = tab.textContent.trim();
      if (name) name.textContent = label;
      captions.forEach((caption) => (caption.hidden = caption.dataset.shotCaption !== label));
      if (focus) tab.focus();
      redraw(screen);
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => {
        if (tab.getAttribute("aria-selected") !== "true") select(tab);
      });
      // Left / right (and Home / End) move between tabs, as tabs usually do
      tab.addEventListener("keydown", (event) => {
        const last = tabs.length - 1;
        const to = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[event.key];
        if (to === undefined) return;
        event.preventDefault();
        select(tabs[to], true);
      });
    });

    // Fetch the hidden pictures once the page has loaded, so a tab shows
    // its picture straight away instead of drawing in an empty frame
    window.addEventListener("load", () => {
      figure.querySelectorAll('[role="tabpanel"][hidden] img').forEach((img) => {
        img.loading = "eager";
      });
    });
  });

  /* --- Draw-in animation ------------------------------------------------- */

  if (!screens.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  root.classList.add("shots-anim");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-shown");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.25 }
  );

  function start() {
    screens.forEach((screen) => observer.observe(screen));
  }

  // Wait until the page has faded in (main.js adds .is-ready), so the first
  // screenshot isn't drawn while it's still invisible
  if (body.classList.contains("is-ready")) {
    start();
  } else {
    const ready = new MutationObserver(() => {
      if (!body.classList.contains("is-ready")) return;
      ready.disconnect();
      start();
    });
    ready.observe(body, { attributes: true, attributeFilter: ["class"] });
  }
})();
