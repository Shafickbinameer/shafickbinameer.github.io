/*
 * Transition: fades the page out before going to another page on this site,
 * so a page change looks like one motion instead of a blink. The next page
 * fades itself in (see "Page transitions" in components.css).
 */
(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  // A little longer than the page-out animation in CSS, so the menu has
  // time to type "cd <page>" before the next page loads
  const LEAVE_MS = 340;
  let leaving = false;

  const withoutHash = (url) => url.href.split("#")[0];

  function go(href) {
    if (leaving) return;
    if (reduceMotion.matches) {
      window.location.href = href;
      return;
    }
    leaving = true;
    root.classList.add("is-leaving");
    window.dispatchEvent(new CustomEvent("site:leave", { detail: { href } }));
    setTimeout(() => {
      window.location.href = href;
    }, LEAVE_MS);
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.protocol !== window.location.protocol) return;

    const here = withoutHash(window.location);
    // Jump links on the same page (like "Skip to content") behave normally
    if (withoutHash(url) === here && url.hash) return;

    event.preventDefault();
    // Clicking the page you're already on does nothing
    if (withoutHash(url) === here) return;
    go(url.href);
  });

  // Coming back with the browser's back button can restore the faded-out
  // page from memory, so undo the fade.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      leaving = false;
      root.classList.remove("is-leaving");
    }
  });

  window.Transition = { go };
})();
