(function(root){
const transfers={
 "taei":{src:'assets/taei-earth.webp',frame:[217, 27, 285, 1026]},
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
  front:[[88, 15, 152, 571], [343, 16, 247, 570], [693, 16, 139, 568], [950, 17, 285, 569]],
  back:[[85, 642, 153, 570], [327, 644, 272, 569], [689, 644, 189, 568], [951, 644, 273, 569]],
 },
 fantasy:{
  src:'map/assets/taei-walk-fantasy.webp',
  front:[[73, 13, 177, 581], [338, 18, 277, 571], [705, 18, 137, 574], [963, 23, 274, 566]],
  back:[[76, 639, 169, 588], [330, 644, 277, 579], [698, 644, 149, 582], [958, 651, 270, 576]],
 },
};
})(globalThis);
