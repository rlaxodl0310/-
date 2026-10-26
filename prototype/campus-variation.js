// Day plans are sampled once, stored, and read without rerolling on visits.
export function prepareCampusVariation(s){
 if(!s.academics?.enabled)return s;
 s.campusVariation??={seed:(Math.floor(Math.random()*4294967295)||1),plans:{}};
 if(s.campusVariation.plans[s.day])return s;
 const next=()=>{let x=s.campusVariation.seed;x^=x<<13;x^=x>>>17;x^=x<<5;s.campusVariation.seed=x>>>0||1;return s.campusVariation.seed/4294967296;};
 const options={yeogyeong:['hall','library','cafeteria'],seoyeon:['cafe','hall','cafeteria'],soyul:['library','hall','cafe']};
 const plan={};
 for(const [id,places] of Object.entries(options))plan[id]=[840,900,960,1020,1080,1140,1200,1260].map(start=>({start,end:start+60,location:places[Math.floor(next()*places.length)],reason:['break','errand','own-work'][Math.floor(next()*3)],offset:Math.floor(next()*3)*10}));
 s.campusVariation.plans[s.day]=plan;return s;
}
export function variedCampusSchedule(s,base){
 const plan=s.campusVariation?.plans?.[s.day];if(!plan||!s.academics?.enabled)return {...base};
 const result={...base},minute=s.clock.minute;
 for(const [id,windows] of Object.entries(plan)){
  const window=windows.find(w=>minute>=w.start+w.offset&&minute<w.end+w.offset);
  if(window)result[id]=window.location;
 }
 return result;
}
export function campusDetour(s,id){return s.campusVariation?.plans?.[s.day]?.[id]?.find(w=>s.clock.minute>=w.start+w.offset&&s.clock.minute<w.end+w.offset)??null;}
