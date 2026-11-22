(function(root){
 const Content=typeof module==='object'&&module.exports?require('./characters/content.js'):root.CharacterContent||{records:[],get:()=>null,displayName:()=>null};
 const assets={yui:'assets/yui-expressions.png',yuiSD:'assets/sd-yui.png',yuiCG:'assets/yui-cutscenes.png',yeogyeong:'assets/yeogyeong-expressions.png',yeogyeongSD:'assets/sd-yeogyeong.png'};
 const player={id:'taei',name:'김태이',age:18,grade:'고등학교 2학년'};
 const actors={nea:'네아','dogyeom-childhood-friend':'임소윤',yui:'한유이',yuiUnknown:'검은 단발의 여성',narrator:'상황',yeogyeong:'차여경'};
 const profiles={yui:{name:'한유이',text:'20세, 158cm. 태이의 고등학교 졸업생이며 인근 대학교 학생. 학교에서 예쁘기로 유명했다. 본인이 3학년일 때 입학한 태이가 잘생겨 눈에 띄어 얼굴과 이름만 알고 있었고 대화한 적은 없다. 특별한 호감은 확정되지 않았다. 성격 세부는 미정. 현재는 현실 지하철로 미래의 전송과 능력을 모른다. 현재 장면의 자기소개 이전에는 이름과 나이를 먼저 누설하지 않는다.'},yeogyeong:{name:'차여경',text:'김태이와 조금 친한 같은 반 친구. 올바르고 차분하며 겁이 많고 귀여운 면이 있다. 남을 돕는 것을 좋아하고 간호학과 진학을 목표로 입시를 준비한다. 지금은 평범한 등굣길이며, 미래의 사건이나 능력은 알지 못한다.'},narrator:{name:'상황',text:'현재 눈앞에서 관찰할 수 있는 현실의 환경만 묘사한다.'}};
 const common={era:'earth',owner:'yeogyeong',viewer:'taei',members:['yeogyeong'],location:'earth_subway',sceneStyle:'subway',portraitAsset:'yeogyeong',sdAsset:'yeogyeongSD'};
 const events=[
  {...common,id:'earth_commute',title:'등굣길 · 같은 칸',entry:'opening',nextEvent:'earth_schooltalk',nodes:{
   opening:{speaker:'narrator',emotion:0,text:'평일 아침, 학교로 향하는 지하철 안. 열차가 역에 멈추고 사람들이 오르내린다. 출입문 옆에 같은 반 친구 차여경이 서 있다.',next:'greeting'},
   greeting:{speaker:'yeogyeong',emotion:1,text:'태이야. 너도 이거 탔네.',choices:[
    {id:'hello',label:'“응. 같이 가자.” 여경 옆에 선다',next:'crowded',minutes:1},
    {id:'school',label:'“학교 가는 길이지?”',next:'school',minutes:1}]},
   crowded:{speaker:'yeogyeong',emotion:0,text:'응. 안쪽으로 조금만 가 있자. 여기 내리는 사람 많아서.',next:'done_with'},
   school:{speaker:'yeogyeong',emotion:1,text:'응. 아직 시간은 괜찮을 것 같아.',next:'done'},
   done:{speaker:'narrator',emotion:0,text:'출입문이 닫히고 열차가 천천히 움직인다. 익숙한 안내 방송이 차 안에 흐른다.',end:true,flags:['earth_commute_done']},
   done_with:{speaker:'narrator',emotion:0,text:'여경과 나란히 선 채 열차의 출발을 기다린다. 익숙한 안내 방송이 차 안에 흐른다.',end:true,flags:['earth_commute_done','companion_yeogyeong']}
  }},
  {...common,id:'earth_schooltalk',title:'등굣길 · 평소 같은 아침',entry:'opening',requiresCompleted:['earth_commute'],nextEvent:'earth_yui_meeting',nodes:{
   opening:{speaker:'yeogyeong',emotion:0,text:'오늘 수업 끝나고 뭐 해?',choices:[
    {id:'ask',label:'“넌 뭐 하려고?”',next:'plans',minutes:1},
    {id:'none',label:'“아직 정한 거 없어.”',next:'admission',minutes:1}]},
   plans:{speaker:'yeogyeong',emotion:0,text:'집에 가서 입시 자료 좀 보려고. 찾아볼 게 계속 생기네.',sd:1,next:'done'},
   admission:{speaker:'yeogyeong',emotion:0,text:'난 간호학과 자료 좀 더 보려고. 학교마다 보는 게 조금씩 달라서.',sd:1,next:'done'},
   done:{speaker:'narrator',emotion:0,text:'열차가 터널 안으로 들어간다. 창문에는 차 안의 모습이 희미하게 비친다.',end:true,flags:['earth_schooltalk_done']}
  }},
  {era:'earth',owner:'yui',viewer:'taei',members:['yui'],location:'earth_subway',portraitAsset:'yui',sdAsset:'yuiSD',cg:'yuiCG',cgPanel:0,id:'earth_yui_meeting',title:'등굣길 · 낯익은 교복',entry:'opening',requiresCompleted:['earth_schooltalk'],nextEvent:'earth_signal',nodes:{
   opening:{speaker:'narrator',emotion:0,text:'검은 단발의 여성이 태이의 교복을 보다가 얼굴로 시선을 옮긴다. 잠시 망설이던 손이 가볍게 올라간다.',sd:0,next:'recognize'},
   recognize:{speaker:'yuiUnknown',emotion:2,text:'혹시 김태이 맞지? 나 너희 학교 나왔는데.',choices:[{id:'ask',label:'“선배세요?”',next:'introduce',minutes:1},{id:'remember',label:'“어디서 뵌 것 같긴 한데요.”',next:'introduce',minutes:1}]},
   introduce:{speaker:'yui',emotion:0,text:'한유이. 네가 입학했을 때 3학년이었어. 지금은 스무 살이고, 근처 대학 다녀.',next:'school'},
   school:{speaker:'yui',emotion:1,text:'그때 신입생 중에 눈에 띄어서 기억했지. 직접 얘기하는 건 처음이네.',sd:1,choices:[{id:'together',label:'“내릴 때까지 같이 가실래요?”',next:'join',minutes:1},{id:'greet',label:'“아, 반가워요. 전 학교 가는 길이에요.”',next:'separate',minutes:1}]},
   join:{speaker:'yui',emotion:1,text:'응. 나도 이쪽으로 가. 문 앞은 좀 비켜 있자.',end:true,flags:['known_person_yui','known_age_yui','companion_yui','earth_yui_meeting_done']},
   separate:{speaker:'yui',emotion:0,text:'응, 나도 수업 가는 중이야. 아침부터 사람 많네.',end:true,flags:['known_person_yui','known_age_yui','earth_yui_meeting_done']}
  }},
  {...common,id:'earth_signal',title:'등굣길 · 잠깐의 깜빡임',entry:'opening',requiresCompleted:['earth_schooltalk'],nodes:{
   opening:{speaker:'narrator',emotion:0,text:'천장의 조명이 한 번 깜빡인다. 안내 방송이 잠깐 끊겼다가 다시 이어진다. 열차는 여전히 터널을 지나고 있다.',next:'notice'},
   notice:{speaker:'yeogyeong',emotion:2,text:'방금 불 꺼졌었지? 나만 본 거 아니지?',choices:[
    {id:'wait',label:'손잡이를 잡고 잠시 기다린다',next:'wait',minutes:1},
    {id:'look',label:'출입문과 주변 승객들의 반응을 살핀다',next:'look',minutes:1}]},
   wait:{speaker:'yeogyeong',emotion:2,text:'……다시 켜졌네. 잠깐 그랬나 봐.',sd:3,next:'done'},
   look:{speaker:'narrator',emotion:0,text:'문은 닫혀 있다. 몇몇 승객이 천장을 올려다보다가 다시 휴대전화로 시선을 내린다.',next:'done'},
   done:{speaker:'narrator',emotion:0,text:'익숙한 철로 소리가 이어진다. 아직은 평소와 같은 지하철 안이다.',end:true,flags:['earth_prologue_done']}
  }}
 ];
 const catalog=[{id:'nea',name:'네아',age:18},{id:'yui',name:'한유이',age:20},{id:'taei',name:'김태이',age:18},{id:'yeogyeong',name:'차여경',age:null},{id:'dogyeom',name:'백도겸',age:null},{id:'seoha',name:'윤서하',age:null},{id:'woojin',name:'정우진',age:null},{id:'zero',name:'제로',age:null},{id:'dogyeom-childhood-friend',name:'임소윤',age:null}];
 for(const person of catalog){
   const transfer=Content.transfers?.[person.id];
   if(transfer)Object.assign(person,{age:transfer.age,classification:'전이자'});
 }
 for(const r of Content.records){catalog.push({id:r.id,name:r.name,age:r.age,heightCm:r.heightCm,weightKg:r.weightKg});actors[r.id]=r.name;profiles[r.id]={name:r.name,text:r.persona};}
 const initiallyKnown=['taei','yeogyeong','dogyeom'];
 const data={content:Content,catalog,initiallyKnown,version:3,saveVersion:2,player,actors,profiles,publicFacts:{nea:{name:'네아',age:18},yui:{name:'한유이',age:20},yeogyeong:{name:'차여경',age:null}},events,assets,emotions:['평상시','작은 웃음','걱정·의아함','놀람','짜증','집중']};
 if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.StoryKitData=data;
})(globalThis);
