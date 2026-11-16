(function(root){
 const assets={yeogyeong:'assets/yeogyeong-expressions.png',yeogyeongSD:'assets/sd-yeogyeong.png'};
 const player={id:'taei',name:'김태이',age:18,grade:'고등학교 2학년'};
 const actors={narrator:'상황',yeogyeong:'차여경'};
 const profiles={yeogyeong:{name:'차여경',text:'김태이와 조금 친한 같은 반 친구. 올바르고 차분하며 겁이 많고 귀여운 면이 있다. 남을 돕는 것을 좋아하고 간호학과 진학을 목표로 입시를 준비한다. 지금은 평범한 등굣길이며, 미래의 사건이나 능력은 알지 못한다.'},narrator:{name:'상황',text:'현재 눈앞에서 관찰할 수 있는 현실의 환경만 묘사한다.'}};
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
  {...common,id:'earth_schooltalk',title:'등굣길 · 평소 같은 아침',entry:'opening',requiresCompleted:['earth_commute'],nextEvent:'earth_signal',nodes:{
   opening:{speaker:'yeogyeong',emotion:0,text:'오늘 수업 끝나고 뭐 해?',choices:[
    {id:'ask',label:'“넌 뭐 하려고?”',next:'plans',minutes:1},
    {id:'none',label:'“아직 정한 거 없어.”',next:'admission',minutes:1}]},
   plans:{speaker:'yeogyeong',emotion:0,text:'집에 가서 입시 자료 좀 보려고. 찾아볼 게 계속 생기네.',sd:1,next:'done'},
   admission:{speaker:'yeogyeong',emotion:0,text:'난 간호학과 자료 좀 더 보려고. 학교마다 보는 게 조금씩 달라서.',sd:1,next:'done'},
   done:{speaker:'narrator',emotion:0,text:'열차가 터널 안으로 들어간다. 창문에는 차 안의 모습이 희미하게 비친다.',end:true,flags:['earth_schooltalk_done']}
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
 const catalog=[{id:'taei',name:'김태이',age:18},{id:'yeogyeong',name:'차여경',age:null},{id:'dogyeom',name:'백도겸',age:null},{id:'seoha',name:'윤서하',age:null},{id:'woojin',name:'정우진',age:null},{id:'zero',name:'제로',age:null}];
 const initiallyKnown=['taei','yeogyeong','dogyeom'];
 const data={catalog,initiallyKnown,version:3,saveVersion:2,player,actors,profiles,publicFacts:{yeogyeong:{name:'차여경',age:null}},events,assets,emotions:['평상시','작은 웃음','걱정·의아함','놀람','짜증','집중']};
 if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.StoryKitData=data;
})(globalThis);
