(function(root){
const names={goblin:'고블린',slime:'슬라임',ves:'베스'};
class Battle{
 constructor(options={}){this.seed=options.seed||731;this.round=1;this.status='playing';this.log=[];this.units=[{id:'taei',name:'김태이',kind:'taei',team:'ally',hp:100,max:100,mana:24,x:1,y:1,guard:false}];if(options.partner)this.units.push({id:'dogyeom',name:'백도겸',kind:'dogyeom',team:'ally',hp:85,max:85,x:0,y:2});this.potions=2;this.seen=[];const kind=names[options.kind]?options.kind:'goblin';for(let i=0;i<Math.min(5,Math.max(1,options.count||3));i++)this.units.push({id:'enemy-'+i,name:names[kind]+' '+(i+1),kind,team:'enemy',hp:kind==='slime'?24:30,max:kind==='slime'?24:30,x:5+(i%2),y:i%3,windup:false});}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 living(team){return this.units.filter(u=>u.team===team&&u.hp>0);}
 distance(a,b){return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));}
 parse(text){if(/회복|포션|약|치료/.test(text))return 'heal';if(/도주|도망|탈출/.test(text))return 'flee';if(/회피|피하|피해|옆으로/.test(text))return 'dodge';if(/방어|막|가드|버티/.test(text))return 'guard';if(/후퇴|뒤로|물러/.test(text))return 'retreat';if(/접근|다가|전진|이동/.test(text))return 'approach';if(/강타|강하게|세게|온힘/.test(text))return 'heavy';if(/공격|주먹|때리|치기|찌르|타격|견제/.test(text))return 'attack';return null;}
 act(action,targetId){if(this.status!=='playing')throw Error('종료된 전투입니다.');if(!['attack','heavy','guard','dodge','approach','retreat','heal','flee'].includes(action))throw Error('행동을 선택해 주세요.');const p=this.units[0],target=this.units.find(u=>u.id===targetId&&u.team==='enemy'&&u.hp>0)||this.living('enemy')[0];if(action==='heal'&&!this.potions)throw Error('남은 포션이 없습니다.');if(action==='heavy'&&p.mana<6)throw Error('마나가 부족합니다.');const events=[];const emit=(text,extra={})=>{this.log.push(text);events.push({text,...extra});};const move=(u,t,away=false)=>{const old={x:u.x,y:u.y};let x=Math.max(0,Math.min(6,u.x+Math.sign(t.x-u.x)*(away?-1:1))),y=u.y;if(x===u.x||Math.abs(t.y-u.y)>1)y=Math.max(0,Math.min(2,u.y+Math.sign(t.y-u.y)*(away?-1:1)));const occupied=(xx,yy)=>this.units.some(a=>a.id!==u.id&&a.hp>0&&a.x===xx&&a.y===yy);if(occupied(x,y)){const alt=[0,1,2].find(yy=>!occupied(x,yy));if(alt===undefined)return; y=alt;}u.x=x;u.y=y;emit(u.name+(away?'이 거리를 벌렸다.':'이 위치를 옮겼다.'),{type:'move',actor:u.id,from:old,to:{x,y}});};
 const hit=(a,t,damage,tag)=>{if(t.dodge){t.dodge=false;if(this.random()<.75){emit(t.name+'이 공격을 피했다.',{type:'miss',actor:a.id,target:t.id});return;}}if(this.random()<.08){emit(a.name+'의 공격이 빗나갔다.',{type:'miss',actor:a.id,target:t.id});return;}if(t.guard)damage=Math.max(1,Math.ceil(damage*.4));t.hp=Math.max(0,t.hp-damage);emit(a.name+' → '+t.name+' · '+tag+' '+damage,{type:'hit',actor:a.id,target:t.id,damage});if(!t.hp)emit(t.name+'이 쓰러졌다.',{type:'down',target:t.id});};
 p.guard=false;p.dodge=false;
 if(action==='heal'){this.potions--;const n=Math.min(32,p.max-p.hp);p.hp+=n;emit('포션 사용 · 체력 +'+n,{type:'heal',actor:p.id});}
 else if(action==='guard'){p.guard=true;emit('김태이가 가드를 올렸다. 다음 적 행동의 피해 감소.',{type:'guard',actor:p.id});}
 else if(action==='dodge'){p.dodge=true;emit('김태이가 첫 공격에 대비해 회피 자세를 잡았다.',{type:'guard',actor:p.id});}
 else if(action==='approach'||action==='retreat')move(p,target,action==='retreat');
 else if(action==='flee'){if(this.random()<.6){this.status='fled';emit('추격을 떨치고 전투에서 벗어났다.',{type:'end'});return events;}emit('퇴로가 막혔다. 도주 실패.');}
 else if(this.distance(p,target)>1){move(p,target);emit('공격 거리 밖이라 접근했다. 다음 행동에 공격할 수 있다.');}
 else{if(action==='heavy')p.mana-=6;hit(p,target,action==='heavy'?24:14,action==='heavy'?'강타':'공격');}
 if(!this.living('enemy').length){this.status='won';emit('모든 적을 제압했다.',{type:'end'});return events;}
 for(const ally of this.living('ally').filter(a=>a.id!=='taei')){const t=this.living('enemy').sort((a,b)=>this.distance(ally,a)-this.distance(ally,b))[0];if(!t)break;if(this.distance(ally,t)>1)move(ally,t);else hit(ally,t,10,'동료 공격');}
 for(const e of this.living('enemy')){if(p.hp<=0)break;const t=this.living('ally').sort((a,b)=>this.distance(e,a)-this.distance(e,b))[0];if(this.distance(e,t)>1){move(e,t);e.windup=false;}else if(!e.windup){e.windup=true;emit(e.name+'이 '+t.name+'을 노리고 공격 자세를 잡았다.',{type:'tell',actor:e.id,target:t.id});}else{e.windup=false;hit(e,t,e.kind==='slime'?9:12,'공격');}}
 this.round++;if(p.hp<=0){this.status='lost';emit('김태이가 더는 싸울 수 없다.',{type:'end'});}else if(!this.living('enemy').length){this.status='won';emit('모든 적을 제압했다.',{type:'end'});}return events;}
 save(){return JSON.stringify({version:1,state:this});}
 static restore(text){const d=JSON.parse(text),s=d.state;if(d.version!==1||!s||!Array.isArray(s.units)||s.units.length>7||!['playing','won','lost','fled'].includes(s.status)||!Number.isInteger(s.round)||s.round<1||!Array.isArray(s.log)||!Array.isArray(s.seen)||s.units[0]?.id!=='taei')throw Error('저장 형식 오류');const ids=new Set();for(const u of s.units){if(ids.has(u.id)||!Number.isFinite(u.hp)||u.hp<0||u.hp>u.max||!Number.isInteger(u.x)||u.x<0||u.x>6||!Number.isInteger(u.y)||u.y<0||u.y>2||!['ally','enemy'].includes(u.team))throw Error('저장 상태 오류');ids.add(u.id);}const b=Object.create(Battle.prototype);Object.assign(b,s);return b;}
}
if(typeof module!=='undefined')module.exports=Battle;else root.Battle=Battle;
})(globalThis);
