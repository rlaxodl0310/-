(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./essence-rules.js'));else r.MonsterCatalog=f(r.EssenceRules);})(globalThis,(E)=>{
const ant={id:'ant',name:'앤트',stars:1,lineage:'개미형 씨앗종',size:'몸길이45~65cm · 성인 무릎 아래 높이',asset:'assets/monsters/ant-sheet.png',appearance:'짙은 적갈색 갑각과 납작한 머리, 큰 턱. 굵고 갈고리처럼 휘어진 앞다리 한 쌍과 가느다란 나머지 두 쌍으로 총 여섯 다리다. 관절의 누런 막과 등껍질의 거친 광석 같은 돌기가 보인다.',habitat:'숲 가장자리·초원·광산 주변의 흙 속. 여러 통로와 먹이 저장 공간을 가진 둥지를 만든다.',ecology:'사체와 몬스터 잔해까지 운반하는 잡식성. 냄새와 지면 진동으로 주변을 파악하고 먹이·위험을 냄새 흔적으로 알린다.',combat:'단독 개체의 움직임은 단순하지만 큰 턱은 옷과 살을 함께 뜯을 수 있다. 무리는 다리와 옆구리로 접근한다. 둥지와 먹이 주변에 집요하며 끝없이 추격하지는 않는다. 1성도 맨몸의 사람에게 치명적이다.',weakness:'배 아래와 다리 관절이 상대적으로 약하다. 시력이 나쁘지만 가까운 진동으로 상대를 다시 찾는다.',essences:[],essenceRule:'고정 효과와 스탯 상승. 기본 정수 슬롯 규칙과 생성 후30분 소멸 규칙을 따른다. 군체 지휘·감각 공유는 기본 효과가 아니다.',derivatives:'굴착·갑각·독 등으로 자연스럽게 파생될 수 있다. 진화와 교배를 거듭해 개미와 다른 형태로 이어질 여지도 있다. 고정 진화 조건은 정하지 않는다.'};
const clad={"id": "clad", "name": "클래드", "stars": 2, "lineage": "광물·기계형 몬스터 · 기원 미상", "size": "낮고 넓은 중량형 몸체", "asset": "assets/monsters/clad-sheet.png", "spriteAsset": "battle/assets/clad-sprites.png", "artLayout": "clad", "appearance": "겹친 흑철색 판과 주황빛 틈, 짧고 굵은 관절 다리 네 개. 눈과 얼굴 없이 거대한 압착 턱이 전면을 차지한다. 인공 제작물인지는 밝혀지지 않았다.", "habitat": "폐광과 바위 지대.", "ecology": "광석 조각과 몬스터 잔해를 압착해 몸 안으로 밀어 넣는다. 기원과 다른 종과의 관계는 미정이다.", "combat": "육중하지만 짧은 직선 돌진은 빠르다. 큰 턱으로 붙잡아 비틀거나 내리친다. 방향 전환이 느리고 빗문 직후 전면에 빈틈이 생긴다.", "weakness": "겹친 판 사이와 다리 관절. 갑옷을 뚫지 못해도 충격 자체는 전달된다.", "essences": [], "essenceRule": "고정 효과 앵커를 습득하며 방어력 +3, 힘 +2. 정수 슬롯 하나를 차지하고 생성 후 30분 미섭취 시 소멸한다. 2성부터는 사용법을 바꾸는 확실한 능력을 얻는다. 숙련·신체·스탯에 따라 발전하지만 다른 능력으로 자동 교체되지 않는다. 마나가 남아도 뼈와 근육의 한계를 무시할 수 없고 과용하면 마나 회로가 손상될 수 있다.", "derivatives": "진화는 생태계의 자연스러운 흐름이다. 개미나 기계 등 외형에 묶인 진화 계통이나 고정 조건은 설정하지 않는다."};
const added=[{"id": "velum", "name": "벨룸", "stars": 2, "lineage": "공중형 몬스터", "size": "펼친 막 너비 약 1.5m", "appearance": "검푸른 넓은 막 아래 단단한 몸통과 접힌 갈고리 다리 네 개, 은빛 감각선과 배 아래 세로 입.", "habitat": "절벽과 큰 나무 아래. 해 질 무렵 활동한다.", "ecology": "거꾸로 매달려 쉬며 작은 동물과 부상당한 몬스터, 사람도 사냥한다.", "combat": "나무와 바위 사이를 낮게 활공해 사각으로 접근하고 막으로 시야를 가린 뒤 갈고리로 붙잡아 문다.", "weakness": "좁은 통로와 젖은 막은 기동을 방해한다. 막이 찢어지면 비행과 방향 전환이 어려워진다.", "asset": "assets/monsters/new-monsters-sheet.png", "spriteAsset": "battle/assets/new-monster-sprites.png", "artLayout": "new", "artRow": 0, "derivatives": "성급은 현재 힘과 위험도이며 나이·성체 여부·잠재력과 별개다. 진화는 형태에 고정되지 않으며 조건표를 두지 않는다."}, {"id": "draven", "name": "드라벤", "stars": 2, "lineage": "성체 용족 · 날개 없는 사족", "size": "꼬리 포함 약 2m의 성체", "appearance": "잿빛·청록색 비늘, 뒤로 뻗은 짧은 뿔 두 개와 황금색 눈. 큰 앞발과 긴 굵은 꼬리, 마나를 모을 때 부푸는 목주머니.", "habitat": "바위 구릉과 숲속 동굴.", "ecology": "주로 혼자 길목에 매복하고 남은 먹이는 돌 틈에 숨긴다. 낮은 성급은 어린 나이를 뜻하지 않는다.", "combat": "앞발로 누르고 물어뜯으며 꼬리로 측후면을 견제한다. 목주머니에 모은 마나를 짧고 굵은 충격 브레스로 내뿜는다.", "weakness": "브레스 직전 청록빛 목주머니가 부풀고 직후 숨을 고른다. 목과 배는 등보다 비늘이 얇다.", "asset": "assets/monsters/new-monsters-sheet.png", "spriteAsset": "battle/assets/new-monster-sprites.png", "artLayout": "new", "artRow": 1, "derivatives": "성급은 현재 힘과 위험도이며 나이·성체 여부·잠재력과 별개다. 진화는 형태에 고정되지 않으며 조건표를 두지 않는다."}, {"id": "noxvern", "name": "녹스베른", "stars": 4, "lineage": "성체 용족 · 그림자 은폐형", "size": "꼬리 포함 약 4m", "appearance": "납작하고 긴 몸, 벌어진 네 다리와 갈고리 발가락, 무광 흑색 비늘과 회보라색 눈. 뒤로 누운 뿔 두 개와 좁은 옆구리 막, 긴 꼬리. 날개는 없고 실체가 있는 생물이다.", "habitat": "깊은 동굴과 폐광의 어두운 벽·천장.", "ecology": "먹잇감의 발소리와 진동을 살피며 좁은 길목 위에서 매복한다. 잡은 먹이를 높은 틈으로 끌어올린다.", "combat": "벽과 천장으로 이동해 등과 목을 덮친다. 검은 마나 안개로 빛을 흩뜨리고 그림자에 윤곽을 숨긴다. 꼬리로 퇴로를 막는다.", "weakness": "여러 방향의 강한 빛은 은폐를 깨지만 직접 피해를 주지는 않는다. 벽에서 떨어진 직후와 옆구리 막·발가락 관절이 약하다. 안개 속에서도 소리와 진동에 의존한다.", "asset": "assets/monsters/new-monsters-sheet.png", "spriteAsset": "battle/assets/new-monster-sprites.png", "artLayout": "new", "artRow": 2, "derivatives": "성급은 현재 힘과 위험도이며 나이·성체 여부·잠재력과 별개다. 진화는 형태에 고정되지 않으며 조건표를 두지 않는다."}];
const lairon={"id": "lairon", "name": "갱도라", "stars": 3, "lineage": "강철·광물형 사족 몬스터 · 포켓몬 갱도라 디자인", "size": "낮고 무거운 사족 체형 · 정확한 크기 미정", "asset": "assets/monsters/lairon-sheet.png", "artLayout": "lairon", "appearance": "검은 회색 몸통과 파란 눈, 검은 타원 구멍이 난 은회색 머리·등 갑각. 짧고 굵은 네 다리와 발목 띠·삼각 발톱. 갑각에 가벼운 마모와 광석 가루.", "habitat": "광산과 철광석이 드러난 암반 지대.", "ecology": "철이 섞인 광석을 갉아먹으며 갱도 지지대까지 훼손할 수 있다. 자기 영역을 지키며 낮은 성급이 미성숙을 뜻하지 않는다.", "combat": "몸을 낮추고 돌진해 상대를 벽에 밀어붙인다. 강철 갑각으로 공격을 받아내지만 무게 때문에 급회전이 어렵다.", "weakness": "배 아래와 다리 관절은 등보다 약하며 단단한 갑각 안쪽에도 충격이 전달된다.", "derivatives": "진화와 성급을 나이와 동일시하지 않는다. 원작의 진화 조건을 이 세계관에 자동 적용하지 않는다.", "artNote": "전투에 전용 SD 도트 스프라이트의 대기·이동·돌진 3프레임을 적용했다. 기본 원화는 도감과 컷신에서 사용한다."};
const nerpang={"id": "nerpang", "name": "네르팽", "stars": 2, "lineage": "물범형 수륙 양용 몬스터", "size": "성체 몸길이 약 2.5m", "asset": "assets/monsters/nerpang-basic.webp", "spriteAsset": "battle/assets/nerpang-sprites.png", "artLayout": "frames", "appearance": "청회색 얼룩 피부와 통통한 몸통, 둥근 얼굴과 큰 검은 눈, 작은 송곳니. 짧은 앞지느러미 안쪽의 갈고리와 낮은 등지느러미. 두 뒷지느러미가 몸통 뒤의 한 지점에서 자연스럽게 갈라진다. 귀여운 인상이지만 성체 포식자다.", "habitat": "해안 동굴·강 하구·물에 잠긴 유적.", "ecology": "작은 무리로 생활하며 물가에서 쉬는 척하다가 먹잇감을 덮친다. 낮은 울음으로 동료를 부른다.", "combat": "몸 아래 얇은 마나 수막으로 젖은 지면을 활주해 몸통으로 다리를 무너뜨리고 물어 끌고 간다. 물속에서는 앞지느러미로 붙잡고 몸을 회전시킨다.", "weakness": "돌진 직전 앞지느러미를 몸에 붙이고 턱을 낮춘다. 급회전이 어렵고 마른 모래·거친 자갈에서는 활주 효율이 떨어진다.", "derivatives": "현재 등급은 성체 여부나 잠재력과 별개다. 형태를 고정하는 진화 조건을 두지 않는다.", "artFrames": {"main": {"src": "assets/monsters/nerpang-basic.webp", "x": 0, "y": 0, "w": 1536, "h": 1024, "imageWidth": 1536, "imageHeight": 1024}, "action": {"src": "assets/monsters/nerpang-scene.webp", "x": 0, "y": 0, "w": 1672, "h": 941, "imageWidth": 1672, "imageHeight": 941}, "sd": {"src": "assets/monsters/nerpang-sd.webp", "x": 0, "y": 0, "w": 384, "h": 170, "imageWidth": 384, "imageHeight": 170}}, "battle": {"hp": 60, "damage": 16, "tell": "앞지느러미를 몸에 붙이고 턱을 낮추며 직선 활주를 준비한다.", "note": "전투 테스트용 임시 HP·피해이며 본편 확정 스탯이 아니다.", "sprite": {"src": "assets/nerpang-sprites.png", "imageWidth": 1536, "imageHeight": 1024, "frames": [{"x": 0, "y": 0, "w": 384, "h": 170, "flip": true}, {"x": 384, "y": 0, "w": 384, "h": 170, "flip": true}, {"x": 768, "y": 0, "w": 384, "h": 170, "flip": true}, {"x": 1152, "y": 0, "w": 384, "h": 170, "flip": true}, {"x": 0, "y": 170, "w": 384, "h": 170, "flip": true}, {"x": 384, "y": 170, "w": 384, "h": 170, "flip": true}, {"x": 768, "y": 170, "w": 384, "h": 170, "flip": true}, {"x": 1152, "y": 170, "w": 384, "h": 170, "flip": true}, {"x": 0, "y": 340, "w": 384, "h": 170, "flip": true}, {"x": 384, "y": 340, "w": 384, "h": 170, "flip": true}, {"x": 768, "y": 340, "w": 384, "h": 170, "flip": true}, {"x": 1152, "y": 340, "w": 384, "h": 170, "flip": true}, {"x": 0, "y": 510, "w": 384, "h": 170, "flip": true}, {"x": 384, "y": 510, "w": 384, "h": 170, "flip": true}, {"x": 768, "y": 510, "w": 384, "h": 170, "flip": true}, {"x": 1152, "y": 510, "w": 384, "h": 170, "flip": true}, {"x": 0, "y": 680, "w": 384, "h": 170, "flip": true}, {"x": 384, "y": 680, "w": 384, "h": 170, "flip": true}, {"x": 768, "y": 680, "w": 384, "h": 170, "flip": true}, {"x": 1152, "y": 680, "w": 384, "h": 170, "flip": true}, {"x": 0, "y": 850, "w": 384, "h": 170, "flip": true}, {"x": 384, "y": 850, "w": 384, "h": 170, "flip": true}, {"x": 768, "y": 850, "w": 384, "h": 170, "flip": true}, {"x": 1152, "y": 850, "w": 384, "h": 170, "flip": true}], "clips": {"idle": {"frames": [0, 1, 2, 3], "fps": 5}, "move": {"frames": [4, 5, 6, 7], "fps": 9}, "attack": {"frames": [8, 9, 10, 11], "fps": 9}, "guard": {"frames": [12, 13, 14, 15], "fps": 9}, "dodge": {"frames": [16, 17, 18, 19], "fps": 9}, "hit": {"frames": [20, 21, 22, 23], "fps": 9}}}}};
const aquatic105=[{"id": "fizz", "name": "피즈", "stars": 6, "lineage": "수생 양서형 몬스터", "size": "정확한 크기 미정", "asset": "assets/monsters/fizz-basic.webp", "spriteAsset": "battle/assets/fizz-sprites.png", "artLayout": "frames", "appearance": "큰 청록색 눈과 뒤로 흐르는 지느러미 귀, 푸른 피부와 밝은 배, 물갈퀴 손발. 청록 문양의 삼지창을 사용한다.", "habitat": "해안 동굴·침수 유적·깊은 하구.", "ecology": "피즈와 그라우크는 독립된 별개 종으로 공생 사냥하며 각각 단독으로도 출현한다. 소환 관계나 절대 복종 관계가 아니다.", "combat": "삼지창과 도약으로 상대를 교란하고 물가로 몰아 공생 포식자의 기습을 돕는다.", "weakness": "큰 도약의 착지 직후와 공격 후 자세를 고치는 순간이 대응 기회다.", "derivatives": "성급은 현재 힘과 위험도이며 나이·잠재력과 별개다. 임의의 자동 조우나 소환을 생성하지 않는다.", "artFrames": {"main": {"src": "assets/monsters/fizz-basic.webp", "x": 0, "y": 0, "w": 793, "h": 793, "imageWidth": 793, "imageHeight": 793}, "action": {"src": "assets/monsters/fizz-basic.webp", "x": 0, "y": 0, "w": 793, "h": 793, "imageWidth": 793, "imageHeight": 793}, "sd": {"src": "assets/monsters/fizz-sd.webp", "x": 0, "y": 0, "w": 173, "h": 173, "imageWidth": 173, "imageHeight": 173}}, "battle": {"hp": 240, "damage": 38, "tell": "삼지창을 당기며 도약할 틈을 살핀다.", "note": "HP·피해는 전투 테스트용 임시 수치. 본편 확정 스탯과 별개다. 정수 신규 스탯 배분도 밸런스 시안이다.", "sprite": {"src": "assets/fizz-sprites.png", "imageWidth": 724, "imageHeight": 1086, "frames": [{"x": 4, "y": 4, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 4, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 4, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 4, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 185, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 185, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 185, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 185, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 366, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 366, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 366, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 366, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 547, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 547, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 547, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 547, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 728, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 728, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 728, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 728, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 909, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 909, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 909, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 909, "w": 173, "h": 173, "flip": true}], "clips": {"idle": {"frames": [0, 1, 2, 3], "fps": 5}, "move": {"frames": [4, 5, 6, 7], "fps": 9}, "attack": {"frames": [8, 9, 10, 11], "fps": 9}, "guard": {"frames": [12, 13, 14, 15], "fps": 9}, "dodge": {"frames": [16, 17, 18, 19], "fps": 9}, "hit": {"frames": [20, 21, 22, 23], "fps": 9}}}}}, {"id": "grauk", "name": "그라우크", "stars": 5, "lineage": "대형 수중 포식 몬스터", "size": "정확한 크기 미정", "asset": "assets/monsters/grauk-basic.webp", "spriteAsset": "battle/assets/grauk-sprites.png", "artLayout": "frames", "appearance": "검푸른 유기적 등과 넓은 턱, 긴 상아색 송곳니, 밝은 배. 한 쌍의 가슴지느러미와 등지느러미·강한 꼬리. 다리가 없다.", "habitat": "해안 동굴·침수 유적·깊은 하구.", "ecology": "피즈와 그라우크는 독립된 별개 종으로 공생 사냥하며 각각 단독으로도 출현한다. 소환 관계나 절대 복종 관계가 아니다.", "combat": "물속에서 접근해 큰 턱과 몸을 실은 돌진으로 기습한다. 피즈의 신호를 알아듣지만 무조건 복종하지 않는다.", "weakness": "돌진 중 급회전이 어렵고 얕은 물과 육지에서는 이동이 제한된다.", "derivatives": "성급은 현재 힘과 위험도이며 나이·잠재력과 별개다. 임의의 자동 조우나 소환을 생성하지 않는다.", "artFrames": {"main": {"src": "assets/monsters/grauk-basic.webp", "x": 0, "y": 0, "w": 1190, "h": 793, "imageWidth": 1190, "imageHeight": 793}, "action": {"src": "assets/monsters/grauk-basic.webp", "x": 0, "y": 0, "w": 1190, "h": 793, "imageWidth": 1190, "imageHeight": 793}, "sd": {"src": "assets/monsters/grauk-sd.webp", "x": 0, "y": 0, "w": 173, "h": 173, "imageWidth": 173, "imageHeight": 173}}, "battle": {"hp": 280, "damage": 42, "tell": "턱을 벌리고 지느러미를 모아 돌진을 준비한다.", "note": "HP·피해는 전투 테스트용 임시 수치. 본편 확정 스탯과 별개다. 정수 신규 스탯 배분도 밸런스 시안이다.", "sprite": {"src": "assets/grauk-sprites.png", "imageWidth": 724, "imageHeight": 1086, "frames": [{"x": 4, "y": 4, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 4, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 4, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 4, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 185, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 185, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 185, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 185, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 366, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 366, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 366, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 366, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 547, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 547, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 547, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 547, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 728, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 728, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 728, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 728, "w": 173, "h": 173, "flip": true}, {"x": 4, "y": 909, "w": 173, "h": 173, "flip": true}, {"x": 185, "y": 909, "w": 173, "h": 173, "flip": true}, {"x": 366, "y": 909, "w": 173, "h": 173, "flip": true}, {"x": 547, "y": 909, "w": 173, "h": 173, "flip": true}], "clips": {"idle": {"frames": [0, 1, 2, 3], "fps": 5}, "move": {"frames": [4, 5, 6, 7], "fps": 9}, "attack": {"frames": [8, 9, 10, 11], "fps": 9}, "guard": {"frames": [12, 13, 14, 15], "fps": 9}, "dodge": {"frames": [16, 17, 18, 19], "fps": 9}, "hit": {"frames": [20, 21, 22, 23], "fps": 9}}}}}];
const cobalion106={"id": "cobalion", "name": "코바르온", "stars": 8, "lineage": "강철체 공룡형 몬스터 · 팔 없는 두 다리 구조", "size": "정확한 크기 미정", "asset": "assets/monsters/cobalion-basic.webp", "spriteAsset": "battle/assets/cobalion-sprites.png", "artLayout": "frames", "appearance": "붉은 눈과 긴 분절형 금빛 뿔·앞쪽 짧은 뿔. 청록 강철 목갈기와 검은 등갈기, 흰 금속 섬유 가슴갈기, 금빛 측면 구조와 검은 타원 무늬의 청록 측판. 팔과 손이 없으며 두 뒷다리와 은빛 세 발톱 발, 청록·금빛·흰색 꼬리를 가진다. 갑옷을 입은 것이 아니라 몸 자체가 살아 있는 단단한 강철이다.", "habitat": "철광맥이 드러난 고산 지대와 깊은 광산 주변. 서식 상세는 설정 시안이다.", "ecology": "침착하고 경계심이 강하며 영역 훼손이나 퇴로 봉쇄에 공격적으로 반응한다. 인간과의 대화 지성은 미정이다.", "combat": "뿔과 몸통으로 공격을 받아 흘리고 두 발의 정교한 움직임으로 거리를 조절한다. 발굽 대신 확정 원화의 발톱 달린 두 발로 지면을 찍고 몸을 실어 돌진한다. 손으로 방어하거나 팔로 공격하지 않는다.", "weakness": "관절과 복부도 강철이지만 몸통보다 상대적으로 약하다. 돌진이 빗나간 직후와 발밑 지형 붕괴가 대응 기회다. 무적이 아니며 충격이 내부로 전달된다.", "derivatives": "8등급은 현재 힘과 위험도이며 신수 분류가 아니다. 자동 조우·동행·출현 지역을 확정하지 않는다.", "artFrames": {"main": {"src": "assets/monsters/cobalion-basic.webp", "x": 0, "y": 0, "w": 656, "h": 599, "imageWidth": 656, "imageHeight": 599}, "action": {"src": "assets/monsters/cobalion-charge.webp", "x": 0, "y": 0, "w": 656, "h": 599, "imageWidth": 656, "imageHeight": 599}, "guard": {"src": "assets/monsters/cobalion-guard.webp", "x": 0, "y": 0, "w": 656, "h": 599, "imageWidth": 656, "imageHeight": 599}, "hit": {"src": "assets/monsters/cobalion-hit.webp", "x": 0, "y": 0, "w": 656, "h": 599, "imageWidth": 656, "imageHeight": 599}, "sd": {"src": "assets/monsters/cobalion-sd.webp", "x": 0, "y": 0, "w": 1312, "h": 1199, "imageWidth": 1312, "imageHeight": 1199}, "combatSD": {"src": "assets/monsters/cobalion-combat-sd.webp", "x": 0, "y": 0, "w": 256, "h": 256, "imageWidth": 256, "imageHeight": 256}}, "artLabels": {"action": "돌진 일러스트", "guard": "방어 일러스트", "hit": "피격 일러스트", "sd": "일반 SD 일러스트", "combatSD": "전투 SD 도트"}, "artNote": "확정 원화와 팔 없는 경계·돌진·방어·피격 자세 및 일반 SD를 참조한다. 전투24프레임은 머리·몸통·두 다리·꼬리로 동작을 표현한다. 별도 배경 CG는 제작하지 않았다.", "battle": {"hp": 440, "damage": 58, "tell": "두 발로 지면을 딛고 뿔과 몸통을 낮춰 돌파를 준비한다.", "note": "HP·피해는 전투 시험용 임시 수치이며 본편 확정 스탯이 아니다.", "sprite": {"src": "assets/cobalion-sprites.png", "imageWidth": 1024, "imageHeight": 1536, "frames": [{"x": 0, "y": 0, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 0, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 0, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 0, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 256, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 256, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 256, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 256, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 512, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 512, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 512, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 512, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 768, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 768, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 768, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 768, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 1024, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 1024, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 1024, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 1024, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 1280, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 1280, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 1280, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 1280, "w": 256, "h": 256, "flip": true}], "clips": {"idle": {"frames": [0, 1, 2, 3], "fps": 5}, "move": {"frames": [4, 5, 6, 7], "fps": 9}, "attack": {"frames": [8, 9, 10, 11], "fps": 9}, "guard": {"frames": [12, 13, 14, 15], "fps": 9}, "dodge": {"frames": [16, 17, 18, 19], "fps": 9}, "hit": {"frames": [20, 21, 22, 23], "fps": 9}}}}};
const terrakion107={"id": "terrakion", "name": "테라키온", "stars": 8, "lineage": "단단한 바위 몸체의 공룡형 사족 몬스터", "size": "정확한 크기 미정", "asset": "assets/monsters/terrakion-basic.webp", "spriteAsset": "battle/assets/terrakion-sprites.png", "artLayout": "frames", "appearance": "노란 눈과 연한 얼굴,매우 긴 갈색의 각진 머리 뿔/머리판과 주황 광물 무늬. 연회색 바위 몸통과 크림색 분절 배,검은 등 돌기·아랫다리,네 발의 주황 세 발톱과 뒤쪽 주황 돌기. 자연석의 거친 무광 표면이며 금속이나 용암이 아니다.", "habitat": "상세 서식지 미정.", "ecology": "구체적인 성격·지성과 생태는 미정이다.", "combat": "네 발로 무게를 지탱하고 뿔과 몸통으로 돌파하거나 몸을 낮춰 충격에 버틴다. 팔이나 손을 추가하지 않는다. 몸 일부를 굳혀 버티거나 접촉한 암석에 균열을 내는 능력을 활용한다.", "weakness": "무적이 아니며 공격 준비와 큰 동작 뒤에 대응할 수 있다. 구체적인 속성 약점은 미정이다.", "derivatives": "8등급은 현재 힘과 위험도이며 신수 분류가 아니다. 고정 조우·서식 위치·동행·지성은 자동 확정하지 않는다.", "artFrames": {"main": {"src": "assets/monsters/terrakion-basic.webp", "x": 0, "y": 0, "w": 1254, "h": 1254, "imageWidth": 1254, "imageHeight": 1254}, "alert": {"src": "assets/monsters/terrakion-alert.webp", "x": 0, "y": 0, "w": 656, "h": 599, "imageWidth": 656, "imageHeight": 599}, "action": {"src": "assets/monsters/terrakion-charge.webp", "x": 0, "y": 0, "w": 656, "h": 599, "imageWidth": 656, "imageHeight": 599}, "guard": {"src": "assets/monsters/terrakion-guard.webp", "x": 0, "y": 0, "w": 656, "h": 599, "imageWidth": 656, "imageHeight": 599}, "hit": {"src": "assets/monsters/terrakion-hit.webp", "x": 0, "y": 0, "w": 656, "h": 599, "imageWidth": 656, "imageHeight": 599}, "sd": {"src": "assets/monsters/terrakion-sd.webp", "x": 0, "y": 0, "w": 1536, "h": 1024, "imageWidth": 1536, "imageHeight": 1024}, "combatSD": {"src": "assets/monsters/terrakion-combat-sd.webp", "x": 0, "y": 0, "w": 256, "h": 256, "imageWidth": 256, "imageHeight": 256}}, "artLabels": {"alert": "경계 일러스트", "action": "돌진 일러스트", "guard": "방어 일러스트", "hit": "피격 일러스트", "sd": "일반 SD 일러스트", "combatSD": "전투 SD 도트"}, "artNote": "레퍼런스 외형과 네 다리를 유지한 기본/자세 원화와 일반 SD,전투 도트24프레임. 별도의 배경 컷신 CG는 제작하지 않았다.", "battle": {"hp": 550, "damage": 62, "tell": "네 발로 지면을 딛고 거대한 뿔과 머리를 낮춰 충격에 대비한다.", "note": "HP와 피해는 전투 시험용 임시 수치이며 본편 확정 스탯이 아니다.", "sprite": {"src": "assets/terrakion-sprites.png", "imageWidth": 1024, "imageHeight": 1536, "frames": [{"x": 0, "y": 0, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 0, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 0, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 0, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 256, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 256, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 256, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 256, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 512, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 512, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 512, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 512, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 768, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 768, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 768, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 768, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 1024, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 1024, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 1024, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 1024, "w": 256, "h": 256, "flip": true}, {"x": 0, "y": 1280, "w": 256, "h": 256, "flip": true}, {"x": 256, "y": 1280, "w": 256, "h": 256, "flip": true}, {"x": 512, "y": 1280, "w": 256, "h": 256, "flip": true}, {"x": 768, "y": 1280, "w": 256, "h": 256, "flip": true}], "clips": {"idle": {"frames": [0, 1, 2, 3], "fps": 5}, "move": {"frames": [4, 5, 6, 7], "fps": 9}, "attack": {"frames": [8, 9, 10, 11], "fps": 9}, "guard": {"frames": [12, 13, 14, 15], "fps": 9}, "dodge": {"frames": [16, 17, 18, 19], "fps": 9}, "hit": {"frames": [20, 21, 22, 23], "fps": 9}}}}};
const viridion108={"id": "viridion", "name": "비리디온", "stars": 8, "lineage": "살아 있는 식물 조직의 공룡형 몬스터", "size": "머리 높이 약2.4m · 꼬리 포함5.5m · 약380kg(설계 기준)", "asset": "assets/monsters/viridion-basic.webp", "spriteAsset": "battle/assets/viridion-sprites.png", "artLayout": "frames", "appearance": "노란 눈과 연한 주둥이·목·배,분홍/금색 무늬가 있는 검은 잎 모양 머리 구조,녹색 몸과 잎날,분홍 잎 가장자리,금색 마름모 등무늬. 길게 올라간 연한 꼬리 끝에 검은 굽은 두 갈래 날,레퍼런스의 잎 모양 앞다리·갈고리 발톱과 지지 다리를 유지한다. 잎맥·목질·식물 섬유로 이루어지며 금속이나 바위가 아니다.", "habitat": "햇빛 드는 숲의 공터와 물가를 오간다.", "ecology": "신중하고 예민하지만 호기심이 많다. 아침에 빛을 받고 한낮에 그늘에서 쉬며 밤에는 잎 조직을 접어 수분 손실을 줄인다. 광합성과 물/광물질 흡수로 영양을 얻고 다친 뒤에는 휴식이 필요하다. 몸에 묻은 씨앗/꽃가루와 떨어진 조직이 숲의 순환에 기여한다.", "combat": "잎날로 베고 갈고리 발톱으로 걸거나 긴 꼬리로 측후면을 견제한다. 정면 힘겨루기보다 몸을 접고 비틀며 거리를 조절한다. 정수의 절엽은 유지하는 날을 직접 휘두르거나 한 장을 떼어 날리는 능력이다.", "weakness": "건조하거나 빛이 부족한 환경과 장기전에 불리하다. 손상된 조직은 영양과 휴식으로 천천히 복구되며 전투 중 팔다리를 즉시 재생하지 않는다.", "derivatives": "8등급의 현재 위험도이며 신수/숲의 무조건적인 수호자로 고정하지 않는다. 정해진 조우·자동 동행·거점은 없다.", "artFrames": {"main": {"src": "assets/monsters/viridion-basic.webp", "x": 0, "y": 0, "w": 1254, "h": 1254, "imageWidth": 1254, "imageHeight": 1254}, "alert": {"src": "assets/monsters/viridion-alert.webp", "x": 0, "y": 0, "w": 631, "h": 623, "imageWidth": 631, "imageHeight": 623}, "action": {"src": "assets/monsters/viridion-attack.webp", "x": 0, "y": 0, "w": 631, "h": 623, "imageWidth": 631, "imageHeight": 623}, "dodge": {"src": "assets/monsters/viridion-dodge.webp", "x": 0, "y": 0, "w": 631, "h": 623, "imageWidth": 631, "imageHeight": 623}, "hit": {"src": "assets/monsters/viridion-hit.webp", "x": 0, "y": 0, "w": 631, "h": 623, "imageWidth": 631, "imageHeight": 623}, "sd": {"src": "assets/monsters/viridion-sd.webp", "x": 0, "y": 0, "w": 1536, "h": 1024, "imageWidth": 1536, "imageHeight": 1024}, "combatSD": {"src": "assets/monsters/viridion-combat-sd.webp", "x": 0, "y": 0, "w": 256, "h": 256, "imageWidth": 256, "imageHeight": 256}}, "artLabels": {"alert": "경계 일러스트", "action": "잎날 공격 일러스트", "dodge": "유연한 회피 일러스트", "hit": "피격 일러스트", "sd": "일반 SD 일러스트", "combatSD": "전투 SD 도트"}, "artNote": "레퍼런스 외형을 유지한 기본/추가 자세/일반 SD와 전투 도트24프레임. 배경을 포함한 별도 컷신 CG는 제작하지 않았다.", "battle": {"hp": 480, "damage": 57, "tell": "잎날을 뒤로 젖히고 몸을 낮춰 측면으로 움직일 틈을 노린다.", "note": "HP/피해는 전투 시험용 임시 수치이며 본편 확정 스탯이 아니다.", "sprite": {"src": "assets/viridion-sprites.png", "imageWidth": 1024, "imageHeight": 1536, "frames": [{"x": 0, "y": 0, "w": 256, "h": 256, "flip": false}, {"x": 256, "y": 0, "w": 256, "h": 256, "flip": false}, {"x": 512, "y": 0, "w": 256, "h": 256, "flip": false}, {"x": 768, "y": 0, "w": 256, "h": 256, "flip": false}, {"x": 0, "y": 256, "w": 256, "h": 256, "flip": false}, {"x": 256, "y": 256, "w": 256, "h": 256, "flip": false}, {"x": 512, "y": 256, "w": 256, "h": 256, "flip": false}, {"x": 768, "y": 256, "w": 256, "h": 256, "flip": false}, {"x": 0, "y": 512, "w": 256, "h": 256, "flip": false}, {"x": 256, "y": 512, "w": 256, "h": 256, "flip": false}, {"x": 512, "y": 512, "w": 256, "h": 256, "flip": false}, {"x": 768, "y": 512, "w": 256, "h": 256, "flip": false}, {"x": 0, "y": 768, "w": 256, "h": 256, "flip": false}, {"x": 256, "y": 768, "w": 256, "h": 256, "flip": false}, {"x": 512, "y": 768, "w": 256, "h": 256, "flip": false}, {"x": 768, "y": 768, "w": 256, "h": 256, "flip": false}, {"x": 0, "y": 1024, "w": 256, "h": 256, "flip": false}, {"x": 256, "y": 1024, "w": 256, "h": 256, "flip": false}, {"x": 512, "y": 1024, "w": 256, "h": 256, "flip": false}, {"x": 768, "y": 1024, "w": 256, "h": 256, "flip": false}, {"x": 0, "y": 1280, "w": 256, "h": 256, "flip": false}, {"x": 256, "y": 1280, "w": 256, "h": 256, "flip": false}, {"x": 512, "y": 1280, "w": 256, "h": 256, "flip": false}, {"x": 768, "y": 1280, "w": 256, "h": 256, "flip": false}], "clips": {"idle": {"frames": [0, 1, 2, 3], "fps": 5}, "move": {"frames": [4, 5, 6, 7], "fps": 9}, "attack": {"frames": [8, 9, 10, 11], "fps": 9}, "guard": {"frames": [12, 13, 14, 15], "fps": 9}, "dodge": {"frames": [16, 17, 18, 19], "fps": 9}, "hit": {"frames": [20, 21, 22, 23], "fps": 9}}}}};
const seedMonsters=[
  {"id":"goblin","name":"고블린","stars":1,"lineage":"인간형 씨앗종","size":"0.95m × 0.36m · 23kg","profile":{"status":"draft","adultAverage":{"heightM":0.95,"lengthM":0.36,"massKg":23.0},"temperament":"경계심이 강하고 주변에 동료가 있으면 대담해진다.","habits":"잔해나 관목을 엄폐로 삼고, 돌아갈 통로를 살핀다.","nutrition":"뿌리와 열매, 작은 동물과 남은 먹이를 모은다.","ecosystemRole":"남은 먹이를 옮기고 흩어진 씨앗을 퍼뜨린다."},"asset":"assets/monsters/seed-combat-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/monsters/seed-combat-atlas.png","x":57,"y":10,"w":364,"h":392,"imageWidth":1292,"imageHeight":1218},"sd":{"src":"battle/assets/battle-pixels.png","x":0,"y":647,"w":323,"h":324,"imageWidth":971,"imageHeight":1619}},"appearance":"탁한 녹색 피부와 긴 귀, 머리카락이 없는 작은 인간형. 해진 천옷과 나무 몽둥이를 쓴다.","habitat":"숲 가장자리와 폐허의 가려진 곳.","ecology":"잔해나 관목을 엄폐로 삼고, 돌아갈 통로를 살핀다. 뿌리와 열매, 작은 동물과 남은 먹이를 모은다.","combat":"몽둥이로 내리치고, 무리는 측면으로 접근한다.","weakness":"몽둥이를 크게 들어 올릴 때 측면이 열린다.","derivatives":"구체적인 파생형은 미정이다."},
  {"id":"slime","name":"슬라임","stars":1,"lineage":"점액형 씨앗종","size":"0.27m × 0.48m · 15kg","profile":{"status":"draft","adultAverage":{"heightM":0.27,"lengthM":0.48,"massKg":15.0},"temperament":"움직임이 느리고 가까운 진동에 몸을 움츠린다.","habits":"젖은 바닥을 천천히 미끄러지며 틈에 몸을 낮춘다.","nutrition":"낙엽과 사체에서 나온 부드러운 유기물을 흡수한다.","ecosystemRole":"젖은 장소에 쌓이는 유기물을 분해한다."},"asset":"assets/monsters/seed-combat-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/monsters/seed-combat-atlas.png","x":444,"y":147,"w":395,"h":238,"imageWidth":1292,"imageHeight":1218},"sd":{"src":"battle/assets/battle-pixels.png","x":0,"y":971,"w":323,"h":324,"imageWidth":971,"imageHeight":1619}},"appearance":"청록색 점액에 핵이 비친다. 눈과 입처럼 보이는 부분은 점액 속 빈 공간이다.","habitat":"습한 그늘, 얕은 물가와 폐허 바닥.","ecology":"젖은 바닥을 천천히 미끄러지며 틈에 몸을 낮춘다. 낙엽과 사체에서 나온 부드러운 유기물을 흡수한다.","combat":"낮게 퍼졌다가 몸을 튕겨 부딪친다.","weakness":"마른 바닥에서는 이동이 느려지고, 핵이 드러날 때 취약하다.","derivatives":"구체적인 파생형은 미정이다."},
  {"id":"moa","name":"모아","stars":1,"lineage":"식물형 씨앗종","size":"0.25m × 0.19m · 2.1kg","profile":{"status":"draft","adultAverage":{"heightM":0.25,"lengthM":0.19,"massKg":2.1},"temperament":"움직임에 민감하며 가까운 위협에는 잎을 움츠린다.","habits":"낮에는 빛을 따라 움직이고, 마른 날에는 그늘에 뿌리를 댄다.","nutrition":"광합성하고 젖은 흙에서 물과 양분을 흡수한다.","ecosystemRole":"작은 뿌리로 표토를 붙들고 떨어진 잎을 흙에 돌려준다."},"asset":"assets/monsters/seed-combat-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/monsters/seed-combat-atlas.png","x":844,"y":21,"w":415,"h":376,"imageWidth":1292,"imageHeight":1218},"sd":{"src":"battle/assets/monster-seeds-pixels.png","x":75,"y":12,"w":270,"h":292,"imageWidth":1292,"imageHeight":1218}},"appearance":"견과 같은 갈색 껍질과 뿌리 팔·다리, 두 장의 떡잎.","habitat":"빛이 드는 숲 바닥과 축축한 풀밭.","ecology":"낮에는 빛을 따라 움직이고, 마른 날에는 그늘에 뿌리를 댄다. 광합성하고 젖은 흙에서 물과 양분을 흡수한다.","combat":"뿌리를 고정한 뒤 껍질과 뿌리 팔로 짧게 들이받는다.","weakness":"뿌리를 박고 자세를 잡는 동안 방향을 바꾸기 어렵다.","derivatives":"구체적인 파생형은 미정이다."},
  {"id":"ruke","name":"루크","stars":1,"lineage":"짐승형 씨앗종","size":"0.43m × 0.91m · 11kg","profile":{"status":"draft","adultAverage":{"heightM":0.43,"lengthM":0.91,"massKg":11.0},"temperament":"호기심이 있지만 낯선 냄새에는 한 걸음 물러선다.","habits":"바람을 등지고 쉬고, 낮은 관목 사이를 돌아다닌다.","nutrition":"소형 동물과 곤충, 익은 열매를 먹는다.","ecosystemRole":"덤불의 작은 동물을 사냥하고 열매 씨앗을 옮긴다."},"asset":"assets/monsters/seed-combat-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/monsters/seed-combat-atlas.png","x":12,"y":462,"w":416,"h":315,"imageWidth":1292,"imageHeight":1218},"sd":{"src":"battle/assets/monster-seeds-pixels.png","x":36,"y":304,"w":321,"h":294,"imageWidth":1292,"imageHeight":1218}},"appearance":"큰 머리·귀·발, 황금빛 눈과 이마 무늬, 잎 모양 꼬리 끝이 있는 네발짐승.","habitat":"관목이 우거진 구릉과 숲 가장자리.","ecology":"바람을 등지고 쉬고, 낮은 관목 사이를 돌아다닌다. 소형 동물과 곤충, 익은 열매를 먹는다.","combat":"앞발을 낮춘 뒤 짧게 뛰어들어 문다.","weakness":"뛰어든 직후 자세를 바꾸는 데 시간이 걸린다.","derivatives":"구체적인 파생형은 미정이다."},
  {"id":"por","name":"포르","stars":1,"lineage":"어류형 씨앗종","size":"0.14m × 0.25m · 0.8kg","profile":{"status":"draft","adultAverage":{"heightM":0.14,"lengthM":0.25,"massKg":0.8},"temperament":"물속 진동에 민감하며 이상하면 수초나 돌 뒤로 숨는다.","habits":"수초 사이에서 작은 무리가 모였다 흩어진다.","nutrition":"작은 벌레와 수초, 물속 유기물을 먹는다.","ecosystemRole":"수초 주변의 작은 벌레를 먹고 큰 수생종의 먹이가 된다."},"asset":"assets/monsters/seed-combat-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/monsters/seed-combat-atlas.png","x":407,"y":439,"w":447,"h":336,"imageWidth":1292,"imageHeight":1218},"sd":{"src":"battle/assets/monster-seeds-pixels.png","x":33,"y":632,"w":371,"h":247,"imageWidth":1292,"imageHeight":1218}},"appearance":"둥근 물방울 몸과 큰 지느러미, 부채꼬리, 포식자 눈과 이빨 달린 턱.","habitat":"얕은 강과 호수의 수초 주변.","ecology":"수초 사이에서 작은 무리가 모였다 흩어진다. 작은 벌레와 수초, 물속 유기물을 먹는다.","combat":"물을 짧게 내뿜어 가속하고 방향을 바꾸며 접근한다.","weakness":"물 밖에서는 이동과 호흡에 한계가 있다.","derivatives":"구체적인 파생형은 미정이다."},
  {"id":"tork","name":"토르크","stars":1,"lineage":"파충류형 씨앗종","size":"0.17m × 0.40m · 2.7kg","profile":{"status":"draft","adultAverage":{"heightM":0.17,"lengthM":0.4,"massKg":2.7},"temperament":"혼자 쉬며 위협을 관찰하고 접근하면 몸을 낮춘다.","habits":"햇볕과 그늘을 오가며 바위 틈에 쉰다.","nutrition":"곤충과 알, 열매를 먹는다.","ecosystemRole":"바위 주변의 곤충을 먹고 열매 씨앗을 옮긴다."},"asset":"assets/monsters/seed-combat-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/monsters/seed-combat-atlas.png","x":833,"y":492,"w":449,"h":279,"imageWidth":1292,"imageHeight":1218},"sd":{"src":"battle/assets/monster-seeds-pixels.png","x":25,"y":936,"w":405,"h":231,"imageWidth":1292,"imageHeight":1218}},"appearance":"큰 턱과 거친 회녹색 비늘, 짧은 네 다리, 쐐기 모양 꼬리.","habitat":"햇볕 드는 바위와 가까운 그늘.","ecology":"햇볕과 그늘을 오가며 바위 틈에 쉰다. 곤충과 알, 열매를 먹는다.","combat":"짧은 돌진과 물기·꼬리치기를 쓰며 경린으로 비늘을 굳힌다.","weakness":"경린 중 움직임이 둔해진다. 관절 사이와 배는 상대적으로 약하다.","derivatives":"구체적인 파생형은 미정이다."},
  {"id":"kar","name":"카르","stars":1,"lineage":"조류형 씨앗종","size":"0.39m × 0.54m · 2.4kg","profile":{"status":"draft","adultAverage":{"heightM":0.39,"lengthM":0.54,"massKg":2.4},"temperament":"높은 곳에서 먹이의 움직임을 오래 살핀다.","habits":"절벽의 턱이나 큰 가지에 앉아 아래를 내려다본다.","nutrition":"작은 동물과 사체를 먹는다.","ecosystemRole":"소형 동물의 개체수를 조절하고 노출된 사체 일부를 치운다."},"asset":"assets/monsters/seed-combat-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/monsters/seed-combat-atlas.png","x":9,"y":805,"w":409,"h":359,"imageWidth":1292,"imageHeight":1218},"sd":{"src":"battle/assets/monster-armored-pixels.png","x":20,"y":17,"w":373,"h":278,"imageWidth":1330,"imageHeight":1182}},"appearance":"청회색 깃과 굽은 부리, 갈고리 발톱이 있는 조류형.","habitat":"숲 가장자리와 절벽.","ecology":"절벽의 턱이나 큰 가지에 앉아 아래를 내려다본다. 작은 동물과 사체를 먹는다.","combat":"급강하해 부리와 발톱으로 덮친다.","weakness":"급강하 직전에 날개를 접는다. 높이를 잃으면 다시 올라가야 한다.","derivatives":"구체적인 파생형은 미정이다."},
  {"id":"ves","name":"베스","stars":1,"lineage":"박쥐형 씨앗종","size":"0.26m × 0.36m · 1.6kg","profile":{"status":"draft","adultAverage":{"heightM":0.26,"lengthM":0.36,"massKg":1.6},"temperament":"동굴 속 낯선 소리에 민감하고 무리의 움직임에 반응한다.","habits":"동굴에서 무리 지어 쉬며 반향으로 통로를 확인한다.","nutrition":"날벌레와 동굴의 작은 동물을 사냥한다.","ecosystemRole":"동굴 입구 주변에서 날벌레를 사냥한다."},"asset":"assets/monsters/seed-combat-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/monsters/seed-combat-atlas.png","x":430,"y":818,"w":415,"h":315,"imageWidth":1292,"imageHeight":1218},"sd":{"src":"battle/assets/battle-pixels.png","x":0,"y":1295,"w":323,"h":324,"imageWidth":971,"imageHeight":1619}},"appearance":"큰 쐐기 귀와 어깨 각질판, 각진 날개막이 있다. 앞다리가 날개다.","habitat":"어둡고 좁은 동굴.","ecology":"동굴에서 무리 지어 쉬며 반향으로 통로를 확인한다. 날벌레와 동굴의 작은 동물을 사냥한다.","combat":"어둠을 타고 사각에서 접근해 문다.","weakness":"시야가 열린 공간에서는 사각으로 접근하기 어려워진다.","derivatives":"구체적인 파생형은 미정이다."},
  {"id":"rat","name":"라트","stars":1,"lineage":"쥐형 씨앗종","size":"0.19m × 0.49m · 3.1kg","profile":{"status":"draft","adultAverage":{"heightM":0.19,"lengthM":0.49,"massKg":3.1},"temperament":"좁은 틈을 벗어나기를 꺼리지만 몰리면 발밑으로 달려든다.","habits":"창고 벽이나 하수로 가장자리에서 냄새를 따라 이동한다.","nutrition":"씨앗, 벌레와 버려진 먹이를 먹는 잡식성이다.","ecosystemRole":"버려진 먹이를 옮기며 저장 곡식을 훼손하기도 한다."},"asset":"assets/monsters/seed-combat-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/monsters/seed-combat-atlas.png","x":856,"y":864,"w":427,"h":322,"imageWidth":1292,"imageHeight":1218},"sd":{"src":"battle/assets/monster-armored-pixels.png","x":20,"y":295,"w":423,"h":260,"imageWidth":1330,"imageHeight":1182}},"appearance":"낮은 몸과 강한 앞니, 각질 고리 꼬리가 있다.","habitat":"창고, 하수로와 땅굴.","ecology":"창고 벽이나 하수로 가장자리에서 냄새를 따라 이동한다. 씨앗, 벌레와 버려진 먹이를 먹는 잡식성이다.","combat":"낮게 웅크린 뒤 발목 가까이 달려들어 문다.","weakness":"숨을 틈이 없는 열린 바닥에서는 접근 방향을 읽기 쉽다.","derivatives":"구체적인 파생형은 미정이다."},
  {"id":"chitin","name":"키틴","stars":1,"lineage":"곤충형 씨앗종","size":"0.21m × 0.50m · 5.2kg","profile":{"status":"draft","adultAverage":{"heightM":0.21,"lengthM":0.5,"massKg":5.2},"temperament":"가까운 진동과 냄새에 반응하며 위협을 받으면 땅을 짚고 버틴다.","habits":"썩은 나무 아래와 습한 굴을 오가며 가까운 흔적을 살핀다.","nutrition":"뿌리와 곤충, 사체를 먹는다.","ecosystemRole":"썩은 나무 주변의 사체를 분해하고 흙에 작은 굴을 만든다."},"asset":"assets/combat/monsters-atlas.png","artLayout":"frames","artFrames":{"main":{"src":"assets/combat/monsters-atlas.png","x":898,"y":517,"w":424,"h":303,"imageWidth":1774,"imageHeight":887},"sd":{"src":"battle/assets/monster-armored-pixels.png","x":19,"y":597,"w":424,"h":250,"imageWidth":1330,"imageHeight":1182}},"appearance":"흑갈색 갑각과 뼈색 이음선, 다리 여섯 개와 양옆으로 열리는 톱니 앞턱.","habitat":"썩은 나무와 습한 흙의 굴.","ecology":"썩은 나무 아래와 습한 굴을 오가며 가까운 흔적을 살핀다. 뿌리와 곤충, 사체를 먹는다.","combat":"짧게 돌진해 톱니 앞턱으로 물고 지면을 짚는다.","weakness":"방향 전환이 느리고 배와 관절이 상대적으로 약하다.","derivatives":"구체적인 파생형은 미정이다."},
];
const profiles={
  ant:{"status":"draft","adultAverage":{"heightM":0.28,"lengthM":0.55,"massKg":4.5},"temperament":"둥지와 먹이에 집요하고, 단독으로 멀리 나가기를 꺼린다.","habits":"흙 둥지의 저장실을 돌며 먹이 냄새가 이어진 길을 따라 여럿이 움직인다.","nutrition":"작은 동물과 사체, 몬스터 잔해를 잘라 저장한다.","ecosystemRole":"사체를 잘게 해 분해를 돕고, 굴을 파 흙을 뒤섞는다."},
  clad:{"status":"draft","adultAverage":{"heightM":0.64,"lengthM":1.15,"massKg":180.0},"temperament":"먹이와 통로를 지키며, 위협이 가까워지면 몸의 정면을 돌린다.","habits":"폐광 낙석 더미를 돌아다니고, 좁은 굴에서는 후진으로 물러난다.","nutrition":"광석 조각과 몬스터 잔해를 압착해 몸 안으로 밀어 넣는다.","ecosystemRole":"흩어진 잔해를 작은 덩어리로 압착해 폐갱의 퇴적층에 남긴다."},
  velum:{"status":"draft","adultAverage":{"heightM":0.48,"lengthM":0.85,"massKg":12.0,"spanM":1.5},"temperament":"밝게 드러난 곳을 피하고, 무리에서 떨어진 먹잇감을 노린다.","habits":"낮에는 절벽이나 큰 나무에 거꾸로 매달려 쉬고, 해 질 무렵 낮게 활공한다.","nutrition":"작은 동물과 부상당한 몬스터를 사냥하며 사람도 공격할 수 있다.","ecosystemRole":"절벽 아래와 숲 가장자리에서 소형 포식자의 빈자리를 채운다."},
  draven:{"status":"draft","adultAverage":{"heightM":0.75,"lengthM":2.0,"massKg":72.0},"temperament":"홀로 지내며, 은신처 부근에 들어온 대상을 오래 관찰한다.","habits":"바위 구릉과 동굴 입구에 매복하고 남은 먹이를 돌 틈에 숨긴다.","nutrition":"들짐승과 중소형 몬스터를 사냥한다.","ecosystemRole":"길목의 중소형 개체수를 조절하고, 남긴 먹이는 청소성 생물이 먹는다."},
  noxvern:{"status":"draft","adultAverage":{"heightM":1.05,"lengthM":4.0,"massKg":205.0},"temperament":"빛에 오래 노출되면 어두운 틈으로 물러나는 매복형이다.","habits":"깊은 동굴의 천장과 벽을 오르며 진동을 따라 먹이의 이동을 기다린다.","nutrition":"동굴 짐승이나 지하 몬스터를 덮쳐 높은 틈으로 끌어올린다.","ecosystemRole":"굴 위쪽의 포식자로 동굴 바닥과 높은 바위 틈 사이에 먹이 잔해를 옮긴다."},
  lairon:{"status":"draft","adultAverage":{"heightM":0.95,"lengthM":1.7,"massKg":390.0},"temperament":"영역성이 강하며 광맥 주변에서 반복되는 진동에 민감하다.","habits":"광산이나 철광석 노두를 따라 움직이며, 갱도 지지대에 붙은 광물도 긁는다.","nutrition":"철이 섞인 광석을 갉아 갑각을 유지한다.","ecosystemRole":"철광석을 부스러뜨려 광물성 퇴적물을 만들고, 갱도 지지력이 약해질 수 있다."},
  nerpang:{"status":"draft","adultAverage":{"heightM":0.8,"lengthM":2.5,"massKg":265.0},"temperament":"물가에서 느긋하게 보이지만 먹이가 가까워지면 무리의 위치를 확인한다.","habits":"해안 동굴이나 하구에서 작은 무리로 쉬며 낮은 울음으로 연락한다.","nutrition":"어류와 갑각류를 주로 먹으며, 물가 가까이 온 작은 짐승도 노린다.","ecosystemRole":"연안과 하구의 어류·갑각류를 사냥하고 먹이 잔해를 조수 웅덩이에 남긴다."},
  fizz:{"status":"draft","adultAverage":{"heightM":0.95,"lengthM":1.25,"massKg":29.0},"temperament":"호기심이 많고 경계가 빠르며, 뒤로 빠질 물길을 먼저 살핀다.","habits":"침수 유적과 하구에서 단독으로도 활동하며, 사냥할 때 그라우크와 신호를 주고받기도 한다.","nutrition":"작은 물고기와 연체동물을 사냥하며 공동 사냥에선 잔해를 나눠 먹는다.","ecosystemRole":"얕은 물에서 깊은 물로 먹이 무리를 몰아 하구의 두 수역을 연결한다."},
  grauk:{"status":"draft","adultAverage":{"heightM":1.3,"lengthM":5.2,"massKg":1350.0},"temperament":"물속에서 기다리는 데 익숙하며, 수심이 낮은 곳으로 무리하게 따라가지 않는다.","habits":"깊은 물길에 잠복한다. 피즈와 신호를 맞춰 사냥하기도 하며 홀로도 활동한다.","nutrition":"큰 물고기와 수생 몬스터를 먹는다.","ecosystemRole":"하구의 큰 포식자로 깊은 물의 먹이 개체수를 조절한다."},
  cobalion:{"status":"draft","adultAverage":{"heightM":2.8,"lengthM":5.1,"massKg":2400.0},"temperament":"침착하고 경계심이 강하다. 영역 훼손과 퇴로 봉쇄에 강하게 반응한다.","habits":"고산 철광 노두 사이의 단단한 바닥을 고르고, 흔들리는 갱도 입구는 피한다.","nutrition":"철분이 섞인 광석을 부수어 섭취하고 강철 조직이 닳은 부분의 유지에 쓴다.","ecosystemRole":"철광 부스러기를 이동로에 흩뜨려 광물성 토양이 생기는 곳을 만든다."},
  terrakion:{"status":"draft","adultAverage":{"heightM":2.25,"lengthM":4.7,"massKg":1750.0},"temperament":"평소 움직임이 적고, 물러날 길이 막히면 몸을 낮추고 버틴다.","habits":"건조한 암벽 지대와 너덜지대에서 쉬며 흔들리는 바닥을 피한다.","nutrition":"풍화된 암석과 광물질을 섭취해 닳은 바위 조직을 천천히 보충한다.","ecosystemRole":"이동 중 느슨한 돌을 밀어내 작은 동물이 드나들 바위 틈과 자갈 퇴적지를 만든다."},
  viridion:{"status":"baseline","adultAverage":{"heightM":2.4,"lengthM":5.5,"massKg":380.0},"temperament":"신중하고 예민하며 낯선 자극에 호기심을 보인다.","habits":"아침에는 햇빛이 드는 공터, 한낮에는 그늘과 물가를 이용하고 밤에는 잎 조직을 접는다.","nutrition":"빛을 받아 광합성하고 물과 광물질을 흡수한 뒤 휴식하며 조직을 유지한다.","ecosystemRole":"씨앗과 꽃가루를 옮기고 떨어진 잎으로 주변 토양에 유기물을 돌려준다."},
};
const researchTasks={
 "goblin": {
  "label": "몽둥이 내리치기",
  "pattern": "몽둥이로.{0,20}내리치|몽둥이를.{0,12}내리치"
 },
 "slime": {
  "label": "몸 튕기기",
  "pattern": "몸(?:을|이).{0,12}튕"
 },
 "moa": {
  "label": "뿌리 고정",
  "pattern": "뿌리를.{0,15}(?:고정|박|내리)"
 },
 "ruke": {
  "label": "앞발 낮추기",
  "pattern": "앞발을.{0,12}낮"
 },
 "por": {
  "label": "분사 가속",
  "pattern": "물을.{0,12}(?:뿜|내뿜).{0,18}(?:가속|빨라|달려)"
 },
 "tork": {
  "label": "꼬리치기",
  "pattern": "꼬리로.{0,15}(?:치|후려)|꼬리를.{0,12}휘둘"
 },
 "kar": {
  "label": "급강하",
  "pattern": "급강하"
 },
 "ves": {
  "label": "사각 접근",
  "pattern": "(?:사각|사각지대)에서.{0,16}접근"
 },
 "rat": {
  "label": "몸 낮추기",
  "pattern": "낮게.{0,8}웅크"
 },
 "chitin": {
  "label": "톱니 앞턱 물기",
  "pattern": "(?:앞턱|톱니 턱)으로.{0,15}(?:물|문)"
 },
 "ant": {
  "label": "무리의 측면 접근",
  "pattern": "(?:무리|여럿).{0,30}(?:옆구리|측면|옆쪽).{0,15}(?:접근|다가|파고)"
 },
 "clad": {
  "label": "압착 턱 붙잡기",
  "pattern": "턱으로.{0,15}(?:붙잡|움켜|물어 잡)"
 },
 "velum": {
  "label": "낮은 활공",
  "pattern": "낮게.{0,10}활공|낮은.{0,8}활공"
 },
 "draven": {
  "label": "목주머니 팽창",
  "pattern": "목주머니.{0,12}(?:부풀|팽창)"
 },
 "noxvern": {
  "label": "벽면 이동",
  "pattern": "벽(?:을|면을).{0,12}(?:타고|올라|기어)"
 },
 "lairon": {
  "label": "낮은 자세 돌진",
  "pattern": "몸을.{0,10}낮.{0,18}돌진"
 },
 "nerpang": {
  "label": "젖은 지면 활주",
  "pattern": "(?:수막|젖은 지면).{0,24}(?:활주|미끄러)"
 },
 "fizz": {
  "label": "삼지창을 든 도약",
  "pattern": "삼지창을.{0,20}(?:도약|뛰어오르|뛰어올)"
 },
 "grauk": {
  "label": "수중 접근",
  "pattern": "(?:물속|수중)에서.{0,18}(?:다가|접근)"
 },
 "cobalion": {
  "label": "발톱으로 지면 찍기",
  "pattern": "발톱으로.{0,16}(?:지면|땅)을.{0,10}찍"
 },
 "terrakion": {
  "label": "몸을 낮춰 충격에 버팀",
  "pattern": "몸을.{0,10}낮.{0,20}(?:버티|버텨|견디)"
 },
 "viridion": {
  "label": "잎날 베기",
  "pattern": "잎날로.{0,15}(?:베어|베는|벤다|베었다|벨)"
 }
};
const records=Object.freeze([...seedMonsters,ant,clad,...added,lairon,nerpang,...aquatic105,cobalion106,terrakion107,viridion108].map(m=>{const e=E.records.find(e=>e.id===m.id);const profile=m.profile||profiles[m.id];return Object.freeze({...m,profile:Object.freeze({...profile,adultAverage:Object.freeze(profile.adultAverage)}),activeSkill:e.activeSkill||null,essences:Object.freeze([e.effect]),essenceRule:'극히 드문 드롭. '+e.effect.name+' 하나를 고정 습득하고 '+(e.stats?Object.entries(e.stats).map(([k,v])=>k+' +'+v).join(', '):'관련 스탯이 소폭 상승한다(수치 미정)')+(e.activeSkill?' 추가 고정 액티브 '+e.activeSkill.name+' 포함':'')+'. 정수 슬롯 하나 사용, 생성 후 30분 미섭취 시 소멸. 성급만으로 우열이 정해지지 않으며 조합·소모·신체 부담과 활용이 중요하다.'});}));
const byId=new Map(records.map(record=>[record.id,record]));
function observe(state){
 if(state.era!=='fantasy')return state;
 const seen=[
  ...(state.monsterAppearances||[]).map(({id})=>id),
  ...(state.combat?.enemies||[]).map(({kind})=>kind),
 ].filter(id=>byId.has(id)||sightings.some(entry=>entry.id===id));
 if(!seen.length)return state;
 const flags=new Set(state.flags||[]);
 for(const id of seen)flags.add('known_monster_'+id);
 return flags.size===(state.flags||[]).length?state:{...state,flags:[...flags]};
}
function known(state,id){return(state?.flags||[]).includes('known_monster_'+id);}
function detail(state,id,{creator=false}={}){const m=byId.get(id)||sightings.find(entry=>entry.id===id);if(!m)return null;return known(state,id)||creator?{...m,...(researchTasks[id]&&{research:registeredResearch(id)}),known:known(state,id)}:{id:m.id,known:false,name:'미발견'};}
const previews=Object.freeze([
  {
    "id": "empereut",
    "research": {
      "sighting": {"label": "직접 목격"},
      "wings": {"label": "날개 펼침", "pattern": "날개(?:지느러미)?를\\s*(?:크게\\s*)?(?:펼|펼쳤)"},
      "dive": {"label": "잠수", "pattern": "잠수(?:한다|했다|하며|하는)|물속으로\\s*(?:잠겨|잠수|들어간|뛰어든)"}
    },
    "name": "엠페르트",
    "stars": 7,
    "lineage": "익룡·수장룡 혼합 해룡형",
    "size": "성체 제안 · 높이 2.4m, 길이 5.8m, 날개 폭 6.5m, 약 320kg",
    "appearance": "금빛 각질 볏, 푸른 날개지느러미, 검푸른 몸과 흰 목, 긴 꼬리.",
    "habitat": "바닷가의 절벽·암초·해식동굴.",
    "ecology": "경계심이 강하며 무리로 해안을 이동하고 함께 사냥하고 쉰다. 밀물에 물고기·두족류·갑각류를 잡고 썰물에는 암초에서 날개막을 말린다. 먹이 잔해는 작은 해양생물의 먹이가 된다.",
    "combat": "잠수한 뒤 관각 찌르기와 익막 휩쓸기로 공격한다. 파도·상승기류를 타고 활공한다. 목 아래가 부풀면 머금은 물을 약 12m까지 1초간 분사한다.",
    "weakness": "찌르기 뒤 긴 목을 회수하는 틈이 있다. 좁은 곳과 날개막 손상은 기동을 제한하며 분사 뒤에는 물이 필요하다.",
    "essences": [
      {
        "name": "유수막",
        "effect": "피부와 밀착 의복에 실제 물을 얇게 유지한다. 수중 호흡이나 타격 방어를 주지 않는다."
      },
      {
        "name": "압수",
        "effect": "손에 닿은 물을 압축해 한 줄기로 방출한다. 초안: 물 약 1L, 마나 180, 준비 0.8초, 최대 8m, 방출 0.6초. 불안한 발판에서는 반동으로 자세가 흐트러진다."
      }
    ],
    "essenceRule": "정수 설계안 · 마나·민첩 중심. 스탯 수치와 실제 발동은 검증 전.",
    "artFrames": {
      "main": { "src": "assets/monsters/empereut-basic.png", "x": 0, "y": 0, "w": 1254, "h": 1254, "imageWidth": 1254, "imageHeight": 1254 },
      "poses": { "src": "assets/monsters/empereut-poses.png", "x": 0, "y": 0, "w": 1254, "h": 1254, "imageWidth": 1254, "imageHeight": 1254 },
      "sd": { "src": "assets/monsters/empereut-sprites.png", "x": 0, "y": 0, "w": 256, "h": 256, "imageWidth": 1024, "imageHeight": 1536 },
      "spriteSheet": { "src": "assets/monsters/empereut-sprites.png", "x": 0, "y": 0, "w": 1024, "h": 1536, "imageWidth": 1024, "imageHeight": 1536 }
    },
    "artLabels": { "poses": "추가 자세 4종", "spriteSheet": "전투 도트 24프레임" },
    "derivatives": "채팅 진행에 따른 목격과 전투에 연결. 정수는 설계안."
  },
  {
    "id": "flygon",
    "name": "플라이곤",
    "stars": 9,
    "lineage": "잠자리 특징을 가진 곤충형 용족",
    "size": "성체 평균 · 머리 높이 2.6m, 돌기까지 3.5m, 길이 4.8m, 날개 폭 6.8m, 약 190kg",
    "appearance": "녹색 외골격, 붉은 겹눈 보호층, 긴 머리 돌기, 분홍 테두리와 검은 무늬의 주황빛 날개. 원화의 팔다리와 날개 수를 유지한다.",
    "habitat": "사막의 사암 절벽과 바위 그늘.",
    "ecology": "신중하고 호기심이 많다. 단독이나 짝으로 살며 번식기에는 암벽에 모인다. 한낮에는 쉬고 아침과 저녁에 날아오르는 먹잇감을 가로챈다. 사막 상위 포식자다.",
    "combat": "정지 사냥으로 움직임을 살피고 측면 가로채기로 붙잡아 제압한다. 후퇴 급습으로 뒤로 날았다가 다시 전진한다. 낮게 날아 실제 모래를 일으킬 수 있다.",
    "weakness": "좁은 곳·돌풍·날개 손상은 비행을 방해한다. 모래 장막 너머는 자신도 볼 수 없고 정지비행과 급선회는 체력을 소모한다.",
    "essences": [
      {
        "name": "겹눈",
        "effect": "넓은 시야에서 실제로 보이는 여러 움직임을 포착한다. 가려진 대상 감지, 궤적 예측, 자동 회피는 없다."
      },
      {
        "name": "교차익",
        "effect": "정수 사용자가 두 쌍의 마나 날개를 조절해 이륙·정지비행·옆 이동·후진·선회한다. 초안: 준비 1초, 형성 마나 180, 초당 35, 최대 15초, 날개 폭 약 3m, 초기 고도 약 5m. 좁은 공간·하중·돌풍에 제약을 받으며 자동 착지와 직접 피해 판정은 없다."
      }
    ],
    "essenceRule": "정수 설계안 · 민첩·마나 중심. 스탯 수치와 실제 발동은 검증 전.",
    "artNote": "원본 파일 확보와 검수 후 일러스트 연결.",
    "derivatives": "제작자 도감 설정 자료. 조우·전투·정수 발동 미등록."
  }
].map(Object.freeze));
const sightings=Object.freeze(previews.filter(monster=>monster.artFrames?.main));
const registeredResearch=id=>({sighting:{label:'직접 목격'},behavior:researchTasks[id]});
const fieldClues=Object.freeze({
 goblin:{
  site:'숲 가장자리나 폐허',
  timing:'잔해나 관목 주변에서 움직일 때 살핀다.',
  approach:'가려진 자리에서 고블린이 숨는 곳과 돌아갈 길을 함께 살피는지 본다.',
  subject:'잔해나 관목을 엄폐로 이용',
  pattern:'(?:잔해|관목).{0,25}(?:엄폐|몸을 숨|숨어|몸을 가)',
 },
 moa:{
  site:'빛이 드는 숲 바닥이나 풀밭',
  timing:'낮에 햇빛 드는 자리가 바뀔 때 살핀다.',
  approach:'숲 바닥을 밟고 들어가지 않고 빛을 따라 움직이는지 지켜본다.',
  subject:'햇빛을 따라 이동',
  pattern:'(?:빛|햇살).{0,20}(?:따라|드는 쪽).{0,20}(?:움직|옮|이동|걸)',
 },
 ruke:{
  site:'관목이 우거진 구릉이나 숲 가장자리',
  timing:'바람이 부는 곳에서 쉬는 개체를 살핀다.',
  approach:'관목 안으로 들어가지 않고 쉬는 개체가 바람을 등지는지 본다.',
  subject:'바람을 등지고 휴식',
  pattern:'바람을.{0,12}등.{0,20}(?:쉬|쉰|앉|엎드|누워)',
 },
 por:{
  site:'얕은 강이나 호수의 수초 주변',
  timing:'수초 사이에서 작은 무리가 움직일 때 살핀다.',
  approach:'물가에서 수초 사이로 개체들이 모였다 흩어지는 모습을 본다.',
  subject:'수초 주변의 무리 이동',
  pattern:'수초.{0,36}(?:무리|여럿).{0,25}(?:모이|모여|흩어|모였)',
 },
 tork:{
  site:'햇볕 드는 바위와 가까운 그늘',
  timing:'햇볕이 드는 바위에 개체가 보일 때 살핀다.',
  approach:'바위 틈을 건드리지 않고 햇볕 드는 곳과 그늘 사이를 지켜본다.',
  subject:'바위에서 그늘로 이동',
  pattern:'그늘(?:로| 쪽으로).{0,20}(?:옮|이동|기어|들어)',
 },
 ves:{
  site:'어둡고 좁은 동굴',
  timing:'동굴 안에서 울음이 들리는 때 살핀다.',
  approach:'동굴 안쪽으로 따라가지 않고 울음의 반향에 맞춰 통로를 확인하는지 본다.',
  subject:'반향으로 통로 확인',
  pattern:'(?:반향|메아리).{0,25}(?:통로|벽면|방향).{0,18}(?:확인|살피|살핀|틀)',
 },
 rat:{
  site:'창고 벽가나 하수로 가장자리',
  timing:'벽 가장자리를 따라 움직이는 개체를 살핀다.',
  approach:'먹이를 던지지 않고 냄새를 맡은 뒤 어느 쪽으로 움직이는지 본다.',
  subject:'냄새를 따라 이동',
  pattern:'냄새.{0,18}(?:따라|맡고).{0,22}(?:움직|이동|달|옮|걸)',
 },
 chitin:{
  site:'썩은 나무와 습한 흙굴 주변',
  timing:'썩은 나무나 굴 입구에 개체가 보일 때 살핀다.',
  approach:'나무를 들추지 않고 자연스럽게 밖으로 나오는 경로를 지켜본다.',
  subject:'썩은 나무 아래에서 나오기',
  pattern:'썩은 나무.{0,15}(?:아래|밑).{0,15}(?:나오|나왔|기어 나|빠져나|모습을 드러)',
 },
 ant:{
  site:'숲 가장자리나 초원의 흙 둥지 주변',
  timing:'먹이 쪽으로 여러 개체가 움직일 때 살핀다.',
  approach:'둥지나 먹이에 손대지 않고 같은 길을 따라가는지 본다.',
  subject:'먹이 냄새를 따라 집단 이동',
  pattern:'먹이 냄새.{0,40}(?:따라|이어진).{0,30}(?:움직|행렬|이동|따라간)',
 },
 clad:{
  site:'폐광 입구나 낙석이 있는 바위 지대',
  timing:'좁은 통로를 마주한 개체가 보일 때 살핀다.',
  approach:'통로를 막지 않고 몸을 돌릴 공간이 부족할 때 어떻게 물러나는지 본다.',
  subject:'좁은 굴에서 후진',
  pattern:'(?:좁은 굴|좁은 통로).{0,30}(?:후진|뒤로).{0,16}(?:물러|빠져|움직|나온)',
 },
 velum:{
  site:'절벽이나 큰 나무 아래',
  timing:'낮에 쉬는 개체가 보일 때 살핀다.',
  approach:'절벽 아래로 들어가지 않고 큰 나무나 절벽에 매달려 쉬는 자세를 본다.',
  subject:'거꾸로 매달려 휴식',
  pattern:'거꾸로.{0,12}매달.{0,20}(?:쉬|쉰|휴식|잠)',
 },
 draven:{
  site:'바위 구릉이나 숲속 동굴 주변',
  timing:'개체가 먹이를 옮기는 모습이 보일 때 살핀다.',
  approach:'먹이와 동굴 입구에서 거리를 두고 남은 먹이를 어디에 두는지 본다.',
  subject:'돌 틈에 남은 먹이 숨기기',
  pattern:'먹이.{0,25}(?:돌|바위) 틈.{0,20}(?:숨기|숨긴|밀어 넣|감추)',
 },
 noxvern:{
  site:'깊은 동굴이나 폐광의 벽과 천장이 보이는 곳',
  timing:'바닥에서 다른 생물의 움직임이 느껴지는 때 살핀다.',
  approach:'인위적으로 바닥을 울리지 않고, 천장에 있는 개체가 현장의 진동에 어떻게 반응하는지 본다.',
  subject:'천장에서 진동에 반응',
  pattern:'천장.{0,32}진동.{0,20}(?:반응|움찔|고개를 돌|움직|따라)',
 },
 lairon:{
  site:'철광석이 드러난 암반이나 광산 입구',
  timing:'개체가 광맥이나 지지대 곁에 멈췄을 때 살핀다.',
  approach:'지지대에 접근하지 않고 광물을 긁는 모습을 멀리서 확인한다.',
  subject:'노출된 광물 긁기',
  pattern:'(?:광물|철광석|광맥).{0,18}(?:긁|긁어내)',
 },
 nerpang:{
  site:'해안 동굴 입구나 강 하구',
  timing:'작은 무리가 쉬고 있는 때 살핀다.',
  approach:'물에 들어가지 않고 낮은 울음에 다른 개체가 응답하는지 듣는다.',
  subject:'낮은 울음으로 무리와 연락',
  pattern:'낮은 울음.{0,32}(?:응답|화답|울음으로 답|서로)',
 },
 fizz:{
  site:'침수 유적이나 깊은 하구 주변',
  timing:'피즈가 물가에서 사냥할 때 멀리서 살핀다.',
  approach:'다른 개체의 출현을 전제로 삼지 않고 그라우크와 신호를 주고받는지 본다.',
  subject:'그라우크와 사냥 신호 교환',
  pattern:'(?:그라우크.{0,33}신호|신호.{0,33}그라우크).{0,22}(?:주고받|화답|응답|보내고.{0,10}답)',
 },
 grauk:{
  site:'해안 동굴이나 깊은 하구의 물길',
  timing:'깊은 물길이 보일 때 안전한 육지에서 살핀다.',
  approach:'얕은 물에 들어가지 않고 개체가 물길 깊은 곳에서 잠복하는 모습을 본다.',
  subject:'깊은 물길에서 잠복',
  pattern:'깊은.{0,15}(?:물길|물속).{0,25}(?:잠복|숨은 채|숨어.{0,10}기다|가만히.{0,10}기다)',
 },
 cobalion:{
  site:'철광맥이 드러난 고산 지대',
  timing:'발밑을 살피며 이동하는 개체가 보일 때 관찰한다.',
  approach:'이동 경로를 막지 않고 느슨한 지면 가장자리에서 어떤 바닥을 고르는지 본다.',
  subject:'단단한 바닥을 골라 이동',
  pattern:'단단한.{0,15}(?:바닥|암반|지면).{0,24}(?:골라|골랐|디디|밟고|택해)',
 },
 terrakion:{
  site:'건조한 암벽이나 너덜지대',
  timing:'개체가 멈춰 쉴 곳을 찾을 때 살핀다.',
  approach:'자갈을 움직이지 않고 개체가 흔들리는 바닥을 피해 어디에서 쉬는지 본다.',
  subject:'흔들리는 바닥을 피해 이동',
  pattern:'(?:흔들리는 바닥|움직이는 자갈|흔들리는 돌).{0,28}(?:피해|피하|피했|돌아가|비켜)',
 },
 viridion:{
  site:'숲의 공터와 인근 그늘',
  timing:'한낮에 햇빛이 강할 때 살핀다.',
  approach:'숲 안에서 뒤쫓지 않고 공터 가장자리에서 그늘로 옮겨가는 모습을 본다.',
  subject:'한낮에 그늘로 이동',
  pattern:'그늘(?:로| 쪽으로).{0,22}(?:옮|이동|걸어|들어)',
 },
 empereut:{
  site:'해안 절벽이나 암초',
  timing:'밀물 때와 썰물 때를 비교한다.',
  approach:'물 밖의 안전한 높은 곳에서 무리가 먹이를 모는 수면을 살핀다.',
  subject:'무리 사냥',
  pattern:'(?:무리|여럿).{0,45}(?:몰아|사냥)|(?:물고기|먹이).{0,20}(?:몰아|에워싸)',
 },
 slime:{
  site:'그늘진 얕은 물가나 습한 폐허 바닥',
  timing:'바닥이 아직 젖어 있을 때 살핀다.',
  approach:'발밑의 물기를 확인하고 젖은 바닥에서 돌 틈까지 이어지는 경로를 멀리서 본다.',
  subject:'젖은 지면을 따라 이동',
  pattern:'(?:젖은|축축한).{0,15}(?:바닥|돌|지면).{0,30}(?:미끄러|이동|기어)',
 },
 kar:{
  site:'숲 가장자리나 절벽',
  timing:'높은 가지나 바위턱에 앉아 아래를 살피는 순간을 기다린다.',
  approach:'나무나 바위 뒤에서 높은 자리와 탁 트인 지면 사이의 비행 경로를 본다.',
  subject:'높은 자리에서 아래를 살피는 행동',
  pattern:'(?:가지|바위턱|절벽의 턱).{0,30}(?:아래를|바닥을).{0,18}(?:내려다|살피|주시)',
 },
});
const clueInput=name=>name+'의 협회 조사 단서를 확인한다';
const researchMonsters=Object.freeze([
 ...records.filter(({id})=>researchTasks[id]).map(({id})=>({id,research:registeredResearch(id)})),
 ...sightings.filter(m=>m.research),
]);
return {records,previews,sightings,researchMonsters,fieldClues,clueInput,known,detail,observe};
});
