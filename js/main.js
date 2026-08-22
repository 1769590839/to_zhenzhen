(() => {
  const S = window.SITE || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const text = (sel, val) => {
    const el = $(sel);
    if (el) el.textContent = val;
  };

  const pages = [
    { id: "home", label: "封面", title: "先从这里看起", desc: "今日一页，和几件可以点的小事" },
    { id: "letter", label: "信", title: "还没寄出的一封", desc: "我想留给你的话" },
    { id: "time", label: "日子", title: "把日子数清楚", desc: "认识、分别和倒数" },
    { id: "memories", label: "碎片", title: "碎片墙", desc: "二次元，和一些记下的瞬间" },
    { id: "secret", label: "星", title: "藏起来的一页", desc: "连点那颗更亮的星" }
  ];

  const mascotLines = [
    "角落里的花、星、月亮，都可以点。",
    "信封角上那只猫，也在看你。",
    "右上角的小音符，是一只音乐盒。",
    "开一朵花，也算留下过。",
    "累了就去信那一页，慢慢看。"
  ];

  let typedTimer = null;
  let audio = null;
  let secretClicks = 0;
  let vnIndex = 0;
  const foundEggs = new Set();

  const pad = (n) => String(n).padStart(2, "0");
  const parseDay = (s) => (s ? new Date(s + "T00:00:00") : null);
  const daysBetween = (a, b) => Math.floor((b - a) / 86400000);

  function fillText() {
    document.title = S.pageTitle || document.title;
    text("#pageTitle", S.pageTitle || "To 真真");
    text("#landingLine", S.landingLine || "");
    text("#landingHint", S.landingHint || "点那颗樱花蜡封，把信打开");
    text("#letterPeek", "To. " + (S.herName || "真真"));
    text("#herNameHero", S.herName || "真真");
    text("#myNameHero", S.myName || "狗晨");
    text("#vnName", S.myName || "狗晨");
    text("#subtitle", S.subtitle || "");
    text("#letterTitle", S.letterTitle || "还没寄出的一封");
    text("#letterSign", "—— " + (S.myName || "狗晨"));
    text("#hiddenMessage", S.hiddenMessage || "");
    text("#makeupTitle", S.makeupTitle || "");
    text("#secretHint", S.secretHint || "只有我们知道的那句");
    const now = new Date();
    text("#todayStamp", now.getFullYear() + "." + pad(now.getMonth() + 1) + "." + pad(now.getDate()));
    const lines = S.dialogue || [];
    text("#vnLine", lines[0] || "有些话，想慢慢说给你听。");
  }

  function buildNav() {
    const grid = $("#navGrid");
    const dock = $("#dock");
    grid.innerHTML = "";
    dock.innerHTML = "";
    pages.forEach((p) => {
      if (p.id !== "home" && p.id !== "secret") {
        const card = document.createElement("button");
        card.className = "nav-card";
        card.type = "button";
        card.innerHTML = "<b>" + p.title + "</b><span>" + p.desc + "</span>";
        card.addEventListener("click", () => showPage(p.id));
        grid.appendChild(card);
      }
      const tab = document.createElement("button");
      tab.type = "button";
      tab.dataset.page = p.id;
      tab.textContent = p.label;
      tab.addEventListener("click", () => showPage(p.id));
      dock.appendChild(tab);
    });
  }

  function showPage(id) {
    $$(".page").forEach((el) => el.classList.toggle("active", el.dataset.page === id));
    $$("#dock button").forEach((el) => el.classList.toggle("active", el.dataset.page === id));
    if (id === "letter") typeLetter(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function typeLetter(force) {
    const el = $("#letterBody");
    const text = (S.letter || "").trim();
    if (!force && el.dataset.done === "1") return;
    clearInterval(typedTimer);
    el.textContent = "";
    el.dataset.done = "";
    let i = 0;
    typedTimer = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(typedTimer);
        el.dataset.done = "1";
      }
    }, 26);
  }

  function renderTime() {
    const now = new Date();
    const meet = parseDay(S.meetDate);
    const fare = parseDay(S.farewellDate);
    const special = parseDay(S.specialDate);

    if (meet) {
      const n = Math.max(0, daysBetween(meet, now) + 1);
      $("#daysKnown").textContent = n;
      $("#homeDays").textContent = n;
      $("#meetLabel").textContent = "从 " + S.meetDate + " 起";
    }
    if (fare) {
      const diff = daysBetween(now, fare);
      if (diff > 0) {
        $("#daysFarewell").textContent = diff;
        $("#farewellLabel").textContent = "距离 " + S.farewellDate + " 还有这些天";
      } else {
        $("#daysFarewell").textContent = Math.abs(diff);
        $("#farewellLabel").textContent = diff === 0 ? "就是今天。珍重。" : "已经分别 " + Math.abs(diff) + " 天";
      }
    }
    $("#specialLabel").textContent = S.specialDateLabel || "特别日子";
    paintCountdown($("#countdown"), special);
    renderTimeline(meet, now, fare);

    const saved = JSON.parse(localStorage.getItem("for-you-custom-date") || "null");
    if (saved) {
      $("#customDate").value = saved.date || "";
      $("#customTitle").value = saved.title || "";
      paintCountdown($("#customCountdown"), parseDay(saved.date), saved.title);
    }
  }

  function renderTimeline(meet, now, fare) {
    const root = $("#timeline");
    const nodes = [
      { key: "认识", date: meet, cls: "" },
      { key: "今天", date: now, cls: "now" },
      { key: "分别", date: fare, cls: "" }
    ].filter((n) => n.date);
    root.innerHTML = nodes.map((n) => {
      const day = n.date.getFullYear() + "." + pad(n.date.getMonth() + 1) + "." + pad(n.date.getDate());
      return '<div class="tl-node ' + n.cls + '"><i></i><b>' + n.key + "</b><span>" + day + "</span></div>";
    }).join("");
  }

  function paintCountdown(root, date, title) {
    if (!root) return;
    if (!date) {
      root.innerHTML = "<p class=\"soft\">把日期写进 js/config.js，或在下面自己做一个</p>";
      return;
    }
    const tick = () => {
      const now = new Date();
      let ms = date - now;
      const past = ms < 0;
      ms = Math.abs(ms);
      const d = Math.floor(ms / 86400000);
      const h = Math.floor(ms / 3600000) % 24;
      const m = Math.floor(ms / 60000) % 60;
      const s = Math.floor(ms / 1000) % 60;
      const titleHtml = title ? "<p class=\"soft\">" + title + "</p>" : "";
      const pastHtml = past ? "已经过去了这些时间" : "还在路上";
      root.innerHTML = titleHtml +
        "<div class=\"count-cell\"><b>" + d + "</b><span>天</span></div>" +
        "<div class=\"count-cell\"><b>" + pad(h) + "</b><span>时</span></div>" +
        "<div class=\"count-cell\"><b>" + pad(m) + "</b><span>分</span></div>" +
        "<div class=\"count-cell\"><b>" + pad(s) + "</b><span>秒</span></div>" +
        "<p class=\"soft\">" + pastHtml + "</p>";
    };
    tick();
    clearInterval(root._t);
    root._t = setInterval(tick, 1000);
  }

  function renderMemories() {
    const wall = $("#memoryWall");
    const palette = ["#ffe0ea", "#fff1cf", "#e8fff4", "#f3e8ff", "#ffe8d6", "#e8f3ff"];
    const doodles = ["✿", "✦", "☾", "★", "❀", "☁"];
    wall.innerHTML = "";
    (S.memories || []).forEach((m, i) => {
      const fig = document.createElement("figure");
      fig.className = "polaroid";
      fig.style.setProperty("--r", (i % 2 ? 3 : -3) + "deg");
      const pic = m.photo
        ? "<img class=\"pic\" src=\"" + m.photo + "\" alt=\"" + m.title + "\" />"
        : "<div class=\"pic\" style=\"background:" + palette[i % palette.length] + "\">" + doodles[i % doodles.length] + "</div>";
      fig.innerHTML =
        "<span class=\"tag\">" + (m.tag || "记") + "</span>" +
        pic +
        "<figcaption>" + m.title + "</figcaption>" +
        "<small>" + (m.caption || "") + "</small>";
      fig.addEventListener("click", () => {
        fig.classList.toggle("tilt-left");
        burst(fig);
      });
      wall.appendChild(fig);
    });
  }

  function renderGarden() {
    const notes = S.flowerNotes || [];
    const garden = $("#garden");
    garden.innerHTML = "";
    notes.forEach((note, i) => {
      const btn = document.createElement("button");
      btn.className = "bud";
      btn.type = "button";
      btn.innerHTML = "<span class=\"head\"></span><span class=\"stem\"></span><small>花苞 " + (i + 1) + "</small>";
      btn.addEventListener("click", () => {
        btn.classList.add("bloom");
        btn.querySelector("small").textContent = note;
        burst(btn);
      });
      garden.appendChild(btn);
    });
  }

  function nextDialogue() {
    const lines = S.dialogue || [];
    if (!lines.length) return;
    vnIndex = (vnIndex + 1) % lines.length;
    $("#vnLine").textContent = lines[vnIndex];
    burst($("#vnBox"));
  }

  function collectEgg(id) {
    const key = String(id);
    if (foundEggs.has(key)) {
      speak("这颗已经找到过了。");
      return;
    }
    foundEggs.add(key);
    const total = $$("[data-egg]").length;
    const chip = $("#eggChip");
    chip.hidden = false;
    chip.textContent = "彩蛋 " + foundEggs.size + "/" + total;
    const lines = S.eggs || [];
    speak(lines[foundEggs.size - 1] || "又找到一颗。");
    if (foundEggs.size >= total) {
      setTimeout(() => {
        speak("都找到了。星那一页还有一句。");
        if (!$("#app").classList.contains("hidden")) showPage("secret");
      }, 900);
    }
  }

  function bindApps() {
    $("#vnBox").addEventListener("click", nextDialogue);
    $("#replayLetter").addEventListener("click", () => typeLetter(true));
    $("#saveCustom").addEventListener("click", () => {
      const date = $("#customDate").value;
      const title = $("#customTitle").value.trim() || "我的倒数";
      if (!date) return;
      localStorage.setItem("for-you-custom-date", JSON.stringify({ date, title }));
      paintCountdown($("#customCountdown"), parseDay(date), title);
    });
    $("#secretStar").addEventListener("click", () => {
      secretClicks += 1;
      $("#secretStar").style.transform = "scale(" + (1 + secretClicks * 0.06) + ")";
      if (secretClicks >= 5) {
        $("#secretCard").classList.remove("hidden");
        burst($("#secretStar"));
      }
    });
    $$("[data-egg]").forEach((el) => {
      const fire = () => {
        collectEgg(el.dataset.egg);
        burst(el);
      };
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        fire();
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") fire();
      });
    });
  }

  function speak(text) {
    const bubble = $("#mascotBubble");
    bubble.textContent = text;
    bubble.classList.remove("hidden");
    clearTimeout(speak._t);
    speak._t = setTimeout(() => bubble.classList.add("hidden"), 3200);
  }

  function bindMascot() {
    $("#mascot").addEventListener("click", () => {
      speak(mascotLines[Math.floor(Math.random() * mascotLines.length)]);
      burst($("#mascot"));
    });
  }

  function openEnvelope() {
    const env = $("#envelope");
    if (env.classList.contains("open")) return;
    env.classList.add("open");
    burst(env);
    setTimeout(() => {
      $("#landing").classList.add("hidden");
      $("#app").classList.remove("hidden");
      showPage("home");
      speak((S.herName || "真真") + "，信在里面。");
    }, 980);
  }

  function startFlow() {
    const loader = $("#loader");
    if (loader) loader.classList.add("hidden");
    const needGate = Boolean((S.secretWord || "").trim());
    if (needGate) {
      const landing = $("#landing");
      if (landing) landing.classList.add("hidden");
      const gate = $("#gate");
      if (gate) gate.classList.remove("hidden");
      return;
    }
    const landing = $("#landing");
    if (landing) landing.classList.remove("hidden");
  }

  function bindGate() {
    $("#gateForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = $("#secretInput").value.trim() === String(S.secretWord).trim();
      if (!ok) {
        $("#gateError").classList.remove("hidden");
        return;
      }
      $("#gate").classList.add("hidden");
      $("#landing").classList.remove("hidden");
    });
    $("#envelope").addEventListener("click", openEnvelope);
  }

  function MusicBox() {
    this.ctx = null;
    this.playing = false;
    this.timer = null;
    this.notes = [523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33];
    this.i = 0;
  }
  MusicBox.prototype.start = function start() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = this.ctx || new AC();
    this.ctx.resume();
    this.playing = true;
    const step = () => {
      if (!this.playing) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = this.notes[this.i % this.notes.length];
      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05, this.ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.58);
      this.i += 1;
      this.timer = setTimeout(step, 520);
    };
    step();
  };
  MusicBox.prototype.stop = function stop() {
    this.playing = false;
    clearTimeout(this.timer);
  };

  function bindChrome() {
    audio = new MusicBox();
    $("#musicBtn").addEventListener("click", () => {
      if (!S.musicEnabled) return;
      if (audio.playing) {
        audio.stop();
        $("#musicBtn").textContent = "♪";
      } else {
        audio.start();
        $("#musicBtn").textContent = "♫";
        speak("音乐盒打开了。再点一下就能关上。");
      }
    });
    $("#themeBtn").addEventListener("click", () => {
      document.body.classList.toggle("night");
      $("#themeBtn").textContent = document.body.classList.contains("night") ? "☀" : "☾";
    });
  }

  function burst(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    for (let i = 0; i < 14; i += 1) fx.burst(x, y);
  }

  const fx = {
    canvas: $("#fx"),
    ctx: null,
    parts: [],
    init() {
      this.ctx = this.canvas.getContext("2d");
      const resize = () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener("resize", resize);
      for (let i = 0; i < 40; i += 1) this.parts.push(this.petal());
      document.addEventListener("pointermove", (e) => {
        if (Math.random() > 0.62) this.parts.push(this.spark(e.clientX, e.clientY, "trail"));
      });
      document.addEventListener("click", (e) => {
        if (e.target.closest("button, input, a, .polaroid, .word-card, .vn-box")) return;
        for (let i = 0; i < 8; i += 1) this.burst(e.clientX, e.clientY);
      });
      const loop = () => {
        this.draw();
        requestAnimationFrame(loop);
      };
      loop();
    },
    petal() {
      return {
        kind: "petal",
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 4 + Math.random() * 5,
        s: 0.4 + Math.random() * 0.8,
        a: Math.random() * Math.PI * 2,
        life: 9999
      };
    },
    spark(x, y, kind) {
      return {
        kind,
        x,
        y,
        r: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1,
        life: 40 + Math.random() * 20
      };
    },
    burst(x, y) {
      this.parts.push(this.spark(x, y, "burst"));
    },
    draw() {
      const { ctx, canvas } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.parts = this.parts.filter((p) => {
        if (p.kind === "petal") {
          p.y += p.s;
          p.x += Math.sin(p.y / 30) * 0.6;
          p.a += 0.02;
          if (p.y > canvas.height + 10) {
            p.y = -10;
            p.x = Math.random() * canvas.width;
          }
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.a);
          ctx.fillStyle = "rgba(255, 155, 184, 0.55)";
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return true;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        ctx.fillStyle = p.kind === "trail" ? "rgba(255, 183, 204, 0.45)" : "rgba(239, 109, 150, 0.7)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        return p.life > 0;
      });
    }
  };

  function boot() {
    try {
      fillText();
      buildNav();
      renderTime();
      renderMemories();
      renderGarden();
      bindApps();
      bindMascot();
      bindGate();
      bindChrome();
      fx.init();
    } catch (err) {
      console.error(err);
    }
    startFlow();
  }

  boot();
})();
