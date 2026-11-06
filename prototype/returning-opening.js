// Story progress is saved separately from the simulation clock and registration draft.
export const returningOpening=[
 {speaker:'',text:'군휴학을 마치고 다시 돌아온 캠퍼스. 교문 앞에서 잠깐 걸음을 늦춘다. 가방 안쪽에 넣어둔 학생증이 손끝에 걸린다.'},
 {speaker:'',text:'어디선가 반주를 맞추는 소리가 들린다. 익숙한 길인데 지나가는 얼굴들은 낯설다. 이번에는 2학년 복학생으로 이 길을 걷게 된다.'},
 {speaker:'',text:'휴대폰을 꺼내 복학 처리 안내를 다시 확인한다. 그 아래에는 이번 학기 수강 계획을 확인하라는 안내가 남아 있다.'},
 {speaker:'김태이',text:'수업도 듣고, 작업도 이어가야지. 운동할 시간도 조금은 남겨두고. 일단 어떤 수업을 들을지부터 정해볼까.'}
];
export function returningOpeningView(s){const step=Math.max(0,Math.min(returningOpening.length-1,s.opening?.step??0));return {...returningOpening[step],step,total:returningOpening.length,last:step===returningOpening.length-1};}
export function progressReturningOpening(state){if(!state.academics?.registrationPending||state.opening?.done)throw new Error('이미 학교생활을 시작했습니다.');const s=structuredClone(state),v=returningOpeningView(s);s.opening={step:v.last?v.step:v.step+1,done:v.last};return s;}
export function initialReturningScreen(s){return s.academics?.registrationPending?(s.opening&&!s.opening.done?'opening':'enrollment'):'campus';}
