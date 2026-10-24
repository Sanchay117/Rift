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
