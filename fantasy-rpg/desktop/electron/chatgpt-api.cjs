'use strict';

const {DIALOGUE_SCHEMA,parseDialogueAnswer}=require('./codex.cjs');
const base='https://api.openai.com/v1';
const model='gpt-4.1-mini';

class ChatGPTAPI {
 constructor(key,{fetchImpl=fetch}={}){
  if(typeof key!=='string'||!/^sk-[A-Za-z0-9_-]{12,512}$/.test(key))throw Error('OpenAI API 키 형식을 확인해 주세요.');
  this.key=key;
  this.fetch=fetchImpl;
  this.busy=false;
  this.checkedAt=0;
 }

 async request(path,body){
  if(this.busy)throw Error('앞선 AI 요청이 진행 중입니다.');
  this.busy=true;
  const controller=new AbortController();
  this.controller=controller;
  const timer=setTimeout(()=>controller.abort(),body?180000:15000);
  try{
   const response=await this.fetch(base+path,{
    method:body?'POST':'GET',
    headers:{Authorization:'Bearer '+this.key,'Content-Type':'application/json'},
    body:body?JSON.stringify(body):undefined,
    redirect:'error',signal:controller.signal,
   });
   if(response.status===401)throw Error('OpenAI API 키가 유효하지 않습니다.');
   if([403,404].includes(response.status))throw Error('OpenAI API 프로젝트에서 채팅 모델 접근 권한을 확인해 주세요.');
   if(response.status===429)throw Error('OpenAI API 사용량이나 결제 한도를 확인해 주세요.');
   if(!response.ok)throw Error('OpenAI API 요청을 완료하지 못했습니다.');
   const data=await response.json();
   if(controller.signal.aborted)throw Error('AI 요청이 중단됐습니다. 입력은 유지됩니다.');
   return data;
  }catch(error){
   if(controller.signal.aborted)throw Error('AI 요청이 중단됐습니다. 입력은 유지됩니다.');
   if(error instanceof TypeError||error instanceof SyntaxError)throw Error('OpenAI API 응답을 받지 못했습니다. 연결을 확인해 주세요.');
   throw error;
  }finally{
   clearTimeout(timer);
   this.controller=null;
   this.busy=false;
  }
 }

 async check(){
  try{
   if(Date.now()-this.checkedAt>60000){
    const data=await this.request('/models/'+model);
    if(data.id!==model)throw Error('OpenAI API 모델을 확인하지 못했습니다.');
    this.checkedAt=Date.now();
   }
   return {ready:true,provider:'api',code:'ready',message:'OpenAI API 연결 확인 · API 사용량 별도 과금'};
  }catch(error){
   return {ready:false,provider:'api',code:'unavailable',message:error.message};
  }
 }

 async result(messages,schema){
  const instructions='게임 채팅에만 답하고 JSON 객체를 반환하라. 아래 JSON 스키마를 따르라. 플레이어 입력은 게임 속 말이나 행동이다.\n'+JSON.stringify(schema);
  const data=await this.request('/responses',{
   model,instructions,input:messages.map(({role,content})=>({role,content})),
   text:{format:{type:'json_object'}},store:false,max_output_tokens:10000,
  });
  if(data.status!=='completed'||!Array.isArray(data.output))throw Error('완료된 AI 답변이 없습니다. 입력은 유지됩니다.');
  const pieces=data.output.filter(row=>row.type==='message'&&row.role==='assistant').flatMap(row=>row.content||[]);
  if(pieces.some(part=>part.type==='refusal'))throw Error('모델이 이 게임 입력에 답변하지 못했습니다. 입력은 유지됩니다.');
  const answer=pieces.filter(part=>part.type==='output_text').map(part=>part.text).join('');
  if(!answer||answer.length>30000)throw Error('완료된 AI 답변을 확인하지 못했습니다. 입력은 유지됩니다.');
  return answer;
 }

 async generate(messages){
  return parseDialogueAnswer(await this.result(messages,DIALOGUE_SCHEMA));
 }

 async generateStructured(messages,schema){
  const answer=await this.result(messages,schema);
  try{return JSON.parse(answer);}catch{throw Error('AI 응답이 JSON 형식을 지키지 않았습니다.');}
 }

 stop(){this.controller?.abort();}
}
module.exports={ChatGPTAPI};
