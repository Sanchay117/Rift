describe_indicator('Rift - Options Flow Audit','price',{shortName:'RIFT'});
let riftUoa;
try {riftUoa=await request.unusual_options(current.ticker);} catch(riftErr){riftUoa={error:String(riftErr)};}
console.log('RIFT_UOA:'+JSON.stringify({ticker:current.ticker,assetType:current.assetType,asOf:Date.now(),data:riftUoa}));
paint_overlay('Rift audit',{position:'top_left',offset_x:48,offset_y:100,order:'above_all'},{width:'600px',backgroundColor:'#171e2a',color:'#edf2ff',rows:[{cells:[{text:'RIFT · Included-data check',fontSize:'20px',padding:'12px'}]},{cells:[{text:JSON.stringify({records:riftUoa?.length,error:riftUoa?.error,first:riftUoa?.[0]}),fontSize:'12px',padding:'12px'}]}]});
