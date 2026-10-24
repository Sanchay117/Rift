import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import vm from 'node:vm';
const engine=await fs.readFile(new URL('../src/engine.js',import.meta.url),'utf8');
const presentation=await fs.readFile(new URL('../src/presentation.js',import.meta.url),'utf8');
const {calculateRift,buildRiftOverlay,riftDisplayRows}=vm.runInNewContext(engine+'\n'+presentation+'\n({calculateRift,buildRiftOverlay,riftDisplayRows})');
const now=Date.UTC(2026,9,24,12),sec=now/1000;
const opts={ticker:'TEST',asOf:now,days:7,threshold:0.1};
function row(id,premium,tag,strike=100,expiry=Date.UTC(2026,10,20)/1000){return{id,ticker:'TEST',timestamp:sec-3600,costBasis:premium,strike,type:'CALL',expDate:expiry,expDateFormatted:'20 Nov\'26',tags:[tag]};}
function fixture(){return Array.from({length:12},(_,i)=>row('id'+i,i<6?100:40,i<6?'bullish':'bearish',100+i));}
function close(a,b){assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);}
test('hand receipt, all-one-group omissions, and concentration breadth reconcile',()=>{
 const r=[row('a',600,'bullish',100),row('b',300,'bearish',110),row('c',100,'neutral',120)];
 const m=calculateRift(r,opts);close(m.total,1000);close(m.balance,0.3);close(m.low,-0.75);close(m.high,6/7);
 close(m.effective,1/(.36+.09+.01));assert.equal(m.pivotal,1);assert.equal(m.groups[0].share,.6);
 assert.equal(m.ready,false);assert.equal(m.flags.flips,false);
});
test('enough reports make sample-only flip and concentration conditions usable',()=>{
 const r=[];for(let i=0;i<4;i++){r.push(row('a'+i,150,'bullish',100),row('b'+i,75,'bearish',110),row('c'+i,25,'neutral',120));}
 const m=calculateRift(r,opts);assert.equal(m.ready,true);assert.equal(m.flags.flips,true);assert.equal(m.flags.concentrated,true);assert.equal(m.flags.fragile,true);
});
test('omitting an expiry aggregates its contracts; totals and baseline never change',()=>{
 const r=fixture();r.slice(0,6).forEach(x=>x.expDate+=86400*7);
 const a=calculateRift(r,opts),b=calculateRift(r,{...opts,grouping:'Expiry'});
 close(a.total,b.total);close(a.balance,b.balance);assert.equal(b.groups.length,2);assert.equal(b.groups[0].contracts,6);assert.equal(b.ready,false);
});
test('neutral and contradictory tags remain in denominator; CALL is never inferred bullish',()=>{
 const r=[row('a',100,'neutral'),{...row('b',200,'bullish',110),tags:['bullish','bearish']},{...row('c',300,'bullish',120),tags:[]}];
 const m=calculateRift(r,opts);assert.equal(m.bull,0);assert.equal(m.bear,0);assert.equal(m.other,600);assert.equal(m.balance,0);
});
test('identical IDs deduplicate but same-time separate IDs remain separate reports',()=>{
 const r=fixture(),a=calculateRift(r,opts);r.push({...r[0]});const b=calculateRift(r,opts);
 close(a.total,b.total);assert.equal(b.audit.duplicates,1);assert.equal(b.ready,true);
 r.push({...r[0],id:'another'});const c=calculateRift(r,opts);assert.equal(c.total,a.total+100);
});
test('conflicting IDs exclude the entire event and suppress flags in either order',()=>{
 const r=fixture();r.push({...r[0],costBasis:1000});const a=calculateRift(r,opts),b=calculateRift([...r].reverse(),opts);
 assert.equal(a.ready,false);assert.equal(a.audit.conflicts,1);close(a.total,b.total);close(a.balance,b.balance);
});
test('unidentified and invalid records suppress flags without inventing zero premiums',()=>{
 const r=fixture();delete r[0].id;assert.equal(calculateRift(r,opts).ready,false);
 const s=fixture();s[0].costBasis='100';const m=calculateRift(s,opts);assert.equal(m.audit.invalid,1);assert.equal(m.audit.accepted,11);assert.equal(m.ready,false);
});
test('milliseconds and seconds identify the same contracts and events',()=>{
 const r=fixture(),a=calculateRift(r,opts);r.forEach(x=>{x.timestamp*=1000;x.expDate*=1000;});const b=calculateRift(r,opts);
 close(a.total,b.total);assert.equal(a.contractCount,b.contractCount);assert.equal(a.latest,b.latest);
});
test('future records, mismatched tickers and non-finite amounts are invalid',()=>{
 for(const change of [{timestamp:sec+1},{ticker:'OTHER'},{costBasis:Infinity},{strike:NaN},{expDate:sec-3*86400}]){
 const r=fixture();Object.assign(r[0],change);const m=calculateRift(r,opts);assert.equal(m.audit.invalid,1);assert.equal(m.ready,false);}
});
test('outside-window records are counted separately; stale samples have no current flags',()=>{
 const r=fixture();r.push({...r[0],id:'old',timestamp:sec-8*86400});assert.equal(calculateRift(r,opts).audit.outside,1);
 r.forEach(x=>x.timestamp-=40*3600);const m=calculateRift(r,opts);assert.equal(m.stale,true);assert.equal(m.ready,false);
 assert.equal(calculateRift({error:'not entitled'},opts).latest,null);assert.equal(calculateRift([],opts).latest,null);
});
test('one group has an undefined omission result, never a fabricated zero',()=>{
 const r=fixture();r.forEach(x=>x.strike=100);const m=calculateRift(r,opts);
 assert.equal(m.groups.length,1);assert.equal(m.low,null);assert.equal(m.high,null);assert.equal(m.scenarios[0].balance,null);assert.equal(m.ready,false);
});
test('tied largest groups remain explicit and threshold transitions include neutral baseline',()=>{
 const r=[row('a',100,'bullish',100),row('b',100,'bearish',110),row('c',100,'neutral',120)];
 const m=calculateRift(r,opts);assert.equal(m.largest.length,3);assert.equal(m.pivotal,2);assert.equal(m.lead,0);assert.match(m.status,/SMALL SAMPLE/);
});
test('scaling premium and permuting records preserve balance, breadth and omission range',()=>{
 const r=fixture(),a=calculateRift(r,opts);r.reverse().forEach(x=>x.costBasis*=1e6);const b=calculateRift(r,opts);
 close(a.balance,b.balance);close(a.effective,b.effective);close(a.low,b.low);close(a.high,b.high);
});
test('malicious-looking IDs and labels stay data; presentation is escaped and serializable',()=>{
 const r=fixture();r[0].id='__proto__';r[0].expDateFormatted='<img src=x onerror=alert(1)>';
 const m=calculateRift(r,opts);assert.equal(m.audit.accepted,12);
 for(const theme of ['Ink','Paper'])for(const compact of [true,false]){
 const out=JSON.stringify(buildRiftOverlay(m,{theme,compact}));assert.ok(!out.includes('<img'));assert.ok(!out.includes('NaN'));assert.ok(!out.includes('Infinity'));assert.match(out,/&lt;img/);}
});
test('native adapter uses only included UOA and latest-bar-only scan conditions',async()=>{
 const adapter=await fs.readFile(new URL('../src/trendspider.js',import.meta.url),'utf8');const calls=[],signals=[];const input=(title,def)=>def;input.number=(title,def)=>def;
 const ctx={Date:{now:()=>now},input,current:{ticker:'TEST',assetType:'stock'},close:Array(80).fill(5),describe_indicator:()=>{},request:{unusual_options:async(...a)=>{calls.push(a);return fixture();}},register_signal:(s,n)=>signals.push({s,n}),paint_overlay:()=>{}};
 await vm.runInNewContext('(async()=>{'+engine+presentation+adapter+'})()',ctx);
 assert.equal(calls.length,1);assert.equal(signals.length,3);signals.forEach(({s})=>{assert.ok(s.slice(0,-1).every(x=>x===null));assert.ok([0,1].includes(s.at(-1)));});
});
test('unrelated malformed old records do not poison the requested window',()=>{
 const r=fixture(),before=calculateRift(r,opts);
 r.push({...row('old',100,'bullish'),timestamp:sec-8*86400,costBasis:'bad',type:null});
 const m=calculateRift(r,opts);assert.equal(m.audit.outside,1);assert.equal(m.audit.invalid,0);assert.equal(m.ready,true);close(m.balance,before.balance);
});
test('conflicting event IDs across window boundaries stay ambiguous, but old-only conflicts stay outside',()=>{
 const r=fixture();r.push({...r[0],timestamp:sec-8*86400});const m=calculateRift(r,opts);
 assert.equal(m.audit.outside,1);assert.equal(m.audit.conflicts,1);assert.equal(m.audit.accepted,11);assert.equal(m.ready,false);
 const s=fixture();s.push({...row('old',100,'bullish'),timestamp:sec-8*86400},{...row('old',300,'bearish'),timestamp:sec-9*86400});
 const n=calculateRift(s,opts);assert.equal(n.audit.conflicts,0);assert.equal(n.audit.outside,2);assert.equal(n.ready,true);
 const u=fixture();u.push({...u[0],costBasis:'bad'});const q=calculateRift(u,opts);assert.equal(q.audit.conflicts,1);assert.equal(q.audit.accepted,11);assert.equal(q.ready,false);
});
test('both layouts expose decisive omissions even when all five largest groups preserve the lead',()=>{
 const r=[];for(let i=0;i<5;i++)r.push(row('b'+i,150,'bullish',100+i),row('r'+i,150,'bearish',100+i));
 r.push(row('p1',150,'bullish',110),row('p2',150,'bullish',111),row('small-b',25,'bullish',120),row('small-r',75,'bearish',120));
 const m=calculateRift(r,opts);assert.equal(m.ready,true);close(m.balance,250/1900);assert.equal(m.pivotal,2);
 assert.ok(m.scenarios.slice(0,5).every(s=>s.lead===m.lead));
 for(const [compact,limit] of [[true,3],[false,5]]){
  const rows=riftDisplayRows(m,limit);assert.ok(rows.some(x=>x.changesLead));assert.ok(rows.some(x=>Math.abs(x.scenario.balance-m.low)<1e-12));assert.ok(rows.some(x=>Math.abs(x.scenario.balance-m.high)<1e-12));assert.ok(rows.some(x=>x.group.key===m.groups[0].key));
  const display=JSON.stringify(buildRiftOverlay(m,{compact}));assert.match(display,/LOW\*/);assert.match(display,/\+5.7 pp/);
 }
});
