describe_indicator('Rift - Options Flow Stress Test','price',{shortName:'RIFT'});
const riftProbeTickers=['AAPL','TSLA','NVDA','JPM'];
for (const riftProbeTicker of riftProbeTickers) {
  let riftBatch;
  try {riftBatch=await request.unusual_options(riftProbeTicker);} catch(riftErr){riftBatch={error:String(riftErr)};}
  console.log('RIFT_BATCH:'+JSON.stringify({ticker:riftProbeTicker,assetType:'stock',asOf:Date.now(),data:riftBatch}));
}
paint_overlay('Rift audit',{position:'top_left',offset_x:48,offset_y:100},{backgroundColor:'#171e2a',color:'#edf2ff',rows:[{cells:[{text:'RIFT · Included-feed validation captured',padding:'12px'}]}]});
