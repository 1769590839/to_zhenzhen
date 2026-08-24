(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const text = (sel, val) => {
    const el = $(sel);
    if (el) el.textContent = val;
  };
  const safe = (fn) => {
    try { fn(); } catch (err) { console.error(err); }
  };
  const site = () => window.SITE || {};

  const pages = [
    { id: "home", label: "封面", title: "从这里看起", desc: "今日一页，和几件可以点的小事" },
    { id: "letter", label: "信", title: "还没寄出的一封", desc: "留言" },
    { id: "time", label: "日子", title: "把日子数清楚", desc: "认识和倒数" },
    { id: "memories", label: "碎片", title: "碎片墙", desc: "一些记下的瞬间" },
    { id: "secret", label: "星", title: "藏起来的一页", desc: "小彩蛋" }
  ];

  const mascotLines = [
    "一封信在「信」那一页。",
    "日子还在慢慢走。",
    "碎片可以点开看全图。",
    "墙上的花瓣和小兔，都藏着东西。",
    "想听歌的话，点右上角的音符。"
  ];

  const landingLines = [
    "我是小兔。右上角那个音符，点一下就会唱歌。",
    "中间的信封点开，就可以进去。",
    "月亮可以换成夜晚。",
    "四角的花和星星，藏着小东西。"
  ];

  const pageGuides = {
    home: "从封面开始逛就好。想看信，走下面那一栏。",
    letter: "这封信会自己长出来。蜡封和星星，都有彩蛋。",
    time: "上面是认识了多少天。下面可以进行一个倒计时",
    memories: "照片点开能看全图。墙上的花瓣、纸条和小兔，也藏着彩蛋",
    secret: "那颗星星，连点五次。"
  };

  let typedTimer = null;
  let audio = null;
  let secretClicks = 0;
  let vnIndex = 0;
  let mascotClicks = 0;
  let titleTaps = 0;
  const foundEggs = new Set();
  const hintedPages = new Set();

  const pad = (n) => String(n).padStart(2, "0");
  const parseDay = (s) => (s ? new Date(s + "T00:00:00") : null);
  const daysBetween = (a, b) => Math.floor((b - a) / 86400000);

  function fillText() {
    const S = site();
    document.title = S.pageTitle || document.title;
    text("#pageTitle", S.pageTitle || "To 真真");
    text("#landingLine", S.landingLine || "");
    text("#landingHint", S.landingHint || "Message");
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
    const today = now.getFullYear() + "." + pad(now.getMonth() + 1) + "." + pad(now.getDate());
    text("#todayStamp", today);
    text("#homeToday", today);
    const lines = S.dialogue || [];
    text("#vnLine", lines[0] || "有些话，想慢慢说给你听。");
    if (!window.SITE) {
      const hint = $("#configHint");
      if (hint) hint.classList.remove("hidden");
    }
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

  function showPage(id, opts) {
    const silent = opts && opts.silent;
    $$(".page").forEach((el) => el.classList.toggle("active", el.dataset.page === id));
    $$("#dock button").forEach((el) => el.classList.toggle("active", el.dataset.page === id));
    if (id === "letter") typeLetter(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!silent && !hintedPages.has(id)) {
      hintedPages.add(id);
      speak(pageGuides[id] || "慢慢看就好。");
    }
  }

  function typeLetter(force) {
    const el = $("#letterBody");
    const body = (site().letter || el.textContent || "").trim();
    if (!el || !body) return;
    if (!force && el.dataset.done === "1") return;
    clearInterval(typedTimer);
    el.textContent = "";
    el.dataset.done = "";
    let i = 0;
    typedTimer = setInterval(() => {
      el.textContent = body.slice(0, ++i);
      if (i >= body.length) {
        clearInterval(typedTimer);
        el.dataset.done = "1";
      }
    }, 26);
  }

  function renderTime() {
    const S = site();
    const now = new Date();
    const meet = parseDay(S.meetDate);
    const special = parseDay(S.specialDate);

    if (meet) {
      const n = Math.max(0, daysBetween(meet, now) + 1);
      $("#daysKnown").textContent = n;
      $("#meetLabel").textContent = "从 " + S.meetDate + " 起";
    }
    $("#specialLabel").textContent = S.specialDateLabel || "特别日子";
    paintCountdown($("#countdown"), special);
    renderTimeline(meet, now);

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("for-you-custom-date") || "null"); } catch (err) { saved = null; }
    if (saved) {
      $("#customDate").value = saved.date || "";
      $("#customTitle").value = saved.title || "";
      paintCountdown($("#customCountdown"), parseDay(saved.date), saved.title);
    }
  }

  function renderTimeline(meet, now) {
    const root = $("#timeline");
    const nodes = [
      { key: "认识", date: meet, cls: "" },
      { key: "今天", date: now, cls: "now" }
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

  function slotWrap(node) {
    const slot = document.createElement("div");
    slot.className = "polaroid-slot";
    slot.appendChild(node);
    return slot;
  }

  function renderMemories() {
    const wall = $("#memoryWall");
    const palette = ["#ffe0ea", "#fff1cf", "#e8fff4", "#f3e8ff"];
    const doodles = ["✿", "✦", "❀", "★"];
    const tapes = ["", "mint", "lemon", ""];
    wall.innerHTML = "";
    (site().memories || []).forEach((m, i) => {
      const fig = document.createElement("figure");
      fig.className = "polaroid";
      const deco = i % 2 === 0
        ? "<span class=\"pin\" aria-hidden=\"true\"></span>"
        : "<span class=\"tape-bit " + tapes[i % tapes.length] + "\" aria-hidden=\"true\"></span>";
      const pic = m.photo
        ? "<div class=\"frame\"><img class=\"pic\" src=\"" + m.photo + "\" alt=\"" + (m.title || "") + "\" draggable=\"false\" /></div>"
        : "<div class=\"frame\"><div class=\"pic placeholder\" style=\"background:" + palette[i % palette.length] + "\">" + doodles[i % doodles.length] + "</div></div>";
      fig.innerHTML =
        deco +
        "<span class=\"tag\">" + (m.tag || "记") + "</span>" +
        pic +
        "<figcaption>" + (m.title || "") + "</figcaption>" +
        "<small>" + (m.caption || "") + "</small>";
      if (m.egg) fig.dataset.egg = String(m.egg);
      fig.addEventListener("click", () => {
        openLightbox(m);
        burst(fig);
      });
      wall.appendChild(slotWrap(fig));
    });
  }

  function openLightbox(m) {
    const box = $("#lightbox");
    const img = $("#lightboxImg");
    if (!box || !img) return;
    if (m.photo) {
      img.src = m.photo;
      img.alt = m.title || "";
      img.hidden = false;
    } else {
      img.removeAttribute("src");
      img.hidden = true;
    }
    text("#lightboxTitle", m.title || "");
    text("#lightboxCap", m.caption || "");
    box.classList.remove("hidden");
    speak(m.say || ("这张是「" + (m.title || "一张碎片") + "」。"));
  }

  function closeLightbox() {
    const box = $("#lightbox");
    if (box) box.classList.add("hidden");
  }

  function nextDialogue() {
    const lines = site().dialogue || [];
    if (!lines.length) return;
    vnIndex = (vnIndex + 1) % lines.length;
    $("#vnLine").textContent = lines[vnIndex];
    hopMascot();
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
    const lines = site().eggs || [];
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
    $("#replayLetter").addEventListener("click", () => {
      typeLetter(true);
      speak("再读一遍。我帮你慢慢念。");
    });
    $("#saveCustom").addEventListener("click", () => {
      const date = $("#customDate").value;
      const title = $("#customTitle").value.trim() || "我的倒数";
      if (!date) {
        speak("先选一个日期小兔才会开始数。");
        return;
      }
      localStorage.setItem("for-you-custom-date", JSON.stringify({ date, title }));
      paintCountdown($("#customCountdown"), parseDay(date), title);
      speak("开始倒数了。日子会自己走。");
    });
    $("#secretStar").addEventListener("click", () => {
      secretClicks += 1;
      $("#secretStar").style.transform = "scale(" + (1 + secretClicks * 0.06) + ")";
      if (secretClicks >= 5) {
        $("#secretCard").classList.remove("hidden");
        burst($("#secretStar"));
        speak("找到啦。这句是留给真真的。");
      } else {
        speak("还差 " + (5 - secretClicks) + " 下。");
      }
    });
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-egg]");
      if (!el) return;
      collectEgg(el.dataset.egg);
      burst(el);
    });
    document.addEventListener("keydown", (e) => {
      const el = e.target.closest("[data-egg]");
      if (!el) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        collectEgg(el.dataset.egg);
        burst(el);
      }
    });
    $("#lightboxClose").addEventListener("click", closeLightbox);
    $("#lightbox").addEventListener("click", (e) => {
      if (e.target.id === "lightbox") closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
    const title = $("#memoriesTitle");
    if (title) {
      title.style.cursor = "pointer";
      title.title = "连点三次";
      title.addEventListener("click", () => {
        titleTaps += 1;
        if (titleTaps >= 3) {
          titleTaps = 0;
          sakuraStorm();
          speak("墙也会开花。再点照片看看全图。");
        }
      });
    }
  }

  function hopMascot() {
    const el = $("#mascot");
    if (!el) return;
    el.classList.remove("hop");
    void el.offsetWidth;
    el.classList.add("hop", "talk");
    clearTimeout(hopMascot._t);
    hopMascot._t = setTimeout(() => el.classList.remove("hop", "talk"), 520);
  }

  function speak(msg) {
    const bubble = $("#mascotBubble");
    if (!bubble || !msg) return;
    bubble.textContent = msg;
    bubble.classList.remove("hidden");
    hopMascot();
    clearTimeout(speak._t);
    speak._t = setTimeout(() => bubble.classList.add("hidden"), 3800);
  }

  function onLanding() {
    const landing = $("#landing");
    return landing && !landing.classList.contains("hidden");
  }

  function bindMascot() {
    $("#mascot").addEventListener("click", () => {
      mascotClicks += 1;
      if (mascotClicks === 7) {
        sakuraStorm();
        speak("樱花知道了。团子再跳一次。");
      } else if (onLanding()) {
        speak(landingLines[mascotClicks % landingLines.length]);
      } else {
        speak(mascotLines[mascotClicks % mascotLines.length]);
      }
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
      document.body.classList.remove("on-landing");
      document.body.classList.add("is-app");
      showPage("home", { silent: true });
      speak((site().herName || "真真") + "，信在里面。下面可以翻页。");
    }, 980);
  }

  function startFlow() {
    const loader = $("#loader");
    if (loader) loader.classList.add("hidden");
    const needGate = Boolean((site().secretWord || "").trim());
    if (needGate) {
      const landing = $("#landing");
      if (landing) landing.classList.add("hidden");
      const gate = $("#gate");
      if (gate) gate.classList.remove("hidden");
      return;
    }
    const landing = $("#landing");
    if (landing) landing.classList.remove("hidden");
    setTimeout(() => {
      speak("我是小兔！右上角可以开音乐，点信封就能进去。");
    }, 700);
  }

  function bindGate() {
    $("#gateForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = $("#secretInput").value.trim() === String(site().secretWord || "").trim();
      if (!ok) {
        $("#gateError").classList.remove("hidden");
        return;
      }
      $("#gate").classList.add("hidden");
      $("#landing").classList.remove("hidden");
      speak("暗号对上了。右上角可以开音乐，再点信封。");
    });
    $("#envelope").addEventListener("click", openEnvelope);
  }

  function MusicBox() {
    this.el = document.createElement("audio");
    this.el.src = site().musicSrc || "music/eve-kokoro-yohou.mp3";
    this.el.loop = true;
    this.el.preload = "auto";
    this.playing = false;
  }
  MusicBox.prototype.start = function start() {
    const play = this.el.play();
    this.playing = true;
    if (play && play.catch) play.catch(() => { this.playing = false; });
  };
  MusicBox.prototype.stop = function stop() {
    this.el.pause();
    this.playing = false;
  };

  function bindChrome() {
    audio = new MusicBox();
    $("#musicBtn").addEventListener("click", () => {
      if (site().musicEnabled === false) return;
      if (audio.playing) {
        audio.stop();
        $("#musicBtn").textContent = "♪";
        $("#musicBtn").classList.remove("pulse");
        speak("先这样静一静也很好。");
      } else {
        audio.start();
        $("#musicBtn").textContent = "♫";
        $("#musicBtn").classList.remove("pulse");
        speak("心予報响起来了。再点一下就能关上。");
      }
    });
    $("#themeBtn").addEventListener("click", () => {
      document.body.classList.toggle("night");
      const night = document.body.classList.contains("night");
      $("#themeBtn").textContent = night ? "☀" : "☾";
      speak(night ? "夜晚更适合去「星」那一页。" : "白天的樱花又回来了。");
    });
  }

  function burst(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    for (let i = 0; i < 14; i += 1) fx.burst(x, y);
  }

  function sakuraStorm() {
    for (let i = 0; i < 70; i += 1) fx.parts.push(fx.petal(true));
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
    petal(storm) {
      return {
        kind: "petal",
        storm: !!storm,
        x: Math.random() * window.innerWidth,
        y: storm ? (-30 - Math.random() * 240) : Math.random() * window.innerHeight,
        r: (storm ? 6 : 4) + Math.random() * 6,
        s: (storm ? 1.3 : 0.4) + Math.random() * (storm ? 1.8 : 0.8),
        a: Math.random() * Math.PI * 2,
        life: storm ? 280 : 9999
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
          if (p.storm) p.life -= 1;
          if (p.y > canvas.height + 10) {
            if (p.storm) return false;
            p.y = -10;
            p.x = Math.random() * canvas.width;
          }
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.a);
          ctx.fillStyle = p.storm ? "rgba(255, 140, 176, 0.72)" : "rgba(255, 155, 184, 0.55)";
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 0.55, p.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return p.storm ? p.life > 0 : true;
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
    safe(fillText);
    safe(buildNav);
    safe(renderTime);
    safe(renderMemories);
    safe(bindApps);
    safe(bindMascot);
    safe(bindGate);
    safe(bindChrome);
    safe(() => fx.init());
    startFlow();
  }

  boot();
})();
