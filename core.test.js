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

console.log("\n[ELO 레이팅]");
function mkSession(id,date,names,skills,matchData){
  return{id:id,date:date,players:names.map(function(n,i){return{name:n,skill:skills[i],gender:null}}),matchData:matchData};
}
test("초기값: Lv 반영 (Lv1=1300 ~ Lv5=1700)", function () {
  eq(C.eloInit(1),1300);eq(C.eloInit(3),1500);eq(C.eloInit(5),1700);eq(C.eloInit(undefined),1500);
});
test("승자 상승·패자 하락 + 제로섬 (2v2)", function () {
  var r=C.eloCompute([mkSession(1,"2026-01-01",["a","b","c","d"],[3,3,3,3],[{t1:["a","b"],t2:["c","d"],s1:21,s2:15}])]);
  assert(r.ratings.a>1500&&r.ratings.b>1500,"승자 미상승");
  assert(r.ratings.c<1500&&r.ratings.d<1500,"패자 미하락");
  eq(r.ratings.a,r.ratings.b,"팀원 동일 변동 아님");
  var sum=r.ratings.a+r.ratings.b+r.ratings.c+r.ratings.d;
  assert(Math.abs(sum-6000)<1e-9,"제로섬 위반: "+sum);
  eq(r.games.a,1);
});
test("점수차 가중: 압살이 접전보다 변동 큼", function () {
  var close=C.eloCompute([mkSession(1,"2026-01-01",["a","b","c","d"],[3,3,3,3],[{t1:["a","b"],t2:["c","d"],s1:21,s2:19}])]);
  var blowout=C.eloCompute([mkSession(1,"2026-01-01",["a","b","c","d"],[3,3,3,3],[{t1:["a","b"],t2:["c","d"],s1:21,s2:5}])]);
  assert(blowout.ratings.a-1500>close.ratings.a-1500,"압살("+(blowout.ratings.a-1500).toFixed(1)+") <= 접전("+(close.ratings.a-1500).toFixed(1)+")");
});
test("팀 단위 기대승률: 약팀 승리가 강팀 승리보다 변동 큼", function () {
  var upset=C.eloCompute([mkSession(1,"2026-01-01",["a","b","c","d"],[1,1,5,5],[{t1:["a","b"],t2:["c","d"],s1:21,s2:15}])]);
  var expected=C.eloCompute([mkSession(1,"2026-01-01",["a","b","c","d"],[5,5,1,1],[{t1:["a","b"],t2:["c","d"],s1:21,s2:15}])]);
  var upsetGain=upset.ratings.a-C.eloInit(1),expectedGain=expected.ratings.a-C.eloInit(5);
  assert(upsetGain>expectedGain,"이변 보상("+upsetGain.toFixed(1)+") <= 예상승("+expectedGain.toFixed(1)+")");
});
test("시간순 소급: 세션 순서를 섞어 넣어도 결과 동일 (결정적)", function () {
  var s1=mkSession(1,"2026-01-01",["a","b","c","d"],[3,3,3,3],[{t1:["a","b"],t2:["c","d"],s1:21,s2:10}]);
  var s2=mkSession(2,"2026-02-01",["a","b","c","d"],[3,3,3,3],[{t1:["a","c"],t2:["b","d"],s1:15,s2:21}]);
  var r1=C.eloCompute([s1,s2]),r2=C.eloCompute([s2,s1]);
  ["a","b","c","d"].forEach(function(n){assert(Math.abs(r1.ratings[n]-r2.ratings[n])<1e-9,n+" 순서 의존")});
});
test("잘못된 매치 무시 (점수 없음·동점·빈 팀) + 고정파트너 양팀 출전 시 상쇄", function () {
  var r=C.eloCompute([mkSession(1,"2026-01-01",["a","b","c"],[3,3,3],[
    {t1:["a","b"],t2:["c"],s1:"",s2:""},
    {t1:["a","b"],t2:["c"],s1:21,s2:21},
    {t1:[],t2:["c"],s1:21,s2:1},
    {t1:["a","x"],t2:["c","x"],s1:21,s2:10}
  ])]);
  eq(r.games.a,1,"유효 매치는 1개여야 함");
  assert(Math.abs(r.ratings.x-1500)<1e-9,"양팀 출전자는 변동 상쇄돼야 함");
});
test("eloToLevel 구간", function () {
  eq(C.eloToLevel(1300),1);eq(C.eloToLevel(1400),2);eq(C.eloToLevel(1500),3);eq(C.eloToLevel(1600),4);eq(C.eloToLevel(1700),5);
});

console.log("\n[ELO 성별 구성 보정]");
/* 합성 데이터: 레이팅상 동급인데 MM팀이 MF팀을 70% 승률로 이기는 클럽 */
function mkGenderedSessions(crossMatches,mmWinRate){
  var names=["M1","M2","M3","M4","F1","F2","F3","F4"];
  var players=names.map(function(n){return{name:n,skill:3,gender:n[0]}});
  var md=[];
  for(var i=0;i<crossMatches;i++){
    var mm=[names[i%2*2],names[i%2*2+1]];               /* M1M2 / M3M4 교대 */
    var mf=[names[2-(i%2)*2],names[4+i%4]];             /* 남녀 혼성 */
    var mmWins=i<Math.round(crossMatches*mmWinRate);
    md.push(mmWins?{t1:mm,t2:mf,s1:21,s2:14}:{t1:mm,t2:mf,s1:14,s2:21});
  }
  /* 동일 구성 매치도 섞음 (앵커) */
  for(var j=0;j<10;j++){
    md.push({t1:["M1","F1"],t2:["M3","F3"],s1:j%2?21:15,s2:j%2?15:21});
  }
  return[{id:1,date:"2026-01-01",players:players,matchData:md}];
}
test("MM 우세 데이터 → 보정치 V.MM > 0 (MF 기준)", function () {
  var est=C.eloEstimateCompBonus(mkGenderedSessions(30,0.7));
  eq(est.bonus.MF,0,"MF는 기준 0이어야 함");
  assert(est.bonus.MM>10,"MM 보정이 유의미하게 양수여야 함: "+est.bonus.MM.toFixed(1));
  assert(est.bonus.MM<=120,"상한 초과");
});
test("보정 적용 시 여성 레이팅 오염 감소 (미적용 대비 상승)", function () {
  var sess=mkGenderedSessions(30,0.7);
  var raw=C.eloCompute(sess);
  var est=C.eloEstimateCompBonus(sess);
  var adj=C.eloCompute(sess,32,est.bonus);
  var rawF=(raw.ratings.F1+raw.ratings.F2+raw.ratings.F3+raw.ratings.F4)/4;
  var adjF=(adj.ratings.F1+adj.ratings.F2+adj.ratings.F3+adj.ratings.F4)/4;
  assert(adjF>rawF,"보정 후 여성 평균("+adjF.toFixed(0)+")이 미보정("+rawF.toFixed(0)+")보다 높아야 함");
});
test("교차 구성 표본 부족 시 보정 ≈ 0 (무해성)", function () {
  var est=C.eloEstimateCompBonus(mkGenderedSessions(3,1.0)); /* 3매치 전승이라도 */
  assert(Math.abs(est.bonus.MM)<40,"소표본 보정이 과해선 안 됨: "+est.bonus.MM.toFixed(1));
});
test("동일 구성 매치만 있으면 보정 0", function () {
  var players=[{name:"a",skill:3,gender:"M"},{name:"b",skill:3,gender:"M"},{name:"c",skill:3,gender:"M"},{name:"d",skill:3,gender:"M"}];
  var est=C.eloEstimateCompBonus([{id:1,date:"2026-01-01",players:players,matchData:[{t1:["a","b"],t2:["c","d"],s1:21,s2:10}]}]);
  eq(est.bonus.MM,0);eq(est.bonus.FF,0);
});
test("역호환: bonus 미지정 eloCompute는 기존 결과와 동일", function () {
  var sess=mkGenderedSessions(10,0.5);
  var r1=C.eloCompute(sess),r2=C.eloCompute(sess,32,{MM:0,MF:0,FF:0});
  Object.keys(r1.ratings).forEach(function(n){assert(Math.abs(r1.ratings[n]-r2.ratings[n])<1e-9,n)});
});
test("성별 미상·3인조 팀은 보정 미적용 (null comp)", function () {
  eq(C.eloTeamComp(["a","b"],{a:"M",b:null}),null);
  eq(C.eloTeamComp(["a","b","c"],{a:"M",b:"M",c:"M"}),null);
  eq(C.eloTeamComp(["a","b"],{a:"M",b:"F"}),"MF");
  eq(C.eloTeamComp(["a","b"],{a:"F",b:"F"}),"FF");
});

test("표본이 커질수록 보정치 단조 증가 (레이팅 흡수에 면역)", function () {
  var v30=C.eloEstimateCompBonus(mkGenderedSessions(30,0.7)).bonus.MM;
  var v100=C.eloEstimateCompBonus(mkGenderedSessions(100,0.7)).bonus.MM;
  var v200=C.eloEstimateCompBonus(mkGenderedSessions(200,0.7)).bonus.MM;
  assert(v30>0&&v100>v30&&v200>=v100,"단조성 위반: "+v30.toFixed(1)+" → "+v100.toFixed(1)+" → "+v200.toFixed(1));
});
test("우세 없는 데이터(승률 50%)면 보정 0", function () {
  var v=C.eloEstimateCompBonus(mkGenderedSessions(200,0.5)).bonus;
  assert(Math.abs(v.MM)<5&&Math.abs(v.FF)<5,"허위 보정 발생: MM="+v.MM.toFixed(1));
});

console.log("\n결과: " + passed + " 통과, " + failed + " 실패");
process.exit(failed ? 1 : 0);