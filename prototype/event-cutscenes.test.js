import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save} from './simulation.js';
import {eventCutscene} from './event-cutscenes.js';
const cutsceneFixtures=[['taei','sound','arts',0],['yeogyeong:2','taste','hall',1],['seoyeon:2','rock','cafe',2],['soyul','permission','library',3],['iseo:2','playful','field',4],['dogyeom','pass','outdoorCourt',5]];
function cutsceneState(id,choice,place){const s=newGame();s.location=place;s.personalEvents={active:id,records:{[id]:{eventId:id,person:id.split(':')[0],status:'active',stage:1,day:s.day,location:place,choices:[choice],game:{result:'tie'},last:{text:'장면의 대사'}}}};return s;}
test('six SD panels match their event, action and saved result without modifying the world',()=>{
 for(const [id,choice,place,index] of cutsceneFixtures){const s=cutsceneState(id,choice,place),before=save(s),cut=eventCutscene(s,'personalEvent',{kind:'speech'});assert.equal(cut.index,index);assert.equal(cut.x,index%2*100);assert.equal(cut.y,Math.floor(index/2)*50);assert.deepEqual(eventCutscene(s,'personalEvent',{kind:'speech'}),cut);assert.equal(save(s),before);}
});
test('no misleading CG for other choices, weather venues, game results, player lines or completed events',()=>{
 for(const [id,choice,place] of cutsceneFixtures){const s=cutsceneState(id,choice,place),r=s.personalEvents.records[id];assert.equal(eventCutscene(s,'place',{kind:'speech'}),null);assert.equal(eventCutscene(s,'personalEvent',{kind:'narrator'}),null);if(id!=='taei')assert.equal(eventCutscene(s,'personalEvent',{kind:'speech',actor:'taei'}),null);r.status='completed';assert.equal(eventCutscene(s,'personalEvent',{kind:'speech'}),null);r.status='active';r.stage=0;assert.equal(eventCutscene(s,'personalEvent',{kind:'speech'}),null);}
 let s=cutsceneState('seoyeon:2','rock','cafe');s.personalEvents.records['seoyeon:2'].game.result='win';assert.equal(eventCutscene(s,'personalEvent',{kind:'speech'}),null);
 for(const [id,choice,place] of [['seoyeon:2','paper','cafe'],['iseo:2','playful','gym'],['dogyeom','pass','gym'],['soyul','listen','library'],['taei','plan','arts']])assert.equal(eventCutscene(cutsceneState(id,choice,place),'personalEvent',{kind:'speech'}),null);
});
