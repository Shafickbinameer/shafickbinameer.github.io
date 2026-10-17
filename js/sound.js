/*
 * Sound: soft keyboard clicks for anything that types, made with the
 * Web Audio API (no audio files).
 *
 * Browsers only allow sound after the visitor clicks or presses a key, so
 * the intro on a fresh visit stays silent; sound starts with the first
 * interaction and carries on to the pages you open from there.
 *
 * On by default; the speaker icon, the "m" key or the terminal's
 * "sound on/off" command switches it, and the choice is remembered.
 */
(function () {
  const STORAGE_KEY = "ms-sound";
  const DEFAULT_ON = true;
  const VOLUME = 0.28;
  const SOFTEN = 2400; // cuts everything above this pitch (Hz); lower = softer
  const ATTACK = 0.006; // seconds to reach full loudness; longer = less snappy

  // How each kind of key sounds: click pitch, loudness, length, low thump.
  // Low pitches and short tails keep it a soft "thock" rather than a click.
  const KEYS = {
    key: { freq: 1400, gain: 0.16, decay: 0.035, thump: 120 },
    space: { freq: 900, gain: 0.18, decay: 0.05, thump: 90 },
    enter: { freq: 1100, gain: 0.2, decay: 0.055, thump: 80 },
    back: { freq: 1700, gain: 0.12, decay: 0.03, thump: 135 },
  };

  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-sound-toggle]");

  let enabled = DEFAULT_ON;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) enabled = saved === "on";
  } catch (e) {
    /* storage blocked: use the default */
  }

  let ctx = null;
  let master = null;
  let noise = null;
  let lastClick = 0;

  // Creates (or wakes) the audio engine. Only works once the browser
  // allows sound, i.e. after a click or key press on this page.
  function setup() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    ctx = new AudioCtx();
    // Everything passes through a gentle low-pass filter to take the edge off
    const soften = ctx.createBiquadFilter();
    soften.type = "lowpass";
    soften.frequency.value = SOFTEN;
    soften.Q.value = 0.5;
    soften.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(soften);

    // A quarter second of white noise; each click plays a random slice
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.25), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  function key(kind = "key") {
    if (!enabled || !ctx || ctx.state !== "running") return;

    const now = ctx.currentTime;
    // Very fast typing would turn into a buzz: keep clicks at least 30ms apart
    if (now - lastClick < 0.03) return;
    lastClick = now;

    const sound = KEYS[kind] || KEYS.key;
    const vary = 0.85 + Math.random() * 0.3;

    // The click: a slice of noise through a band-pass filter
    const click = ctx.createBufferSource();
    click.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = sound.freq * vary;
    filter.Q.value = 0.8;
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(sound.gain * vary, now + ATTACK);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + sound.decay);
    click.connect(filter).connect(clickGain).connect(master);
    click.start(now, Math.random() * 0.2, sound.decay + 0.01);

    // The thump: the key hitting the bottom, a short falling low tone
    const thump = ctx.createOscillator();
    thump.frequency.setValueAtTime(sound.thump * vary, now);
    thump.frequency.exponentialRampToValueAtTime(sound.thump * 0.5, now + 0.03);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.0001, now);
    thumpGain.gain.exponentialRampToValueAtTime(sound.gain * 0.4 * vary, now + ATTACK);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    thump.connect(thumpGain).connect(master);
    thump.start(now);
    thump.stop(now + 0.05);
  }

  function render() {
    root.dataset.sound = enabled ? "on" : "off";
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute("aria-label", enabled ? "Sound on. Mute typing sounds" : "Sound off. Turn on typing sounds");
      button.dataset.tip = enabled ? "mute  m" : "sound on  m";
    });
  }

  function set(on) {
    enabled = on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch (e) {
      /* storage blocked: the choice lasts until the page changes */
    }
    render();
    if (on) {
      setup();
      // A single click so you hear that it's on
      setTimeout(() => key("enter"), 30);
    }
  }

  const toggle = () => set(!enabled);

  buttons.forEach((button) => button.addEventListener("click", toggle));

  // Wake the audio on the first click or key press (capture phase, so it's
  // ready before whatever that key press starts typing)
  ["pointerdown", "keydown"].forEach((type) =>
    window.addEventListener(type, () => enabled && setup(), { capture: true })
  );

  // Start right away when the browser already allows sound: after you've
  // clicked a link on this site, the next page counts as interacted with
  const allowed =
    (navigator.userActivation && navigator.userActivation.hasBeenActive) ||
    (navigator.getAutoplayPolicy && navigator.getAutoplayPolicy("audiocontext") === "allowed");
  if (enabled && allowed) setup();

  render();

  window.Sound = {
    key,
    set,
    toggle,
    get enabled() {
      return enabled;
    },
  };
})();
