(function(root){
const transfers={
 "taei":{src:'assets/taei-earth.webp',frame:[210,27,300,1024]},
 "dogyeom":{src:'assets/dogyeom-earth.webp',frame:[176,28,366,1024]},
 "yeogyeong":{src:'assets/yeogyeong-standing.png',frame:[258,13,450,1525]},
 "seoha":{src:'assets/seoha-standing.png',frame:[313,9,422,1510]},
 "yui":{src:'assets/yui-standing.png',frame:[187,14,480,1747]},
 "dogyeom-childhood-friend":{src:'assets/childhood-friend-standing.png',frame:[298,39,433,1548]},
};
function standing(id){
 if(!id)return null;
 if(Object.hasOwn(transfers,id))return transfers[id];
 const look=root.CharacterContent.get(id)?.looks.default;
 return look?{src:look.src,frame:[look.x,look.y,look.w,look.h]}:null;
}
root.WalkCharacter={
 standing,
 earth:{
  src:'map/assets/taei-walk-earth.webp',
  front:[[91, 16, 151, 569], [361, 19, 229, 563], [713, 18, 136, 564], [970, 20, 263, 561]],
  back:[[92, 642, 144, 567], [342, 646, 255, 564], [707, 646, 169, 563], [967, 647, 260, 562]],
 },
 fantasy:{
  src:'map/assets/taei-walk-fantasy.webp',
  front:[[73, 13, 177, 581], [338, 18, 277, 571], [705, 18, 137, 574], [963, 23, 274, 566]],
  back:[[76, 639, 169, 588], [330, 644, 277, 579], [698, 644, 149, 582], [958, 651, 270, 576]],
 },
};
})(globalThis);
