import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame as clubGame,act,nextDay,save,restore,acceptAppointment} from './simulation.js';
import {dialogue,respond,groupDialogue,openConversation} from './dialogue.js';
import {contact,displayName,hearGroupLine,presentationText} from './identity.js';
import {personalMessage} from './social-reasoning.js';
function newGame(){const s=clubGame();s.contacts={};return s;}

test('club roster gives names without private acquaintance or automatic affinity',()=>{
 const s=clubGame();
 for(const id of Object.keys(s.npcs)){assert.equal(displayName(s,id),s.npcs[id].name);assert.equal(contact(s,id).introduced,false);assert.equal(s.relations[id+'>taei'],undefined);}
});

test('unfamiliar-person fixture does not reveal names, roles or existing friendship',()=>{
 const s=newGame();
 assert.equal(displayName(s,'yeogyeong'),'수첩을 정리하는 학생');
 for(const id of Object.keys(s.npcs)){
  assert.equal(contact(s,id).nameLevel,'unknown');assert.equal(contact(s,id).introduced,false);
  assert.equal(dialogue(s,id).intro,true);
  assert.ok(!dialogue(s,id).options.some(o=>o.id==='personal'));
  assert.equal(personalMessage(s,id),null);
 }
 assert.equal(s.relations['seoyeon>soyul'].familiarity,20);
});

test('approaching, hearing a name and exchanging introductions are distinct steps',()=>{
 const initial=newGame();
 const approached=openConversation(initial,'yeogyeong').state;
 assert.equal(contact(approached,'yeogyeong').seen,true);
 assert.equal(contact(approached,'yeogyeong').nameLevel,'unknown');
 const named=respond(approached,'yeogyeong','intro:greet').state;
 assert.equal(displayName(named,'yeogyeong'),'차여경');
 assert.equal(contact(named,'yeogyeong').introduced,false);
 assert.equal(contact(named,'yeogyeong').playerNameKnown,false);
 assert.throws(()=>respond(named,'yeogyeong','personal'));
 const met=respond(named,'yeogyeong','intro:introduce').state;
 assert.equal(contact(met,'yeogyeong').introduced,true);
 assert.equal(contact(met,'yeogyeong').playerNameKnown,true);
 assert.ok(dialogue(met,'yeogyeong').options.some(o=>o.id==='personal'));
 assert.deepEqual(met.relations,initial.relations);
});

test('leaving after only hearing a name does not fake a friendship or private messages',()=>{
 let s=respond(newGame(),'soyul','intro:greet').state;
 s=respond(s,'soyul','intro:leave').state;
 assert.equal(displayName(s,'soyul'),'박소율');
 assert.equal(dialogue(s,'soyul').intro,true);
 assert.equal(personalMessage(s,'soyul'),null);
});

test('overhearing a direct address reveals only a given name and not mutual acquaintance',()=>{
 const s=newGame(),lines=groupDialogue(s);
 hearGroupLine(s,lines[0]);
 assert.equal(displayName(s,'soyul'),'소율');
 assert.equal(contact(s,'soyul').introduced,false);
 assert.equal(displayName(s,'seoyeon'),'단발머리 학생');
 assert.equal(contact(s,'soyul').sources[0].source,'overheard-address');
 assert.equal(contact(s,'yeogyeong').nameLevel,'unknown');
 assert.throws(()=>acceptAppointment({...s,day:2},'soyul'));
});

test('only shared activities introduce participants; time passing does not reveal everybody',()=>{
 const absent=nextDay(act(newGame(),'rehearsal'));
 for(const id of Object.keys(absent.npcs))assert.equal(contact(absent,id).nameLevel,'unknown');
 assert.ok(!absent.messages.some(m=>m.from===absent.npcs.soyul.name));
 const together=act(newGame(),'volunteer');
 for(const id of Object.keys(together.npcs))assert.equal(contact(together,id).introduced,true);
 let photo=nextDay(act(newGame(),'rehearsal'));photo=act(photo,'review');
 assert.equal(contact(photo,'soyul').introduced,true);
 assert.equal(contact(photo,'yeogyeong').introduced,false);
});

test('narration hides identities while a heard given name remains usable',()=>{
 const s=newGame();
 assert.ok(!presentationText(s,'차여경은 소율의 사진을 본다.').includes('차여경'));
 hearGroupLine(s,groupDialogue(s)[0]);
 assert.equal(presentationText(s,'박소율과 사진을 본다.'),'소율과 사진을 본다.');
});

test('identity and evidence survive saving without introducing the rest of the cast',()=>{
 const s=respond(newGame(),'seoyeon','intro:greet').state;
 const loaded=restore(save(s));assert.deepEqual(loaded,s);
 assert.equal(displayName(loaded,'seoyeon'),'한서연');
 assert.equal(contact(loaded,'seoyeon').introduced,false);
 assert.equal(contact(loaded,'soyul').nameLevel,'unknown');
});

test('legacy world-only relations do not count as meeting; actual interactions can migrate',()=>{
 const old=newGame();old.version=3;delete old.contacts;
 const unknown=restore(save(old));assert.equal(unknown.version,5);
 assert.equal(contact(unknown,'soyul').introduced,false);
 old.dialogue.history.push({person:'yeogyeong',day:1,phase:'afternoon',choice:'personal'});
 const migrated=restore(save(old));assert.equal(contact(migrated,'yeogyeong').introduced,true);
 assert.equal(contact(migrated,'soyul').introduced,false);
});
