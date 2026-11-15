import {debateCampaign} from './supply-debate-fixtures.js';
import {refreshSurvivalAdvice} from './survival-advice.js';
export function thinkingCampaign(base,mode='recovery'){
 const s=debateCampaign(base),r=s.survivalRun;delete r.thinking;r.threat=35;
 for(const m of r.members){m.fatigue=15;m.stress=20;m.injury=0;m.nutrition=80;m.hydration=80;}
 if(mode==='recovery'){Object.assign(r.members[1],{injury:2,nutrition:25,hydration:20});r.resources.bandage=3;r.resources.food=12;}
 else if(mode==='supply'){r.resources.food=0;r.resources.water=0;r.kit.items.water=2;r.kit.items.energybar=0;}
 else if(mode==='search'){r.resources.food=0;r.resources.water=0;r.resources.bandage=0;r.kit.items.bandage=0;r.members[0].injury=3;}
 else if(mode==='watch'){r.threat=60;r.resources.food=30;r.resources.water=30;}
 return refreshSurvivalAdvice(s);
}
