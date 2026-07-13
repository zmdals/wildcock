/* ═══════════════════════════════════════════════════════════
   wildcock-core.js — 와일드콕 순수 로직 (UI 비의존)
   app.jsx에서 분리: base64 유틸 · 상수 · 조편성/대진 알고리즘 · 슬롯 스케줄러
   브라우저: window.WC_CORE / Node(테스트): globalThis.WC_CORE 로 노출
   ═══════════════════════════════════════════════════════════ */
(function(global){
"use strict";

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {number} skill  1~5
 * @property {("M"|"F"|null)} gender
 *
 * @typedef {Object} Team
 * @property {Player[]} [players]
 * @property {boolean} [bye]        부전승 슬롯
 * @property {boolean} [ph]         토너먼트 진출자 placeholder ({name:"R1W1"})
 * @property {string}  [name]       ph 전용 표시명
 * @property {boolean} [isBonus]    와일드카드(홀수 인원) 팀
 * @property {boolean} [isWildcard] genRRWildcard 내부 전용 마커
 * @property {boolean} [isSmall]    3인조 편성 시 2인 소조
 *
 * @typedef {Object} Match
 * @property {Team} team1
 * @property {Team} team2
 * @property {string} s1  점수(입력 전 "")
 * @property {string} s2
 * @property {number} [court]
 *
 * @typedef {Object} Round
 * @property {number} round
 * @property {Match[]} matches
 * @property {string} [label]
 */

/* base64 유틸 */
function toBase64(str){return btoa(String.fromCharCode(...new TextEncoder().encode(str)))}
function fromBase64(b64){return new TextDecoder().decode(Uint8Array.from(atob(b64),c=>c.charCodeAt(0)))}

const SK_L=["","입문","초급","중급","상급","고수"];
/* 레벨별 채도 높은 단색 — 초급→고수로 색 톤 변화 (쿨→웜→엘리트) */
const SK_C=["","#0891B2","#16A34A","#E0900A","#DC2626","#7C3AED"];
const GEN_C={M:"#2563EB",F:"#DB2777"};const GEN_L={M:"남",F:"여"};
const COURT_C=["#0B9E5D","#2563EB","#E0900A","#7C3AED"];

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]]}return b}
function balanced2(ps){const s=shuffle([...ps]).sort((a,b)=>b.skill-a.skill);const t=[];let lo=0,hi=s.length-1;while(lo<hi){t.push({players:[s[lo],s[hi]]});lo++;hi--}return t}
function random2(ps){const s=shuffle(ps);const t=[];for(let i=0;i<s.length-1;i+=2)t.push({players:[s[i],s[i+1]]});return t}
function balanced3(ps){const s=shuffle([...ps]).sort((a,b)=>b.skill-a.skill);const n=Math.floor(s.length/3);const t=Array.from({length:n},()=>({players:[]}));let d=1,idx=0;for(const p of s){if(idx>=0&&idx<n)t[idx].players.push(p);idx+=d;if(idx>=n||idx<0){d*=-1;idx+=d}}return t.filter(x=>x.players.length>=2)}
function random3(ps){const s=shuffle(ps);const t=[];for(let i=0;i<s.length-2;i+=3)t.push({players:[s[i],s[i+1],s[i+2]]});return t}
function mixedPair(ps,mode){const ms=ps.filter(p=>p.gender==="M"),fs=ps.filter(p=>p.gender==="F"),us=ps.filter(p=>!p.gender);const t=[];let mL=mode==="balanced"?shuffle([...ms]).sort((a,b)=>b.skill-a.skill):shuffle(ms);let fL=mode==="balanced"?shuffle([...fs]).sort((a,b)=>a.skill-b.skill):shuffle(fs);const n=Math.min(mL.length,fL.length);for(let i=0;i<n;i++)t.push({players:[mL[i],fL[i]]});const rem=[...mL.slice(n),...fL.slice(n),...us];if(rem.length>=2)t.push(...(mode==="balanced"?balanced2(rem):random2(rem)));return t}
function sharePlayer(t1,t2){if(t1.bye||t2.bye||t1.ph||t2.ph)return false;const s=new Set((t1.players||[]).map(p=>p.id));return(t2.players||[]).some(p=>s.has(p.id))}
function tn(t){if(t.bye)return"부전승";if(t.ph)return t.name;return(t.players||[]).map(p=>p.name).join(" · ")}
function tsk(t){return(t.bye||t.ph)?null:(t.players||[]).reduce((s,p)=>s+p.skill,0)}
function tid(t){return t.bye?"bye":t.ph?t.name:(t.players||[]).map(p=>p.id).sort((a,b)=>a-b).join("-")}
function genRR(teams){const r=[];const l=[...teams];if(l.length%2)l.push({bye:true});const n=l.length;for(let i=0;i<n-1;i++){const m=[];for(let j=0;j<n/2;j++){const a=l[j],b=l[n-1-j];if(!a.bye&&!b.bye&&!sharePlayer(a,b))m.push({team1:a,team2:b,s1:"",s2:""})}if(m.length)r.push({round:i+1,matches:m});const last=l.pop();l.splice(1,0,last)}return r}
function genRRWildcard(teams,extra,mixed){
  const WC={players:[extra,{id:-999,name:"?",skill:0,gender:null}],isBonus:true,isWildcard:true};
  const all=[...teams,WC];const raw=genRR(all);
  const avgSum=teams.reduce((s,t)=>s+(t.players||[]).reduce((a,p)=>a+p.skill,0),0)/teams.length;
  const usedIds=[];
  return raw.map(rd=>{
    const wci=rd.matches.findIndex(m=>(m.team1.isWildcard||m.team2.isWildcard));
    if(wci<0)return rd;
    const wm=rd.matches[wci];
    const opp=wm.team1.isWildcard?wm.team2:wm.team1;
    const oppIds=new Set((opp.players||[]).map(p=>p.id));
    const others=rd.matches.filter((_,i)=>i!==wci);
    const cands=[];
    for(const om of others)for(const t of[om.team1,om.team2]){if(t.isBonus||t.bye||t.ph)continue;
      for(const p of(t.players||[])){if(oppIds.has(p.id)||p.id===extra.id)continue;
        const used=usedIds.filter(id=>id===p.id).length;
        const sd=Math.abs(extra.skill+p.skill-avgSum);
        let gOk=true;if(mixed&&extra.gender&&p.gender&&extra.gender===p.gender)gOk=false;
        cands.push({p,team:t,match:om,used,sd,gOk});
      }
    }
    /* bye 라운드 등으로 쉬는 팀의 선수도 파트너 후보에 포함 */
    const playingIds=new Set();
    rd.matches.forEach(m=>{(m.team1.players||[]).forEach(p=>playingIds.add(p.id));(m.team2.players||[]).forEach(p=>playingIds.add(p.id))});
    for(const t of teams){if(t.isBonus||t.bye||t.ph)continue;
      if((t.players||[]).some(p=>playingIds.has(p.id)))continue;
      for(const p of(t.players||[])){if(oppIds.has(p.id)||p.id===extra.id)continue;
        const used=usedIds.filter(id=>id===p.id).length;
        const sd=Math.abs(extra.skill+p.skill-avgSum);
        let gOk=true;if(mixed&&extra.gender&&p.gender&&extra.gender===p.gender)gOk=false;
        cands.push({p,team:t,match:null,used,sd,gOk});
      }
    }
    cands.sort((a,b)=>{if(a.gOk!==b.gOk)return(b.gOk?1:0)-(a.gOk?1:0);if(a.used!==b.used)return a.used-b.used;return a.sd-b.sd});
    if(!cands.length)return rd;
    const chosen=cands[0];usedIds.push(chosen.p.id);
    const wcTeam={players:[extra,chosen.p],isBonus:true};
    const newWm=wm.team1.isWildcard?{...wm,team1:wcTeam}:{...wm,team2:wcTeam};
    const newMatches=rd.matches.map((m,i)=>i===wci?newWm:m);
    return{...rd,matches:newMatches};
  });
}
function genT(teams){let sz=1;while(sz<teams.length)sz*=2;const br=[...teams];while(br.length<sz)br.push({bye:true});const s=shuffle(br);const r=[];let c=s;let rn=1;while(c.length>1){const m=[];for(let i=0;i<c.length;i+=2)m.push({team1:c[i],team2:c[i+1],s1:"",s2:""});const lb=c.length===2?"결승":c.length===4?"준결승":c.length===8?"8강":c.length+"팀";r.push({round:rn,matches:m,label:lb});c=m.map((_,i)=>({ph:true,name:"R"+rn+"W"+(i+1)}));rn++}return r}
function assignCourts(matches,cc){if(cc<=1)return matches;return matches.map(r=>({...r,matches:r.matches.map((m,i)=>({...m,court:(i%cc)+1}))}))}
function scheduleSlots(rounds,cc,optimize){
  if(cc<=1)return rounds;
  const all=rounds.flatMap(r=>r.matches);if(!all.length)return rounds;
  const gp=m=>{const s=new Set();(m.team1.players||[]).forEach(p=>s.add(p.id));(m.team2.players||[]).forEach(p=>s.add(p.id));return s};
  const olap=(a,b)=>{for(const id of a)if(b.has(id))return true;return false};

  const build=(matches)=>{
    const rem=[...matches],slots=[];
    const lp={},cn={},ch={};
    const est=Math.ceil(all.length/cc);
    while(rem.length){
      const si=slots.length,slot=[],sp=new Set(),st=new Set();
      const ramp=est>1?1.6-1.2*Math.min(1,si/(est-1)):1;
      const thresh=150*ramp;
      for(let court=1;court<=cc;court++){
        let bi=-1,bp=1e9;
        for(let i=0;i<rem.length;i++){
          const m=rem[i],mp=gp(m),t1=tid(m.team1),t2=tid(m.team2);
          if(olap(mp,sp)||st.has(t1)||st.has(t2))continue;
          let pen=0;
          for(const pid of mp){
            if(lp[pid]===si-1){pen+=50;const c=cn[pid]||0;if(c>=2)pen+=1000;else if(c>=1)pen+=100}
            if(lp[pid]!==undefined&&si-lp[pid]>=4)pen+=40;
            if(ch[pid]&&ch[pid][court])pen+=5*ch[pid][court];
          }
          if(pen<bp){bp=pen;bi=i}
        }
        if(bi<0)continue;
        if(optimize&&bp>=thresh&&slot.length>0)continue;
        const m=rem.splice(bi,1)[0];const mp=gp(m);
        mp.forEach(id=>sp.add(id));st.add(tid(m.team1));st.add(tid(m.team2));
        slot.push({...m,court});
      }
      if(!slot.length&&rem.length)slot.push({...rem.shift(),court:1});
      for(const m of slot){for(const pid of gp(m)){cn[pid]=lp[pid]===si-1?(cn[pid]||0)+1:1;lp[pid]=si;if(!ch[pid])ch[pid]={};ch[pid][m.court]=(ch[pid][m.court]||0)+1}}
      slots.push({round:si+1,matches:slot,label:"\uC2AC\uB86F "+(si+1)});
    }
    return slots;
  };

  const score=(slots)=>{
    const lp={},cn={},ch={};let pen=0;
    for(let si=0;si<slots.length;si++)for(const m of slots[si].matches){for(const pid of gp(m)){
      if(lp[pid]===si-1){pen+=50;const c=cn[pid]||0;if(c>=2)pen+=1000;else if(c>=1)pen+=100}
      if(lp[pid]!==undefined&&si-lp[pid]>=4)pen+=40;
      if(ch[pid]&&ch[pid][m.court])pen+=5;
      cn[pid]=lp[pid]===si-1?(cn[pid]||0)+1:1;lp[pid]=si;
      if(!ch[pid])ch[pid]={};ch[pid][m.court]=(ch[pid][m.court]||0)+1;
    }}
    return pen;
  };

  /* ── 국소 탐색(local search) ──
     greedy가 만든 스케줄에서 슬롯 간 매치 이동(move)·교환(swap)을 시도해
     score가 감소하면 채택 (first-improvement hill climbing).
     이동은 기존 슬롯의 빈 코트로만 가능 → 슬롯 수는 절대 늘지 않음. */
  const slotOk=(matches,exclude,cand)=>{
    const cp=gp(cand);
    for(const m of matches){if(m===exclude)continue;if(olap(gp(m),cp))return false}
    return true;
  };
  const renumber=(slots)=>slots.filter(s=>s.matches.length).map((s,i)=>({round:i+1,matches:s.matches,label:"슬롯 "+(i+1)}));
  const improve=(slots)=>{
    let cur=slots.map(s=>({...s,matches:[...s.matches]}));
    let curS=score(cur);
    for(let pass=0;pass<25;pass++){
      let found=false;
      outer:
      for(let i=0;i<cur.length;i++)for(let a=0;a<cur[i].matches.length;a++){
        const A=cur[i].matches[a];
        for(let j=0;j<cur.length;j++){
          if(j===i)continue;
          /* move: 슬롯 j의 빈 코트로 이동 */
          if(cur[j].matches.length<cc&&slotOk(cur[j].matches,null,A)){
            const used=new Set(cur[j].matches.map(m=>m.court));let fc=1;while(used.has(fc))fc++;
            const trial=renumber(cur.map((s,si)=>si===i?{...s,matches:s.matches.filter((_,x)=>x!==a)}:si===j?{...s,matches:[...s.matches,{...A,court:fc}]}:s));
            const ts=score(trial);
            if(ts<curS){cur=trial;curS=ts;found=true;break outer}
          }
          /* swap: 슬롯 j의 매치 B와 교환 */
          for(let b=0;b<cur[j].matches.length;b++){
            const B=cur[j].matches[b];
            if(!slotOk(cur[i].matches,A,B)||!slotOk(cur[j].matches,B,A))continue;
            const trial=cur.map((s,si)=>
              si===i?{...s,matches:s.matches.map((m,x)=>x===a?{...B,court:A.court}:m)}
              :si===j?{...s,matches:s.matches.map((m,x)=>x===b?{...A,court:B.court}:m)}:s);
            const ts=score(trial);
            if(ts<curS){cur=trial;curS=ts;found=true;break outer}
          }
        }
      }
      if(!found)break;
    }
    return{slots:cur,s:curS};
  };

  /* restart 12회, 단 총 500ms 예산 초과 시 조기 종료 (최소 1회는 보장) */
  const t0=Date.now();
  let best=null,bestS=1e9;
  for(let i=0;i<12;i++){
    const input=i===0?[...all]:shuffle([...all]);
    const r=improve(build(input));
    if(r.s<bestS){bestS=r.s;best=r.slots}
    if(bestS===0||Date.now()-t0>500)break;
  }
  return best;
}

/* ── ELO 레이팅 ──
   설계: 팀 전력 = 팀 평균 레이팅 + 성별 구성 보정치(MM/MF/FF)
         기대승률은 팀 전력끼리 비교 → 승패 + 완만한 점수차 가중(×1.0~1.5)
         → 팀원 두 명은 동일하게 오르내림 (개인별 차등 없음)
   구성 보정: 남남팀이 구조적으로 유리하다면 그 유리함을 보정치가 흡수해서
              개인 레이팅이 "구성 탓" 승패로 오염되는 것을 막음
   초기값: 1500 + (Lv−3)×100 → Lv1=1300 ~ Lv5=1700 */
function eloInit(skill){return 1500+(((+skill||3))-3)*100}
function eloExpected(rA,rB){return 1/(1+Math.pow(10,(rB-rA)/400))}
/* 점수차 가중: 21-19 → ×1.05, 21-11 → ×1.24, 21-0 → ×1.5 */
function eloMargin(s1,s2){const a=+s1,b=+s2,mx=Math.max(a,b);if(!mx)return 1;return 1+0.5*Math.min(1,Math.abs(a-b)/mx)}
/* 2인 팀의 성별 구성 — 성별 미상·2인 아님 → null (보정 미적용) */
function eloTeamComp(names,genderOf){
  if(!names||names.length!==2)return null;
  const g1=genderOf[names[0]],g2=genderOf[names[1]];
  if(!g1||!g2)return null;
  return g1===g2?(g1==="M"?"MM":"FF"):"MF";
}
/* 세션 배열 전체를 시간순 소급 계산
   bonus: {MM,MF,FF} 구성 보정치(점) — 생략 시 0 (미보정과 동일)
   반환: {ratings:{이름:레이팅}, games:{이름:경기수}} */
function eloCompute(sessions,K,bonus){
  K=K||32;const B=bonus||{};
  const R={},G={};
  const sorted=[...(sessions||[])].sort((a,b)=>{const d1=a&&a.date||"",d2=b&&b.date||"";return d1<d2?-1:d1>d2?1:((a&&a.id)||0)-((b&&b.id)||0)});
  for(const s of sorted){
    if(!s)continue;
    const skillOf={},genderOf={};
    (s.players||[]).forEach(p=>{if(p&&p.name){skillOf[p.name]=p.skill;genderOf[p.name]=p.gender||null}});
    for(const m of(s.matchData||[])){
      const s1=+m.s1,s2=+m.s2;
      if(!isFinite(s1)||!isFinite(s2)||s1===s2)continue;
      const t1=(m.t1||[]).filter(Boolean),t2=(m.t2||[]).filter(Boolean);
      if(!t1.length||!t2.length)continue;
      t1.concat(t2).forEach(n=>{if(R[n]==null){R[n]=eloInit(skillOf[n]);G[n]=0}});
      const r1=t1.reduce((a,n)=>a+R[n],0)/t1.length;
      const r2=t2.reduce((a,n)=>a+R[n],0)/t2.length;
      const c1=eloTeamComp(t1,genderOf),c2=eloTeamComp(t2,genderOf);
      const e1=eloExpected(r1+(B[c1]||0),r2+(B[c2]||0));
      const d=K*eloMargin(s1,s2)*((s1>s2?1:0)-e1);
      t1.forEach(n=>{R[n]+=d;G[n]++});
      t2.forEach(n=>{R[n]-=d;G[n]++});
    }
  }
  return{ratings:R,games:G};
}
/* 구성 보정치 추정 — "선수 내 대조" 방식 (레이팅 비의존 → 흡수·오염 원천 차단)
   원리: 같은 선수가 MM팀일 때와 MF팀일 때의 승률 차이에는 본인 실력이 양쪽에
         똑같이 들어가 상쇄되고, 순수한 구성 효과만 남는다.
   · 교차 구성 매치만 사용, 두 구성 이상을 경험한 선수만 신호에 기여
   · 축소: 가상 매치 N0=40 (표본 3개면 보정 미미, 쌓일수록 실측에 수렴)
   · 파트너 셔플이 전제 — 특정인이 한 구성에만 고정 출전하면 그 사람 몫의 신호는 없음
   · 정규화: 혼성(MF)=0 기준 · 상한 ±120점 */
function eloEstimateCompBonus(sessions){
  const N0=40;
  const per={};
  for(const s of(sessions||[])){
    if(!s)continue;
    const genderOf={};(s.players||[]).forEach(p=>{if(p&&p.name)genderOf[p.name]=p.gender||null});
    for(const m of(s.matchData||[])){
      const s1=+m.s1,s2=+m.s2;
      if(!isFinite(s1)||!isFinite(s2)||s1===s2)continue;
      const t1=(m.t1||[]).filter(Boolean),t2=(m.t2||[]).filter(Boolean);
      const c1=eloTeamComp(t1,genderOf),c2=eloTeamComp(t2,genderOf);
      if(!c1||!c2||c1===c2)continue;
      const rec=(names,c,w)=>names.forEach(n=>{
        const p=per[n]||(per[n]={n:0,w:0,comps:{}});
        const pc=p.comps[c]||(p.comps[c]={n:0,w:0});
        p.n++;p.w+=w;pc.n++;pc.w+=w;
      });
      rec(t1,c1,s1>s2?1:0);rec(t2,c2,s1>s2?0:1);
    }
  }
  const agg={MM:{n:0,ex:0},MF:{n:0,ex:0},FF:{n:0,ex:0}};
  Object.keys(per).forEach(name=>{
    const p=per[name];
    if(Object.keys(p.comps).length<2)return; /* 한 구성만 경험 → 대조 불가 */
    const wbar=p.w/p.n;
    Object.keys(p.comps).forEach(c=>{
      agg[c].n+=p.comps[c].n;
      agg[c].ex+=p.comps[c].w-p.comps[c].n*wbar; /* Σ(승패 − 개인평균) */
    });
  });
  const V={MM:0,MF:0,FF:0};
  ["MM","MF","FF"].forEach(c=>{
    if(!agg[c].n)return;
    const e=Math.max(-0.49,Math.min(0.49,agg[c].ex/(agg[c].n+N0)));
    /* ×0.5: 같은 매치가 양쪽 구성에 대칭 기여해 차이가 2배로 잡히는 것 보정 */
    V[c]=0.5*400*Math.log10((0.5+e)/(0.5-e));
  });
  const ref=V.MF;
  ["MM","MF","FF"].forEach(c=>{V[c]=Math.max(-120,Math.min(120,V[c]-ref))});
  return{bonus:V,stats:agg};
}
/* 레이팅 → 추천 레벨 구간 */
function eloToLevel(r){return r<1350?1:r<1450?2:r<1550?3:r<1650?4:5}

global.WC_CORE={
  toBase64,fromBase64,
  SK_L,SK_C,GEN_C,GEN_L,COURT_C,
  shuffle,balanced2,random2,balanced3,random3,mixedPair,
  sharePlayer,tn,tsk,tid,
  genRR,genRRWildcard,genT,assignCourts,scheduleSlots,
  eloInit,eloExpected,eloMargin,eloTeamComp,eloCompute,eloEstimateCompBonus,eloToLevel
};
})(typeof window!=="undefined"?window:globalThis);
