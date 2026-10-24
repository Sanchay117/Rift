/* Rift - Options Flow Stress Test | MIT | #TSBuild26
 * Audits the returned unusual-options sample. No forecast or historical backtest.
 */

/* Rift audits a returned unusual-options sample. It never infers trade direction
 * from CALL/PUT, links separate trades into orders, or reconstructs history. */
function riftNumber(riftValue) {
  return typeof riftValue === 'number' && Number.isFinite(riftValue);
}
function riftSeconds(riftValue) {
  if (!riftNumber(riftValue) || riftValue <= 0) return null;
  return riftValue > 1e11 ? riftValue / 1000 : riftValue;
}
function riftTag(riftTags) {
  const riftList = Array.isArray(riftTags) ? riftTags.filter(riftItem => typeof riftItem === 'string').map(riftItem => riftItem.toLowerCase().trim()) : [];
  const riftBull = riftList.includes('bullish');
  const riftBear = riftList.includes('bearish');
  const riftNeutral = riftList.includes('neutral');
  return riftBull && !riftBear && !riftNeutral ? 'bull' : riftBear && !riftBull && !riftNeutral ? 'bear' : 'other';
}
function riftClass(riftBalance, riftThreshold) {
  return riftBalance === null ? null : riftBalance >= riftThreshold ? 1 : riftBalance <= -riftThreshold ? -1 : 0;
}
function riftIdentity(riftRecord, riftTicker) {
  if (!riftRecord || typeof riftRecord !== 'object') return null;
  const riftStamp = riftSeconds(riftRecord.timestamp);
  const riftExpiry = riftSeconds(riftRecord.expDate);
  const riftExpiryDay = riftExpiry === null ? null : Math.floor(riftExpiry / 86400);
  const riftType = String(riftRecord.type || '').toUpperCase();
  const riftRecordTicker = String(riftRecord.ticker || riftTicker).toUpperCase().trim();
  const riftId = typeof riftRecord.id === 'string' && riftRecord.id.trim() ? riftRecord.id.trim() : null;
  const riftBucket = riftTag(riftRecord.tags);
  const riftFingerprint = JSON.stringify([riftStamp, riftExpiryDay, riftType,
    riftNumber(riftRecord.strike) ? riftRecord.strike : null,
    riftNumber(riftRecord.costBasis) ? riftRecord.costBasis : null, riftBucket, riftRecordTicker]);
  return { stamp: riftStamp, expiry: riftExpiry, expiryDay: riftExpiryDay, type: riftType,
    ticker: riftRecordTicker, id: riftId, bucket: riftBucket, fingerprint: riftFingerprint };
}
function calculateRift(riftRaw, riftOptions = {}) {
  const riftAsOf = riftOptions.asOf ?? Date.now();
  const riftTicker = String(riftOptions.ticker || '').toUpperCase().trim();
  const riftDays = Math.max(1, Math.min(30, Number(riftOptions.days) || 7));
  const riftThreshold = Math.max(0.01, Math.min(0.4, Number(riftOptions.threshold) || 0.1));
  const riftGrouping = riftOptions.grouping === 'Expiry' ? 'Expiry' : 'Contract';
  const riftBase = { ticker: riftTicker, asOf: riftAsOf, days: riftDays, threshold: riftThreshold, grouping: riftGrouping,
    ready: false, status: 'DATA UNAVAILABLE', message: '', groups: [], scenarios: [], latest: null,
    flags: { fragile: false, flips: false, concentrated: false }, audit: { returned: 0, accepted: 0, outside: 0, invalid: 0, duplicates: 0, conflicts: 0, unidentified: 0 } };
  if (!['stock','stock_otc','etf'].includes(riftOptions.assetType || 'stock')) return { ...riftBase, status: 'EQUITIES & ETFS ONLY', message: 'Use an underlying equity or ETF with unusual-options records.' };
  if (!Array.isArray(riftRaw)) return { ...riftBase, message: 'The included unusual-options request failed. No sample conclusion is available.' };
  const riftAudit = { ...riftBase.audit, returned: riftRaw.length };
  const riftStart = riftAsOf / 1000 - riftDays * 86400;
  const riftRows = [];
  const riftIds = {};
  // An unrelated old malformed row is outside this audit. But contradictory
  // copies of a current event ID can make even its window membership ambiguous.
  const riftIdentities = riftRaw.map(riftRecord => riftIdentity(riftRecord, riftTicker));
  const riftIdentityVersions = {};
  const riftCountedConflicts = {};
  for (const riftIdentityRow of riftIdentities) {
    if (riftIdentityRow?.id === null || !riftIdentityRow) continue;
    const riftIdentityKey = 'id:' + riftIdentityRow.id;
    if (!(riftIdentityKey in riftIdentityVersions)) riftIdentityVersions[riftIdentityKey] = { fingerprint: riftIdentityRow.fingerprint, conflict: false };
    else if (riftIdentityVersions[riftIdentityKey].fingerprint !== riftIdentityRow.fingerprint) riftIdentityVersions[riftIdentityKey].conflict = true;
  }
  for (let riftIndex = 0; riftIndex < riftRaw.length; riftIndex += 1) {
    const riftRecord = riftRaw[riftIndex];
    const riftIdentityRow = riftIdentities[riftIndex];
    if (!riftIdentityRow) { riftAudit.invalid += 1; continue; }
    const { stamp: riftStamp, expiry: riftExpiry, expiryDay: riftExpiryDay, type: riftType,
      ticker: riftRecordTicker, id: riftId, bucket: riftBucket, fingerprint: riftFingerprint } = riftIdentityRow;
    if (riftStamp === null || riftStamp < 946684800 || riftStamp > riftAsOf / 1000) { riftAudit.invalid += 1; continue; }
    if (riftStamp < riftStart) { riftAudit.outside += 1; continue; }
    if (riftId !== null && riftIdentityVersions['id:' + riftId].conflict) {
      if (!riftCountedConflicts['id:' + riftId]) { riftAudit.conflicts += 1; riftCountedConflicts['id:' + riftId] = true; }
      continue;
    }
    if (riftExpiry === null || riftExpiry < riftStamp - 86400 || riftRecordTicker !== riftTicker ||
      !['CALL','PUT'].includes(riftType) || !riftNumber(riftRecord.strike) || riftRecord.strike <= 0 ||
      !riftNumber(riftRecord.costBasis) || riftRecord.costBasis <= 0) { riftAudit.invalid += 1; continue; }
    const riftContract = riftTicker + '|' + riftExpiryDay + '|' + riftType + '|' + riftRecord.strike;
    const riftRow = { id: riftId, timestamp: riftStamp, expiryDay: riftExpiryDay, contract: riftContract,
      expiryLabel: String(riftRecord.expDateFormatted || ('expiry day ' + riftExpiryDay)),
      type: riftType, strike: riftRecord.strike, premium: riftRecord.costBasis, bucket: riftBucket, fingerprint: riftFingerprint, conflict: false };
    if (riftId !== null && ('id:' + riftId) in riftIds) {
      riftAudit.duplicates += 1;
      continue;
    }
    if (riftId !== null) riftIds['id:' + riftId] = riftRow;
    else riftAudit.unidentified += 1;
    riftRows.push(riftRow);
  }
  const riftAccepted = riftRows.filter(riftRow => !riftRow.conflict).sort((riftA, riftB) => riftA.timestamp - riftB.timestamp);
  riftAudit.accepted = riftAccepted.length;
  if (!riftAccepted.length) return { ...riftBase, audit: riftAudit, status: 'NO USABLE RECORDS', message: 'No usable returned events fall inside the requested window. Missing is not zero flow.' };
  const riftMap = {};
  const riftContracts = {};
  let riftTotal = 0, riftBull = 0, riftBear = 0, riftOther = 0;
  for (const riftRow of riftAccepted) {
    const riftKey = riftGrouping === 'Expiry' ? String(riftRow.expiryDay) : riftRow.contract;
    if (!(riftKey in riftMap)) riftMap[riftKey] = { key: riftKey, label: riftGrouping === 'Expiry' ? riftRow.expiryLabel : riftRow.strike + ' ' + (riftRow.type === 'CALL' ? 'C' : 'P') + ' · ' + riftRow.expiryLabel,
      expiryDay: riftRow.expiryDay, strike: riftGrouping === 'Expiry' ? null : riftRow.strike, type: riftGrouping === 'Expiry' ? null : riftRow.type,
      premium: 0, bull: 0, bear: 0, other: 0, records: 0, contracts: {} };
    const riftGroup = riftMap[riftKey];
    riftGroup.premium += riftRow.premium; riftGroup[riftRow.bucket] += riftRow.premium; riftGroup.records += 1;
    riftGroup.contracts[riftRow.contract] = true; riftContracts[riftRow.contract] = true;
    riftTotal += riftRow.premium;
    if (riftRow.bucket === 'bull') riftBull += riftRow.premium;
    else if (riftRow.bucket === 'bear') riftBear += riftRow.premium;
    else riftOther += riftRow.premium;
  }
  if (!Number.isFinite(riftTotal)) return { ...riftBase, audit: riftAudit, status: 'INVALID PREMIUM SCALE', message: 'Returned premium amounts cannot be summed safely.' };
  const riftGroups = Object.values(riftMap).map(riftGroup => ({ ...riftGroup, contracts: Object.keys(riftGroup.contracts).length,
    share: riftGroup.premium / riftTotal })).sort((riftA, riftB) => riftB.premium - riftA.premium || riftA.key.localeCompare(riftB.key));
  const riftBalance = (riftBull - riftBear) / riftTotal;
  const riftLead = riftClass(riftBalance, riftThreshold);
  const riftScenarios = riftGroups.map(riftGroup => {
    const riftRemaining = riftTotal - riftGroup.premium;
    const riftAfter = riftRemaining > Math.max(1e-8, riftTotal * 1e-12) ? ((riftBull - riftGroup.bull) - (riftBear - riftGroup.bear)) / riftRemaining : null;
    return { key: riftGroup.key, label: riftGroup.label, share: riftGroup.share, balance: riftAfter, lead: riftClass(riftAfter, riftThreshold) };
  });
  const riftValidScenarios = riftScenarios.filter(riftScenario => riftScenario.balance !== null);
  const riftLow = riftValidScenarios.length ? Math.min(...riftValidScenarios.map(riftScenario => riftScenario.balance)) : null;
  const riftHigh = riftValidScenarios.length ? Math.max(...riftValidScenarios.map(riftScenario => riftScenario.balance)) : null;
  const riftPivotal = riftScenarios.filter(riftScenario => riftScenario.lead !== null && riftScenario.lead !== riftLead);
  const riftFlips = riftLead !== 0 && riftScenarios.some(riftScenario => riftScenario.lead === -riftLead);
  const riftNewest = riftAccepted[riftAccepted.length - 1].timestamp;
  const riftAgeHours = (riftAsOf / 1000 - riftNewest) / 3600;
  const riftStale = riftAgeHours > 36;
  const riftTagShare = (riftBull + riftBear) / riftTotal;
  const riftReady = !riftStale && !riftAudit.invalid && !riftAudit.conflicts && !riftAudit.unidentified && riftAccepted.length >= 10 && riftGroups.length >= 3 && riftTagShare >= 0.5;
  const riftLargest = riftGroups.filter(riftGroup => Math.abs(riftGroup.premium - riftGroups[0].premium) <= riftTotal * 1e-12);
  const riftLargestScenarios = riftScenarios.filter(riftScenario => riftLargest.some(riftGroup => riftGroup.key === riftScenario.key));
  const riftStatus = riftStale ? 'OLDER SAMPLE · FLAGS OFF' : riftAudit.invalid || riftAudit.conflicts || riftAudit.unidentified ? 'DATA QUALITY LIMIT · FLAGS OFF'
    : riftAccepted.length < 10 || riftGroups.length < 3 ? 'SMALL SAMPLE · FLAGS OFF' : riftTagShare < 0.5 ? 'MOSTLY UNCLASSIFIED · FLAGS OFF'
    : riftLead === 0 ? riftPivotal.length ? 'NO BASE LEAD · OMISSION CREATES ONE' : 'NO MATERIAL TAGGED LEAD' : riftFlips ? 'TAGGED LEAD CAN FLIP' : riftPivotal.length ? 'TAGGED LEAD CAN DISSOLVE' : 'TAGGED LEAD HOLDS IN THIS TEST';
  return { ...riftBase, ready: riftReady, status: riftStatus,
    message: 'Remove each ' + riftGrouping.toLowerCase() + ' in turn. This tests concentration in the returned sample, not trader conviction or future prices.',
    audit: riftAudit, groups: riftGroups, scenarios: riftScenarios, largest: riftLargestScenarios, low: riftLow, high: riftHigh, pivotal: riftPivotal.length,
    total: riftTotal, bull: riftBull, bear: riftBear, other: riftOther, balance: riftBalance, lead: riftLead,
    effective: 1 / riftGroups.reduce((riftA, riftGroup) => riftA + riftGroup.share * riftGroup.share, 0),
    contractCount: Object.keys(riftContracts).length, latest: riftNewest, oldest: riftAccepted[0].timestamp,
    ageHours: riftAgeHours, stale: riftStale, tagShare: riftTagShare,
    flags: { fragile: riftReady && riftPivotal.length > 0, flips: riftReady && riftFlips, concentrated: riftReady && riftGroups[0].share >= 0.5 } };
}


const RIFT_PALETTES = Object.freeze({
  Ink: { bg:'#171d2a', card:'#20283a', text:'#f0f2fa', muted:'#aeb8cf', border:'#3a455e', bull:'#63d6bd', bear:'#f1a0aa', other:'#647089', accent:'#c6acff', grid:'#343e55' },
  Paper: { bg:'#f6f2eb', card:'#eae6df', text:'#29283c', muted:'#636276', border:'#c6bfd0', bull:'#087b68', bear:'#a34055', other:'#9295a4', accent:'#7042a5', grid:'#ded9e3' }
});
function riftEscape(riftText) {
  return String(riftText).replace(/[&<>"']/g,riftChar=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[riftChar]));
}
function riftPp(riftValue) {
  return riftValue === null || !Number.isFinite(riftValue) ? 'N/A' : (riftValue > 0 ? '+' : '') + (riftValue * 100).toFixed(1);
}
function riftMoney(riftValue) {
  return '$' + (riftValue >= 1e6 ? (riftValue / 1e6).toFixed(2)+'M' : riftValue >= 1e3 ? (riftValue / 1e3).toFixed(1)+'K' : riftValue.toFixed(0));
}
function riftLeadText(riftLead) {
  return riftLead === 1 ? 'Bullish-tagged lead' : riftLead === -1 ? 'Bearish-tagged lead' : 'No material tagged lead';
}
function riftDisplayRows(riftModel, riftLimit) {
  if (!riftModel.groups.length) return [];
  const riftLowCase = riftModel.scenarios.find(riftCase => riftCase.balance !== null && Math.abs(riftCase.balance - riftModel.low) < 1e-12);
  const riftHighCase = riftModel.scenarios.find(riftCase => riftCase.balance !== null && Math.abs(riftCase.balance - riftModel.high) < 1e-12);
  const riftKeys = [];
  const riftAdd = riftKey => { if (riftKey !== undefined && !riftKeys.includes(riftKey) && riftKeys.length < riftLimit) riftKeys.push(riftKey); };
  riftAdd(riftModel.groups[0].key);
  riftAdd(riftLowCase?.key);
  riftAdd(riftHighCase?.key);
  const riftInfluence = [...riftModel.scenarios].sort((riftA, riftB) =>
    (riftB.balance === null ? -1 : Math.abs(riftB.balance - riftModel.balance)) -
    (riftA.balance === null ? -1 : Math.abs(riftA.balance - riftModel.balance)) || riftB.share - riftA.share || riftA.key.localeCompare(riftB.key));
  riftInfluence.forEach(riftCase => riftAdd(riftCase.key));
  return riftKeys.map(riftKey => {
    const riftGroup = riftModel.groups.find(riftItem => riftItem.key === riftKey);
    const riftScenario = riftModel.scenarios.find(riftItem => riftItem.key === riftKey);
    const riftRoles = [];
    if (riftKey === riftModel.groups[0].key) riftRoles.push('TOP');
    if (riftKey === riftLowCase?.key) riftRoles.push('LOW');
    if (riftKey === riftHighCase?.key) riftRoles.push('HIGH');
    return { group: riftGroup, scenario: riftScenario, role: riftRoles.join('/') || 'IMPACT',
      changesLead: riftScenario.lead !== null && riftScenario.lead !== riftModel.lead };
  });
}
function buildRiftOverlay(riftModel,riftView={}) {
  const riftP=RIFT_PALETTES[riftView.theme]||RIFT_PALETTES.Ink;
  const riftCompact=riftView.compact===true;
  const riftWidth=riftCompact?590:690;
  const riftInner=riftWidth-24;
  const riftRows=[];
  const riftCell=(riftText,riftStyle={})=>({text:String(riftText),fontSize:'11px',lineHeight:'14px',padding:'3px 12px',...riftStyle});
  const riftRow=(riftText,riftStyle={})=>({cells:[riftCell(riftText,riftStyle)]});
  const riftColor=riftValue=>riftValue===null?riftP.muted:riftValue>0?riftP.bull:riftValue<0?riftP.bear:riftP.muted;
  riftRows.push({cells:[{padding:'7px 12px 2px',table:{width:'100%',rows:[{cells:[
    {text:'R I F T',fontFamily:'Georgia,serif',fontSize:'25px',lineHeight:'29px',padding:0,width:'120px'},
    {text:'OPTIONS FLOW STRESS TEST',fontSize:'11px',color:riftP.muted,textAlign:'right',verticalAlign:'middle',padding:0}
  ]}]}}]});
  riftRows.push(riftRow(riftEscape(riftModel.ticker)+' · '+riftEscape(riftModel.status),{color:riftModel.ready?riftP.accent:riftP.muted,fontWeight:'bold',paddingBottom:'4px'}));
  if(riftModel.latest===null){
    riftRows.push(riftRow(riftEscape(riftModel.message),{padding:'12px',fontSize:'12px'}));
  }else{
    const riftAge=riftModel.ageHours<1?Math.round(riftModel.ageHours*60)+'m':riftModel.ageHours.toFixed(1)+'h';
    riftRows.push(riftRow('Sample: '+riftModel.audit.accepted+' reports · '+riftModel.contractCount+' contracts · '+riftModel.days+'d filter · newest '+riftAge+' old',{fontSize:'10px',color:riftP.muted,paddingTop:0,paddingBottom:'5px'}));
    const riftHero=(riftLabel,riftValue,riftDetail,riftValueColor,riftColWidth)=>({width:riftColWidth,padding:'5px 8px',backgroundColor:riftP.card,table:{width:'100%',rows:[
      {cells:[{text:riftLabel,color:riftP.muted,fontSize:'10px',lineHeight:'13px',padding:0}]},
      {cells:[{text:riftValue,color:riftValueColor,fontSize:'26px',lineHeight:'31px',padding:0}]},
      {cells:[{text:riftDetail,color:riftP.muted,fontSize:'10px',lineHeight:'13px',padding:0}]}
    ]}});
    riftRows.push({cells:[{padding:'0 12px',table:{width:'100%',rows:[{cells:[
      riftHero('TAGGED PREMIUM BALANCE',riftPp(riftModel.balance)+' pp',riftLeadText(riftModel.lead),riftColor(riftModel.balance),'42%'),
      riftHero('AFTER OMITTING ANY ONE '+riftModel.grouping.toUpperCase(),riftPp(riftModel.low)+' … '+riftPp(riftModel.high),'Range across '+riftModel.scenarios.length+' separate omissions · pp',riftP.accent,'58%')
    ]}]}}]});
    const riftExtent=Math.min(100,Math.max(20,Math.ceil(Math.max(Math.abs(riftModel.low||0),Math.abs(riftModel.high||0),Math.abs(riftModel.balance),riftModel.threshold)*10)*10));
    const riftChart={type:'bar',width:riftInner+'px',height:'56px',data:{datasets:[
      {label:'One-group omission range',data:riftModel.low===null?[]:[{x:[riftModel.low*100,riftModel.high*100],y:0}],backgroundColor:riftP.accent,borderWidth:0,barThickness:10,grouped:false,order:1},
      {label:'Reported sample balance',data:[{x:[riftModel.balance*100-riftExtent/100,riftModel.balance*100+riftExtent/100],y:0}],backgroundColor:riftP.text,borderWidth:0,barThickness:20,grouped:false,order:0}
    ]},options:{indexAxis:'y',animation:false,responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{enabled:false}},scales:{
      x:{type:'linear',min:-riftExtent,max:riftExtent,grid:{color:riftP.grid},ticks:{color:riftP.muted,maxTicksLimit:5,font:{size:9}}},
      y:{type:'linear',min:-1,max:1,display:false}
    }}};
    riftRows.push({cells:[{padding:'0 12px',chart:riftChart}]});
    riftRows.push(riftRow('Violet: omission range · Tick: sample · Material lead threshold ±'+(riftModel.threshold*100).toFixed(0)+' pp',{fontSize:'9px',color:riftP.muted,paddingTop:0,paddingBottom:'4px'}));
    const riftMix=(riftTotal,riftBull,riftBear,riftOther)=>({width:'100%',borderCollapse:'collapse',rows:[{cells:[
      {text:'',width:(riftBull/riftTotal*100)+'%',height:'5px',padding:0,backgroundColor:riftP.bull},
      {text:'',width:(riftOther/riftTotal*100)+'%',height:'5px',padding:0,backgroundColor:riftP.other},
      {text:'',width:(riftBear/riftTotal*100)+'%',height:'5px',padding:0,backgroundColor:riftP.bear}
    ]}]});
    riftRows.push({cells:[{padding:'0 12px',table:riftMix(riftModel.total,riftModel.bull,riftModel.bear,riftModel.other)}]});
    riftRows.push(riftRow('Tagged premium: '+(riftModel.bull/riftModel.total*100).toFixed(0)+'% bullish · '+(riftModel.other/riftModel.total*100).toFixed(0)+'% other · '+(riftModel.bear/riftModel.total*100).toFixed(0)+'% bearish · '+riftMoney(riftModel.total)+' total',{fontSize:'10px',color:riftP.muted,paddingBottom:'5px'}));
    const riftTop=riftDisplayRows(riftModel,riftCompact?3:5);
    riftRows.push({cells:[{padding:'0 12px',table:{width:'100%',borderCollapse:'collapse',rows:[
      {cells:[riftCell('OMIT ONE '+riftModel.grouping.toUpperCase(),{fontSize:'9px',color:riftP.muted,padding:'3px 0',borderTop:'1px solid '+riftP.border,width:'45%'}),riftCell('PREMIUM SHARE',{fontSize:'9px',color:riftP.muted,padding:'3px 4px',borderTop:'1px solid '+riftP.border,textAlign:'right',width:'25%'}),riftCell('BALANCE WITHOUT',{fontSize:'9px',color:riftP.muted,padding:'3px 0',borderTop:'1px solid '+riftP.border,textAlign:'right',width:'30%'})]},
      ...riftTop.map(({group:riftGroup,scenario:riftScenario,role:riftRole,changesLead:riftChangesLead})=>{return{cells:[
        riftCell('<b>'+riftRole+(riftChangesLead?'*':'')+'</b> · '+riftEscape(riftGroup.label),{padding:'3px 0',fontSize:'11px'}),
        riftCell((riftGroup.share*100).toFixed(1)+'%',{padding:'3px 4px',textAlign:'right',color:riftP.muted}),
        riftCell(riftPp(riftScenario.balance)+' pp',{padding:'3px 0',textAlign:'right',color:riftColor(riftScenario.balance)})
      ]};})
    ]}}]});
    riftRows.push(riftRow('TOP: largest group · LOW/HIGH: range endpoints · * changes the material lead',{fontSize:'9px',color:riftP.muted,paddingTop:'1px',paddingBottom:'3px'}));
    riftRows.push(riftRow(riftModel.pivotal+' / '+riftModel.groups.length+' omissions change the material lead · '+riftModel.effective.toFixed(1)+' premium-equivalent '+(riftModel.grouping==='Expiry'?'expiries':'contracts'),{fontSize:'10px',color:riftP.muted,backgroundColor:riftP.card,padding:'5px 12px'}));
    riftRows.push(riftRow('Returned '+riftModel.audit.returned+' · outside window '+riftModel.audit.outside+' · invalid '+riftModel.audit.invalid+' · duplicate copies '+riftModel.audit.duplicates+' · conflicting IDs '+riftModel.audit.conflicts+' · no ID '+riftModel.audit.unidentified,{fontSize:'9px',color:riftP.muted,paddingBottom:0}));
  }
  riftRows.push(riftRow('Balance = (bullish-tagged − bearish-tagged premium) ÷ all accepted premium.<br/>Provider-selected sample; may truncate. Tags ≠ trader intent. No full chain, forecast or historical signals.',{fontSize:'9px',lineHeight:'12px',color:riftP.muted,paddingTop:'2px',paddingBottom:'6px'}));
  return{width:riftWidth+'px',backgroundColor:riftP.bg,color:riftP.text,fontFamily:'Arial,sans-serif',lineHeight:'14px',border:'1px solid '+riftP.border,borderRadius:'8px',borderSpacing:0,borderCollapse:'separate',rows:riftRows};
}


describe_indicator('Rift - Options Flow Stress Test','price',{shortName:'RIFT'});
const riftTheme=input('Palette','Ink',['Ink','Paper']);
const riftLayout=input('Layout','Compact',['Compact','Full']);
const riftGrouping=input('Omit one','Contract',['Contract','Expiry']);
const riftDays=input.number('Lookback calendar days',7,{min:1,max:30});
const riftThreshold=input.number('Material lead threshold pp',10,{min:1,max:40});
let riftResponse;
try {riftResponse=await request.unusual_options(current.ticker);} catch(riftRequestError){riftResponse={error:String(riftRequestError)};}
const riftModel=calculateRift(riftResponse,{ticker:current.ticker,assetType:current.assetType,asOf:Date.now(),days:riftDays,threshold:riftThreshold/100,grouping:riftGrouping});
for(const riftCondition of [
  ['Sample lead changes when one group is omitted',riftModel.flags.fragile],
  ['Sample tagged balance flips when one group is omitted',riftModel.flags.flips],
  ['One group holds at least half the sample premium',riftModel.flags.concentrated]
]){
  const riftSignal=Array(close.length).fill(null);
  if(riftSignal.length)riftSignal[riftSignal.length-1]=riftModel.ready?(riftCondition[1]?1:0):null;
  register_signal(riftSignal,riftCondition[0]);
}
paint_overlay('Rift audit',{position:'top_left',offset_x:36,offset_y:88,order:'above_all'},buildRiftOverlay(riftModel,{theme:riftTheme,compact:riftLayout==='Compact'}));
