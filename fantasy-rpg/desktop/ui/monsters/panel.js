(function(r){
function render(body,state){let creator=false;const n=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;},toggle=n('label'),check=n('input'),content=n('div');check.type='checkbox';toggle.append(check,document.createTextNode('설정 자료 보기 · 발견 기록은 바뀌지 않음'));const draw=()=>{content.replaceChildren();for(const m of (creator?[...MonsterCatalog.records,...MonsterCatalog.previews]:[...MonsterCatalog.records,...MonsterCatalog.sightings.filter(m=>MonsterCatalog.known(state,m.id))])){const d=(MonsterCatalog.detail(state,m.id,{creator})||m),card=n('section');card.className='monster-entry';card.append(n('h3',d.name));if(!d.known&&!creator){card.append(n('p','이야기에서 만나면 기록됩니다.'));content.append(card);continue;}card.append(n('p',d.stars+'성 · '+d.lineage));if(d.asset&&globalThis.ExperienceRules)card.append(n('p','처치 경험치 · '+ExperienceRules.monsterReward(m.id)+' XP'));if(d.asset||d.artFrames)for(const [cls,label]of [['main','기본 일러스트'],['action','출현 컷신'],['sd','전투 SD'],...Object.keys(d.artFrames||{}).filter(k=>!['main','action','sd'].includes(k)).map(k=>[k,d.artLabels?.[k]||k])].filter(([key])=>key!=='action'||!d.artFrames?.main||d.artFrames?.action?.src!==d.artFrames.main.src)){if(!d.asset&&!d.artFrames?.[cls])continue;const displayLabel=d.artLabels?.[cls]||label;const figure=n('div');figure.className='monster-art monster-art-'+cls+(d.artLayout==='clad'?' clad-art':'');figure.style.backgroundImage='url("'+(cls==='sd'&&d.spriteAsset?d.spriteAsset:d.asset)+'")';if(d.artLayout==='new'){figure.style.backgroundSize=cls==='sd'?'300% 300%':'200% 300%';figure.style.backgroundPosition=(cls==='action'?'100%':'0%')+' '+(d.artRow*50)+'%';figure.style.aspectRatio=cls==='sd'?'512 / 341':'768 / 341';}if(d.artLayout==='lairon'){figure.style.backgroundSize='200% 100%';figure.style.backgroundPosition=cls==='action'?'100% 0%':'0% 0%';figure.style.aspectRatio='1';if(cls==='sd')figure.setAttribute('aria-label','갱도라 전용 SD 준비 중 · 일러스트 임시 표시');}if(d.artFrames?.[cls]){const f=d.artFrames[cls];figure.style.backgroundImage='url("'+f.src+'")';figure.style.backgroundSize=(f.imageWidth/f.w*100)+'% '+(f.imageHeight/f.h*100)+'%';figure.style.backgroundPosition=(f.imageWidth===f.w?0:f.x/(f.imageWidth-f.w)*100)+'% '+(f.imageHeight===f.h?0:f.y/(f.imageHeight-f.h)*100)+'%';figure.style.aspectRatio=f.w+' / '+f.h;if(cls==='sd'||cls==='combatSD'){figure.style.imageRendering=cls==='combatSD'||!d.artFrames?.combatSD?'pixelated':'auto';figure.style.maxWidth='220px';}}figure.setAttribute('role','img');figure.setAttribute('aria-label',d.name+' '+displayLabel);card.append(figure);}const profile=d.profile;
if(!profile)card.append(n('p',d.size));
else{
 const {heightM,lengthM,massKg,spanM}=profile.adultAverage;
 const dimensions=[`높이 ${heightM}m`,`몸길이 ${lengthM}m`,`체중 ${massKg}kg`];
 if(spanM)dimensions.push(`펼친 막 너비 ${spanM}m`);
 card.append(n('h4',profile.status==='draft'?'성체 평균 · 설정 시안':'성체 평균 · 설계 기준'),n('p',dimensions.join(' · ')));
 for(const [label,key] of [['성격','temperament'],['생활 방식','habits'],['먹이와 영양','nutrition'],['생태계 역할','ecosystemRole']]){
  card.append(n('h4',label),n('p',profile[key]));
 }
}
for(const [label,key]of [['외형','appearance'],['서식','habitat'],['생태','ecology'],['전투','combat'],['약점','weakness']])card.append(n('h4',label),n('p',d[key]));card.append(n('h4','정수'),n('p',d.essenceRule));for(const e of d.essences)card.append(n('p',e.name+' · '+e.effect));if(d.activeSkill){const a=d.activeSkill;card.append(n('h4','추가 액티브 · '+a.name),n('p',a.effect),n('p',a.cost),n('p',a.limits));}if(d.research&&d.known){
 const {record,clue,complete,submitted}=MonsterCatalog.researchStatus(state,d.id);
 card.append(n('h4','현장 조사 노트'));
 for(const [id,task] of Object.entries(d.research)){
  const entry=record?.observations?.[id];
  card.append(n('p',task.label+' · '+(entry?entry.evidence:'미확인')));
 }
 if(submitted){
  card.append(n('p','협회 제출 완료'));
  if(clue){
   card.append(n('h4','협회 조사 단서'),n('p',clue.site+' · '+clue.timing),n('p',clue.approach));
   if(record.clueDiscovery)card.append(n('p',clue.subject+' · '+record.clueDiscovery.evidence));
   if(record.clueAttempt&&!record.clueAttempt.evidence)
    card.append(n('p','최근 탐사에서 이 행동을 확인하지 못했습니다. '+clue.timing));
  }
 }
 else if(complete)card.append(n('p','조사 완료 · 협회에 제출할 수 있습니다.'));
}
if(d.artNote)card.append(n('p',d.artNote));card.append(n('p',d.derivatives));content.append(card);}};check.onchange=()=>{creator=check.checked;draw();};body.append(toggle,content);draw();}
r.MonsterUI={render};
})(globalThis);
