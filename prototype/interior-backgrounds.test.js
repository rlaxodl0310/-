import test from 'node:test';
import assert from 'node:assert/strict';
import {interiorBackground,interiorBackgroundNames} from './place-backgrounds.js';
import {gameRoomLayouts} from './campus-rooms.js';
test('room functions override building defaults without treating shops as classrooms',()=>{
 const room=(place,id)=>gameRoomLayouts[place].find(r=>r.id===id);
 for(const [place,id,index] of [['arts','classes',0],['arts','band',1],['music','medium',2],['creative','fashion',3],['creative','nursing',4],['creative','art',5],['sculpture','dentalPractice',6],['gym','court',7],['gym','fitness',8],['academic','classes',9],['hall','clubs',13],['cafeteria','kitchen',14]])assert.equal(interiorBackground(place,room(place,id)).index,index,place+id);
 assert.equal(interiorBackground('arts',null),null);
 assert.equal(interiorBackground('headquarters',room('headquarters','store')),null);
 assert.equal(interiorBackground('arts',room('arts','small7')).index,2);
 assert.equal(interiorBackground('gym',room('gym','basementBand')).index,1);
 assert.equal(interiorBackground('creative',gameRoomLayouts.creative.find(r=>r.id==='room602')).index,3);
 assert.equal(interiorBackgroundNames.length,18);
});
