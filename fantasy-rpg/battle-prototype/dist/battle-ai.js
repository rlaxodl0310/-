// Desktop-only official subscription bridge. Never stores credentials in the page.
const BattleAI={available:typeof window.desktopAI==='object'&&typeof window.desktopAI.battleJudge==='function',ready:false};
async function checkBattleAI(){if(!BattleAI.available)return {ok:false,error:'ChatGPT 구독 연결은 Windows 앱의 전투 테스트에서 사용할 수 있습니다.'};return window.desktopAI.status();}
