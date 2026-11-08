import test from 'node:test';import assert from 'node:assert/strict';
import {commerceBackground} from './place-backgrounds.js';
import {gameRoomLayouts} from './campus-rooms.js';
test('retail and dining backgrounds respect shop type and room purpose',()=>{
 for(const [place,index] of [['market',0],['neighborhoodMart',0],['restaurant',3],['cafe',4],['pub',5]])assert.equal(commerceBackground(place,null).index,index);
 const room=(place,id)=>gameRoomLayouts[place].find(r=>r.id===id);
 assert.equal(commerceBackground('cafeteria',room('cafeteria','store')).index,1);
 assert.equal(commerceBackground('cafeteria',room('cafeteria','dining')).index,2);
 assert.equal(commerceBackground('cafeteria',room('cafeteria','cafe')).index,4);
 assert.equal(commerceBackground('headquarters',room('headquarters','store')).index,0);
 assert.equal(commerceBackground('headquarters',room('headquarters','dining')).index,2);
 assert.equal(commerceBackground('cafeteria',room('cafeteria','kitchen')),null);
 assert.equal(commerceBackground('arts',room('arts','classes')),null);
 assert.equal(commerceBackground('cafeteria',null),null);
});
