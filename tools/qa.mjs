import fs from 'node:fs/promises';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);const calculate=vm.runInNewContext(await fs.readFile(new URL('src/engine.js',root),'utf8')+'\ncalculateRift');
const results=[],models={},manifest=[];
for(const name of (await fs.readdir(new URL('data/',root))).filter(n=>/^[A-Z]+-raw.json$/.test(n))){
 const bytes=await fs.readFile(new URL('data/'+name,root));const f=JSON.parse(bytes);
 models[f.ticker]={};
 for(const grouping of ['Contract','Expiry']){
  const m=calculate(f.data,{...f,grouping,days:7,threshold:.1});
  assert.ok(m.latest!==null);assert.ok(Math.abs(m.bull+m.bear+m.other-m.total)<Math.max(1e-6,m.total*1e-12));
  assert.ok(m.scenarios.every(s=>s.balance===null||Math.abs(s.balance)<=1+1e-12));
  for(const g of m.groups){const remaining=f.data.filter(r=>grouping==='Contract'?String(r.type).toUpperCase()+'|'+r.strike+'|'+Math.floor((r.expDate>1e11?r.expDate/1000:r.expDate)/86400)!==g.type+'|'+g.strike+'|'+g.expiryDay:Math.floor((r.expDate>1e11?r.expDate/1000:r.expDate)/86400)!==g.expiryDay);const brute=calculate(remaining,{...f,grouping,days:7,threshold:.1});const scenario=m.scenarios.find(s=>s.key===g.key);if(scenario.balance!==null)assert.ok(Math.abs(brute.balance-scenario.balance)<1e-10);}
  models[f.ticker][grouping]=m;
  results.push({ticker:f.ticker,grouping,status:m.status,ready:m.ready,returned:m.audit.returned,accepted:m.audit.accepted,groups:m.groups.length,balance:m.balance,omissionRange:[m.low,m.high],pivotal:m.pivotal,topShare:m.groups[0]?.share,effective:m.effective,tagShare:m.tagShare,newestEvent:new Date(m.latest*1000).toISOString(),asOf:new Date(f.asOf).toISOString()});
 }
 manifest.push({file:name,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),records:f.data.length,capturedAt:new Date(f.asOf).toISOString()});
}
await fs.writeFile(new URL('review/validation.json',root),JSON.stringify({checkedOn:'2026-10-24',scope:'Provider-selected, potentially truncated unusual-options samples. Not whole-market flow.',results,manifest},null,2)+'\n');
await fs.writeFile(new URL('preview/models.json',root),JSON.stringify(models)+'\n');
console.table(results.map(r=>({ticker:r.ticker,unit:r.grouping,status:r.status,balance:(r.balance*100).toFixed(1),low:(r.omissionRange[0]*100).toFixed(1),high:(r.omissionRange[1]*100).toFixed(1)})));
