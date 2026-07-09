/* ═══════════════════════════════════════════════════════════
   wildcock-core.js 테스트 — 실행: node tests/core.test.js
   외부 의존성 없음. 랜덤 알고리즘은 반복 실행으로 불변식 검증.
   ═══════════════════════════════════════════════════════════ */
"use strict";
require("../wildcock-core.js");
var C = globalThis.WC_CORE;

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.error("  ✗ " + name + "\n    " + (e && e.message ? e.message : e)); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || "eq failed") + " — expected " + b + ", got " + a); }

function mkPlayers(n, opts) {
  opts = opts || {};
  var ps = [];
  for (var i = 0; i < n; i++) {
    ps.push({
      id: i + 1,
      name: "P" + (i + 1),
      skill: opts.skills ? opts.skills[i] : (i % 5) + 1,
      gender: opts.genders ? opts.genders[i] : (i % 2 === 0 ? "M" : "F")
    });
  }
  return ps;
}
function teamPlayerIds(t) { return (t.players || []).map(function (p) { return p.id; }); }
function allMatchesOf(rounds) {
  return rounds.reduce(function (a, r) { return a.concat(r.matches); }, []);
}

var REPEAT = 25; // 랜덤성 있는 함수는 반복 검증

console.log("\n[shuffle]");
test("원소 보존 (순열)", function () {
  for (var k = 0; k < REPEAT; k++) {
    var a = [1, 2, 3, 4, 5, 6, 7];
    var s = C.shuffle(a);
    eq(s.length, a.length);
    eq(s.slice().sort().join(","), a.join(","));
    eq(a.join(","), "1,2,3,4,5,6,7", "원본 불변이어야 함");
  }
});

console.log("\n[balanced2]");
test("2인 조 구성, 전원 배정 (짝수)", function () {
  for (var k = 0; k < REPEAT; k++) {
    var ps = mkPlayers(8);
    var t = C.balanced2(ps);
    eq(t.length, 4);
    var ids = t.flatMap(teamPlayerIds).sort(function (a, b) { return a - b; });
    eq(ids.join(","), "1,2,3,4,5,6,7,8");
    t.forEach(function (x) { eq(x.players.length, 2); });
  }
});
test("최고-최저 페어링 (스킬 합 균등)", function () {
  for (var k = 0; k < REPEAT; k++) {
    var ps = mkPlayers(6, { skills: [5, 5, 3, 3, 1, 1] });
    var t = C.balanced2(ps);
    // 정렬 후 양끝 페어링이므로 모든 조의 스킬 합이 6
    t.forEach(function (x) {
      eq(x.players[0].skill + x.players[1].skill, 6, "스킬 합 불균형");
    });
  }
});

console.log("\n[balanced3]");
test("3인 조 구성 (9명 → 3조, 전원 배정)", function () {
  for (var k = 0; k < REPEAT; k++) {
    var t = C.balanced3(mkPlayers(9));
    eq(t.length, 3);
    var ids = t.flatMap(teamPlayerIds);
    eq(ids.length, 9);
    eq(new Set(ids).size, 9, "중복 배정");
  }
});

console.log("\n[mixedPair]");
test("남녀 혼성 페어 우선 구성", function () {
  for (var k = 0; k < REPEAT; k++) {
    var ps = mkPlayers(8, { genders: ["M", "M", "M", "M", "F", "F", "F", "F"] });
    var t = C.mixedPair(ps, "balanced");
    eq(t.length, 4);
    t.forEach(function (x) {
      var g = x.players.map(function (p) { return p.gender; }).sort().join("");
      eq(g, "FM", "혼성이 아닌 조 발생: " + g);
    });
  }
});
test("성비 불균형 시 잔여 인원도 전원 배정", function () {
  for (var k = 0; k < REPEAT; k++) {
    var ps = mkPlayers(8, { genders: ["M", "M", "M", "M", "M", "M", "F", "F"] });
    var t = C.mixedPair(ps, "random");
    var ids = t.flatMap(teamPlayerIds);
    eq(ids.length, 8, "전원 배정 실패");
    eq(new Set(ids).size, 8);
  }
});

console.log("\n[genRR — 라운드 로빈]");
test("모든 팀 쌍이 정확히 1회 대결", function () {
  for (var n = 3; n <= 7; n++) {
    var teams = [];
    for (var i = 0; i < n; i++) teams.push({ players: [{ id: i + 1, name: "P" + (i + 1), skill: 3 }] });
    var rounds = C.genRR(teams);
    var seen = {};
    allMatchesOf(rounds).forEach(function (m) {
      var key = [C.tid(m.team1), C.tid(m.team2)].sort().join("|");
      seen[key] = (seen[key] || 0) + 1;
    });
    var pairs = Object.keys(seen);
    eq(pairs.length, n * (n - 1) / 2, n + "팀 대진 쌍 수");
    pairs.forEach(function (p) { eq(seen[p], 1, "중복 대진: " + p); });
  }
});
test("같은 라운드에 같은 팀 중복 출전 없음", function () {
  var teams = [];
  for (var i = 0; i < 6; i++) teams.push({ players: [{ id: i + 1, name: "P" + (i + 1), skill: 3 }] });
  C.genRR(teams).forEach(function (r) {
    var ids = [];
    r.matches.forEach(function (m) { ids.push(C.tid(m.team1), C.tid(m.team2)); });
    eq(new Set(ids).size, ids.length, "라운드 " + r.round + " 중복 출전");
  });
});

console.log("\n[genRRWildcard]");
test("와일드카드가 매 라운드 파트너와 배정되고, 파트너는 상대팀 소속이 아님", function () {
  for (var k = 0; k < REPEAT; k++) {
    var ps = mkPlayers(8);
    var teams = C.balanced2(ps.slice(0, 8));
    var extra = { id: 99, name: "WC", skill: 3, gender: "M" };
    var rounds = C.genRRWildcard(teams, extra, false);
    rounds.forEach(function (r) {
      r.matches.forEach(function (m) {
        [m.team1, m.team2].forEach(function (t) {
          assert(!t.isWildcard, "미해결 와일드카드 팀 잔존");
          if (t.isBonus) {
            var ids = teamPlayerIds(t);
            assert(ids.indexOf(99) >= 0, "보너스 팀에 와일드카드 없음");
            eq(ids.length, 2, "와일드카드 파트너 미배정");
            var opp = t === m.team1 ? m.team2 : m.team1;
            var oppIds = new Set(teamPlayerIds(opp));
            assert(!oppIds.has(ids[0] === 99 ? ids[1] : ids[0]), "파트너가 상대팀 소속");
          }
        });
      });
    });
  }
});

console.log("\n[genT — 토너먼트]");
test("브래킷 2^k 확장, 결승 1경기", function () {
  for (var n = 3; n <= 9; n++) {
    var teams = [];
    for (var i = 0; i < n; i++) teams.push({ players: [{ id: i + 1, name: "P" + (i + 1), skill: 3 }] });
    var rounds = C.genT(teams);
    var last = rounds[rounds.length - 1];
    eq(last.matches.length, 1, n + "팀 결승 경기 수");
    eq(last.label, "결승");
    var sz = 1; while (sz < n) sz *= 2;
    eq(rounds[0].matches.length, sz / 2, n + "팀 1라운드 경기 수");
  }
});

console.log("\n[scheduleSlots — 불변식]");
function mkRounds(nTeams) {
  var teams = [];
  for (var i = 0; i < nTeams; i++) {
    teams.push({ players: [{ id: i * 2 + 1, name: "A" + i, skill: 3 }, { id: i * 2 + 2, name: "B" + i, skill: 3 }] });
  }
  return { teams: teams, rounds: C.genRR(teams) };
}
function slotInvariants(slots, rounds, cc) {
  // 1) 매치 보존: 개수 + (tid,tid) 멀티셋 동일
  var orig = allMatchesOf(rounds).map(function (m) { return [C.tid(m.team1), C.tid(m.team2)].sort().join("|"); }).sort();
  var got = allMatchesOf(slots).map(function (m) { return [C.tid(m.team1), C.tid(m.team2)].sort().join("|"); }).sort();
  eq(got.join(";"), orig.join(";"), "매치 유실/변형");
  slots.forEach(function (s) {
    // 2) 같은 슬롯 내 선수 중복 없음
    var pids = [];
    s.matches.forEach(function (m) {
      (m.team1.players || []).concat(m.team2.players || []).forEach(function (p) { pids.push(p.id); });
    });
    eq(new Set(pids).size, pids.length, "슬롯 " + s.round + " 내 선수 중복 출전");
    // 3) 코트 번호 범위 + 슬롯 내 코트 중복 없음
    var courts = s.matches.map(function (m) { return m.court; });
    courts.forEach(function (c) { assert(c >= 1 && c <= cc, "코트 범위 초과: " + c); });
    eq(new Set(courts).size, courts.length, "슬롯 " + s.round + " 코트 중복");
    // 4) 슬롯당 매치 수 ≤ 코트 수
    assert(s.matches.length <= cc, "코트 수 초과 배정");
  });
}
test("선수 중복/매치 보존/코트 범위 (5~8팀 × 2~4코트 × 최적화 on/off)", function () {
  for (var nT = 5; nT <= 8; nT++) {
    for (var cc = 2; cc <= 4; cc++) {
      [false, true].forEach(function (opt) {
        var x = mkRounds(nT);
        var slots = C.scheduleSlots(x.rounds, cc, opt);
        slotInvariants(slots, x.rounds, cc);
      });
    }
  }
});
test("코트 1개면 원본 그대로 반환", function () {
  var x = mkRounds(5);
  var out = C.scheduleSlots(x.rounds, 1, false);
  assert(out === x.rounds, "cc=1일 때 통과 동작이어야 함");
});

console.log("\n[scheduleSlots — 품질 지표]");
/* 스케줄 품질 채점 (테스트 전용, 구현과 독립적으로 정의):
   연속 슬롯 출전 1회당 +50, 3연속부터 +1000, 4슬롯 이상 공백 +40 */
function qualityScore(slots) {
  var lp = {}, cn = {}, pen = 0;
  slots.forEach(function (s, si) {
    s.matches.forEach(function (m) {
      (m.team1.players || []).concat(m.team2.players || []).forEach(function (p) {
        var pid = p.id;
        if (lp[pid] === si - 1) { pen += 50; var c = cn[pid] || 0; if (c >= 2) pen += 1000; else if (c >= 1) pen += 100; }
        if (lp[pid] !== undefined && si - lp[pid] >= 4) pen += 40;
        cn[pid] = lp[pid] === si - 1 ? (cn[pid] || 0) + 1 : 1;
        lp[pid] = si;
      });
    });
  });
  return pen;
}
test("최적화 모드가 비최적화 대비 평균 품질 저하 없음", function () {
  var sumOn = 0, sumOff = 0;
  for (var k = 0; k < 10; k++) {
    var x = mkRounds(7);
    sumOff += qualityScore(C.scheduleSlots(x.rounds, 3, false));
    sumOn += qualityScore(C.scheduleSlots(x.rounds, 3, true));
  }
  assert(sumOn <= sumOff * 1.05, "최적화 on(" + sumOn + ") > off(" + sumOff + ") — 휴식 최적화가 오히려 악화");
});

console.log("\n결과: " + passed + " 통과, " + failed + " 실패");
process.exit(failed ? 1 : 0);
