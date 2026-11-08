import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {startSurvival,finishSurvivalDay,survivalDayPreview,launchSurvivalSortie} from './survival-base.js';
import {campIncidentView,checkCampIncident,resolveCampIncident} from './camp-incidents.js';
import {survivalPage} from './survival-ui.js';
function base(id='locker'){const s=startSurvival(newGame());Object.assign(s.survivalRun,{stage:'base',day:4,actions:3,base:{site:'library',integrity:80,facilities:[]},threat:20});s.survivalRun.resources={food:20,water:20,parts:10,bandage:2};s.survivalRun.story={seed:123,last:[],checkedDay:4,current:{id,day:4},pending:[],resolved:[]};return s;}
test('camp preview is pure, predicts real night and includes one-time delayed choices',()=>{
 let s=resolveCampIncident(base(),'quiet');assert.equal(s.survivalRun.resources.parts,9);assert.equal(s.survivalRun.actions,2);assert.equal(s.survivalRun.resources.water,20);
 const before=save(s),p=survivalDayPreview(s);for(let i=0;i<3;i++){survivalPage(s);campIncidentView(s);}assert.equal(save(s),before);
 s=finishSurvivalDay(restore(save(s)));assert.equal(s.survivalRun.resources.water,22);assert.deepEqual(s.survivalRun.resources,p.after);assert.equal(s.survivalRun.story.pending.length,0);
 s=finishSurvivalDay(s);assert.equal(s.survivalRun.resources.water,20);assert.throws(()=>resolveCampIncident({...s,survivalRun:{...s.survivalRun,story:{...s.survivalRun.story,current:null}}},'quiet'));
});
test('same-day inspection and reload cannot reroll a situation or duplicate rewards',()=>{
 let s=base();delete s.survivalRun.story;s=checkCampIncident(s);const event=campIncidentView(s),before=save(s);s=checkCampIncident(restore(save(s)));assert.deepEqual(campIncidentView(s),event);assert.equal(save(s),before);
 s=resolveCampIncident(s,'pass');assert.equal(s.survivalRun.actions,3);const after=save(s);s=checkCampIncident(s);assert.equal(save(s),after);assert.equal(campIncidentView(s),null);assert.throws(()=>resolveCampIncident(s,'pass'));
});
test('resource constraints are atomic; busy sorties cannot spend camp stock',()=>{
 let s=base('exchange');s.survivalRun.resources.food=1;const before=save(s);assert.ok(campIncidentView(s).choices.find(c=>c.id==='medical').blocked);assert.throws(()=>resolveCampIncident(s,'medical'));assert.equal(save(s),before);
 s=launchSurvivalSortie(s,'supply');assert.throws(()=>checkCampIncident(s));assert.throws(()=>resolveCampIncident(s,'water'));
});
test('loud shortcut has immediate threat while listening has deferred morale recovery',()=>{
 let s=resolveCampIncident(base(),'force');assert.equal(s.survivalRun.resources.water,22);assert.equal(s.survivalRun.threat,28);assert.equal(s.survivalRun.story.pending.length,0);
 s=resolveCampIncident(base('tension'),'listen');assert.equal(s.survivalRun.members[0].stress,8);s=finishSurvivalDay(s);assert.equal(s.survivalRun.members[0].stress,1);
});
test('legacy camps can inspect without a charge and new days avoid last two situations',()=>{
 let s=base();delete s.survivalRun.story;const resources=structuredClone(s.survivalRun.resources);s=checkCampIncident(s);assert.deepEqual(s.survivalRun.resources,resources);const first=campIncidentView(s).id;s=finishSurvivalDay(s);const second=campIncidentView(s).id;s=finishSurvivalDay(s);const third=campIncidentView(s).id;assert.equal(new Set([first,second,third]).size,3);
});
test('night forecast calls out fatal shortages without advancing either clock',()=>{
 const s=base();s.survivalRun.shortage=2;s.survivalRun.resources.food=0;const before=save(s),p=survivalDayPreview(s);assert.equal(p.failed,true);assert.equal(p.short,true);assert.equal(save(s),before);
});
