/* ═══════════════════════════════════════════════════════════
   와일드콕 — 2026 리디자인
   레이어드 라이트 톤 · 단일 포인트 컬러(브랜드 그린) · 세그먼트 컨트롤
   기능 로직은 원본 그대로 유지 (재배치: records를 genShareText 앞으로)
   ═══════════════════════════════════════════════════════════ */
const {useState,useMemo,useRef,useEffect,useCallback}=React;

/* ─────────── 디자인 시스템 스타일시트 ─────────── */
const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#F5F6F8;--card:#FFFFFF;
  --pri:#0B9E5D;--priH:#0A8B52;--pri50:#E9F7F0;--ring:rgba(11,158,93,.18);
  --brand:#0B9E5D;--brand50:#E9F7F0;--gold:#E0900A;
  --danger:#E5484D;--danger50:#FCECEC;--green:#0B9E5D;--orange:#E0900A;--purple:#7C3AED;--pink:#DB2777;--teal:#0891B2;
  --g1:#8A929E;--g2:#C4CAD2;--g3:#E5E8EC;--g4:#F2F4F6;
  --tx:#101418;--tx2:#59616C;--tx3:#8A929E;--bdr:#E5E8EC;--bdr-soft:#EDEFF2;
  --r:16px;--rs:11px;
}
:root.dark{
  --bg:#111316;--card:#1B1E22;
  --pri:#16C47F;--priH:#31D293;--pri50:#16271F;--ring:rgba(22,196,127,.24);
  --brand:#16C47F;--brand50:#16271F;--gold:#F5A623;
  --danger:#FF6369;--danger50:#2A1518;--green:#16C47F;--orange:#F5A623;--purple:#A78BFA;--pink:#F472B6;--teal:#38BDF8;
  --g1:#727A85;--g2:#3A4048;--g3:#2B3037;--g4:#22262B;
  --tx:#F2F4F6;--tx2:#A6AEB8;--tx3:#727A85;--bdr:#2B3037;--bdr-soft:#242830;
}
@media(prefers-color-scheme:dark){:root:not(.light){
  --bg:#111316;--card:#1B1E22;
  --pri:#16C47F;--priH:#31D293;--pri50:#16271F;--ring:rgba(22,196,127,.24);
  --brand:#16C47F;--brand50:#16271F;--gold:#F5A623;
  --danger:#FF6369;--danger50:#2A1518;--green:#16C47F;--orange:#F5A623;--purple:#A78BFA;--pink:#F472B6;--teal:#38BDF8;
  --g1:#727A85;--g2:#3A4048;--g3:#2B3037;--g4:#22262B;
  --tx:#F2F4F6;--tx2:#A6AEB8;--tx3:#727A85;--bdr:#2B3037;--bdr-soft:#242830;
}}
body{font-family:"Pretendard Variable","Pretendard",-apple-system,"Apple SD Gothic Neo","Helvetica Neue",sans-serif;background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;min-height:100vh;transition:background .25s}
input,button,select,textarea{font-family:inherit}

@media print{
  body{background:#fff}.no-print{display:none!important}
  .cd,.print-block{page-break-inside:avoid;break-inside:avoid}
  table{page-break-inside:avoid;break-inside:avoid}h2,h3{page-break-after:avoid;break-after:avoid}
}

/* 헤더 */
.hdr{background:rgba(245,246,248,.82);backdrop-filter:saturate(160%) blur(18px);-webkit-backdrop-filter:saturate(160%) blur(18px);border-bottom:1px solid var(--bdr);position:sticky;top:0;z-index:100}
:root.dark .hdr{background:rgba(17,19,22,.82)}
@media(prefers-color-scheme:dark){:root:not(.light) .hdr{background:rgba(17,19,22,.82)}}
.hdr-in{max-width:800px;margin:0 auto;padding:0 20px}
.ttl{display:flex;align-items:center;gap:11px;padding:15px 0 12px;font-size:25px;font-weight:800;letter-spacing:-.7px;user-select:none}
.ttl img{width:38px;height:38px;border-radius:11px;object-fit:cover;cursor:pointer;background:var(--card);border:1px solid var(--bdr)}
.mt{display:flex;gap:5px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:10px}
.mt>button{padding:9px 15px;font-size:14px;font-weight:700;color:var(--tx3);background:transparent;border:none;border-radius:11px;cursor:pointer;transition:all .18s;white-space:nowrap}
.mt>button:hover{color:var(--tx2);background:var(--g4)}
.mt>button.on{color:var(--brand);background:var(--brand50)}

/* 서브탭 세그먼트 */
.st{display:flex;gap:3px;background:var(--g4);border:1px solid var(--bdr);border-radius:14px;padding:4px}
.st>button{flex:1;padding:10px 0;font-size:13.5px;font-weight:700;color:var(--tx3);background:transparent;border:none;border-radius:10px;cursor:pointer;transition:all .18s}
.st>button:hover:not(.on){color:var(--tx)}
.st>button.on{color:#fff;background:var(--brand)}

.mn{max-width:800px;margin:0 auto;padding:20px 20px 120px}

/* 통계 벤토 */
.bento{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
.stat{background:var(--card);border:1px solid var(--bdr);border-radius:var(--r);padding:17px 18px;transition:border-color .18s}
.stat-l{font-size:12px;font-weight:700;color:var(--tx3);margin-bottom:9px}
.stat-v{font-size:34px;font-weight:800;letter-spacing:-1.2px;line-height:1;display:flex;align-items:baseline;gap:3px}
.stat-u{font-size:14px;font-weight:700;color:var(--tx3);letter-spacing:0}

/* 카드 — 그림자 없음, 배경 대비 + 1px 보더로 레이어 */
.cd{background:var(--card);border:1px solid var(--bdr);border-radius:var(--r);padding:20px;margin-bottom:14px}
.sl{font-size:13px;font-weight:800;color:var(--tx2);letter-spacing:-.1px;margin-bottom:15px;display:flex;align-items:center;gap:8px}
.sl::before{content:"";width:3px;height:14px;border-radius:2px;background:var(--brand);flex:0 0 auto}

.inp{width:100%;padding:11px 14px;font-size:15px;font-weight:500;border:1px solid var(--bdr);border-radius:var(--rs);outline:none;background:var(--g4);color:var(--tx);transition:border-color .18s,box-shadow .18s,background .18s}
.inp:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--ring);background:var(--card)}
.inp::placeholder{color:var(--tx3)}

.btn{padding:11px 20px;font-size:14px;font-weight:700;border:none;border-radius:var(--rs);cursor:pointer;transition:all .16s;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}
.bp{color:#fff;background:var(--brand)}.bp:hover{background:var(--priH)}.bp:disabled{opacity:.4;cursor:not-allowed}
.bs{color:var(--brand);background:var(--brand50)}.bs:hover{filter:brightness(.96)}
.bgn{color:#fff;background:var(--brand)}.bgn:hover{background:var(--priH)}.bgn:disabled{opacity:.4;cursor:not-allowed}
.bd{color:var(--danger);background:var(--danger50)}.bd:hover{filter:brightness(.97)}
.bf{width:100%;justify-content:center}

/* 칩 (구 pill — 각진 형태로 de-pill) */
.pill{padding:8px 15px;font-size:13px;font-weight:700;border:1px solid var(--bdr);border-radius:10px;cursor:pointer;transition:all .16s;background:var(--card);color:var(--tx2)}
.p-off:hover{background:var(--g4);color:var(--tx)}
.p-on{color:#fff;background:var(--brand);border-color:var(--brand)}

/* 배지 — 채도 높은 단색 + 흰 텍스트 */
.badge{display:inline-flex;align-items:center;padding:3px 9px;font-size:11px;font-weight:800;border-radius:8px;color:#fff;letter-spacing:.1px;line-height:1.4}

/* 리스트 항목 — 부드러운 등장 트랜지션 */
.ri{display:flex;align-items:center;gap:10px;padding:11px 13px;background:var(--g4);border-radius:12px;border:1px solid transparent;transition:background .18s,border-color .18s;animation:riIn .3s cubic-bezier(.22,1,.36,1)}
.ri+.ri{margin-top:7px}
.ri:hover{background:var(--g3)}
@keyframes riIn{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}

.tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.tc{padding:15px;background:var(--g4);border-radius:14px;border:1px solid var(--bdr-soft);animation:riIn .3s cubic-bezier(.22,1,.36,1)}
.tc.bonus{border:1.5px dashed var(--gold);background:rgba(224,144,10,.07)}

.mr{display:flex;align-items:center;background:var(--g4);border-radius:13px;overflow:hidden;border:1px solid var(--bdr-soft)}
.mr+.mr{margin-top:8px}
.msd{flex:1;padding:12px 12px;text-align:center}.msd-n{font-size:13.5px;font-weight:700}.msd-s{font-size:11px;color:var(--tx3);margin-top:3px;font-weight:600}
.hint{font-size:13px;color:var(--tx2);line-height:1.65;margin-bottom:14px}
.es{text-align:center;padding:48px 20px}.es-i{font-size:38px;margin-bottom:12px}.es-t{font-size:16px;font-weight:700;margin-bottom:6px}.es-s{font-size:14px;color:var(--tx2)}
.bye-b{background:rgba(224,144,10,.07);border:1px solid rgba(224,144,10,.28)}
.fb{display:flex;justify-content:space-between;align-items:center}
.fg{display:flex;gap:8px;align-items:center}.fw{flex-wrap:wrap}

/* 세그먼트 컨트롤 (실력/성별) */
.seg{display:inline-flex;background:var(--g4);border:1px solid var(--bdr);border-radius:12px;padding:3px;gap:2px}
.seg.sm{border-radius:10px;padding:2px}
.seg-btn{min-width:37px;height:37px;border:none;background:transparent;color:var(--tx3);font-weight:800;font-size:14px;border-radius:9px;cursor:pointer;transition:all .16s;display:flex;align-items:center;justify-content:center;padding:0 4px}
.seg.sm .seg-btn{min-width:28px;height:28px;font-size:12px;border-radius:7px}
.seg-btn:hover:not(.on){color:var(--tx)}
.seg-btn.on{color:#fff}

.si{width:42px;height:38px;text-align:center;font-size:17px;font-weight:800;border:1.5px solid var(--bdr);border-radius:9px;background:var(--card);color:var(--tx);outline:none;transition:border-color .16s,box-shadow .16s}.si:focus{border-color:var(--brand);box-shadow:0 0 0 3px var(--ring)}
.sc{font-size:19px;font-weight:800;color:var(--g2);margin:0 5px}
.wt{font-size:10px;font-weight:800;color:#fff;background:var(--brand);padding:2px 8px;border-radius:7px;margin-top:5px;display:inline-block;letter-spacing:.3px}
.ls{opacity:.42}
.dual-tag{font-size:9px;font-weight:800;color:var(--gold);background:rgba(224,144,10,.14);padding:1px 6px;border-radius:6px;margin-left:4px}
.court-tag{font-size:9px;font-weight:800;color:#fff;padding:2px 8px;border-radius:6px;margin-bottom:6px;display:inline-block;letter-spacing:.2px}
.rr{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px}.rr:nth-child(even){background:var(--g4)}
.rb{height:6px;border-radius:4px;background:var(--g3);flex:1;overflow:hidden}.rf{height:100%;border-radius:4px;background:var(--brand);transition:width .35s}
.dp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:7px;margin-top:12px}
.dp-btn{padding:10px;border-radius:11px;border:1.5px solid var(--bdr);background:var(--g4);cursor:pointer;text-align:center;transition:all .16s;font-family:inherit}.dp-btn:hover{border-color:var(--brand);background:var(--brand50)}
.dutch-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;background:var(--g4);margin-bottom:6px}
.dutch-row .name{flex:1;font-size:14px;font-weight:500}.dutch-row .amount{font-size:16px;font-weight:800;color:var(--brand)}
.check-btn{width:24px;height:24px;border-radius:7px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .16s}.check-btn.on{border-color:var(--brand);background:var(--brand);color:#fff}
.toast{position:fixed;top:82px;left:50%;transform:translateX(-50%);background:#101418;color:#fff;padding:12px 22px;border-radius:13px;font-size:14px;font-weight:600;z-index:9999;animation:tin .3s ease-out;box-shadow:0 8px 30px rgba(0,0,0,.22);max-width:90vw;text-align:center}
@keyframes tin{0%{opacity:0;transform:translateX(-50%) translateY(-10px)}100%{opacity:1;transform:translateX(-50%) translateY(0)}}

/* 서바이벌 룰렛 */
.virus-grid{display:grid;gap:8px}
.virus-cell{padding:10px 6px;border-radius:12px;text-align:center;border:2px solid var(--bdr);background:var(--g4);transition:all .25s ease}
.vc-emoji{font-size:24px;margin-bottom:3px;transition:transform .15s}
.vc-name{font-size:12px;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.virus-cell.danger{border-color:#E5484D;background:linear-gradient(135deg,#FFF0F0,#FFE0E0);box-shadow:0 0 16px rgba(229,72,77,.32);transform:scale(1.06)}
.virus-cell.danger .vc-emoji{animation:bombShake .15s ease infinite alternate}
.virus-cell.eliminated{border-color:var(--bdr);background:var(--g4);opacity:.15;transform:scale(.85);transition:all .5s ease}
.virus-cell.picked{border-color:#E5484D;background:linear-gradient(135deg,#FFE0E0,#FFCCCC);animation:hitPop .4s ease-out}
.virus-cell.picked .vc-name{color:#C62828}
.virus-cell.dimmed{opacity:.35;transform:scale(.95);transition:all .5s}
.virus-cell.scanning{border-color:var(--brand);background:var(--brand50);box-shadow:0 0 14px var(--ring);transform:scale(1.06)}
.virus-cell.winner{border-color:var(--gold);background:linear-gradient(135deg,#FFF8E1,#FFE082);animation:winPop .5s ease-out}
.virus-cell.winner .vc-name{color:#B45309;font-weight:800}
.sv-status{text-align:center;padding:10px;font-size:13px;font-weight:700;color:var(--tx2);margin-bottom:8px}
.sv-round{display:inline-block;background:var(--g4);padding:5px 15px;border-radius:20px;font-size:12px;font-weight:700;color:var(--tx2)}
@keyframes bombShake{0%{transform:rotate(-8deg) scale(1.1)}100%{transform:rotate(8deg) scale(1.1)}}
@keyframes hitPop{0%{transform:scale(1.2);box-shadow:0 0 25px rgba(229,72,77,.5)}100%{transform:scale(1);box-shadow:none}}
@keyframes winPop{0%{transform:scale(.8)}50%{transform:scale(1.12)}100%{transform:scale(1)}}

.confetti-container{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000;overflow:hidden}
.share-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
.share-modal{background:var(--bg);border:1px solid var(--bdr);border-radius:18px;max-width:420px;width:100%;padding:24px;max-height:90vh;overflow-y:auto}
.share-pre{font-size:11px;background:var(--g4);padding:12px;border-radius:10px;max-height:180px;overflow:auto;white-space:pre-wrap;font-family:inherit;line-height:1.6;border:1px solid var(--bdr)}
.confetti-piece{position:absolute;width:10px;height:10px;top:-20px;animation:confettiFall 3s ease-in forwards}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
.party-mode{animation:rainbow 2s linear}
@keyframes rainbow{0%{filter:hue-rotate(0deg)}50%{filter:hue-rotate(180deg)}100%{filter:hue-rotate(360deg)}}

@media(max-width:500px){.ttl{font-size:21px}.bento{gap:8px}.stat{padding:13px 14px}.stat-v{font-size:26px}.tg{grid-template-columns:1fr}.msd-n{font-size:12.5px}.mt>button{padding:9px 12px;font-size:13px}.dp-grid{grid-template-columns:repeat(auto-fill,minmax(80px,1fr))}.vc-emoji{font-size:20px}.vc-name{font-size:11px}.virus-cell{padding:8px 4px}}

.dm-btn{background:var(--g4);border:1px solid var(--bdr);font-size:16px;cursor:pointer;width:34px;height:34px;border-radius:10px;line-height:1;transition:all .18s;display:inline-flex;align-items:center;justify-content:center}.dm-btn:hover{background:var(--g3)}
.app-footer{text-align:center;padding:22px 20px 40px;font-size:11px;color:var(--tx3);line-height:1.9;user-select:none}
.app-footer a{color:var(--tx2);text-decoration:none;transition:color .2s}.app-footer a:hover{color:var(--brand)}
.app-footer .sep{margin:0 6px;opacity:.5}
`;

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

  let best=null,bestS=1e9;
  for(let i=0;i<30;i++){
    const input=i===0?[...all]:shuffle([...all]);
    const result=build(input);const s=score(result);
    if(s<bestS){bestS=s;best=result}
  }
  return best;
}

/* 인쇄 */
function printSheet(allTeams,matches,mt,dualInfo,records,toast){
  const d=new Date();const ds=`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
  const real=allTeams.filter(t=>!t.bye&&!t.ph);
  const allScored=matches.length>0&&matches.every(r=>r.matches.every(m=>m.s1!==""&&m.s2!==""));
  const anyScored=matches.some(r=>r.matches.some(m=>m.s1!==""&&m.s2!==""));
  let p=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>대진표</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",sans-serif;padding:28px;color:#101418;font-size:13px}
h1{font-size:22px;text-align:center;margin-bottom:4px}.dt{text-align:center;color:#666;margin-bottom:24px;font-size:12px}
h2{font-size:15px;margin:24px 0 10px;border-bottom:2px solid #333;padding-bottom:5px;page-break-after:avoid;break-after:avoid}
h3{font-size:13px;margin:16px 0 8px;color:#444;page-break-after:avoid;break-after:avoid}
table{width:100%;border-collapse:collapse;margin-bottom:16px;page-break-inside:avoid;break-inside:avoid}
th,td{border:1px solid #999;padding:8px 10px;text-align:center}th{background:#f0f0f0;font-weight:600;font-size:12px}
.ec{height:36px}.info{background:#FFF8F0;border:1px solid #FFD699;padding:10px 14px;border-radius:6px;margin-bottom:14px;font-size:12px;page-break-inside:avoid;break-inside:avoid}
.tgr{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:16px;page-break-inside:avoid;break-inside:avoid}
.tb{border:1px solid #ccc;border-radius:6px;padding:10px 12px}.tb.bonus{border:1.5px dashed #E0900A;background:#FFFBF5}
.tl{font-weight:700;color:#0B9E5D;font-size:11px;margin-bottom:4px}.tp{font-size:13px}.ts{font-size:11px;color:#888;margin-top:2px}
.memo-box{border:1px solid #ccc;border-radius:6px;height:80px;margin-bottom:20px;page-break-inside:avoid;break-inside:avoid}
.ft{margin-top:40px;text-align:center;font-size:10px;color:#aaa}
.win-cell{font-weight:700;color:#0B9E5D}
.round-block{page-break-inside:avoid;break-inside:avoid}
@media print{body{padding:16px}@page{margin:12mm}}</style></head><body>`;
  p+=`<h1>🏸 와일드콕 대진표</h1><p class="dt">${ds}</p>`;
  if(dualInfo)p+=`<div class="info">👥 듀얼: <strong>${dualInfo.dual.name}</strong> → ${dualInfo.extra.name} 와일드카드 팀 (양쪽 출전)</div>`;
  p+=`<h2>조 편성 (${real.length}개 조)</h2><div class="tgr">`;
  real.forEach((t,i)=>{const nm=(t.players||[]).map(x=>x.name).join(" · ");const sk=(t.players||[]).reduce((s,x)=>s+x.skill,0);p+=`<div class="tb${t.isBonus?' bonus':''}"><div class="tl">${t.isBonus?'와일드카드':'조 '+(i+1)}</div><div class="tp">${nm}</div><div class="ts">실력 합: ${sk}</div></div>`});
  p+=`</div>`;
  if(matches.length){
    p+=`<h2>${mt==="roundrobin"?"라운드 로빈":"토너먼트"} 대진표</h2>`;
    matches.forEach(r=>{
      const hasCourt=r.matches[0]?.court;
      p+=`<div class="round-block"><h3>${r.label||"라운드 "+r.round} (${r.matches.length}경기)</h3>`;
      p+=`<table><tr><th style="width:30px">#</th>${hasCourt?'<th style="width:50px">코트</th>':''}<th>팀 A</th><th style="width:100px">스코어</th><th>팀 B</th><th style="width:80px">승자</th></tr>`;
      r.matches.forEach((m,i)=>{
        const hasScore=m.s1!==""&&m.s2!=="";
        const a=parseInt(m.s1,10),b=parseInt(m.s2,10);
        const scoreStr=hasScore?`${m.s1} : ${m.s2}`:"";
        const winStr=hasScore&&!isNaN(a)&&!isNaN(b)?(a>b?tn(m.team1):b>a?tn(m.team2):"무승부"):"";
        p+=`<tr><td>${i+1}</td>${m.court?`<td>${m.court}</td>`:''}<td>${tn(m.team1)}</td><td${hasScore?'':' class="ec"'}>${scoreStr}</td><td>${tn(m.team2)}</td><td${hasScore?' class="win-cell"':' class="ec"'}>${winStr}</td></tr>`;
      });
      p+=`</table></div>`;
    });
  }
  p+=`<h2>📊 순위표</h2><table><tr><th style="width:40px">순위</th><th>팀명</th><th style="width:40px">승</th><th style="width:40px">패</th><th style="width:50px">승점</th><th style="width:60px">득실</th></tr>`;
  if(allScored&&records&&records.length){
    records.forEach((r,i)=>{p+=`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.w}</td><td>${r.l}</td><td>${r.pts}</td><td>${r.pf}-${r.pa}</td></tr>`});
  }else{
    for(let i=0;i<real.length;i++)p+=`<tr><td class="ec"></td><td class="ec"></td><td class="ec"></td><td class="ec"></td><td class="ec"></td><td class="ec"></td></tr>`;
  }
  p+=`</table><h2>메모</h2><div class="memo-box"></div><div class="ft">와일드콕</div></body></html>`;
  const w=window.open("","_blank");
  if(!w){toast.show("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");return}
  w.document.write(p);w.document.close();setTimeout(()=>w.print(),400);
}

/* 컴포넌트 */
function Badge({level}){const c=SK_C[level];return <span className="badge" style={{background:c,color:"#fff"}}>Lv.{level} {SK_L[level]}</span>}
function GBadge({gender}){if(!gender)return null;const c=GEN_C[gender];return <span className="badge" style={{background:c,color:"#fff",marginLeft:4}}>{GEN_L[gender]}</span>}
function SkB({value,onChange,small}){return <div className={"seg"+(small?" sm":"")}>{[1,2,3,4,5].map(v=><button key={v} type="button" className={"seg-btn"+(value===v?" on":"")} style={value===v?{background:SK_C[v]}:{}} onClick={()=>onChange(v)}>{v}</button>)}</div>}
function GenB({value,onChange,small}){return <div className={"seg"+(small?" sm":"")}>{["M","F"].map(g=><button key={g} type="button" className={"seg-btn"+(value===g?" on":"")} style={value===g?{background:GEN_C[g]}:{}} onClick={()=>onChange(value===g?null:g)}>{GEN_L[g]}</button>)}</div>}
function StatBento({playerCount,teamCount,matchCount}){
  const items=[
    {l:"등록 선수",v:playerCount,u:"명",accent:true},
    {l:"편성 조",v:teamCount,u:"조",accent:false},
    {l:"생성 매치",v:matchCount,u:"경기",accent:false},
  ];
  return <div className="bento">{items.map((s,i)=>
    <div key={i} className="stat">
      <div className="stat-l">{s.l}</div>
      <div className="stat-v" style={{color:s.accent?"var(--brand)":"var(--tx)"}}>{s.v}<span className="stat-u">{s.u}</span></div>
    </div>)}</div>;
}
function useToast(){const[m,setM]=useState(null);const r=useRef();const show=(t,ms)=>{if(r.current)clearTimeout(r.current);setM(t);r.current=setTimeout(()=>setM(null),ms||2500)};return{show,el:m?<div className="toast">{m}</div>:null}}

/* 콘페티 */
function Confetti({active}){
  if(!active)return null;
  const colors=["#DC2626","#E0900A","#F5C518","#0B9E5D","#2563EB","#7C3AED","#DB2777"];
  const pieces=Array.from({length:60},(_,i)=>({
    id:i,left:Math.random()*100,delay:Math.random()*2,color:colors[i%colors.length],
    size:6+Math.random()*8,shape:Math.random()>.5?"50%":"0"
  }));
  return <div className="confetti-container">{pieces.map(p=>
    <div key={p.id} className="confetti-piece" style={{
      left:p.left+"%",animationDelay:p.delay+"s",
      width:p.size,height:p.size,borderRadius:p.shape,
      background:p.color
    }} />
  )}</div>;
}

/* 서바이벌 룰렛 / 스포트라이트 뽑기 */
function VirusLottery({pool,count}){
  const[phase,setPhase]=useState("idle");
  const[cells,setCells]=useState([]);
  const[winners,setWinners]=useState([]);
  const[roundInfo,setRoundInfo]=useState("");
  const timerRef=useRef([]);
  const cols=Math.min(pool.length,Math.max(4,Math.ceil(Math.sqrt(pool.length))));

  const reset=()=>{
    timerRef.current.forEach(t=>clearTimeout(t));timerRef.current=[];
    setCells(pool.map(n=>({name:n,state:"alive"})));setWinners([]);setRoundInfo("");setPhase("idle");
  };
  useEffect(()=>{reset()},[pool.join(","),count]);
  useEffect(()=>()=>timerRef.current.forEach(t=>clearTimeout(t)),[]);

  const startSingle=()=>{
    setPhase("running");setCells(pool.map(n=>({name:n,state:"alive"})));setWinners([]);
    const winIdx=Math.floor(Math.random()*pool.length);
    const steps=15+Math.floor(Math.random()*8);let t=0;
    for(let i=0;i<steps;i++){
      const delay=50+i*i*2.5;t+=delay;
      const ci=((winIdx-steps+1+i)%pool.length+pool.length)%pool.length;
      timerRef.current.push(setTimeout(()=>{
        setCells(pool.map((n,j)=>({name:n,state:j===ci?"scanning":"alive"})));
      },t));
    }
    t+=400;
    timerRef.current.push(setTimeout(()=>{
      setCells(pool.map((n,j)=>({name:n,state:j===winIdx?"winner":"eliminated"})));
      setWinners([pool[winIdx]]);setPhase("done");
    },t));
  };

  const startSurvival=()=>{
    const cnt=Math.min(count,pool.length);
    const pickCount=cnt;
    setPhase("running");setCells(pool.map(n=>({name:n,state:"alive"})));setWinners([]);

    const pickedOrder=shuffle([...Array(pool.length).keys()]).slice(0,pickCount);
    const dead=new Set();
    let t=400;

    pickedOrder.forEach((victimIdx,round)=>{
      const alive=[...Array(pool.length).keys()].filter(i=>!dead.has(i));
      const vPos=alive.indexOf(victimIdx);
      const isLast=round===pickCount-1;
      const isLate=round>=pickCount-2;
      const steps=isLast?(16+Math.floor(Math.random()*5)):isLate?(13+Math.floor(Math.random()*4)):(10+Math.floor(Math.random()*4));

      timerRef.current.push(setTimeout(()=>{
        setRoundInfo("💣 "+(round+1)+" / "+pickCount);
      },t));

      for(let s=0;s<steps;s++){
        const pos=((vPos-(steps-1-s))%alive.length+alive.length)%alive.length;
        const hi=alive[pos];
        const delay=60+s*s*(isLast?4:isLate?3:2.5);
        t+=delay;
        const ct=t;
        timerRef.current.push(setTimeout(()=>{
          setCells(prev=>prev.map((c,i)=>{
            if(c.state==="eliminated"||c.state==="picked")return c;
            return{...c,state:i===hi?"danger":"alive"};
          }));
        },ct));
      }

      t+=400;
      timerRef.current.push(setTimeout(()=>{
        setCells(prev=>prev.map((c,i)=>
          i===victimIdx?{...c,state:"picked"}:c.state==="danger"?{...c,state:"alive"}:c
        ));
      },t));

      dead.add(victimIdx);
      t+=isLast?500:700;
    });

    t+=800;
    timerRef.current.push(setTimeout(()=>{setRoundInfo("🎉 결과 발표...")},t));
    t+=900;
    timerRef.current.push(setTimeout(()=>{
      const w=pickedOrder.map(i=>pool[i]);
      setCells(prev=>prev.map((c,i)=>
        dead.has(i)?{...c,state:"winner"}:{...c,state:"dimmed"}
      ));
      setWinners(w);setRoundInfo("");setPhase("done");
    },t));
  };

  const start=()=>{if(!pool.length)return;count===1?startSingle():startSurvival()};
  const cnt=Math.min(count,pool.length);
  const isSingle=count===1;
  const emojiFor=s=>s==="danger"?"😨":s==="picked"?"💥":s==="eliminated"?"💀":s==="winner"?"🎉":s==="scanning"?"👀":"🙂";

  return(
    <div>
      <div className="cd">
        <p className="sl">{isSingle?"🎯 스포트라이트 추첨":"💣 서바이벌 룰렛"}</p>
        <p className="hint">{isSingle?pool.length+"명 중 1명을 뽑습니다.":"💣 폭탄이 멈추면 당첨! "+pool.length+"명 중 "+cnt+"명을 뽑습니다."}</p>
        {roundInfo&&<div className="sv-status"><span className="sv-round">{roundInfo}</span></div>}
        <div className="virus-grid" style={{gridTemplateColumns:"repeat("+cols+",1fr)"}}>
          {cells.map((c,i)=>(
            <div key={i} className={"virus-cell "+c.state}>
              <div className="vc-emoji">{emojiFor(c.state)}</div>
              <div className="vc-name">{c.name}</div>
            </div>
          ))}
        </div>
      </div>
      {winners.length>0&&phase==="done"&&(
        <div style={{textAlign:"center",padding:"24px 20px",background:"linear-gradient(135deg,#FFF3CD,#FFE5A0)",borderRadius:"var(--r)",marginTop:16,animation:"winPop .4s ease-out"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#B45309",marginBottom:8}}>🎉 {isSingle?"당첨!":"생존자!"}</div>
          <div style={{fontSize:28,fontWeight:800,color:"#101418"}}>{winners.join(", ")}</div>
        </div>
      )}
      <div className="cd" style={{padding:14}}>
        <div className="fg" style={{justifyContent:"center",gap:12}}>
          <button className="btn bp bf" onClick={start} disabled={phase==="running"} style={{fontSize:16,padding:14,maxWidth:300}}>
            {phase==="running"?(isSingle?"스캐닝...":"탈락 진행중..."):(isSingle?"🎯 뽑기!":"💣 시작!")}
          </button>
          {phase==="done"&&<button className="btn bs" onClick={reset} style={{padding:"14px 20px"}}>↺ 리셋</button>}
        </div>
      </div>
    </div>
  );
}

/* 금액정산 */
function DutchPayTab({players}){
  const[people,setPeople]=useState([]);
  const[customName,setCustomName]=useState("");
  const[src,setSrc]=useState("players");
  const[items,setItems]=useState([]);
  const[iName,setIN]=useState("");
  const[iPrice,setIP]=useState("");
  const[balanceStr,setBalanceStr]=useState("");

  useEffect(()=>{if(src==="players")setPeople(players.map(p=>({name:p.name,active:true})))},[src,players]);
  const addC=()=>{const n=customName.trim();if(!n)return;setPeople(p=>[...p,{name:n,active:true}]);setCustomName("")};
  const toggle=i=>setPeople(p=>p.map((x,j)=>j===i?{...x,active:!x.active}:x));
  const activePeople=people.filter(p=>p.active);
  const ac=activePeople.length;

  const addItem=()=>{
    const n=iName.trim(),a=parseInt(iPrice,10);if(!n||!a||a<=0)return;
    setItems(prev=>[...prev,{id:Date.now(),name:n,price:a,qty:1,fund:"personal",mode:"all",selected:new Set(activePeople.map(p=>p.name))}]);
    setIN("");setIP("");
  };
  const delItem=id=>setItems(prev=>prev.filter(x=>x.id!==id));
  const setQty=(id,q)=>setItems(prev=>prev.map(x=>x.id===id?{...x,qty:Math.max(1,q)}:x));
  const setFund=(id,f)=>setItems(prev=>prev.map(x=>x.id===id?{...x,fund:f}:x));
  const toggleMode=id=>setItems(prev=>prev.map(x=>x.id===id?{...x,mode:x.mode==="all"?"select":"all",selected:x.mode==="all"?new Set():new Set(activePeople.map(p=>p.name))}:x));
  const togglePerson=(id,name)=>setItems(prev=>prev.map(x=>{if(x.id!==id)return x;const s=new Set(x.selected);s.has(name)?s.delete(name):s.add(name);return{...x,selected:s}}));

  const balance=parseInt(balanceStr,10)||0;
  const clubTotal=items.filter(x=>x.fund==="club").reduce((s,x)=>s+x.price*x.qty,0);
  const remainBalance=balance-clubTotal;

  const perPerson=useMemo(()=>{
    const m={};activePeople.forEach(p=>m[p.name]={total:0,details:[]});
    items.filter(item=>item.fund==="personal").forEach(item=>{
      const sub=item.price*item.qty;
      const targets=item.mode==="all"?activePeople.map(p=>p.name):[...item.selected].filter(n=>m[n]!==undefined);
      if(!targets.length)return;
      const share=Math.ceil(sub/targets.length);
      targets.forEach(n=>{m[n].total+=share;m[n].details.push({name:item.name,amount:share})});
    });
    return m;
  },[items,activePeople]);

  const grandTotal=items.reduce((s,x)=>s+x.price*x.qty,0);
  const personalTotal=items.filter(x=>x.fund==="personal").reduce((s,x)=>s+x.price*x.qty,0);
  const billedTotal=Object.values(perPerson).reduce((s,x)=>s+x.total,0);

  return (
    <div>
      <div className="cd">
        <p className="sl">참가자</p>
        <div className="fg" style={{marginBottom:12}}>
          <button className={"pill "+(src==="players"?"p-on":"p-off")} onClick={()=>setSrc("players")}>🏸 등록 선수</button>
          <button className={"pill "+(src==="custom"?"p-on":"p-off")} onClick={()=>setSrc("custom")}>✏️ 직접 입력</button>
        </div>
        {src==="custom"&&<div className="fg" style={{marginBottom:12}}><input className="inp" placeholder="이름" value={customName} onChange={e=>setCustomName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addC()} style={{flex:1}} /><button className="btn bp" onClick={addC} style={{padding:"10px 16px"}}>추가</button></div>}
        <div className="fg fw" style={{gap:6}}>{people.map((p,i)=><button key={i} className={"pill "+(p.active?"p-on":"p-off")} onClick={()=>toggle(i)} style={{fontSize:12,padding:"5px 12px"}}>{p.active?"✓ ":""}{p.name}</button>)}</div>
        {ac>0&&<div style={{fontSize:12,color:"var(--tx2)",marginTop:8}}>{ac}명 선택됨</div>}
      </div>
      <div className="cd">
        <p className="sl">회비 잔고</p>
        <div className="fg" style={{alignItems:"center",gap:10}}>
          <input className="inp" type="number" placeholder="현재 통장 잔고" value={balanceStr} onChange={e=>setBalanceStr(e.target.value)} style={{flex:1}} />
          {balance>0&&<span style={{fontSize:14,fontWeight:700,color:"var(--tx2)",flexShrink:0}}>₩{balance.toLocaleString()}</span>}
        </div>
        {balance>0&&clubTotal>0&&<div style={{marginTop:10,padding:"10px 12px",background:remainBalance>=0?"var(--brand50)":"var(--danger50)",borderRadius:10,fontSize:13}}>
          <div className="fb"><span style={{color:"var(--tx2)",fontWeight:600}}>회비 사용</span><span style={{fontWeight:700}}>−₩{clubTotal.toLocaleString()}</span></div>
          <div className="fb" style={{marginTop:6}}><span style={{fontWeight:700,color:remainBalance>=0?"var(--brand)":"var(--danger)"}}>남은 잔고</span><span style={{fontWeight:800,fontSize:16,color:remainBalance>=0?"var(--brand)":"var(--danger)"}}>₩{remainBalance.toLocaleString()}</span></div>
        </div>}
      </div>
      <div className="cd">
        <p className="sl">비용 항목</p>
        <div className="fg fw" style={{alignItems:"flex-end",gap:8,marginBottom:14}}>
          <div style={{flex:1,minWidth:80}}><label style={{fontSize:11,color:"var(--tx2)",fontWeight:600,display:"block",marginBottom:4}}>항목명</label><input className="inp" placeholder="치킨, 코트비 등" value={iName} onChange={e=>setIN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} /></div>
          <div style={{minWidth:100}}><label style={{fontSize:11,color:"var(--tx2)",fontWeight:600,display:"block",marginBottom:4}}>단가 (₩)</label><input className="inp" type="number" placeholder="0" value={iPrice} onChange={e=>setIP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} /></div>
          <button className="btn bp" onClick={addItem} style={{padding:"10px 14px",flexShrink:0}}>추가</button>
        </div>
        {!items.length&&<p style={{fontSize:13,color:"var(--tx2)",textAlign:"center",padding:"12px 0"}}>항목을 추가하세요</p>}
        {items.map(item=>{
          const sub=item.price*item.qty;
          const isClub=item.fund==="club";
          const targets=item.mode==="all"?ac:[...item.selected].filter(n=>perPerson[n]!==undefined).length;
          const share=targets>0?Math.ceil(sub/targets):0;
          return <div key={item.id} style={{padding:"12px 14px",background:isClub?"var(--brand50)":"var(--g4)",borderRadius:12,marginBottom:8,border:isClub?"1px solid rgba(11,158,93,.2)":"1px solid transparent"}}>
            <div className="fb">
              <span style={{fontSize:14,fontWeight:700}}>{item.name}</span>
              <button onClick={()=>delItem(item.id)} style={{background:"none",border:"none",fontSize:14,color:"var(--tx2)",cursor:"pointer",padding:"2px 4px"}}>✕</button>
            </div>
            <div className="fg" style={{gap:4,marginTop:6,marginBottom:6}}>
              <button className={"pill "+(isClub?"p-on":"p-off")} onClick={()=>setFund(item.id,"club")} style={{fontSize:11,padding:"3px 10px",...(isClub?{background:"var(--brand)",borderColor:"var(--brand)"}:{})}}>🏦 회비</button>
              <button className={"pill "+(!isClub?"p-on":"p-off")} onClick={()=>setFund(item.id,"personal")} style={{fontSize:11,padding:"3px 10px",...(!isClub?{background:"var(--orange)",borderColor:"var(--orange)"}:{})}}>💵 사비</button>
            </div>
            <div className="fb" style={{gap:8}}>
              <span style={{fontSize:13,color:"var(--tx2)"}}>₩{item.price.toLocaleString()}</span>
              <div className="fg" style={{gap:0,background:"var(--bg)",borderRadius:8,border:"1px solid var(--bdr)",overflow:"hidden"}}>
                <button onClick={()=>setQty(item.id,item.qty-1)} style={{padding:"5px 10px",background:"none",border:"none",fontSize:15,cursor:"pointer",color:item.qty<=1?"var(--g3)":"var(--tx)"}}>−</button>
                <span style={{padding:"5px 8px",fontSize:14,fontWeight:700,minWidth:24,textAlign:"center",borderLeft:"1px solid var(--bdr)",borderRight:"1px solid var(--bdr)"}}>{item.qty}</span>
                <button onClick={()=>setQty(item.id,item.qty+1)} style={{padding:"5px 10px",background:"none",border:"none",fontSize:15,cursor:"pointer",color:"var(--tx)"}}>+</button>
              </div>
              <span style={{fontSize:15,fontWeight:800,color:isClub?"var(--brand)":"var(--orange)"}}>₩{sub.toLocaleString()}</span>
            </div>
            {!isClub&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid var(--bdr)"}}>
              <div className="fg" style={{gap:6,marginBottom:item.mode==="select"?6:0}}>
                <button className={"pill "+(item.mode==="all"?"p-on":"p-off")} onClick={()=>toggleMode(item.id)} style={{fontSize:11,padding:"3px 10px"}}>전체 균등</button>
                <button className={"pill "+(item.mode==="select"?"p-on":"p-off")} onClick={()=>toggleMode(item.id)} style={{fontSize:11,padding:"3px 10px"}}>개별 선택</button>
                <span style={{fontSize:11,color:"var(--tx2)",marginLeft:"auto"}}>{targets}명 · 1인 ₩{share.toLocaleString()}</span>
              </div>
              {item.mode==="select"&&<div className="fg fw" style={{gap:4,marginTop:4}}>
                {activePeople.map(p=><button key={p.name} className={"pill "+(item.selected.has(p.name)?"p-on":"p-off")} onClick={()=>togglePerson(item.id,p.name)} style={{fontSize:11,padding:"3px 9px"}}>{p.name}</button>)}
              </div>}
            </div>}
            {isClub&&<div style={{marginTop:6,fontSize:11,color:"var(--brand)",fontWeight:600}}>회비에서 차감 · 개인 정산 제외</div>}
          </div>})}
        {items.length>0&&<div style={{padding:"12px 0",borderTop:"2px solid var(--g2)"}}>
          {clubTotal>0&&<div className="fb" style={{marginBottom:4}}><span style={{fontSize:12,color:"var(--brand)",fontWeight:600}}>🏦 회비 소계</span><span style={{fontSize:14,fontWeight:700,color:"var(--brand)"}}>₩{clubTotal.toLocaleString()}</span></div>}
          {personalTotal>0&&<div className="fb" style={{marginBottom:4}}><span style={{fontSize:12,color:"var(--orange)",fontWeight:600}}>💵 사비 소계</span><span style={{fontSize:14,fontWeight:700,color:"var(--orange)"}}>₩{personalTotal.toLocaleString()}</span></div>}
          <div className="fb"><span style={{fontSize:13,color:"var(--tx2)"}}>총계</span><span style={{fontSize:22,fontWeight:800,color:"var(--tx)"}}>₩{grandTotal.toLocaleString()}</span></div>
        </div>}
      </div>
      {items.length>0&&ac>0&&<div className="cd">
        <p className="sl">정산 결과</p>
        {balance>0&&clubTotal>0&&<div style={{padding:"10px 12px",background:remainBalance>=0?"var(--brand50)":"var(--danger50)",borderRadius:10,marginBottom:12}}>
          <div className="fb"><span style={{fontSize:12,fontWeight:600,color:"var(--tx2)"}}>현재 잔고</span><span style={{fontSize:13,fontWeight:700}}>₩{balance.toLocaleString()}</span></div>
          {items.filter(x=>x.fund==="club").map(x=><div key={x.id} className="fb" style={{marginTop:3}}><span style={{fontSize:11,color:"var(--tx2)"}}>  − {x.name}</span><span style={{fontSize:11,color:"var(--tx2)"}}>₩{(x.price*x.qty).toLocaleString()}</span></div>)}
          <div className="fb" style={{marginTop:6,paddingTop:6,borderTop:"1px solid var(--bdr)"}}><span style={{fontSize:13,fontWeight:800,color:remainBalance>=0?"var(--brand)":"var(--danger)"}}>정산 후 잔고</span><span style={{fontSize:17,fontWeight:800,color:remainBalance>=0?"var(--brand)":"var(--danger)"}}>₩{remainBalance.toLocaleString()}</span></div>
        </div>}
        {personalTotal>0&&<>
          {billedTotal>personalTotal&&<p style={{fontSize:11,color:"var(--orange)",marginBottom:10}}>* 올림 적용 (차액 ₩{(billedTotal-personalTotal).toLocaleString()})</p>}
          {activePeople.map(p=>{const d=perPerson[p.name];if(!d)return null;return <div key={p.name} style={{padding:"10px 12px",background:"var(--g4)",borderRadius:10,marginBottom:6}}>
            <div className="fb">
              <span style={{fontSize:14,fontWeight:600}}>{p.name}</span>
              <span style={{fontSize:16,fontWeight:800,color:d.total>0?"var(--orange)":"var(--tx2)"}}>₩{d.total.toLocaleString()}</span>
            </div>
            {d.details.length>0&&<div style={{fontSize:11,color:"var(--tx2)",marginTop:4}}>{d.details.map(x=>x.name+" ₩"+x.amount.toLocaleString()).join(" + ")}</div>}
          </div>})}
        </>}
        {personalTotal===0&&clubTotal>0&&<p style={{fontSize:13,color:"var(--tx2)",textAlign:"center",padding:"8px 0"}}>사비 항목 없음 · 개인 정산 불필요</p>}
      </div>}
    </div>
  );
}

/* 대시보드 기록 항목 — 3명 이상 시 접기/펼치기 */
function DashRecord({label,icon,items,color}){
  const[open,setOpen]=useState(false);
  const LIMIT=2;
  const show=open?items:items.slice(0,LIMIT);
  const more=items.length>LIMIT;
  return <div style={{padding:"10px 0",borderBottom:"1px solid var(--g3)"}}>
    <div style={{fontSize:11,color:"var(--tx2)",marginBottom:4}}>{label}{items.length>1&&<span style={{marginLeft:4,fontSize:10,color:color,fontWeight:700}}>공동 {items.length}명</span>}</div>
    {show.map(function(p,i){return <div key={p.name} className="fb" style={{marginTop:i>0?4:0}}>
      <span style={{fontSize:15,fontWeight:700}}>{icon} {p.name}</span>
      <span style={{fontSize:16,fontWeight:800,color:color}}>{p.val}</span>
    </div>})}
    {more&&<button onClick={function(){setOpen(!open)}} style={{background:"none",border:"none",fontSize:11,color:"var(--tx2)",cursor:"pointer",padding:"6px 0",width:"100%",textAlign:"center"}}>{open?"접기 ▲":"+"+(items.length-LIMIT)+"명 더보기 ▼"}</button>}
  </div>;
}

/* 기록실 탭 */
function RecordsTab({history,pubHistory,onDelete,onExport,onImport,onShare}){
  const[view,setView]=useState("dashboard");
  const[selPlayer,setSelPlayer]=useState(null);
  const[expandSess,setExpandSess]=useState(null);

  /* 공용 + 개인 기록 병합 (id 기준 중복 제거) */
  const allHistory=useMemo(()=>{
    const merged=[...history.map(s=>({...s,_pub:false})),...(pubHistory||[]).map(s=>({...s,_pub:true}))];
    const unique=[...new Map(merged.map(s=>[s.id,s])).values()];
    unique.sort((a,b)=>b.id-a.id);
    return unique;
  },[history,pubHistory]);

  const stats=useMemo(()=>{
    const pm={};
    const h2h={};
    const syn={};

    allHistory.forEach(sess=>{
      const sessionPlayers=new Set();
      sess.matchData.forEach(m=>{
        const t1=m.t1,t2=m.t2;
        const s1=m.s1,s2=m.s2;
        if(isNaN(s1)||isNaN(s2))return;
        const w1=s1>s2,w2=s2>s1;

        [...t1,...t2].forEach(n=>{
          if(!pm[n])pm[n]={w:0,l:0,d:0,games:0,pf:0,pa:0,sessions:{}};
          sessionPlayers.add(n);
        });
        t1.forEach(n=>{pm[n].games++;pm[n].pf+=s1;pm[n].pa+=s2;if(w1)pm[n].w++;else if(w2)pm[n].l++;else pm[n].d++});
        t2.forEach(n=>{pm[n].games++;pm[n].pf+=s2;pm[n].pa+=s1;if(w2)pm[n].w++;else if(w1)pm[n].l++;else pm[n].d++});

        t1.forEach(a=>t2.forEach(b=>{
          const kab=a+"|"+b,kba=b+"|"+a;
          if(!h2h[kab])h2h[kab]={w:0,l:0};if(!h2h[kba])h2h[kba]={w:0,l:0};
          if(w1){h2h[kab].w++;h2h[kba].l++}else if(w2){h2h[kab].l++;h2h[kba].w++}
        }));

        const addSyn=(arr,won)=>{
          const sorted=[...arr].sort();
          for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){
            const k=sorted[i]+"|"+sorted[j];
            if(!syn[k])syn[k]={w:0,l:0,games:0,names:[sorted[i],sorted[j]]};
            syn[k].games++;if(won)syn[k].w++;else syn[k].l++;
          }
        };
        addSyn(t1,w1);addSyn(t2,w2);
      });

      sessionPlayers.forEach(n=>{
        if(!pm[n].sessions[sess.date])pm[n].sessions[sess.date]={w:0,l:0,d:0};
      });
      sess.matchData.forEach(m=>{
        const s1=m.s1,s2=m.s2;if(isNaN(s1)||isNaN(s2))return;
        const w1=s1>s2,w2=s2>s1;
        m.t1.forEach(n=>{if(!pm[n].sessions[sess.date])pm[n].sessions[sess.date]={w:0,l:0,d:0};if(w1)pm[n].sessions[sess.date].w++;else if(w2)pm[n].sessions[sess.date].l++;else pm[n].sessions[sess.date].d++});
        m.t2.forEach(n=>{if(!pm[n].sessions[sess.date])pm[n].sessions[sess.date]={w:0,l:0,d:0};if(w2)pm[n].sessions[sess.date].w++;else if(w1)pm[n].sessions[sess.date].l++;else pm[n].sessions[sess.date].d++});
      });
    });

    const playerArr=Object.entries(pm).map(([name,d])=>{
      const rate=d.games?Math.round(d.w/d.games*100):0;
      const sessCnt=Object.keys(d.sessions).length;
      const trend=Object.entries(d.sessions).sort(([a],[b])=>a.localeCompare(b)).map(([date,r])=>({date,w:r.w,l:r.l,rate:r.w+r.l+r.d>0?Math.round(r.w/(r.w+r.l+r.d)*100):0}));
      return{name,...d,rate,sessCnt,trend};
    }).sort((a,b)=>b.rate-a.rate||b.games-a.games);

    const synArr=Object.values(syn).filter(s=>s.games>=2).sort((a,b)=>{
      const ra=a.games?a.w/a.games:0,rb=b.games?b.w/b.games:0;
      return rb-ra||b.games-a.games;
    });

    /* 종합 대시보드 — 공동 순위 처리 */
    const totalSessions=allHistory.length;
    const totalGames=allHistory.reduce((s,x)=>s+x.matchData.filter(m=>!isNaN(m.s1)&&!isNaN(m.s2)).length,0);
    const maxW=playerArr.length?Math.max(...playerArr.map(p=>p.w)):0;
    const topWinners=playerArr.filter(p=>p.w===maxW&&maxW>0);
    const rated=playerArr.filter(p=>p.games>=3);
    const maxRate=rated.length?Math.max(...rated.map(p=>p.rate)):0;
    const topRates=rated.filter(p=>p.rate===maxRate&&maxRate>0);
    const maxSess=playerArr.length?Math.max(...playerArr.map(p=>p.sessCnt)):0;
    const mostActives=playerArr.filter(p=>p.sessCnt===maxSess&&maxSess>0);

    return{players:playerArr,h2h,synergy:synArr,dash:{totalSessions,totalGames,topWinners,topRates,mostActives}};
  },[allHistory]);

  const allNames=stats.players.map(p=>p.name);
  const fileRef=useRef(null);

  if(!allHistory.length)return <div className="cd es">
    <div className="es-i">📊</div>
    <div className="es-t">저장된 기록이 없습니다</div>
    <p style={{fontSize:13,color:"var(--tx2)",marginTop:8,textAlign:"center"}}>매치를 모두 완료한 후 "기록실에 저장"을 눌러주세요</p>
    <div className="fg" style={{marginTop:16,justifyContent:"center",gap:8}}>
      <input type="file" accept=".json" ref={fileRef} onChange={onImport} style={{display:"none"}} />
      <button className="btn bs" onClick={()=>fileRef.current?.click()}>📂 백업 가져오기</button>
    </div>
  </div>;

  return <div>
    <div className="fg" style={{marginBottom:14,gap:6,flexWrap:"wrap"}}>
      <button className={"pill "+(view==="dashboard"?"p-on":"p-off")} onClick={()=>setView("dashboard")}>🏠 종합</button>
      <button className={"pill "+(view==="stats"?"p-on":"p-off")} onClick={()=>setView("stats")}>👤 개인</button>
      <button className={"pill "+(view==="attendance"?"p-on":"p-off")} onClick={()=>setView("attendance")}>📋 참여</button>
      <button className={"pill "+(view==="h2h"?"p-on":"p-off")} onClick={()=>setView("h2h")}>⚔️ 상대</button>
      <button className={"pill "+(view==="synergy"?"p-on":"p-off")} onClick={()=>setView("synergy")}>🤝 시너지</button>
      <button className={"pill "+(view==="history"?"p-on":"p-off")} onClick={()=>setView("history")}>📅 기록</button>
    </div>

    {view==="dashboard"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div className="cd" style={{textAlign:"center",padding:"16px 10px"}}><div style={{fontSize:24,fontWeight:800,color:"var(--brand)"}}>{stats.dash.totalSessions}</div><div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>총 세션</div></div>
        <div className="cd" style={{textAlign:"center",padding:"16px 10px"}}><div style={{fontSize:24,fontWeight:800,color:"var(--pri)"}}>{stats.dash.totalGames}</div><div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>총 경기</div></div>
        <div className="cd" style={{textAlign:"center",padding:"16px 10px"}}><div style={{fontSize:24,fontWeight:800,color:"var(--green)"}}>{stats.players.length}</div><div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>등록 선수</div></div>
        <div className="cd" style={{textAlign:"center",padding:"16px 10px"}}><div style={{fontSize:24,fontWeight:800,color:"var(--orange)"}}>{stats.synergy.length}</div><div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>시너지 조합</div></div>
      </div>
      <div className="cd">
        <p className="sl">👀 눈 여겨볼 기록</p>
        {stats.dash.topWinners.length>0&&<DashRecord label="최다승" icon="🥇" items={stats.dash.topWinners.map(function(p){return{name:p.name,val:p.w+"승"}})} color="var(--brand)" />}
        {stats.dash.topRates.length>0&&<DashRecord label="최고 승률 (3경기+)" icon="🎯" items={stats.dash.topRates.map(function(p){return{name:p.name,val:p.rate+"%"}})} color="var(--green)" />}
        {stats.dash.mostActives.length>0&&<DashRecord label="최다 참여" icon="🔥" items={stats.dash.mostActives.map(function(p){return{name:p.name,val:p.sessCnt+"회"}})} color="var(--orange)" />}
      </div>
      {stats.synergy.length>0&&<div className="cd" style={{marginTop:10}}>
        <p className="sl">🤝 베스트 콤비</p>
        {stats.synergy.slice(0,3).map((s,i)=>{const pct=Math.round(s.w/s.games*100);
          return <div key={i} className="fb" style={{padding:"8px 0",borderBottom:i<2?"1px solid var(--g3)":"none"}}>
            <span style={{fontSize:13,fontWeight:600}}>{["🥇","🥈","🥉"][i]} {s.names[0]} + {s.names[1]}</span>
            <span style={{fontSize:13,fontWeight:700,color:"var(--green)"}}>{pct}% ({s.games}전)</span>
          </div>})}
      </div>}
    </div>}

    {view==="attendance"&&<div className="cd">
      <p className="sl">📋 참여율 ({stats.players.length}명)</p>
      <p style={{fontSize:12,color:"var(--tx2)",marginBottom:12}}>총 {stats.dash.totalSessions}세션 기준 · 참석 횟수순</p>
      {[...stats.players].sort((a,b)=>b.sessCnt-a.sessCnt||b.games-a.games).map((p,i)=>{
        const pct=stats.dash.totalSessions?Math.round(p.sessCnt/stats.dash.totalSessions*100):0;
        return <div key={p.name} style={{padding:"10px 0",borderBottom:i<stats.players.length-1?"1px solid var(--g3)":"none"}}>
          <div className="fb">
            <div>
              <span style={{fontSize:14,fontWeight:600}}>{p.name}</span>
              <div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>{p.sessCnt}회 참석 · {p.games}경기 · {p.w}승 {p.l}패</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:17,fontWeight:800,color:pct>=70?"var(--green)":pct>=40?"var(--pri)":"var(--tx2)"}}>{pct}%</div>
              <div style={{fontSize:10,color:"var(--tx2)"}}>출석</div>
            </div>
          </div>
          <div className="rb" style={{marginTop:6,height:4}}><div className="rf" style={{width:pct+"%",background:pct>=70?"var(--green)":pct>=40?"var(--pri)":"var(--g2)"}} /></div>
        </div>
      })}
    </div>}

    {view==="stats"&&<div className="cd">
      <p className="sl">👤 개인 통계 ({stats.players.length}명)</p>
      {stats.players.map((p,i)=>{const bar=p.rate;
        return <div key={p.name} style={{padding:"12px 0",borderBottom:i<stats.players.length-1?"1px solid var(--g3)":"none"}}>
          <div className="fb">
            <div>
              <span style={{fontSize:14,fontWeight:700}}>{i<3?["🥇","🥈","🥉"][i]:(i+1)+"."} {p.name}</span>
              <div style={{fontSize:12,color:"var(--tx2)",marginTop:3}}>{p.games}경기 · {p.w}승 {p.l}패{p.d>0?" "+p.d+"무":""} · 득실 {p.pf}-{p.pa}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:18,fontWeight:800,color:bar>=60?"var(--green)":bar>=40?"var(--pri)":"var(--danger)"}}>{bar}%</div>
              <div style={{fontSize:10,color:"var(--tx2)"}}>승률</div>
            </div>
          </div>
          <div className="rb" style={{marginTop:8,height:5}}><div className="rf" style={{width:bar+"%",background:bar>=60?"var(--green)":bar>=40?"var(--pri)":"var(--danger)"}} /></div>
          {p.trend.length>1&&<div style={{marginTop:8,display:"flex",gap:3,alignItems:"end",height:28}}>
            {p.trend.map((t,ti)=>{const h=Math.max(4,t.rate/100*24);
              return <div key={ti} title={t.date+": "+t.rate+"%"} style={{flex:1,height:h,borderRadius:2,background:t.rate>=60?"var(--green)":t.rate>=40?"var(--pri)":"var(--danger)",opacity:.7,cursor:"help",transition:"opacity .2s"}} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=.7} />
            })}
          </div>}
          {p.trend.length>1&&<div style={{fontSize:10,color:"var(--tx2)",marginTop:2,display:"flex",justifyContent:"space-between"}}><span>{p.trend[0].date.slice(5)}</span><span style={{color:"var(--g1)"}}>← 세션별 승률 →</span><span>{p.trend[p.trend.length-1].date.slice(5)}</span></div>}
        </div>
      })}
    </div>}

    {view==="h2h"&&<div className="cd">
      <p className="sl">⚔️ 상대 전적</p>
      <p style={{fontSize:12,color:"var(--tx2)",marginBottom:12}}>선수를 선택하면 상대별 전적을 볼 수 있습니다</p>
      <div className="fg" style={{flexWrap:"wrap",gap:6,marginBottom:14}}>
        {allNames.map(n=><button key={n} className={"pill "+(selPlayer===n?"p-on":"p-off")} onClick={()=>setSelPlayer(selPlayer===n?null:n)} style={{fontSize:12}}>{n}</button>)}
      </div>
      {selPlayer&&<div>
        {allNames.filter(n=>n!==selPlayer).map(opp=>{
          const k=selPlayer+"|"+opp;const rec=stats.h2h[k];
          if(!rec||rec.w+rec.l===0)return null;
          const total=rec.w+rec.l,pct=Math.round(rec.w/total*100);
          return <div key={opp} style={{padding:"10px 0",borderBottom:"1px solid var(--g3)"}}>
            <div className="fb">
              <span style={{fontSize:13,fontWeight:600}}>{opp}</span>
              <span style={{fontSize:13,fontWeight:700,color:pct>=50?"var(--green)":"var(--danger)"}}>{rec.w}승 {rec.l}패 ({pct}%)</span>
            </div>
            <div className="rb" style={{marginTop:6,height:4}}><div className="rf" style={{width:pct+"%",background:pct>=50?"var(--green)":"var(--danger)"}} /></div>
          </div>
        }).filter(Boolean)}
        {allNames.filter(n=>n!==selPlayer).every(opp=>{const k=selPlayer+"|"+opp;const rec=stats.h2h[k];return!rec||rec.w+rec.l===0})&&
          <p style={{fontSize:13,color:"var(--tx2)",textAlign:"center",padding:16}}>상대 전적이 없습니다</p>
        }
      </div>}
      {!selPlayer&&<p style={{fontSize:13,color:"var(--tx2)",textAlign:"center",padding:16}}>위에서 선수를 선택해주세요</p>}
    </div>}

    {view==="synergy"&&<div className="cd">
      <p className="sl">🤝 베스트 시너지</p>
      <p style={{fontSize:12,color:"var(--tx2)",marginBottom:12}}>2경기 이상 같은 팀이 된 조합 (승률순)</p>
      {stats.synergy.length===0?<p style={{fontSize:13,color:"var(--tx2)",textAlign:"center",padding:16}}>아직 데이터가 부족합니다</p>
      :stats.synergy.slice(0,15).map((s,i)=>{
        const pct=Math.round(s.w/s.games*100);
        return <div key={i} style={{padding:"10px 0",borderBottom:i<Math.min(14,stats.synergy.length-1)?"1px solid var(--g3)":"none"}}>
          <div className="fb">
            <div>
              <span style={{fontSize:13,fontWeight:700}}>{i<3?["🥇","🥈","🥉"][i]:""} {s.names[0]} + {s.names[1]}</span>
              <div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>{s.games}경기 · {s.w}승 {s.l}패</div>
            </div>
            <span style={{fontSize:16,fontWeight:800,color:pct>=60?"var(--green)":pct>=40?"var(--pri)":"var(--danger)"}}>{pct}%</span>
          </div>
          <div className="rb" style={{marginTop:6,height:4}}><div className="rf" style={{width:pct+"%",background:pct>=60?"var(--green)":pct>=40?"var(--pri)":"var(--danger)"}} /></div>
        </div>
      })}
    </div>}

    {view==="history"&&<div>
      <div className="cd">
        <div className="fb" style={{marginBottom:10}}>
          <p className="sl" style={{margin:0}}>📅 기록 목록 ({allHistory.length}건{pubHistory&&pubHistory.length>0?" · 공용 "+pubHistory.length:""})</p>
          <div className="fg" style={{gap:6}}>
            <input type="file" accept=".json" ref={fileRef} onChange={onImport} style={{display:"none"}} />
            <button className="btn bs" onClick={()=>fileRef.current?.click()} style={{fontSize:11,padding:"4px 10px"}}>📂 가져오기</button>
            <button className="btn bs" onClick={onExport} style={{fontSize:11,padding:"4px 10px"}}>📥 백업</button>
          </div>
        </div>
        {allHistory.map(sess=>{
          const names=new Set();
          sess.matchData.forEach(m=>{[...m.t1,...m.t2].forEach(n=>names.add(n))});
          const isOpen=expandSess===sess.id;
          const isPub=!!sess._pub;
          /* 세션 내 순위 계산 */
          const sessRank=(()=>{
            if(!isOpen)return[];
            const rm={};
            sess.matchData.forEach(m=>{
              const s1=m.s1,s2=m.s2;if(isNaN(s1)||isNaN(s2))return;
              const k1=[...m.t1].sort().join("|"),k2=[...m.t2].sort().join("|");
              if(!rm[k1])rm[k1]={name:m.t1.join(" · "),w:0,l:0,pts:0,pf:0,pa:0};
              if(!rm[k2])rm[k2]={name:m.t2.join(" · "),w:0,l:0,pts:0,pf:0,pa:0};
              rm[k1].pf+=s1;rm[k1].pa+=s2;rm[k2].pf+=s2;rm[k2].pa+=s1;
              if(s1>s2){rm[k1].w++;rm[k1].pts++;rm[k2].l++}else if(s2>s1){rm[k2].w++;rm[k2].pts++;rm[k1].l++}
            });
            return Object.values(rm).sort((a,b)=>b.pts-a.pts||(b.pf-b.pa)-(a.pf-a.pa));
          })();
          return <div key={sess.id} style={{borderBottom:"1px solid var(--g3)"}}>
            <div className="fb" style={{padding:"12px 0",cursor:"pointer"}} onClick={()=>setExpandSess(isOpen?null:sess.id)}>
              <div>
                <div style={{fontSize:14,fontWeight:600}}><span style={{display:"inline-block",transition:"transform .2s",transform:isOpen?"rotate(90deg)":"rotate(0)",marginRight:6,fontSize:10}}>▶</span>{sess.date}{isPub&&<span style={{fontSize:10,fontWeight:700,color:"var(--brand)",background:"var(--brand50)",padding:"1px 6px",borderRadius:4,marginLeft:8}}>공용</span>}</div>
                <div style={{fontSize:12,color:"var(--tx2)",marginTop:3,marginLeft:20}}>{names.size}명 · {sess.matchData.length}경기 · {sess.teamSize}인조 {sess.mt==="roundrobin"?"라운드로빈":"토너먼트"}</div>
              </div>
              {!isPub&&<div className="fg" style={{gap:6,flexShrink:0}}>
                <button className="btn bs" onClick={function(e){e.stopPropagation();onShare(sess)}} style={{fontSize:11,padding:"4px 10px"}}>📤</button>
                <button className="btn bd" onClick={e=>{e.stopPropagation();onDelete(sess.id)}} style={{fontSize:11,padding:"4px 10px"}}>삭제</button>
              </div>}
            </div>
            {isOpen&&<div style={{paddingBottom:14,marginLeft:10,borderLeft:"2px solid var(--g3)",paddingLeft:14}}>
              {sess.matchData.map((m,mi)=>{
                const s1=m.s1,s2=m.s2,ok=!isNaN(s1)&&!isNaN(s2);
                const w1=ok&&s1>s2,w2=ok&&s2>s1;
                return <div key={mi} className="mr" style={{marginBottom:6}}>
                  <div className={"msd"+(w2?" ls":"")}><div className="msd-n">{m.t1.join(" · ")}</div>{w1&&<span className="wt">WIN</span>}</div>
                  <div style={{display:"flex",alignItems:"center",padding:"0 6px",flexShrink:0}}><span className="sc">{ok?s1:"-"} : {ok?s2:"-"}</span></div>
                  <div className={"msd"+(w1?" ls":"")}><div className="msd-n">{m.t2.join(" · ")}</div>{w2&&<span className="wt">WIN</span>}</div>
                </div>})}
              {sessRank.length>0&&<div style={{marginTop:10,padding:"10px 12px",background:"var(--g4)",borderRadius:10}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--tx2)",marginBottom:8}}>📊 이날의 순위</div>
                {sessRank.map((r,i)=><div key={i} className="fb" style={{padding:"4px 0"}}>
                  <span style={{fontSize:13}}><span style={{fontWeight:800,color:i===0?"var(--gold)":i<3?"var(--brand)":"var(--tx2)",marginRight:6}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":(i+1)}</span><span style={{fontWeight:600}}>{r.name}</span></span>
                  <span style={{fontSize:12,color:"var(--tx2)"}}>{r.w}승{r.l}패 · {r.pf}-{r.pa}</span>
                </div>)}
              </div>}
            </div>}
          </div>
        })}
      </div>
    </div>}
    {view==="history"&&<div className="cd" style={{marginTop:10}}>
      <p className="sl">⚙️ 관리자 설정</p>
      <p style={{fontSize:12,color:"var(--tx2)",marginBottom:10}}>GitHub PAT를 설정하면 기록 저장 시 레포에 자동 push됩니다</p>
      {(()=>{
        const saved=typeof localStorage!=="undefined"&&localStorage.getItem("wc_gh_token");
        return saved
          ?<div className="fb"><span style={{fontSize:13,color:"var(--green)",fontWeight:600}}>✅ 토큰 설정됨</span><button className="btn bd" onClick={()=>{localStorage.removeItem("wc_gh_token");window.location.reload()}} style={{fontSize:11,padding:"4px 10px"}}>해제</button></div>
          :<button className="btn bs" onClick={()=>{const t=window.prompt("GitHub Personal Access Token 입력\n(repo 권한 필요)");if(t&&t.trim()){localStorage.setItem("wc_gh_token",t.trim());window.location.reload()}}} style={{fontSize:12}}>🔑 GitHub 토큰 설정</button>;
      })()}
    </div>}
  </div>;
}
function ShareModal({txt,url,onClose}){
  const[cp,setCp]=useState("");
  const copy=(s,label)=>{navigator.clipboard.writeText(s).then(()=>{setCp(label);setTimeout(()=>setCp(""),2000)}).catch(()=>{})};
  const webShare=()=>{if(navigator.share)navigator.share({title:"와일드콕 조편성",text:txt}).catch(()=>{})};
  return <div className="share-overlay" onClick={onClose}>
    <div className="share-modal" onClick={e=>e.stopPropagation()}>
      <div className="fb" style={{marginBottom:16}}><span style={{fontSize:18,fontWeight:800}}>📤 공유</span><button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"var(--tx2)"}}>✕</button></div>
      <div style={{marginBottom:16}}>
        <label style={{fontSize:12,fontWeight:700,color:"var(--tx2)",display:"block",marginBottom:6}}>텍스트 공유</label>
        <pre className="share-pre">{txt}</pre>
        <div className="fg" style={{marginTop:8,gap:8}}>
          <button className="btn bp bf" onClick={()=>copy(txt,"txt")} style={{flex:1}}>{cp==="txt"?"✅ 복사됨!":"📋 텍스트 복사"}</button>
          {navigator.share&&<button className="btn bs" onClick={webShare} style={{padding:"10px 16px"}}>📱 공유</button>}
        </div>
      </div>
      {url&&<div style={{marginBottom:16}}>
        <label style={{fontSize:12,fontWeight:700,color:"var(--tx2)",display:"block",marginBottom:6}}>링크 공유</label>
        <input className="inp" value={url} readOnly style={{fontSize:11,padding:"9px 10px"}} onClick={e=>e.target.select()} />
        <button className="btn bp bf" onClick={()=>copy(url,"url")} style={{marginTop:8,width:"100%"}}>{cp==="url"?"✅ 복사됨!":"🔗 링크 복사"}</button>
      </div>}
      {url&&url.length<2500&&<div style={{textAlign:"center"}}>
        <label style={{fontSize:12,fontWeight:700,color:"var(--tx2)",display:"block",marginBottom:8}}>QR 코드</label>
        <img src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="+encodeURIComponent(url)} alt="QR" style={{width:200,height:200,borderRadius:8,border:"1px solid var(--bdr)"}} onError={e=>{e.target.style.display="none"}} />
        <p style={{fontSize:11,color:"var(--tx2)",marginTop:6}}>스캔하면 같은 조편성을 볼 수 있어요</p>
      </div>}
      {url&&url.length>=2500&&<p style={{fontSize:12,color:"var(--tx2)",textAlign:"center"}}>데이터가 커서 QR 생성 불가 — 링크를 직접 공유해주세요</p>}
    </div>
  </div>;
}

/* 공유 뷰 (별도 컴포넌트 — Safari 호환) */
function SharedView({data}){
  const allM=(data.r||[]).flatMap(function(rd){return rd.m});
  const sDone=allM.filter(function(m){return m.s1!==""&&m.s2!==""}).length;
  const sTotal=allM.length;
  const sPct=sTotal?Math.round(sDone/sTotal*100):0;
  const hasScore=sDone>0;

  const sRank=useMemo(function(){
    if(!hasScore)return[];
    var m={};
    /* 와일드카드 선수 식별 — 보너스 팀의 첫 번째 선수 */
    var wcPlayer=null;
    (data.t||[]).forEach(function(t){if(t.b&&t.p.length>0)wcPlayer=t.p[0].n});
    /* 팀 키 생성: 와일드카드 포함 팀은 "wc"로 통합 */
    function tKey(names){if(wcPlayer&&names.indexOf(wcPlayer)>=0)return"wc";return[].concat(names).sort().join("|")}
    (data.t||[]).forEach(function(t){
      if(t.b){if(wcPlayer)m["wc"]={name:wcPlayer+" ⭐",w:0,l:0,d:0,pts:0,pf:0,pa:0,h2h:{},isBonus:true}}
      else{var k=t.p.map(function(x){return x.n}).sort().join("|");m[k]={name:t.p.map(function(x){return x.n}).join(" · "),w:0,l:0,d:0,pts:0,pf:0,pa:0,h2h:{}}}
    });
    allM.forEach(function(x){
      var a=parseInt(x.s1,10),b=parseInt(x.s2,10);if(isNaN(a)||isNaN(b))return;
      var k1=tKey(x.a),k2=tKey(x.b);
      if(!m[k1])m[k1]={name:x.a.join(" · "),w:0,l:0,d:0,pts:0,pf:0,pa:0,h2h:{}};
      if(!m[k2])m[k2]={name:x.b.join(" · "),w:0,l:0,d:0,pts:0,pf:0,pa:0,h2h:{}};
      m[k1].pf+=a;m[k1].pa+=b;m[k2].pf+=b;m[k2].pa+=a;
      if(a>b){m[k1].w++;m[k1].pts++;m[k2].l++;m[k1].h2h[k2]=(m[k1].h2h[k2]||0)+1}
      else if(b>a){m[k2].w++;m[k2].pts++;m[k1].l++;m[k2].h2h[k1]=(m[k2].h2h[k1]||0)+1}
      else{m[k1].d++;m[k2].d++}
    });
    var arr=Object.entries(m).map(function(e){return Object.assign({},e[1],{key:e[0]})});
    arr.sort(function(a,b){if(b.pts!==a.pts)return b.pts-a.pts;var aw=a.h2h[b.key]||0,bw=b.h2h[a.key]||0;if(aw!==bw)return bw-aw;return(b.pf-b.pa)-(a.pf-a.pa)});
    return arr;
  },[data,hasScore]);

  return <main className="mn" style={{paddingTop:16}}>
    <div className="cd">
      <p className="sl">{data.t.length}개 조</p>
      <div className="tg">{data.t.map(function(t,i){return <div key={i} className={"tc"+(t.b?" bonus":"")}>
        <div className="fb" style={{marginBottom:8}}><span style={{fontSize:12,fontWeight:800,color:t.b?"var(--gold)":"var(--brand)"}}>{t.b?"와일드카드":"조 "+(i+1)}</span><span style={{fontSize:11,fontWeight:700,color:"var(--tx2)",background:"var(--card)",border:"1px solid var(--bdr)",padding:"2px 7px",borderRadius:5}}>합 {t.p.reduce(function(s,x){return s+x.s},0)}</span></div>
        {t.p.map(function(p,j){return <div key={j} className="fb" style={{marginTop:4}}><span style={{fontSize:14,fontWeight:500}}>{p.n}</span><span className="fg"><Badge level={p.s} />{p.g&&<GBadge gender={p.g} />}</span></div>})}
      </div>})}</div>
    </div>
    {sTotal>0&&<div style={{marginBottom:14}}>
      <div className="fg" style={{marginBottom:5}}>
        <span style={{fontSize:12,fontWeight:700,color:sPct===100?"var(--green)":"var(--tx2)"}}>{sPct===100?"✅ 전체 완료":sDone+" / "+sTotal+" 경기"}</span>
        <span style={{fontSize:11,color:"var(--tx2)",marginLeft:"auto"}}>{sPct}%</span>
      </div>
      <div className="rb" style={{height:5}}><div className="rf" style={{width:sPct+"%",background:sPct===100?"var(--green)":"var(--brand)",transition:"width .4s ease"}} /></div>
    </div>}
    {data.r&&data.r.length>0&&data.r.map(function(rd,ri){return <div key={ri} className="cd">
      <div className="sl fg"><span>{rd.l||("라운드 "+rd.n)}</span><span style={{fontSize:11,color:"var(--tx2)",fontWeight:600,background:"var(--g4)",padding:"2px 7px",borderRadius:5}}>{rd.m.length}경기</span></div>
      {rd.m.map(function(m,mi){var a=parseInt(m.s1,10),b=parseInt(m.s2,10),ok=!isNaN(a)&&!isNaN(b);var w1=ok&&a>b,w2=ok&&b>a;
        return <div key={mi}>{m.c>0&&<span className="court-tag" style={{background:COURT_C[(m.c-1)%4]}}>코트 {m.c}</span>}<div className="mr">
          <div className={"msd"+(w2?" ls":"")}><div className="msd-n">{m.a.join(" · ")}</div>{w1&&<span className="wt">WIN</span>}</div>
          <div style={{display:"flex",alignItems:"center",padding:"0 6px",flexShrink:0}}><span className="sc">{m.s1||"-"} : {m.s2||"-"}</span></div>
          <div className={"msd"+(w1?" ls":"")}><div className="msd-n">{m.b.join(" · ")}</div>{w2&&<span className="wt">WIN</span>}</div>
        </div></div>})}
    </div>})}
    {hasScore?<div className="cd">
      <p className="sl">📊 순위표</p>
      <p style={{fontSize:12,color:"var(--tx2)",marginBottom:12}}>승리 +1점 · 동률: 승자승 → 득실차</p>
      {sRank.map(function(r,i){var tot=r.w+r.l+r.d;var pct=tot?Math.round(r.w/tot*100):0;
        return <div key={i} className="rr"><span style={{fontSize:15,fontWeight:800,color:i===0?"var(--gold)":i<3?"var(--brand)":"var(--g1)",width:26,textAlign:"center"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":(i+1)}</span><span style={{fontSize:14,fontWeight:700,minWidth:90,flex:"0 0 auto"}}>{r.name}{r.isBonus&&<span className="dual-tag" style={{marginLeft:4,background:"var(--gold)",color:"#fff"}}>⭐</span>}</span><span style={{fontSize:12,color:"var(--tx2)",minWidth:55}}>{r.w}승 {r.l}패</span><span style={{fontSize:13,fontWeight:800,color:"var(--brand)",minWidth:30}}>{r.pts}점</span><div className="rb"><div className="rf" style={{width:pct+"%"}} /></div><span style={{fontSize:12,color:"var(--tx2)",minWidth:50,textAlign:"right"}}>{r.pf}-{r.pa}</span></div>})}
    </div>:<div className="cd" style={{textAlign:"center",padding:"20px"}}><p style={{fontSize:13,color:"var(--tx2)"}}>매치 결과 입력 후 표시됩니다.</p></div>}
    <div className="cd" style={{textAlign:"center",padding:20}}>
      <button className="btn bp bf" onClick={function(){window.location.hash="";window.location.reload()}} style={{padding:"12px 24px"}}>🏸 와일드콕 열기</button>
    </div>
  </main>;
}

/* ═══════════════════════════════════════ */
/*  메인 앱                                 */
/* ═══════════════════════════════════════ */
const LOGO="uploads/wildcock_logo_transparent.png";
function App(){
  useEffect(()=>{
    if(!document.getElementById("wc-styles")){
      const s=document.createElement("style");s.id="wc-styles";s.textContent=CSS;document.head.appendChild(s);
    }
    /* favicon 동적 주입 — DC 런타임 부팅 후에도 확실히 적용 */
    if(!document.getElementById("wc-favicon")){
      const old=document.querySelector('link[rel="icon"],link[rel="shortcut icon"]');
      if(old)old.remove();
      const lnk=document.createElement("link");lnk.id="wc-favicon";lnk.rel="icon";lnk.href="uploads/favicon_32.png";
      document.head.appendChild(lnk);
    }
  },[]);

  const toast=useToast();
  const _ss=useMemo(()=>{try{return JSON.parse(localStorage.getItem("bp_session"))||{}}catch{return {}}},[]);
  const _shared=useMemo(()=>{try{const h=window.location.hash;if(!h.startsWith("#s="))return null;return JSON.parse(fromBase64(h.slice(3)))}catch{return null}},[]);
  const[sharedView]=useState(!!_shared);
  const[mainTab,setMainTab]=useState("badminton");
  const[subTab,setSubTab]=useState(()=>_ss.subTab||"players");
  const[players,setPlayers]=useState(()=>{try{const s=localStorage.getItem("bp");if(!s)return[];return JSON.parse(s).map(x=>({...x,gender:x.gender||null}))}catch{return[]}});
  const[nn,setNn]=useState("");const[ns,setNs]=useState(3);const[ng,setNg]=useState(null);
  const[teams,setTeams]=useState(()=>_ss.teams||[]);const[extraPlayer,setExtraPlayer]=useState(()=>_ss.extraPlayer||null);const[dualPartner,setDualPartner]=useState(()=>_ss.dualPartner||null);
  const[pm,setPm]=useState(()=>_ss.pm||"random");const[mixed,setMixed]=useState(()=>_ss.mixed||false);const[teamSize,setTeamSize]=useState(()=>_ss.teamSize||2);const[wildcardId,setWildcardId]=useState(()=>_ss.wildcardId!=null?_ss.wildcardId:null);
  const[mt,setMt]=useState(()=>_ss.mt||"roundrobin");const[courtCount,setCourtCount]=useState(()=>_ss.courtCount||1);const[restMode,setRestMode]=useState(()=>_ss.restMode||false);const[wcMode,setWcMode]=useState(()=>_ss.wcMode||"rotating");
  const[matches,setMatches]=useState(()=>_ss.matches||[]);
  const[eid,setEid]=useState(null);const[en,setEn]=useState("");const[esk,setEsk]=useState(3);const[eg,setEg]=useState(null);
  const[rNames,setRN]=useState("");const[rCnt,setRC]=useState(1);const[rSrc,setRS]=useState("custom");
  const[confetti,setConfetti]=useState(false);
  const[showShare,setShowShare]=useState(false);

  /* 다크모드 */
  const[darkMode,setDarkMode]=useState(()=>{try{const v=localStorage.getItem("bp_dark");if(v==="dark")return"dark";if(v==="light")return"light";return"auto"}catch{return"auto"}});
  useEffect(()=>{
    const root=document.documentElement;
    root.classList.remove("dark","light");
    if(darkMode==="dark")root.classList.add("dark");
    else if(darkMode==="light")root.classList.add("light");
    try{localStorage.setItem("bp_dark",darkMode)}catch{}
  },[darkMode]);
  const cycleDark=()=>setDarkMode(p=>p==="auto"?"dark":p==="dark"?"light":"auto");
  const darkIcon=darkMode==="dark"?"🌙":darkMode==="light"?"☀️":"🌓";

  /* 기록실 */
  const[history,setHistory]=useState(()=>{try{return JSON.parse(localStorage.getItem("bp_history"))||[]}catch{return[]}});
  const[pubHistory,setPubHistory]=useState([]);
  useEffect(()=>{try{localStorage.setItem("bp_history",JSON.stringify(history))}catch{}},[history]);

  /* 공용 기록: GitHub 레포 history/ 폴더에서 자동 로드 */
  useEffect(function(){
    try{
      var REPO="zmdals/wildcock";
      var DIR="history";
      fetch("https://api.github.com/repos/"+REPO+"/contents/"+DIR)
        .then(function(r){if(!r.ok)return null;return r.json()})
        .then(function(files){
          if(!files||!Array.isArray(files))return null;
          var jsons=files.filter(function(f){return f.name.endsWith(".json")});
          if(!jsons.length)return null;
          return Promise.all(jsons.map(function(f){
            return fetch(DIR+"/"+f.name).then(function(r){return r.ok?r.json():null}).catch(function(){return null});
          }));
        })
        .then(function(results){
          if(!results||!Array.isArray(results))return;
          var all=[];
          results.forEach(function(d){if(!d)return;var arr=Array.isArray(d)?d:[d];arr.forEach(function(s){if(s&&s.matchData)all.push(s)})});
          if(all.length)setPubHistory(all);
        })
        .catch(function(){});
    }catch(e){}
  },[]);

  useEffect(()=>{try{localStorage.setItem("bp",JSON.stringify(players))}catch{}},[players]);
  useEffect(()=>{try{localStorage.setItem("bp_session",JSON.stringify({teams,extraPlayer,dualPartner,pm,mixed,teamSize,wildcardId,mt,courtCount,restMode,wcMode,matches,subTab}))}catch{}},[teams,extraPlayer,dualPartner,pm,mixed,teamSize,wildcardId,mt,courtCount,restMode,wcMode,matches,subTab]);

  const nid=useMemo(()=>Math.max(0,...players.map(p=>p.id))+1,[players]);
  const allTeams=useMemo(()=>{if(!extraPlayer)return teams;if(wcMode==="fixed"&&dualPartner)return[...teams,{players:[extraPlayer,dualPartner],isBonus:true}];return[...teams,{players:[extraPlayer],isBonus:true}]},[teams,extraPlayer,dualPartner,wcMode]);

  /* ── records: genShareText/saveRankingImage 보다 먼저 정의 (TDZ 방지) ── */
  const records=useMemo(()=>{
    if(!teams.length||!matches.length)return[];
    const m={};teams.forEach(t=>{if(!t.bye&&!t.ph)m[tid(t)]={name:tn(t),w:0,l:0,d:0,pts:0,pf:0,pa:0,h2h:{}}});
    if(extraPlayer)m["wc"]=({name:extraPlayer.name+" ⭐",w:0,l:0,d:0,pts:0,pf:0,pa:0,h2h:{},isBonus:true});
    const k4t=t=>t.isBonus?"wc":tid(t);
    matches.forEach(r=>r.matches.forEach(x=>{const a=parseInt(x.s1,10),b=parseInt(x.s2,10);if(isNaN(a)||isNaN(b))return;
      const k1=k4t(x.team1),k2=k4t(x.team2);if(!m[k1]||!m[k2])return;
      m[k1].pf+=a;m[k1].pa+=b;m[k2].pf+=b;m[k2].pa+=a;
      if(a>b){m[k1].w++;m[k1].pts++;m[k2].l++;m[k1].h2h[k2]=(m[k1].h2h[k2]||0)+1}
      else if(b>a){m[k2].w++;m[k2].pts++;m[k1].l++;m[k2].h2h[k1]=(m[k2].h2h[k1]||0)+1}
      else{m[k1].d++;m[k2].d++}}));
    const arr=Object.entries(m).map(([k,v])=>({...v,key:k}));
    arr.sort((a,b)=>{if(b.pts!==a.pts)return b.pts-a.pts;const aw=a.h2h[b.key]||0,bw=b.h2h[a.key]||0;if(aw!==bw)return bw-aw;return(b.pf-b.pa)-(a.pf-a.pa)});
    return arr;
  },[teams,extraPlayer,matches]);

  const saveSession=()=>{
    if(!matchProgress||matchProgress.pct<100){toast.show("⚠️ 모든 매치 결과를 입력해주세요");return}
    const session={id:Date.now(),date:new Date().toISOString().slice(0,10),teamSize,mt,
      players:players.map(p=>({name:p.name,skill:p.skill,gender:p.gender})),
      matchData:matches.map(rd=>rd.matches.map(m=>({
        t1:(m.team1.players||[]).map(p=>p.name),t2:(m.team2.players||[]).map(p=>p.name),
        s1:parseInt(m.s1,10),s2:parseInt(m.s2,10)
      }))).flat()
    };
    const dup=history.find(h=>h.date===session.date&&h.matchData.length===session.matchData.length);
    if(dup&&!window.confirm("오늘 이미 저장된 기록이 있습니다. 추가 저장할까요?"))return;
    setHistory(prev=>[session,...prev]);
    toast.show("💾 기록 저장 완료!");
    /* GitHub 자동 push */
    const ghToken=localStorage.getItem("wc_gh_token");
    if(ghToken){pushSessionToGH(session,ghToken)}
  };

  const pushSessionToGH=(session,token)=>{
    const REPO="zmdals/wildcock";
    const fname="record_"+session.date+".json";
    const apiUrl="https://api.github.com/repos/"+REPO+"/contents/history/"+fname;
    const jsonStr=JSON.stringify([session],null,2);
    const content=btoa(unescape(encodeURIComponent(jsonStr)));
    /* 파일 존재 여부 확인 (같은 날짜 → 병합) */
    fetch(apiUrl,{headers:{Authorization:"token "+token}})
      .then(r=>r.ok?r.json():null)
      .then(existing=>{
        let body;
        if(existing&&existing.sha){
          /* 기존 파일이 있으면: 기존 내용 + 새 세션 병합 */
          try{
            const oldContent=JSON.parse(decodeURIComponent(escape(atob(existing.content.replace(/\n/g,"")))));
            const merged=Array.isArray(oldContent)?[...oldContent,session]:[oldContent,session];
            const unique=[...new Map(merged.map(s=>[s.id,s])).values()];
            const newContent=btoa(unescape(encodeURIComponent(JSON.stringify(unique,null,2))));
            body={message:"기록 업데이트: "+session.date,content:newContent,sha:existing.sha};
          }catch{
            body={message:"기록 추가: "+session.date,content,sha:existing.sha};
          }
        }else{
          body={message:"기록 추가: "+session.date,content};
        }
        return fetch(apiUrl,{method:"PUT",headers:{Authorization:"token "+token,"Content-Type":"application/json"},body:JSON.stringify(body)});
      })
      .then(r=>{if(r.ok){toast.show("☁️ GitHub에 자동 저장 완료!")}else{toast.show("⚠️ GitHub 저장 실패 ("+r.status+")")}})
      .catch(()=>toast.show("⚠️ GitHub 연결 실패"));
  };
  const delSession=id=>{if(!window.confirm("이 기록을 삭제할까요?"))return;setHistory(prev=>prev.filter(s=>s.id!==id))};
  var shareOrDownload=function(blob,fname,title,toastMsg){
    /* 모바일/태블릿: Web Share API */
    if(typeof File!=="undefined"&&navigator.share&&navigator.canShare){
      try{
        var file=new File([blob],fname,{type:blob.type||"application/json"});
        if(navigator.canShare({files:[file]})){
          navigator.share({title:title||fname,files:[file]}).catch(function(){});
          return;
        }
      }catch(e){/* 무시 */}
    }
    /* 데스크톱/폴백: 안내 + 다운로드 */
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download=fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.show(toastMsg||"📥 "+fname+" 다운로드 완료");
  };
  const shareSession=function(sess){
    var fname="record_"+sess.date+".json";
    var blob=new Blob([JSON.stringify([sess],null,2)],{type:"application/json"});
    shareOrDownload(blob,fname,"와일드콕 기록 "+sess.date,"📥 "+fname+" 다운로드 완료 — 관리자에게 전달해주세요");
  };
  const exportHistory=function(){
    var fname="records_"+new Date().toISOString().slice(0,10)+".json";
    var blob=new Blob([JSON.stringify(history,null,2)],{type:"application/json"});
    shareOrDownload(blob,fname,"와일드콕 기록 백업","📥 "+fname+" 다운로드 완료");
  };
  const importHistory=(e)=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{try{
      const data=JSON.parse(ev.target.result);
      if(!Array.isArray(data)){toast.show("⚠️ 올바른 백업 파일이 아닙니다");return}
      const merged=[...data,...history];
      const unique=[...new Map(merged.map(s=>[s.id,s])).values()];
      unique.sort((a,b)=>b.id-a.id);
      setHistory(unique);toast.show("✅ "+data.length+"건 가져오기 완료");
    }catch{toast.show("⚠️ 파일 읽기 실패")}};
    reader.readAsText(file);e.target.value="";
  };

  // 이스터에그
  const konamiRef=useRef([]);
  const logoClickRef=useRef(0);
  const KONAMI="r,e,s,p,o,n,s,e";
  useEffect(()=>{
    const handler=e=>{
      konamiRef.current.push(e.key);if(konamiRef.current.length>10)konamiRef.current.shift();
      if(konamiRef.current.join(",")===KONAMI){
        setConfetti(true);toast.show(" 즐거웠어 대응팀.. 또 볼 수 있길! 🤞",3000);
        document.body.classList.add("party-mode");
        setTimeout(()=>{setConfetti(false);document.body.classList.remove("party-mode")},3000);
        konamiRef.current=[];
      }
    };
    window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);
  },[]);
  const onLogoClick=()=>{
    logoClickRef.current++;
    if(logoClickRef.current>=7){
      logoClickRef.current=0;
      setConfetti(true);toast.show("🏸💕사랑해요 와일드콕!",2000);
      setTimeout(()=>setConfetti(false),3000);
    }
  };

  const genShareText=useCallback(()=>{
    const real=allTeams.filter(t=>!t.bye&&!t.ph);if(!real.length)return"";
    let txt="🏸 와일드콕 조편성 결과\n\n【조 편성】 "+real.length+"개 조\n";
    real.forEach((t,i)=>{const nm=(t.players||[]).map(x=>x.name).join(", ");const sk=(t.players||[]).reduce((s,x)=>s+x.skill,0);txt+=(t.isBonus?"⭐와일드카드":"  "+(i+1)+"조")+": "+nm+" (합 "+sk+")\n"});
    if(matches.length){
      const hasAnyScore=records.some(r=>r.w+r.l+r.d>0);
      txt+="\n【매치 결과】\n";
      if(hasAnyScore){
        records.forEach((r,i)=>{txt+="  "+(i===0?"🥇":i===1?"🥈":i===2?"🥉":" "+(i+1))+" "+r.name+" — "+r.w+"승 "+r.l+"패 "+r.pts+"점 ("+r.pf+"-"+r.pa+")\n"});
      }else{
        txt+="  매치 결과 입력 후 표시됩니다.\n";
      }
    }
    return txt;
  },[allTeams,matches,records]);

  const genShareUrl=useCallback(()=>{
    const real=allTeams.filter(t=>!t.bye&&!t.ph);if(!real.length)return null;
    try{
      const d={t:real.map(t=>({p:(t.players||[]).map(x=>({n:x.name,s:x.skill,g:x.gender||""})),b:!!t.isBonus})),
        r:matches.map(rd=>({l:rd.label||"",n:rd.round,m:rd.matches.map(m=>({a:(m.team1.players||[]).map(p=>p.name),b:(m.team2.players||[]).map(p=>p.name),s1:m.s1,s2:m.s2,c:m.court||0}))})),mt};
      const enc=toBase64(JSON.stringify(d));
      return window.location.origin+window.location.pathname+"#s="+enc;
    }catch{return null}
  },[allTeams,matches,mt]);

  const warnReset=()=>{if(teams.length>0){if(!window.confirm("조 편성/매치가 초기화됩니다.\n계속?"))return false;setTeams([]);setMatches([]);setExtraPlayer(null);setDualPartner(null);toast.show("초기화됨")}return true};
  const resetAll=()=>{if(!window.confirm("⚠️ 모든 선수, 조편성, 매치 기록이 삭제됩니다.\n정말 초기화하시겠습니까?"))return;setPlayers([]);setTeams([]);setMatches([]);setExtraPlayer(null);setDualPartner(null);setWildcardId(null);toast.show("전체 초기화 완료")};
  const addP=()=>{const name=nn.trim();if(!name)return;if(players.some(p=>p.name===name)){toast.show("⚠️ 이미 등록됨");return}if(!warnReset())return;setPlayers(p=>[...p,{id:nid,name,skill:ns,gender:ng}]);setNn("");setNs(3);setNg(null);toast.show("✅ "+name)};
  const delP=id=>{if(!warnReset())return;setPlayers(p=>p.filter(x=>x.id!==id))};
  const startE=p=>{setEid(p.id);setEn(p.name);setEsk(p.skill);setEg(p.gender)};
  const saveE=()=>{if(!warnReset()){setEid(null);return}setPlayers(p=>p.map(x=>x.id===eid?{...x,name:en,skill:esk,gender:eg}:x));setEid(null)};

  const doTeams=()=>{
    const minP=teamSize===3?6:4;if(players.length<minP)return;
    let act=[...players],extra=null;const rem=act.length%teamSize;
    if(rem>0){
      if(rem===1){
        let ep=null;
        if(wildcardId!=null){const idx=act.findIndex(p=>p.id===wildcardId);if(idx>=0){ep=act[idx];act=act.filter((_,j)=>j!==idx)}}
        if(!ep){
          if(mixed&&teamSize===2){
            const ms=act.filter(p=>p.gender==="M"),fs=act.filter(p=>p.gender==="F");
            const pool=ms.length>fs.length?ms:fs.length>ms.length?fs:act;
            ep=pool[0|Math.random()*pool.length];
          }else{ep=act[0|Math.random()*act.length]}
          act=act.filter(p=>p.id!==ep.id);
        }
        extra=ep;
      }
      else if(rem===2&&teamSize===3){const sh=shuffle(act);const pair=sh.slice(-2);act=sh.slice(0,-2);let result=pm==="balanced"?balanced3(act):random3(act);result.push({players:pair,isSmall:true});setTeams(result);setExtraPlayer(null);setDualPartner(null);setMatches([]);setSubTab("teams");return}
    }
    let result;
    if(mixed&&teamSize===2)result=mixedPair(act,pm);
    else if(teamSize===3)result=pm==="balanced"?balanced3(act):random3(act);
    else result=pm==="balanced"?balanced2(act):random2(act);
    if(act.every(p=>p.skill===act[0].skill)&&pm==="balanced")toast.show("ℹ️ 실력 동일 — 무작위 동일");
    if(mixed&&teamSize===3)toast.show("ℹ️ 혼성은 2인 조 전용");
    setTeams(result);setExtraPlayer(extra);setDualPartner(null);setMatches([]);setSubTab("teams");
  };

  const canGenMatch=extraPlayer?(wcMode==="fixed"?!!dualPartner&&allTeams.length>=2:teams.length>=2&&mt==="roundrobin"):teams.length>=2;
  const doMatches=()=>{if(!canGenMatch)return;let raw;if(extraPlayer&&wcMode==="rotating"&&mt==="roundrobin"){raw=genRRWildcard(teams,extraPlayer,mixed)}else{raw=mt==="roundrobin"?genRR(allTeams):genT(allTeams)}setMatches(courtCount>1&&mt==="roundrobin"?scheduleSlots(raw,courtCount,restMode):assignCourts(raw,courtCount));setSubTab("matches")};
  const setScore=(ri,mi,side,v)=>{const num=v.replace(/[^0-9]/g,"");setMatches(prev=>prev.map((rd,rIdx)=>rIdx!==ri?rd:{...rd,matches:rd.matches.map((m,mIdx)=>mIdx!==mi?m:{...m,[side===1?"s1":"s2"]:num})}))};

  const matchProgress=useMemo(()=>{
    if(!matches.length)return null;
    const total=matches.reduce((a,r)=>a+r.matches.length,0);
    const done=matches.reduce((a,r)=>a+r.matches.filter(m=>m.s1!==""&&m.s2!=="").length,0);
    return{total,done,pct:total?Math.round(done/total*100):0};
  },[matches]);

  const saveRankingImage=useCallback(()=>{
    if(!records.length)return;
    const d=new Date();const ds=`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
    const scale=2,W=480,rowH=40,padT=60,padB=20;
    const H=padT+records.length*rowH+padB;
    const cvs=document.createElement("canvas");cvs.width=W*scale;cvs.height=H*scale;
    const ctx=cvs.getContext("2d");ctx.scale(scale,scale);
    ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
    ctx.font="bold 13px Pretendard,-apple-system,sans-serif";ctx.fillStyle="#59616C";ctx.textBaseline="middle";
    ctx.fillText("🏸 와일드콕 순위표",20,28);
    ctx.font="11px Pretendard,-apple-system,sans-serif";ctx.textAlign="right";ctx.fillText(ds,W-20,28);ctx.textAlign="left";
    const medals=["🥇","🥈","🥉"];
    records.forEach((r,i)=>{
      const y=padT+i*rowH;
      if(i%2===1){ctx.fillStyle="#F2F4F6";ctx.fillRect(16,y,W-32,rowH)}
      const cy=y+rowH/2;
      ctx.fillStyle=i===0?"#E0900A":i<3?"#0B9E5D":"#8A929E";
      ctx.font="bold 15px Pretendard,-apple-system,sans-serif";ctx.textAlign="center";
      ctx.fillText(i<3?medals[i]:""+(i+1),40,cy);
      ctx.fillStyle="#101418";ctx.font="600 14px Pretendard,-apple-system,sans-serif";ctx.textAlign="left";
      ctx.fillText(r.name,68,cy);
      ctx.fillStyle="#59616C";ctx.font="12px Pretendard,-apple-system,sans-serif";
      ctx.fillText(r.w+"승 "+r.l+"패",250,cy);
      ctx.fillStyle="#0B9E5D";ctx.font="bold 13px Pretendard,-apple-system,sans-serif";
      ctx.fillText(r.pts+"점",330,cy);
      ctx.fillStyle="#59616C";ctx.font="12px Pretendard,-apple-system,sans-serif";ctx.textAlign="right";
      ctx.fillText(r.pf+"-"+r.pa,W-20,cy);ctx.textAlign="left";
    });
    cvs.toBlob(b=>{
      if(!b)return;
      const url=URL.createObjectURL(b);
      const a=document.createElement("a");a.href=url;a.download="와일드콕_순위표_"+ds.replace(/\./g,"")+".png";
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.show("📸 순위표 이미지 저장됨");
    },"image/png");
  },[records,toast]);

  const minPlayers=teamSize===3?6:4;
  const getRP=()=>rSrc==="players"?players.map(p=>p.name):rNames.split("\n").map(s=>s.trim()).filter(Boolean);
  const rPool=getRP();
  const realTeamCount=allTeams.filter(t=>!t.bye&&!t.ph).length;
  const totalMatchCount=matches.reduce((a,r)=>a+r.matches.length,0);

  return (
    <div>
      {toast.el}
      <Confetti active={confetti} />

      <header className="hdr no-print">
        <div className="hdr-in">
          <div className="ttl"><img src={LOGO} alt="와일드콕" onClick={onLogoClick} />와일드콕{sharedView&&<span style={{fontSize:13,fontWeight:600,color:"var(--tx2)",marginLeft:6}}>공유된 결과</span>}<button className="dm-btn" onClick={cycleDark} title={darkMode==="auto"?"자동":darkMode==="dark"?"다크":"라이트"} style={{marginLeft:"auto"}}>{darkIcon}</button></div>
          {!sharedView&&<div className="mt">
            <button className={mainTab==="badminton"?"on":""} onClick={()=>setMainTab("badminton")}>🏸 배드민턴</button>
            <button className={mainTab==="records"?"on":""} onClick={()=>setMainTab("records")}>📊 기록실</button>
            <button className={mainTab==="roulette"?"on":""} onClick={()=>setMainTab("roulette")}>🎴 랜덤뽑기</button>
            <button className={mainTab==="dutch"?"on":""} onClick={()=>setMainTab("dutch")}>💰 금액정산</button>
          </div>}
        </div>
      </header>

      {sharedView&&_shared?<SharedView data={_shared} />:<main className="mn" style={{paddingTop:16}}>

      {mainTab==="badminton"&&<div>
        <StatBento playerCount={players.length} teamCount={realTeamCount} matchCount={totalMatchCount} />
        <div className="st no-print" style={{marginBottom:18}}>
          <button className={subTab==="players"?"on":""} onClick={()=>setSubTab("players")}>선수 ({players.length})</button>
          <button className={subTab==="teams"?"on":""} onClick={()=>setSubTab("teams")}>조 편성{teams.length?` (${realTeamCount})`:""}</button>
          <button className={subTab==="matches"?"on":""} onClick={()=>setSubTab("matches")}>매치{matches.length?` (${totalMatchCount})`:""}</button>
        </div>

        {subTab==="players"&&<div>
          <div className="cd">
            <p className="sl">선수 추가</p>
            <div className="fg fw" style={{alignItems:"flex-end",gap:12}}>
              <div style={{flex:1,minWidth:120}}><label style={{fontSize:12,color:"var(--tx2)",fontWeight:600,display:"block",marginBottom:6}}>이름</label><input className="inp" placeholder="이름" value={nn} onChange={e=>setNn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addP()} /></div>
              <div><label style={{fontSize:12,color:"var(--tx2)",fontWeight:600,display:"block",marginBottom:6}}>실력 — <span style={{color:SK_C[ns],fontWeight:800}}>{SK_L[ns]}</span></label><SkB value={ns} onChange={setNs} /></div>
              <div><label style={{fontSize:12,color:"var(--tx2)",fontWeight:600,display:"block",marginBottom:6}}>성별</label><GenB value={ng} onChange={setNg} /></div>
              <button className="btn bp" onClick={addP} style={{height:43}}>추가</button>
            </div>
          </div>
          <div className="cd">
            <div className="fb" style={{marginBottom:12}}><p className="sl" style={{margin:0}}>선수 목록</p><div className="fg"><span style={{fontSize:13,color:"var(--tx2)",fontWeight:600}}>{players.length}명</span>{players.length>0&&<button className="btn bd" onClick={resetAll} style={{padding:"4px 10px",fontSize:11}}>전체 초기화</button>}</div></div>
            {!players.length?<div className="es"><div className="es-i">👤</div><div className="es-t">선수를 추가해주세요</div><div className="es-s">최소 {minPlayers}명</div></div>:
            players.map((p,i)=><div key={p.id} className="ri">
              {eid===p.id?<>
                <input className="inp" value={en} onChange={e=>setEn(e.target.value)} style={{flex:1,padding:"7px 10px",fontSize:14,background:"var(--card)"}} autoFocus onKeyDown={e=>{if(e.key==="Enter")saveE();if(e.key==="Escape")setEid(null)}} />
                <SkB value={esk} onChange={setEsk} small /><GenB value={eg} onChange={setEg} small />
                <button className="btn bs" onClick={saveE} style={{padding:"5px 12px",fontSize:12}}>저장</button>
                <button className="btn bd" onClick={()=>setEid(null)} style={{padding:"5px 8px",fontSize:12}}>취소</button>
              </>:<>
                <span style={{fontSize:12,color:"var(--tx3)",fontWeight:700,width:20,textAlign:"center"}}>{i+1}</span>
                <span style={{flex:1,fontSize:14,fontWeight:600}}>{p.name}</span>
                <GBadge gender={p.gender} /><Badge level={p.skill} />
                <button className="btn bs" onClick={()=>startE(p)} style={{padding:"4px 10px",fontSize:11}}>수정</button>
                <button className="btn bd" onClick={()=>delP(p.id)} style={{padding:"4px 8px",fontSize:13}}>✕</button>
              </>}
            </div>)}
          </div>
          <div className="cd">
            <p className="sl">조 편성</p>
            <div style={{marginBottom:14}}><label style={{fontSize:12,color:"var(--tx2)",fontWeight:600,display:"block",marginBottom:7}}>팀 인원</label><div className="fg"><button className={"pill "+(teamSize===2?"p-on":"p-off")} onClick={()=>setTeamSize(2)}>2인</button><button className={"pill "+(teamSize===3?"p-on":"p-off")} onClick={()=>setTeamSize(3)}>3인</button></div></div>
            <div style={{marginBottom:14}}><label style={{fontSize:12,color:"var(--tx2)",fontWeight:600,display:"block",marginBottom:7}}>방식</label><div className="fg fw"><button className={"pill "+(pm==="random"?"p-on":"p-off")} onClick={()=>setPm("random")}>🎲 무작위</button><button className={"pill "+(pm==="balanced"?"p-on":"p-off")} onClick={()=>setPm("balanced")}>⚖️ 밸런스</button>{teamSize===2&&<button className={"pill "+(mixed?"p-on":"p-off")} onClick={()=>setMixed(!mixed)} style={mixed?{background:"var(--pink)",borderColor:"var(--pink)"}:{}}>👫 혼성</button>}</div></div>
            {players.length>=minPlayers&&players.length%teamSize===1&&<div style={{marginBottom:14}}><label style={{fontSize:12,color:"var(--tx2)",fontWeight:600,display:"block",marginBottom:7}}>와일드카드 지정</label><select className="inp" value={wildcardId==null?"auto":wildcardId} onChange={e=>setWildcardId(e.target.value==="auto"?null:+e.target.value)} style={{padding:"9px 12px"}}><option value="auto">자동 (랜덤{mixed?" · 다수 성별 우선":""})</option>{players.map(p=><option key={p.id} value={p.id}>{p.name} (Lv.{p.skill}{p.gender?" "+GEN_L[p.gender]:""})</option>)}</select></div>}
            <button className="btn bp bf" onClick={doTeams} disabled={players.length<minPlayers}>{players.length<minPlayers?`최소 ${minPlayers}명 (${players.length}명)`:"조 편성하기"}</button>
          </div>
        </div>}

        {subTab==="teams"&&<div>
          {!teams.length?<div className="cd es"><div className="es-i">🏸</div><div className="es-t">편성된 조 없음</div></div>:<>
            {extraPlayer&&<div className="cd bye-b">
              <div className="fg" style={{marginBottom:8}}>
                <span style={{fontSize:20}}>⭐</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"var(--gold)"}}>와일드카드</div><div style={{fontSize:15,fontWeight:700,marginTop:2}}>{extraPlayer.name}</div></div>
                <Badge level={extraPlayer.skill} /><GBadge gender={extraPlayer.gender} />
              </div>
              <div className="fg" style={{marginBottom:8,gap:6}}>
                <button className={"pill "+(wcMode==="rotating"?"p-on":"p-off")} onClick={()=>{setWcMode("rotating");setDualPartner(null)}} style={{fontSize:11}}>🔄 로테이팅</button>
                <button className={"pill "+(wcMode==="fixed"?"p-on":"p-off")} onClick={()=>setWcMode("fixed")} style={{fontSize:11}}>📌 고정</button>
              </div>
              {wcMode==="rotating"&&<p style={{fontSize:12,color:"var(--tx2)",margin:0,lineHeight:1.5}}>매 경기 다른 파트너 자동 배정 (밸런스·비중복{mixed?"·혼성":""})</p>}
              {wcMode==="fixed"&&<>
                {!dualPartner&&<><p style={{fontSize:12,color:"var(--tx2)",margin:"0 0 8px",lineHeight:1.5}}>고정 파트너를 선택하세요. 파트너는 양쪽 팀 모두 출전합니다.</p>
                  <div className="dp-grid">{teams.flatMap(t=>(t.players||[]).map(p=><button key={p.id} className="dp-btn" onClick={()=>{setDualPartner(p);toast.show("📌 "+p.name+" 고정")}}><div style={{fontSize:13,fontWeight:700}}>{p.name}</div><div style={{fontSize:11,color:"var(--tx2)",marginTop:2}}>Lv.{p.skill}</div></button>))}</div></>}
                {dualPartner&&<div style={{padding:"8px 12px",background:"rgba(224,144,10,.09)",borderRadius:10}}><div className="fg"><span style={{fontSize:14,fontWeight:700}}>{dualPartner.name}</span><span className="dual-tag">고정</span><button className="btn bs" onClick={()=>setDualPartner(null)} style={{marginLeft:"auto",padding:"4px 10px",fontSize:11}}>변경</button></div></div>}
              </>}
            </div>}
            <div className="cd">
              <div className="fb" style={{marginBottom:12}}><p className="sl" style={{margin:0}}>{teams.length}개 조{extraPlayer?" + 와일드카드":""}</p><button className="btn bs" onClick={doTeams}>🔄 다시</button></div>
              <div className="tg">{allTeams.filter(t=>!t.bye&&!t.ph).map((t,i)=><div key={i} className={"tc"+(t.isBonus?" bonus":"")}>
                <div className="fb" style={{marginBottom:8}}><span style={{fontSize:12,fontWeight:800,color:t.isBonus?"var(--gold)":t.isSmall?"var(--purple)":"var(--brand)"}}>{t.isBonus?"⭐ 와일드카드":t.isSmall?"소수조":"조 "+(i+1)}</span>{!t.isBonus&&<span style={{fontSize:11,fontWeight:700,color:"var(--tx2)",background:"var(--card)",border:"1px solid var(--bdr)",padding:"2px 7px",borderRadius:5}}>합 {tsk(t)}</span>}</div>
                {(t.players||[]).map((p,j)=><div key={j} className="fb" style={{marginTop:4}}><span style={{fontSize:14,fontWeight:600}}>{p.name}</span><span className="fg"><GBadge gender={p.gender} /><Badge level={p.skill} /></span></div>)}
              </div>)}</div>
            </div>
            <div className="cd">
              <p className="sl">매치 생성</p>
              <div className="fg fw" style={{marginBottom:12}}><button className={"pill "+(mt==="roundrobin"?"p-on":"p-off")} onClick={()=>setMt("roundrobin")}>🔁 라운드 로빈</button><button className={"pill "+(mt==="tournament"?"p-on":"p-off")} onClick={()=>setMt("tournament")}>🏆 토너먼트</button></div>
              <div style={{marginBottom:14}}><label style={{fontSize:12,color:"var(--tx2)",fontWeight:600,display:"block",marginBottom:7}}>코트 수</label><div className="fg">{[1,2,3,4].map(n=><button key={n} className={"pill "+(courtCount===n?"p-on":"p-off")} onClick={()=>setCourtCount(n)}>{n}면</button>)}</div></div>
              {courtCount>1&&mt==="roundrobin"&&<div style={{marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:600,color:"var(--tx)",cursor:"pointer"}}><input type="checkbox" checked={restMode} onChange={e=>setRestMode(e.target.checked)} style={{width:16,height:16,accentColor:"var(--brand)"}} />⚖️ 휴식 최적화<span style={{fontSize:11,color:"var(--tx2)",fontWeight:400}}>(연속경기 최소화, 부분 휴식 자동 배치)</span></label></div>}
              {extraPlayer&&wcMode==="rotating"&&mt==="tournament"&&<p style={{fontSize:12,color:"var(--tx2)",marginBottom:12}}>ℹ️ 로테이팅 와일드카드는 라운드 로빈만 지원. 토너먼트는 고정 모드로 전환하세요.</p>}
              {extraPlayer&&wcMode==="fixed"&&!dualPartner&&<p style={{fontSize:13,color:"var(--danger)",fontWeight:700,marginBottom:12}}>⚠️ 고정 파트너를 먼저 선택하세요</p>}
              <button className="btn bgn bf" onClick={doMatches} disabled={!canGenMatch}>매치 생성</button>
            </div>
          </>}
        </div>}

        {subTab==="matches"&&<div>
          {!matches.length?<div className="cd es"><div className="es-i">📋</div><div className="es-t">매치 없음</div></div>:<>
            <div className="fb no-print" style={{marginBottom:8}}>
              <div style={{fontSize:19,fontWeight:800}}>{mt==="roundrobin"?"라운드 로빈":"토너먼트"}</div>
              <div className="fg"><button className="btn bs" onClick={()=>setShowShare(true)}>📤</button><button className="btn bs" onClick={()=>printSheet(allTeams,matches,mt,null,records,toast)}>🖨️</button><button className="btn bs" onClick={doMatches}>🔄</button></div>
            </div>
            {matchProgress&&<div className="no-print" style={{marginBottom:14}}>
              <div className="fg" style={{marginBottom:5}}>
                <span style={{fontSize:12,fontWeight:700,color:matchProgress.pct===100?"var(--green)":"var(--tx2)"}}>{matchProgress.pct===100?"✅ 전체 완료":matchProgress.done+" / "+matchProgress.total+" 경기"}</span>
                <span style={{fontSize:11,color:"var(--tx2)",marginLeft:"auto"}}>{matchProgress.pct}%</span>
              </div>
              <div className="rb" style={{height:5}}><div className="rf" style={{width:matchProgress.pct+"%",background:matchProgress.pct===100?"var(--green)":"var(--brand)",transition:"width .4s ease"}} /></div>
            </div>}
            {matches.map((rd,ri)=><div key={ri} className="cd">
              <div className="sl fg"><span style={{color:rd.label?"var(--purple)":undefined}}>{rd.label||("라운드 "+rd.round)}</span><span style={{fontSize:11,color:"var(--tx2)",fontWeight:600,background:"var(--g4)",padding:"2px 7px",borderRadius:5,letterSpacing:0}}>{rd.matches.length===0?"휴식":rd.matches.length+(courtCount>1&&rd.matches.length<courtCount?" / "+courtCount:"")+"경기"}</span></div>
              {rd.matches.map((m,mi)=>{const a=parseInt(m.s1,10),b=parseInt(m.s2,10),ok=!isNaN(a)&&!isNaN(b);const w1=ok&&a>b,w2=ok&&b>a;
                return <div key={mi}>{m.court&&<span className="court-tag" style={{background:COURT_C[(m.court-1)%4]}}>코트 {m.court}</span>}<div className="mr">
                  <div className={"msd"+(w2?" ls":"")}><div className="msd-n">{tn(m.team1)}{m.team1.isBonus&&<span className="dual-tag" style={{marginLeft:4,background:"var(--gold)",color:"#fff"}}>⭐</span>}</div>{tsk(m.team1)!=null&&<div className="msd-s">합 {tsk(m.team1)}</div>}{w1&&<span className="wt">WIN</span>}</div>
                  <div style={{display:"flex",alignItems:"center",padding:"0 6px",flexShrink:0}}><input className="si" inputMode="numeric" pattern="[0-9]*" value={m.s1} onChange={e=>setScore(ri,mi,1,e.target.value)} placeholder="-" maxLength="3" /><span className="sc">:</span><input className="si" inputMode="numeric" pattern="[0-9]*" value={m.s2} onChange={e=>setScore(ri,mi,2,e.target.value)} placeholder="-" maxLength="3" /></div>
                  <div className={"msd"+(w1?" ls":"")}><div className="msd-n">{tn(m.team2)}{m.team2.isBonus&&<span className="dual-tag" style={{marginLeft:4,background:"var(--gold)",color:"#fff"}}>⭐</span>}</div>{tsk(m.team2)!=null&&<div className="msd-s">합 {tsk(m.team2)}</div>}{w2&&<span className="wt">WIN</span>}</div>
                </div></div>})}
              {courtCount>1&&rd.matches.length<courtCount&&(()=>{
                const usedCourts=new Set(rd.matches.map(m=>m.court));
                const restCourts=[];for(let c=1;c<=courtCount;c++)if(!usedCourts.has(c))restCourts.push(c);
                return restCourts.map((rc,k)=>
                  <div key={"rest-"+k}><span className="court-tag" style={{background:"var(--g2)"}}>코트 {rc}</span><div className="mr" style={{opacity:.5,justifyContent:"center",padding:"10px 0"}}><span style={{fontSize:13,color:"var(--tx2)",fontWeight:700}}>😴 부분 휴식</span></div></div>
                );
              })()}
            </div>)}
            {records.some(r=>r.w+r.l+r.d>0)&&<div className="cd" id="ranking-card">
              <div className="fb" style={{marginBottom:4}}><p className="sl" style={{margin:0}}>📊 순위표</p><button className="btn bs no-print" onClick={saveRankingImage} style={{padding:"4px 10px",fontSize:11}}>📸 이미지 저장</button></div><p style={{fontSize:12,color:"var(--tx2)",marginBottom:12}}>승리 +1점 · 동률: 승자승 → 득실차</p>
              {records.map((r,i)=>{const tot=r.w+r.l+r.d;const pct=tot?Math.round(r.w/tot*100):0;
                return <div key={i} className="rr"><span style={{fontSize:15,fontWeight:800,color:i===0?"var(--gold)":i<3?"var(--brand)":"var(--g1)",width:26,textAlign:"center"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":(i+1)}</span><span style={{fontSize:14,fontWeight:700,minWidth:90,flex:"0 0 auto"}}>{r.name}{r.isBonus&&<span className="dual-tag" style={{marginLeft:4,background:"var(--gold)",color:"#fff"}}>⭐</span>}</span><span style={{fontSize:12,color:"var(--tx2)",minWidth:55}}>{r.w}승 {r.l}패</span><span style={{fontSize:13,fontWeight:800,color:"var(--brand)",minWidth:30}}>{r.pts}점</span><div className="rb"><div className="rf" style={{width:pct+"%"}} /></div><span style={{fontSize:12,color:"var(--tx2)",minWidth:50,textAlign:"right"}}>{r.pf}-{r.pa}</span></div>})}
            </div>}
            {matchProgress&&matchProgress.pct===100&&<div className="cd no-print" style={{textAlign:"center",background:"var(--brand50)",border:"1px solid rgba(11,158,93,.25)"}}>
              <div style={{fontSize:15,fontWeight:800,color:"var(--brand)",marginBottom:8}}>🎉 모든 매치 완료!</div>
              <p style={{fontSize:12,color:"var(--tx2)",marginBottom:14}}>기록실에 저장하면 누적 통계에 반영됩니다.</p>
              <button className="btn bgn bf" onClick={saveSession} style={{fontSize:15,padding:"12px 24px"}}>💾 기록실에 저장</button>
              <button className="btn bs" onClick={function(){
                var sess={id:Date.now(),date:new Date().toISOString().slice(0,10),teamSize:teamSize,mt:mt,
                  players:players.map(function(p){return{name:p.name,skill:p.skill,gender:p.gender}}),
                  matchData:matches.map(function(rd){return rd.matches.map(function(m){return{
                    t1:(m.team1.players||[]).map(function(p){return p.name}),t2:(m.team2.players||[]).map(function(p){return p.name}),
                    s1:parseInt(m.s1,10),s2:parseInt(m.s2,10)}})}).flat()};
                var fn="record_"+sess.date+".json";
                var bl=new Blob([JSON.stringify([sess],null,2)],{type:"application/json"});
                shareOrDownload(bl,fn,"와일드콕 기록 "+sess.date,"📥 "+fn+" 다운로드 완료 — 관리자에게 전달해주세요");
              }} style={{fontSize:13,padding:"10px 20px",marginTop:8}}>📤 관리자에게 전송</button>
              <p style={{fontSize:11,color:"var(--tx2)",marginTop:8}}>관리자 부재 시: 저장 후 전송 버튼으로 카톡 전달</p>
            </div>}
          </>}
        </div>}
      </div>}

      {mainTab==="records"&&<RecordsTab history={history} pubHistory={pubHistory} onDelete={delSession} onExport={exportHistory} onImport={importHistory} onShare={shareSession} />}

      {mainTab==="roulette"&&<div>
        <div className="cd">
          <p className="sl">대상자</p>
          <div className="fg" style={{marginBottom:12}}><button className={"pill "+(rSrc==="players"?"p-on":"p-off")} onClick={()=>setRS("players")}>🏸 등록 선수</button><button className={"pill "+(rSrc==="custom"?"p-on":"p-off")} onClick={()=>setRS("custom")}>✏️ 직접 입력</button></div>
          {rSrc==="custom"?<textarea className="inp" rows={5} placeholder={"한 줄에 하나씩\n김철수\n이영희"} value={rNames} onChange={e=>setRN(e.target.value)} style={{resize:"vertical",lineHeight:1.6}} />
          :<div style={{fontSize:14,color:"var(--tx2)",padding:"10px 0"}}>{players.length?`${players.length}명: ${players.map(p=>p.name).join(", ")}`:"선수 없음"}</div>}
        </div>
        <div className="cd"><p className="sl">뽑기 설정</p><div className="fg" style={{marginBottom:12}}><label style={{fontSize:14,fontWeight:600}}>인원:</label><select className="inp" value={rCnt} onChange={e=>setRC(+e.target.value)} style={{width:70,padding:"8px 10px",textAlign:"center"}}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}명</option>)}</select></div></div>
        {rPool.length>0?<VirusLottery pool={rPool} count={rCnt} />:<div className="cd es"><div className="es-i">🎲</div><div className="es-t">대상자를 추가해주세요</div></div>}
      </div>}

      {mainTab==="dutch"&&<DutchPayTab players={players} />}

      {showShare&&<ShareModal txt={genShareText()} url={genShareUrl()} onClose={()=>setShowShare(false)} />}

      <footer className="app-footer no-print">
        <div>Made by Min Lim</div>
        <div>
          <p>zmdals@gmail.com</p>
          <span className="sep">·</span>
        </div>
      </footer>

      </main>}
    </div>
  );
}

window.WildcockApp=App;
