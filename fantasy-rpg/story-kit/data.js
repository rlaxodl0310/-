(function(root){
  const members=['taei','dogyeom','seoha'];
  const assets={
    taei:'../assets/taei-expressions.png',dogyeom:'../assets/dogyeom-expressions.png',seoha:'../assets/seoha-expressions.png',
    well:'../assets/event-well.png',rain:'../assets/event-rain.png',sd:'../assets/sd-interactions.png'
  };
  const actors={taei:'김태이',dogyeom:'백도겸',seoha:'같은 학교 여학생'};
  const events=[
    {id:'water',title:'우물가의 물 한 잔',location:'well',members,cg:'well',entry:'offer',nodes:{
      offer:{speaker:'dogyeom',emotion:0,text:'나 말고 저쪽부터 줘. 아까부터 멍하니 있잖아.',choices:[
        {id:'offer_girl',label:'여학생에게 먼저 물을 건넨다',next:'bird',minutes:1},
        {id:'ask_dog',label:'“너도 목마르잖아. 먼저 마셔.”',next:'dog',minutes:1}]},
      dog:{speaker:'dogyeom',emotion:1,text:'……그럼 컵이나 놔. 내가 마실게.',next:'bird'},
      bird:{speaker:'seoha',emotion:5,text:'응? 나? 미안. 저 새, 아까부터 물 안 마시고 우리만 봐.',sd:2,choices:[
        {id:'join_bird',label:'“우리도 새 보고 있잖아.”',next:'odd'},
        {id:'water_first',label:'“새는 나중에 보고, 물부터 마셔.”',next:'drink'}]},
      odd:{speaker:'seoha',emotion:2,text:'그러네. 서로 구경하는 건가.',sd:2,next:'done'},
      drink:{speaker:'seoha',emotion:0,text:'아, 고마워. 컵 여기 두면 돼?',sd:3,next:'done'},
      done:{speaker:'taei',emotion:1,text:'응. 다 마셨으면 잠깐만 쉬었다 가자.',end:true,flags:['shared_water']}
    }},
    {id:'map',title:'지도를 보는 방향',location:'porch',members,cg:'rain',entry:'direction',nodes:{
      direction:{speaker:'dogyeom',emotion:4,text:'그거 아까도 봤잖아. 어느 쪽인데.',choices:[
        {id:'check_marker',label:'“잠깐만. 여기 다리 표시랑 맞춰볼게.”',next:'bridge',minutes:2},
        {id:'ask_girl',label:'여학생에게 지도 방향을 같이 봐 달라고 한다',next:'girl',minutes:2}]},
      bridge:{speaker:'dogyeom',emotion:5,text:'……저 돌다리? 그러면 이쪽 맞네.',next:'done'},
      girl:{speaker:'seoha',emotion:2,text:'나도 보고 있었는데. 근데 너랑 내가 보는 방향이 반대네.',sd:4,next:'turn'},
      turn:{speaker:'taei',emotion:2,text:'그럼 같은 쪽에 서서 보자. 잠깐, 내가 옮길게.',sd:4,next:'done'},
      done:{speaker:'taei',emotion:5,text:'표시부터 맞추고 가면 되겠다.',end:true,flags:['map_checked']}
    }},
    {id:'rain',title:'처마 아래서',location:'porch',members,cg:'rain',entry:'rainfall',nodes:{
      rainfall:{speaker:'dogyeom',emotion:4,text:'계속 기다릴 거야? 저쪽은 좀 덜 오는데.',choices:[
        {id:'wait',label:'“조금만 더 보자. 옷 젖으면 말리기도 힘들어.”',next:'waited',minutes:3},
        {id:'look',label:'처마 끝에서 길 상태를 확인한다',next:'road',minutes:1}]},
      waited:{speaker:'dogyeom',emotion:0,text:'……알았어. 대신 계속 서 있진 말고.',sd:5,next:'girl'},
      road:{speaker:'taei',emotion:2,text:'저쪽도 바닥에 물 고였네. 지금 나가긴 애매하다.',next:'girl'},
      girl:{speaker:'seoha',emotion:5,text:'여긴 물방울이 계속 같은 데 떨어지네.',choices:[
        {id:'reply',label:'“지붕 끝이 저렇게 생겼으니까.”',next:'answer'},
        {id:'quiet',label:'말없이 비를 함께 본다',next:'quiet'}]},
      answer:{speaker:'seoha',emotion:0,text:'아. 그렇네. 그냥 보고 있었어.',next:'done'},
      quiet:{speaker:'dogyeom',emotion:0,text:'……둘 다 뭐 보냐.',sd:5,next:'done'},
      done:{speaker:'taei',emotion:0,text:'일단 여기서 조금만 쉬자.',end:true,flags:['sheltered_rain']}
    }}
  ];
  const data={version:1,assets,actors,events,emotions:['평상시','작은 웃음','걱정·의아함','놀람','짜증','집중·딴생각']};
  if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.StoryKitData=data;
})(globalThis);
