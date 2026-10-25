// Tested content examples for later chapters, not an outbreak date or playable survival chapter.
// They use exactly the same rule contract as campus events.
const tiredPerson=s=>Object.keys(s.npcs).find(id=>(s.npcs[id].fatigue??0)>=80&&!s.eventState.flags.restRequested?.[id]);
export const survivalEventExamples=[
 {id:(s,c)=>'watch-change:'+c.shift,kind:'scheduled',stages:['outbreak','survival'],trigger:'shift-end',
  when:(s,c)=>!!c.shift,
  participants:(s,c)=>c.watchers??[],
  effect:(s,c)=>{s.eventState.flags.lastWatchShift=c.shift;return {outcome:'handover',result:'경계 교대 시간이 되어 참여 인원끼리 발견한 소리와 이동 흔적을 인계했다.'};}},
 {id:s=>'rest-request:'+tiredPerson(s),kind:'conditional',stages:['outbreak','survival'],trigger:'phase-start',
  when:s=>!!tiredPerson(s),participants:s=>[tiredPerson(s)],
  effect:s=>{const id=tiredPerson(s);s.eventState.flags.restRequested??={};s.eventState.flags.restRequested[id]=true;return {outcome:'coverage-requested',result:'피로가 쌓인 생존자가 이번 경계를 대신 맡아줄 수 있는지 동료에게 물었다.'};}},
 {id:(s,c)=>'blocked-passage:'+c.location,kind:'situational',stages:['outbreak','survival'],trigger:'move',
  when:(s,c)=>c.blocked===true&&!!c.location&&c.presentIds?.length>0,
  participants:(s,c)=>c.presentIds,
  effect:(s,c)=>{const fact='봉쇄된 통로: '+c.location;if(!s.known.includes(fact))s.known.push(fact);return {outcome:'detour-needed',result:'이동 중이던 인원들이 막힌 통로를 발견하고 다른 길을 살피기 시작했다.'};}}
];
