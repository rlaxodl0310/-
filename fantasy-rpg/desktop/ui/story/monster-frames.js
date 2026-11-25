globalThis.StoryMonsterFrames={"ant":{"src":"assets/combat/monsters-atlas.png","x":14,"y":90,"w":414,"h":308,"imageWidth":1774,"imageHeight":887},"clad":{"src":"assets/combat/monsters-atlas.png","x":452,"y":83,"w":425,"h":285,"imageWidth":1774,"imageHeight":887},"velum":{"src":"assets/combat/monsters-atlas.png","x":894,"y":121,"w":432,"h":206,"imageWidth":1774,"imageHeight":887},"draven":{"src":"assets/combat/monsters-atlas.png","x":1344,"y":80,"w":422,"h":294,"imageWidth":1774,"imageHeight":887},"noxvern":{"src":"assets/combat/monsters-atlas.png","x":8,"y":573,"w":432,"h":208,"imageWidth":1774,"imageHeight":887},"lairon":{"src":"assets/combat/monsters-atlas.png","x":464,"y":506,"w":405,"h":306,"imageWidth":1774,"imageHeight":887}};

const storyMonsterCatalog=typeof module==='object'&&module.exports?require('../monsters/catalog.js'):globalThis.MonsterCatalog;
for(const m of [...(storyMonsterCatalog?.records||[]),...(storyMonsterCatalog?.sightings||[])]){
  if(m.artFrames?.main)globalThis.StoryMonsterFrames[m.id]=m.artFrames.main;
}
