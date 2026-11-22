(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.CharacterContent=f();})(globalThis,()=>{
const records=[{"id": "cheona", "name": "천아", "age": 19, "species": "뱀 수인", "origin": "fantasy", "unknownName": "은백색 머리의 뱀 수인", "preferredWeapons": ["dagger"], "trait": null, "looks": {"default": {"src": "assets/cheona-looks.webp", "x": 0, "y": 0, "w": 512, "h": 768, "imageWidth": 1024, "imageHeight": 1536}, "street": {"src": "assets/cheona-looks.webp", "x": 512, "y": 0, "w": 512, "h": 768, "imageWidth": 1024, "imageHeight": 1536}, "help": {"src": "assets/cheona-looks.webp", "x": 512, "y": 768, "w": 512, "h": 768, "imageWidth": 1024, "imageHeight": 1536}, "fallen": {"src": "assets/cheona-fallen.webp", "x": 0, "y": 0, "w": 1211, "h": 1299, "imageWidth": 1211, "imageHeight": 1299}, "sleep": {"src": "assets/cheona-sleep.webp", "x": 0, "y": 0, "w": 640, "h": 1536, "imageWidth": 1024, "imageHeight": 1536}}, "sd": {"default": {"src": "assets/cheona-sd.webp", "x": 0, "y": 0, "w": 600, "h": 656, "imageWidth": 1199, "imageHeight": 1312}, "playful": {"src": "assets/cheona-sd.webp", "x": 600, "y": 0, "w": 599, "h": 656, "imageWidth": 1199, "imageHeight": 1312}, "surprised": {"src": "assets/cheona-sd.webp", "x": 0, "y": 656, "w": 600, "h": 656, "imageWidth": 1199, "imageHeight": 1312}, "street": {"src": "assets/cheona-sd.webp", "x": 600, "y": 656, "w": 599, "h": 656, "imageWidth": 1199, "imageHeight": 1312}, "sleep": {"src": "assets/cheona-sleep.webp", "x": 640, "y": 820, "w": 384, "h": 716, "imageWidth": 1024, "imageHeight": 1536}}, "pixel": {"src": "assets/cheona-pixels.webp", "frames": [[0, 0, 443, 443], [443, 0, 444, 443], [887, 0, 443, 443], [1330, 0, 444, 443], [0, 443, 443, 444], [443, 443, 444, 444], [887, 443, 443, 444], [1330, 443, 444, 444]], "height": 443, "imageWidth": 1774, "imageHeight": 887}, "motion": {"name": "상체를 비껴 흐르듯 짧게 빠지기", "lean": -6, "step": 5, "turn": -13, "side": 12, "tempo": 1.15}, "persona": "뱀 수인 천아. 19살. 직업·태이와의 과거 관계·성격 세부는 미정. 단검류를 주로 사용하지만 전투 직업·정수·스킬을 임의 부여하지 않는다. 은백색 긴 머리, 나른한 보랏빛 눈, 밝은 피부와 갈라진 뱀 혀. 별도 뱀 동반자는 없다. 현대식 흰 재킷·보라 안감·연두 배색과 흰 나시·회색 스타킹·운동화가 기본. 나시는 평소와 앉은 장면 모두 한 겹이며 검정 이너를 새로 추가하지 않는다. 검정·연두 대체 의상은 모자 없이 메시와 안쪽 옷을 분리한다. 현실에는 등장하지 않는다. 만남·호감·파티 합류는 미정이다. 전이자 고유 특성 없음. 잠옷은 검정·흰 프릴 상의와 앞치마, 옆트임 있는 검정 일자 치마, 발끝을 덮는 스타킹이며 구두는 신지 않는다. 잠옷으로 자동 갈아입거나 장면을 강제하지 않는다. 키 167cm, 몸무게 46kg. 이는 설정 정보이며 상대가 알기 전 대사로 자동 공개하지 않는다.", "portraits": {"sleep": {"src": "assets/cheona-sleep.webp", "x": 640, "y": 45, "w": 384, "h": 540, "imageWidth": 1024, "imageHeight": 1536}}, "heightCm": 167, "weightKg": 46}, {"id": "fafnir", "name": "파프니르", "age": 20, "species": "수룡 수인", "origin": "fantasy", "unknownName": "푸른 머리의 수룡 수인", "preferredWeapons": ["magic"], "roles": ["mage"], "combatStyle": "magic", "trait": null, "looks": {"default": {"src": "assets/fafnir-looks.webp", "x": 0, "y": 0, "w": 630, "h": 623, "imageWidth": 1261, "imageHeight": 1247}, "help": {"src": "assets/fafnir-looks.webp", "x": 630, "y": 0, "w": 631, "h": 623, "imageWidth": 1261, "imageHeight": 1247}, "fallen": {"src": "assets/fafnir-looks.webp", "x": 0, "y": 623, "w": 630, "h": 624, "imageWidth": 1261, "imageHeight": 1247}}, "sd": {"default": {"src": "assets/fafnir-looks.webp", "x": 630, "y": 623, "w": 631, "h": 624, "imageWidth": 1261, "imageHeight": 1247}}, "pixel": {"src": "assets/fafnir-looks.webp", "frames": [[630, 623, 631, 624]], "height": 624, "imageWidth": 1261, "imageHeight": 1247, "format": "illustrated-sd"}, "motion": {"name": "몸을 틀어 거리를 지키며 마나 모으기", "lean": 4, "step": 3, "turn": 8, "side": 7, "tempo": 0.9}, "persona": "20살 여성 수룡 수인 파프니르. 마법을 주로 쓰는 메이지. 자기 종족의 강함을 알고 자부심과 자기주장이 강한 말괄양이로 차별에도 주눅들지 않는다. 푸른 앞머리와 밝은 금발 안쪽 긴 머리, 작은 뿔, 검정·금색 의상과 작고 유연한 유기적 비늘·지느러미 꼬리를 유지한다. 로봇 같은 거대한 꼬리로 되돌리지 않는다. 전용 속성·스킬·정수·과거·태이와의 관계는 미정. 현실에 등장하거나 파티에 자동 합류하지 않는다. 전이자 전용 고유 특성 없음. 키 154cm, 몸무게 53kg. 이는 설정 정보이며 상대가 알기 전 대사로 자동 공개하지 않는다.", "heightCm": 154, "weightKg": 53}];
function combatAtlas(id,scale,tempo){
  return {
    src:'assets/'+id+'-combat.png',
    frames:Array.from({length:12},(_,i)=>[i%4*96,Math.floor(i/4)*96,96,96]),
    imageWidth:384,imageHeight:288,anchor:[48,88],scale,tempo,
  };
}
function combatFrame(atlas,index){
  const [x,y,w,h]=atlas.frames[index];
  return {src:'battle/'+atlas.src,x,y,w,h,imageWidth:atlas.imageWidth,imageHeight:atlas.imageHeight};
}
get('cheona').combatSprite=combatAtlas('cheona',.96,1.15);
get('fafnir').combatSprite=combatAtlas('fafnir',.89,.9);
const fenriAtlas=combatAtlas('fenri',.93,1.04);
const fenriSD=combatFrame(fenriAtlas,0);
records.push({
  id:'fenri', name:'펜리', age:null, species:'개 수인', origin:'fantasy',
  unknownName:'붉은 머리의 개 수인', heightCm:161, weightKg:52,
  preferredWeapons:['sword'], roles:['slayer'], trait:null,
  looks:{default:fenriSD}, sd:{default:fenriSD},
  pixel:{src:fenriSD.src,battleSrc:fenriAtlas.src,frames:[fenriAtlas.frames[0]],imageWidth:384,imageHeight:288},
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
    rear:fullImage('palanus-rear.webp',720,1080),
    help:fullImage('palanus-talk.webp',720,1080),
    attack:fullImage('palanus-sword.webp',720,1080),
    cutscene:fullImage('palanus-cutscene.webp',720,1080),
  },
  sd:{default:fullImage('palanus-sd.webp',512,512)},
  combatSprite:combatAtlas('palanus',.96,.88),
});
function get(id){return records.find(r=>r.id===id)||null;}
function appearance(id,{look='default',pose='default'}={}){const r=get(id);return r?.looks[pose==='default'?look:pose]||r?.looks.default||null;}
function displayName(state,id){const r=get(id);if(!r)return null;const introduced=state?.knownIdentities?.[id]===true||(state?.turns||[]).some(t=>(t.panels||[]).some(p=>p.speaker===id&&String(p.text||'').includes(r.name)));return introduced?r.name:r.unknownName;}
return{records,get,appearance,displayName,combatFrame};
});
