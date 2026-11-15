import {newAfternoonScenario} from './simulation.js';
import {fairVisitDay,fairStudentLocation} from './fair-events.js';
export function presentationScenario(kind='first'){
 const s=newAfternoonScenario(kind==='first'||kind.startsWith('fair:')?undefined:'close');s.dialogue.engine='generative';s.location='hall';s.clock.minute=kind==='event'?830:780;
 if(kind==='first'){s.contacts={};for(const id of ['yeogyeong','seoyeon','soyul'])s.relations[id+'>taei']={familiarity:0,trust:0,affection:0,tension:0};}
 if(kind.startsWith('fair:')){const id=kind.split(':')[1];s.day=fairVisitDay(s);s.clock.minute=610;s.location=fairStudentLocation(s,id);}
 return s;
}
