'use strict';

const {gzipSync,gunzipSync}=require('node:zlib');
const maxSnapshot=32*1024*1024;
const historyBudget=4*1024*1024;

function capture(previous,next) {
  const {checkpoints=[],...snapshot}=previous;
  const {checkpoints:unused,...nextSnapshot}=next;
  const budget=Math.min(historyBudget,maxSnapshot-JSON.stringify(nextSnapshot).length-1024);
  const raw=Buffer.from(JSON.stringify(snapshot));
  if(raw.length>maxSnapshot)return;
  const payload=gzipSync(raw,{level:3}).toString('base64');
  if(payload.length>budget)return;
  const retained=[...checkpoints.slice(-4),{turn:next.revision,payload}];
  let size=retained.reduce((sum,item)=>sum+item.payload.length,0);
  while(size>budget)size-=retained.shift().payload.length;
  next.checkpoints=retained;
}

function restore(current,turn) {
  const history=current.checkpoints||[];
  const index=history.findIndex(item=>item.turn===turn);
  if(index<0)throw Error('해당 행동 직전의 저장이 없습니다.');
  const {payload}=history[index];
  try{
    const snapshot=JSON.parse(gunzipSync(Buffer.from(payload,'base64'),{maxOutputLength:maxSnapshot}));
    if(snapshot.version!==1||!Number.isSafeInteger(snapshot.revision)||snapshot.revision>=turn||
       !Array.isArray(snapshot.turns)||!Array.isArray(snapshot.panels)||!snapshot.player)
      throw Error('Invalid checkpoint');
    snapshot.checkpoints=history.slice(0,index);
    return {state:snapshot,payload};
  }catch{throw Error('해당 행동 직전의 저장을 읽지 못했습니다.');}
}

module.exports={capture,restore};
