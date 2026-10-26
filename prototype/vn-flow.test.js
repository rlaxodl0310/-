import test from 'node:test';
import assert from 'node:assert/strict';
import {splitNovelText,novelChoicePage,advanceNovel} from './vn-flow.js';
import {newGame,save} from './simulation.js';
test('long narration is divided without omitting text or creating blank pages',()=>{
 const text='복도 끝에서 발소리가 들린다. 문이 열릴 때마다 짧은 연주 소리가 새어 나온다. '.repeat(12).trim();
 const parts=splitNovelText(text);assert.ok(parts.length>2);assert.ok(parts.every(p=>p.length<=180&&p.trim()));assert.equal(parts.join(' '),text);
 assert.deepEqual(splitNovelText(''),[]);assert.equal(splitNovelText('짧은 문장.')[0],'짧은 문장.');
});
test('a long unbroken token is preserved and cannot overflow the reading budget',()=>{
 assert.throws(()=>splitNovelText('문장',0));
 const text='가'.repeat(401),parts=splitNovelText(text);assert.equal(parts.join(''),text);assert.ok(parts.every(p=>p.length<=180));
});
test('all choices stay reachable while at most three controls appear including the cycle',()=>{
 for(let n=1;n<=20;n++){
  const choices=Array.from({length:n},(_,i)=>i),all=[];const first=novelChoicePage(choices);
  for(let page=0;page<first.pages;page++){const r=novelChoicePage(choices,page);assert.ok(r.items.length+Number(r.more)<=3);all.push(...r.items);}
  assert.deepEqual(all,choices);assert.deepEqual(novelChoicePage(choices,first.pages).items,first.items);
 }
});
test('reading does not choose an answer, move the clock or mutate the existing cursor',()=>{
 const world=newGame(),before=save(world),cursor={beat:0,choosing:false,page:0,branch:'main'},original=structuredClone(cursor);
 let next=advanceNovel(cursor,3);assert.equal(next.beat,1);assert.equal(next.choosing,false);assert.deepEqual(cursor,original);
 next=advanceNovel(next,3);next=advanceNovel(next,3);assert.equal(next.choosing,true);assert.equal(save(world),before);assert.deepEqual(advanceNovel(next,3),next);
});
