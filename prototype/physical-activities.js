// Optional public activities: real action state, saved randomness and no mandatory cast.
const physicalChoice=(id,label,fact,reply)=>({id,label,fact,reply});
export const physicalActivityDefinitions={
 'basketball-open':{title:'농구 3회 공격 챌린지',days:[1,2,3],day:1,physical:true,route:'basketball',duration:60,venue:{location:'gym',area:'court',label:'체육관 2층 201호 · 실내 코트'},onsite:'코트에서 부족한 인원을 찾는다. 준비 운동을 하고 끼어볼까?',intro:'공이 바닥에 튀는 소리가 울린다. 연습 중인 학생들이 코트 한쪽을 내준다. “같이 해요? 공격 세 번씩 번갈아 해보려고요.” 공을 건네받고 먼저 몸을 푼다.',stages:[
 {name:'몸풀기와 역할',prompt:'코트 가장자리에 가방을 놓는다. 준비 운동 뒤 어떤 움직임을 먼저 맞춰볼까?',choices:[physicalChoice('footwork','발목을 풀고 짧은 방향 전환부터 해본다.','농구 방향 전환 연습','발끝으로 바닥을 밀며 방향을 바꾼다. 수비를 앞에 두고도 급히 몸을 틀지 않도록 간격을 잡았다.'),physicalChoice('passing','짝과 패스를 주고받으며 움직임을 맞춘다.','농구 짝 패스 연습','바운드 패스를 보내고 빈자리로 옮겨본다. 처음에는 엇갈리던 손과 공이 조금씩 같은 지점에서 만난다.')]},
 {name:'세 번의 공격',prompt:'수비의 위치를 보고 공격 방법을 고른다.',choices:[physicalChoice('drive','수비의 옆 공간으로 드리블해 들어간다.','농구 돌파 시도',''),physicalChoice('pass','빈자리로 움직이는 짝에게 패스를 보낸다.','농구 협력 공격',''),physicalChoice('shoot','발을 멈추고 중거리 슛을 던진다.','농구 중거리 슛 시도','')]},
 {name:'마지막 연습과 정리',prompt:'세 번의 공격을 마쳤다. 바로 흩어지기 전에 무엇을 해볼까?',choices:[physicalChoice('retry','잘 안 맞았던 동작을 천천히 다시 해본다.','농구 동작 재연습','속도를 낮춰 같은 움직임을 반복한다. 골을 넣는 것보다 공을 받을 위치와 발을 멈추는 지점을 확인했다.'),physicalChoice('cool','공을 정리하고 함께 스트레칭한다.','실내 코트 공 반납 위치','공을 바구니로 돌려놓고 종아리와 어깨를 푼다. 땀이 식기 전에 겉옷을 챙긴다.')]}
 ]},
 'cooking-open':{title:'한 냄비 조리 체험',days:[1,2,3],day:1,physical:true,route:'cooking',duration:45,venue:{location:'cafeteria',area:'kitchen',label:'외식관 2층 201호 · 조리실습실'},onsite:'실습대에서 빈 앞치마를 건넨다. 한 냄비 조리에 참여해볼까?',intro:'환풍기 소리 사이로 도마 두드리는 소리가 들린다. 공개 체험 담당자가 손 씻는 곳과 빈 실습대를 가리킨다. 제공된 채소와 육수로 짝과 함께 작은 냄비 하나를 완성하는 시간이다.',stages:[
 {name:'손질과 분담',prompt:'손을 씻고 앞치마를 맨다. 짝과 도구를 나눈 뒤 채소부터 손질한다.',choices:[physicalChoice('even','천천히 크기를 맞춰 썰고 짝에게 육수 계량을 맡긴다.','조리 체험 균일한 채소 손질','채소를 비슷한 크기로 맞춘다. 짝이 계량한 육수를 실습대 끝에 놓아 손질한 재료와 섞이지 않게 했다.'),physicalChoice('batch','먼저 익힐 단단한 채소와 나중에 넣을 채소를 나눈다.','조리 체험 재료 투입 순서','감자와 잎채소를 서로 다른 그릇에 나눈다. 짝과 먼저 넣을 재료를 확인한 뒤 도마를 치웠다.')]},
 {name:'냄비 앞에서',prompt:'육수가 끓기 시작한다. 옆에서 다른 조의 냄비도 보글거린다. 불과 재료를 어떻게 다룰까?',choices:[physicalChoice('gentle','불을 낮추고 채소를 순서대로 넣어 저어준다.','조리 체험 약불 조절',''),physicalChoice('quick','단단한 채소부터 넣고 잠깐 불을 올린 뒤 다시 낮춘다.','조리 체험 끓는점 확인','')]},
 {name:'맛을 보고 마무리',prompt:'담당자와 충분히 익었는지 확인한다. 작은 접시에 덜어 맛을 본 뒤 마지막으로 손본다.',choices:[physicalChoice('dilute','육수를 조금 보태 간을 부드럽게 맞춘다.','조리 체험 간 조절',''),physicalChoice('reduce','약불에서 조금 더 졸여 맛을 모은다.','조리 체험 농도 조절',''),physicalChoice('serve','지금 맛을 살려 담고 조리대를 함께 닦는다.','조리실습실 공동 정리 순서','')]}
 ]},
 'carry-open':{title:'봉사 물품 운반 릴레이',days:[1,2,3],day:1,physical:true,route:'carryRelay',duration:60,venue:{location:'hall',area:'meeting',label:'자유관 2층 204호 · 공용 회의실'},onsite:'문 앞에 전달할 상자가 쌓여 있다. 운반 조에 합류해볼까?',intro:'공용 회의실 한쪽에 봉사 준비용 종이컵과 수건 상자가 쌓여 있다. 운반 조가 회의실 안쪽 보관대로 옮길 차례다. “가벼워 보여도 높이 쌓으면 앞이 안 보여요.” 먼저 통로와 상자 크기를 확인한다.',stages:[
 {name:'짐과 손 나누기',prompt:'상자마다 부피가 다르다. 같이 옮길 학생과 역할을 정한다.',choices:[physicalChoice('pair','큰 상자는 둘이 들고 발을 맞춘다.','상자 공동 운반 신호','상자 양옆을 잡고 들기 전에 셋을 센다. 한쪽이 먼저 움직이지 않도록 내려놓을 신호도 맞췄다.'),physicalChoice('solo','시야를 가리지 않게 한 상자씩 여러 번 나른다.','상자 단독 운반 시야 확보','상자를 겹치지 않고 한 개만 들었다. 횟수는 늘어도 발밑을 볼 수 있는 높이를 유지한다.')]},
 {name:'통로 지나기',prompt:'회의실 안쪽 보관대로 이동한다. 어느 쪽으로 돌까?',choices:[physicalChoice('clear','잠시 내려놓고 먼저 통로의 의자와 빈 상자를 치운다.','물품 운반 통로 확보',''),physicalChoice('edge','벽 쪽 빈 공간을 따라 천천히 돌아간다.','물품 운반 벽면 동선','')]},
 {name:'적재와 인수 확인',prompt:'운반한 상자를 보관대 앞에 내려놓았다. 쌓는 방식과 수량을 확인한다.',choices:[physicalChoice('stack','무거운 상자를 아래에 놓고 라벨이 보이게 쌓는다.','물품 보관 적재 순서','무거운 묶음을 아래로 옮긴 뒤 상자 모서리를 맞춘다. 위를 가볍게 눌러 흔들리지 않는지 함께 확인했다.'),physicalChoice('count','상자를 낮게 펼쳐놓고 수량과 전달 목록을 대조한다.','물품 운반 인수 수량 대조','통로를 막지 않는 선에서 상자를 낮게 나눈다. 전달한 사람이 읽는 수량을 받는 사람이 목록에 표시했다.')]}
 ]}
};
function physicalRoll(record){record.actionState.rng=(Math.imul(record.actionState.rng,1664525)+1013904223)>>>0;return record.actionState.rng/4294967296;}
export function preparePhysicalActivity(record,seed){
 record.actionState={rng:seed>>>0,round:0,scored:0,stamina:3,teamwork:0,plays:[]};
 if(record.postId==='cooking-open'){record.actionState.salt=physicalRoll(record)<.5?'light':'strong';record.actionState.texture='firm';}
 if(record.postId==='carry-open')record.actionState.obstacle=physicalRoll(record)<.5?'chair':'passing';
}
export function physicalActivityStage(record,stage){
 if(!record.actionState||record.step!==1)return stage;
 const a=record.actionState;
 if(record.postId==='basketball-open')return {...stage,prompt:`${a.round+1}/3번째 공격 · 성공 ${a.scored}회 · 여력 ${a.stamina}/3. ${{close:'수비가 가까이 붙어 슛 공간이 좁다. 짝은 옆으로 빠지고 있다.',lane:'수비가 골밑으로 들어갈 길을 막고 있다. 앞쪽에 잠깐 슛 공간이 난다.',help:'수비가 패스 길목 쪽으로 몸을 틀었다. 반대편에 빈 공간이 보인다.'}[a.defense]}`};
 if(record.postId==='cooking-open')return {...stage,prompt:`육수가 끓기 시작한다. 짝이 계량 스푼을 내려놓는다. “아까 한 숟갈 떠봤는데 ${a.salt==='strong'?'간이 좀 센 것':'간은 약한 것'} 같아요.” 불과 재료를 어떻게 다룰까?`};
 return {...stage,prompt:a.obstacle==='chair'?'옮길 길 중간에 빈 의자가 튀어나와 있다. 짐을 든 채 바로 지나기에는 폭이 좁다.':'다른 조가 빈 상자를 들고 마주 온다. 함께 통로를 쓸 수 있도록 움직임을 정해야 한다.'};
}
function newDefense(record){return ['close','lane','help'][Math.floor(physicalRoll(record)*3)];}
export function performPhysicalAction(record,choice){
 const a=record.actionState,step=record.step,id=record.postId;
 let text=null,minutes=step===0?10:step===1?(id==='cooking-open'?25:id==='carry-open'?35:30):id==='cooking-open'?10:id==='carry-open'?15:20,advance=true;
 if(id==='basketball-open'){
  if(step===0){a.preparation=choice;a.defense=newDefense(record);}
  if(step===1){
   const advantage=(choice==='pass'&&a.defense==='close')||(choice==='shoot'&&a.defense==='lane')||(choice==='drive'&&a.defense==='help');
   const chance=Math.max(.15,Math.min(.92,.35+(advantage ? .35 : 0)+(a.preparation==='passing'&&choice==='pass' ? .16 : 0)+(a.preparation==='footwork'&&choice==='drive' ? .13 : 0)-(3-a.stamina)*.06));
   const success=physicalRoll(record)<chance;a.round++;a.scored+=success?1:0;if(choice==='drive')a.stamina=Math.max(0,a.stamina-1);if(choice==='pass')a.teamwork++;
   a.plays.push({choice,defense:a.defense,success});text=({drive:'공을 낮게 튀기며 수비 옆을 파고든다.',pass:'짝이 움직이는 쪽으로 공을 밀어 보내고 옆 공간으로 빠진다.',shoot:'발을 멈추고 팔을 뻗어 공을 던진다.'}[choice])+' '+(success?(choice==='pass'?'짝이 공을 받아 골밑에서 마무리한다. 돌아오는 길에 손바닥을 가볍게 마주친다.':'공이 림 안으로 떨어진다. 짝이 공을 받아 다시 건네준다.'):(choice==='pass'?'공을 받는 타이밍이 어긋나 바깥으로 튄다. 손을 들어 자기 신호가 늦었다고 알린다.':'공이 림을 맞고 튕겨 나온다. 숨을 고르고 다음 공격 위치로 돌아간다.'));
   advance=a.round===3;minutes=advance?30:0;if(!advance)a.defense=newDefense(record);
  }
 }
 if(id==='cooking-open'){
  if(step===0)a.preparation=choice;
  if(step===1){a.texture=choice==='gentle'?'soft':a.preparation==='batch'?'soft':'uneven';text=choice==='gentle'?'불을 낮추고 냄비 바닥을 따라 천천히 젓는다. 끓어 넘치던 기포가 작아지고 채소가 고르게 부드러워진다.':a.texture==='soft'?'단단한 채소가 먼저 익은 뒤 잎채소를 넣는다. 끓는 모습을 보고 불을 낮춰 형태가 무너지지 않게 한다.':'한꺼번에 넣은 채소 중 작은 조각부터 풀어진다. 불을 낮추고 덜 익은 조각을 확인하며 조금 더 기다렸다.';}
  if(step===2){a.finish=choice;a.balanced=(a.salt==='strong'&&choice==='dilute')||(a.salt==='light'&&choice==='reduce');text=choice==='dilute'?(a.salt==='strong'?'육수를 조금씩 더해 다시 맛본다. 짝도 한 숟갈 떠보고 고개를 끄덕인다. 센 간이 한결 누그러졌다.':'육수를 더하니 맛이 예상보다 연해졌다. 짝과 원래 간을 메모하고 작은 그릇에 나눠 담는다.'):choice==='reduce'?(a.salt==='light'?'뚜껑을 열고 조금 더 졸인다. 싱겁던 국물에 맛이 모인다. 짝이 불을 끄고 그릇을 가져온다.':'조금 더 졸이자 간이 더 또렷해졌다. 다음에는 맛을 먼저 보고 불을 정하자고 이야기하며 나눠 담는다.'):'지금의 맛을 작은 그릇에 나눠 담는다. 손질할 때 나온 껍질을 모으고 도마와 실습대를 씻는다. 서로 맡은 일이 끝났는지 확인했다.';}
 }
 if(id==='carry-open'){
  if(step===0)a.method=choice;
  if(step===1){a.route=choice;a.stops=choice==='clear'?1:a.obstacle==='chair'?2:1;text=choice==='clear'?'상자를 안전한 곳에 내려놓고 의자와 빈 상자를 옆으로 모은다. 마주 오는 조가 지나간 뒤, 비워진 통로로 다시 들어간다.':a.obstacle==='chair'?'벽 쪽으로 돌았지만 상자 모서리가 의자에 닿을 듯하다. 멈춰서 한 번 내려놓고 의자 위치를 고친 뒤 다시 옮겼다.':'마주 오는 조를 보고 벽 쪽에서 기다린다. 서로 지나갈 순서를 확인한 뒤, 발을 맞춰 천천히 보관대로 들어간다.';if(a.method==='pair')text+=' “지금 내려요.” 처음 맞춘 신호에 둘이 동시에 무릎을 굽힌다.';}
  if(step===2)a.finish=choice;
 }
 return {text,minutes,advance};
}
export function physicalActivityOutcome(record){
 const a=record.actionState;
 if(record.postId==='basketball-open')return `세 번의 공격 중 ${a.scored}회 득점에 성공했다. ${a.teamwork?'패스로 짝과 공격을 이어간 경험이 남았다.':'직접 공을 다루며 수비와의 간격을 익혔다.'} ${record.choices.at(-1)?.id==='retry'?'어긋난 동작을 다시 연습했다.':'공을 반납하고 정리 운동을 마쳤다.'}`;
 if(record.postId==='cooking-open')return `짝과 한 냄비를 완성하고 조리대를 정리했다. ${a.texture==='soft'?'채소가 고르게 익었다.':'채소 크기와 투입 순서를 다음에 더 맞춰보기로 했다.'} ${a.balanced?'맛을 본 정보에 맞춰 간을 조절했다.':'완성한 맛과 손볼 점을 함께 기록했다.'}`;
 return `${a.method==='pair'?'둘이 신호를 맞춰':'시야를 확보하며 한 상자씩'} 물품을 보관대로 옮겼다. ${a.route==='clear'?'통로를 먼저 비워 이동했다.':`이동 중 ${a.stops}번 멈춰 통행을 확인했다.`} ${a.finish==='count'?'전달 수량을 목록과 맞췄다.':'무거운 상자부터 안정적으로 쌓았다.'}`;
}
