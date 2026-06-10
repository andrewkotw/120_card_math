"use strict";

const TARGET_MIN = 1;
const TARGET_MAX = 120;
const STORAGE_KEY = "math-card-120-mvp-v1";
const RULE_VERSION = 2;
const MAX_ABS = 100000000n;
const MAX_EXPONENT = 13n;
const MAX_CANDIDATES_PER_VALUE = 5;

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

const SYMBOL_BITS = {
  "+": 1 << 0,
  "-": 1 << 1,
  "*": 1 << 2,
  "/": 1 << 3,
  "^": 1 << 4,
  "(": 1 << 5,
  ")": 1 << 6,
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
  activeSetChip: document.getElementById("activeSetChip"),
  targetCard: document.querySelector(".target-card"),
  setSelect: document.getElementById("setSelect"),
  setPreview: document.getElementById("setPreview"),
  solverState: document.getElementById("solverState"),
  randomSetBtn: document.getElementById("randomSetBtn"),
  clearRandomSetsBtn: document.getElementById("clearRandomSetsBtn"),
  randomMessage: document.getElementById("randomMessage"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
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
}

function candidateCost(candidate) {
  return [candidate.symbolCount, candidate.cardCount, candidate.expr.length, candidate.expr];
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
          if (workCounter % 160 === 0) {
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
  if ((left.symbolMask & right.symbolMask) !== 0) return;
  const rendered = renderBinary(left, right, op);
  if (rendered.parenPairs > 1) return;

  let symbolMask = left.symbolMask | right.symbolMask;
  const opBit = SYMBOL_BITS[op];
  if ((symbolMask & opBit) !== 0) return;
  symbolMask |= opBit;

  if (rendered.parenPairs === 1) {
    const parenMask = SYMBOL_BITS["("] | SYMBOL_BITS[")"];
    if ((symbolMask & parenMask) !== 0) return;
    symbolMask |= parenMask;
  }

  candidates.push({
    value,
    expr: rendered.expr,
    rootOp: op,
    precedence: PRECEDENCE[op],
    symbolCount: left.symbolCount + right.symbolCount + 1 + rendered.extraParens,
    symbolMask,
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

function usedOperatorSymbols(tokens = state.tokens) {
  return new Set(tokens.filter((token) => token.type === "op").map((token) => token.value));
}

function hasUsedOperator(value, tokens = state.tokens) {
  return usedOperatorSymbols(tokens).has(value);
}

function repeatedOperatorMessage(value) {
  return `「${OP_LABELS[value] ?? value}」這題已經用過了。每個符號最多只能用一次。`;
}

function validateUniqueOperators(tokens = state.tokens) {
  const seen = new Set();
  for (const token of tokens) {
    if (token.type !== "op") continue;
    if (seen.has(token.value)) return { ok: false, message: repeatedOperatorMessage(token.value) };
    seen.add(token.value);
  }
  return { ok: true };
}

function canAddOperatorToken(value) {
  if (hasUsedOperator(value)) return false;
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
  if (hasUsedOperator(value)) {
    rejectMove(repeatedOperatorMessage(value));
    return;
  }
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
  const uniqueOperators = validateUniqueOperators(tokens);
  if (!uniqueOperators.ok) return uniqueOperators;
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
  return { symbols, cards, length: expressionText(tokens).length };
}

function isBestAnswer(cost, best) {
  if (!best) return false;
  if (cost.symbols !== best.symbolCount) return false;
  return cost.cards === best.cardCount;
}

function isCheckButtonNextReady() {
  const record = targetProgress();
  return Boolean(record?.status === "best" && state.tokens.length && expressionText() === record.expression);
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

  if (!solver) {
    record.status = "correct";
    setFeedback("good", "算式正確！最佳成本還在分析中，等一下會更新地圖與提示。");
    ensureSolver();
  } else if (!best) {
    record.status = "correct";
    setFeedback("good", "算式正確！系統原本標成不可能，這題會先記為完成。");
  } else if (isBestAnswer(cost, best)) {
    record.status = "best";
    setFeedback("good", `漂亮，是最佳成本：${cost.symbols} 個符號、${cost.cards} 張牌。`);
  } else {
    record.status = record.revealed ? "revealed" : "correct";
    setFeedback(
      "warn",
      `答對了！還可以更精簡：最佳是 ${best.symbolCount} 個符號、${best.cardCount} 張牌。`
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
    setFeedback("warn", "提示：最佳解還在分析中。完成後會提供最佳成本、使用卡牌、算式形狀與最終答案。");
    return;
  }
  if (!best) {
    setFeedback("warn", "提示：這個目標沒有可行解，系統已標成不可能。");
    return;
  }

  const record = ensureTargetRecord(state.target);
  record.hintLevel = Math.min((record.hintLevel ?? 0) + 1, 4);

  if (record.hintLevel === 1) {
    setFeedback("warn", `提示 1/3：最佳答案需要 ${best.symbolCount} 個符號、${best.cardCount} 張牌。`);
  } else if (record.hintLevel === 2) {
    setFeedback("warn", `提示 2/3：可以試著使用 ${best.ranks.join("、")}。`);
  } else if (record.hintLevel === 3) {
    setFeedback("warn", `提示 3/3：算式形狀是 ${expressionShape(best.expr)}。再按一次才會顯示答案。`);
  } else {
    record.revealed = true;
    if (!record.status || record.status === "tried") record.status = "revealed";
    setFeedback("warn", `完整參考答案：${best.expr}`);
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
    button.draggable = !blocked;
    button.disabled = blocked;
    button.title = !canAddCard && !used.has(card.index) ? "請先放一個運算符號" : "";
    button.addEventListener("click", () => addCardToken(card.index));
    button.addEventListener("dragstart", (event) => {
      if (!canAddCardToken()) {
        event.preventDefault();
        rejectMove("兩張牌不能直接相鄰，請先放一個運算符號。");
        return;
      }
      state.draggingCardIndex = card.index;
      event.dataTransfer.setData("text/plain", String(card.index));
      event.dataTransfer.effectAllowed = "copy";
      button.classList.add("dragging");
      const dragImage = button.cloneNode(true);
      dragImage.classList.remove("dragging");
      dragImage.classList.add("drag-preview");
      dragImage.disabled = false;
      document.body.append(dragImage);
      event.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2);
      window.setTimeout(() => dragImage.remove(), 0);
    });
    button.addEventListener("dragend", () => {
      state.draggingCardIndex = null;
      button.classList.remove("dragging");
    });
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
  if (record?.status === "revealed") return `${target}：已看答案`;
  return `${target}：尚未完成`;
}

function completionPercent(solved) {
  const percent = (solved / TARGET_MAX) * 100;
  if (percent === 0 || percent === 100) return `${percent}%`;
  return `${percent.toFixed(1)}%`;
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
    setFeedback("warn", "這題已看過完整參考答案，可以練習重排一次。");
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
  renderPuzzle();
}

function clearRandomSets() {
  const removedIds = state.importedSets.map((set) => set.id);
  removedIds.forEach((id) => {
    delete state.progressBySet[id];
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

function bindEvents() {
  els.menuBtn.addEventListener("click", openDrawer);
  els.closeDrawerBtn.addEventListener("click", closeDrawer);
  els.drawerBackdrop.addEventListener("click", closeDrawer);

  els.setSelect.addEventListener("change", () => {
    state.selectedSetId = els.setSelect.value;
    if (!state.selectedSetId.startsWith("hash-")) state.hashSet = null;
    state.target = TARGET_MIN;
    state.tokens = [];
    cancelPendingSolvers(state.selectedSetId);
    syncUrlHashToSet(currentSet());
    saveState();
    renderAll();
    closeDrawer();
  });

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
    if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
    if (event.key === "Escape" && document.body.classList.contains("drawer-open")) {
      closeDrawer();
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
  });
}

loadState();
bindEvents();
renderAll();
syncFirst100File();
