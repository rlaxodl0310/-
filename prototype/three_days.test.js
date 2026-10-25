import {knownGame as newGame} from './fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {act,nextDay,acceptAppointment,cancelAppointment,save,restore} from './simulation.js';
import {availableRoutes,presentPeople} from './days.js';
import {dialogue,respond,relationship,groupDialogue,endTopic} from './dialogue.js';

test('days cannot be skipped, replayed, or advanced past day three',()=>{
 assert.throws(()=>nextDay(newGame()));
 let s=newGame();
 for(const choice of ['rehearsal','work','backstage']){
  const day=s.day;s=act(s,choice);
  assert.equal(s.events.filter(e=>e.day===day).length,1);
  assert.throws(()=>act(s,choice));
  if(day<3)s=nextDay(s);
 }
 assert.throws(()=>nextDay(s));assert.equal(s.dayHistory.length,2);
 assert.equal(new Set(s.events.map(e=>e.id)).size,3);
});
test('prior promises survive through morning greetings without being silently cleared',()=>{
 const base=respond(newGame(),'seoyeon','promise').state;
 const kept=nextDay(act(base,'volunteer'));
 const broken=nextDay(act(base,'rehearsal'));
 assert.match(dialogue(kept,'seoyeon').opening,/약속대로/);
 assert.match(dialogue(broken,'seoyeon').opening,/어제 오기로/);
 assert.ok(!dialogue(kept,'seoyeon').options.some(o=>o.id==='promise'));
 assert.deepEqual(kept.dialogue.promises,{});
});
test('same topic is remembered within day but can develop on another day',()=>{
 const a=respond(newGame(),'soyul','personal').state;
 assert.throws(()=>respond(a,'soyul','personal'));
 const reentered=respond(endTopic(a,'soyul'),'soyul','personal');
 assert.equal(reentered.result.repeated,true);
 assert.deepEqual(reentered.state.relations,a.relations);
 const b=nextDay(act(a,'explore'));
 assert.equal(respond(b,'soyul','personal').result.repeated,false);
 assert.equal(b.dialogue.history[0].day,1);
});
test('NPC schedule changes location independently of player arrival',()=>{
 const s=nextDay(act(newGame(),'rehearsal'));
 assert.deepEqual(presentPeople(s,'hall'),['yeogyeong']);
 assert.deepEqual(presentPeople(s,'cafe'),['seoyeon']);
 assert.deepEqual(presentPeople(s,'library'),['soyul']);
 assert.equal(s.npcs.soyul.location,'library');
});
test('unseen cooperation grows the NPC bond and can be learned later',()=>{
 let s=nextDay(act(newGame(),'rehearsal'));
 const before=relationship(s,'yeogyeong','soyul').trust;
 s=act(s,'work');
 assert.equal(relationship(s,'yeogyeong','soyul').trust,before+1);
 assert.ok(!s.known.includes('소율과 여경의 사진 협업'));
 assert.ok(!s.messages.at(-1).text.includes('사진'));
 const heard=respond(s,'yeogyeong','listen').state;
 assert.ok(heard.known.includes('소율과 여경의 사진 협업'));
 assert.match(heard.memory.at(-1),/전해 들었다/);
 assert.match(groupDialogue(s)[1].text,/같이 고르니까/);
});
test('two accepted invitations conflict and only fulfilled activity receives credit',()=>{
 let s=nextDay(act(newGame('friend'),'rehearsal'));
 s=acceptAppointment(s,'seoyeon');s=acceptAppointment(s,'soyul');
 assert.equal(s.appointments.filter(a=>a.status==='pending').length,2);
 s=nextDay(act(s,'work'));s=act(s,'backstage');
 assert.equal(s.appointments.find(a=>a.person==='seoyeon').status,'kept');
 assert.equal(s.appointments.find(a=>a.person==='soyul').status,'broken');
 assert.match(dialogue(s,'soyul').opening,/기다렸/);
});
test('advance notice cancels a commitment without broken-promise penalties',()=>{
 let s=nextDay(act(newGame('friend'),'rehearsal'));
 s=acceptAppointment(s,'seoyeon');s=cancelAppointment(s,'seoyeon');
 const before=relationship(s,'seoyeon');
 s=nextDay(act(s,'work'));s=act(s,'exhibit');
 assert.equal(s.appointments[0].status,'cancelled');
 assert.equal(relationship(s,'seoyeon').tension,before.tension);
});
test('discovered route unlocks a real option; unobserved path stays locked',()=>{
 let a=nextDay(act(newGame(),'explore'));a=nextDay(act(a,'work'));
 let b=nextDay(act(newGame(),'rehearsal'));b=nextDay(act(b,'work'));
 assert.equal(availableRoutes(a).find(r=>r.id==='shortcut').locked,false);
 assert.equal(availableRoutes(b).find(r=>r.id==='shortcut').locked,true);
 assert.throws(()=>act(b,'shortcut'));
 assert.ok(act(a,'shortcut').memory.some(m=>m.includes('연결 통로')));
});
test('all reachable three-day routes preserve state across save and restore',()=>{
 let count=0;
 for(const first of availableRoutes(newGame())){
  const day2=nextDay(act(newGame(),first.id));
  for(const second of availableRoutes(day2)){
   const day3=nextDay(act(day2,second.id));
   for(const third of availableRoutes(day3).filter(r=>!r.locked)){
    const end=act(restore(save(day3)),third.id);
    assert.deepEqual(restore(save(end)),end);
    assert.equal(end.events.length,3);count++;
   }
  }
 }
 assert.equal(count,23);
});
test('version-two saves migrate to day one and retain relationships',()=>{
 const old=newGame('friend');old.version=2;
 delete old.day;delete old.dayHistory;delete old.appointments;
 const loaded=restore(save(old));assert.equal(loaded.day,1);
 assert.equal(loaded.version,4);assert.equal(relationship(loaded,'soyul').trust,4);
});
