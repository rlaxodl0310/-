(function(root){
  const assets={
    taei:'../assets/taei-expressions.png',dogyeom:'../assets/dogyeom-expressions.png',seoha:'../assets/seoha-expressions.png',
    taeiSolo:'../assets/event-taei-solo.png',dogyeomSolo:'../assets/event-dogyeom-solo.png',seohaSolo:'../assets/event-seoha-solo.png',sd:'../assets/sd-solo.png'
  };
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
  const data={version:2,assets,actors,events,emotions:['평상시','작은 웃음','걱정·의아함','놀람','짜증','집중·딴생각']};
  if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.StoryKitData=data;
})(globalThis);
