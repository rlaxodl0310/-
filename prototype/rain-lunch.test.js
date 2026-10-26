import {dialogueServiceContext} from './dialogue-service.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {arrive,resolveEncounter} from './encounters.js';
import {rainLunchOffer,beginRainLunch,rainLunchAction,lunchEpisode,rainLunchView,interruptRainLunch} from './rain-lunch.js';
import {currentSchedule} from './days.js';
import {contact} from './identity.js';
import {generateDialogueTurn} from './dialogue-generator.js';
function rain(){const s=newGame();s.day=2;s.clock.minute=780;s.location='hall';s.campusVariation={seed:1,plans:{}};return s;}
function start(){const s=rain(),offer=arrive(s,'hall');assert.equal(offer.encounter.kind,'rain-lunch');return resolveEncounter(offer.state,offer.encounter,true).state;}
function invite(s){return rainLunchAction(s,'invite').state;}
function walk(s){return rainLunchAction(invite(s),'covered').state;}
test('rain lunch comes from a real present student, with no names or timetable teleport',()=>{
 const s=rain(),r=arrive(s,'hall');assert.ok(r.encounter);assert.ok(!/차여경|선배/.test(r.encounter.text));
 assert.equal(contact(r.state,'yeogyeong').introduced,false);
 const sunny=rain();sunny.weather.days[2].afternoon='sunny';assert.equal(rainLunchOffer(sunny,'hall'),null);
 const inClass=rain();inClass.clock.minute=740;assert.equal(rainLunchOffer(inClass,'hall'),null);
 const morning=rain();morning.clock.minute=600;assert.equal(rainLunchOffer(morning,'hall'),null);
 assert.equal(rainLunchOffer(r.state,'hall','window'),null);
});
test('passing consumes only this chance, does not introduce or reward, and never respawns',()=>{
 const s=rain(),a=arrive(s,'hall');const next=resolveEncounter(a.state,a.encounter,false).state;
 assert.equal(next.rainLunch.episodes['2:yeogyeong'].status,'passed');assert.equal(rainLunchOffer(next,'hall'),null);
 assert.deepEqual(next.relations,s.relations);assert.equal(contact(next,'yeogyeong').introduced,false);assert.equal(next.clock.minute,780);
});
test('names are learned only in a spoken introduction, without inferred seniority or major',()=>{
 let s=start();assert.equal(contact(s,'yeogyeong').nameLevel,'unknown');
 s=rainLunchAction(s,'introduce').state;
 assert.match(lunchEpisode(s).last.text,/저는 차여경/);assert.equal(contact(s,'yeogyeong').introduced,true);
 assert.equal(contact(s,'yeogyeong').playerSeniorityKnown,false);assert.equal(contact(s,'yeogyeong').details,undefined);
 assert.ok(!lunchEpisode(s).last.text.includes('선배'));assert.throws(()=>rainLunchAction(s,'introduce'));
});
test('walking and eating use real time once; shared choices affect the next meeting',()=>{
 let s=walk(start());assert.equal(s.clock.minute,780);assert.equal(s.location,'hall');s=rainLunchAction(s,'pace').state;assert.equal(s.clock.minute,795);assert.equal(s.location,'cafeteria');assert.equal(s.buildingArea.id,'dining');assert.ok(s.known.includes('외식관 위치'));
 assert.equal(currentSchedule(s).yeogyeong,'cafeteria');assert.equal(s.npcs.yeogyeong.location,'cafeteria');
 assert.equal(s.clock.minute,795);
 s=rainLunchAction(s,'wait').state;assert.equal(s.clock.minute,820);assert.equal(lunchEpisode(s).spent,40);assert.equal(lunchEpisode(s).ate,true);
 assert.ok(s.buildingLife.meals.includes('2:lunch'));assert.deepEqual(s.inventory,[]);
 assert.equal(contact(s,'yeogyeong').introduced,false);assert.ok(!lunchEpisode(s).last.text.includes('차여경'));
 s=rainLunchAction(s,'introduce').state;s=rainLunchAction(s,'finish').state;
 assert.equal(lunchEpisode(s).status,'completed');assert.equal(s.appointments.length,0);
 assert.equal(currentSchedule(s).yeogyeong,'hall');
 const response=generateDialogueTurn(s,'yeogyeong',{action:'greet',prompt:'아까 식당에서 헤어지고 나서는 어땠어요?'});
 assert.equal(response.plan.topic,'shared-lunch');assert.ok(!response.text.includes('선배'));
});
test('appointments and disagreement permit a refusal even with high affection',()=>{
 let s=start();s.relations['yeogyeong>taei']={affection:100,trust:90,familiarity:90,tension:4};
 s=invite(s);assert.equal(lunchEpisode(s).outcome,'declined');assert.equal(s.location,'hall');assert.equal(s.clock.minute,780);
 let busy=start();busy.appointments.push({person:'yeogyeong',day:2,minute:790,status:'pending',kind:'meeting',location:'hall'});
 busy=invite(busy);assert.equal(lunchEpisode(busy).outcome,'declined');assert.equal(lunchEpisode(busy).walked,false);
});
test('an impending commitment allows a short walk without forcing a meal',()=>{
 let s=start();s.appointments.push({person:'yeogyeong',day:2,minute:815,status:'pending',kind:'meeting',location:'hall'});
 s=invite(s);assert.equal(lunchEpisode(s).walkOnly,true);s=rainLunchAction(s,'covered').state;s=rainLunchAction(s,'pace').state;
 assert.equal(lunchEpisode(s).stage,'parting');assert.equal(lunchEpisode(s).ate,false);assert.equal(s.clock.minute,795);
});
test('umbrella sharing needs an actual umbrella and trust; a hurried walk leaves strain',()=>{
 let s=invite(start());assert.ok(!rainLunchView(s).options.some(o=>o.id==='umbrella'));
 assert.throws(()=>rainLunchAction(s,'umbrella'));
 s.inventory.push({id:'umbrella',name:'대여 우산',quantity:1});s.relations['yeogyeong>taei']={trust:5};
 assert.ok(rainLunchView(s).options.some(o=>o.id==='umbrella'));s=rainLunchAction(s,'umbrella').state;assert.equal(s.clock.minute,780);
 s=rainLunchAction(s,'rush').state;assert.equal(s.clock.minute,790);assert.equal(s.relations['yeogyeong>taei'].tension,1);assert.ok(lunchEpisode(s).choices.includes('rush'));
});
test('save/load and reading retain the exact paused moment without extra time or rewards',()=>{
 let s=walk(start());const before=structuredClone(s);rainLunchView(s);rainLunchView(s);assert.deepEqual(s,before);
 s=restore(save(s));assert.deepEqual(lunchEpisode(s),lunchEpisode(before));assert.deepEqual(s.relations,before.relations);
 s=rainLunchAction(s,'share').state;assert.ok(s.dialogue.generation.sharedWork.includes('yeogyeong'));
 assert.equal(s.clock.minute,795);assert.throws(()=>rainLunchAction(s,'share'));
});
test('leaving stops accompaniment and does not claim uneaten food or a new appointment',()=>{
 let s=rainLunchAction(walk(start()),'pace').state;s=interruptRainLunch(s);s.location='library';
 assert.equal(lunchEpisode(s).outcome,'interrupted');assert.equal(lunchEpisode(s).ate,false);assert.equal(currentSchedule(s).yeogyeong,'hall');assert.equal(s.appointments.length,0);
 assert.equal(rainLunchAction(s,'leave').leave,true);assert.throws(()=>rainLunchAction(s,'wait'));
});
test('a broken commitment matters more than affection, and another day can still have a new encounter',()=>{
 let s=start();s.relations['yeogyeong>taei']={affection:100,trust:90,familiarity:90,tension:0};s.dialogue.promises.yeogyeong='broken';
 s=invite(s);assert.equal(lunchEpisode(s).outcome,'declined');
 const old=rain();old.rainLunch={active:'1:yeogyeong',episodes:{'1:yeogyeong':{person:'yeogyeong',day:1,status:'active'}}};assert.ok(rainLunchOffer(old,'hall'));
});

test('only the actual lunch companion receives this shared experience in model context',()=>{
 let s=rainLunchAction(walk(start()),'pace').state;s=rainLunchAction(s,'wait').state;s=rainLunchAction(s,'finish').state;
 const result=generateDialogueTurn(s,'yeogyeong');
 assert.equal(dialogueServiceContext(s,'yeogyeong',result).known.sharedLunch.ate,true);
 assert.equal(dialogueServiceContext(s,'soyul',result).known.sharedLunch,null);
});
