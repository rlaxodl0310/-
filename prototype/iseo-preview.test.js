import test from 'node:test';
import assert from 'node:assert/strict';
import {newIseoPreview,iseoPreviewView,advanceIseoPreview} from './iseo-preview.js';
function ready(s){while(s.beat<iseoPreviewView(s).lines.length-1)s=advanceIseoPreview(s,'next');return s;}
test('Iseo audition reveals name only through introduction and has bounded choices',()=>{
 let s=newIseoPreview();assert.equal(iseoPreviewView(s).name,'단발머리 학생');s=advanceIseoPreview(s,'welcome');assert.throws(()=>advanceIseoPreview(s,'introduce'));s=advanceIseoPreview(ready(s),'introduce');assert.equal(iseoPreviewView(s).name,'정이서');assert.equal(iseoPreviewView(s).expression,1);assert.ok(iseoPreviewView(s).options.length<=3);
});
test('Iseo boundary and busy branches respect space without automatically knowing the player',()=>{
 let s=advanceIseoPreview(newIseoPreview(),'busy');assert.equal(iseoPreviewView(s).expression,0);assert.ok(!iseoPreviewView(s).lines.join('').includes('선배'));s=advanceIseoPreview(ready(s),'leave');assert.equal(iseoPreviewView(s).options.length,0);
 let t=advanceIseoPreview(newIseoPreview(),'welcome');t=advanceIseoPreview(ready(t),'listen');t=advanceIseoPreview(ready(t),'boundary');assert.equal(iseoPreviewView(t).options.length,0);assert.match(iseoPreviewView(t).lines.join(''),/조용히/);
});
test('Iseo playful reply changes expression and recovery remains a distinct branch',()=>{
 let s=advanceIseoPreview(newIseoPreview(),'welcome');s=advanceIseoPreview(ready(s),'tease');assert.equal(iseoPreviewView(s).expression,2);s=advanceIseoPreview(ready(s),'reassure');assert.equal(iseoPreviewView(s).expression,1);assert.equal(s.comfort,1);
});
test('Iseo audition rendering and transitions do not mutate input; restart offers another greeting',()=>{
 const s=newIseoPreview(),copy=structuredClone(s);for(let n=0;n<5;n++)iseoPreviewView(s);advanceIseoPreview(s,'welcome');assert.deepEqual(s,copy);assert.notDeepEqual(iseoPreviewView(s).lines,iseoPreviewView(newIseoPreview(1)).lines);
});
