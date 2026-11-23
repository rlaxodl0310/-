'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function notes(root,patch=null){
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 const readme=fs.readFileSync(path.join(root,'README.md'),'utf8'),block=readme.match(/<!-- release-summary:start -->\s*([\s\S]*?)\s*<!-- release-summary:end -->/);
 if(!block||!block[1].startsWith('# v'+version+' '))throw Error('현재 버전의 release-summary가 필요합니다.');
 const text=block[1]+'\n\n기존 앱: 게임 저장·종료 → FantasyStory-Patch.zip 전체 압축 해제 → FantasyStoryPatch.exe 실행. 로그인과 저장은 유지됩니다.\n신규 설치: FantasyStory-Windows-x64.zip.\n소유자 계정으로 확인하는 초안 릴리스입니다.\n';
 return patch?text+'\nPatch SHA256: '+crypto.createHash('sha256').update(fs.readFileSync(patch)).digest('hex')+'\n':text;
}
if(require.main===module){try{process.stdout.write(notes(path.resolve(__dirname,'..'),process.argv[2]));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={notes};
