(function (r) {
  "use strict";
  function render(
    body,
    state,
    onAction,
    {
      onTravel = () => {},
      onPrepare = () => {},
      onCombat = () => {},
      onRewards = () => {},
      onPassage = () => {},
      onEscort = () => {},
      onMining = () => {},
      onRescue = () => {},
      onDungeon = () => {},
      onAbsorb = async () => {},
      disabled = false,
      allowAI = true,
      showLab = true,
    } = {},
  ) {
    const n = (tag, text, parent = body) => {
        const e = document.createElement(tag);
        e.textContent = text;
        parent.append(e);
        return e;
      },
      a = state.adventure,
      locked =
        disabled ||
        state.era !== "fantasy" ||
        state.combat?.status === "playing" ||
        state.player.hp <= 0;
    let dialog;
    if(a?.generation?.boards?.[state.location]){const g=a.generation.boards[state.location];n("p","탱탱 "+(g.source==='ai'?"↔ ChatGPT":"· 로컬 생성")+" · 게시판 "+g.generation+"회차");const log=n("details","");n("summary","탱탱의 계약 검토 기록",log);for(const x of g.exchange||[])n("p",x.actor+" · "+x.text,log);}
    const caravanTitle=n("p","호위는 ‘호위 여정’·‘개인 호위’, 채굴은 ‘마석 채굴’에서 실제 수행할 수 있습니다.");
    const message = n("p", "");
    message.setAttribute("role", "status");
    async function run(action) {
      if (locked) return;
      if (dialog) {
        dialog.close();
        dialog.remove();
      }
      const controls = [...body.querySelectorAll("button")].map((b) => [
        b,
        b.disabled,
      ]);
      for (const [b] of controls) b.disabled = true;
      try {
        await onAction(action);
      } catch (e) {
        message.textContent = e.message;
        for (const [b, value] of controls) b.disabled = value;
      }
    }
    function button(text, action, parent = body, off = false) {
      const b = n("button", text, parent);
      b.disabled = locked || off;
      b.onclick = () => run(action);
      return b;
    }
    n("h3", "본편 의뢰·소지품");
    n("p", "현재 위치 · " + Adventure.locationName(state.location));
    n("p", "파티 공금 · " + GameEconomy.format(a?.economy.wallet || 0));
    if (locked)
      n("p", "이세계에서 장면 생성과 전투를 마친 뒤 사용할 수 있습니다.");
    button(
      "탱탱에게 새 게시판 요청",
      { type: "refresh" },
      body,
      !Adventure.association(state),
    );
    if (allowAI)
      button(
        "탱탱 ↔ ChatGPT · 계약 생성",
        { type: "refreshAI" },
        body,
        !Adventure.association(state),
      );
    if(showLab){const generatorLab=n("a","탱탱 생성 시험 · 본편과 분리");generatorLab.href="association/generator-lab.html";}
    if(typeof HuntFieldUI!=='undefined')for(const q of a?.quests||[]){if(q.type!=='hunt'||q.status!=='accepted')continue;const entry=n('button','의뢰 현장 · '+q.title);entry.className='hunt-hud';entry.onclick=()=>HuntFieldUI.open(state,q.id,onAction,{onTravel,onCombat,onRewards,onPassage});}
    const board = n("div", "");
    board.className = "wooden-quest-board";
    const papers = n("div", "", board);
    papers.className = "quest-paper-grid";
    const archive=n("details","");n("summary","완료·교체·기한 종료 의뢰",archive);const archivedPapers=n("div","",archive);archivedPapers.className="quest-paper-grid";
    for (const q of a?.quests || []) {
      if (q.issuerLocation !== state.location && q.status !== "accepted")
        continue;
      const paper = n("button", "", ["open","accepted"].includes(q.status)?papers:archivedPapers);
      paper.className = "quest-paper";
      paper.dataset.state = q.status;
      paper.dataset.questId=q.id;
      const progress =
        q.type === "supply"
          ? a.inventory.filter(i=>i.kind==='material'&&!i.partyLootId).reduce((n,i)=>n+i.quantity,0)
          : q.progress;
      for (const [tag, text] of [
        ["strong", q.title],
        [
          "span",
          {
            open: "모집 중",
            accepted: "수행 중",
            completed: "정산 완료",
            expired: "기한 종료",
            failed: "계약 실패",
          }[q.status],
        ],
        ["span", Adventure.locationName(q.destination)],
        [
          "span",
          GameEconomy.format(q.reward) + " · " + q.experienceReward + "XP",
        ],
        ["span", Math.min(progress, q.target) + "/" + q.target],
      ])
        n(tag, text, paper);
      paper.onclick = () => {
        dialog = document.createElement("dialog");
        dialog.className = "quest-document";
        n("h3", q.title, dialog);
        n("p", q.description, dialog);
        if (q.flavor) n("p", q.flavor, dialog);
        n("p", "접수소 · " + Adventure.locationName(q.issuerLocation), dialog);
        n("p", "목적지 · " + Adventure.locationName(q.destination), dialog);
        n(
          "p",
          "보수 · " +
            GameEconomy.format(q.reward) +
            " / " +
            q.experienceReward +
            "XP",
          dialog,
        );
        n(
          "p",
          "남은 기한 · " + Math.max(0, q.deadline - state.minutes) + "분",
          dialog,
        );
        const prep=n('button','출발 준비 확인',dialog);prep.disabled=disabled;prep.onclick=()=>{dialog.close();dialog.remove();onPrepare(q.id);};
        if (q.observation) n("p", "조사 기록 · " + q.observation, dialog);
        if(q.type==='hunt'&&typeof HuntFieldUI!=='undefined'){const enter=n('button','일러스트 현장 열기',dialog);enter.onclick=()=>{dialog.close();dialog.remove();HuntFieldUI.open(state,q.id,onAction,{onTravel,onCombat,onRewards,onPassage});};}
        if (q.status === "open")
          button(
            "의뢰 수락",
            { type: "accept", questId: q.id },
            dialog,
            q.issuerLocation !== state.location,
          );
        if (q.status === "accepted") {
          button(
            "접수소에 증빙 제출·정산",
            { type: "submit", questId: q.id },
            dialog,
            (['caravan','escort'].includes(q.type)?q.destination!==state.location:q.issuerLocation !== state.location) || !Adventure.ready(state, q),
          );
          if (q.type === "hunt")
            button(
              "현장 추적 여정 시작",
              { type: "track", questId: q.id },
              dialog,
              q.destination !== state.location || Adventure.ready(state, q),
            );
          if (q.type === "ecology")
            button(
              "현장 조사 · "+(q.surveyMinutes||10)+"분",
              { type: "survey", questId: q.id },
              dialog,
              q.destination !== state.location || Adventure.ready(state, q),
            );
          const travel = n("button", q.type==='dungeon'?"던전 여정 열기":q.type==='rescue'?"구조 여정 열기":q.type==='mining'?"채굴 여정 열기": ['caravan','escort'].includes(q.type)?"호위 여정 열기":"이동할 말 입력", dialog);
          travel.onclick = () => {
            dialog.close();
            dialog.remove();
            if(q.type==='dungeon'){onDungeon();return;}if(q.type==='rescue'){onRescue();return;}if(q.type==='mining'){onMining();return;}if(['caravan','escort'].includes(q.type)){onEscort(q.type);return;}
            onTravel(
              Adventure.travelText(
                Adventure.ready(state, q) ? q.issuerLocation : q.destination,
              ),
            );
          };
        }
        if (q.receipt)
          n(
            "p",
            (q.sharedMoneyPool?"정산 완료 · 공동 금액은 파티 분배에서 확인 · ":"지급 완료 · ") +
              GameEconomy.format(q.receipt.reward) +
              " / " +
              q.receipt.xp +
              "XP",
            dialog,
          );
        const close = n("button", "의뢰서 닫기", dialog);
        close.onclick = () => {
          dialog.close();
          dialog.remove();
        };
        body.append(dialog);
        const shown = dialog;
        shown.addEventListener("close", () => shown.remove(), { once: true });
        dialog.showModal();
      };
    }
    if (!papers.children.length)
      n(
        "p",
        "현재 장소의 게시판을 확인하거나 수행 중인 의뢰를 확인해 주세요.",
        papers,
      );
    n("h3", "현장 전리품");
    const ground = (a?.ground || []).filter(
      (x) => x.location === state.location && !x.claimed,
    );
    if (!ground.length) n("p", "이 장소에 회수할 전리품이 없습니다.");
    for (const loot of ground) {
      const essence =
        loot.essence && state.minutes < loot.createdAt + 30
          ? " · 정수 " + (loot.createdAt + 30 - state.minutes) + "분 남음"
          : "";
      button(
        loot.name +
          " 재료" +
          (loot.stone ? " · 마석" : "") +
          (loot.soulStone ? " · 영혼석" : "") +
          essence +
          " 회수",
        { type: "pickup", lootId: loot.id },
      );
    }
    n("h3", "소지 재료·마석·영혼석");
    if (!a?.inventory.length) n("p", "소지한 재료·마석·영혼석이 없습니다.");
    for (const item of a?.inventory || [])
      n("p", item.name + " ×" + item.quantity);
    n("h3", "소지 정수");
    for (const item of (state.player.progression?.inventory || []).filter(
      (i) => i.kind === "essence",
    )) {
      n(
        "p",
        item.name +
          " · " +
          Math.max(0, item.expiresAt - state.minutes) +
          "분 남음",
      );
      const b = n("button", item.name + " 흡수");
      b.disabled =
        locked ||
        item.expiresAt <= state.minutes ||
        (state.player.progression?.absorbed.length || 0) >=
          (state.player.essenceSlots ?? 1);
      b.onclick = async () => {
        try {
          await onAbsorb(item.id);
        } catch (e) {
          message.textContent = e.message;
        }
      };
    }
  }
  r.AdventureUI = { render };
})(globalThis);
