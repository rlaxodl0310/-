const fs=require('node:fs/promises'),path=require('node:path'),Q=require('../ui/association/quests.js');
const SCHEMA={type:'object',additionalProperties:false,required:['quests'],properties:{quests:{type:'array',minItems:1,maxItems:8,items:{type:'object',additionalProperties:false,required:['key','title','description','risk'],properties:{key:{type:'string'},title:{type:'string'},description:{type:'string'},risk:{type:'string'}}}}}};
class QuestBoard{
 constructor(file,bridge){this.file=file;this.bridge=bridge;this.busy=false;}
 async read(){try{const s=JSON.parse(await fs.readFile(this.file,'utf8'));if(s.version!==1||!Number.isInteger(s.hour)||!Array.isArray(s.quests)||s.quests.length>120)throw Error();return s;}catch(e){if(e.code==='ENOENT')return Q.initial();throw Error('의뢰 기록을 읽지 못했습니다. 원본을 보존했습니다.');}}
 async write(s){await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(this.file+'.tmp',JSON.stringify(s),{mode:0o600});await fs.rename(this.file+'.tmp',this.file);return s;}
 async mutate(fn){if(this.busy)throw Error('의뢰 처리 중입니다.');this.busy=true;try{return await this.write(await fn(await this.read()));}finally{this.busy=false;}}
 accept(id){return this.mutate(s=>Q.accept(s,id,'D'));}
 advance(){return this.mutate(s=>Q.advance(s,6));}
 refresh(id,ai){return this.mutate(async s=>{if(!Q.SCENARIOS[id])throw Error('없는 상황입니다.');let rows;if(ai){const status=await this.bridge.check();if(!status.ready)throw Error(status.message);const result=await this.bridge.generateStructured([{role:'system',content:'판타지 협회의 게시 의뢰를 작성한다. 제공된 후보 key만 각각 최대 한 번 사용한다. 종류·장소·위험의 사실을 바꾸지 말고 현실적인 사정과 요청을 자연스러운 한국어로 작성한다. 미확인 진상·숨은 능력·확정되지 않은 몬스터를 발명하지 않는다. 핵 파괴를 지시하지 않는다. 핵 파괴 후 정확히 48시간에 붕괴하고 마나가 되어 새 생태계가 형성된다. 보상·랭크·기한은 프로그램이 정한다. title 80자, description 700자, risk 240자 이내. JSON quests만 반환. 세계 시각 '+s.hour+'시, 후보: '+JSON.stringify(Q.candidates(id,s.hour))},{role:'user',content:'현재 접수 중이거나 수락된 의뢰: '+JSON.stringify(s.quests.filter(q=>['open','accepted'].includes(q.status)).map(q=>({key:q.key,title:q.title,scenario:q.scenario})))+' 이와 중복되지 않는 후보 의뢰를 작성해 줘.'}],SCHEMA);rows=result.quests;}else rows=Q.drafts(id,s.hour,s.sequence);return Q.refresh(s,id,rows,ai?'ai':'local');});}
}
module.exports={QuestBoard,SCHEMA};
