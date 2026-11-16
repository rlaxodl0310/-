(function(root){
  const assets={
    taei:'../assets/taei-expressions.png',dogyeom:'../assets/dogyeom-expressions.png',seoha:'../assets/seoha-expressions.png',
    taeiSolo:'../assets/event-taei-solo.png',dogyeomSolo:'../assets/event-dogyeom-solo.png',seohaSolo:'../assets/event-seoha-solo.png',sd:'../assets/sd-solo.png'
  };
  assets.yeogyeong='../assets/yeogyeong-expressions.png';
assets.yeogyeongClassSolo='../assets/event-yeogyeong-classroom.png';
assets.yeogyeongHallSolo='../assets/event-yeogyeong-corridor.png';
assets.yeogyeongSD='../assets/sd-yeogyeong.png';
const actors={taei:'김태이',dogyeom:'백도겸',seoha:'같은 학교 여학생'};
  const events=[
    {id:'taei_map_solo',title:'태이 · 지도와 이정표',location:'signpost',owner:'taei',members:['taei'],cg:'taeiSolo',entry:'map',nodes:{
      map:{speaker:'taei',emotion:2,text:'표시가 비슷한데…… 바로 가긴 좀 그렇네.',sd:0,choices:[
        {id:'landmark',label:'지도의 길 모양과 실제 갈림길을 비교한다',next:'checked',minutes:2},
        {id:'pack',label:'지도를 접고, 이동 전에 망토와 짐부터 정리한다',next:'packed',minutes:1}]},
      checked:{speaker:'taei',emotion:5,text:'아, 여기서 한 번 꺾이는구나. 위치부터 맞춰보자.',next:'done'},
      packed:{speaker:'taei',emotion:0,text:'이거 자꾸 걸리네. 끈을 좀 줄여야겠다.',sd:3,next:'done'},
      done:{speaker:'taei',emotion:0,text:'좋아. 서두르지 말자.',end:true,flags:['taei_solo_checked']}
    }},
    {id:'dogyeom_strap_solo',title:'도겸 · 손목 보호대',location:'leather_bench',owner:'dogyeom',members:['dogyeom'],cg:'dogyeomSolo',entry:'strap',nodes:{
      strap:{speaker:'dogyeom',emotion:4,text:'이거 왜 자꾸 돌아가냐.',sd:1,choices:[
        {id:'adjust',label:'버클을 한 칸 조절하고 손목을 움직여 본다',next:'fit',minutes:1},
        {id:'inspect',label:'끈의 접힌 부분과 연결부를 확인한다',next:'crease',minutes:2}]},
      fit:{speaker:'dogyeom',emotion:5,text:'……이 정도면 됐네. 너무 조이면 손이 안 돌아가고.',next:'done'},
      crease:{speaker:'dogyeom',emotion:0,text:'여기가 접혔네. 당기기만 해선 안 되는 거였냐.',sd:4,next:'done'},
      done:{speaker:'dogyeom',emotion:0,text:'됐어. 이제 안 걸리네.',end:true,flags:['dogyeom_solo_strap']}
    }},
    {id:'seoha_bird_solo',title:'여학생 · 우물가의 새',location:'well',owner:'seoha',members:['seoha'],cg:'seohaSolo',entry:'bird',nodes:{
      bird:{speaker:'seoha',emotion:5,text:'……왜 안 마시지. 물 보러 온 거 아니었나.',sd:2,choices:[
        {id:'wait',label:'움직이지 않고 잠깐 더 지켜본다',next:'watch',minutes:2},
        {id:'stepback',label:'새가 놀라지 않게 한 걸음 물러선다',next:'space',minutes:1}]},
      watch:{speaker:'seoha',emotion:2,text:'아. 나 보고 있었구나.',sd:5,next:'done'},
      space:{speaker:'seoha',emotion:0,text:'이제 마시네. 내가 너무 가까웠나 봐.',next:'done'},
      done:{speaker:'seoha',emotion:0,text:'……나 뭐 하러 왔더라. 아, 물.',end:true,flags:['seoha_solo_bird']}
    }}
  ];
  actors.yeogyeong='차여경';
  events.push(
    {id:'yeogyeong_notebook',title:'여경 · 공책의 빈칸',location:'classroom',owner:'yeogyeong',members:['yeogyeong'],viewer:'taei',cg:'yeogyeongClassSolo',sdAsset:'yeogyeongSD',entry:'ask',nodes:{
      ask:{speaker:'yeogyeong',emotion:0,text:'태이야, 여기 적었어? 나 이 부분만 비었네.',sd:1,choices:[
        {id:'compare',label:'내 공책과 비교해 본다',next:'compare',minutes:2},
        {id:'admit',label:'“나도 못 적었는데.”',next:'admit',minutes:1}]},
      compare:{speaker:'yeogyeong',emotion:1,text:'아, 이거구나. 잠깐만. 여기까지만 적을게.',sd:2,next:'done'},
      admit:{speaker:'yeogyeong',emotion:2,text:'너도? 그럼 둘 다 같은 데서 놓쳤네. 쉬는 시간에 물어보자.',sd:1,next:'done'},
      done:{speaker:'yeogyeong',emotion:1,text:'아무튼 이 부분은 확인해야겠다. 고마워.',end:true,flags:['yeogyeong_notebook_done']}
    }},
    {id:'yeogyeong_pencilcase',title:'여경 · 걸린 지퍼',location:'school_corridor',owner:'yeogyeong',members:['yeogyeong'],viewer:'taei',cg:'yeogyeongHallSolo',sdAsset:'yeogyeongSD',entry:'zip',nodes:{
      zip:{speaker:'yeogyeong',emotion:2,text:'아, 또 걸렸어. 태이야, 안에 뭐 끼었는지 좀 보여?',sd:3,choices:[
        {id:'lining',label:'안감이 끼인 곳을 가리킨다',next:'lining',minutes:1},
        {id:'empty',label:'내용물을 가방에 옮기고 확인해 보자고 한다',next:'empty',minutes:2}]},
      lining:{speaker:'yeogyeong',emotion:5,text:'여기? 아, 보인다. 잠깐, 반대로 조금만 당기면…….',sd:3,next:'done'},
      empty:{speaker:'yeogyeong',emotion:0,text:'그래야겠다. 펜 떨어지면 좀 잡아줘.',sd:4,next:'done'},
      done:{speaker:'yeogyeong',emotion:1,text:'됐다. 세게 당겼으면 찢어질 뻔했네. 고마워.',sd:5,end:true,flags:['yeogyeong_pencilcase_done']}
    }}
  );

  assets.yeogyeongFantasy='../assets/yeogyeong-fantasy-expressions.png';
  assets.yeogyeongOutfit='../assets/yeogyeong-fantasy-outfit.png';
  assets.yeogyeongHealSolo='../assets/event-yeogyeong-healing.png';
  assets.yeogyeongGateSolo='../assets/event-yeogyeong-gate.png';
  assets.yeogyeongFantasySD='../assets/sd-yeogyeong-fantasy.png';
  events.push(
    {id:'yeogyeong_healing_solo',title:'여경 · 작은 치유의 빛',location:'inn_practice_table',owner:'yeogyeong',members:['yeogyeong'],cg:'yeogyeongHealSolo',portraitAsset:'yeogyeongFantasy',sdAsset:'yeogyeongFantasySD',entry:'practice',nodes:{
      practice:{speaker:'yeogyeong',emotion:5,text:'조금만…… 너무 세게 하지는 말고.',sd:1,choices:[
        {id:'steady',label:'숨을 고르고 작은 빛을 잠깐 유지해 본다',next:'steady',minutes:2},
        {id:'rest',label:'힘을 풀고 잠시 쉬며 연습을 정리한다',next:'rest',minutes:1}]},
      steady:{speaker:'yeogyeong',emotion:0,text:'아까보다는 덜 흔들리네. 오늘은 여기까지만 하자.',sd:0,next:'done'},
      rest:{speaker:'yeogyeong',emotion:2,text:'긴장해서 어깨에 힘이 들어갔네. 조금 쉬어야겠다.',sd:2,next:'done'},
      done:{speaker:'yeogyeong',emotion:1,text:'사람한테 쓰려면 더 배워야겠지.',end:true,flags:['yeogyeong_healing_practice_done']}
    }},
    {id:'yeogyeong_gate_solo',title:'여경 · 울타리 옆의 소리',location:'village_gate',owner:'yeogyeong',members:['yeogyeong'],cg:'yeogyeongGateSolo',portraitAsset:'yeogyeongFantasy',sdAsset:'yeogyeongFantasySD',entry:'rustle',nodes:{
      rustle:{speaker:'yeogyeong',emotion:3,text:'……뭐야. 방금 거기서 소리 났는데.',sd:3,choices:[
        {id:'watch',label:'울타리와 거리를 두고 잠깐 살펴본다',next:'bird',minutes:2},
        {id:'light',label:'등불이 있는 쪽으로 물러나 확인한다',next:'light',minutes:1}]},
      bird:{speaker:'yeogyeong',emotion:0,text:'새였네. 아…… 놀랐잖아.',sd:4,next:'done'},
      light:{speaker:'yeogyeong',emotion:2,text:'여기서는 잘 보인다. 새가 나뭇잎 건드린 거구나.',sd:4,next:'done'},
      done:{speaker:'yeogyeong',emotion:1,text:'괜찮아. 천천히 가면 돼.',sd:5,end:true,flags:['yeogyeong_gate_checked']}
    }}
  );

  assets.woojin='../assets/woojin-expressions.png';
  assets.woojinDesign='../assets/woojin-design.png';
  assets.woojinCrateSolo='../assets/woojin-cutscenes.png';
  assets.woojinRestSolo='../assets/woojin-cutscenes.png';
  assets.woojinSD='../assets/sd-woojin.png';
  actors.woojin='정우진(시안)';
  events.push(
    {id:'woojin_crate_solo',title:'우진 · 풀린 매듭',location:'storeroom_table',owner:'woojin',members:['woojin'],cg:'woojinCrateSolo',cgPanel:0,sdAsset:'woojinSD',entry:'knot',nodes:{
      knot:{speaker:'woojin',emotion:5,text:'들기 전에 이거부터 봐야겠네.',sd:0,choices:[
        {id:'retie',label:'매듭을 풀어 다시 묶는다',next:'retie',minutes:2},
        {id:'check',label:'끈이 닳은 곳부터 확인한다',next:'check',minutes:1}]},
      retie:{speaker:'woojin',emotion:5,text:'이렇게 묶어야 덜 풀리지. 한 번 당겨 보고.',sd:1,next:'done'},
      check:{speaker:'woojin',emotion:2,text:'끝이 좀 닳았네. 무거운 건 안 넣는 게 낫겠다.',sd:0,next:'done'},
      done:{speaker:'woojin',emotion:1,text:'됐네. 그래도 밑에서 받쳐 들어야지.',sd:2,end:true,flags:['woojin_crate_checked']}
    }},
    {id:'woojin_rest_solo',title:'우진 · 잠깐 쉬는 시간',location:'inn_step',owner:'woojin',members:['woojin'],cg:'woojinRestSolo',cgPanel:1,sdAsset:'woojinSD',entry:'sit',nodes:{
      sit:{speaker:'woojin',emotion:0,text:'아…… 계속 서 있었더니 허리가 뻐근하네.',sd:3,choices:[
        {id:'stretch',label:'컵을 내려두고 어깨를 천천히 푼다',next:'stretch',minutes:2},
        {id:'drink',label:'물을 한 모금 마시고 잠깐 앉아 있는다',next:'drink',minutes:1}]},
      stretch:{speaker:'woojin',emotion:0,text:'좀 낫네. 힘만 주고 있었구나.',sd:4,next:'done'},
      drink:{speaker:'woojin',emotion:1,text:'목말랐네. 물부터 마실걸.',sd:3,next:'done'},
      done:{speaker:'woojin',emotion:1,text:'조금만 더 쉬었다 가자.',sd:5,end:true,flags:['woojin_rest_done']}
    }}
  );
  const data={version:2,assets,actors,events,emotions:['평상시','작은 웃음','걱정·의아함','놀람','짜증','집중·딴생각']};
  if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.StoryKitData=data;
})(globalThis);
