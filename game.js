"use strict";

const TARGET_MIN = 1;
const TARGET_MAX = 120;
const STORAGE_KEY = "math-card-120-mvp-v1";
const RULE_VERSION = 4;
const MAX_ABS = 100000000n;
const MAX_EXPONENT = 13n;
const MAX_CANDIDATES_PER_VALUE = 5;
const SOLVER_YIELD_EVERY = 4096;
const SUPABASE_URL = "https://wxivlrityyvoihisckna.supabase.co";
const SUPABASE_KEY = "sb_publishable_T0td0td1Hu9KS8MKMjkZpQ_K8gu0PjW";

const supabaseClient = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY) ?? null;
let onlineSyncTimer = null;

const FIRST_100_RAW = `
1 K J T 9 8 6
2 J T 9 8 7 6
3 K T 9 8 7 2
4 Q J T 9 8 5
5 K Q J 8 7 2
6 K Q T 9 8 7
7 K J T 8 7 2
8 K T 9 7 6 2
9 K J 9 8 7 6
10 K J 9 8 6 2
11 K T 8 7 5 2
12 Q J T 9 7 4
13 Q J 9 8 5 2
14 J T 9 8 7 5
15 J T 9 8 5 2
16 J T 9 7 5 3
17 K Q 9 8 7 2
18 K T 9 8 7 6
19 Q J 9 8 7 6
20 Q T 9 7 6 2
21 J T 9 8 6 5
22 J T 9 8 6 2
23 J T 9 7 6 5
24 J T 9 7 6 2
25 J T 9 7 5 2
26 J T 9 6 3 2
27 J T 8 7 6 2
28 J T 8 7 5 2
29 J 9 8 6 5 2
30 K Q J T 9 5
31 K Q T 9 7 4
32 K J 9 8 7 2
33 K J 9 8 6 4
34 K J 8 7 6 2
35 Q J 9 8 7 2
36 Q J 9 8 6 2
37 Q J 9 7 5 2
38 Q T 9 8 7 3
39 Q T 9 8 7 2
40 Q T 9 7 5 2
41 Q T 9 7 4 2
42 J T 9 8 4 3
43 J T 7 6 5 2
44 J 9 8 7 6 2
45 K Q J T 7 4
46 K Q T 8 7 5
47 K Q T 8 7 2
48 K Q 9 7 6 2
49 K J T 9 8 4
50 K J T 9 6 4
51 K J T 9 6 2
52 K J T 8 5 2
53 K J 9 8 6 5
54 K J 9 7 6 2
55 K T 9 8 7 5
56 K T 9 7 5 2
57 K 9 8 7 6 2
58 K 9 8 7 5 3
59 K 9 8 7 3 2
60 K 9 8 6 2 A
61 Q J T 9 7 5
62 Q J T 9 5 2
63 Q J T 9 4 3
64 Q J T 8 7 2
65 Q J T 7 6 2
66 Q J 9 7 5 A
67 Q J 9 6 5 2
68 Q J 8 7 5 2
69 Q T 9 8 7 5
70 Q T 9 8 7 4
71 Q T 9 7 4 A
72 J T 9 8 7 4
73 J T 9 8 7 3
74 J T 9 8 7 2
75 J T 9 8 6 4
76 J T 9 8 5 4
77 K Q J 9 8 6
78 K Q T 9 7 2
79 K Q T 9 5 2
80 K Q T 8 7 3
81 K Q T 7 5 4
82 K J T 9 6 5
83 K J T 8 6 3
84 K J 9 8 7 5
85 K J 9 8 7 3
86 K J 9 6 4 2
87 K J 8 7 6 4
88 K J 8 7 5 2
89 K T 9 8 5 2
90 K T 9 8 3 2
91 K T 9 7 4 2
92 K T 8 7 6 2
93 K T 8 7 4 2
94 Q J T 9 7 3
95 Q J T 9 5 4
96 Q J 9 7 6 4
97 Q J 8 7 6 2
98 Q T 9 8 5 A
99 J T 9 7 6 4
100 J T 9 6 5 2
`;

let builtInSets = buildSetsFromFirst100(FIRST_100_RAW);

const RANK_VALUES = new Map([
  ["A", 1],
  ["J", 11],
  ["Q", 12],
  ["K", 13],
]);

const RANDOM_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const OP_LABELS = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "^": "^",
  "(": "(",
  ")": ")",
};

const PRECEDENCE = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "^": 3,
  atom: 4,
};

const els = {
  menuBtn: document.getElementById("menuBtn"),
  closeDrawerBtn: document.getElementById("closeDrawerBtn"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  settingsDrawer: document.getElementById("settingsDrawer"),
  leaderboardMenuBtn: document.getElementById("leaderboardMenuBtn"),
  closeLeaderboardDrawerBtn: document.getElementById("closeLeaderboardDrawerBtn"),
  leaderboardBackdrop: document.getElementById("leaderboardBackdrop"),
  leaderboardDrawer: document.getElementById("leaderboardDrawer"),
  authModal: document.getElementById("authModal"),
  authModalBackdrop: document.getElementById("authModalBackdrop"),
  closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
  profileModal: document.getElementById("profileModal"),
  profileModalBackdrop: document.getElementById("profileModalBackdrop"),
  closeProfileModalBtn: document.getElementById("closeProfileModalBtn"),
  profileModalTitle: document.getElementById("profileModalTitle"),
  profilePlayerName: document.getElementById("profilePlayerName"),
  profilePlayerMeta: document.getElementById("profilePlayerMeta"),
  profileTotalScore: document.getElementById("profileTotalScore"),
  profileSolvedCount: document.getElementById("profileSolvedCount"),
  profileBestCount: document.getElementById("profileBestCount"),
  profileSetCount: document.getElementById("profileSetCount"),
  profileSetList: document.getElementById("profileSetList"),
  profileMessage: document.getElementById("profileMessage"),
  activeSetChip: document.getElementById("activeSetChip"),
  scoreValue: document.getElementById("scoreValue"),
  targetCard: document.querySelector(".target-card"),
  setSelect: document.getElementById("setSelect"),
  setPreview: document.getElementById("setPreview"),
  solverState: document.getElementById("solverState"),
  randomSetBtn: document.getElementById("randomSetBtn"),
  clearRandomSetsBtn: document.getElementById("clearRandomSetsBtn"),
  randomMessage: document.getElementById("randomMessage"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
  onlineStatus: document.getElementById("onlineStatus"),
  onlineMessage: document.getElementById("onlineMessage"),
  authLoggedOut: document.getElementById("authLoggedOut"),
  authLoggedIn: document.getElementById("authLoggedIn"),
  accountLabel: document.getElementById("accountLabel"),
  displayNameInput: document.getElementById("displayNameInput"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  loginBtn: document.getElementById("loginBtn"),
  registerBtn: document.getElementById("registerBtn"),
  syncNowBtn: document.getElementById("syncNowBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  refreshLeaderboardBtn: document.getElementById("refreshLeaderboardBtn"),
  setLeaderboardTab: document.getElementById("setLeaderboardTab"),
  globalLeaderboardTab: document.getElementById("globalLeaderboardTab"),
  leaderboardList: document.getElementById("leaderboardList"),
  targetMap: document.getElementById("targetMap"),
  prevTargetBtn: document.getElementById("prevTargetBtn"),
  nextTargetBtn: document.getElementById("nextTargetBtn"),
  currentTarget: document.getElementById("currentTarget"),
  equationDrop: document.getElementById("equationDrop"),
  expression: document.getElementById("expression"),
  feedback: document.getElementById("feedback"),
  cards: document.getElementById("cards"),
  checkBtn: document.getElementById("checkBtn"),
  hintBtn: document.getElementById("hintBtn"),
  backspaceBtn: document.getElementById("backspaceBtn"),
  clearBtn: document.getElementById("clearBtn"),
  bestCount: document.getElementById("bestCount"),
  solvedCount: document.getElementById("solvedCount"),
  solvedPercent: document.getElementById("solvedPercent"),
  impossibleCount: document.getElementById("impossibleCount"),
};

const state = {
  importedSets: [],
  hashSet: null,
  selectedSetId: builtInSets[0].id,
  target: TARGET_MIN,
  tokens: [],
  progressBySet: {},
  solverBySet: new Map(),
  draggingCardIndex: null,
  pointerCardDrag: null,
  suppressNextCardClick: false,
  online: {
    user: null,
    profile: null,
    initialized: false,
    syncing: false,
    applyingRemote: false,
    leaderboardScope: "set",
  },
};

function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1n;
}

function rational(n, d = 1n) {
  if (d === 0n) return null;
  let num = BigInt(n);
  let den = BigInt(d);
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const factor = gcd(num, den);
  num /= factor;
  den /= factor;
  if (absBig(num) > MAX_ABS || absBig(den) > MAX_ABS) return null;
  return { n: num, d: den };
}

function absBig(value) {
  return value < 0n ? -value : value;
}

function rationalKey(value) {
  return `${value.n}/${value.d}`;
}

function isZero(value) {
  return value.n === 0n;
}

function addValues(a, b) {
  return rational(a.n * b.d + b.n * a.d, a.d * b.d);
}

function subValues(a, b) {
  return rational(a.n * b.d - b.n * a.d, a.d * b.d);
}

function mulValues(a, b) {
  return rational(a.n * b.n, a.d * b.d);
}

function divValues(a, b) {
  if (isZero(b)) return null;
  return rational(a.n * b.d, a.d * b.n);
}

function powBig(base, exponent) {
  let result = 1n;
  for (let index = 0n; index < exponent; index += 1n) {
    result *= base;
    if (absBig(result) > MAX_ABS) return null;
  }
  return result;
}

function powValue(base, exponent) {
  if (exponent.d !== 1n) return null;
  if (base.n === 0n && exponent.n === 0n) return null;
  if (absBig(exponent.n) > MAX_EXPONENT) return null;

  const positiveExponent = absBig(exponent.n);
  const raisedN = powBig(base.n, positiveExponent);
  const raisedD = powBig(base.d, positiveExponent);
  if (raisedN === null || raisedD === null) return null;
  if (exponent.n < 0n) {
    if (raisedN === 0n) return null;
    return rational(raisedD, raisedN);
  }
  return rational(raisedN, raisedD);
}

function parseRank(raw) {
  const value = String(raw ?? "").trim().toUpperCase();
  if (!value) return null;
  if (value === "T") return { rank: "10", value: 10 };
  if (RANK_VALUES.has(value)) return { rank: value, value: RANK_VALUES.get(value) };
  if (!/^\d+$/.test(value)) return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 13) return null;
  const rank = numeric === 1 ? "A" : numeric === 11 ? "J" : numeric === 12 ? "Q" : numeric === 13 ? "K" : String(numeric);
  return { rank, value: numeric };
}

function normalizeRankCode(rank) {
  return String(rank).trim().toUpperCase() === "T" ? "10" : String(rank).trim().toUpperCase();
}

function parseHashCards(hash = window.location.hash) {
  const raw = decodeURIComponent(String(hash || "").replace(/^#/, "")).trim().toUpperCase();
  if (!raw) return null;

  const cards = [];
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    let token = char;
    if (char === "1" && raw[index + 1] === "0") {
      token = "10";
      index += 1;
    }
    const parsed = parseRank(token);
    if (!parsed) return null;
    cards.push(parsed.rank);
  }

  return cards.length === 6 ? cards : null;
}

function setHashSetFromLocation() {
  const cards = parseHashCards();
  if (!cards) {
    state.hashSet = null;
    return false;
  }

  const id = `hash-${cards.join("-")}`;
  state.hashSet = {
    id,
    label: `分享題組：${cards.join(" ")}`,
    cards,
  };
  state.selectedSetId = id;
  state.target = TARGET_MIN;
  state.tokens = [];
  return true;
}

function rankToHashCode(rank) {
  const normalized = normalizeRankCode(rank);
  return normalized === "10" ? "T" : normalized;
}

function hashForCards(cards) {
  return cards.map(rankToHashCode).join("");
}

function syncUrlHashToSet(set = currentSet()) {
  if (!set || window.location.protocol === "file:") return;
  const nextHash = `#${hashForCards(set.cards)}`;
  if (window.location.hash === nextHash) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
}

function buildSetsFromFirst100(text) {
  return String(text)
    .trim()
    .split(/\n/)
    .map((line) => line.trim().split(/\s+/))
    .filter((row) => row.length >= 7)
    .map(([number, ...cards]) => {
      const normalizedCards = cards.slice(0, 6).map(normalizeRankCode);
      return {
        id: `easy-${number.padStart(3, "0")}`,
        label: `簡單 ${number}：${normalizedCards.join(" ")}`,
        cards: normalizedCards,
      };
    });
}

function currentSet() {
  return allSets().find((set) => set.id === state.selectedSetId) ?? builtInSets[0];
}

function allSets() {
  return [...(state.hashSet ? [state.hashSet] : []), ...builtInSets, ...state.importedSets];
}

function setLabelFromId(setId) {
  return allSets().find((set) => set.id === setId)?.label || setId || "未知題組";
}

function formatProfileDate(value) {
  if (!value) return "尚無紀錄";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "時間未知";
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function setProgress() {
  const id = currentSet().id;
  if (!state.progressBySet[id]) state.progressBySet[id] = {};
  return state.progressBySet[id];
}

function targetProgress(target = state.target) {
  return setProgress()[target] ?? null;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (Array.isArray(saved.importedSets)) state.importedSets = saved.importedSets.filter(validSavedSet);
    if (typeof saved.selectedSetId === "string") state.selectedSetId = saved.selectedSetId;
    if (Number.isInteger(saved.target) && saved.target >= TARGET_MIN && saved.target <= TARGET_MAX) state.target = saved.target;
    if (saved.ruleVersion === RULE_VERSION && saved.progressBySet && typeof saved.progressBySet === "object") {
      state.progressBySet = saved.progressBySet;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  setHashSetFromLocation();
  if (!allSets().some((set) => set.id === state.selectedSetId)) state.selectedSetId = builtInSets[0].id;
}

function validSavedSet(set) {
  return set && typeof set.id === "string" && typeof set.label === "string" && Array.isArray(set.cards) && set.cards.length === 6;
}

function saveState() {
  const payload = {
    ruleVersion: RULE_VERSION,
    importedSets: state.importedSets,
    selectedSetId: state.selectedSetId,
    target: state.target,
    progressBySet: state.progressBySet,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (!state.online.applyingRemote) scheduleOnlineSyncCurrentSet();
}

function onlineEnabled() {
  return Boolean(supabaseClient && state.online.user);
}

function setOnlineMessage(message = "") {
  els.onlineMessage.textContent = message;
}

function setOnlineSyncing(syncing) {
  state.online.syncing = syncing;
  renderOnlineStatus();
}

function renderOnlineStatus() {
  if (!supabaseClient) {
    els.onlineStatus.textContent = "離線";
    els.onlineStatus.className = "online-status account-status-btn";
    els.authLoggedOut.hidden = false;
    els.authLoggedIn.hidden = true;
    setOnlineMessage("Supabase SDK 未載入，先以訪客模式遊玩。");
    return;
  }

  if (state.online.user) {
    els.onlineStatus.textContent = "已登入";
    els.onlineStatus.className = "online-status account-status-btn signed-in";
  } else {
    els.onlineStatus.textContent = "訪客模式";
    els.onlineStatus.className = "online-status account-status-btn";
  }

  els.authLoggedOut.hidden = Boolean(state.online.user);
  els.authLoggedIn.hidden = !state.online.user;
  els.accountLabel.textContent = state.online.profile?.display_name || state.online.user?.email || "已登入";
}

function normalizeProgressStatus(status) {
  return ["tried", "correct", "best", "revealed"].includes(status) ? status : "tried";
}

function statusWeight(status) {
  return { tried: 0, revealed: 1, correct: 2, best: 3 }[normalizeProgressStatus(status)] ?? 0;
}

function progressLength(record) {
  return Number.isFinite(record?.length) ? record.length : Number.MAX_SAFE_INTEGER;
}

function normalizeHintLevel(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(3, value)) : 0;
}

function betterProgressRecord(left = {}, right = {}) {
  const leftScore = Number.isFinite(left.score) ? left.score : 0;
  const rightScore = Number.isFinite(right.score) ? right.score : 0;
  if (leftScore !== rightScore) return leftScore > rightScore ? left : right;

  const leftStatus = statusWeight(left.status);
  const rightStatus = statusWeight(right.status);
  if (leftStatus !== rightStatus) return leftStatus > rightStatus ? left : right;

  const leftLength = progressLength(left);
  const rightLength = progressLength(right);
  if (leftLength !== rightLength) return leftLength < rightLength ? left : right;

  return (left.updatedAt ?? "") >= (right.updatedAt ?? "") ? left : right;
}

function mergeProgressRecord(local = {}, remote = {}) {
  const winner = betterProgressRecord(local, remote);
  return {
    ...winner,
    attempts: Math.max(local.attempts ?? 0, remote.attempts ?? 0),
    hintLevel: Math.max(normalizeHintLevel(local.hintLevel), normalizeHintLevel(remote.hintLevel)),
    revealed: Boolean(local.revealed || remote.revealed),
  };
}

function progressRecordFromRow(row) {
  return {
    status: normalizeProgressStatus(row.status),
    score: row.score ?? 0,
    expression: row.expression ?? "",
    length: row.token_length ?? undefined,
    bestLength: row.best_length ?? undefined,
    symbols: row.symbols ?? undefined,
    cards: row.cards ?? undefined,
    attempts: row.attempts ?? 0,
    hintLevel: normalizeHintLevel(row.hint_level),
    revealed: Boolean(row.revealed),
    updatedAt: row.updated_at ?? "",
  };
}

function progressRowFromRecord(setId, target, record) {
  return {
    user_id: state.online.user.id,
    set_id: setId,
    target: Number(target),
    status: normalizeProgressStatus(record.status),
    score: Math.max(0, Math.min(100, record.score ?? 0)),
    expression: record.expression || null,
    token_length: Number.isFinite(record.length) ? record.length : null,
    best_length: Number.isFinite(record.bestLength) ? record.bestLength : null,
    symbols: Number.isFinite(record.symbols) ? record.symbols : null,
    cards: Number.isFinite(record.cards) ? record.cards : null,
    attempts: Math.max(0, record.attempts ?? 0),
    hint_level: normalizeHintLevel(record.hintLevel),
    revealed: Boolean(record.revealed),
  };
}

function meaningfulProgressRecord(record) {
  return Boolean(record?.status || record?.score || record?.expression || record?.attempts || record?.hintLevel || record?.revealed);
}

function progressRowsForSet(setId) {
  const progress = state.progressBySet[setId] ?? {};
  return Object.entries(progress)
    .filter(([, record]) => meaningfulProgressRecord(record))
    .map(([target, record]) => progressRowFromRecord(setId, target, record));
}

function scheduleOnlineSyncCurrentSet() {
  if (!onlineEnabled() || state.online.applyingRemote) return;
  window.clearTimeout(onlineSyncTimer);
  const setId = currentSet().id;
  onlineSyncTimer = window.setTimeout(() => {
    syncOnlineProgressForSet(setId);
  }, 650);
}

async function syncOnlineProgressForSet(setId = currentSet().id) {
  if (!onlineEnabled()) return;
  const rows = progressRowsForSet(setId);
  if (!rows.length) return;

  setOnlineSyncing(true);
  const { error } = await supabaseClient.from("progress").upsert(rows, {
    onConflict: "user_id,set_id,target",
  });
  setOnlineSyncing(false);

  if (error) {
    setOnlineMessage(`同步失敗：${error.message}`);
    return;
  }

  setOnlineMessage("進度已同步。");
  loadLeaderboard();
}

async function syncAllLocalProgress() {
  if (!onlineEnabled()) return;
  const setIds = Object.keys(state.progressBySet);
  for (const setId of setIds) {
    await syncOnlineProgressForSet(setId);
  }
}

async function loadOnlineProgressForSet(setId = currentSet().id) {
  if (!onlineEnabled()) return;
  setOnlineSyncing(true);
  const { data, error } = await supabaseClient.from("progress").select("*").eq("set_id", setId);
  setOnlineSyncing(false);

  if (error) {
    setOnlineMessage(`讀取進度失敗：${error.message}`);
    return;
  }

  state.online.applyingRemote = true;
  if (!state.progressBySet[setId]) state.progressBySet[setId] = {};
  (data ?? []).forEach((row) => {
    const target = String(row.target);
    state.progressBySet[setId][target] = mergeProgressRecord(state.progressBySet[setId][target], progressRecordFromRow(row));
  });
  saveState();
  state.online.applyingRemote = false;

  if (currentSet().id === setId) renderPuzzle({ preserveFeedback: true });
}

async function deleteOnlineProgressForSet(setId) {
  if (!onlineEnabled()) return;
  const { error } = await supabaseClient.from("progress").delete().eq("set_id", setId);
  if (error) {
    setOnlineMessage(`線上重設失敗：${error.message}`);
    return;
  }
  setOnlineMessage("線上進度已重設。");
  loadLeaderboard();
}

function renderLeaderboard(rows = null) {
  els.leaderboardList.innerHTML = "";
  if (!supabaseClient) {
    els.leaderboardList.innerHTML = "<li>Supabase 尚未載入。</li>";
    return;
  }
  if (!rows || rows.length === 0) {
    els.leaderboardList.innerHTML = "<li>目前還沒有排行榜資料。</li>";
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const rank = document.createElement("span");
    const player = document.createElement("span");
    const points = document.createElement("span");
    button.className = "leaderboard-player-btn";
    button.type = "button";
    rank.className = "rank";
    player.className = "player";
    points.className = "points";
    rank.textContent = `#${row.rank}`;
    player.textContent = row.display_name || "Player";
    points.textContent =
      state.online.leaderboardScope === "global"
        ? `${row.total_score} 分 · ${row.set_count ?? 0} 組`
        : `${row.total_score} 分`;
    button.append(rank, player, points);
    if (row.user_id) {
      button.setAttribute("aria-label", `查看 ${row.display_name || "Player"} 的玩家資料`);
      button.addEventListener("click", () => openPlayerProfile(row.user_id));
    } else {
      button.disabled = true;
    }
    item.append(button);
    els.leaderboardList.append(item);
  });
}

function renderLeaderboardTabs() {
  const isGlobal = state.online.leaderboardScope === "global";
  els.setLeaderboardTab.classList.toggle("active", !isGlobal);
  els.globalLeaderboardTab.classList.toggle("active", isGlobal);
  els.setLeaderboardTab.setAttribute("aria-selected", String(!isGlobal));
  els.globalLeaderboardTab.setAttribute("aria-selected", String(isGlobal));
}

async function loadLeaderboard(setId = currentSet().id) {
  if (!supabaseClient) {
    renderLeaderboard();
    return;
  }
  renderLeaderboardTabs();
  const request =
    state.online.leaderboardScope === "global"
      ? supabaseClient.rpc("get_global_leaderboard", { p_limit: 20 })
      : supabaseClient.rpc("get_leaderboard", {
          p_set_id: setId,
          p_limit: 20,
        });
  const { data, error } = await request;
  if (error) {
    els.leaderboardList.innerHTML = `<li>排行榜讀取失敗：${error.message}</li>`;
    return;
  }
  renderLeaderboard(data);
}

function setLeaderboardScope(scope) {
  state.online.leaderboardScope = scope === "global" ? "global" : "set";
  renderLeaderboardTabs();
  loadLeaderboard();
}

function resetPlayerProfileModal(message = "讀取中...") {
  els.profileModalTitle.textContent = "玩家資料";
  els.profilePlayerName.textContent = "Player";
  els.profilePlayerMeta.textContent = message;
  els.profileTotalScore.textContent = "0";
  els.profileSolvedCount.textContent = "0";
  els.profileBestCount.textContent = "0";
  els.profileSetCount.textContent = "0";
  els.profileSetList.innerHTML = `<li>${message}</li>`;
  els.profileMessage.textContent = "";
}

function renderPlayerProfile(profile) {
  const setSummaries = Array.isArray(profile?.set_summaries) ? profile.set_summaries : [];
  const displayName = profile?.display_name || "Player";
  els.profileModalTitle.textContent = `${displayName} 的資料`;
  els.profilePlayerName.textContent = displayName;
  els.profilePlayerMeta.textContent = profile?.last_played_at ? `最近遊玩：${formatProfileDate(profile.last_played_at)}` : "還沒有線上完成紀錄";
  els.profileTotalScore.textContent = profile?.total_score ?? 0;
  els.profileSolvedCount.textContent = profile?.solved_count ?? 0;
  els.profileBestCount.textContent = profile?.best_count ?? 0;
  els.profileSetCount.textContent = profile?.set_count ?? 0;
  els.profileMessage.textContent = "";
  els.profileSetList.innerHTML = "";

  if (setSummaries.length === 0) {
    els.profileSetList.innerHTML = "<li>目前還沒有可顯示的題組紀錄。</li>";
    return;
  }

  setSummaries.forEach((summary) => {
    const item = document.createElement("li");
    const text = document.createElement("div");
    const name = document.createElement("div");
    const detail = document.createElement("div");
    const score = document.createElement("span");
    text.className = "profile-set-text";
    name.className = "profile-set-name";
    detail.className = "profile-set-detail";
    score.className = "profile-set-score";
    name.textContent = setLabelFromId(summary.set_id);
    detail.textContent = `完成 ${summary.solved_count ?? 0} 題 · 最佳 ${summary.best_count ?? 0} 題 · 最近 ${formatProfileDate(summary.last_played_at)}`;
    score.textContent = `${summary.total_score ?? 0} 分`;
    text.append(name, detail);
    item.append(text, score);
    els.profileSetList.append(item);
  });
}

function openProfileModal() {
  els.profileModal.hidden = false;
  els.profileModalBackdrop.hidden = false;
}

function closeProfileModal() {
  els.profileModal.hidden = true;
  els.profileModalBackdrop.hidden = true;
}

async function openPlayerProfile(userId) {
  openProfileModal();
  resetPlayerProfileModal();
  if (!supabaseClient) {
    resetPlayerProfileModal("Supabase 尚未載入。");
    return;
  }
  if (!userId) {
    resetPlayerProfileModal("找不到玩家資料。");
    return;
  }

  const { data, error } = await supabaseClient.rpc("get_player_profile", {
    p_user_id: userId,
    p_limit: 30,
  });
  if (error) {
    resetPlayerProfileModal("玩家資料讀取失敗。");
    els.profileMessage.textContent = error.message;
    return;
  }

  renderPlayerProfile(Array.isArray(data) ? data[0] : data);
}

async function loadOnlineProfile() {
  if (!onlineEnabled()) return;
  const { data, error } = await supabaseClient.from("profiles").select("display_name").eq("id", state.online.user.id).maybeSingle();
  if (error) {
    setOnlineMessage(`讀取帳號資料失敗：${error.message}`);
    return;
  }
  state.online.profile = data ?? {
    display_name: state.online.user.email?.split("@")[0] || "Player",
  };
  renderOnlineStatus();
}

async function applyOnlineSession(session) {
  state.online.user = session?.user ?? null;
  state.online.profile = null;
  renderOnlineStatus();

  if (!state.online.user) {
    setOnlineMessage("目前是訪客模式，進度只存在這台裝置。");
    loadLeaderboard();
    return;
  }

  setOnlineMessage("登入成功，正在同步本機與線上進度。");
  await loadOnlineProfile();
  await loadOnlineProgressForSet(currentSet().id);
  await syncAllLocalProgress();
  await loadLeaderboard();
}

async function initializeOnline() {
  renderOnlineStatus();
  loadLeaderboard();
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setOnlineMessage(`登入狀態讀取失敗：${error.message}`);
  } else {
    await applyOnlineSession(data.session);
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => {
      applyOnlineSession(session);
    }, 0);
  });
  state.online.initialized = true;
}

function authCredentials() {
  return {
    email: els.emailInput.value.trim(),
    password: els.passwordInput.value,
    displayName: els.displayNameInput.value.trim() || "Player",
  };
}

async function loginOnline() {
  if (!supabaseClient) return;
  const { email, password } = authCredentials();
  if (!email || !password) {
    setOnlineMessage("請輸入 email 和密碼。");
    return;
  }
  setOnlineSyncing(true);
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  setOnlineSyncing(false);
  if (error) setOnlineMessage(`登入失敗：${error.message}`);
}

async function registerOnline() {
  if (!supabaseClient) return;
  const { email, password, displayName } = authCredentials();
  if (!email || password.length < 6) {
    setOnlineMessage("請輸入 email，密碼至少 6 個字元。");
    return;
  }
  setOnlineSyncing(true);
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });
  setOnlineSyncing(false);
  if (error) {
    setOnlineMessage(`註冊失敗：${error.message}`);
    return;
  }
  if (!data.session) {
    setOnlineMessage("註冊成功，請先完成 email 驗證再登入。");
  }
}

async function logoutOnline() {
  if (!supabaseClient) return;
  setOnlineSyncing(true);
  const { error } = await supabaseClient.auth.signOut();
  setOnlineSyncing(false);
  if (error) setOnlineMessage(`登出失敗：${error.message}`);
}

function candidateLength(candidate) {
  return candidate.symbolCount + candidate.cardCount;
}

function candidateCost(candidate) {
  return [candidateLength(candidate), candidate.symbolCount, candidate.cardCount, candidate.expr];
}

function compareCandidates(a, b) {
  const left = candidateCost(a);
  const right = candidateCost(b);
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] < right[index]) return -1;
    if (left[index] > right[index]) return 1;
  }
  return 0;
}

function addCandidate(map, candidate) {
  const key = rationalKey(candidate.value);
  const list = map.get(key) ?? [];
  if (list.some((item) => item.expr === candidate.expr)) return;
  list.push(candidate);
  list.sort(compareCandidates);
  map.set(key, list.slice(0, MAX_CANDIDATES_PER_VALUE));
}

function cardsForSet(set) {
  return set.cards.map((rank, index) => {
    const parsed = parseRank(rank);
    return { index, rank: parsed.rank, value: parsed.value };
  });
}

function waitForBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function solveSetAsync(set, shouldContinue = () => true) {
  const cards = cardsForSet(set);
  const tableCount = 1 << cards.length;
  const tables = Array.from({ length: tableCount }, () => new Map());
  let workCounter = 0;

  cards.forEach((card) => {
    const mask = 1 << card.index;
    addCandidate(tables[mask], {
      value: rational(card.value),
      expr: card.rank,
      rootOp: "atom",
      precedence: PRECEDENCE.atom,
      symbolCount: 0,
      symbolMask: 0,
      cardCount: 1,
      cardMask: mask,
      ranks: [card.rank],
    });
  });

  for (let mask = 1; mask < tableCount; mask += 1) {
    for (let leftMask = (mask - 1) & mask; leftMask > 0; leftMask = (leftMask - 1) & mask) {
      if (!shouldContinue()) return null;
      const rightMask = mask ^ leftMask;
      if (rightMask === 0 || leftMask > rightMask) continue;
      const leftCandidates = flatCandidates(tables[leftMask]);
      const rightCandidates = flatCandidates(tables[rightMask]);

      for (const left of leftCandidates) {
        for (const right of rightCandidates) {
          makeBinaryCandidates(left, right).forEach((candidate) => addCandidate(tables[mask], candidate));
          workCounter += 1;
          if (workCounter % SOLVER_YIELD_EVERY === 0) {
            if (!shouldContinue()) return null;
            await waitForBrowser();
          }
        }
      }
    }
    await waitForBrowser();
  }

  const bestByTarget = new Map();
  for (let target = TARGET_MIN; target <= TARGET_MAX; target += 1) {
    const key = `${target}/1`;
    let best = null;
    tables.forEach((table) => {
      const list = table.get(key);
      if (!list) return;
      list.forEach((candidate) => {
        if (!best || compareCandidates(candidate, best) < 0) best = candidate;
      });
    });
    if (best) bestByTarget.set(target, best);
  }

  return { tables, bestByTarget };
}

function flatCandidates(map) {
  return [...map.values()].flat();
}

function makeBinaryCandidates(left, right) {
  const candidates = [];
  pushBinary(candidates, left, right, "+", addValues(left.value, right.value));
  pushBinary(candidates, left, right, "*", mulValues(left.value, right.value));
  pushBinary(candidates, left, right, "-", subValues(left.value, right.value));
  pushBinary(candidates, right, left, "-", subValues(right.value, left.value));
  pushBinary(candidates, left, right, "/", divValues(left.value, right.value));
  pushBinary(candidates, right, left, "/", divValues(right.value, left.value));
  pushBinary(candidates, left, right, "^", powValue(left.value, right.value));
  pushBinary(candidates, right, left, "^", powValue(right.value, left.value));
  return candidates;
}

function pushBinary(candidates, left, right, op, value) {
  if (!value) return;
  const rendered = renderBinary(left, right, op);

  candidates.push({
    value,
    expr: rendered.expr,
    rootOp: op,
    precedence: PRECEDENCE[op],
    symbolCount: left.symbolCount + right.symbolCount + 1 + rendered.extraParens,
    symbolMask: 0,
    cardCount: left.cardCount + right.cardCount,
    cardMask: left.cardMask | right.cardMask,
    ranks: [...left.ranks, ...right.ranks],
  });
}

function renderBinary(left, right, op) {
  const leftWrap = shouldWrapLeft(left, op);
  const rightWrap = shouldWrapRight(right, op);
  const leftExpr = leftWrap ? `(${left.expr})` : left.expr;
  const rightExpr = rightWrap ? `(${right.expr})` : right.expr;
  return {
    expr: `${leftExpr} ${OP_LABELS[op]} ${rightExpr}`,
    extraParens: (leftWrap ? 2 : 0) + (rightWrap ? 2 : 0),
    parenPairs: (leftWrap ? 1 : 0) + (rightWrap ? 1 : 0),
  };
}

function shouldWrapLeft(child, op) {
  if (child.precedence < PRECEDENCE[op]) return true;
  return op === "^" && child.precedence === PRECEDENCE[op];
}

function shouldWrapRight(child, op) {
  if (child.precedence < PRECEDENCE[op]) return true;
  if (op === "-" && child.precedence <= PRECEDENCE[op]) return true;
  if (op === "/" && child.precedence <= PRECEDENCE[op]) return true;
  return false;
}

function solverEntry(set = currentSet()) {
  let entry = state.solverBySet.get(set.id);
  if (!entry) {
    entry = { status: "idle", solver: null, promise: null, cancelled: false };
    state.solverBySet.set(set.id, entry);
  }
  return entry;
}

function readySolver(set = currentSet()) {
  const entry = state.solverBySet.get(set.id);
  return entry?.status === "ready" ? entry.solver : null;
}

function currentSolverStatus() {
  return solverEntry(currentSet()).status;
}

function updateSolverStatus() {
  const status = currentSolverStatus();
  if (status === "ready") {
    els.solverState.textContent = "已分析";
    els.solverState.className = "status-pill ready";
  } else if (status === "pending") {
    els.solverState.textContent = "分析中";
    els.solverState.className = "status-pill busy";
  } else {
    els.solverState.textContent = "待分析";
    els.solverState.className = "status-pill idle";
  }
}

function cancelPendingSolvers(exceptSetId) {
  state.solverBySet.forEach((entry, setId) => {
    if (setId !== exceptSetId && entry.status === "pending") entry.cancelled = true;
  });
}

function ensureSolver(set = currentSet()) {
  const entry = solverEntry(set);
  if (entry.status === "ready" || entry.status === "pending") {
    updateSolverStatus();
    return entry;
  }

  entry.status = "pending";
  entry.cancelled = false;
  updateSolverStatus();

  entry.promise = waitForBrowser()
    .then(() => solveSetAsync(set, () => !entry.cancelled))
    .then((solver) => {
      if (!solver) {
        entry.status = "idle";
        entry.promise = null;
        updateSolverStatus();
        return null;
      }
      entry.solver = solver;
      entry.status = "ready";
      entry.promise = null;
      updateSolverStatus();
      if (currentSet().id === set.id) {
        renderPuzzle({ preserveFeedback: true });
      }
      return solver;
    })
    .catch(() => {
      entry.status = "idle";
      entry.promise = null;
      if (currentSet().id === set.id) {
        setFeedback("bad", "最佳解分析失敗，請換題組或重新整理。");
        updateSolverStatus();
      }
    });

  return entry;
}

function bestForTarget(target = state.target) {
  return readySolver()?.bestByTarget.get(target) ?? null;
}

function tokenDisplay(token) {
  if (token.type === "card") return token.rank;
  return OP_LABELS[token.value] ?? token.value;
}

function expressionText(tokens = state.tokens) {
  return tokens.map(tokenDisplay).join(" ");
}

function usedCardIndexes() {
  return new Set(state.tokens.filter((token) => token.type === "card").map((token) => token.cardIndex));
}

function lastToken() {
  return state.tokens[state.tokens.length - 1] ?? null;
}

function canAddCardToken() {
  const last = lastToken();
  return !last || (last.type === "op" && last.value !== ")");
}

function openParenCount() {
  return state.tokens.filter((token) => token.type === "op" && token.value === "(").length;
}

function closeParenCount() {
  return state.tokens.filter((token) => token.type === "op" && token.value === ")").length;
}

function canAddOperatorToken(value) {
  const last = lastToken();
  if (["+", "-", "*", "/", "^"].includes(value)) {
    return Boolean(last && (last.type === "card" || (last.type === "op" && last.value === ")")));
  }
  if (value === "(") {
    return !last || (last.type === "op" && last.value !== ")");
  }
  if (value === ")") {
    return openParenCount() > closeParenCount() && Boolean(last && (last.type === "card" || (last.type === "op" && last.value === ")")));
  }
  return false;
}

function rejectMove(message) {
  setFeedback("bad", message);
}

function addCardToken(cardIndex) {
  if (usedCardIndexes().has(cardIndex)) return;
  if (!canAddCardToken()) {
    rejectMove("兩張牌不能直接相鄰，請先放一個運算符號。");
    return;
  }
  const card = cardsForSet(currentSet())[cardIndex];
  state.tokens.push({ type: "card", cardIndex, rank: card.rank, value: card.value });
  clearFeedbackClass();
  els.feedback.textContent = "已加入卡牌，可以繼續放符號或檢查答案。";
  renderExpression();
  renderCards();
  renderOperators();
}

function addOperatorToken(value) {
  if (!canAddOperatorToken(value)) {
    rejectMove(value === ")" ? "右括號需要先有可以關起來的算式。" : "這個位置不能放這個符號。");
    return;
  }
  state.tokens.push({ type: "op", value });
  clearFeedbackClass();
  els.feedback.textContent = value === "(" || value === ")" ? "已加入括號。" : `已加入 ${OP_LABELS[value]}。`;
  renderExpression();
  renderCards();
  renderOperators();
}

function evaluateTokens(tokens) {
  const parser = createParser(tokens);
  const value = parser.parseExpression();
  if (!value) return parser.errorResult();
  if (parser.position < tokens.length) return { ok: false, message: "算式後面還有無法判讀的內容。" };
  return { ok: true, value };
}

function createParser(tokens) {
  return {
    tokens,
    position: 0,
    error: "",
    parseExpression() {
      let left = this.parseTerm();
      while (left && this.matchOperator("+", "-")) {
        const op = this.previous().value;
        const right = this.parseTerm();
        if (!right) return null;
        left = op === "+" ? addValues(left, right) : subValues(left, right);
      }
      return left;
    },
    parseTerm() {
      let left = this.parsePower();
      while (left && this.matchOperator("*", "/")) {
        const op = this.previous().value;
        const right = this.parsePower();
        if (!right) return null;
        left = op === "*" ? mulValues(left, right) : divValues(left, right);
        if (!left) {
          this.error = op === "/" ? "不能除以 0。" : "中間數字太大，先換一種算式。";
          return null;
        }
      }
      return left;
    },
    parsePower() {
      const left = this.parsePrimary();
      if (!left) return null;
      if (this.matchOperator("^")) {
        const right = this.parsePower();
        if (!right) return null;
        const value = powValue(left, right);
        if (!value) {
          this.error = "^ 只能使用安全的整數次方，且不能出現 0^0 或太大的中間值。";
          return null;
        }
        return value;
      }
      return left;
    },
    parsePrimary() {
      const token = this.advance();
      if (!token) {
        this.error = "算式還沒完成。";
        return null;
      }
      if (token.type === "card") return rational(token.value);
      if (token.type === "op" && token.value === "(") {
        const value = this.parseExpression();
        if (!value) return null;
        if (!this.matchOperator(")")) {
          this.error = "少了一個右括號。";
          return null;
        }
        return value;
      }
      this.error = "這裡需要放卡牌或左括號。";
      return null;
    },
    matchOperator(...operators) {
      const token = this.peek();
      if (!token || token.type !== "op" || !operators.includes(token.value)) return false;
      this.position += 1;
      return true;
    },
    advance() {
      if (this.position >= tokens.length) return null;
      const token = tokens[this.position];
      this.position += 1;
      return token;
    },
    previous() {
      return tokens[this.position - 1];
    },
    peek() {
      return tokens[this.position];
    },
    errorResult() {
      return { ok: false, message: this.error || "這個算式還不能計算。" };
    },
  };
}

function studentCost(tokens = state.tokens) {
  const symbols = tokens.filter((token) => token.type === "op").length;
  const cards = tokens.filter((token) => token.type === "card").length;
  return { symbols, cards, length: symbols + cards };
}

function scoreForLength(length, bestLength) {
  const extraLength = Math.max(0, length - bestLength);
  return Math.max(0, 100 - extraLength * 10);
}

function applyScore(record, cost, best) {
  const bestLength = candidateLength(best);
  const earned = scoreForLength(cost.length, bestLength);
  const previous = Number.isFinite(record.score) ? record.score : 0;
  const kept = Math.max(previous, earned);
  record.length = cost.length;
  record.bestLength = bestLength;
  record.score = kept;
  return { earned, kept, bestLength, extraLength: Math.max(0, cost.length - bestLength) };
}

function scoreText(score) {
  if (!score) return "";
  if (score.earned === score.kept) return `本題 +${score.earned} 分。`;
  return `本題 ${score.earned} 分，保留最高 ${score.kept} 分。`;
}

function isBestAnswer(cost, best) {
  if (!best) return false;
  return cost.length <= candidateLength(best);
}

function isCheckButtonNextReady() {
  const record = targetProgress();
  return Boolean(
    (record?.status === "correct" || record?.status === "revealed") &&
      state.tokens.length &&
      expressionText() === record.expression
  );
}

function renderCheckButton() {
  const readyForNext = isCheckButtonNextReady();
  els.checkBtn.textContent = readyForNext ? "下一題" : "檢查";
  els.checkBtn.classList.toggle("next-ready", readyForNext);
  els.checkBtn.disabled = readyForNext && state.target >= TARGET_MAX;
  els.checkBtn.setAttribute("aria-label", readyForNext ? "前往下一題" : "檢查答案");
}

function checkAnswer() {
  if (!state.tokens.length) {
    setFeedback("bad", "請先排出一個算式。");
    return;
  }

  const evaluated = evaluateTokens(state.tokens);
  if (!evaluated.ok) {
    setFeedback("bad", evaluated.message);
    updateAttempt(false);
    return;
  }

  const targetValue = rational(state.target);
  if (rationalKey(evaluated.value) !== rationalKey(targetValue)) {
    setFeedback("bad", `目前算出 ${formatRational(evaluated.value)}，還不是 ${state.target}。`);
    updateAttempt(false);
    return;
  }

  const best = bestForTarget();
  const solver = readySolver();
  const cost = studentCost();
  const record = ensureTargetRecord(state.target);
  record.expression = expressionText();
  record.symbols = cost.symbols;
  record.cards = cost.cards;
  record.attempts = (record.attempts ?? 0) + 1;
  const score = best ? applyScore(record, cost, best) : null;

  if (!solver) {
    if (record.status !== "best") record.status = "correct";
    setFeedback("good", "算式正確！最短長度還在分析中，等一下會更新地圖與提示。");
    ensureSolver();
  } else if (!best) {
    if (record.status !== "best") record.status = "correct";
    setFeedback("good", "算式正確！系統原本標成不可能，這題會先記為完成。");
  } else if (isBestAnswer(cost, best)) {
    record.status = "best";
    saveState();
    if (state.target < TARGET_MAX) {
      setTarget(state.target + 1);
      return;
    }
    setFeedback("good", `漂亮，是最短長度 ${score.bestLength}。${scoreText(score)}`);
  } else {
    if (record.status !== "best") record.status = record.revealed ? "revealed" : "correct";
    setFeedback(
      "warn",
      `答對了！長度 ${cost.length}，比最短 ${score.bestLength} 多 ${score.extraLength}。${scoreText(score)}`
    );
  }

  saveState();
  renderStats();
  renderTargetMap();
  renderCheckButton();
}

function updateAttempt(correct) {
  const record = ensureTargetRecord(state.target);
  record.attempts = (record.attempts ?? 0) + 1;
  if (!correct && !record.status) record.status = "tried";
  saveState();
}

function ensureTargetRecord(target) {
  const progress = setProgress();
  if (!progress[target]) progress[target] = { hintLevel: 0, attempts: 0 };
  return progress[target];
}

function expressionShape(expression) {
  return expression.replace(/\b(?:A|[2-9]|10|J|Q|K)\b/g, "□");
}

function revealHint() {
  const best = bestForTarget();
  if (!readySolver()) {
    ensureSolver();
    setFeedback("warn", "提示：最佳解還在分析中。完成後會提供最佳長度、使用卡牌與算式形狀。");
    return;
  }
  if (!best) {
    setFeedback("warn", "提示：這個目標沒有可行解，系統已標成不可能。");
    return;
  }

  const record = ensureTargetRecord(state.target);
  const currentHintLevel = Number.isFinite(record.hintLevel) ? record.hintLevel : 0;
  record.hintLevel = currentHintLevel >= 1 && currentHintLevel < 3 ? currentHintLevel + 1 : 1;

  if (record.hintLevel === 1) {
    setFeedback("warn", `提示 1/3：最短答案長度是 ${candidateLength(best)}。`);
  } else if (record.hintLevel === 2) {
    setFeedback("warn", `提示 2/3：可以試著使用 ${best.ranks.join("、")}。`);
  } else if (record.hintLevel === 3) {
    setFeedback("warn", `提示 3/3：算式形狀是 ${expressionShape(best.expr)}。再按一次回到 1/3。`);
  }

  saveState();
  renderStats();
  renderTargetMap();
}

function formatRational(value) {
  if (value.d === 1n) return String(value.n);
  return `${value.n}/${value.d}`;
}

function drawUniqueRandomRanks() {
  const ranks = [...RANDOM_RANKS];
  for (let index = ranks.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [ranks[index], ranks[swapIndex]] = [ranks[swapIndex], ranks[index]];
  }
  return ranks.slice(0, 6);
}

function randomSetCount() {
  return state.importedSets.filter((set) => set.id.startsWith("random-")).length;
}

function createRandomSet() {
  const cards = drawUniqueRandomRanks();
  const labelNumber = String(randomSetCount() + 1).padStart(2, "0");
  return {
    id: `random-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: `隨機 ${labelNumber}：${cards.join(" ")}`,
    cards,
  };
}

function drawRandomSet() {
  const set = createRandomSet();
  state.importedSets.push(set);
  state.selectedSetId = set.id;
  state.hashSet = null;
  state.tokens = [];
  state.target = TARGET_MIN;
  cancelPendingSolvers(set.id);
  syncUrlHashToSet(set);
  saveState();
  renderAll();
  loadOnlineProgressForSet(set.id);
  loadLeaderboard(set.id);
  setFeedback("warn", `已抽出隨機題組：${set.cards.join("、")}。`);
  els.randomMessage.textContent = "已加入並切換到新的隨機題組。";
  closeDrawer();
}

function animateTarget(direction) {
  if (!direction || !els.targetCard) return;
  const className = direction > 0 ? "slide-right" : "slide-left";
  els.targetCard.classList.remove("slide-left", "slide-right");
  void els.targetCard.offsetWidth;
  els.targetCard.classList.add(className);
}

function setTarget(target) {
  const nextTarget = Math.min(TARGET_MAX, Math.max(TARGET_MIN, target));
  if (nextTarget === state.target) return;
  const direction = nextTarget > state.target ? 1 : -1;
  state.target = nextTarget;
  state.tokens = [];
  saveState();
  animateTarget(direction);
  renderPuzzle();
  ensureSolver();
}

function setFeedback(kind, message) {
  els.feedback.className = `feedback ${kind}`;
  els.feedback.textContent = message;
}

function clearFeedbackClass() {
  els.feedback.className = "feedback";
}

function renderSetSelect() {
  els.setSelect.innerHTML = "";
  allSets().forEach((set) => {
    const option = document.createElement("option");
    option.value = set.id;
    option.textContent = set.label;
    els.setSelect.append(option);
  });
  els.setSelect.value = currentSet().id;
}

function renderSetPreview() {
  const set = currentSet();
  els.setPreview.textContent = `目前牌組：${set.cards.join("、")}`;
  els.activeSetChip.textContent = `${set.label.replace(/^簡單\s*/, "#")}`;
}

function renderExpression() {
  els.expression.innerHTML = "";
  state.tokens.forEach((token, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `token-chip ${token.type === "op" ? "operator" : "card-token"}`;
    chip.textContent = tokenDisplay(token);
    chip.setAttribute("role", "listitem");
    chip.title = "點一下移除此格";
    chip.addEventListener("click", () => {
      state.tokens.splice(index, 1);
      renderExpression();
      renderCards();
      renderOperators();
      renderCheckButton();
    });
    els.expression.append(chip);
  });
  renderCheckButton();
}

function renderOperators() {
  document.querySelectorAll(".operator-btn").forEach((button) => {
    button.disabled = !canAddOperatorToken(button.dataset.token);
  });
}

function moveCardDragPreview(x, y) {
  const drag = state.pointerCardDrag;
  if (!drag) return;
  drag.preview.style.left = `${x - drag.offsetX}px`;
  drag.preview.style.top = `${y - drag.offsetY}px`;
}

function isPointInElement(x, y, element) {
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function cleanupCardPointerDrag() {
  const drag = state.pointerCardDrag;
  if (!drag) return;
  window.removeEventListener("pointermove", handleCardPointerMove);
  window.removeEventListener("pointerup", handleCardPointerUp);
  window.removeEventListener("pointercancel", cancelCardPointerDrag);
  drag.preview.remove();
  drag.button.classList.remove("dragging");
  els.equationDrop.classList.remove("drag-over");
  state.pointerCardDrag = null;
}

function cancelCardPointerDrag() {
  cleanupCardPointerDrag();
}

function handleCardPointerMove(event) {
  const drag = state.pointerCardDrag;
  if (!drag) return;
  event.preventDefault();
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (distance > 4) drag.moved = true;
  moveCardDragPreview(event.clientX, event.clientY);
  els.equationDrop.classList.toggle("drag-over", isPointInElement(event.clientX, event.clientY, els.equationDrop));
}

function handleCardPointerUp(event) {
  const drag = state.pointerCardDrag;
  if (!drag) return;
  event.preventDefault();
  const shouldAdd = !drag.moved || isPointInElement(event.clientX, event.clientY, els.equationDrop);
  const cardIndex = drag.cardIndex;
  cleanupCardPointerDrag();
  if (shouldAdd) addCardToken(cardIndex);
}

function startCardPointerDrag(event, cardIndex, button) {
  if (event.button !== undefined && event.button !== 0) return;
  if (!canAddCardToken()) {
    event.preventDefault();
    rejectMove("兩張牌不能直接相鄰，請先放一個運算符號。");
    return;
  }

  event.preventDefault();
  state.suppressNextCardClick = true;
  window.setTimeout(() => {
    state.suppressNextCardClick = false;
  }, 120);

  const rect = button.getBoundingClientRect();
  const preview = button.cloneNode(true);
  preview.classList.remove("dragging");
  preview.classList.add("drag-preview");
  preview.disabled = false;
  preview.style.width = `${rect.width}px`;
  preview.style.height = `${rect.height}px`;
  document.body.append(preview);

  state.pointerCardDrag = {
    cardIndex,
    button,
    preview,
    offsetX: rect.width / 2,
    offsetY: rect.height / 2,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  };

  button.classList.add("dragging");
  moveCardDragPreview(event.clientX, event.clientY);
  window.addEventListener("pointermove", handleCardPointerMove, { passive: false });
  window.addEventListener("pointerup", handleCardPointerUp, { passive: false });
  window.addEventListener("pointercancel", cancelCardPointerDrag);
}

function renderCards() {
  const used = usedCardIndexes();
  const canAddCard = canAddCardToken();
  els.cards.innerHTML = "";
  cardsForSet(currentSet()).forEach((card) => {
    const blocked = used.has(card.index) || !canAddCard;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `play-card ${used.has(card.index) ? "used" : ""} ${!used.has(card.index) && !canAddCard ? "blocked" : ""}`;
    button.textContent = card.rank;
    button.dataset.rank = card.rank;
    button.draggable = false;
    button.disabled = blocked;
    button.title = !canAddCard && !used.has(card.index) ? "請先放一個運算符號" : "";
    button.addEventListener("click", (event) => {
      if (state.suppressNextCardClick) {
        event.preventDefault();
        state.suppressNextCardClick = false;
        return;
      }
      addCardToken(card.index);
    });
    button.addEventListener("pointerdown", (event) => startCardPointerDrag(event, card.index, button));
    els.cards.append(button);
  });
}

function renderTargetMap() {
  const solver = readySolver();
  const progress = setProgress();
  els.targetMap.innerHTML = "";
  for (let target = TARGET_MIN; target <= TARGET_MAX; target += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `target-bubble ${targetClass(target, progress[target], solver)}`;
    button.textContent = target;
    button.title = targetTitle(target, progress[target], solver);
    button.addEventListener("click", () => setTarget(target));
    els.targetMap.append(button);
  }
}

function targetClass(target, record, solver) {
  const classes = [];
  if (target === state.target) classes.push("current");
  if (solver && !solver.bestByTarget.has(target)) classes.push("impossible");
  if (record?.status === "best") classes.push("best");
  if (record?.status === "correct") classes.push("correct");
  if (record?.status === "revealed") classes.push("revealed");
  return classes.join(" ");
}

function targetTitle(target, record, solver) {
  if (!solver) return `${target}：分析中`;
  if (!solver.bestByTarget.has(target)) return `${target}：不可能`;
  if (record?.status === "best") return `${target}：最佳完成`;
  if (record?.status === "correct") return `${target}：已完成`;
  if (record?.status === "revealed") return `${target}：已用提示`;
  return `${target}：尚未完成`;
}

function completionPercent(solved) {
  const percent = (solved / TARGET_MAX) * 100;
  if (percent === 0 || percent === 100) return `${percent}%`;
  return `${percent.toFixed(1)}%`;
}

function totalScore() {
  return Object.values(setProgress()).reduce((total, record) => {
    const score = Number.isFinite(record?.score) ? record.score : 0;
    return total + score;
  }, 0);
}

function renderScore() {
  els.scoreValue.textContent = String(totalScore());
}

function renderStats() {
  const solver = readySolver();
  const progress = setProgress();
  let best = 0;
  let solved = 0;
  for (let target = TARGET_MIN; target <= TARGET_MAX; target += 1) {
    const status = progress[target]?.status;
    if (status === "best") best += 1;
    if (status === "best" || status === "correct") solved += 1;
  }
  els.bestCount.textContent = best;
  els.solvedCount.textContent = `${solved}/${TARGET_MAX}`;
  els.solvedPercent.textContent = completionPercent(solved);
  els.impossibleCount.textContent = solver ? TARGET_MAX - solver.bestByTarget.size : "-";
  renderScore();
}

function renderPuzzle({ preserveFeedback = false } = {}) {
  els.currentTarget.textContent = state.target;
  els.prevTargetBtn.disabled = state.target <= TARGET_MIN;
  els.nextTargetBtn.disabled = state.target >= TARGET_MAX;
  renderExpression();
  renderCards();
  renderOperators();

  const solver = readySolver();
  const best = bestForTarget();
  const record = targetProgress();
  if (preserveFeedback && state.tokens.length) {
    // Keep the student's immediate interaction feedback while the background solver finishes.
  } else if (!solver) {
    clearFeedbackClass();
    els.feedback.textContent = "最佳解分析中。換題組可以先看到卡牌，不用等分析完成。";
  } else if (!best) {
    setFeedback("warn", "系統已標記：這個目標無法用目前 6 張牌湊出來。");
  } else if (record?.status === "best") {
    setFeedback("good", `這題已有最佳解：${record.expression}`);
  } else if (record?.status === "correct") {
    setFeedback("good", `這題已答對：${record.expression}`);
  } else if (record?.status === "revealed") {
    setFeedback("warn", "這題已有舊版提示紀錄，可以練習重排一次。");
  } else {
    clearFeedbackClass();
    els.feedback.textContent = `目標 ${state.target} 有解。試著用更少符號與卡牌完成。`;
  }

  renderTargetMap();
  renderStats();
}

function renderAll() {
  renderSetSelect();
  renderSetPreview();
  renderPuzzle();
  updateSolverStatus();
  ensureSolver();
}

function resetCurrentProgress() {
  const id = currentSet().id;
  state.progressBySet[id] = {};
  state.tokens = [];
  saveState();
  deleteOnlineProgressForSet(id);
  renderPuzzle();
}

function clearRandomSets() {
  const removedIds = state.importedSets.map((set) => set.id);
  removedIds.forEach((id) => {
    delete state.progressBySet[id];
    deleteOnlineProgressForSet(id);
    const entry = state.solverBySet.get(id);
    if (entry?.status === "pending") entry.cancelled = true;
    state.solverBySet.delete(id);
  });
  state.importedSets = [];
  state.selectedSetId = builtInSets[0].id;
  state.hashSet = null;
  state.tokens = [];
  state.target = TARGET_MIN;
  syncUrlHashToSet(currentSet());
  saveState();
  renderAll();
  loadOnlineProgressForSet(currentSet().id);
  loadLeaderboard();
  els.randomMessage.textContent = "已清除隨機題組，保留簡單題組。";
}

async function syncFirst100File() {
  if (window.location.protocol === "file:") return;
  try {
    const response = await fetch("first%20100", { cache: "no-store" });
    if (!response.ok) return;
    const nextSets = buildSetsFromFirst100(await response.text());
    if (nextSets.length === 0) return;
    const currentSignature = builtInSets.map((set) => set.cards.join(",")).join("|");
    const nextSignature = nextSets.map((set) => set.cards.join(",")).join("|");
    if (currentSignature === nextSignature) return;
    builtInSets = nextSets;
    state.solverBySet.clear();
    if (!allSets().some((set) => set.id === state.selectedSetId)) state.selectedSetId = builtInSets[0].id;
    saveState();
    renderAll();
  } catch {
    // The embedded copy keeps the app usable when opened directly as a file.
  }
}

function openDrawer() {
  document.body.classList.add("drawer-open");
  els.drawerBackdrop.hidden = false;
  els.settingsDrawer.setAttribute("aria-hidden", "false");
  els.menuBtn.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  document.body.classList.remove("drawer-open");
  els.drawerBackdrop.hidden = true;
  els.settingsDrawer.setAttribute("aria-hidden", "true");
  els.menuBtn.setAttribute("aria-expanded", "false");
}

function openLeaderboardDrawer() {
  document.body.classList.add("leaderboard-open");
  els.leaderboardBackdrop.hidden = false;
  els.leaderboardDrawer.setAttribute("aria-hidden", "false");
  els.leaderboardMenuBtn.setAttribute("aria-expanded", "true");
  loadLeaderboard();
}

function closeLeaderboardDrawer() {
  document.body.classList.remove("leaderboard-open");
  els.leaderboardBackdrop.hidden = true;
  els.leaderboardDrawer.setAttribute("aria-hidden", "true");
  els.leaderboardMenuBtn.setAttribute("aria-expanded", "false");
}

function openAuthModal() {
  els.authModal.hidden = false;
  els.authModalBackdrop.hidden = false;
  renderOnlineStatus();
}

function closeAuthModal() {
  els.authModal.hidden = true;
  els.authModalBackdrop.hidden = true;
}

function bindEvents() {
  els.menuBtn.addEventListener("click", openDrawer);
  els.closeDrawerBtn.addEventListener("click", closeDrawer);
  els.drawerBackdrop.addEventListener("click", closeDrawer);
  els.leaderboardMenuBtn.addEventListener("click", openLeaderboardDrawer);
  els.closeLeaderboardDrawerBtn.addEventListener("click", closeLeaderboardDrawer);
  els.leaderboardBackdrop.addEventListener("click", closeLeaderboardDrawer);
  els.onlineStatus.addEventListener("click", openAuthModal);
  els.closeAuthModalBtn.addEventListener("click", closeAuthModal);
  els.authModalBackdrop.addEventListener("click", closeAuthModal);
  els.closeProfileModalBtn.addEventListener("click", closeProfileModal);
  els.profileModalBackdrop.addEventListener("click", closeProfileModal);

  els.setSelect.addEventListener("change", () => {
    state.selectedSetId = els.setSelect.value;
    if (!state.selectedSetId.startsWith("hash-")) state.hashSet = null;
    state.target = TARGET_MIN;
    state.tokens = [];
    cancelPendingSolvers(state.selectedSetId);
    syncUrlHashToSet(currentSet());
    saveState();
    renderAll();
    loadOnlineProgressForSet(currentSet().id);
    loadLeaderboard();
    closeDrawer();
  });

  els.loginBtn.addEventListener("click", loginOnline);
  els.registerBtn.addEventListener("click", registerOnline);
  els.logoutBtn.addEventListener("click", logoutOnline);
  els.syncNowBtn.addEventListener("click", () => syncOnlineProgressForSet(currentSet().id));
  els.refreshLeaderboardBtn.addEventListener("click", () => loadLeaderboard());
  els.setLeaderboardTab.addEventListener("click", () => setLeaderboardScope("set"));
  els.globalLeaderboardTab.addEventListener("click", () => setLeaderboardScope("global"));

  els.randomSetBtn.addEventListener("click", drawRandomSet);
  els.clearRandomSetsBtn.addEventListener("click", clearRandomSets);
  els.resetProgressBtn.addEventListener("click", resetCurrentProgress);
  els.prevTargetBtn.addEventListener("click", () => setTarget(state.target - 1));
  els.nextTargetBtn.addEventListener("click", () => setTarget(state.target + 1));
  els.checkBtn.addEventListener("click", () => {
    if (isCheckButtonNextReady()) {
      setTarget(state.target + 1);
      return;
    }
    checkAnswer();
  });
  els.hintBtn.addEventListener("click", revealHint);
  els.backspaceBtn.addEventListener("click", () => {
    state.tokens.pop();
    renderExpression();
    renderCards();
    renderOperators();
    renderCheckButton();
  });
  els.clearBtn.addEventListener("click", () => {
    state.tokens = [];
    renderExpression();
    renderCards();
    renderOperators();
    renderCheckButton();
  });

  document.querySelectorAll(".operator-btn").forEach((button) => {
    button.addEventListener("click", () => addOperatorToken(button.dataset.token));
  });

  els.equationDrop.addEventListener("dragover", (event) => {
    event.preventDefault();
    els.equationDrop.classList.add("drag-over");
  });
  els.equationDrop.addEventListener("dragleave", () => {
    els.equationDrop.classList.remove("drag-over");
  });
  els.equationDrop.addEventListener("drop", (event) => {
    event.preventDefault();
    els.equationDrop.classList.remove("drag-over");
    const cardIndex = Number(event.dataTransfer.getData("text/plain") || state.draggingCardIndex);
    if (!canAddCardToken()) {
      rejectMove("兩張牌不能直接相鄰，請先放一個運算符號。");
      return;
    }
    if (Number.isInteger(cardIndex)) addCardToken(cardIndex);
  });

  window.addEventListener("keydown", (event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      event.target?.isContentEditable
    ) {
      return;
    }
    if (event.key === "Escape" && !els.profileModal.hidden) {
      closeProfileModal();
    } else if (event.key === "Escape" && !els.authModal.hidden) {
      closeAuthModal();
    } else if (event.key === "Escape" && document.body.classList.contains("drawer-open")) {
      closeDrawer();
    } else if (event.key === "Escape" && document.body.classList.contains("leaderboard-open")) {
      closeLeaderboardDrawer();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      state.tokens.pop();
      renderExpression();
      renderCards();
      renderOperators();
    } else if (event.key === "Enter") {
      checkAnswer();
    } else if (["+", "-", "*", "/", "^", "(", ")"].includes(event.key)) {
      addOperatorToken(event.key);
    } else if (event.key === "ArrowLeft") {
      setTarget(state.target - 1);
    } else if (event.key === "ArrowRight") {
      setTarget(state.target + 1);
    }
  });

  window.addEventListener("hashchange", () => {
    if (!setHashSetFromLocation()) {
      if (state.hashSet) state.hashSet = null;
      if (!allSets().some((set) => set.id === state.selectedSetId)) state.selectedSetId = builtInSets[0].id;
    }
    cancelPendingSolvers(state.selectedSetId);
    saveState();
    renderAll();
    loadOnlineProgressForSet(currentSet().id);
    loadLeaderboard();
  });
}

loadState();
bindEvents();
renderAll();
syncFirst100File();
initializeOnline();
