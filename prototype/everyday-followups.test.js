import test from 'node:test';import assert from 'node:assert/strict';import {newGame,save,restore} from './simulation.js';import {varyEverydayAction,resolveEverydayEvent,everydayEventView} from './everyday-life.js';
function previous(choice='help',location='arts'){const s=newGame();s.location=location;s.day=2;s.everydayLife={rng:1,history:[{key:'past',eventId:'loose-paper',eventOutcome:choice,day:1,location}],sequence:1,pending:null};return s;}
test('helping can produce a one-time next-day trace at the actual place, preserved in saves',()=>{
 let s=previous();s=varyEverydayAction(s,{action:'rest',text:'잠시 쉰다.'}).state;assert.equal(everydayEventView(s).id,'paper-followup');const before=save(s);everydayEventView(s);assert.equal(save(s),before);s=resolveEverydayEvent(restore(save(s)),'read').state;s.day=3;s=varyEverydayAction(s,{action:'rest',text:'잠시 쉰다.'}).state;assert.notEqual(everydayEventView(s)?.id,'paper-followup');
});
test('follow-up cannot appear at another building, same day, or after a different choice',()=>{
 for(const change of [s=>{s.location='academic';},s=>{s.day=1;},s=>{s.everydayLife.history[0].eventOutcome='clear';}]){let s=previous();change(s);s=varyEverydayAction(s,{action:'rest',text:'잠시 쉰다.'}).state;assert.notEqual(everydayEventView(s)?.id,'paper-followup');}
});
