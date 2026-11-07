// Optional visual punctuation. Reads existing outcomes; never rolls RNG or advances time.
export function eventCutscene(state,screen,beat={}){
 if(screen!=='personalEvent'||beat.kind!=='speech')return null;
 const r=state.personalEvents?.records?.[state.personalEvents?.active];
 if(!r||r.status!=='active'||r.stage!==1||r.day!==state.day||r.location!==state.location||!r.last)return null;
 if(r.person!=='taei'&&(beat.actor==='taei'||beat.who==='김태이'))return null;
 const id=r.eventId??state.personalEvents.active,first=r.choices?.[0],place=state.location;
 let index=-1,label='';
 if(id==='taei'&&first==='sound'&&['arts','music'].includes(place)){index=0;label='한 구절이 떠오른 순간';}
 if(id==='yeogyeong:2'&&['taste','fair'].includes(first)&&['hall','cafeteria','cafe'].includes(place)){index=1;label='엉뚱한 과자 맛 설명';}
 if(id==='seoyeon:2'&&first==='rock'&&r.game?.result==='tie'&&['hall','cafeteria','cafe'].includes(place)){index=2;label='가위바위보, 똑같은 주먹';}
 if(id==='soyul'&&first==='permission'&&place==='library'){index=3;label='조심스럽게 보여 준 한 장';}
 if(id==='iseo:2'&&['steady','rhythm','playful'].includes(first)&&place==='field'){index=4;label='흔들흔들, 한 발로 버티기';}
 if(id==='dogyeom'&&first==='pass'&&place==='outdoorCourt'){index=5;label='굴러온 공으로 시작한 인사';}
 return index<0?null:{id:`chibi:${id}`,index,x:(index%2)*100,y:Math.floor(index/2)*50,label};
}
