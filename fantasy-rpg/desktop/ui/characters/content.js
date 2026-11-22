(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.CharacterContent=f();})(globalThis,()=>{
const records=[{"id": "cheona", "name": "천아", "age": 19, "species": "뱀 수인", "origin": "fantasy", "unknownName": "은백색 머리의 뱀 수인", "preferredWeapons": ["dagger"], "trait": null, "looks": {"default": {"src": "assets/cheona-looks.webp", "x": 0, "y": 0, "w": 512, "h": 768, "imageWidth": 1024, "imageHeight": 1536}, "street": {"src": "assets/cheona-looks.webp", "x": 512, "y": 0, "w": 512, "h": 768, "imageWidth": 1024, "imageHeight": 1536}, "help": {"src": "assets/cheona-looks.webp", "x": 512, "y": 768, "w": 512, "h": 768, "imageWidth": 1024, "imageHeight": 1536}, "fallen": {"src": "assets/cheona-fallen.webp", "x": 0, "y": 0, "w": 1211, "h": 1299, "imageWidth": 1211, "imageHeight": 1299}, "sleep": {"src": "assets/cheona-sleep.webp", "x": 0, "y": 0, "w": 640, "h": 1536, "imageWidth": 1024, "imageHeight": 1536}}, "sd": {"default": {"src": "assets/cheona-sd.webp", "x": 0, "y": 0, "w": 600, "h": 656, "imageWidth": 1199, "imageHeight": 1312}, "playful": {"src": "assets/cheona-sd.webp", "x": 600, "y": 0, "w": 599, "h": 656, "imageWidth": 1199, "imageHeight": 1312}, "surprised": {"src": "assets/cheona-sd.webp", "x": 0, "y": 656, "w": 600, "h": 656, "imageWidth": 1199, "imageHeight": 1312}, "street": {"src": "assets/cheona-sd.webp", "x": 600, "y": 656, "w": 599, "h": 656, "imageWidth": 1199, "imageHeight": 1312}, "sleep": {"src": "assets/cheona-sleep.webp", "x": 640, "y": 820, "w": 384, "h": 716, "imageWidth": 1024, "imageHeight": 1536}}, "pixel": {"src": "assets/cheona-pixels.webp", "frames": [[0, 0, 443, 443], [443, 0, 444, 443], [887, 0, 443, 443], [1330, 0, 444, 443], [0, 443, 443, 444], [443, 443, 444, 444], [887, 443, 443, 444], [1330, 443, 444, 444]], "height": 443, "imageWidth": 1774, "imageHeight": 887}, "motion": {"name": "상체를 비껴 흐르듯 짧게 빠지기", "lean": -6, "step": 5, "turn": -13, "side": 12, "tempo": 1.15}, "persona": "뱀 수인 천아. 19살. 직업·태이와의 과거 관계·성격 세부는 미정. 단검류를 주로 사용하지만 전투 직업·정수·스킬을 임의 부여하지 않는다. 은백색 긴 머리, 나른한 보랏빛 눈, 밝은 피부와 갈라진 뱀 혀. 별도 뱀 동반자는 없다. 현대식 흰 재킷·보라 안감·연두 배색과 흰 나시·회색 스타킹·운동화가 기본. 나시는 평소와 앉은 장면 모두 한 겹이며 검정 이너를 새로 추가하지 않는다. 검정·연두 대체 의상은 모자 없이 메시와 안쪽 옷을 분리한다. 현실에는 등장하지 않는다. 만남·호감·파티 합류는 미정이다. 전이자 고유 특성 없음. 잠옷은 검정·흰 프릴 상의와 앞치마, 옆트임 있는 검정 일자 치마, 발끝을 덮는 스타킹이며 구두는 신지 않는다. 잠옷으로 자동 갈아입거나 장면을 강제하지 않는다. 키 167cm, 몸무게 46kg. 이는 설정 정보이며 상대가 알기 전 대사로 자동 공개하지 않는다.", "portraits": {"sleep": {"src": "assets/cheona-sleep.webp", "x": 640, "y": 45, "w": 384, "h": 540, "imageWidth": 1024, "imageHeight": 1536}}, "heightCm": 167, "weightKg": 46}, {"id": "fafnir", "name": "파프니르", "age": 20, "species": "수룡 수인", "origin": "fantasy", "unknownName": "푸른 머리의 수룡 수인", "preferredWeapons": ["magic"], "roles": ["mage"], "combatStyle": "magic", "trait": null, "looks": {"default": {"src": "assets/fafnir-looks.webp", "x": 0, "y": 0, "w": 630, "h": 623, "imageWidth": 1261, "imageHeight": 1247}, "help": {"src": "assets/fafnir-looks.webp", "x": 630, "y": 0, "w": 631, "h": 623, "imageWidth": 1261, "imageHeight": 1247}, "fallen": {"src": "assets/fafnir-looks.webp", "x": 0, "y": 623, "w": 630, "h": 624, "imageWidth": 1261, "imageHeight": 1247}}, "sd": {"default": {"src": "assets/fafnir-looks.webp", "x": 630, "y": 623, "w": 631, "h": 624, "imageWidth": 1261, "imageHeight": 1247}}, "pixel": {"src": "assets/fafnir-looks.webp", "frames": [[630, 623, 631, 624]], "height": 624, "imageWidth": 1261, "imageHeight": 1247, "format": "illustrated-sd"}, "motion": {"name": "몸을 틀어 거리를 지키며 마나 모으기", "lean": 4, "step": 3, "turn": 8, "side": 7, "tempo": 0.9}, "persona": "20살 여성 수룡 수인 파프니르. 마법을 주로 쓰는 메이지. 자기 종족의 강함을 알고 자부심과 자기주장이 강한 말괄양이로 차별에도 주눅들지 않는다. 푸른 앞머리와 밝은 금발 안쪽 긴 머리, 작은 뿔, 검정·금색 의상과 작고 유연한 유기적 비늘·지느러미 꼬리를 유지한다. 로봇 같은 거대한 꼬리로 되돌리지 않는다. 전용 속성·스킬·정수·과거·태이와의 관계는 미정. 현실에 등장하거나 파티에 자동 합류하지 않는다. 전이자 전용 고유 특성 없음. 키 154cm, 몸무게 53kg. 이는 설정 정보이며 상대가 알기 전 대사로 자동 공개하지 않는다.", "heightCm": 154, "weightKg": 53}];
get('cheona').looks.help=fullImage('cheona-help.webp',720,1080);
function combatAtlas(id,scale,tempo,resolution=1){
  const cell=96*resolution;
  return {
    src:'assets/'+id+'-combat.png',
    frames:Array.from({length:12},(_,i)=>[i%4*cell,Math.floor(i/4)*cell,cell,cell]),
    imageWidth:4*cell,imageHeight:3*cell,anchor:[cell/2,88*resolution],scale:scale/resolution,tempo,
  };
}
function combatFrame(atlas,index){
  const [x,y,w,h]=atlas.frames[index];
  return {src:'battle/'+atlas.src,x,y,w,h,imageWidth:atlas.imageWidth,imageHeight:atlas.imageHeight};
}
get('cheona').combatSprite=combatAtlas('cheona',.96,1.15);
get('fafnir').combatSprite=combatAtlas('fafnir',.89,.9,2);
const fenriAtlas=combatAtlas('fenri',.93,1.04,2);
const fenriSD=combatFrame(fenriAtlas,0);
records.push({
  id:'fenri', name:'펜리', age:null, species:'개 수인', origin:'fantasy',
  unknownName:'붉은 머리의 개 수인', heightCm:161, weightKg:52,
  preferredWeapons:['sword'], roles:['slayer'], trait:null,
  looks:{default:fullImage('fenri-standing.webp',720,1080)}, sd:{default:fenriSD},
  pixel:{src:fenriSD.src,battleSrc:fenriAtlas.src,frames:[fenriAtlas.frames[0]],imageWidth:fenriAtlas.imageWidth,imageHeight:fenriAtlas.imageHeight},
  combatSprite:fenriAtlas,
  motion:{name:'짧게 발을 들여 검을 크게 휘두르기',lean:7,step:7,turn:9,side:9,tempo:1.04},
  persona:'개 수인 펜리. 검을 사용하는 슬레이어. 161cm, 52kg. 나이는 미정. 붉은 머리, 금빛 눈, 개 귀와 꼬리, 짧은 치마를 유지한다. 평소 장난기와 애교가 많지만 차별을 받으면 주눅들고 소심해진다. 이세계 현지인으로 현실에 등장하지 않는다. 이름 선공개나 자동 합류 없음.',
});
function fullImage(src,w,h){
  return {src:'assets/'+src,x:0,y:0,w,h,imageWidth:w,imageHeight:h};
}
records.push({
  id:'janghwa',name:'장화',age:null,species:'인간족',heightCm:157,weightKg:49,
  unknownName:'붉은 단발의 인간족',requiresStoryIntroduction:true,
  persona:'인간족 장화. 157cm, 49kg. 차분하고 칼같으며 시크하지만 당황하면 말을 더듬는다. 마력실로 싸우며 세부 기술과 출신은 미정이다. 처음 등장하거나 동행하는 계기는 사용자 입력과 현장 근거를 따른다.',
  preferredWeapons:['manaThread'],combatStyle:'magic',
  combatSprite:combatAtlas('janghwa',.93,.94),
  motion:{name:'손목을 돌려 실을 뻗기',lean:2,step:4,turn:-8,side:6,tempo:.94},
  looks:{
    default:fullImage('janghwa-standing.webp',720,1080),
    rear:fullImage('janghwa-rear.webp',720,1080),
    casual:fullImage('janghwa-casual.webp',720,1080),
    help:fullImage('janghwa-talk.webp',720,1080),
    guard:fullImage('janghwa-guard.webp',720,1080),
    cast:fullImage('janghwa-cast.webp',720,1080),
    hit:fullImage('janghwa-hit.webp',720,1080),
    flustered:fullImage('janghwa-flustered.webp',720,1080),
    alternate:fullImage('janghwa-alternate.webp',720,1080),
    alternateCast:fullImage('janghwa-alternate-cast.webp',720,1080),
  },
  sd:{default:fullImage('janghwa-sd.webp',512,512),alternate:fullImage('janghwa-alternate-sd.webp',512,512)},
},{
  id:'selsi',name:'셀시',age:null,species:'개구리 수인',heightCm:168,weightKg:50,
  unknownName:'은회색 단발의 개구리 수인',requiresStoryIntroduction:true,
  persona:'개구리 수인 셀시. 168cm, 50kg. 감각 반응이 둔하고 무심하며 귀찮음이 많다. 무기·직업·전용 전투 기술은 미정이다. 처음 등장하거나 동행하는 계기는 사용자 입력과 현장 근거를 따른다.',
  preferredWeapons:[],
  looks:{
    default:fullImage('selsi-standing.webp',720,1080),
    casual:fullImage('selsi-casual.webp',720,1080),
    rear:fullImage('selsi-rear.webp',720,1080),
    help:fullImage('selsi-talk.webp',720,1080),
    ready:fullImage('selsi-ready.webp',720,1080),
    sigh:fullImage('selsi-sigh.webp',720,1080),
  },
  sd:{default:fullImage('selsi-sd.webp',512,512)},
  combatSprite:combatAtlas('selsi',.96,.85),
  motion:{name:'상체를 느슨하게 두고 한 걸음 비키기',lean:-2,step:4,turn:5,side:11,tempo:.85},
},{
  id:'rachel',name:'레이첼',age:null,species:'엘프족',heightCm:172,weightKg:54,
  unknownName:'금발의 엘프',origin:'fantasy',requiresStoryIntroduction:true,
  persona:'엘프족 공주 레이첼. 172cm, 54kg. 귀족으로 고상하게 자랐고 레이피어를 사용한다. 벌레를 무서워한다. 나이·가문명·출신지·첫 만남·전용 기술은 미정이다. 사용자가 이름을 불러도 게임 속 인물은 소개되기 전까지 정체를 알지 못한다. 참고 그림의 불꽃은 능력이 아니다.',
  preferredWeapons:['rapier'],lookLabels:{attack:'레이피어 공격'},
  motion:{name:'앞발로 간격을 재고 가볍게 돌진하기',lean:5,step:6,turn:-5,side:4,tempo:1.08},
  looks:{
    default:fullImage('rachel-standing.webp',720,1080),
    casual:fullImage('rachel-casual.webp',720,1080),
    rear:fullImage('rachel-rear.webp',720,1080),
    help:fullImage('rachel-talk.webp',720,1080),
    attack:fullImage('rachel-rapier.webp',720,1080),
    startled:fullImage('rachel-startled.webp',720,1080),
  },
  sd:{default:fullImage('rachel-sd.webp',512,512)},
  combatSprite:combatAtlas('rachel',.98,1.08),
},{
  id:'spike',name:'스파이크',age:null,species:'인간·엘프 혼혈',heightCm:195,weightKg:91,
  unknownName:'거대한 도끼를 든 거구',requiresStoryIntroduction:true,
  persona:'인간과 엘프 혼혈 스파이크. 195cm, 91kg의 거구. 거대한 도끼를 쓰고 말과 행동이 시원시원하며 성격은 불같다. 나이·출신지·첫 만남·전용 기술은 미정이다. 얼음이나 번개 능력을 임의로 부여하지 않는다.',
  preferredWeapons:['axe'],lookLabels:{attack:'도끼 공격'},
  motion:{name:'디딤발로 중심을 잡고 크게 휘두르기',lean:10,step:2,turn:15,side:5,tempo:.78},
  looks:{
    default:fullImage('spike-standing.webp',720,1080),
    casual:fullImage('spike-casual.webp',720,1080),
    rear:fullImage('spike-rear.webp',720,1080),
    help:fullImage('spike-talk.webp',720,1080),
    attack:fullImage('spike-axe.webp',720,1080),
    irritated:fullImage('spike-irritated.webp',720,1080),
  },
  sd:{default:fullImage('spike-sd.webp',512,512)},
  combatSprite:combatAtlas('spike',1,.78),
},{
  id:'jave',name:'제이브',age:18,species:'인간족',heightCm:178,weightKg:71,
  unknownName:'보라색 머리의 인간족',requiresStoryIntroduction:true,
  persona:'인간족 제이브. 18살, 178cm, 71kg. 유쾌하고 시원시원한 쾌남이다. 출신·직업·무기·전용 기술·첫 만남은 미정이다. 불꽃 능력과 흰 생물의 동행을 임의로 확정하지 않는다.',
  preferredWeapons:[],
  motion:{name:'한 발 가볍게 디디고 상체를 열기',lean:6,step:8,turn:-7,side:13,tempo:1.12},
  looks:{
    default:fullImage('jave-standing.webp',720,1080),
    casual:fullImage('jave-casual.webp',720,1080),
    rear:fullImage('jave-rear.webp',720,1080),
    help:fullImage('jave-talk.webp',720,1080),
    ready:fullImage('jave-ready.webp',720,1080),
    laughing:fullImage('jave-laughing.webp',720,1080),
  },
  sd:{default:fullImage('jave-sd.webp',512,512)},
  combatSprite:combatAtlas('jave',.97,1.12),
},{
  id:'aquila',name:'아킬라',age:null,species:'엘프족',heightCm:170,weightKg:50,
  unknownName:'큰 방패를 든 은회색 머리 엘프',requiresStoryIntroduction:true,
  persona:'엘프족 아킬라. 170cm, 50kg. 거대한 방패와 대검을 쓴다. 과묵하고 관찰력이 좋다. 위험할 때 먼저 앞에 서고 약속을 무겁게 여긴다. 혼자 감당하려다 도움을 늦게 청하기도 한다. 나이·출신·직업·전용 기술·첫 만남은 미정이다.',
  preferredWeapons:['shield','greatsword'],lookLabels:{attack:'대검 공격',guard:'대형 방패 방어',cutscene:'앞을 막아서는 순간 · 컷신'},
  motion:{name:'방패 쪽 발을 굳히고 짧게 디디기',lean:7,step:2.5,turn:11,side:3,tempo:.81},
  looks:{
    default:fullImage('aquila-standing.webp',720,1080),
    casual:fullImage('aquila-casual.webp',720,1080),
    rear:fullImage('aquila-rear.webp',720,1080),
    help:fullImage('aquila-talk.webp',720,1080),
    guard:fullImage('aquila-guard.webp',720,1080),
    attack:fullImage('aquila-sword.webp',720,1080),
    cutscene:fullImage('aquila-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('aquila-sd.webp',512,512)},
  combatSprite:combatAtlas('aquila',.96,.81),
},{
  id:'kiriel',name:'키리엘',age:null,species:'엘프족',heightCm:170,weightKg:53,
  unknownName:'큰 활을 든 갈색 머리 엘프',requiresStoryIntroduction:true,
  persona:'엘프족 키리엘. 170cm, 53kg. 활을 쓰는 원거리 딜러다. 관찰력이 좋고 건조한 농담을 던진다. 멀리서 동료의 빈틈을 먼저 알아채지만 급할수록 짧게 경고해 오해를 사기도 한다. 나이·출신·전용 기술·첫 만남은 미정이다.',
  preferredWeapons:['bow'],combatStyle:'bow',roles:['ranged'],
  lookLabels:{attack:'활 조준과 사격',cutscene:'위험을 알아챈 순간 · 컷신'},
  motion:{name:'발을 옆으로 옮기고 차분히 겨누기',lean:-3,step:5.5,turn:-9,side:14,tempo:1.02},
  looks:{
    default:fullImage('kiriel-standing.webp',720,1080),
    casual:fullImage('kiriel-casual.webp',720,1080),
    rear:fullImage('kiriel-rear.webp',720,1080),
    help:fullImage('kiriel-talk.webp',720,1080),
    attack:fullImage('kiriel-bow.webp',720,1080),
    cutscene:fullImage('kiriel-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('kiriel-sd.webp',512,512)},
  combatSprite:combatAtlas('kiriel',.96,1.02),
},{
  id:'palanus',name:'팔라누스',age:null,species:'인간족',heightCm:170,weightKg:54,
  unknownName:'붉고 검은 대검을 든 인간족',requiresStoryIntroduction:true,
  persona:'인간족 팔라누스. 170cm, 54kg. 대검을 사용한다. 침착하고 위급할 때 판단이 빠르다. 상황이 정리되면 짧은 농담으로 긴장을 풀기도 한다. 남의 실수에는 관대하지만 자기 실수는 오래 곱씹는다. 나이·출신·직업·전용 기술·첫 만남은 미정이다.',
  preferredWeapons:['greatsword'],
  lookLabels:{attack:'대검 공격',cutscene:'판단하는 순간 · 컷신'},
  motion:{name:'짧게 중심을 옮긴 뒤 대검을 곧게 휘두르기',lean:4,step:6.5,turn:-10,side:8,tempo:.88},
  looks:{
    default:fullImage('palanus-standing.webp',720,1080),
    casual:fullImage('palanus-casual.webp',720,1080),
    rear:fullImage('palanus-rear.webp',720,1080),
    help:fullImage('palanus-talk.webp',720,1080),
    attack:fullImage('palanus-sword.webp',720,1080),
    cutscene:fullImage('palanus-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('palanus-sd.webp',512,512)},
  combatSprite:combatAtlas('palanus',.96,.88),
},{
  id:'rosie',name:'로지',age:null,species:'인간족',heightCm:167,weightKg:49,
  unknownName:'남색 베일을 쓴 은발 인간족',requiresStoryIntroduction:true,
  persona:'인간족 로지. 167cm, 49kg. 검을 사용한다. 예의 바르고 낯선 사람부터 챙기지만 부당한 일에는 부드러운 말투로도 단호하게 맞선다. 사소한 농담을 문자 그대로 받아들이는 면이 있다. 나이·출신·직업·전용 기술·첫 만남은 미정이다.',
  preferredWeapons:['sword'],
  lookLabels:{attack:'검 공격',cutscene:'말없이 결심하는 순간 · 컷신'},
  motion:{name:'검을 낮게 두고 짧게 비켜 베기',lean:-4,step:4.5,turn:-11,side:8,tempo:.98},
  looks:{
    default:fullImage('rosie-standing.webp',720,1080),
    casual:fullImage('rosie-casual.webp',720,1080),
    rear:fullImage('rosie-rear.webp',720,1080),
    help:fullImage('rosie-talk.webp',720,1080),
    attack:fullImage('rosie-sword.webp',720,1080),
    cutscene:fullImage('rosie-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('rosie-sd.webp',512,512)},
  combatSprite:combatAtlas('rosie',.95,.98),
},{
  id:'ace',name:'에이스',age:18,species:'인간족',heightCm:174,weightKg:62,
  unknownName:'하늘색 머리의 검객',requiresStoryIntroduction:true,
  persona:'18살 인간족 에이스. 174cm, 62kg이며 검을 사용한다. 승부를 즐기고 상대의 실력은 솔직하게 인정한다. 패배를 담담하게 받아들인 뒤 혼자 안 풀린 동작을 다시 연습한다. 출신지·직업·전용 기술·첫 만남은 미정이다.',
  preferredWeapons:['sword'],
  lookLabels:{attack:'검 공격',cutscene:'동작을 되짚는 순간 · 컷신'},
  motion:{name:'발을 가볍게 옮기고 간결하게 베기',lean:5.5,step:6,turn:-8,side:12,tempo:1.04},
  looks:{
    default:fullImage('ace-standing.webp',720,1080),
    casual:fullImage('ace-casual.webp',720,1080),
    rear:fullImage('ace-rear.webp',720,1080),
    help:fullImage('ace-talk.webp',720,1080),
    attack:fullImage('ace-sword.webp',720,1080),
    cutscene:fullImage('ace-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('ace-sd.webp',512,512)},
  combatSprite:combatAtlas('ace',.96,1.04),
},{
  id:'evan',name:'에반',age:null,species:'인간족',heightCm:180,weightKg:75,
  unknownName:'푸른 망토를 두른 검과 방패의 검사',requiresStoryIntroduction:true,
  persona:'인간족 에반. 180cm, 75kg. 검과 방패를 사용한다. 진중하지만 편한 사람들과는 장난기가 많다. 동료를 많이 잃어 쉽게 정을 주지 않는다. 동료들의 이름과 사건 경위, 나이·출신·직업·전용 기술·첫 만남은 미정이다.',
  preferredWeapons:['sword','shield'],
  lookLabels:{attack:'검 공격',guard:'방패 방어',cutscene:'말없이 동료를 떠올리는 순간 · 컷신'},
  motion:{name:'방패 쪽에 체중을 싣고 검을 휘두르기',lean:8,step:4.5,turn:10,side:2.5,tempo:.92},
  looks:{
    default:fullImage('evan-standing.webp',720,1080),
    casual:fullImage('evan-casual.webp',720,1080),
    rear:fullImage('evan-rear.webp',720,1080),
    help:fullImage('evan-talk.webp',720,1080),
    guard:fullImage('evan-guard.webp',720,1080),
    attack:fullImage('evan-sword.webp',720,1080),
    cutscene:fullImage('evan-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('evan-sd.webp',512,512)},
  combatSprite:combatAtlas('evan',.98,.92),
},{
  id:'karin',name:'카린',age:null,species:'인간족',heightCm:165,weightKg:45,
  unknownName:'꽃잎 장식 지팡이를 든 보라색 머리 인간족',requiresStoryIntroduction:true,
  persona:'인간족 힐러 카린. 165cm, 45kg. 마음이 따뜻하며 다친 사람에게 먼저 안심시키는 말을 건넨다. 나이·출신지·첫 만남·전용 치유 기술의 세부는 미정이다.',
  preferredWeapons:['staff'],roles:['healer'],
  lookLabels:{attack:'지팡이 동작',cutscene:'다친 이를 안심시키는 순간 · 컷신'},
  motion:{name:'지팡이를 가까이 두고 작은 걸음으로 움직이기',lean:1,step:3.5,turn:4,side:6.5,tempo:.88},
  looks:{
    default:fullImage('karin-standing.webp',720,1080),
    casual:fullImage('karin-casual.webp',720,1080),
    rear:fullImage('karin-rear.webp',720,1080),
    help:fullImage('karin-talk.webp',720,1080),
    attack:fullImage('karin-staff.webp',720,1080),
    cutscene:fullImage('karin-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('karin-sd.webp',512,512)},
  combatSprite:combatAtlas('karin',.94,.88),
});
records.push({
  id:'taeo',name:'태오',age:null,species:'엘프족',heightCm:187,weightKg:74,
  unknownName:'푸른 날의 태도를 든 흑발 엘프',requiresStoryIntroduction:true,
  persona:'엘프족 태오. 187cm, 74kg. 성격은 냉정하고 냉철하며 태도를 사용한다. 처음 등장하는 계기는 사용자 입력과 현장 근거를 따른다.',
  preferredWeapons:['sword'],
  lookLabels:{attack:'태도 공격',cutscene:'태도를 뽑는 순간 · 컷신'},
  motion:{name:'낮게 몸을 틀어 태도를 뽑기',lean:-3.5,step:6.5,turn:12,side:8.5,tempo:.97},
  looks:{
    default:fullImage('taeo-standing.webp',720,1080),
    casual:fullImage('taeo-casual.webp',720,1080),
    rear:fullImage('taeo-rear.webp',720,1080),
    help:fullImage('taeo-talk.webp',720,1080),
    attack:fullImage('taeo-cutscene.webp',720,1080),
    cutscene:fullImage('taeo-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('taeo-sd.webp',512,512)},
  combatSprite:combatAtlas('taeo',1,.97),
});
records.push({
  id:'trude',name:'트루드',age:null,species:'올빼미 수인',heightCm:168,weightKg:51,
  unknownName:'붉은 머리의 올빼미 수인',requiresStoryIntroduction:true,
  persona:'올빼미 수인 트루드. 168cm, 51kg. 호기심과 승부욕이 강하며 평소엔 농담을 즐기고 낯선 소리에 민감하다. 청백색 결정 날의 장병기를 사용한다. 첫 만남과 합류 조건은 미정이다.',
  preferredWeapons:['axe'],
  lookLabels:{smile:'장난스러운 미소',alert:'낯선 소리에 귀 기울이기',attack:'결정 날 장병기 공격',cutscene:'승부에 집중하는 순간 · 컷신'},
  motion:{name:'장병기를 몸 옆으로 당겨 휘두르기',lean:6.5,step:5.5,turn:-10.5,side:9.5,tempo:1.08},
  looks:{
    default:fullImage('trude-standing.webp',720,1080),
    casual:fullImage('trude-casual.webp',720,1080),
    rear:fullImage('trude-rear.webp',720,1080),
    help:fullImage('trude-talk.webp',720,1080),
    smile:fullImage('trude-smile.webp',720,1080),
    alert:fullImage('trude-alert.webp',720,1080),
    attack:fullImage('trude-cutscene.webp',720,1080),
    cutscene:fullImage('trude-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('trude-sd.webp',512,512)},
  combatSprite:combatAtlas('trude',.96,1.08),
});
records.push({
  id:'espada',name:'에스파다',age:null,species:'인간족',heightCm:164,weightKg:44,
  unknownName:'연보라색 긴 머리의 인간족',requiresStoryIntroduction:true,
  persona:'인간족 에스파다. 164cm, 44kg. 말수가 적고 관찰력이 좋다. 긴장한 동료에게 무심한 듯 농담을 건네며 단검을 사용한다. 첫 만남과 합류 조건은 미정이다.',
  preferredWeapons:['dagger'],
  lookLabels:{observe:'조용히 관찰하기',attack:'단검을 든 자세'},
  motion:{name:'상대를 살피며 짧게 발을 옮겨 단검 내밀기',lean:-4.5,step:6,turn:-9.5,side:11,tempo:1.12},
  looks:{
    default:fullImage('espada-standing.webp',720,1080),
    rear:fullImage('espada-rear.webp',720,1080),
    help:fullImage('espada-talk.webp',720,1080),
    observe:fullImage('espada-observe.webp',720,1080),
    attack:fullImage('espada-dagger.webp',720,1080),
  },
  sd:{default:fullImage('espada-sd.webp',512,512)},
  combatSprite:combatAtlas('espada',.93,1.12),
});
records.push({
  id:'restia',name:'레스티아',age:null,species:'인간족',heightCm:165,weightKg:47,
  unknownName:'은발의 레이피어 검사',requiresStoryIntroduction:true,
  persona:'인간족 레스티아. 165cm, 47kg. 예의 바르고 상대를 세심하게 살피지만 승부가 걸리면 쉽게 물러서지 않는다. 레이피어를 사용한다.',
  preferredWeapons:['rapier'],
  lookLabels:{smile:'예의 바른 미소',focus:'승부에 집중하기',attack:'레이피어 공격'},
  motion:{name:'발끝을 옮겨 가볍게 찌르기',lean:3.5,step:6.25,turn:5.5,side:7.5,tempo:1.09},
  looks:{
    default:fullImage('restia-standing.webp',720,1080),
    rear:fullImage('restia-rear.webp',720,1080),
    casual:fullImage('restia-casual.webp',720,1080),
    help:fullImage('restia-talk.webp',720,1080),
    smile:fullImage('restia-smile.webp',720,1080),
    focus:fullImage('restia-focus.webp',720,1080),
    attack:fullImage('restia-cutscene.webp',720,1080),
    cutscene:fullImage('restia-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('restia-sd.webp',512,512)},
  combatSprite:combatAtlas('restia',.94,1.09),
},{
  id:'lir',name:'리르',age:null,species:'늑대 수인',heightCm:167,weightKg:52,
  unknownName:'남색과 흰색 머리의 늑대 수인',requiresStoryIntroduction:true,
  persona:'늑대 수인 리르. 167cm, 52kg. 낯선 일행에게 먼저 말을 걸고 뒤처진 동료에게 속도를 맞춘다. 자기 몫을 맡기는 데 서툴고 걱정이 앞서면 동료의 결정까지 대신하려 한다. 잘못을 알면 직접 사과한다. 무기와 과거는 미정이다.',
  preferredWeapons:[],
  lookLabels:{smile:'자신만만한 미소',thanks:'쑥스러운 감사',cutscene:'도움을 받아들이는 순간 · 컷신'},
  motion:{name:'발을 넓게 디디며 자세 낮추기',lean:-2.5,step:5.75,turn:8.5,side:10.5,tempo:1.03},
  looks:{
    default:fullImage('lir-standing.webp',720,1080),
    rear:fullImage('lir-rear.webp',720,1080),
    help:fullImage('lir-talk.webp',720,1080),
    smile:fullImage('lir-smile.webp',720,1080),
    thanks:fullImage('lir-thanks.webp',720,1080),
    cutscene:fullImage('lir-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('lir-sd.webp',512,512)},
  combatSprite:combatAtlas('lir',.95,1.03),
});
records.push({
  id:'nadan',name:'나단',age:null,species:'인간족',heightCm:156,weightKg:44,
  unknownName:'키보다 큰 대검을 든 성기사',requiresStoryIntroduction:true,
  persona:'인간족 성기사 나단. 156cm, 44kg. 성직자와 교주를 호위한다. 천진하고 꾸밈이 없어 의전 용어를 곧이곧대로 받아들이지만, 호위 중에는 위험을 빠르게 알아차린다.',
  preferredWeapons:['greatsword'],
  lookLabels:{relief:'안도하며 미소 짓기',escort:'호위 대상에게 손 내밀기',cutscene:'대검을 들어 호위하기 · 컷신',attack:'대검을 들어 호위하기'},
  motion:{name:'양발로 버티며 긴 대검을 들어 막기',lean:4.25,step:4.75,turn:-7.25,side:6.75,tempo:.91},
  looks:{
    default:fullImage('nadan-standing.webp',720,1080),
    rear:fullImage('nadan-rear.webp',720,1080),
    help:fullImage('nadan-talk.webp',720,1080),
    relief:fullImage('nadan-relief.webp',720,1080),
    escort:fullImage('nadan-escort.webp',720,1080),
    attack:fullImage('nadan-cutscene.webp',720,1080),
    cutscene:fullImage('nadan-cutscene.webp',720,1080),
    casual:fullImage('nadan-casual.webp',720,1080),
  },
  sd:{default:fullImage('nadan-sd.webp',512,512)},
  combatSprite:combatAtlas('nadan',.92,.91),
});
records.push(
  {
    id:'hebnia',name:'헤브니아',age:null,species:'엘프족',heightCm:170,weightKg:50,
    unknownName:'은청색 머리의 엘프',requiresStoryIntroduction:true,origin:'fantasy',
    persona:'엘프족 헤브니아. 170cm, 50kg. 장난기가 많고 헬레니아의 친동생이다. 양손 대검을 사용한다.',
    preferredWeapons:['greatsword'],
    lookLabels:{help:'장난스럽게 웃기',reaction:'승부를 즐기는 표정',cutscene:'대검을 휘두르기 · 컷신'},
    motion:{name:'대검을 휘두르기',lean:4.5,step:6.75,turn:-12.5,side:9.75,tempo:1.06},
    looks:{
    default:fullImage('hebnia-standing.webp',720,1080),
    rear:fullImage('hebnia-rear.webp',720,1080),
    help:fullImage('hebnia-talk.webp',720,1080),
    reaction:fullImage('hebnia-reaction.webp',720,1080),
    cutscene:fullImage('hebnia-cutscene.webp',720,1080),
    attack:fullImage('hebnia-cutscene.webp',720,1080),
    },
    sd:{default:fullImage('hebnia-sd.webp',512,512)},
    combatSprite:combatAtlas('hebnia',0.96,1.06),
  },
  {
    id:'hellenia',name:'헬레니아',age:null,species:'엘프족',heightCm:171,weightKg:52,
    unknownName:'금빛 땋은 머리의 엘프',requiresStoryIntroduction:true,origin:'fantasy',
    persona:'엘프족 헬레니아. 171cm, 52kg. 진중하고 진지하다. 헤브니아의 친언니이며 방패와 중검을 사용한다.',
    preferredWeapons:['sword', 'shield'],
    lookLabels:{help:'진지하게 살피기',reaction:'동생을 걱정하는 표정',cutscene:'방패로 막아 서기 · 컷신'},
    motion:{name:'방패로 막아 서기',lean:-1.75,step:4.25,turn:7.75,side:5.75,tempo:0.93},
    looks:{
    default:fullImage('hellenia-standing.webp',720,1080),
    rear:fullImage('hellenia-rear.webp',720,1080),
    help:fullImage('hellenia-talk.webp',720,1080),
    reaction:fullImage('hellenia-reaction.webp',720,1080),
    cutscene:fullImage('hellenia-cutscene.webp',720,1080),
    guard:fullImage('hellenia-cutscene.webp',720,1080),
    casual:fullImage('hellenia-casual.webp',720,1080),
    },
    sd:{default:fullImage('hellenia-sd.webp',512,512)},
    combatSprite:combatAtlas('hellenia',0.96,0.93),
  },
  {
    id:'biscuit',name:'비스킷',age:null,species:'드워프족',heightCm:138,weightKg:43,
    unknownName:'은빛 머리의 드워프',requiresStoryIntroduction:true,origin:'fantasy',
    persona:'드워프족 비스킷. 138cm, 43kg. 막 대장장이가 된 신참으로, 유쾌하고 능청스럽다. 이야기가 진행되면서 대장장이로 성장한다.',
    preferredWeapons:[],
    lookLabels:{help:'능청스러운 윙크',reaction:'만든 경첩을 보여주기',cutscene:'모루에서 경첩을 두드리기 · 컷신'},
    motion:{name:'모루에서 경첩을 두드리기',lean:5.25,step:5.25,turn:10.25,side:8.75,tempo:1.02},
    looks:{
    default:fullImage('biscuit-standing.webp',720,1080),
    rear:fullImage('biscuit-rear.webp',720,1080),
    help:fullImage('biscuit-talk.webp',720,1080),
    reaction:fullImage('biscuit-reaction.webp',720,1080),
    cutscene:fullImage('biscuit-cutscene.webp',720,1080),
    },
    sd:{default:fullImage('biscuit-sd.webp',512,512)},
    combatSprite:combatAtlas('biscuit',0.78,1.02),
  },
  {
    id:'yunseol',name:'윤설',age:null,species:'인간족',heightCm:161,weightKg:45,
    unknownName:'긴 봉을 든 인간족',requiresStoryIntroduction:true,origin:'fantasy',
    persona:'인간족 윤설. 161cm, 45kg. 느긋하고 말수가 적으며 겨룰 때는 상대 발놀림을 보고 먼저 거리를 잡는다. 긴 봉을 사용한다.',
    preferredWeapons:['staff'],
    lookLabels:{help:'여유롭게 미소 짓기',reaction:'상대의 발놀림을 살피기',cutscene:'긴 봉을 휘두르기 · 컷신'},
    motion:{name:'긴 봉을 휘두르기',lean:-5.75,step:6.75,turn:14,side:11.75,tempo:1.13},
    looks:{
    default:fullImage('yunseol-standing.webp',720,1080),
    rear:fullImage('yunseol-rear.webp',720,1080),
    help:fullImage('yunseol-talk.webp',720,1080),
    reaction:fullImage('yunseol-reaction.webp',720,1080),
    cutscene:fullImage('yunseol-cutscene.webp',720,1080),
    attack:fullImage('yunseol-cutscene.webp',720,1080),
    },
    sd:{default:fullImage('yunseol-sd.webp',512,512)},
    combatSprite:combatAtlas('yunseol',0.91,1.13,2),
  }
);
records.push({
  id:'spina',name:'스피나',age:null,species:'세이블영양 수인',heightCm:167,weightKg:44,
  unknownName:'긴 검은 뿔의 수인',origin:'fantasy',requiresStoryIntroduction:true,
  persona:'세이블영양 수인 스피나. 167cm, 44kg. 차별을 겪은 뒤 말하기 전에 상대 반응을 살핀다. 가까운 사람을 위해 조용히 자리를 내어주는 식으로 마음을 표현한다.',
  preferredWeapons:[],
  lookLabels:{cutscene:'수줍게 두 팔을 아래로 모으기 · 컷신'},
  motion:{name:'한 걸음 비켜 분절 무기 휘두르기',lean:-3.25,step:5.9,turn:11.5,side:10.75,tempo:1.01},
  looks:{
    default:fullImage('spina-standing.webp',720,1080),
    rear:fullImage('spina-rear.webp',720,1080),
    casual:fullImage('spina-casual.webp',720,1080),
    help:fullImage('spina-talk.webp',720,1080),
    cutscene:fullImage('spina-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('spina-sd.webp',512,512)},
  combatSprite:combatAtlas('spina',.94,1.01),
});
records.push({
  id:'halo',name:'헤일로',age:null,species:'라쿤 수인',heightCm:178,weightKg:67,
  unknownName:'붉은 머리의 라쿤 수인',origin:'fantasy',requiresStoryIntroduction:true,
  persona:'라쿤 수인 헤일로. 178cm, 67kg. 쾌활하며 낯선 일행의 긴장을 농담으로 푼다. 길이 막히면 우회로부터 찾고, 자기 실수까지 농담으로 넘기려다 신뢰를 잃곤 한다.',
  preferredWeapons:['greatsword'],
  lookLabels:{help:'농담으로 인사하기',reaction:'어색하게 사과하기',cutscene:'붉은 대검을 휘두르기 · 컷신'},
  motion:{name:'어깨를 틀어 붉은 대검 휘두르기',lean:7.25,step:6.4,turn:-11.25,side:9.25,tempo:1.07},
  looks:{
    default:fullImage('halo-standing.webp',720,1080),
    casual:fullImage('halo-casual.webp',720,1080),
    rear:fullImage('halo-rear.webp',720,1080),
    help:fullImage('halo-talk.webp',720,1080),
    reaction:fullImage('halo-reaction.webp',720,1080),
    attack:fullImage('halo-cutscene.webp',720,1080),
    cutscene:fullImage('halo-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('halo-sd.webp',512,512)},
  combatSprite:combatAtlas('halo',.97,1.07,2),
});
records.push({
  id:'ariel',name:'아리엘',age:null,species:'인간족',heightCm:164,weightKg:48,
  unknownName:'주문서를 든 갈색 머리 메이지',origin:'fantasy',requiresStoryIntroduction:true,
  persona:'인간족 메이지 아리엘. 164cm, 48kg. 주문을 쓰기 전에 주변부터 정돈하고 실패 원인을 기록한다. 실험 노트를 칭찬받으면 설명이 길어진다.',
  preferredWeapons:['staff'],roles:['mage'],combatStyle:'magic',
  lookLabels:{help:'마도서를 들어 인사하기',reaction:'칭찬을 듣고 기뻐하기',cutscene:'별 장식 지팡이로 시전하기'},
  motion:{name:'주문서를 열고 지팡이를 들어 올리기',lean:2.75,step:4.15,turn:8.25,side:7.25,tempo:.96},
  looks:{
    default:fullImage('ariel-standing.webp',720,1080),
    rear:fullImage('ariel-rear.webp',720,1080),
    casual:fullImage('ariel-casual.webp',720,1080),
    help:fullImage('ariel-talk.webp',720,1080),
    reaction:fullImage('ariel-reaction.webp',720,1080),
    cast:fullImage('ariel-cutscene.webp',720,1080),
    cutscene:fullImage('ariel-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('ariel-sd.webp',512,512)},
  combatSprite:combatAtlas('ariel',.93,.96,2),
});
records.push({
  id:'milia',name:'밀리아',age:null,species:'날도마뱀 수인',heightCm:155,weightKg:42,
  unknownName:'연푸른 머리와 보랏빛 활강막을 지닌 수인',origin:'fantasy',requiresStoryIntroduction:true,
  persona:'날도마뱀 수인 밀리아. 155cm, 42kg. 작은 약속을 기억한다. 친구가 걱정되면 구실을 만들어 먼저 찾아가지만 자신이 도움을 청할 때는 망설인다. 무기와 전용 전투 기술은 미정이다.',
  preferredWeapons:[],
  lookLabels:{cutscene:'활강막을 펼치기 · 컷신'},
  motion:{name:'가볍게 뛰어 활강막 펼치기',lean:-2.6,step:5.8,turn:6.75,side:12.25,tempo:1.11},
  looks:{
    default:fullImage('milia-standing.webp',720,1080),
    rear:fullImage('milia-rear.webp',720,1080),
    help:fullImage('milia-talk.webp',720,1080),
    reaction:fullImage('milia-reaction.webp',720,1080),
    cutscene:fullImage('milia-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('milia-sd.webp',512,512)},
  combatSprite:combatAtlas('milia',.90,1.11,2),
});
get('fafnir').looks.casual=fullImage('fafnir-casual.webp',720,1080);
get('fenri').looks.casual=fullImage('fenri-casual.webp',720,1080);
function get(id){return records.find(r=>r.id===id)||null;}
function appearance(id,{look='default',pose='default'}={}){const r=get(id);return r?.looks[pose==='default'?look:pose]||r?.looks.default||null;}
function displayName(state,id){const r=get(id);if(!r)return null;const introduced=state?.knownIdentities?.[id]===true||(state?.turns||[]).some(t=>(t.panels||[]).some(p=>p.speaker===id&&String(p.text||'').includes(r.name)));return introduced?r.name:r.unknownName;}
const legacyCasual={
  yeogyeong:fullImage('yeogyeong-casual.webp',720,1080),
  dogyeom:fullImage('dogyeom-casual.webp',720,1080),
  seoha:fullImage('seoha-casual.webp',720,1080),
  'dogyeom-childhood-friend':fullImage('soyun-casual.webp',720,1080),
};
const transfers={
  taei:{age:18,trait:'제로와 함께하는 동반자 특성',bio:'지구 출신 고등학교 2학년. 등굣길 지하철에서 전이한다.',
    looks:{'지구 · 등교 복장':fullImage('taei-earth.webp',720,1080),'이세계 · 격투가':crop('taei-fighter-reference.png',1536,1024,880,0,382,1024)},
    cutscenes:[['건틀릿 점검','taei-fighter-cutscenes.webp',1200,600,2,0],['가드 연습','taei-fighter-cutscenes.webp',1200,600,2,1]],
    expressions:{'지구':'taei-earth-expressions.webp','이세계':'taei-fighter-expressions.webp'},sd:{'격투가':'sd-taei-fighter.webp'}},
  dogyeom:{age:18,trait:'반동',bio:'백금발의 전 복싱 유망주. 부상 흉터를 이레즈미 문신으로 가렸다. 반동으로 받아낸 충격 일부를 타격에 싣는다.',
    looks:{'지구 · 등교 복장':fullImage('dogyeom-earth.webp',720,1080)},
    cutscenes:[['손목 보호대 점검','event-dogyeom-solo.png',1672,941]],expressions:{'이세계':'dogyeom-expressions.png'},solo:[1,4]},
  yeogyeong:{age:18,trait:'유예',bio:'태이와 같은 반. 간호학과 진학을 준비했다. 유예로 한 부위의 부상 상태를 잠시 고정한다.',
    looks:{'지구 · 교복':fullImage('yeogyeong-standing.png',1011,1556),'이세계 · 여행복':crop('yeogyeong-fantasy-outfit.png',1536,1024,938,0,598,1024)},
    cutscenes:[['교실','event-yeogyeong-classroom.png',1672,941],['복도','event-yeogyeong-corridor.png',1536,1024],['치유 연습','event-yeogyeong-healing.png',1672,941],['성문','event-yeogyeong-gate.png',1536,1024]],
    expressions:{'지구':'yeogyeong-expressions.png','이세계':'yeogyeong-fantasy-expressions.png'},sd:{'지구':'sd-yeogyeong.png','이세계':'sd-yeogyeong-fantasy.png'}},
  seoha:{age:18,trait:'경계',bio:'차분한 표정 뒤로 엉뚱한 생각을 자주 한다. 경계를 넘는 대상의 움직임을 한 차례 끊는다.',
    looks:{'지구 · 교복':fullImage('seoha-standing.png',1024,1536)},
    cutscenes:[['우물가에서 새 관찰','event-seoha-solo.png',1672,941]],expressions:{'이세계':'seoha-expressions.png'},solo:[2,5]},
  yui:{age:20,trait:'잔향',bio:'태이의 학교를 나온 대학생. 잔향은 현장에 남은 흔적에서 과거를 탐지하는 방향으로 발전한다.',
    looks:{'지구 · 외출복':fullImage('yui-standing.png',887,1774)},
    cutscenes:[['지구','yui-cutscenes.png',1774,887,2,0],['이세계','yui-cutscenes.png',1774,887,2,1]],
    expressions:{'지구':'yui-expressions.png'},sd:{'상호작용':'sd-yui.png'}},
  woojin:{age:null,trait:null,bio:'지구의 물류 현장 직원으로 제작한 전이자 시안.',
    looks:{'지구 · 작업복':crop('woojin-design.png',1536,1024,0,0,470,1024),'이세계 · 여행복':crop('woojin-design.png',1536,1024,1100,0,436,1024)},
    cutscenes:[['매듭 점검','woojin-cutscenes.png',1774,887,2,0],['여관 앞 휴식','woojin-cutscenes.png',1774,887,2,1]],
    expressions:{'이세계':'woojin-expressions.png'},sd:{'상호작용':'sd-woojin.png'}},
  'dogyeom-childhood-friend':{age:null,trait:'보관',bio:'백도겸의 소꿉친구. 보관은 성장하며 개인 아공간으로 발전한다.',
    looks:{'지구 · 교복':fullImage('childhood-friend-standing.png',980,1605)},
    sheets:{'지구':'soyun-earth-sheet.webp','이세계':'soyun-fantasy-sheet.webp'}},
};
function crop(file,width,height,x,y,w,h){
  return {...fullImage(file,width,height),x,y,w,h};
}
function sheetCell(file,width,height,columns,rows,index){
  const column=index%columns,row=Math.floor(index/columns);
  const left=Math.floor(column*width/columns),top=Math.floor(row*height/rows);
  return crop(file,width,height,left,top,Math.floor((column+1)*width/columns)-left,Math.floor((row+1)*height/rows)-top);
}
function transferExpression(id,era,emotion){
  const file=transfers[id]?.expressions?.[era];
  if(!file)return null;
  return sheetCell(file,1536,1024,3,2,Math.max(0,Math.min(5,Number.isInteger(emotion)?emotion:0)));
}
return{records,legacyCasual,transfers,transferExpression,sheetCell,get,appearance,displayName,combatFrame};
});
