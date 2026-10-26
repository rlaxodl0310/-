import {campusBuildings} from './campus-buildings.js';
// Authored sample semester, not the university's official curriculum.
const lesson=(id,name,start,end,location,area,topic,choices)=>({id,name,start,end,location,area,topic,choices});
const general=()=>lesson('expression','이야기와 표현',570,660,'academic','classes','같은 장면도 바라보는 사람에 따라 의미가 달라질 수 있다는 이야기가 나온다.',[
 {id:'interpret',label:'작품 속 인물의 입장에서 장면을 해석해본다.',text:'정답을 고르기보다 인물이 무엇을 알고 있었는지부터 적었다. 같은 결말을 다르게 읽는 이유가 조금 선명해진다.'},
 {id:'listen',label:'다른 학생의 해석을 듣고 내 생각과 비교한다.',text:'내가 그냥 넘긴 장면을 다른 학생이 오래 이야기한다. 바로 반박하지 않고 내 메모 옆에 다른 해석을 적어둔다.'}]);
const chapel=()=>lesson('chapel','채플',570,630,'baekseok','chapel','여러 학과 학생들이 한 공간에 앉는다. 앞자리부터 안내에 따라 자리를 정리하고 예배가 시작된다.',[
 {id:'listen',label:'휴대폰을 넣고 진행되는 이야기에 귀를 기울인다.',text:'익숙한 학과 학생들만 있는 자리가 아니다. 강연에서 들은 문장 하나를 기억해두고 끝날 때까지 자리에 머문다.'},
 {id:'note',label:'이야기를 들으며 떠오르는 생각을 짧게 적는다.',text:'말을 그대로 옮기기보다 내가 받아들인 뜻을 몇 줄 적었다. 예배를 마치자 여러 학과 학생들이 함께 자리에서 일어난다.'}]);
const clinical=(id,name,location,area,start=570,end=660)=>lesson(id,name,start,end,location,area,'전공 수업',[]);
export const characterTimetables={
 taei:{
  1:[lesson('ensemble','보컬 앙상블',570,660,'arts','band','예술동 4층 구석 409호 합주실. 반주가 시작되자 보컬이 들어갈 자리를 맞춰본다. 혼자 부를 때와는 호흡을 쓰는 방법이 조금 다르다.',[
   {id:'blend',label:'다른 파트의 소리를 듣고 내 음량과 호흡을 맞춘다.',text:'힘을 더 주는 대신 반주의 빈 곳을 들었다. 후렴을 다시 맞추자 혼자 부를 때보다 소리가 자연스럽게 이어진다.'},
   {id:'phrase',label:'가사의 의미를 생각하며 프레이징을 바꿔본다.',text:'같은 음을 내더라도 문장이 끝나는 곳에서 호흡을 다르게 써봤다. 다음 반복에서는 반주와 어긋난 부분을 함께 짚는다.'}]),
   lesson('theory','응용 화성학',690,780,'arts','classes','강의실에서 짧은 코드 진행을 듣고 악보 옆에 메모한다. 익숙한 노래의 흐름과 연결되는 부분이 있다.',[
    {id:'apply',label:'작업 중인 자작곡의 진행과 비교해 적는다.',text:'내 데모에서 답답하게 들리던 구간을 떠올리며 코드 진행을 적었다. 나중에 직접 바꿔 들어볼 부분에 표시를 남긴다.'},
    {id:'practice',label:'예제를 한 번 더 풀며 진행을 귀로 확인한다.',text:'먼저 맞힌 답을 지우고 소리를 다시 들어봤다. 이유를 설명할 수 없는 부분을 질문 목록에 남긴다.'}])],
  2:[general(),lesson('vocal','전공 보컬 실기',690,780,'music','medium','중형 연습실에서 준비해온 곡을 부른다. 한 번 부른 뒤 호흡과 발음을 따로 짚어본다.',[
   {id:'breath',label:'호흡이 흔들린 구간을 나눠 다시 부른다.',text:'처음부터 끝까지 밀어붙이지 않고 문제가 생기는 한 구절만 반복했다. 다시 연결했을 때 달라진 점을 메모한다.'},
   {id:'delivery',label:'가사가 상대에게 어떻게 들리는지에 집중한다.',text:'기술적으로 맞히는 것과 이야기가 들리게 부르는 것은 조금 다르다. 발음과 강세를 바꿔 다시 불렀다.'}])],
  3:[chapel(),lesson('stage','무대 워크숍',660,750,'arts','musical','예술동 1층 큰 무대에서 입장과 마이크 동선을 맞춘다. 객석에서 보이는 모습도 돌아가며 확인한다.',[
   {id:'route',label:'노래하며 움직일 동선과 마이크 위치를 맞춘다.',text:'마이크 케이블과 다른 사람의 자리를 먼저 확인했다. 노래에 집중할 때도 잊지 않도록 움직임을 몇 번 반복한다.'},
   {id:'audience',label:'객석에서 동료의 무대를 보고 의견을 나눈다.',text:'무대 위에서는 몰랐던 시선의 흐름이 객석에서 보인다. 잘 보이는 순간과 놓치는 순간을 구체적으로 짚어 이야기했다.'}])]
 },
 yeogyeong:{1:[clinical('nursing','기본간호 실습','creative','nursing'),clinical('liberal','생활과 소통','academic','classes',690,780)],2:[general(),clinical('nursing2','간호학 전공 수업','creative','nursing',690,780)],3:[chapel(),clinical('nursing3','간호 실습','creative','nursing',660,750)]},
 seoyeon:{1:[clinical('dental','치위생학 전공 수업','sculpture','classes'),clinical('liberal','생활과 소통','academic','classes',690,780)],2:[general(),clinical('dental2','치위생학 전공 수업','sculpture','classes',690,780)],3:[chapel(),clinical('dental3','치위생학 전공 수업','sculpture','classes',660,750)]},
 soyul:{1:[clinical('dental','치위생학 전공 수업','sculpture','classes'),clinical('liberal','생활과 소통','academic','classes',690,780)],2:[general(),clinical('dental2','치위생학 전공 수업','sculpture','classes',690,780)],3:[chapel(),clinical('dental3','치위생학 전공 수업','sculpture','classes',660,750)]}
};
// Concrete room assignments for the prototype semester; legacy primary IDs remain valid.
for(const c of characterTimetables.yeogyeong[1])if(c.id==='liberal')c.area='room401';
characterTimetables.yeogyeong[2].find(c=>c.id==='nursing2').area='room504';
for(const id of ['seoyeon','soyul']){
 characterTimetables[id][1].find(c=>c.id==='liberal').area='room401';
 characterTimetables[id][2].find(c=>c.id==='dental2').area='room302';
 characterTimetables[id][3].find(c=>c.id==='dental3').area='room401';
}
export function schoolArea(s,person){return timetable(s,person).find(c=>s.clock.minute>=c.start-30&&s.clock.minute<c.end)?.area??null;}
export function roomUseLabel(s,location,area){
 const classes=['taei','yeogyeong','seoyeon','soyul'].flatMap(id=>timetable(s,id)).filter(c=>c.location===location&&c.area===area);
 return classes.some(c=>s.clock.minute>=c.start&&s.clock.minute<c.end)?'수업 중':classes.some(c=>s.clock.minute<c.start&&c.start-s.clock.minute<=15)?'수업 준비 중':'사용 상태 미확인';
}
export function schoolEnabled(s){return s.academics?.enabled===true;}
export function timetable(s,person='taei',day=s.day){return schoolEnabled(s)?(characterTimetables[person]?.[day]??[]).map(c=>({...c,key:`${day}:${person}:${c.id}`,day})):[];}
export function lessonStatus(s,c){const record=s.academics?.records?.[c.key];if(record)return record.status;const m=s.clock.minute;return m>=c.end?'absent':m>=c.start?'in-progress':'upcoming';}
export function nextLesson(s){return timetable(s).find(c=>!s.academics?.records?.[c.key]&&s.clock.minute<c.end)??null;}
export function classPlace(c){const b=campusBuildings[c.location],a=b?.areas?.find(a=>a.id===c.area);return `${b?.name??c.location}${a?' · '+(a.floor==='층 미확정'?'':a.floor+' ')+a.name:''}`;}
export function schoolTime(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
export function schoolLocation(s,person){const m=s.clock.minute;return timetable(s,person).find(c=>m>=c.start&&m<c.end)?.location??null;}
export function preparationLocation(s,person){return timetable(s,person).find(c=>s.clock.minute<c.start&&c.start-s.clock.minute<=30)?.location??null;}
export function studyingNow(s,person){return !!schoolLocation(s,person);}
export function classConflicts(s,duration){return timetable(s).filter(c=>!s.academics.records[c.key]&&s.clock.minute<c.end&&s.clock.minute+duration>c.start);}
export function recordMissedLessons(s,before,end){
 if(!schoolEnabled(s))return s;
 s.academics.npcAttendance??={};
 for(const id of ['yeogyeong','seoyeon','soyul'])for(const c of timetable(s,id))if(end>=c.end&&before<c.end&&!s.academics.npcAttendance[c.key])s.academics.npcAttendance[c.key]={status:'present',day:s.day,course:c.id,location:c.location};
 for(const c of timetable(s))if(end>=c.end&&!s.academics.records[c.key]){
  s.academics.records[c.key]={status:'absent',day:s.day,course:c.id,at:end};
  s.memory.push(`[${s.day}일차] ${c.name} 수업에 참석하지 못했다.`);
 }
 return s;
}
