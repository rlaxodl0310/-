'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function verify(file,root=path.resolve(__dirname,'..')){
 const fd=fs.openSync(file,'r');try{const prefix=Buffer.alloc(8);fs.readSync(fd,prefix,0,8,0);const size=prefix.readUInt32LE(4);if(size<8||size>32*1024*1024)throw Error('Invalid ASAR header');const raw=Buffer.alloc(size);fs.readSync(fd,raw,0,size,8);const tree=JSON.parse(raw.subarray(8,8+raw.readUInt32LE(4)).toString());
 const entry=name=>name.split('/').reduce((node,key)=>node.files[key],tree),read=name=>{const e=entry(name);if(!e||e.unpacked||e.size>32*1024*1024)throw Error('Missing/unexpected packed file '+name);const b=Buffer.alloc(e.size);fs.readSync(fd,b,0,e.size,8+size+Number(e.offset));return b;};
 const files=new Set(['package.json','ui/monsters/catalog.js','ui/monsters/essence-rules.js','ui/skills/common.js','ui/skills/embodied.js','ui/skills/common-battle.js','ui/skills/common-chat.js','ui/progression/model.js','electron/progression.cjs','electron/free-encounter.cjs','electron/field-research.cjs','ui/monsters/panel.js','electron/story-director.cjs','ui/story/director-ui.js','electron/embodied-world.cjs','world/WORLD_BIBLE.md','world/essences.json','world/monsters.json']);
 const M=require(path.join(root,'ui/monsters/catalog.js')),S=require(path.join(root,'ui/battle/additional-monster-sprites.js'));
 for(const m of [...M.records,...M.sightings]){if(m.asset)files.add('ui/'+m.asset);for(const f of Object.values(m.artFrames||{}))files.add('ui/'+f.src);}
 for(const s of Object.values(S.records))files.add(path.posix.normalize('ui/battle/'+s.src));
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');for(const name of files){const expected=fs.readFileSync(path.join(root,name)),packed=read(name);if(name==='package.json'){const a=JSON.parse(expected),b=JSON.parse(packed);for(const key of ['name','version','main','dependencies'])if(JSON.stringify(a[key])!==JSON.stringify(b[key]))throw Error('Packaged runtime manifest mismatch: '+key);continue;}if(hash(expected)!==hash(packed))throw Error('Packed source/asset mismatch: '+name);}
 const version=JSON.parse(read('package.json')).version;console.log(JSON.stringify({version,packagedFilesVerified:files.size,method:'actual ASAR bytes equal current source and registered assets'}));return{version,files:files.size};
 }finally{fs.closeSync(fd);}
}
if(require.main===module)try{verify(process.argv[2]);}catch(e){console.error(e.message);process.exitCode=1;}module.exports={verify};
