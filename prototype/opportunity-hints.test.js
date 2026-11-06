import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,save,restore} from './simulation.js';
import {opportunityCandidates,updateOpportunityHints,currentOpportunity,dismissOpportunity} from './opportunity-hints.js';
function afternoon(){const s=newGame();s.day=4;s.clock.minute=840;s.location='library';return s;}
test('hints never reveal unread recruitment or NPC identities',()=>{const s=afternoon();const c=opportunityCandidates(s);assert.ok(c.some(x=>x.id==='daily:4'));assert.ok(c.every(x=>!x.id.startsWith('public:')));assert.ok(c.every(x=>!/(차여경|한서연|박소율)/.test(x.text)));});
test('dismissal, cooldown, and seen hints survive saving without time cost',()=>{let s=afternoon();const time=s.clock.minute;updateOpportunityHints(s);assert.ok(currentOpportunity(s));assert.equal(s.clock.minute,time);dismissOpportunity(s);s=restore(save(s));updateOpportunityHints(s);assert.equal(currentOpportunity(s),null);s.clock.minute+=100;updateOpportunityHints(s);assert.equal(currentOpportunity(s),null);});
test('completed activity expires a suggestion and next day gets a new possibility',()=>{const s=afternoon();updateOpportunityHints(s);s.fortnightLife={4:{done:true}};assert.equal(currentOpportunity(s),null);s.day=5;updateOpportunityHints(s);assert.equal(currentOpportunity(s)?.id,'daily:5');});
test('no hints during registration, evening, or before the first break',()=>{for(const change of [{phase:'evening'},{academics:{registrationPending:true}},{clock:{minute:550}}])assert.deepEqual(opportunityCandidates(Object.assign(afternoon(),change)),[]);});
