const fs=require('node:fs/promises'),path=require('node:path');
const Content=require('../ui/characters/content.js');
const ALLOWED=Object.freeze([...Content.records.flatMap(r=>[...Object.values(r.looks),...Object.values(r.sd)].map(f=>f.src)),'assets/nea-atlas.png','assets/yeogyeong-standing.png','assets/yui-standing.png','assets/seoha-standing.png','assets/childhood-friend-standing.png','assets/yeogyeong-expressions.png','assets/seoha-expressions.png','assets/yui-expressions.png','assets/childhood-friend-original.png']);
async function assetURL(root,key){if(!ALLOWED.includes(key))throw Error('허용하지 않는 원화입니다.');const file=path.join(root,key);if((await fs.stat(file)).size>8*1024*1024)throw Error('원화 용량을 확인해 주세요.');return 'data:image/'+(key.endsWith('.webp')?'webp':'png')+';base64,'+(await fs.readFile(file)).toString('base64');}
module.exports={ALLOWED,assetURL};
