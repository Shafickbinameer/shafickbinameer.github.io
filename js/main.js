/*
 * Main: runs the typing intro for the current page.
 *
 * Home: cursor blinks, name types, name slides up, the lines below type,
 * then links and menu fade in. The full intro plays once per visit; after
 * that (or with reduced motion on) everything shows immediately.
 * Any key press or click skips to the end.
 */
(function () {
  const Typer = window.Typer;
  const body = document.body;
  const isHome = body.dataset.page === "home";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const typed = Array.from(document.querySelectorAll("[data-type]"));
  const reveals = document.querySelectorAll("[data-reveal]");
  const hero = document.querySelector(".hero");

  // Tell the CSS how many letters the big name has, so it can size the
  // name to fit one line whatever its length (read before typing splits it)
  const heroName = document.querySelector(".hero__name");
  if (heroName) heroName.style.setProperty("--name-chars", heroName.textContent.trim().length);

  typed.forEach(Typer.prepare);

  function introSeen() {
    try {
      return sessionStorage.getItem("ms-intro") === "1";
    } catch (e) {
      return false;
    }
  }

  function rememberIntro() {
    try {
      sessionStorage.setItem("ms-intro", "1");
    } catch (e) {
      /* storage blocked: the intro will just play again */
    }
  }

  function revealAll() {
    reveals.forEach((el) => el.classList.add("is-revealed"));
    body.classList.add("is-ready");
  }

  function showInstantly() {
    document.documentElement.classList.add("no-anim");
    typed.forEach(Typer.finish);
    if (hero) hero.classList.add("is-open");
    revealAll();
    if (typed.length) Typer.park(typed[typed.length - 1]);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => document.documentElement.classList.remove("no-anim"))
    );
  }

  // Start typing only once the web font is in, so letters don't change
  // shape halfway through. Gives up after a moment on slow connections.
  function fontsReady() {
    if (!document.fonts) return Promise.resolve();
    return Promise.race([document.fonts.ready, Typer.wait(1200)]);
  }

  let slide = null;

  // Lays out the lines under the name in one go (they're still invisible),
  // then moves the name from its old spot to the new one with a transform.
  // Moving with a transform runs on the GPU instead of re-laying out the
  // page every frame, which is what made the old version stutter.
  function openHero() {
    const inner = hero.querySelector(".hero__inner");
    const before = inner.getBoundingClientRect().top;
    hero.classList.add("is-open");
    const after = inner.getBoundingClientRect().top;
    if (Typer.skipped) return;

    slide = inner.animate(
      [{ transform: `translateY(${before - after}px)` }, { transform: "translateY(0)" }],
      { duration: 1000, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
  }

  async function playHome() {
    const [name, ...lines] = typed;

    Typer.park(name, "start");
    await fontsReady();

    await Typer.type(name, { speed: 80, delay: 350 });
    await Typer.wait(300);

    openHero();
    // Start typing while the name is still settling, so it flows on
    await Typer.wait(550);

    for (const line of lines) {
      await Typer.type(line, { speed: 11 });
      await Typer.wait(140);
    }

    revealAll();
    rememberIntro();
  }

  async function playPage() {
    const [title, ...rest] = typed;
    await fontsReady();
    if (title) await Typer.type(title, { speed: 45, delay: 150 });
    revealAll();
    for (const el of rest) await Typer.type(el, { speed: 18 });
  }

  function skip() {
    Typer.skip();
    if (slide) slide.finish();
  }

  if (reduceMotion || (isHome && introSeen())) {
    showInstantly();
    return;
  }

  window.addEventListener("keydown", skip, { once: true });
  window.addEventListener("pointerdown", skip, { once: true });

  (isHome ? playHome() : playPage()).catch(showInstantly);
})();
