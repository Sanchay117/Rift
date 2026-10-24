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
    riftRows.push(riftRow(riftModel.audit.accepted+' reports · '+riftModel.contractCount+' contracts · '+riftModel.days+'d lookback · newest event '+riftAge+' old',{fontSize:'10px',color:riftP.muted,paddingTop:0,paddingBottom:'5px'}));
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
    const riftTop=riftModel.groups.slice(0,riftCompact?3:5);
    riftRows.push({cells:[{padding:'0 12px',table:{width:'100%',borderCollapse:'collapse',rows:[
      {cells:[riftCell('OMIT ONE '+riftModel.grouping.toUpperCase(),{fontSize:'9px',color:riftP.muted,padding:'3px 0',borderTop:'1px solid '+riftP.border,width:'45%'}),riftCell('PREMIUM SHARE',{fontSize:'9px',color:riftP.muted,padding:'3px 4px',borderTop:'1px solid '+riftP.border,textAlign:'right',width:'25%'}),riftCell('BALANCE WITHOUT',{fontSize:'9px',color:riftP.muted,padding:'3px 0',borderTop:'1px solid '+riftP.border,textAlign:'right',width:'30%'})]},
      ...riftTop.map(riftGroup=>{const riftScenario=riftModel.scenarios.find(riftItem=>riftItem.key===riftGroup.key);return{cells:[
        riftCell(riftEscape(riftGroup.label),{padding:'3px 0',fontSize:'11px'}),
        riftCell((riftGroup.share*100).toFixed(1)+'%',{padding:'3px 4px',textAlign:'right',color:riftP.muted}),
        riftCell(riftPp(riftScenario.balance)+' pp',{padding:'3px 0',textAlign:'right',color:riftColor(riftScenario.balance)})
      ]};})
    ]}}]});
    riftRows.push(riftRow(riftModel.pivotal+' / '+riftModel.groups.length+' omissions change the material lead · '+riftModel.effective.toFixed(1)+' premium-equivalent '+(riftModel.grouping==='Expiry'?'expiries':'contracts'),{fontSize:'10px',color:riftP.muted,backgroundColor:riftP.card,padding:'5px 12px'}));
    riftRows.push(riftRow('Returned '+riftModel.audit.returned+' · outside window '+riftModel.audit.outside+' · invalid '+riftModel.audit.invalid+' · duplicate IDs '+riftModel.audit.duplicates+' · conflicts '+riftModel.audit.conflicts+' · no ID '+riftModel.audit.unidentified,{fontSize:'9px',color:riftP.muted,paddingBottom:0}));
  }
  riftRows.push(riftRow('Balance = (bullish-tagged − bearish-tagged premium) ÷ all accepted premium.<br/>Provider-selected sample; may truncate. Tags ≠ trader intent. No full chain, forecast or historical signals.',{fontSize:'9px',lineHeight:'12px',color:riftP.muted,paddingTop:'2px',paddingBottom:'6px'}));
  return{width:riftWidth+'px',backgroundColor:riftP.bg,color:riftP.text,fontFamily:'Arial,sans-serif',lineHeight:'14px',border:'1px solid '+riftP.border,borderRadius:'8px',borderSpacing:0,borderCollapse:'separate',rows:riftRows};
}
