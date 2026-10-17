/*
 * Copy: clicking a link with data-copy="..." also copies that text, and the
 * [data-copied] note after it says "# copied" for a moment.
 *
 * Used on the email link: mailto opens the visitor's mail app, but on a
 * computer with none set up the click does nothing, so the address is
 * copied too and can be pasted wherever they write email.
 */
(function () {
  document.querySelectorAll("a[data-copy]").forEach((link) => {
    const note = link.parentElement.querySelector("[data-copied]");
    let timer = null;

    link.addEventListener("click", () => {
      // No preventDefault: the mailto still opens the mail app if there is one
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(link.dataset.copy).then(
        () => {
          if (!note) return;
          note.textContent = "# copied";
          note.classList.add("is-shown");
          clearTimeout(timer);
          timer = setTimeout(() => note.classList.remove("is-shown"), 2200);
        },
        () => {
          /* clipboard blocked: the mailto still runs */
        }
      );
    });
  });
})();
