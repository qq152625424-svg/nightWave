/* =========================================================
   夜波 NIGHTWAVE — interactions
   Vanilla JS. No dependencies, no build step.
   ========================================================= */

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const BASE_TITLE = document.title;

  /* ---------------------------------------------------------
     Programme data
     --------------------------------------------------------- */

  const SHOWS = {
    urban: {
      title: "城市潜行",
      en: "URBAN DIVE",
      host: "主持 · 末末",
      time: "22:00 — 00:00",
      ep: "EP. 108",
      dockMeta: "末末 · 22:00 — 00:00",
      notes: [73.42, 146.83, 220.0, 293.66],
      cutoff: 760,
    },
    coast: {
      title: "海岸线以下",
      en: "BELOW THE COASTLINE",
      host: "主持 · 林深",
      time: "00:00 — 02:00",
      ep: "EP. 041",
      dockMeta: "林深 · 00:00 — 02:00",
      notes: [55.0, 110.0, 164.81, 246.94],
      cutoff: 520,
    },
    insomnia: {
      title: "失眠者俱乐部",
      en: "INSOMNIACS CLUB",
      host: "主持 · 阿岚",
      time: "02:00 — 04:00",
      ep: "EP. 076",
      dockMeta: "阿岚 · 02:00 — 04:00",
      notes: [61.74, 123.47, 185.0, 246.94],
      cutoff: 430,
    },
    dawn: {
      title: "清晨之前",
      en: "BEFORE DAWN",
      host: "主持 · 周野",
      time: "04:00 — 06:00",
      ep: "EP. 023",
      dockMeta: "周野 · 04:00 — 06:00",
      notes: [43.65, 87.31, 174.61, 261.63],
      cutoff: 1280,
    },
    tide: {
      title: "潮汐来信",
      en: "TIDES, LETTERS & OTHER NOISES",
      host: "声音档案 · 潮汐来信",
      time: "FIELD RECORDING · 38′24″",
      ep: "ARCHIVE 014",
      dockMeta: "声音档案 · 38′24″",
      notes: [55.0, 110.0, 164.81, 246.94],
      cutoff: 480,
    },
    rehearsal: {
      title: "凌晨三点的排练室",
      en: "3 AM REHEARSAL",
      host: "声音档案 · 排练室",
      time: "STUDIO SESSION · 21′09″",
      ep: "ARCHIVE 031",
      dockMeta: "声音档案 · 21′09″",
      notes: [82.41, 164.81, 246.94, 329.63],
      cutoff: 980,
    },
    vinyl: {
      title: "黑胶慢转",
      en: "SLOW SPIN",
      host: "声音档案 · 黑胶慢转",
      time: "SELECTED VINYL · 45′00″",
      ep: "ARCHIVE 007",
      dockMeta: "声音档案 · 45′00″",
      notes: [65.41, 130.81, 196.0, 261.63],
      cutoff: 620,
    },
  };

  let currentShowId = "coast";
  let isPlaying = false;

  /* ---------------------------------------------------------
     DOM
     --------------------------------------------------------- */

  const body = document.body;
  const header = document.querySelector("[data-header]");
  const progressBar = document.querySelector("[data-progress]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const siteNav = document.getElementById("site-nav");
  const menuLabel = menuToggle?.querySelector(".sr-only");
  const stationClock = document.querySelector("[data-station-time]");
  const audioStatus = document.querySelector("[data-audio-status]");
  const playerDock = document.getElementById("player-dock");
  const nowFields = {
    title: document.querySelector("[data-now-title]"),
    en: document.querySelector("[data-now-en]"),
    host: document.querySelector("[data-now-host]"),
    time: document.querySelector("[data-now-time]"),
    ep: document.querySelector("[data-now-ep]"),
  };
  const dockFields = {
    title: document.querySelector("[data-dock-title]"),
    meta: document.querySelector("[data-dock-meta]"),
  };
  const dockOpeners = document.querySelectorAll("[data-show]");
  const programmeRows = [...document.querySelectorAll(".show-row[data-show]")];

  /* ---------------------------------------------------------
     Station clock (Shanghai)
     --------------------------------------------------------- */

  const clockFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function updateClock() {
    if (!stationClock) return;
    stationClock.textContent = clockFormatter.format(new Date());
  }

  updateClock();
  window.setInterval(updateClock, 1000);

  /* ---------------------------------------------------------
     Header / scroll progress
     --------------------------------------------------------- */

  let scrollTicking = false;

  function updateScrollUI() {
    scrollTicking = false;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight;
    const viewport = window.innerHeight;
    const scrollable = docHeight - viewport;

    header?.classList.toggle("is-scrolled", scrollTop > 24);

    if (progressBar) {
      const progress = scrollable > 0 ? Math.min(scrollTop / scrollable, 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollUI);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateScrollUI();

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */

  function setMenu(open) {
    if (!menuToggle) return;
    body.classList.toggle("nav-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    if (menuLabel) menuLabel.textContent = open ? "关闭菜单" : "打开菜单";

    if (open) {
      window.setTimeout(() => {
        siteNav?.querySelector("a")?.focus({ preventScroll: true });
      }, 220);
    }
  }

  menuToggle?.addEventListener("click", () => {
    setMenu(!body.classList.contains("nav-open"));
  });

  siteNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("nav-open")) {
      setMenu(false);
      menuToggle?.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900 && body.classList.contains("nav-open")) {
      setMenu(false);
    }
  });

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */

  const revealItems = [...document.querySelectorAll(".reveal")];

  if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ---------------------------------------------------------
     Back to top
     --------------------------------------------------------- */

  document.querySelector("[data-back-to-top]")?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });
  });

  /* ---------------------------------------------------------
     Web Audio — a small, warm late-night drone
     --------------------------------------------------------- */

  const audio = {
    ctx: null,
    supported:
      typeof window.AudioContext !== "undefined" ||
      typeof window.webkitAudioContext !== "undefined",
    master: null,
    filter: null,
    voices: [],
    airGain: null,
    suspendTimer: 0,
  };

  let volume = 0.6;

  function makeNoiseBuffer(ctx) {
    const seconds = 6;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;

    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }

    return buffer;
  }

  function buildAudioGraph() {
    if (!audio.supported || audio.ctx) return audio.ctx;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();

    const master = ctx.createGain();
    master.gain.value = 0.0001;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 22;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.25;
    compressor.release.value = 0.8;

    master.connect(compressor);
    compressor.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = SHOWS[currentShowId].cutoff;
    filter.Q.value = 0.65;
    filter.connect(master);

    const voiceLevels = [0.055, 0.032, 0.018, 0.009];
    const voiceTypes = ["sine", "triangle", "sine", "sine"];

    const voices = SHOWS[currentShowId].notes.map((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = voiceTypes[index];
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index % 2 === 0 ? -3 : 3;
      gain.gain.value = voiceLevels[index];

      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start();

      return oscillator;
    });

    // A small, slow wobble keeps the drone from sounding too synthetic.
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.065;
    lfoDepth.gain.value = 4;
    lfo.connect(lfoDepth);
    voices.forEach((voice) => lfoDepth.connect(voice.detune));
    lfo.start();

    const noise = ctx.createBufferSource();
    noise.buffer = makeNoiseBuffer(ctx);
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 430;
    noiseFilter.Q.value = 0.45;

    const airGain = ctx.createGain();
    airGain.gain.value = 0.042;

    noise.connect(noiseFilter);
    noiseFilter.connect(airGain);
    airGain.connect(master);
    noise.start();

    // A very quiet top layer, like a carrier signal just out of range.
    const air = ctx.createBufferSource();
    air.buffer = noise.buffer;
    air.loop = true;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 2400;

    const airTopGain = ctx.createGain();
    airTopGain.gain.value = 0.005;

    air.connect(highpass);
    highpass.connect(airTopGain);
    airTopGain.connect(master);
    air.start();

    audio.ctx = ctx;
    audio.master = master;
    audio.filter = filter;
    audio.voices = voices;
    audio.airGain = airGain;

    return ctx;
  }

  function fadeMaster(target, duration) {
    const ctx = audio.ctx;
    if (!ctx || !audio.master) return;

    const now = ctx.currentTime;
    const gain = audio.master.gain;
    const current = Math.max(gain.value, 0.0001);
    const safeTarget = Math.max(target, 0.0001);

    gain.cancelScheduledValues(now);
    gain.setValueAtTime(current, now);
    gain.exponentialRampToValueAtTime(safeTarget, now + duration);
  }

  function applyShowTexture(showId) {
    if (!audio.ctx) return;

    const show = SHOWS[showId];
    const now = audio.ctx.currentTime;

    audio.voices.forEach((voice, index) => {
      voice.frequency.setTargetAtTime(show.notes[index], now, 0.32);
    });

    audio.filter?.frequency.setTargetAtTime(show.cutoff, now, 0.4);
  }

  function updatePlayUI(playing) {
    body.classList.toggle("is-playing", playing);

    document.querySelectorAll("[data-play]").forEach((button) => {
      button.setAttribute("aria-pressed", String(playing));

      if (button.classList.contains("record")) {
        button.setAttribute(
          "aria-label",
          playing
            ? "夜波 103.7 FM · SHANGHAI · 暂停直播"
            : "夜波 103.7 FM · SHANGHAI · 播放直播"
        );
      } else if (button.classList.contains("listen-mini")) {
        button.setAttribute("aria-label", playing ? "暂停直播" : "收听直播");
      } else {
        button.setAttribute("aria-label", playing ? "暂停直播" : "播放直播");
      }
    });

    document.querySelectorAll("[data-play-label]").forEach((label) => {
      label.textContent = playing ? "暂停直播" : "收听直播";
    });

    const miniLabel = document.querySelector(".listen-mini__label");
    if (miniLabel) miniLabel.textContent = playing ? "暂停" : "收听";

    if (audioStatus) {
      audioStatus.textContent = playing
        ? `正在播放：${SHOWS[currentShowId].title}`
        : "直播已暂停";
    }

    document.title = playing
      ? `▶ ${SHOWS[currentShowId].title} · 夜波 NIGHTWAVE`
      : BASE_TITLE;
  }

  async function startPlayback() {
    openPlayerDock();

    if (!audio.supported) {
      if (audioStatus) {
        audioStatus.textContent = "当前浏览器不支持音频播放。";
      }
      return;
    }

    const ctx = buildAudioGraph();

    if (!ctx) return;

    window.clearTimeout(audio.suspendTimer);

    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
    } catch (error) {
      if (audioStatus) {
        audioStatus.textContent = "无法启动音频，请再试一次。";
      }
      return;
    }

    applyShowTexture(currentShowId);
    fadeMaster(volume * 0.9, 1.1);
    isPlaying = true;
    updatePlayUI(true);
  }

  function pausePlayback() {
    if (!audio.ctx) {
      isPlaying = false;
      updatePlayUI(false);
      return;
    }

    fadeMaster(0.0001, 0.55);
    isPlaying = false;
    updatePlayUI(false);

    window.clearTimeout(audio.suspendTimer);
    audio.suspendTimer = window.setTimeout(() => {
      if (!isPlaying && audio.ctx?.state === "running") {
        audio.ctx.suspend().catch(() => {});
      }
    }, 900);
  }

  function togglePlayback() {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }

  document.querySelectorAll("[data-play]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      togglePlayback();
    });
  });

  /* ---------------------------------------------------------
     Player dock
     --------------------------------------------------------- */

  function openPlayerDock() {
    if (!playerDock) return;
    window.clearTimeout(playerDock.hideTimer);
    playerDock.inert = false;
    playerDock.classList.add("is-open");
    playerDock.setAttribute("aria-hidden", "false");
  }

  function closePlayerDock() {
    if (!playerDock) return;
    pausePlayback();
    playerDock.classList.remove("is-open");
    playerDock.setAttribute("aria-hidden", "true");
    playerDock.hideTimer = window.setTimeout(() => {
      if (!playerDock.classList.contains("is-open")) {
        playerDock.inert = true;
      }
    }, 600);
  }

  document
    .querySelector("[data-close-player]")
    ?.addEventListener("click", closePlayerDock);

  /* ---------------------------------------------------------
     Programme selection
     --------------------------------------------------------- */

  function moveLiveBadge(activeRow) {
    programmeRows.forEach((row) => {
      row.querySelector(".show-row__live")?.remove();
    });

    if (!activeRow) return;

    const badge = document.createElement("span");
    badge.className = "show-row__live";
    badge.innerHTML = '<span class="dot"></span>ON AIR';
    activeRow.querySelector(".show-row__action")?.prepend(badge);
  }

  function selectShow(showId) {
    const show = SHOWS[showId];
    if (!show) return;

    currentShowId = showId;

    if (nowFields.title) nowFields.title.textContent = show.title;
    if (nowFields.en) nowFields.en.textContent = show.en;
    if (nowFields.host) nowFields.host.textContent = show.host;
    if (nowFields.time) nowFields.time.textContent = show.time;
    if (nowFields.ep) nowFields.ep.textContent = show.ep;
    if (dockFields.title) dockFields.title.textContent = show.title;
    if (dockFields.meta) dockFields.meta.textContent = show.dockMeta;

    let activeRow = null;

    programmeRows.forEach((row) => {
      const isActive = row.dataset.show === showId;
      row.classList.toggle("is-current", isActive);
      if (isActive) {
        row.setAttribute("aria-current", "true");
        activeRow = row;
      } else {
        row.removeAttribute("aria-current");
      }
    });

    moveLiveBadge(activeRow);
    applyShowTexture(showId);

    if (isPlaying) updatePlayUI(true);
  }

  dockOpeners.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      selectShow(trigger.dataset.show);
      openPlayerDock();
      if (!isPlaying) startPlayback();
    });
  });

  /* ---------------------------------------------------------
     Volume
     --------------------------------------------------------- */

  const volumeSlider = document.querySelector("[data-volume]");
  const volumeOutput = document.querySelector("[data-volume-output]");

  if (volumeSlider) {
    volume = Number(volumeSlider.value) / 100;

    volumeSlider.addEventListener("input", () => {
      volume = Number(volumeSlider.value) / 100;
      if (volumeOutput) volumeOutput.textContent = volumeSlider.value;
      volumeSlider.setAttribute("aria-valuetext", `${volumeSlider.value}%`);

      if (isPlaying && audio.ctx) {
        audio.master.gain.setTargetAtTime(
          Math.max(volume * 0.9, 0.0001),
          audio.ctx.currentTime,
          0.08
        );
      }
    });
  }

  /* ---------------------------------------------------------
     Newsletter form
     --------------------------------------------------------- */

  const newsletter = document.querySelector("[data-newsletter]");

  if (newsletter) {
    const input = newsletter.querySelector('input[type="email"]');
    const note = newsletter.querySelector(".newsletter__note");
    const submit = newsletter.querySelector('button[type="submit"]');
    const submitLabel = submit?.querySelector("span");
    const defaultNote = note?.textContent || "";
    let noteTimer = 0;
    let labelTimer = 0;

    const clearState = () => {
      window.clearTimeout(noteTimer);
      if (note) {
        note.classList.remove("is-success", "is-error");
        note.textContent = defaultNote;
      }
      input?.removeAttribute("aria-invalid");
      if (submitLabel) submitLabel.textContent = "订阅";
    };

    newsletter.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!input || !note) return;

      const value = input.value.trim();
      const valid = value.length > 0 && input.checkValidity();

      window.clearTimeout(noteTimer);
      window.clearTimeout(labelTimer);

      if (!valid) {
        input.setAttribute("aria-invalid", "true");
        note.classList.remove("is-success");
        note.classList.add("is-error");
        note.textContent = "请输入一个有效的邮箱地址。";
        input.focus();
        return;
      }

      note.classList.remove("is-error");
      note.classList.add("is-success");
      note.textContent = "订阅成功。我们周日夜见。";
      input.removeAttribute("aria-invalid");
      newsletter.reset();

      if (submitLabel) submitLabel.textContent = "已订阅";

      noteTimer = window.setTimeout(clearState, 6000);
      labelTimer = window.setTimeout(() => {
        if (submitLabel) submitLabel.textContent = "订阅";
      }, 4000);
    });

    input?.addEventListener("input", () => {
      if (note?.classList.contains("is-error")) {
        note.classList.remove("is-error");
        note.textContent = defaultNote;
        input.removeAttribute("aria-invalid");
      }
    });
  }
})();