export function newGame() {
  return {version:1, phase:'afternoon', choice:null, minutes:0, location:'campus',
    known:[], messages:[], events:[], relations:{}, npcs:{
      yeogyeong:{name:'차여경',location:'봉사 준비실'},
      seoyeon:{name:'한서연',location:'봉사 준비실'},
      soyul:{name:'박소율',location:'봉사 준비실'}}, memory:[]};
}

export function act(state, choice) {
  if(state.phase !== 'afternoon') throw new Error('오늘의 오후 활동은 이미 완료했습니다.');
  if(!['rehearsal','volunteer','explore'].includes(choice)) throw new Error('알 수 없는 활동입니다.');
  const s=structuredClone(state);
  s.choice=choice; s.minutes={rehearsal:120,volunteer:180,explore:60}[choice];
  s.phase='evening';
  // The event resolves for its participants regardless of the player's route.
  s.events.push({id:'supplies',participants:['yeogyeong','seoyeon','soyul'],
    result:'포장 누락을 확인하고 남은 물품에 맞춰 진행 순서를 조정했다.'});
  s.relations['yeogyeong>soyul']={trust:1};
  s.relations['soyul>yeogyeong']={trust:1};
  s.relations['seoyeon>soyul']={trust:1};
  for(const npc of Object.values(s.npcs)) npc.location='귀가 중';
  if(choice==='volunteer'){
    s.known.push('봉사 준비실','물품 수량 불일치 사건');
    s.memory.push('물품을 다시 세는 일을 도와 포장 누락을 확인했다.');
    s.relations['yeogyeong>taei']={trust:1};
    s.messages.push({from:'봉사단 단체방',text:'오늘 정리까지 도와주셔서 감사합니다.'});
  } else {
    s.messages.push({from:'봉사단 단체방',text:'오늘 활동 마쳤습니다. 참여하신 분들 수고하셨어요.'});
    if(choice==='rehearsal'){
      s.known.push('연습실','장비 보관 위치');
      s.memory.push('합주를 마쳤다. 연습실 장비 보관 위치를 확인했다.');
    } else {
      s.known.push('학생회관','도서관으로 이어지는 길');
      s.memory.push('학생회관 주변을 걸으며 도서관으로 이어지는 길을 확인했다.');
    }
  }
  return s;
}

export function save(state){return JSON.stringify(state);}
export function restore(raw){
  const s=JSON.parse(raw);
  if(s?.version!==1 || !['afternoon','evening'].includes(s.phase) ||
    !Array.isArray(s.memory)||!Array.isArray(s.known)||!Array.isArray(s.messages)||
    !Array.isArray(s.events)||!s.npcs||!s.relations) throw new Error('지원하지 않는 저장 파일입니다.');
  return s;
}
