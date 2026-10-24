describe_indicator('Rift - Expiry Dependence Map', 'price', { shortName: 'RIFT' });
const riftProbeSchedule = await request.options_schedule(current.ticker);
const riftProbeChain = await request.options_data_for_all_expirations(current.ticker, 12, ['oi','gg','b','a'], 'all');
console.log('RIFT_CAPTURE:' + JSON.stringify({ticker:current.ticker,assetType:current.assetType,asOf:Date.now(),schedule:riftProbeSchedule,chain:riftProbeChain}));
paint_overlay('Rift audit', {position:'top_left',offset_x:48,offset_y:100,order:'above_all'}, {width:'450px',backgroundColor:'#171e2a',color:'#edf2ff',rows:[{cells:[{text:'RIFT · Native data check',fontSize:'20px',padding:'12px'}]},{cells:[{text:JSON.stringify({scheduleCount:riftProbeSchedule?.length,expiries:Object.keys(riftProbeChain?.resultByExpiration||{}).length,error:riftProbeChain?.error,quote:riftProbeChain?.underlyingSymbolQuote}),padding:'12px'}]}]});
