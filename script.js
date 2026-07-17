var myId = "1328456398362771486";
var DEBUG = false;

function clean(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

const bootScreen = document.getElementById("boot-screen");
setTimeout(() => {
  bootScreen.classList.add("boot-done");
  setTimeout(() => bootScreen.remove(), 450);
}, 1500);

const desktop = document.querySelector(".desktop");
const taskButtons = document.getElementById("task-buttons");

const notepads = {
  "win-bio": { label: "bio.txt - Notepad", icon: "icons/327(32x32).png", baseW: 420 },
  "win-socials": { label: "socials.txt - Notepad", icon: "icons/327(32x32).png", baseW: 420 },
  "win-rpc": { label: "nowplaying.txt - Notepad", icon: "icons/846(32x32).png", baseW: 480 },
};
var winCount = 0;
var topZ = 10;
var rpcCache = null;

Object.keys(notepads).forEach(id => {
  document.getElementById(id).classList.add("win-template");
});

function raise(el) { el.style.zIndex = ++topZ; }

function openNotepad(which, slot = null) {
  const info = notepads[which];
  const el = document.getElementById(which).cloneNode(true);
  el.classList.remove("win-template");
  el.id = which + "-i" + (++winCount);
  desktop.appendChild(el);

  if (rpcCache && el.querySelector(".rpc-body")) {
    el.querySelector(".rpc-body").innerHTML = rpcCache;
  }

  const w = Math.round(info.baseW * (0.85 + Math.random() * 0.3));
  el.style.width = w + "px";

  if (window.innerWidth > 900) {
    const h = el.offsetHeight || 300;
    let x, y;
    if (slot !== null) {
      const slotW = window.innerWidth / Object.keys(notepads).length;
      x = slotW * slot + (slotW - w) / 2 + (Math.random() * 2 - 1) * 60;
      y = (window.innerHeight - 30 - h) / 2 + (Math.random() * 2 - 1) * 60;
    } else {
      const n = winCount % 8;
      x = window.innerWidth / 2 - w / 2 + n * 26;
      y = 80 + n * 26;
    }
    x = Math.min(Math.max(10, x), Math.max(10, window.innerWidth - w - 10));
    y = Math.min(Math.max(10, y), Math.max(10, window.innerHeight - 30 - h - 10));
    el.style.left = x + "px";
    el.style.top = y + "px";
  }
  raise(el);

  hookupWindow(el, info.label, info.icon);
}

function hookupWindow(el, label, icon) {
  const btn = document.createElement("button");
  btn.className = "task-btn active";
  const img = document.createElement("img");
  img.src = icon;
  img.className = "task-btn-icon";
  btn.appendChild(img);
  btn.appendChild(document.createTextNode(label));
  btn.title = label;
  taskButtons.appendChild(btn);

  var minimized = false;

  btn.onclick = function () {
    minimized = !minimized;
    el.style.display = minimized ? "none" : "";
    btn.classList.toggle("active", !minimized);
    btn.classList.toggle("hidden-win", minimized);
    if (!minimized) raise(el);
  };

  el.querySelectorAll(".tb-btn").forEach(b => {
    b.style.cursor = "pointer";
    if (b.classList.contains("tb-close")) {
      b.onclick = function () { el.remove(); btn.remove(); };
    } else if (b.textContent === "_") {
      b.onclick = function () {
        minimized = true;
        el.style.display = "none";
        btn.classList.remove("active");
        btn.classList.add("hidden-win");
      };
    } else if (b.textContent === "□") {
      b.onclick = () => maxi(el);
    }
  });

  el.addEventListener("mousedown", () => raise(el));

  const bar = el.querySelector(".titlebar");
  bar.addEventListener("mousedown", function (e) {
    if (e.target.closest(".tb-btn")) return;
    if (window.innerWidth <= 900) return;
    if (el.dataset.maximized === "1") return;
    e.preventDefault();
    const ox = e.clientX - el.offsetLeft;
    const oy = e.clientY - el.offsetTop;
    const shield = document.createElement("div");
    shield.style.cssText = "position:fixed;inset:0;z-index:9999;";
    document.body.appendChild(shield);
    function mv(ev) {
      let x = ev.clientX - ox;
      let y = ev.clientY - oy;
      x = Math.min(Math.max(-el.offsetWidth + 60, x), window.innerWidth - 60);
      y = Math.min(Math.max(0, y), window.innerHeight - 60);
      el.style.left = x + "px";
      el.style.top = y + "px";
    }
    function up() {
      shield.remove();
      document.removeEventListener("mousemove", mv);
      document.removeEventListener("mouseup", up);
    }
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
  });
  bar.addEventListener("dblclick", function (e) {
    if (e.target.closest(".tb-btn")) return;
    maxi(el);
  });

  return btn;
}

function maxi(el) {
  if (el.dataset.maximized === "1") {
    el.style.left = el.dataset.oldLeft;
    el.style.top = el.dataset.oldTop;
    el.style.width = el.dataset.oldWidth;
    el.style.height = "";
    el.style.maxWidth = "";
    el.style.borderRadius = "";
    el.dataset.maximized = "";
  } else {
    el.dataset.oldLeft = el.style.left;
    el.dataset.oldTop = el.style.top;
    el.dataset.oldWidth = el.style.width;
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.width = "100vw";
    el.style.maxWidth = "100vw";
    el.style.height = "calc(100vh - 30px)";
    el.style.borderRadius = "0";
    el.dataset.maximized = "1";
    raise(el);
  }
}

Object.keys(notepads).forEach((id, i) => openNotepad(id, i));

const binIcon = document.getElementById("bin-icon");
const binImg = document.getElementById("bin-img");
const trash = [];

function updateBinIcon() { binImg.src = trash.length ? "icons/recycle-full.png" : "icons/recycle-empty.png"; }

function redrawTrash() {
  document.querySelectorAll(".bin-body").forEach(body => {
    if (!trash.length) {
      body.innerHTML = `<p class="loading">The Recycle Bin is empty.</p>`;
      return;
    }
    body.innerHTML = trash.map((item, i) => `
      <div class="bin-row">
        <img src="${item.iconSrc}" alt="">
        <span>${item.label}</span>
        <button class="bin-restore" data-i="${i}">Restore</button>
      </div>`).join("") +
      `<button class="bin-empty">Empty Recycle Bin</button>`;
    body.querySelectorAll(".bin-restore").forEach(b => {
      b.onclick = () => putBack(+b.dataset.i);
    });
    body.querySelector(".bin-empty").onclick = function () {
      trash.length = 0;
      updateBinIcon();
      redrawTrash();
    };
  });
}

function chuck(iconEl) {
  if (iconEl.id === "bin-icon") return;
  trash.push({
    el: iconEl,
    label: iconEl.querySelector("span").textContent,
    iconSrc: iconEl.querySelector("img").src,
  });
  iconEl.style.display = "none";
  updateBinIcon();
  redrawTrash();
}

function putBack(i) {
  const item = trash.splice(i, 1)[0];
  if (item) item.el.style.display = "";
  updateBinIcon();
  redrawTrash();
}

function openTrash() {
  const el = document.createElement("section");
  el.className = "xp-window";
  el.id = "win-bin-i" + (++winCount);
  el.innerHTML = `
    <div class="titlebar">
      <span class="titlebar-text">Recycle Bin</span>
      <div class="titlebar-btns"><span class="tb-btn">_</span><span class="tb-btn">□</span><span class="tb-btn tb-close">✕</span></div>
    </div>
    <div class="menubar"><span>File</span><span>Edit</span><span>View</span><span>Help</span></div>
    <div class="window-body bin-body"></div>`;
  desktop.appendChild(el);
  el.style.width = "380px";
  if (window.innerWidth > 900) {
    el.style.left = Math.max(10, window.innerWidth / 2 - 190 + (Math.random() * 2 - 1) * 80) + "px";
    el.style.top = Math.max(10, 120 + Math.random() * 120) + "px";
  }
  raise(el);
  hookupWindow(el, "Recycle Bin", "icons/recycle-empty.png");
  redrawTrash();
}

binIcon.addEventListener("dblclick", openTrash);

function launchPinball() {
  const el = document.createElement("section");
  el.className = "xp-window";
  el.id = "win-pinball-i" + (++winCount);
  el.innerHTML = `
    <div class="titlebar">
      <span class="titlebar-text">3D Pinball for Windows - Space Cadet</span>
      <div class="titlebar-btns"><span class="tb-btn">_</span><span class="tb-btn">□</span><span class="tb-btn tb-close">✕</span></div>
    </div>
    <div class="menubar"><span>Game</span><span>Options</span><span>Help</span></div>
    <iframe class="pinball-frame" src="https://alula.github.io/SpaceCadetPinball/" title="3D Pinball"></iframe>`;
  desktop.appendChild(el);
  el.style.width = "620px";
  el.style.height = "520px";
  if (window.innerWidth > 900) {
    el.style.left = Math.max(10, (window.innerWidth - 620) / 2 + (Math.random() * 2 - 1) * 60) + "px";
    el.style.top = Math.max(10, (window.innerHeight - 30 - 520) / 2) + "px";
  }
  raise(el);
  hookupWindow(el, "3D Pinball - Space Cadet", "icons/pinball.png");
}

document.getElementById("pinball-icon").addEventListener("dblclick", launchPinball);
document.getElementById("sm-pinball").onclick = function () {
  launchPinball();
  document.getElementById("start-menu").hidden = true;
};

document.querySelectorAll(".desk-icon").forEach(icon => {
  icon.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelectorAll(".desk-icon").forEach(o => o.classList.remove("selected"));
    icon.classList.add("selected");
  });
  icon.addEventListener("dblclick", function () {
    if (icon.id === "bin-icon") return;
    if (icon.dataset.open) openNotepad(icon.dataset.open);
    else if (icon.href) window.open(icon.href, "_blank");
  });

  if (icon.id !== "bin-icon") {
    icon.addEventListener("mousedown", function (e) {
      if (window.innerWidth <= 900) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY;
      let ghost = null;
      function mv(ev) {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
          ghost = icon.cloneNode(true);
          ghost.style.cssText = "position:fixed;z-index:999;opacity:.6;pointer-events:none;width:76px;";
          document.body.appendChild(ghost);
        }
        if (ghost) {
          ghost.style.left = (ev.clientX - 38) + "px";
          ghost.style.top = (ev.clientY - 20) + "px";
          const r = binIcon.getBoundingClientRect();
          const hit = ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom;
          binIcon.classList.toggle("selected", hit);
        }
      }
      function up(ev) {
        document.removeEventListener("mousemove", mv);
        document.removeEventListener("mouseup", up);
        if (ghost) {
          ghost.remove();
          const r = binIcon.getBoundingClientRect();
          if (ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom) {
            chuck(icon);
          }
          binIcon.classList.remove("selected");
        }
      }
      document.addEventListener("mousemove", mv);
      document.addEventListener("mouseup", up);
    });
  }
});
desktop.addEventListener("click", function (e) {
  if (!e.target.closest(".desk-icon"))
    document.querySelectorAll(".desk-icon").forEach(o => o.classList.remove("selected"));
});

const startBtn = document.getElementById("start-btn");
const startMenu = document.getElementById("start-menu");

startBtn.onclick = function (e) {
  e.stopPropagation();
  startMenu.hidden = !startMenu.hidden;
};
document.addEventListener("click", function (e) {
  if (!startMenu.hidden && !startMenu.contains(e.target)) startMenu.hidden = true;
});
startMenu.querySelectorAll("[data-open]").forEach(item => {
  item.onclick = function () {
    openNotepad(item.dataset.open);
    startMenu.hidden = true;
  };
});

const footerItems = startMenu.querySelectorAll(".footer__item");

footerItems[1].onclick = function () {
  startMenu.hidden = true;
  const off = document.createElement("div");
  off.style.cssText =
    "position:fixed;inset:0;z-index:200;background:#000;opacity:0;" +
    "transition:opacity 1.2s;cursor:none;display:flex;align-items:center;justify-content:center;";
  const hint = document.createElement("span");
  hint.textContent = "Click anywhere to turn the computer back on";
  hint.style.cssText =
    "color:#7a7a7a;font-family:Tahoma,sans-serif;font-size:13px;opacity:0;transition:opacity 1s;";
  off.appendChild(hint);
  document.body.appendChild(off);
  requestAnimationFrame(() => { off.style.opacity = "1"; });
  setTimeout(() => { hint.style.opacity = "1"; off.style.cursor = "pointer"; }, 2500);
  off.onclick = () => location.reload();
};

footerItems[0].onclick = () => location.reload();

var failCount = 0;

async function pollLanyard() {
  try {
    const res = await fetch("https://api.lanyard.rest/v1/users/" + myId);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "lanyard said no");
    failCount = 0;
    showStatus(json.data);
  } catch (err) {
    failCount++;
    if (DEBUG) console.log("lanyard fail #" + failCount, err);
    if (failCount < 3) return;
    document.querySelectorAll(".rpc-body").forEach(b => {
      b.innerHTML = `<p class="loading">Couldn't load Discord status.<br><small>Make sure you've joined <a href="https://discord.gg/lanyard" target="_blank">discord.gg/lanyard</a> so the API can see your presence.</small></p>`;
    });
  }
}

function artFor(activity, key) {
  const a = activity.assets?.[key];
  if (!a) return null;
  if (a.startsWith("mp:external/")) return "https://media.discordapp.net/" + a.slice(3);
  if (a.startsWith("spotify:")) return "https://i.scdn.co/image/" + a.slice(8);
  return "https://cdn.discordapp.com/app-assets/" + activity.application_id + "/" + a + ".png";
}

function showStatus(d) {
  const u = d.discord_user;
  const avatar = u.avatar
    ? "https://cdn.discordapp.com/avatars/" + u.id + "/" + u.avatar + ".png?size=64"
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  document.getElementById("sm-avatar").src = avatar;

  let html = `
    <div class="rpc-user">
      <img class="rpc-avatar" src="${avatar}" alt="avatar">
      <div>
        <b>windows eXPerience</b><br>
        <small><span class="status-dot status-${d.discord_status}"></span>${clean(d.discord_status)}</small>
      </div>
    </div>`;

  if (d.listening_to_spotify && d.spotify) {
    html += `
      <div class="activity-card">
        <img class="activity-art" src="${d.spotify.album_art_url}" alt="album art">
        <div>
          <b>${clean(d.spotify.song)}</b>
          <small>by ${clean(d.spotify.artist)}</small>
          <small>on ${clean(d.spotify.album)} · Spotify</small>
        </div>
      </div>`;
  }

  const acts = (d.activities || []).filter(a => a.type !== 4 && a.name !== "Spotify");
  for (const a of acts) {
    const art = artFor(a, "large_image");
    html += `
      <div class="activity-card">
        ${art ? `<img class="activity-art" src="${art}" alt="">` : ""}
        <div>
          <b>${clean(a.name)}</b>
          ${a.details ? `<small>${clean(a.details)}</small>` : ""}
          ${a.state ? `<small>${clean(a.state)}</small>` : ""}
        </div>
      </div>`;
  }

  if (!d.listening_to_spotify && acts.length === 0) {
    html += `<p class="loading">Not doing anything right now.</p>`;
  }

  rpcCache = html;
  lastRpcData = d;
  document.querySelectorAll(".rpc-body").forEach(b => { b.innerHTML = html; });
}

pollLanyard();
setInterval(pollLanyard, 15000);

function clock() {
  document.getElementById("clock").textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
clock();
setInterval(clock, 1000);

const nokiaScreen = document.getElementById("nokia-screen");
const skLeft = document.getElementById("nokia-sk-left");
const skRight = document.getElementById("nokia-sk-right");
var lastRpcData = null;
var nokiaSel = 0;
var nokiaMode = "menu";

const NOKIA_MENU = [
  { name: "Bio", render: () => `
      <div class="nk-line"><b>windows eXPerience</b></div>
      <div class="nk-line">hi im windows eXPerience i play geometry dash and hoi4 sometimes i like old tech, my hardest is windy landscape and sweater weather (36%, 55-94x2)</div>
      <div class="nk-line">i also like flashing phones and taking photos and i wanna buy a mirrorless camera and upgrade to am5 one day</div>` },
  { name: "Socials", render: () => `
      <div class="nk-line"><b>Discord</b><a href="https://discord.com/users/1328456398362771486" target="_blank">windowssexperience</a></div>
      <div class="nk-line"><b>TikTok</b><a href="https://www.tiktok.com/@windowssexperience" target="_blank">@windowssexperience</a></div>` },
  { name: "Now playing", render: () => {
      const d = lastRpcData;
      if (!d) return `<div class="nk-line">Connecting...</div>`;
      let out = `<div class="nk-line"><b>Status</b>${clean(d.discord_status)}</div>`;
      if (d.listening_to_spotify && d.spotify) {
        out += `<div class="nk-line"><b>Spotify</b>${clean(d.spotify.song)} - ${clean(d.spotify.artist)}</div>`;
      }
      const acts = (d.activities || []).filter(a => a.type !== 4 && a.name !== "Spotify");
      for (const a of acts) {
        out += `<div class="nk-line"><b>${clean(a.name)}</b>${a.details ? clean(a.details) : ""}</div>`;
      }
      if (!d.listening_to_spotify && acts.length === 0) out += `<div class="nk-line">Not doing anything rn</div>`;
      return out;
    } },
  { name: "Devices", render: () => `
      <div class="nk-line"><b>PC</b>Ryzen 7 3700X / RX 6750XT / 16GB DDR4 / 1384GB</div>
      <div class="nk-line"><b>Phone</b>Pixel 7 Pro (google-cheetah)</div>
      <div class="nk-line"><b>Other</b>Galaxy S8, Rival 3, Krux Atax Pro, Philips Evnia 180hz</div>` },
  { name: "Snake II", render: () => "" },
];

function nokiaMenu() {
  stopSnake();
  nokiaMode = "menu";
  nokiaScreen.innerHTML = `<div class="nokia-title">Menu</div>` +
    NOKIA_MENU.map((m, i) =>
      `<button class="nokia-item ${i === nokiaSel ? "sel" : ""}" data-i="${i}">${m.name}</button>`
    ).join("");
  skLeft.textContent = "Select";
  skRight.textContent = "";
  nokiaScreen.querySelectorAll(".nokia-item").forEach(b => {
    b.onclick = function () { nokiaSel = +b.dataset.i; nokiaOpen(nokiaSel); };
  });
}

function nokiaOpen(i) {
  const item = NOKIA_MENU[i];
  if (item.name === "Snake II") { startSnake(); return; }
  nokiaMode = "view";
  nokiaScreen.innerHTML = `<div class="nokia-title">${item.name}</div><div class="nokia-body">${item.render()}</div>`;
  skLeft.textContent = "";
  skRight.textContent = "Back";
}

skRight.onclick = function () {
  if (nokiaMode !== "menu") nokiaMenu();
};
skLeft.onclick = function () {
  if (nokiaMode === "menu") nokiaOpen(nokiaSel);
};

var snakeTimer = null;
var snake, food, dir, dirQueue, score, snakeDead;

function stopSnake() {
  if (snakeTimer) { clearInterval(snakeTimer); snakeTimer = null; }
}

function snakeDir(dx, dy) {
  const last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
  if (last[0] === -dx && last[1] === -dy) return;
  if (last[0] === dx && last[1] === dy) return;
  dirQueue.push([dx, dy]);
}

function startSnake() {
  nokiaMode = "snake";
  nokiaScreen.innerHTML = `<canvas id="snake-canvas"></canvas>`;
  skLeft.textContent = "";
  skRight.textContent = "Quit";
  const canvas = document.getElementById("snake-canvas");
  const COLS = 28, ROWS = 18;
  const rect = nokiaScreen.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const cw = canvas.width / COLS, ch = canvas.height / ROWS;
  const ctx = canvas.getContext("2d");

  snake = [[8, 9], [7, 9], [6, 9]];
  dir = [1, 0];
  dirQueue = [];
  score = 0;
  snakeDead = false;
  placeFood();

  function placeFood() {
    do {
      food = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)];
    } while (snake.some(s => s[0] === food[0] && s[1] === food[1]));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1d2408";
    for (const [x, y] of snake) ctx.fillRect(x * cw + 1, y * ch + 1, cw - 2, ch - 2);
    ctx.fillRect(food[0] * cw + cw * 0.25, food[1] * ch + ch * 0.25, cw * 0.5, ch * 0.5);
    ctx.font = Math.round(ch * 1.1) + "px VT323, monospace";
    ctx.textAlign = "right";
    ctx.fillText(String(score).padStart(4, "0"), canvas.width - 3, ch * 1.1);
  }

  function step() {
    if (dirQueue.length) dir = dirQueue.shift();
    const head = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
    head[0] = (head[0] + COLS) % COLS;
    head[1] = (head[1] + ROWS) % ROWS;
    if (snake.some(s => s[0] === head[0] && s[1] === head[1])) {
      gameOver();
      return;
    }
    snake.unshift(head);
    if (head[0] === food[0] && head[1] === food[1]) {
      score += 9;
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function gameOver() {
    stopSnake();
    snakeDead = true;
    nokiaMode = "view";
    nokiaScreen.innerHTML =
      `<div class="nokia-title">Snake II</div>
       <div class="nokia-body" style="text-align:center">
         <div class="nk-line" style="margin-top:12%">Game over!</div>
         <div class="nk-line">Score: ${score}</div>
       </div>`;
    skLeft.textContent = "";
    skRight.textContent = "Back";
  }

  let touchStart = null;
  canvas.addEventListener("touchstart", function (e) {
    touchStart = [e.touches[0].clientX, e.touches[0].clientY];
  }, { passive: true });
  canvas.addEventListener("touchend", function (e) {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart[0];
    const dy = e.changedTouches[0].clientY - touchStart[1];
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) {
      if (Math.abs(dx) > Math.abs(dy)) snakeDir(Math.sign(dx), 0);
      else snakeDir(0, Math.sign(dy));
    }
    touchStart = null;
  }, { passive: true });

  draw();
  snakeTimer = setInterval(step, 140);
}

if (window.matchMedia("(max-width: 900px)").matches) {
  nokiaScreen.innerHTML = `<div class="nokia-boot">NOKIA</div>`;
  setTimeout(nokiaMenu, 1200);
}