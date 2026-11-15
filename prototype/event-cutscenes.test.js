import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save} from './simulation.js';
import {eventCutscene,composeCutscene} from './event-cutscenes.js';
import {introduce} from './identity.js';
import {presentPeople,currentSchedule} from './days.js';
const fixtures=[['taei','sound','arts'],['yeogyeong:2','taste','hall'],['seoyeon:2','rock','cafe'],['soyul','permission','library'],['iseo:2','playful','field'],['dogyeom','pass','outdoorCourt']];
function fixture(id,choice,place){const s=newGame();s.location=place;s.personalEvents={active:id,records:{[id]:{eventId:id,person:id.split(':')[0],status:'active',stage:1,day:s.day,location:place,choices:[choice],game:{result:'tie'},last:{text:'장면의 대사'}}}};return s;}
test('personal scenes use only their actual interaction partner, no fixed group or RNG',()=>{
 for(const [id,choice,place] of fixtures){const s=fixture(id,choice,place),before=save(s),cut=eventCutscene(s,'personalEvent',{kind:'speech'});assert.deepEqual(cut.cast.map(a=>a.id),id==='taei'?['taei']:['taei',id.split(':')[0]]);assert.deepEqual(eventCutscene(s,'personalEvent',{kind:'speech'}),cut);assert.equal(save(s),before);}
});
test('same scene changes from unfamiliar to friendly to guarded without changing relationships',()=>{
 const s=fixture('seoyeon:2','rock','cafe'),beat={kind:'speech',text:'하하. 재밌네요.',actor:'seoyeon'};
 let c=eventCutscene(s,'personalEvent',beat);assert.equal(c.cast[1].row,0);assert.equal(c.cast[1].label,'단발머리 학생');
 introduce(s,'seoyeon');s.relations['seoyeon>taei']={familiarity:20,trust:15,tension:0};
 c=eventCutscene(s,'personalEvent',beat);assert.equal(c.cast[1].row,1);assert.equal(c.cast[1].label,'한서연');
 s.relations['seoyeon>taei'].tension=8;const before=save(s);c=eventCutscene(s,'personalEvent',beat);assert.ok(c.tense);assert.deepEqual(c.cast.map(a=>a.row),[2,2]);assert.equal(save(s),before);
});
test('group composition uses participants and present location, not roster or friendship',()=>{
 const s=newGame();s.location=currentSchedule(s).seoyeon;const here=presentPeople(s,s.location);assert.ok(here.includes('seoyeon'));
 let c=eventCutscene(s,'group',{kind:'speech',actor:'seoyeon',emotion:'happy'},{participants:['taei','seoyeon']});assert.deepEqual(c.cast.map(a=>a.id),['taei','seoyeon']);
 c=eventCutscene(s,'group',{kind:'speech',actor:'seoyeon',emotion:'happy'},{participants:['taei','seoyeon','soyul','iseo']});assert.equal(c.cast.some(a=>a.id==='iseo'),here.includes('iseo'));
 const absent=['iseo','dogyeom','yeogyeong','soyul'].find(id=>!here.includes(id));assert.ok(absent);assert.equal(eventCutscene(s,'group',{kind:'speech',actor:absent,emotion:'happy'},{participants:['taei',absent]}),null);
 assert.equal(eventCutscene(s,'dialogue',{kind:'speech',actor:'seoyeon',text:'네.'},{participants:['taei','seoyeon']}),null);
});
test('peer conflict overrides a cheerful line, and missing characters are never backfilled',()=>{
 const s=newGame();s.relations['soyul>seoyeon']={tension:10};const c=composeCutscene(s,['taei','seoyeon','soyul'],{text:'하하',activeActor:'soyul'});assert.deepEqual(c.cast.slice(1).map(a=>a.row),[2,2]);assert.deepEqual(composeCutscene(s,['dogyeom','dogyeom','unknown']).cast.map(a=>a.id),['dogyeom']);
});
test('expired, departed, completed or unrelated interactions have no scene',()=>{
 for(const [id,choice,place] of fixtures){const s=fixture(id,choice,place),r=s.personalEvents.records[id];assert.equal(eventCutscene(s,'place',{kind:'speech'}),null);assert.equal(eventCutscene(s,'personalEvent',{kind:'narrator'}),null);if(id!=='taei')assert.equal(eventCutscene(s,'personalEvent',{kind:'speech',actor:'taei'}),null);r.status='completed';assert.equal(eventCutscene(s,'personalEvent',{kind:'speech'}),null);r.status='active';r.until=s.clock.minute-1;assert.equal(eventCutscene(s,'personalEvent',{kind:'speech'}),null);delete r.until;s.location='elsewhere';assert.equal(eventCutscene(s,'personalEvent',{kind:'speech'}),null);}
 for(const [id,choice,place] of [['seoyeon:2','paper','cafe'],['iseo:2','playful','gym'],['dogyeom','pass','gym'],['soyul','listen','library'],['taei','plan','arts']])assert.equal(eventCutscene(fixture(id,choice,place),'personalEvent',{kind:'speech'}),null);
});

// CG display follows real choices, rather than a global art toggle.
test('Iseo walk CG only belongs to the just-completed dry-weather walk',()=>{
 const s=fixture('iseo','introduce','gym'),r=s.personalEvents.records.iseo;
 Object.assign(r,{status:'completed',choices:['introduce','chat'],completedDay:s.day,completedMinute:s.clock.minute});
 const beat={kind:'speech',actor:'iseo'},before=save(s);
 assert.equal(eventCutscene(s,'personalEvent',beat).id,'iseo-walk');assert.equal(save(s),before);
 for(const modify of [x=>x.clock.minute++,x=>x.location='library',x=>x.personalEvents.records.iseo.choices=['introduce','pace'],x=>x.personalEvents.records.iseo.completedDay--,x=>x.weather.days[x.day][x.phase]='rain']){const x=structuredClone(s);modify(x);assert.equal(eventCutscene(x,'personalEvent',beat),null);}
 assert.equal(eventCutscene(s,'personalEvent',{kind:'speech',actor:'taei'}),null);
});
test('volleyball CG requires actual gym practice, hides before and after its reply, and expires',()=>{
 const s=fixture('iseo:4','feed','gym'),r=s.personalEvents.records['iseo:4'];r.until=s.clock.minute+20;
 for(const choice of ['feed','watch']){r.choices=[choice];assert.equal(eventCutscene(s,'personalEvent',{kind:'speech',actor:'iseo'}).id,'iseo-volleyball');}
 for(const modify of [x=>x.personalEvents.records['iseo:4'].stage=0,x=>x.personalEvents.records['iseo:4'].status='completed',x=>x.clock.minute+=21,x=>x.location='field']){const x=structuredClone(s);modify(x);assert.equal(eventCutscene(x,'personalEvent',{kind:'speech',actor:'iseo'}),null);}
 assert.equal(eventCutscene(s,'personalEvent',{kind:'speech',actor:'taei'}),null);
});
