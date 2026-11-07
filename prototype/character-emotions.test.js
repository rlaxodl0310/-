import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,save} from './simulation.js';
import {characterActing} from './character-acting.js';
test('four illustrated actors select distinct new poses for bashfulness, surprise and joy',()=>{
 const s=newGame(),before=save(s);
 for(const id of ['taei','seoyeon','yeogyeong','soyul'])for(const [text,emotion,row] of [['민망하네요','bashful',0],['깜짝 놀랐어요','surprised',1],['정말 재미있었어','happy',2]]){
  const a=characterActing(s,id,{text});assert.equal(a.emotion,emotion);assert.equal(a.atlas,'extra');assert.equal(a.row,row);
 }
 assert.equal(save(s),before);
});
test('listeners respond to heard speech, respect tension and do not borrow speaker emotions',()=>{
 const s=newGame();assert.equal(characterActing(s,'soyul',{listening:true,heardText:'다쳤어요',text:'하하'}).emotion,'worried');
 s.relations['soyul>taei']={tension:4};
 assert.equal(characterActing(s,'soyul',{listening:true,heardText:'귀엽네요'}).emotion,'serious');
 assert.equal(characterActing(s,'taei',{emotion:'surprised'}).row,1);
});
test('Iseo poses stay inside her own atlas and unknown future cast does not crash',()=>{
 for(const emotion of ['neutral','warm','worried','serious','bashful','surprised','happy']){const a=characterActing(newGame(),'iseo',{emotion});assert.equal(a.atlas,'iseo');assert.ok(a.row>=0&&a.row<3);}
 assert.equal(characterActing(newGame(),'future-student').emotion,'neutral');
});
