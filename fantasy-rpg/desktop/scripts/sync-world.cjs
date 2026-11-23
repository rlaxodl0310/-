'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function sync(root,{check=false}={}){
 const source=path.join(root,'../WORLD_BIBLE.md'),copy=path.join(root,'world/WORLD_BIBLE.md'),manifest=path.join(root,'world/manifest.json');
 const bytes=Buffer.from(fs.readFileSync(source,'utf8').replace(/\r\n/g,'\n'));
 const hash=crypto.createHash('sha256').update(bytes).digest('hex'),data=JSON.parse(fs.readFileSync(manifest,'utf8'));
 const blob=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 const matches=fs.readFileSync(copy).equals(bytes)&&data.sha256===hash&&data.sourceBlob===blob;
 if(check){if(!matches)throw Error('세계관 원본·게임 사본·manifest가 다릅니다. node scripts/sync-world.cjs 실행 후 함께 커밋하세요.');return hash;}
 if(!matches){fs.writeFileSync(copy,bytes);fs.writeFileSync(manifest,JSON.stringify({...data,sha256:hash,sourceBlob:blob,sourceCommit:null},null,2)+'\n');}
 return hash;
}
if(require.main===module){try{console.log(sync(path.resolve(__dirname,'..'),{check:process.argv.includes('--check')}));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={sync};
