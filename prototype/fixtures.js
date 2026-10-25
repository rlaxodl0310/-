import {newAfternoonScenario as newGame} from './simulation.js';
import {introduce} from './identity.js';
// Relationship/dialogue unit tests start after introductions. Identity tests use raw newGame.
export function knownGame(profile='acquaintance'){
 const s=newGame(profile);for(const id of Object.keys(s.npcs))introduce(s,id,'test-setup');return s;
}
