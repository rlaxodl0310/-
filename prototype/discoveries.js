// Observe state changes; looking at a resource never grants ownership of it.
export function discoveryChanges(before,after){
 const changes=(after.known??[]).filter(x=>!(before.known??[]).includes(x)).map(name=>({kind:'information',name}));
 for(const item of after.inventory??[]){
  const previous=(before.inventory??[]).find(x=>x.id===item.id)?.quantity??0;
  if(item.quantity>previous)changes.push({kind:'item',name:item.name,quantity:item.quantity-previous});
 }
 return changes;
}
export function recordDiscoveries(before,after,action=''){
 const changes=discoveryChanges(before,after);
 after.discoveries??=[];
 for(const change of changes)after.discoveries.push({...change,action,day:after.day,phase:before.phase,location:before.phase!==after.phase?'activity':after.location});
 return changes;
}
