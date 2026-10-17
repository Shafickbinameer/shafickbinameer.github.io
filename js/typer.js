/*
 * Typer: types text into an element letter by letter.
 *
 * The full text is split into one <span> per letter up front, so the layout
 * is final before typing starts and nothing jumps around. Screen readers get
 * the plain text from a visually hidden copy.
 */
(function () {
  let skipped = false;
  const pending = new Set();

  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.setAttribute("aria-hidden", "true");

  // A delay that ends early as soon as skip() is called.
  function wait(ms) {
    if (skipped || ms <= 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        pending.delete(done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      pending.add(done);
    });
  }

  function skip() {
    skipped = true;
    pending.forEach((done) => done());
  }

  function prepare(el) {
    if (el.typerChars) return el.typerChars;

    const text = el.textContent.replace(/\s+/g, " ").trim();

    const readable = document.createElement("span");
    readable.className = "sr-only";
    readable.textContent = text;

    const visible = document.createElement("span");
    visible.className = "typer";
    visible.setAttribute("aria-hidden", "true");

    el.typerChars = Array.from(text, (char) => {
      const span = document.createElement("span");
      span.className = "typer__ch";
      span.textContent = char;
      visible.append(span);
      return span;
    });

    el.replaceChildren(readable, visible);
    el.classList.add("is-ready");
    return el.typerChars;
  }

  // Move the cursor to the start or end of an element's text.
  function park(el, at = "end") {
    const visible = prepare(el)[0].parentNode;
    if (at === "start") visible.prepend(cursor);
    else visible.append(cursor);
  }

  function finish(el) {
    prepare(el).forEach((char) => char.classList.add("is-on"));
  }

  // When each letter should appear (ms from the start). The rhythm is
  // steady, with a slightly longer beat after spaces and punctuation.
  function schedule(chars, speed) {
    let time = 0;
    return chars.map((char) => {
      const at = time;
      const c = char.textContent;
      const beat = c === " " ? 1.6 : /[.,!?:;]/.test(c) ? 3 : 1;
      time += speed * beat * (0.9 + Math.random() * 0.2);
      return at;
    });
  }

  async function type(el, { speed = 40, delay = 0 } = {}) {
    const chars = prepare(el);
    park(el, "start");
    await wait(delay);

    const times = schedule(chars, speed);
    cursor.classList.add("is-typing");

    // Driven by animation frames rather than timers, so letters land in
    // step with the screen refresh instead of drifting between frames.
    await new Promise((resolve) => {
      let start = null;
      let shown = 0;

      function frame(now) {
        if (start === null) start = now;
        const elapsed = now - start;

        const before = shown;
        while (shown < chars.length && (skipped || times[shown] <= elapsed)) {
          chars[shown].classList.add("is-on");
          shown++;
        }
        if (shown !== before) {
          chars[shown - 1].after(cursor);
          if (!skipped && window.Sound) window.Sound.key(chars[shown - 1].textContent === " " ? "space" : "key");
        }

        if (shown < chars.length) requestAnimationFrame(frame);
        else resolve();
      }

      requestAnimationFrame(frame);
    });

    park(el, "end");
    cursor.classList.remove("is-typing");
  }

  window.Typer = {
    prepare,
    type,
    finish,
    park,
    wait,
    skip,
    get skipped() {
      return skipped;
    },
  };
})();
