// chalk. site: the live demo panel, the conversation and the page's interactions.

(() => {
"use strict";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MIN = 60_000, DAY = 86_400_000;

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  } catch { return null; }
}


// ── Dates: chrono-node, as in the app, with a small fallback ─────────────────

let chrono = null;
import("https://cdn.jsdelivr.net/npm/chrono-node@2.10.1/+esm")
  .then((mod) => { chrono = mod.parse ? mod : mod.default; refreshAfterChrono(); })
  .catch(() => { /* offline: the fallback below handles common phrases */ });

function parseDates(text, now) {
  if (chrono) {
    try { return chrono.parse(text, now, { forwardDate: true }); } catch {}
  }
  return fallbackParse(text, now);
}

const WEEKDAYS_RE = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const MONTHS_RE = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Enough of chrono's behaviour for the phrases people try first:
// "friday 5pm", "tomorrow", "9am", "in 2 hours", "sep 30 noon".
function fallbackParse(text, now) {
  const DAYP = "(today|tonight|tomorrow|(?:next\\s+)?(?:monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thu|friday|fri|saturday|sat|sunday|sun)|(?:jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec)[a-z]*\\s+\\d{1,2})";
  const TIMEP = "((?:at\\s+)?(?:\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)|noon|midnight))";
  const re = new RegExp(`\\bin\\s+(\\d+)\\s*(minutes?|mins?|hours?|hrs?|h|days?|weeks?)\\b|\\b${DAYP}(?:\\s+${TIMEP})?\\b|\\b${TIMEP}(?:\\s+${DAYP})?\\b`, "i");
  const m = re.exec(text);
  if (!m) return [];

  let d;
  if (m[1]) {
    const n = Number(m[1]), unit = m[2].toLowerCase();
    const ms = unit.startsWith("m") ? MIN : unit.startsWith("h") ? 60 * MIN : unit.startsWith("d") ? DAY : 7 * DAY;
    d = new Date(now.getTime() + n * ms);
  } else {
    const dayText = (m[3] || m[6] || "").toLowerCase();
    const timeText = (m[4] || m[5] || "").toLowerCase();
    d = resolveDay(dayText, timeText, now);
  }
  return [{ index: m.index, text: m[0], start: { date: () => d } }];
}

function resolveDay(dayText, timeText, now) {
  const d = new Date(now);
  let [h, mi] = [12, 0];
  if (timeText) {
    const t = timeText.replace(/^at\s+/, "");
    if (t === "noon") [h, mi] = [12, 0];
    else if (t === "midnight") [h, mi] = [0, 0];
    else {
      const tm = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/.exec(t);
      h = Number(tm[1]) % 12 + (tm[3] === "pm" ? 12 : 0);
      mi = Number(tm[2] || 0);
    }
  } else if (dayText === "tonight") [h, mi] = [20, 0];
  d.setHours(h, mi, 0, 0);

  if (!dayText || dayText === "today" || dayText === "tonight") {
    if (!dayText && d <= now) d.setDate(d.getDate() + 1);
    return d;
  }
  if (dayText === "tomorrow") { d.setDate(d.getDate() + 1); return d; }

  const month = MONTHS_RE.findIndex((mo) => dayText.startsWith(mo));
  const monthDay = /\s(\d{1,2})$/.exec(dayText);
  if (month >= 0 && monthDay) {
    d.setMonth(month, Number(monthDay[1]));
    if (d <= now) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  const next = dayText.startsWith("next");
  const key = dayText.replace(/^next\s+/, "").slice(0, 3);
  const target = WEEKDAYS_RE[key];
  let add = (target - now.getDay() + 7) % 7;
  if (add === 0 && d <= now) add = 7;
  if (next && add < 7) add += 7;
  d.setDate(d.getDate() + add);
  return d;
}


// ── Parsing ──────────────────────────────────────────────────────────────────

const MONTHLY = 43200;
const REPEAT_MINUTES = { daily: 1440, weekly: 10080, monthly: MONTHLY };

function extractDeadline(text, now) {
  const r = parseDates(text, now);
  if (!r.length) return { deadline: null, matched: null };
  return { deadline: r[0].start.date(), matched: r[0].text };
}

function extractReminder(text, now) {
  const kw = /\bremind(?:er)?\b/i.exec(text);
  if (!kw) return { reminder: null, matched: null };
  const startIndex = kw.index + kw[0].length;
  const sub = text.slice(startIndex);
  const r = parseDates(sub, now);
  if (!r.length) return { reminder: null, matched: null };
  const gap = sub.slice(0, r[0].index);
  // only filler words between "remind" and the date, so "remind me to call mom friday" keeps its text
  if (!/^\s*(?:me\s+)?(?:(?:at|on|in|for)\s+)?$/i.test(gap)) return { reminder: null, matched: null };
  const end = startIndex + r[0].index + r[0].text.length;
  return { reminder: r[0].start.date(), matched: text.slice(kw.index, end) };
}

function extractPriority(text) {
  const m = text.match(/\b[pP]\d\b/);
  return m ? { priority: m[0].slice(1), matched: m[0] } : { priority: null, matched: null };
}

function extractRepeat(text) {
  const m = /\b(?:repeat(?:\s+(daily|weekly|monthly))?|repeats?|repeating|(daily|weekly|monthly))\b/i.exec(text);
  if (!m) return { repeat: 0, matched: "" };
  const period = (m[1] ?? m[2] ?? "daily").toLowerCase();
  return { repeat: REPEAT_MINUTES[period], matched: m[0] };
}

function extractTags(text) {
  const seen = new Set(), tags = [];
  for (const [, tag] of text.matchAll(/#(\w+)/g)) {
    if (seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  return tags.slice(0, 2);
}

const removeFirst = (text, part) => (part ? text.replace(part, "") : text);

function extractCommands(text, now) {
  const reminder = extractReminder(text, now);
  let cleaned = removeFirst(text, reminder.matched);
  const deadline = extractDeadline(cleaned, now);
  cleaned = removeFirst(cleaned, deadline.matched);
  const priority = extractPriority(text);
  cleaned = removeFirst(cleaned, priority.matched);
  const tags = extractTags(text);
  for (const tag of tags) cleaned = cleaned.replace(new RegExp(`#${tag}\\b`, "gi"), "");
  const repeat = deadline.matched ? extractRepeat(cleaned) : { repeat: 0, matched: "" };
  cleaned = removeFirst(cleaned, repeat.matched);
  return { reminder, deadline, priority, tags, repeat, cleaned };
}

function parseTodo(text, now) {
  const c = extractCommands(text, now);
  const clean = c.cleaned.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return {
    text: clean,
    deadline: c.deadline.deadline,
    remindAt: c.reminder.reminder,
    priority: c.priority.priority,
    repeat: c.repeat.repeat,
    tags: c.tags,
  };
}

// Where each command sits in the text, and what kind it is. Drives the
// highlighting in the field and ⌥← ⌥→ ⌥⌫.
function findCommands(text, now) {
  const c = extractCommands(text, now);
  const ranges = [];
  const isWord = (ch) => ch !== undefined && /\w/.test(ch);
  const place = (part, kind) => {
    if (!part) return;
    for (let s = text.indexOf(part); s !== -1; s = text.indexOf(part, s + 1)) {
      const e = s + part.length;
      if (!isWord(text[s - 1]) && !isWord(text[e]) && ranges.every((r) => e <= r.start || s >= r.end)) {
        ranges.push({ start: s, end: e, kind });
        return;
      }
    }
  };
  place(c.reminder.matched, "reminder");
  place(c.deadline.matched, "deadline");
  place(c.priority.matched, "priority");
  place(c.repeat.matched, "repeat");
  const tags = new Set(c.tags.map((t) => t.toLowerCase()));
  for (const m of text.matchAll(/#(\w+)/g)) {
    if (tags.has(m[1].toLowerCase())) ranges.push({ start: m.index, end: m.index + m[0].length, kind: "tag" });
  }
  return ranges.sort((a, b) => a.start - b.start);
}


// ── Time display ───────────────────────────────────────────────────────────

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function timeLeft(now, deadline) {
  const totalMinutes = Math.floor((deadline - now) / MIN);
  const totalDays = Math.round((startOfDay(deadline) - startOfDay(now)) / DAY);
  const minutes = totalMinutes % 60;
  if (deadline <= now) return { text: "overdue", type: "deadline0" };
  if (totalMinutes < 60) return { text: `in ${totalMinutes}min`, type: "deadline1" };
  if (totalMinutes < 120) return { text: minutes === 0 ? "in 1h" : `in 1h ${minutes}min`, type: "deadline2" };
  if (totalMinutes < 1440) return { text: `in ${Math.ceil(totalMinutes / 60)}h`, type: "deadline3" };
  if (totalDays < 7) return { text: `in ${totalDays}d`, type: "deadline4" };
  return { text: `in ${Math.floor(totalDays / 7)}w`, type: "deadline5" };
}

function formatTime(d) {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")}${d.getHours() < 12 ? "am" : "pm"}`;
}

function formatDayAndTime(d, now) {
  const days = (startOfDay(d) - startOfDay(now)) / DAY;
  const day = days >= 0 && days < 7 ? WD[d.getDay()] : `${MO[d.getMonth()]} ${d.getDate()}`;
  return `${day} ${formatTime(d)}`;
}

const repeatLabel = (m) => ({ 1440: "daily", 10080: "weekly", [MONTHLY]: "monthly" }[m] ?? `every ${m} min`);


// ── State ────────────────────────────────────────────────────────────────────

let nextId = 1;
const now0 = new Date();
const at = (days, h, m = 0) => { const d = new Date(now0); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d; };
const inMin = (n) => new Date(now0.getTime() + n * MIN);

function makeTodo(fields) {
  return { id: nextId++, text: "", deadline: null, remindAt: null, priority: null, repeat: 0, tags: [], completed: false, pinned: false, createdAt: new Date(Date.now() - nextId * 1000), ...fields };
}

const todos = [
  makeTodo({ text: "sam's birthday dinner", deadline: inMin(45), priority: "1" }),
  makeTodo({ text: "call mom", deadline: at(2, 19) }),
  makeTodo({ text: "pay rent", deadline: at(3, 17), repeat: 10080 }),
];

const isOverdue = (t, now) => !t.completed && t.deadline && t.deadline <= now;
const prank = (p) => (p ? Number(p) : Infinity);
const drank = (d) => (d ? d.getTime() : Infinity);

function compareTodos(a, b, now) {
  return (
    Number(b.pinned) - Number(a.pinned) ||
    Number(a.completed) - Number(b.completed) ||
    Number(isOverdue(b, now)) - Number(isOverdue(a, now)) ||
    prank(a.priority) - prank(b.priority) ||
    drank(a.deadline) - drank(b.deadline) ||
    b.createdAt - a.createdAt
  );
}

function groupTodos(list, view, now) {
  const sorted = [...list].sort((a, b) => compareTodos(a, b, now));
  const COMPLETED = { key: "completed", title: "Completed", order: 1000 };
  const ordered = (place) => {
    const groups = new Map();
    for (const t of sorted) {
      const { key, title, order } = place(t);
      const g = groups.get(key) ?? { key, title, order, todos: [] };
      g.todos.push(t);
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => a.order - b.order);
  };

  if (view === "all") return [{ key: "all", title: null, todos: sorted }];

  if (view === "priority") return ordered((t) => {
    if (t.pinned) return { key: "pinned", title: "Pinned", order: -2 };
    if (t.completed) return COMPLETED;
    if (isOverdue(t, now)) return { key: "overdue", title: "Overdue", order: -1 };
    const r = prank(t.priority);
    return r === Infinity ? { key: "none", title: "No priority", order: 100 } : { key: `p${r}`, title: `Priority ${r}`, order: r };
  });

  if (view === "day") {
    const today = startOfDay(now);
    const daysLeftInWeek = 7 - (((now.getDay() + 6) % 7) + 1);
    return ordered((t) => {
      if (t.completed && !t.pinned) return COMPLETED;
      if (isOverdue(t, now)) return { key: "overdue", title: "Overdue", order: 0 };
      if (!t.deadline) return { key: "none", title: "No deadline", order: 6 };
      const days = Math.round((startOfDay(t.deadline) - today) / DAY);
      if (days < 0) return { key: "earlier", title: "Earlier", order: 7 };
      if (days === 0) return { key: "today", title: "Today", order: 1 };
      if (days === 1) return { key: "tomorrow", title: "Tomorrow", order: 2 };
      if (days <= daysLeftInWeek) return { key: "this-week", title: "This Week", order: 3 };
      if (days <= daysLeftInWeek + 7) return { key: "next-week", title: "Next Week", order: 4 };
      return { key: "later", title: "Later", order: 5 };
    });
  }

  // tags
  const groups = new Map(), untagged = [], done = [];
  for (const t of sorted) {
    if (t.completed && !t.pinned) { done.push(t); continue; }
    if (!t.tags.length) untagged.push(t);
    for (const tag of t.tags) {
      const key = `tag-${tag.toLowerCase()}`;
      const g = groups.get(key) ?? { key, title: `#${tag}`, todos: [] };
      g.todos.push(t);
      groups.set(key, g);
    }
  }
  return [
    ...[...groups.values()].sort((a, b) => a.key.localeCompare(b.key)),
    ...(untagged.length ? [{ key: "untagged", title: "No tags", todos: untagged }] : []),
    ...(done.length ? [{ key: "completed", title: "Completed", todos: done }] : []),
  ];
}


// ── Row (the app's TodoItem) ─────────────────────────────────────────────────

const ICON = {
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>',
};

function rowHTML(t, now, { focus = false, fresh = false, interactive = true } = {}) {
  const deadline = !t.completed && t.deadline ? timeLeft(now, t.deadline) : null;
  const reminder = t.remindAt ? { text: formatDayAndTime(t.remindAt, now), sent: t.remindAt <= now } : null;
  const repeat = t.deadline && t.repeat ? `${formatTime(t.deadline)} ${repeatLabel(t.repeat)}` : null;
  const icons = [t.pinned && ICON.pin, reminder && ICON.bell, repeat && ICON.repeat].filter(Boolean).join("");
  const label = t.completed ? "Mark todo incomplete" : "Mark todo complete";
  return `
    <div class="row${t.completed ? " done" : ""}${focus ? " focus" : ""}${fresh ? " new" : ""}" data-id="${t.id}">
      <span class="prio p${t.priority || 0}"></span>
      <button type="button" class="check${t.completed ? " on" : ""}" ${interactive ? 'data-act="toggle"' : 'tabindex="-1"'} aria-label="${label}"></button>
      <div class="row-body">
        <div class="row-main">
          <div class="row-text" ${interactive ? 'data-act="edit"' : ""}>${esc(t.text)}</div>
          <div class="meta">
            ${icons ? `<span class="icons">${icons}</span>` : ""}
            ${t.tags.map((tag) => `<span class="tag">#${esc(tag)}</span>`).join("")}
            ${deadline ? `<span class="badge ${deadline.type}">${deadline.text}</span>` : ""}
          </div>
        </div>
        ${reminder || repeat ? `<div class="details"><div>
          ${reminder ? `<span>Reminder${reminder.sent ? " sent" : ""}: ${reminder.text}</span>` : ""}
          ${repeat ? `<span>Repeat: ${repeat}</span>` : ""}
        </div></div>` : ""}
      </div>
      ${interactive ? `<button type="button" class="del" data-act="del" aria-label="Delete todo">×</button>` : ""}
    </div>`;
}


// ── The panel ────────────────────────────────────────────────────────────────

const stage = $("#stage");
const panel = $("#panel");
const field = $("#field");
const ghost = $("#fieldGhost");
const list = $("#list");
const tray = $("#tray");

let panelView = "day";
let focusIdx = -1;        // highlighted row in the panel list, -1 = the field
let order = [];           // ids in display order (a todo can appear twice in Tags)
let freshId = null;
let editingId = null;
const deleted = [];

function panelOpen() { return !panel.classList.contains("hidden"); }

function showPanel(focus) {
  panel.classList.remove("hidden");
  stage.classList.add("panel-open");
  tray.classList.add("on");
  if (focus) field.focus({ preventScroll: true });
}

function hidePanel() {
  if (panel.contains(document.activeElement)) document.activeElement.blur();
  panel.classList.add("hidden");
  stage.classList.remove("panel-open");
  tray.classList.remove("on");
  focusIdx = -1;
  renderList();
}

// ⌘⇧K: from anywhere on the page, like from anywhere on your Mac.
function summon() {
  cancelScript();
  if (panelOpen() && isStageVisible()) { hidePanel(); return; }
  if (!isStageVisible()) stage.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  showPanel(true);
}

let stageVisible = true;
new IntersectionObserver(([e]) => { stageVisible = e.intersectionRatio > 0.5; }, { threshold: [0, 0.5, 1] }).observe(stage);
const isStageVisible = () => stageVisible;

// The typed text with each command highlighted in its colour.
function ghostHTML(text) {
  const ranges = findCommands(text, new Date());
  let html = "", i = 0;
  for (const r of ranges) {
    html += esc(text.slice(i, r.start)) + `<span class="hl k-${r.kind}">${esc(text.slice(r.start, r.end))}</span>`;
    i = r.end;
  }
  return html + esc(text.slice(i));
}

function renderGhost() {
  ghost.innerHTML = field.value ? ghostHTML(field.value) : "";
  ghost.scrollLeft = field.scrollLeft;
}

function renderList() {
  const now = new Date();
  const groups = groupTodos(todos, panelView, now);
  order = [];
  let html = "";
  for (const g of groups) {
    if (g.title && groups.length > 0) html += `<div class="group-title">${esc(g.title)} <span>${g.todos.length}</span></div>`;
    for (const t of g.todos) {
      const idx = order.length;
      order.push(t.id);
      html += rowHTML(t, now, { focus: idx === focusIdx, fresh: t.id === freshId });
    }
  }
  list.innerHTML = html || `<p class="fine" style="padding:8px">Nothing left. Type a todo above.</p>`;
  freshId = null;
  const focused = $(".row.focus", list);
  if (focused) keepVisible(list, focused);
  updateBadge();
}

function keepVisible(container, el) {
  const top = el.offsetTop - 30, bottom = el.offsetTop + el.offsetHeight - container.clientHeight + 50;
  if (container.scrollTop > top) container.scrollTop = top;
  else if (container.scrollTop < bottom) container.scrollTop = bottom;
}

function updateBadge() {
  const n = todos.filter((t) => isOverdue(t, new Date())).length;
  $("#trayBadge").textContent = n ? String(n) : "";
}

function addFromText(text) {
  const parsed = parseTodo(text, new Date());
  if (!parsed) return null;
  if (editingId) {
    const t = todos.find((x) => x.id === editingId);
    Object.assign(t, parsed);
    freshId = t.id;
    editingId = null;
    renderAll();
    return t;
  }
  const t = makeTodo({ ...parsed, createdAt: new Date() });
  todos.push(t);
  freshId = t.id;
  renderAll();
  list.scrollTop = 0;
  return t;
}

// Text for editing: the todo's text with its commands moved to the end, as the app does.
function editableText(t) {
  const d = t.deadline ? `${MO[t.deadline.getMonth()].toLowerCase()} ${t.deadline.getDate()} ${formatTime(t.deadline)}` : "";
  const r = t.remindAt ? `remind ${MO[t.remindAt.getMonth()].toLowerCase()} ${t.remindAt.getDate()} ${formatTime(t.remindAt)}` : "";
  return [t.text, d, r, t.priority ? `p${t.priority}` : "", t.deadline && t.repeat ? repeatLabel(t.repeat) : "", ...t.tags.map((x) => `#${x}`)].filter(Boolean).join(" ");
}

function startEditing(id) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  editingId = id;
  field.value = editableText(t);
  focusIdx = -1;
  renderList();
  renderGhost();
  field.focus({ preventScroll: true });
}

function toggle(id) {
  const t = todos.find((x) => x.id === id);
  if (t) { t.completed = !t.completed; renderAll(); }
}

function remove(id) {
  const i = todos.findIndex((x) => x.id === id);
  if (i < 0) return;
  deleted.push(todos.splice(i, 1)[0]);
  focusIdx = Math.min(focusIdx, order.length - 2);
  renderAll();
}

function togglePin(id) {
  const t = todos.find((x) => x.id === id);
  if (t) { t.pinned = !t.pinned; renderAll(); }
}

field.addEventListener("input", () => { cancelScript(); renderGhost(); });
field.addEventListener("scroll", () => { ghost.scrollLeft = field.scrollLeft; });

field.addEventListener("keydown", (e) => {
  const text = field.value;
  const caret = field.selectionStart;

  if (e.key === "Enter") {
    e.preventDefault();
    if (addFromText(text)) { field.value = ""; renderGhost(); }
    else field.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }], { duration: 220 });
    return;
  }

  if (e.key === "ArrowDown" && order.length) {
    e.preventDefault();
    focusIdx = 0;
    list.focus({ preventScroll: true });
    renderList();
    return;
  }

  // ⌥← ⌥→ jump over a command, ⌥⌫ deletes it (as in the app).
  if (e.altKey && field.selectionStart === field.selectionEnd) {
    const ranges = findCommands(text, new Date());
    if (e.key === "ArrowLeft") {
      const r = ranges.find((r) => caret > r.start && caret <= r.end + 1 && text.slice(r.end, caret).trim() === "");
      if (r) { e.preventDefault(); field.setSelectionRange(r.start, r.start); }
    } else if (e.key === "ArrowRight") {
      const r = ranges.find((r) => caret >= r.start - 1 && caret < r.end && text.slice(caret, r.start).trim() === "");
      if (r) { e.preventDefault(); field.setSelectionRange(r.end, r.end); }
    } else if (e.key === "Backspace") {
      const r = ranges.find((r) => caret > r.start && caret <= r.end + 1 && text.slice(r.end, caret).trim() === "");
      if (r) {
        e.preventDefault();
        const before = text.slice(0, r.start).replace(/\s+$/, "");
        const after = text.slice(caret);
        field.value = before + (after && before ? " " : "") + after.replace(/^\s+/, "");
        field.setSelectionRange(before.length, before.length);
        renderGhost();
      }
    }
  }

  // Tab completes a tag you've used before.
  if (e.key === "Tab") {
    const word = /#(\w*)$/.exec(text.slice(0, caret));
    if (word) {
      const known = [...new Set(todos.flatMap((t) => t.tags))];
      const match = known.find((tag) => tag.toLowerCase().startsWith(word[1].toLowerCase()) && tag.length > word[1].length);
      if (match) {
        e.preventDefault();
        field.value = text.slice(0, caret - word[1].length) + match + " " + text.slice(caret);
        const pos = caret - word[1].length + match.length + 1;
        field.setSelectionRange(pos, pos);
        renderGhost();
      }
    }
  }
});

list.addEventListener("keydown", (e) => {
  if (focusIdx < 0 || !order.length) return;
  const id = order[focusIdx];
  const mod = e.metaKey || e.ctrlKey;
  if (e.key === "ArrowDown") { e.preventDefault(); focusIdx = Math.min(order.length - 1, focusIdx + 1); renderList(); }
  else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (focusIdx === 0) { focusIdx = -1; renderList(); field.focus({ preventScroll: true }); }
    else { focusIdx -= 1; renderList(); }
  }
  else if (e.key === " ") { e.preventDefault(); toggle(id); }
  else if (e.key === "Enter") { e.preventDefault(); startEditing(id); }
  else if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); remove(id); }
  else if (mod && e.key.toLowerCase() === "p") { e.preventDefault(); togglePin(id); }
  else if (mod && e.key.toLowerCase() === "z" && deleted.length) { e.preventDefault(); todos.push(deleted.pop()); renderAll(); }
});

list.addEventListener("click", (e) => {
  const row = e.target.closest(".row");
  if (!row) return;
  cancelScript();
  const id = Number(row.dataset.id);
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "toggle") toggle(id);
  else if (act === "del") remove(id);
  else if (act === "edit") startEditing(id);
});

list.addEventListener("mousemove", (e) => {
  // the mouse takes the highlight back from the keyboard, as in the app
  if (focusIdx >= 0 && e.target.closest(".row")) { focusIdx = -1; $$(".row.focus", list).forEach((r) => r.classList.remove("focus")); }
});

panel.addEventListener("focusin", cancelScript);
panel.addEventListener("pointerdown", cancelScript);

panel.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    if (editingId) { editingId = null; field.value = ""; renderGhost(); return; }
    hidePanel();
  }
});

$$(".view-tab").forEach((tab) => tab.addEventListener("click", () => {
  panelView = tab.dataset.view;
  $$(".view-tab").forEach((t) => t.classList.toggle("active", t === tab));
  focusIdx = -1;
  renderList();
}));

tray.addEventListener("click", summon);
$("#summon").addEventListener("click", () => { cancelScript(); if (panelOpen()) hidePanel(); else showPanel(true); });
$("#panelClose").addEventListener("click", () => { cancelScript(); hidePanel(); });
$("#tryIt").addEventListener("click", () => {
  cancelScript();
  stage.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  showPanel(true);
});


// ── The conversation: something comes up, Chalk takes it, the chat goes on ──

const chat = $("#chat");
const compose = $("#composeText");
const replayBtn = $("#replay");

const reading = $("#reading");
const heroNotif = $("#heroNotif");
const readingMark = $("#readingMark");

// Already in the chat before the scene starts.
const EARLIER = [
  { them: "have you started the reading for thursday?" },
  { me: "doing it now" },
];

const SCRIPT = [
  { read: true },
  { chalk: "cite mill fines in essay thursday", speed: 22 },
  { raise: true },
  { them: "wait, did you see Benjamin moved the lab report deadline?" },
  { me: "no?? to when" },
  { them: '<span class="said">friday 5pm</span>. and the draft is due <span class="said">thursday night</span>' },
  { chalk: "lab report friday 5pm remind thursday 7pm" },
  { me: "ugh ok, thanks" },
  { notify: "sam's birthday dinner" },
  { me: "wait, sam's birthday dinner is tonight. you're coming right?" },
  { them: "omg. i completely forgot" },
  { them: "what time??" },
  { me: "starts in under an hour. i'll save you a seat" },
  { them: "how do you remember everything" },
  { me: "i don't. chalk does" },
];

let scriptToken = 0;
let scriptRunning = false;
let scriptAdded = new Set();

class Cancelled extends Error {}
const sleep = (ms, token) => new Promise((resolve, reject) => setTimeout(() => (token === scriptToken ? resolve() : reject(new Cancelled())), ms));

function timeStamp() {
  const d = new Date(Date.now() - 3 * MIN);
  return `Today ${formatTime(d).replace(/(am|pm)$/, (m) => " " + m.toUpperCase())}`;
}

function scrollReadingTo(y, duration, token) {
  const from = reading.scrollTop, to = Math.max(0, Math.min(y, reading.scrollHeight - reading.clientHeight));
  const start = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  return new Promise((resolve, reject) => {
    const step = (time) => {
      if (token !== scriptToken) return reject(new Cancelled());
      const t = Math.min(1, (time - start) / duration);
      reading.scrollTop = from + (to - from) * ease(t);
      if (t < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}

function resetScene() {
  chat.innerHTML = `<div class="msg-time">${timeStamp()}</div>`;
  EARLIER.forEach((step) => appendMessage(step, false));
  reading.scrollTop = 0;
  readingMark.classList.remove("on");
  stage.classList.remove("chat-front");
  heroNotif.classList.remove("on");
}

function appendMessage(step, animate = true) {
  const el = document.createElement("div");
  el.className = `msg${step.me ? " me" : ""}`;
  if (!animate) el.style.animation = "none";
  el.innerHTML = step.me ? esc(step.me) : step.them;
  chat.appendChild(el);
  return el;
}

async function typeInto(setter, text, token, speed) {
  for (let i = 1; i <= text.length; i++) {
    setter(text.slice(0, i));
    await sleep(speed + Math.random() * speed * 0.9 + (text[i - 1] === " " ? speed : 0), token);
  }
}

async function runScript() {
  const token = ++scriptToken;
  scriptRunning = true;
  scriptAdded = new Set();
  replayBtn.hidden = true;
  resetScene();
  compose.textContent = "Message";
  compose.parentElement.classList.remove("typed");
  hidePanel();

  try {
    await sleep(600, token);
    for (const step of SCRIPT) {
      if (step.read) {
        // reading along, until the line the essay needs
        await scrollReadingTo(readingMark.offsetTop - reading.clientHeight * 0.3, 1400, token);
        await sleep(200, token);
        readingMark.classList.add("on");
        await sleep(800, token);
      } else if (step.notify) {
        // a deadline is coming up: Chalk's alert slides in over everything
        const t = todos.find((x) => x.text === step.notify && !x.completed && x.deadline);
        if (t) {
          $("#heroNotifTitle").textContent = t.text;
          $("#heroNotifText").textContent = `Due ${timeLeft(new Date(), t.deadline).text}`;
          heroNotif.classList.add("on");
          await sleep(2800, token);
          heroNotif.classList.remove("on");
          await sleep(600, token);
        }
      } else if (step.raise) {
        // a message comes in; the chat comes to the front
        stage.classList.add("chat-front");
        await sleep(500, token);
      } else if (step.them) {
        const typing = document.createElement("div");
        typing.className = "msg";
        typing.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
        typing.style.padding = "0";
        chat.appendChild(typing);
        await sleep(900 + Math.random() * 500, token);
        typing.remove();
        appendMessage(step);
        await sleep(700, token);
      } else if (step.me) {
        compose.parentElement.classList.add("typed");
        await typeInto((s) => { compose.textContent = s; }, step.me, token, 34);
        await sleep(250, token);
        compose.textContent = "Message";
        compose.parentElement.classList.remove("typed");
        appendMessage(step);
        await sleep(800, token);
      } else if (step.chalk) {
        // the moment: light up what matters, press ⌘⇧K, write it, back to the chat
        $$(".msg:last-child .said", chat).forEach((s) => s.classList.add("lit"));
        await sleep(stage.classList.contains("chat-front") ? 650 : 200, token);
        showPanel(false);
        await sleep(450, token);
        await typeInto((s) => { field.value = s; field.scrollLeft = field.scrollWidth; renderGhost(); }, step.chalk, token, step.speed ?? 30);
        await sleep(500, token);
        addFromText(step.chalk);
        scriptAdded.add(step.chalk);
        field.value = "";
        renderGhost();
        await sleep(900, token);
        hidePanel();
        await sleep(500, token);
      }
    }
    replayBtn.hidden = false;
  } catch (err) {
    if (!(err instanceof Cancelled)) throw err;
  } finally {
    if (token === scriptToken) scriptRunning = false;
  }
}

// Someone wants to try it themselves: finish the conversation at once.
function cancelScript() {
  if (!scriptRunning) return;
  scriptToken++;
  scriptRunning = false;
  field.value = "";
  renderGhost();
  resetScene();
  readingMark.classList.add("on");
  reading.scrollTop = readingMark.offsetTop - reading.clientHeight * 0.3;
  stage.classList.add("chat-front");
  for (const step of SCRIPT) {
    if (step.read || step.raise || step.notify) continue;
    if (step.chalk) {
      if (!scriptAdded.has(step.chalk)) { addFromText(step.chalk); scriptAdded.add(step.chalk); }
      $$(".msg:last-child .said", chat).forEach((s) => s.classList.add("lit"));
    } else appendMessage(step, false);
  }
  compose.textContent = "Message";
  compose.parentElement.classList.remove("typed");
  replayBtn.hidden = false;
}

replayBtn.addEventListener("click", () => {
  // put the demo todos back the way they were, then play it again
  for (const text of scriptAdded) {
    const parsed = parseTodo(text, new Date());
    const i = todos.findIndex((t) => parsed && t.text === parsed.text);
    if (i >= 0) todos.splice(i, 1);
  }
  renderAll();
  runScript();
});


// ── Anatomy of one line ─────────────────────────────────────────────────────

const anatomy = $("#anatomy");
function renderAnatomy() {
  const parsed = parseTodo("problem set 5 monday 9am remind sunday 8pm p2 #math", new Date());
  $("#anatomyRow").innerHTML = rowHTML(makeTodo(parsed), new Date(), { focus: true, interactive: false });
}
$$(".a-cmd", anatomy).forEach((el) => {
  el.addEventListener("mouseenter", () => {
    anatomy.classList.add("focusing");
    $$(`[data-k="${el.dataset.k}"]`, anatomy).forEach((x) => x.classList.add("lit"));
  });
  el.addEventListener("mouseleave", () => {
    anatomy.classList.remove("focusing");
    $$(".lit", anatomy).forEach((x) => x.classList.remove("lit"));
  });
});


function renderAll() { renderList(); }


// ── A week with Chalk: one day per slide ────────────────────────────────────

const weekTrack = $("#weekTrack");
const weekSlides = $$(".week-slide", weekTrack);
const weekDays = $$(".week-day");
const weekArrows = $$(".week-arrow");
let weekIdx = -1;

const WEEK_SLIDE_MS = 1000;
const slideX = (el) => el.offsetLeft - weekSlides[0].offsetLeft;
let weekAnim = 0;         // bumps to cancel a slide in progress

// A slow, eased slide. Snapping is off while it runs, or the browser would
// pull each frame back to the nearest day.
function glideTo(x, done) {
  const token = ++weekAnim;
  const from = weekTrack.scrollLeft, start = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  weekTrack.style.scrollSnapType = "none";
  const step = (time) => {
    if (token !== weekAnim) return;
    const t = Math.min(1, (time - start) / WEEK_SLIDE_MS);
    weekTrack.scrollLeft = from + (x - from) * ease(t);
    if (t < 1) return requestAnimationFrame(step);
    done?.();
    weekTrack.style.scrollSnapType = "";
    weekAnim = 0;
  };
  requestAnimationFrame(step);
}

function showDay(i, { wrap = false } = {}) {
  i = Math.max(0, Math.min(weekSlides.length - 1, i));
  setDay(i);
  if (reduceMotion) { weekTrack.scrollLeft = slideX(weekSlides[i]); return; }
  if (!wrap) { glideTo(slideX(weekSlides[i])); return; }
  // From the last day back to the first, keep going forward into a copy of
  // the first day, then swap the real one in where nobody can see the seam.
  const copy = weekSlides[0].cloneNode(true);
  copy.inert = true;
  copy.setAttribute("aria-hidden", "true");
  $$("[id]", copy).concat(copy).forEach((el) => el.removeAttribute("id"));
  weekTrack.appendChild(copy);
  glideTo(slideX(copy), () => { weekTrack.scrollLeft = 0; copy.remove(); });
}

// After a swipe, whichever day ended up in view is the current one.
function syncWeek() {
  if (weekAnim) return;
  const x = weekTrack.scrollLeft;
  const i = weekSlides.reduce((best, s, j) => (Math.abs(slideX(s) - x) < Math.abs(slideX(weekSlides[best]) - x) ? j : best), 0);
  setDay(i);
}

function setDay(i) {
  if (i === weekIdx) return;
  weekIdx = i;
  weekDays.forEach((b, j) => { b.setAttribute("aria-selected", String(j === i)); b.tabIndex = j === i ? 0 : -1; });
  weekSlides.forEach((s, j) => s.toggleAttribute("inert", j !== i));
  weekArrows[0].disabled = i === 0;
  weekArrows[1].disabled = i === weekSlides.length - 1;
  markWeek();
}

// the day's highlight sweeps in once the week is on screen and that day is showing
const week = $("#one-line");
let weekSeen = false;
function markWeek() {
  if (weekSeen && weekIdx >= 0) $$("mark.hi", weekSlides[weekIdx]).forEach((m) => m.classList.add("on"));
}
// off screen, the progress line holds still, so nobody misses a day
week.classList.add("offscreen");
new IntersectionObserver(([e]) => {
  week.classList.toggle("offscreen", !e.isIntersecting);
  if (e.isIntersecting) { weekSeen = true; markWeek(); }
}, { rootMargin: "0px 0px -25% 0px" }).observe(weekTrack);

// when the line under the day fills up, turn to the next day (and round again)
$(".week-days").addEventListener("animationend", (e) => {
  if (e.animationName !== "week-progress") return;
  const last = weekIdx === weekSlides.length - 1;
  showDay(last ? 0 : weekIdx + 1, { wrap: last });
});

// Sunday: a list drawn with the panel's own rows
function listHTML(items, view, now) {
  return groupTodos(items, view, now).map((g) =>
    (g.title ? `<div class="group-title">${esc(g.title)} <span>${g.todos.length}</span></div>` : "") +
    g.todos.map((t, i) => rowHTML(t, now, { interactive: false, focus: view === "day" && i === 0 && g.key === "tomorrow" })).join("")
  ).join("");
}

function renderWeekLists() {
  const now = new Date();
  // a Sunday evening, wherever this week is
  const sun = new Date(now);
  sun.setDate(sun.getDate() + ((7 - sun.getDay()) % 7));
  sun.setHours(20, 0, 0, 0);
  const on = (days, h, m = 0) => { const d = new Date(sun); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d; };
  $("#sundayList").innerHTML = listHTML([
    makeTodo({ text: "problem set 5", deadline: on(1, 9), remindAt: on(0, 20), priority: "2", tags: ["math"] }),
    makeTodo({ text: "read chapter 7 for seminar", deadline: on(3, 9), priority: "2", tags: ["hist"] }),
    makeTodo({ text: "pay rent", deadline: on(5, 17), remindAt: on(5, 9), priority: "1", repeat: 10080, tags: ["home"] }),
    makeTodo({ text: "lab report", completed: true, tags: ["bio"] }),
  ], "day", sun);
}

let weekScrollTimer;
weekTrack.addEventListener("scroll", () => { clearTimeout(weekScrollTimer); weekScrollTimer = setTimeout(syncWeek, 60); }, { passive: true });
weekDays.forEach((b) => b.addEventListener("click", () => showDay(Number(b.dataset.slide))));
weekArrows.forEach((b) => b.addEventListener("click", () => showDay(weekIdx + Number(b.dataset.step))));
$(".week-days").addEventListener("keydown", (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  e.preventDefault();
  const i = Math.max(0, Math.min(weekSlides.length - 1, weekIdx + (e.key === "ArrowLeft" ? -1 : 1)));
  showDay(i);
  weekDays[i].focus({ preventScroll: true });
});
addEventListener("resize", () => { const i = weekIdx; weekIdx = -1; weekTrack.scrollLeft = weekSlides[i].offsetLeft - weekSlides[0].offsetLeft; syncWeek(); });
syncWeek();


// ── Scratchpad: a real one, saved in this browser ───────────────────────────

const padText = $("#padText");
const padSaved = $("#padSaved");
padText.value = store("chalk-site-scratchpad") ?? "room 4.12, tues office hours\nask sam about swapping lab partners\n";
let padTimer;
padText.addEventListener("input", () => {
  clearTimeout(padTimer);
  padSaved.textContent = "";
  padTimer = setTimeout(() => { store("chalk-site-scratchpad", padText.value); padSaved.textContent = "Saved"; }, 400);
});


// ── Shortcuts (the full list, folded away near the end) ─────────────────────

const KEY_GROUPS = [
  ["Anywhere on your Mac", [[["⌘⇧K"], "Open or hide Chalk"], [["⌘⇧J"], "Open Chalk on the scratchpad"]]],
  ["Todos", [[["↑", "↓"], "Move between todos"], [["↵"], "Edit"], [["Space"], "Complete"], [["⌘P"], "Pin to the top"], [["⌘D"], "Delete"], [["⌘Z"], "Undo delete"]]],
  ["Moving around", [[["⌥↑", "⌥↓"], "Jump between sections"], [["⌘1", "⌘2", "⌘3", "⌘4"], "All, Day, Priority, Tags"], [["⌘K"], "Search"]]],
  ["App", [[["⌘J"], "Show or hide the scratchpad"], [["⌘S"], "Settings"], [["⌘H"], "Help"], [["⌘+", "⌘−", "⌘0"], "Font size up, down, reset"], [["Esc"], "Close what's open, then hide Chalk"]]],
];

$("#keysTable").innerHTML = KEY_GROUPS.map(([title, rows]) => `
  <div class="kgroup"><h3>${title}</h3>
    ${rows.map(([combos, label]) => `<div class="krow" data-combos="${combos.join(" ")}"><span>${label}</span><span class="kk">${combos.map((c) => `<kbd>${c}</kbd>`).join(" ")}</span></div>`).join("")}
  </div>`).join("");

// ── Rail and menu bar: where am I ───────────────────────────────────────────

const sections = $$("[data-rail]");
const rail = $("#rail");
rail.innerHTML = sections.map((s) => `<a class="rail-item" href="#${s.id}"><span class="rail-mark"></span><span class="rail-label">${s.dataset.rail}</span></a>`).join("");
const railItems = $$(".rail-item", rail);
const menuLinks = $$(".mb-menu a");
let currentSection = 0;

const sectionIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    currentSection = sections.indexOf(e.target);
    railItems.forEach((r, i) => r.classList.toggle("active", i === currentSection));
    menuLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
  }
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => sectionIO.observe(s));

function jumpSection(delta) {
  const i = Math.max(0, Math.min(sections.length - 1, currentSection + delta));
  sections[i].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}


// ── Global keys ─────────────────────────────────────────────────────────────

const isEditable = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

document.addEventListener("keydown", (e) => {
  const mod = e.metaKey || e.ctrlKey;
  const k = e.code;

  if (mod && e.shiftKey && k === "KeyK") { e.preventDefault(); summon(); return; }

  if (e.key === "Escape" && !panel.contains(document.activeElement) && panelOpen() && isStageVisible() && !isEditable(document.activeElement)) {
    hidePanel();
  }

  if (e.altKey && !mod && (e.key === "ArrowUp" || e.key === "ArrowDown") && !isEditable(document.activeElement) && !panel.contains(document.activeElement)) {
    e.preventDefault();
    jumpSection(e.key === "ArrowUp" ? -1 : 1);
  }

});


// ── Appearance, clock, copy ─────────────────────────────────────────────────

function applyTheme(choice) {
  if (choice === "light" || choice === "dark") document.documentElement.dataset.theme = choice;
  else delete document.documentElement.dataset.theme;
  store("chalk-site-theme", choice === "system" ? null : choice);
  $$("[data-theme-choice]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.themeChoice === choice)));
}
applyTheme(store("chalk-site-theme") || "system");
$$("[data-theme-choice]").forEach((b) => b.addEventListener("click", () => applyTheme(b.dataset.themeChoice)));

function tickClock() {
  const d = new Date();
  $("#clock").textContent = `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}  ${formatTime(d).replace(/(am|pm)$/, (m) => " " + m.toUpperCase())}`;
}
tickClock();
setInterval(() => { tickClock(); updateBadge(); }, 20_000);

$$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#" + b.dataset.copy).textContent);
    b.textContent = "Copied";
  } catch { b.textContent = "Select it"; }
  setTimeout(() => (b.textContent = "Copy"), 1600);
}));


// ── Scroll reveals, the drawn detour, the highlighter fallback ──────────────

$$(".sec .head, .quick-steps, .anatomy, .install, .faq").forEach((el) => el.classList.add("reveal"));

const scrollTimelines = CSS.supports("animation-timeline: view()") && !reduceMotion;
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add(e.target.matches(".detour") ? "drawn" : e.target.matches("mark.hi") ? "on" : e.target.matches(".pad") ? "in" : "in");
    revealIO.unobserve(e.target);
  }
}, { rootMargin: "0px 0px -18% 0px" });
$$(".reveal, .pad").forEach((el) => revealIO.observe(el));
if (!scrollTimelines) $$("mark.hi").forEach((el) => revealIO.observe(el));



// ── Start ───────────────────────────────────────────────────────────────────

function refreshAfterChrono() { renderGhost(); renderAnatomy(); }

renderAll();
renderAnatomy();
renderWeekLists();
resetScene();
panel.classList.add("hidden");

if (reduceMotion) {
  scriptRunning = true;
  cancelScript();
  showPanel(false);
} else {
  scriptRunning = true; // so early interaction can cancel before the first message
  (document.fonts?.ready ?? Promise.resolve()).then(() => { if (scriptRunning) runScript(); });
}

})();
