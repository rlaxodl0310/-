export function eventKey(event){return `${event.stage??'campus'}:${event.day}:${event.id}`;}
export function scheduledEvent(s,id){return s.events.findLast(e=>e.id===id&&(e.kind??'scheduled')==='scheduled')??null;}
export function learnEvent(s,event,source){
 s.eventState??={flags:{},plans:{},knowledge:{}};
 s.eventState.knowledge??={};
 s.eventState.knowledge[eventKey(event)]={source,day:s.day,phase:s.phase};
 return s;
}
export function readMessages(state){
 const s=structuredClone(state);
 for(const message of s.messages){
  message.read=true;
  if(message.eventKey){const event=s.events.find(e=>eventKey(e)===message.eventKey);if(event&&!s.eventState?.knowledge?.[eventKey(event)]){learnEvent(s,event,'message');s.memory.push(`[${s.day}일차] 메시지로 알게 됨: ${event.result}`);}}
 }
 return s;
}
export function photoReport(s,id){
 const event=scheduledEvent(s,'photo-selection');
 if(!event)return null;
 if(event.outcome==='practical')return {
  seoyeon:'소율이랑 여경이가 사진은 골랐대요. 먼저 형식 맞추고, 설명은 각자 더 써보기로 했나 봐요.',
  yeogyeong:'소율이가 사진을 보내줘서 같이 정리했어요. 수량이랑 크기부터 맞췄고요. 설명 문구는 아직 각자 보고 있어요.',
  soyul:'여경이랑 사진은 골랐어요. 크기 맞는 걸 먼저 고르다 보니까… 제가 넣고 싶었던 건 설명을 좀 더 생각해보려고요.'
 }[id];
 if(event.outcome==='separate')return {
  seoyeon:'사진은 각자 맡은 쪽부터 정리하기로 했대요. 둘이 중요하게 보는 게 좀 달랐나 봐요.',
  yeogyeong:'사진 정리했어요. 소율이랑 기준이 좀 달라서, 일단 각자 고른 걸 따로 가져오기로 했고요.',
  soyul:'여경이랑 보고 있었는데… 저는 남기고 싶은 사진이 따로 있어서요. 각자 고른 것도 가져오기로 했어요.'
 }[id];
 return {
  seoyeon:'소율이 여경이랑 사진 정리했대요. 둘이 내일 전시 구성을 같이 정했더라고요.',
  yeogyeong:'소율이가 사진을 보내줘서 같이 골랐어요. 어떤 사진인지 얘기 듣고 나니까 순서도 정해지더라고요.',
  soyul:'여경이랑 사진 골랐어요. 처음에는 뭘 말해야 할지 몰랐는데, 같이 보니까 이야기 잘 되더라.'
 }[id];
}

export function showcaseReport(s,id){
 const event=scheduledEvent(s,'campus-showcase');if(!event)return null;
 const opening={yeogyeong:'전시 준비는 마쳤어요. ',soyul:'사진은 붙였어요. ',seoyeon:'준비 마치고 돌아왔어요. '}[id]??'';
 return opening+({'joint-display':'사진마다 고른 이유도 써서 같이 배치했어요. 처음 생각한 것보다 이야기가 더 잘 보이더라고요.','practical-display':'우선 크기랑 동선부터 맞췄어요. 설명은 다음에 더 써보기로 했고요.','separate-display':'각자 맡은 쪽을 따로 꾸몄어요. 보는 기준이 달라서 아직 더 이야기해야 할 것 같아요.','unfinished-caption':'사진은 골랐는데 설명 몇 군데는 비워뒀어요. 다음에 조금 더 이야기해보려고요.'}[event.outcome]??event.result);
}
