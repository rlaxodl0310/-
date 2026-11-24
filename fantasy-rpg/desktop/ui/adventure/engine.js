(function (r, f) {
  if (typeof module === "object" && module.exports)
    module.exports = f(
      require("../progression/model.js"),
      require("../progression/experience.js"),
      require("../combat/rules.js"),
      require("../association/economy.js"),
      require("../map/geography.js"),
      require("../map/facilities.js"),
      require("../monsters/essence-rules.js"),
      require("../party/model.js"),
      require("../escort/model.js"),
      require("../escort/personal.js"),
      require("../mining/model.js"),
      require("../association/dynamic-contracts.js"),
      require("../rescue/model.js"),
      require("../dungeon/model.js"),
      require("./tracking.js"),
      require("../journey/host.js"),
      require("../passage/host.js"),
    );
  else
    r.Adventure = f(
      r.Progression,
      r.ExperienceRules,
      r.CombatRules,
      r.GameEconomy,
      r.GameGeography,
      r.WorldFacilities,
      r.EssenceRules,
      r.PartyRewards,
      r.CaravanEscort,
      r.PersonalEscort,
      r.MiningQuest,
      r.DynamicContracts,
      r.RescueQuest,
      r.DungeonQuest,
      r.HuntTracking,
      r.JourneyHost,
      r.PassageHost,
    );
})(globalThis, (Growth, XP, Rules, Money, Geo, Facilities, Essences, Party, Escort, Personal, Mining, Dynamic, Rescue, Dungeon, Tracking, Journey, Passage) => {
  "use strict";
  const clone = (x) => JSON.parse(JSON.stringify(x)),
    fail = (m) => {
      throw Error(m);
    };
  // Balance defaults, not immutable world laws. Essences remain exceptionally rare.
  const policy = Object.freeze({
    version: 2,
    essenceChance: 0.0001,
    soulStoneChance: 0.00015,
    stoneChance: 0.2,
    refreshMinutes: 360,
    surveyMinutes: 10,
    contracts: Object.freeze({
      hunt: { reward: 100, xp: 52, count: 2 },
      ecology: { reward: 40, xp: 45, count: 1 },
      supply: { reward: 24, xp: 36, count: 2 },
      caravan: { reward: 160, xp: 90, count: 3 },
      escort: { reward: 180, xp: 110, count: 3 },
      dungeon: { reward: 140, xp: 100, count: 1 },
      rescue: { reward: 100, xp: 70, count: 1 },
      mining: { reward: 120, xp: 80, count: 4 },
    }),
  });
  function association(state) {
    return Facilities.hasService(state.location,"quest-board");
  }
  function ensure(state) {
    const s = clone(state);
    if (!s.adventure) {
      const economy = Money.ledger();
      economy.wallet = 0;
      economy.inventory = {};
      economy.initialTotal -= 300;
      s.adventure = {
        version: 1,
        economy,
        quests: [],
        inventory: [],
        ground: [],
        battleReceipts: [],
        actions: [],
        refreshes: {},
        sequence: 0,
      };
    }
    if (Array.isArray(s.adventure.ground))
      for (const loot of s.adventure.ground) {
        if (loot.soulStone === undefined) loot.soulStone = false;
        if (loot.dropVersion === undefined) loot.dropVersion = 1;
      }
    if(Passage&&s.passages)Object.assign(s,Passage.tick(s));
    validate(s.adventure);
    if(Passage)Passage.validate(s);
    if(Journey)Journey.validate(s);
    if(Escort)Escort.validate(s);
    if(Personal)Personal.validate(s);
    if(Mining)Mining.validate(s);
    if(Dungeon){if(s.era==='fantasy')s.dungeons=Dungeon.world(s);Object.assign(s,Dungeon.tick(s));Dungeon.validate(s);}
    if(Rescue)Rescue.validate(s);
    if(Dynamic)Dynamic.validate(s);
    return expire(s);
  }
  function validate(a) {
    if (
      a.version !== 1 ||
      !Array.isArray(a.quests) ||
      !Array.isArray(a.inventory) ||
      !Array.isArray(a.ground) ||
      !Array.isArray(a.battleReceipts) ||
      !Array.isArray(a.actions) ||
      !a.refreshes ||
      !Number.isSafeInteger(a.sequence) ||
      a.sequence < 0
    )
      fail("본편 모험 기록이 잘못되었습니다.");
    Money.check(a.economy);
    for(const q of a.quests)Tracking?.validate(q.tracking,q);
    if (
      a.inventory
        .filter((i) => i.kind === "material")
        .reduce((n, i) => n + i.quantity, 0) !==
      (a.economy.inventory.monster_scrap || 0)
    )
      fail("납품 재료 장부가 일치하지 않습니다.");
    if (new Set(a.battleReceipts).size !== a.battleReceipts.length)
      fail("중복 전투 획득 기록입니다.");
    for (const rows of [a.quests, a.ground, a.inventory])
      if (new Set(rows.map((x) => x.id)).size !== rows.length)
        fail("중복 모험 기록입니다.");
    for (const item of a.inventory)
      if (
        !["material", "stone", "soul-stone"].includes(item.kind) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
      )
        fail("소지품 수량이 잘못되었습니다.");
    for (const loot of a.ground)
      if (
        !Number.isFinite(loot.createdAt) ||
        loot.createdAt < 0 ||
        typeof loot.claimed !== "boolean" ||
        typeof loot.essence !== "boolean" ||
        typeof loot.stone !== "boolean" ||
        typeof loot.soulStone !== "boolean" ||
        !Geo.records.some((p) => p.id === loot.location) ||
        !Essences.records.some(
          (m) => m.id === loot.species && m.stars === loot.stars,
        )
      )
        fail("전리품 출처 기록이 잘못되었습니다.");
    for (const q of a.quests) if(q.fieldNote&&(!Number.isFinite(q.fieldNote.at)||q.fieldNote.at<0||q.fieldNote.location!==q.destination||q.fieldNote.species!==q.species||q.fieldNote.source!=='quest-report'))fail("현장 확인 기록이 잘못되었습니다.");
    for (const q of a.quests)
      if (
        !policy.contracts[q.type] ||
        !Geo.records.some((p) => p.id === q.issuerLocation) ||
        !Geo.records.some((p) => p.id === q.destination) ||
        !Number.isFinite(q.deadline) ||
        !["open", "accepted", "completed", "expired", "failed"].includes(q.status) ||
        !Number.isInteger(q.progress) ||
        q.progress < 0
      )
        fail("본편 의뢰 기록이 잘못되었습니다.");
  }
  function expire(s) {
    if(Dungeon)s=Dungeon.tick(s);
    if (s.player.progression) {
      const items = s.player.progression.inventory;
      s.player.progression.inventory = items.filter(
        (i) => i.kind !== "essence" || (s.minutes || 0) < i.expiresAt,
      );
      s.player = Growth.recalculate(s.player);
    }
    for (const q of s.adventure.quests)
      if (["open", "accepted"].includes(q.status) && s.minutes > q.deadline && !(q.type==='caravan'&&Escort?.ready(s,q)) && !(q.type==='escort'&&Personal?.ready(s,q)) && !(q.type==='mining'&&Mining?.ready(s,q)) && !(q.type==='rescue'&&Rescue?.ready(s,q)) && !(q.type==='dungeon'&&Dungeon?.ready(s,q))) {
        q.status = "expired";
        Money.release(s.adventure.economy, q.id);
      }
    if(Escort)Escort.expire(s);
    if(Personal)Personal.expire(s);
    if(Mining)Mining.expire(s);
    if(Rescue)Rescue.expire(s);
    if(Party&&s.partyRewards){Party.validate(s);Party.expire(s);}
    return s;
  }
  function locationName(id) {
    return Geo.records.find((x) => x.id === id)?.name || id;
  }
  function travelText(id) {
    const name = locationName(id),
      code = name.charCodeAt(name.length - 1) - 0xac00,
      jong = code >= 0 && code < 11172 ? code % 28 : 0;
    return name + (jong && jong !== 8 ? "으로" : "로") + " 이동한다.";
  }
  function destination(s) {
    const origin = Geo.records.find((p) => p.id === s.location);
    if (!origin) fail("지역 정보를 확인할 수 없습니다.");
    const sites = Geo.records.filter(
      (p) => p.continent === origin.continent && p.kind === "wilderness",
    );
    sites.sort(
      (a, b) =>
        Math.hypot(a.point[0] - origin.point[0], a.point[1] - origin.point[1]) -
        Math.hypot(b.point[0] - origin.point[0], b.point[1] - origin.point[1]),
    );
    if (!sites[0]) fail("의뢰 목적지가 없습니다.");
    return sites[0];
  }
  function refresh(s) {
    if (!association(s))
      fail("의뢰 게시판이 있는 도시나 마을에서 확인해 주세요.");
    const a = s.adventure,
      previous = a.refreshes[s.location];
    if (previous !== undefined && s.minutes - previous < policy.refreshMinutes) {
      let added=0;
      if(Escort&&!a.quests.some(q=>q.type==='caravan'&&q.issuerLocation===s.location))added+=Escort.post(s);
      if(Personal&&!a.quests.some(q=>q.type==='escort'&&q.issuerLocation===s.location))added+=Personal.post(s);
      if(Mining&&!a.quests.some(q=>q.type==='mining'))added+=Mining.post(s);
      if(added)return s;
      fail("새 의뢰는 세계 시간6시간마다 확인할 수 있습니다.");
    }
    const site = destination(s),
      species = /곤충/.test(site.note)
        ? "ant"
        : /동굴|바위/.test(site.note)
          ? "tork"
          : /강|해안|호수/.test(site.note)
            ? "por"
            : "goblin",
      monster = Essences.records.find((x) => x.id === species);
    let made = 0;
    for (const type of ["hunt", "ecology", "supply"]) {
      if (
        a.quests.some(
          (q) =>
            q.issuerLocation === s.location &&
            q.type === type &&
            ["open", "accepted"].includes(q.status),
        )
      )
        continue;
      const spec = policy.contracts[type],
        id = "story-quest-" + ++a.sequence,
        delivery = type === "supply",
        q = {
          id,
          type,
          rank: "E",
          issuerLocation: s.location,
          destination: delivery ? s.location : site.id,
          species: delivery ? null : species,
          target: spec.count,
          progress: 0,
          proofs: [],
          status: "open",
          postedAt: s.minutes,
          deadline: s.minutes + 72 * 60,
          reward: spec.reward,
          experienceReward: spec.xp,
          materialsCap: 0,
          partySize: 1,
          durationDays: 1,
          estimatedCosts: 0,
          estimatedMaterialSpend: 0,
          deliveryItem: delivery ? "monster_scrap" : null,
          deliveryQuantity: delivery ? spec.count : 0,
          title: {
            hunt: monster.name + " 출몰 대응",
            ecology: site.name + " 현장 조사",
            supply: "몬스터 재료 소량 납품",
          }[type],
        };
      q.description =
        type === "hunt"
          ? locationName(site.id) +
            "에서 " +
            monster.name +
            " " +
            q.target +
            "마리의 위협을 제거하고 접수소로 돌아와 보고해 주세요."
          : type === "ecology"
            ? locationName(site.id) +
              "에 직접 방문해10분간 주변 지형과 흔적을 조사하고 기록을 제출해 주세요."
            : "실제 소지한 몬스터 재료 " +
              q.target +
              "개를 접수소에 인계해 주세요.";
      if (!Money.reserve(a.economy, id, "association", q)) continue;
      a.quests.push(q);
      made++;
    }
    if(Escort)made+=Escort.post(s);
    if(Personal)made+=Personal.post(s);
    if(Mining)made+=Mining.post(s);
    if (!made) fail("추가 가능한 의뢰나 예치 예산이 없습니다.");
    a.refreshes[s.location] = s.minutes;
    return s;
  }
  function ready(s, q) {
    if(q.type==='caravan')return Escort?Escort.ready(s,q):false;
    if(q.type==='escort')return Personal?Personal.ready(s,q):false;
    if(q.type==='dungeon')return Dungeon?Dungeon.ready(s,q):false;
    if(q.type==='rescue')return Rescue?Rescue.ready(s,q):false;
    if(q.type==='mining')return Mining?Mining.ready(s,q):false;
    return q.type === "supply"
      ? s.adventure.inventory.filter(i=>i.kind==='material'&&!i.partyLootId).reduce((n,i)=>n+i.quantity,0) >= q.target
      : q.progress >= q.target;
  }
  function addStack(a, item) {
    const old = a.inventory.find((x) => x.id === item.id);
    if (old) old.quantity += item.quantity;
    else a.inventory.push(clone(item));
    if (item.kind === "material")
      a.economy.inventory.monster_scrap =
        (a.economy.inventory.monster_scrap || 0) + item.quantity;
  }
  function observe(previous, state) {
    if(Journey)state=Journey.observe(previous,state);
    if(Tracking)state=Tracking.observe(previous,state);
    if(Escort)state=Escort.observe(previous,state);
    if(Personal)state=Personal.observe(previous,state);
    if(Mining)state=Mining.observe(previous,state);
    if(Rescue)state=Rescue.observe(previous,state);
    if(Dungeon)state=Dungeon.observe(previous,state);
    if (state.era !== "fantasy") return state;
    const old = previous.combat,
      battle = state.combat,
      won =
        old?.status === "playing" &&
        battle?.status === "won" &&
        old.id === battle.id;
    if (!state.adventure && !won) return state;
    const s = ensure(state),
      a = s.adventure;
    if (!won || a.battleReceipts.includes(battle.id)) return s;
    if (
      battle.enemies.some((e) => e.hp > 0) ||
      battle.enemies.length !== old.enemies.length ||
      battle.enemies.some(
        (e, i) => e.kind !== old.enemies[i].kind || e.id !== old.enemies[i].id,
      )
    )
      fail("전리품을 생성할 수 없는 전투 결과입니다.");
    for (const enemy of battle.enemies) {
      const m = Essences.records.find((m) => m.id === enemy.kind);
      if (!m) fail("등록되지 않은 전리품 출처입니다.");
      const random = Rules.rng(
          Rules.hash("drop:" + battle.id + ":" + enemy.id),
        ),
        rareRoll = random.next(),
        essence = rareRoll < policy.essenceChance,
        soulStone =
          rareRoll >= policy.essenceChance &&
          rareRoll < policy.essenceChance + policy.soulStoneChance,
        stone = random.next() < policy.stoneChance,
        id = "loot-" + battle.id + "-" + enemy.id;
      a.ground.push({
        id,
        location: s.location,
        species: m.id,
        name: m.name,
        createdAt: s.minutes,
        claimed: false,
        essence,
        soulStone,
        dropVersion: 2,
        stone,
        stars: m.stars,
        ...(battle.partyProof?{partyClaimants:battle.partyProof.claimants,partyContract:battle.partyProof.contract}:{}),
      });
      for (const q of a.quests)
        if (
          q.status === "accepted" &&
          q.type === "hunt" &&
          q.destination === s.location &&
          q.species === m.id &&
          q.acceptedAt <= previous.minutes &&
          !q.proofs.includes(id)
        ) {
          q.performers=[...new Set([...(q.performers||[]),...Object.keys(battle.partyProof?.metrics||{}).filter(id=>Object.values(battle.partyProof.metrics[id]).some(n=>n>0)),...(!battle.partyProof?["taei"]:[])])];
          q.progress++;
          q.proofs.push(id);
        }
    }
    a.battleReceipts.push(battle.id);
    return s;
  }
  function apply(state, action, { requestId, createCombat } = {}) {
    if(Passage)Passage.guard(state);
    if(['hunt','scout'].includes(action.type)&&Object.values(state.transports?.trips||{}).some(t=>t.status==='active'&&[t.carrierId,t.targetId].includes('taei')))fail('먼저 부축·운반 관계를 정리해 주세요.');
    if (state.era !== "fantasy") fail("이세계에서 사용할 수 있습니다.");
    if (state.combat?.status === "playing") fail("전투를 먼저 마쳐 주세요.");
    if (state.player.hp <= 0) fail("전투 불능 상태에서는 수행할 수 없습니다.");
    if(Rules.fatigue(state.player).exhausted&&['hunt','survey','scout'].includes(action.type))fail('탈진 상태에서는 먼저 수면이 필요합니다.');
    const s = ensure(state),
      a = s.adventure;
    let q;
    if (["accept", "submit", "survey", "hunt", "scout", "track", "trackStep"].includes(action.type)) {
      q = a.quests.find((q) => q.id === action.questId);
      if (!q) fail("존재하지 않는 의뢰입니다.");
    }
    if (
      action.type === "refreshAI" &&
      association(s) &&
      a.quests.some(
        (q) => q.status === "open" && q.issuerLocation === s.location,
      )
    ) {
      if(Escort&&!a.quests.some(q=>q.type==='caravan'&&q.issuerLocation===s.location))Escort.post(s);
      if(Personal&&!a.quests.some(q=>q.type==='escort'&&q.issuerLocation===s.location))Personal.post(s);
      if(Mining&&!a.quests.some(q=>q.type==='mining'))Mining.post(s);
      return s;
    }
    if (action.type === "refresh" || action.type === "refreshAI")
      return refresh(s);
    if (action.type === "accept") {
      if (
        q.status !== "open" ||
        q.issuerLocation !== s.location ||
        !association(s)
      )
        fail("해당 접수소에서 모집 중인 의뢰만 수락할 수 있습니다.");
      q.status = "accepted";
      q.acceptedAt = s.minutes;
      q.performers=[];
      q.partyContract=Party?(Party.context(s).contract||null):null;
      return s;
    }
    if (action.type === "submit") {
      if (q.status === "completed") fail("이미 정산한 의뢰입니다.");
      if (
        q.status !== "accepted" ||
        (['caravan','escort'].includes(q.type)?s.location!==q.destination:q.issuerLocation !== s.location || !association(s)) ||
        !ready(s, q)
      )
        fail("원래 접수소에서 실제 목표와 증빙을 완료한 뒤 제출해 주세요.");
      const receipt = Money.settle(a.economy, q, {
        authority: "engine",
        questId: q.id,
        objectiveVerified: true,
        costCopper: 0,
        materialCostCopper: 0,
        handedOver: true,
      });
      if (q.type === "supply") {
        let remaining = q.target;
        for (const item of a.inventory.filter((x) => x.kind === "material"&&!x.partyLootId)) {
          const taken = Math.min(item.quantity, remaining);
          item.quantity -= taken;
          remaining -= taken;
        }
        a.inventory = a.inventory.filter((i) => i.quantity > 0);
        if (remaining) fail("실제 납품 재료가 부족합니다.");
      }
      q.performers=[...new Set([...(q.performers||[]),...(q.type==='supply'?['taei']:[])])];
      if(Party){const rewarded=Party.questXP(s,q);s.player=rewarded.player;if(rewarded.partyRewards)s.partyRewards=rewarded.partyRewards;}else s.player=XP.award(s.player,q.experienceReward,'story-quest:'+q.id,'quest');
      const payees=q.partyContract?.mode&&q.partyContract.mode!=='discuss'?q.partyContract.members:q.performers.length?q.performers:q.partyContract?.members||['taei'];
      if(Party&&payees.length>1){const shared=Party.reserveMoney(s,q.reward,payees,q.partyContract,'quest:'+q.id);s.partyRewards=shared.partyRewards;s.adventure.economy=shared.adventure.economy;q.sharedMoneyPool=shared.partyRewards.pools.at(-1).id;}
      q.status = "completed";
      q.completedAt = s.minutes;
      q.receipt = { ...receipt, xp: q.experienceReward };
      if(Personal)Personal.complete(s,q);
      return s;
    }
    if (action.type === "survey") {
      if (
        q.type !== "ecology" ||
        q.status !== "accepted" ||
        q.destination !== s.location ||
        ready(s, q)
      )
        fail("조사 의뢰의 실제 목적지에서 수행해 주세요.");
      s.minutes += q.surveyMinutes||policy.surveyMinutes;
      if (s.minutes > q.deadline) fail("조사 중 의뢰 기한을 넘깁니다.");
      q.performers=[...new Set([...(q.performers||[]),"taei"])];
      q.progress = 1;
      q.proofs.push("survey:" + requestId);
      q.observation = Geo.records.find((p) => p.id === s.location).note;
      return expire(s);
    }
    if(action.type==='track')return Tracking.begin(s,q.id,Tracking.local(s,q.id));
    if(action.type==='trackStep')return Tracking.step(s,q.id,action.decision,{createCombat});
    if (action.type === "scout") {
      if(q.type!=='hunt'||q.status!=='accepted'||q.destination!==s.location||ready(s,q))fail('수행 중인 토벌 의뢰의 현장에서 확인해 주세요.');
      if(q.fieldNote?.location===s.location)fail('이미 확인한 현장 기록입니다. 추가 관찰은 대화로 이어가세요.');
      if(s.minutes+5>q.deadline)fail('현장 확인 중 의뢰 기한을 넘깁니다.');
      s.minutes+=5;
      q.fieldNote={location:s.location,at:s.minutes,species:q.species,source:'quest-report',terrain:Geo.records.find(p=>p.id===s.location)?.note||''};
      return expire(s);
    }
    if (action.type === "hunt") {
      if(q.tracking)fail("이 의뢰는 추적 화면에서 관찰·접근·철수를 선택해 주세요.");
      if (
        q.type !== "hunt" ||
        q.status !== "accepted" ||
        q.destination !== s.location ||
        ready(s, q)
      )
        fail("토벌 의뢰의 실제 목적지에서 대상을 찾아 주세요.");
      if (typeof createCombat !== "function")
        fail("전투 실행기가 연결되지 않았습니다.");
      s.combat = createCombat(
        Array(Math.min(3, q.target - q.progress)).fill(q.species),
        "chat",
        q.title,
      );
      s.combat.adventureQuestId=q.id;
      s.scene = "combat";
      return s;
    }
    if (action.type === "pickup") {
      const loot = a.ground.find((x) => x.id === action.lootId);
      if (!loot || loot.claimed || loot.location !== s.location)
        fail("이 장소에서 아직 회수하지 않은 전리품만 획득할 수 있습니다.");
      if(Party){const shared=Party.capture(s,loot);if(shared){const captured=shared.adventure.ground.find(x=>x.id===loot.id);captured.claimed=true;captured.claimedAt=s.minutes;return shared;}}
      addStack(a, {
        id: "material:" + loot.species,
        name: loot.name + " 재료",
        kind: "material",
        quantity: 1,
        species: loot.species,
      });
      if (loot.stone)
        addStack(a, {
          id: "stone:" + loot.stars,
          name: loot.stars + "등급 마석",
          kind: "stone",
          quantity: 1,
        });
      if (loot.soulStone)
        addStack(a, {
          id: "soul:" + loot.species,
          name: loot.name + " 영혼석",
          kind: "soul-stone",
          species: loot.species,
          stars: loot.stars,
          quantity: 1,
        });
      if (loot.essence && s.minutes < loot.createdAt + 30)
        s.player = Growth.grant(
          s.player,
          {
            id: "essence:" + loot.id,
            kind: "essence",
            species: loot.species,
            createdAt: loot.createdAt,
          },
          "pickup:" + loot.id,
          s.minutes,
        );
      loot.claimed = true;
      loot.claimedAt = s.minutes;
      return s;
    }
    fail("지원하지 않는 모험 행동입니다.");
  }
  function context(s) {
    if (!s.adventure)
      return {
        rule: "본편 의뢰는 실제 게시판 수락/목표 수행/접수소 제출로 정산한다. AI의 대사만으로 돈·경험치·소지품을 만들지 않는다.",
      };
    return {
      dungeon: Dungeon?Dungeon.context(s):null,
      rescue: Rescue?Rescue.context(s):null,
      quests: s.adventure.quests
        .filter(
          (q) =>
            q.status === "accepted" ||
            (q.status === "open" && q.issuerLocation === s.location),
        )
        .slice(-16)
        .map((q) => ({
          id: q.id,
          type: q.type,
          title: q.title,
          description: q.description,
          flavor: q.flavor || "",
          destination: q.destination,
          issuer: q.issuerLocation,
          tracking: q.type==='hunt'?Tracking?.context(s,q.id)||null:null,
          fieldNote: q.fieldNote||null,
          progress: q.progress,
          target: q.target,
          ready: ready(s, q),
        })),
      inventory: s.adventure.inventory,
      ground: s.adventure.ground.filter(
        (x) => !x.claimed && x.location === s.location,
      ),
      wallet: s.adventure.economy.wallet,
      rule: "목표 달성은 자동 정산이 아니다. 실제 접수소에서 제출해야 한다. 현장 전리품도 회수해야 소지품이 된다. 확인된 판정만 묘사한다.",
    };
  }
  return {
    policy,
    association,
    ensure,
    validate,
    observe,
    apply,
    context,
    ready,
    locationName,
    travelText,
  };
});
