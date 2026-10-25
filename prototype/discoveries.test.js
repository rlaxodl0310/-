import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryChanges,recordDiscoveries} from './discoveries.js';
import {newAfternoonScenario as newGame,restore,save} from './simulation.js';
import {arrive} from './encounters.js';
test('observing storage grants information only and records it once across save/load',()=>{
 const before=newGame(),after=arrive(before,'library','shelves').state;
 const gains=recordDiscoveries(before,after);
 assert.equal(gains.length,1);assert.equal(gains[0].kind,'information');assert.deepEqual(after.inventory,[]);
 assert.equal(after.discoveries[0].location,'library');
 const loaded=restore(save(after));assert.deepEqual(loaded,after);
 assert.deepEqual(recordDiscoveries(loaded,arrive(loaded,'library','shelves').state),[]);
});
test('actual positive inventory changes are distinguished from knowledge and spending',()=>{
 const before=newGame();before.inventory=[{id:'water',name:'생수',quantity:2}];
 const after=structuredClone(before);after.inventory[0].quantity=3;after.known.push('정수기 위치');
 assert.deepEqual(discoveryChanges(before,after),[{kind:'information',name:'정수기 위치'},{kind:'item',name:'생수',quantity:1}]);
 after.inventory[0].quantity=1;assert.equal(discoveryChanges(before,after).length,1);
});
test('older saves open with empty acquisition records without fabricating new gains',()=>{
 const old=newGame();old.known=['이전 정보'];delete old.inventory;delete old.discoveries;
 const restored=restore(save(old));assert.deepEqual(restored.inventory,[]);assert.deepEqual(restored.discoveries,[]);
 assert.deepEqual(discoveryChanges(restored,restored),[]);
});
