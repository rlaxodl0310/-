import test from 'node:test';import assert from 'node:assert/strict';
import {forecastDays,navigationBackLabel} from './navigation-copy.js';
test('weather forecast stays inside playable days including week two',()=>{for(let d=1;d<=14;d++){const days=forecastDays(d);assert.equal(days[0],d);assert.ok(days.length>0&&days.length<=4);assert.ok(days.every(x=>x<=14));}assert.deepEqual(forecastDays(14),[14]);assert.deepEqual(forecastDays(5),[5,6,7,8]);});
test('back buttons name the actual destination',()=>{assert.equal(navigationBackLabel('phone','go'),'← 휴대폰');assert.match(navigationBackLabel('menu','go'),/저장·불러오기/);assert.match(navigationBackLabel('','closeQuick'),/하던 장면/);});
