// Presentation only: actor IDs never replace the player's learned display names.
const illustratedActors=new Set(['taei','yeogyeong','seoyeon','soyul','iseo','dogyeom']);
export function conversationCast({scene,speaker,groupParticipants=[],contextPerson}={}){
 const ids=scene==='group'?['taei',...groupParticipants]:['dialogue','warningShare','rainLunch','supplyAftermath','personalEvent'].includes(scene)?['taei',contextPerson??speaker]:[];
 return [...new Set(ids)].filter(id=>illustratedActors.has(id)).slice(0,3);
}
export function speakingActor(beat,participants,fallback){
 const actor=beat.actor||(beat.kind==='player'?'taei':beat.kind==='speech'?fallback:'');
 return participants.includes(actor)?actor:'';
}
export function castPositions(count){return count===3?[19,50,81]:count===2?[29,71]:[50];}
