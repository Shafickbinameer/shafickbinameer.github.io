/*
 * Theme: switches between the light (cream) and dark paper themes.
 * The saved choice is applied early by the small script in each page's <head>.
 */
(function () {
  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-theme-toggle]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const current = () => (root.dataset.theme === "dark" ? "dark" : "light");

  function render() {
    const theme = current();
    const other = theme === "dark" ? "light" : "dark";
    buttons.forEach((button) => {
      button.setAttribute("aria-label", `Theme: ${theme}. Switch to ${other} theme`);
      button.dataset.tip = `${other} theme  t`;
    });
  }

  function apply(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("ms-theme", theme);
    } catch (e) {
      /* storage blocked: the theme still changes for this page */
    }
    render();
  }

  function set(theme) {
    if (theme === current()) return;
    // Cross-fade the whole page where the browser supports it
    if (document.startViewTransition && !reduceMotion.matches) {
      const transition = document.startViewTransition(() => apply(theme));
      // If the browser skips the fade, the theme still changes; ignore it
      transition.ready.catch(() => {});
    } else {
      apply(theme);
    }
  }

  function toggle() {
    set(current() === "dark" ? "light" : "dark");
  }

  buttons.forEach((button) => button.addEventListener("click", toggle));
  render();

  window.Theme = { toggle, set, current };
})();
