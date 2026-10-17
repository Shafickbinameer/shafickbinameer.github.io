/*
 * Terminal: a small working command line, opened from the menu or with "/".
 *
 * Edit PROFILE below with your real details; the email/social commands
 * print from it. Add a command by adding an entry to `commands`.
 */
(function () {
  const PROFILE = {
    name: "Mohammed Shafick",
    role: "software developer",
    email: "shafickbinameer@gmail.com",
    social: [
      { name: "github", label: "github.com/Shafickbinameer", href: "https://github.com/Shafickbinameer" },
      { name: "linkedin", label: "linkedin.com/in/mohammed-shafick", href: "https://www.linkedin.com/in/mohammed-shafick" },
      { name: "npm", label: "npmjs.com/~shafick", href: "https://www.npmjs.com/~shafick" },
    ],
  };

  const HISTORY_KEY = "ms-term-history";
  // Pages in a subfolder (projects/…) set data-root="../" and their own path
  const { page, root = "", path } = document.body.dataset;
  const cwd = path ? path.replace(/^~\/shafick/, "~") : page === "home" ? "~" : `~/${page}`;

  const PAGES = {
    home: `${root}index.html`,
    about: `${root}about.html`,
    projects: `${root}projects.html`,
    contact: `${root}contact.html`,
  };

  // Projects that have their own page (projects/<name>.html). When you add
  // a project page, add it here too so "ls projects" and "open <name>" know it.
  const PROJECTS = {
    "report-studio": { href: `${root}projects/report-studio.html`, desc: "npm package for paginated reports" },
    "bmh-learning-portfolio": { href: `${root}projects/bmh-learning-portfolio.html`, desc: "surgical training e-portfolio" },
  };

  const promptText = `${cwd} $`;

  /* --- Build the window ------------------------------------------------- */

  const dialog = document.createElement("dialog");
  dialog.className = "term";
  dialog.setAttribute("aria-label", "Terminal");
  dialog.innerHTML = `
    <div class="term__bar">
      <span>guest@shafick</span>
      <button class="term__close" type="button" aria-label="Close terminal">esc</button>
    </div>
    <div class="term__body">
      <div class="term__log" role="log" aria-live="polite"></div>
      <form class="term__form">
        <label class="term__prompt" for="term-input"></label>
        <input class="term__input" id="term-input" type="text" autocomplete="off"
          autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" />
      </form>
    </div>`;
  document.body.append(dialog);

  const body = dialog.querySelector(".term__body");
  const log = dialog.querySelector(".term__log");
  const form = dialog.querySelector(".term__form");
  const input = dialog.querySelector(".term__input");
  dialog.querySelector(".term__prompt").textContent = promptText;

  // The top-right icon stays hidden without JavaScript, since it needs it
  const openButton = document.querySelector("[data-terminal-open]");
  if (openButton) {
    openButton.hidden = false;
    openButton.addEventListener("click", open);
  }

  /* --- Output ----------------------------------------------------------- */

  // parts: strings, { text, cls } for styled text, { text, href } for links
  function print(parts, cls) {
    const row = document.createElement("div");
    row.className = cls ? `term__line ${cls}` : "term__line";

    for (const part of [].concat(parts)) {
      if (typeof part === "string") {
        row.append(part);
      } else if (part.href) {
        const a = document.createElement("a");
        a.href = part.href;
        a.textContent = part.text;
        // Web links open in a new tab. Not mailto: it hands off to the mail
        // app, and a new tab can leave the browser stuck on a blank page.
        if (/^https?:/.test(part.href)) {
          a.target = "_blank";
          a.rel = "noopener";
        }
        row.append(a);
      } else {
        const span = document.createElement("span");
        span.className = part.cls;
        span.textContent = part.text;
        row.append(span);
      }
    }

    log.append(row);
    body.scrollTop = body.scrollHeight;
  }

  const cmd = (text) => ({ text, cls: "term__cmd" });

  /* --- Commands --------------------------------------------------------- */

  const pageNames = Object.keys(PAGES);
  const projectNames = Object.keys(PROJECTS);
  const withoutHash = (href) => new URL(href, window.location.href).href.split("#")[0];

  // Turns what was typed into a page or project:
  // "about", "report-studio", "projects/report-studio", "~/projects/report-studio/", "report-studio.html"
  function find(typed) {
    const name = typed.replace(/^~?\/?(shafick\/)?/, "").replace(/\/$/, "").replace(/\.html$/, "");
    if (PAGES[name]) return { label: name, href: PAGES[name] };
    const project = name.replace(/^projects\//, "");
    if (PROJECTS[project]) return { label: `projects/${project}`, href: PROJECTS[project].href };
    return null;
  }

  function goTo({ label, href }) {
    if (withoutHash(href) === withoutHash(window.location.href)) {
      print(`You're already on ${label}.`, "term__muted");
      return;
    }
    print(`opening ${label}...`, "term__muted");
    setTimeout(() => {
      close();
      if (window.Transition) window.Transition.go(href);
      else window.location.href = href;
    }, 300);
  }

  const commands = {
    help: {
      desc: "show this list",
      run() {
        Object.entries(commands)
          .filter(([, c]) => c.desc)
          .forEach(([name, c]) => print([cmd(name.padEnd(9)), c.desc]));
        print(["Page and project names work on their own too: ", cmd([...pageNames, ...projectNames].join(", "))], "term__muted");
        print("Tab completes a command. Up and down arrows bring back earlier ones.", "term__muted");
      },
    },
    whoami: {
      desc: "who I am",
      run() {
        print(`${PROFILE.name}, ${PROFILE.role}.`);
      },
    },
    ls: {
      desc: "list the pages; ls projects lists projects",
      args: ["projects"],
      run([what]) {
        if (what && what.replace(/\/$/, "") === "projects") {
          projectNames.forEach((name) =>
            print([{ text: name, href: PROJECTS[name].href }, { text: `  ${PROJECTS[name].desc}`, cls: "term__muted" }])
          );
          print(["Open one with ", cmd(`open ${projectNames[0]}`), "."], "term__muted");
          return;
        }
        const parts = [];
        pageNames.forEach((name, i) => {
          if (i) parts.push("   ");
          parts.push({ text: name, href: PAGES[name] });
        });
        print(parts);
      },
    },
    open: {
      desc: "open a page or project: open portfolio",
      args: [...pageNames, ...projectNames],
      run([name]) {
        if (!name) return print(["Which one? Try ", cmd("open about"), " or ", cmd(`open ${projectNames[0]}`), "."], "term__error");
        const target = find(name);
        if (!target) {
          return print(
            [`Nothing called "${name}". Pages: `, cmd(pageNames.join(", ")), ". Projects: ", cmd(projectNames.join(", ")), "."],
            "term__error"
          );
        }
        goTo(target);
      },
    },
    cd: {
      args: [...pageNames, ...projectNames, "..", "~"],
      run([name = "~"]) {
        if (name === "~" || name === "/") return goTo({ label: "home", href: PAGES.home });
        // One level up: from a project to the project list, otherwise home
        if (name === "..") {
          return page === "project"
            ? goTo({ label: "projects", href: PAGES.projects })
            : goTo({ label: "home", href: PAGES.home });
        }
        commands.open.run([name]);
      },
    },
    theme: {
      desc: "switch theme, or set it: theme dark",
      args: ["light", "dark"],
      run([choice]) {
        if (choice && choice !== "light" && choice !== "dark") {
          return print(["Use ", cmd("theme light"), " or ", cmd("theme dark"), "."], "term__error");
        }
        if (choice) window.Theme.set(choice);
        else window.Theme.toggle();
        print(`Theme is now ${choice || window.Theme.current()}.`);
      },
    },
    sound: {
      desc: "typing sounds on or off: sound off",
      args: ["on", "off"],
      run([choice]) {
        if (!window.Sound) return print("Sound isn't available in this browser.", "term__error");
        if (choice && choice !== "on" && choice !== "off") {
          return print(["Use ", cmd("sound on"), " or ", cmd("sound off"), "."], "term__error");
        }
        if (choice) window.Sound.set(choice === "on");
        else window.Sound.toggle();
        print(`Typing sounds are ${window.Sound.enabled ? "on" : "off"}.`);
      },
    },
    email: {
      desc: "my email address",
      run() {
        print({ text: PROFILE.email, href: `mailto:${PROFILE.email}` });
      },
    },
    social: {
      desc: "where else to find me",
      run() {
        PROFILE.social.forEach((s) => print([cmd(s.name.padEnd(9)), { text: s.label, href: s.href }]));
      },
    },
    history: {
      desc: "commands you've typed",
      run() {
        if (!history.length) return print("Nothing yet.", "term__muted");
        history.forEach((entry, i) => print([{ text: String(i + 1).padStart(3) + "  ", cls: "term__muted" }, entry]));
      },
    },
    date: {
      desc: "today's date and time",
      run() {
        print(new Date().toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" }));
      },
    },
    echo: {
      desc: "repeat what you type",
      run(args) {
        print(args.join(" "));
      },
    },
    clear: {
      desc: "clear the screen (or Ctrl+L)",
      run() {
        log.replaceChildren();
      },
    },
    exit: {
      desc: "close the terminal (or Esc)",
      run() {
        close();
      },
    },
    sudo: {
      run() {
        print("Nice try. There's no root access on this site.", "term__error");
      },
    },
  };

  // Typing a page or project name on its own opens it (unless a command
  // already has that name)
  [...pageNames, ...projectNames].forEach((name) => {
    if (!commands[name]) commands[name] = { run: () => goTo(find(name)) };
  });

  function run(raw) {
    print([{ text: `${promptText} `, cls: "term__prompt" }, raw]);
    const [name, ...args] = raw.trim().split(/\s+/);
    if (!name) return;

    const command = commands[name.toLowerCase()];
    if (!command) {
      print([`command not found: ${name}. Type `, cmd("help"), " to see what you can do."], "term__error");
      return;
    }
    command.run(args.map((a) => a.toLowerCase()), raw);
  }

  /* --- History ---------------------------------------------------------- */

  let history = [];
  try {
    history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || [];
  } catch (e) {
    history = [];
  }
  let historyIndex = history.length;

  function remember(entry) {
    if (entry && entry !== history[history.length - 1]) history.push(entry);
    history = history.slice(-50);
    historyIndex = history.length;
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      /* storage blocked: history lasts until the page changes */
    }
  }

  /* --- Tab completion --------------------------------------------------- */

  function complete() {
    const words = input.value.trimStart().split(" ");
    const last = words[words.length - 1].toLowerCase();
    const pool =
      words.length === 1
        ? Object.keys(commands).filter((name) => name !== "sudo")
        : (commands[words[0].toLowerCase()] || {}).args || [];

    const matches = pool.filter((option) => option.startsWith(last));
    if (matches.length === 1) {
      words[words.length - 1] = matches[0];
      input.value = words.join(" ") + " ";
    } else if (matches.length > 1) {
      print(matches.join("   "), "term__muted");
    }
  }

  /* --- Input ------------------------------------------------------------ */

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw = input.value;
    input.value = "";
    remember(raw.trim());
    run(raw);
  });

  input.addEventListener("keydown", (event) => {
    if (window.Sound && !event.ctrlKey && !event.metaKey) {
      if (event.key === "Enter") window.Sound.key("enter");
      else if (event.key === "Backspace" || event.key === "Delete") window.Sound.key("back");
      else if (event.key === " ") window.Sound.key("space");
      else if (event.key.length === 1) window.Sound.key("key");
    }

    if (event.key === "Tab") {
      event.preventDefault();
      complete();
    } else if (event.key === "ArrowUp" && history.length) {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex];
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || "";
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      commands.clear.run();
    }
  });

  // Clicking anywhere in the window puts you back at the prompt,
  // unless you're selecting text or clicking a link
  body.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    if (String(window.getSelection())) return;
    input.focus();
  });

  // Following a page link from the output closes the window first
  log.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link && !link.target && !link.href.startsWith("mailto:")) close();
  });

  /* --- Open / close ----------------------------------------------------- */

  let greeted = false;

  function open() {
    if (dialog.open) return;
    dialog.classList.remove("is-closing");
    dialog.showModal();
    if (!greeted) {
      greeted = true;
      print(["Welcome. Type ", cmd("help"), " to see what you can do, or press Esc to close."], "term__muted");
    }
    input.focus();
  }

  function close() {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    dialog.classList.add("is-closing");
    dialog.addEventListener(
      "animationend",
      () => {
        dialog.classList.remove("is-closing");
        dialog.close();
      },
      { once: true }
    );
  }

  // Esc: play the closing animation instead of vanishing
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  dialog.querySelector(".term__close").addEventListener("click", close);

  // Clicking the dimmed area outside the window closes it
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "/" || dialog.open) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest("input, textarea, select, [contenteditable]")) return;
    event.preventDefault();
    open();
  });

  window.Terminal = { open, close, run };
})();
