import fs from 'node:fs';
import {campusBuildings} from '../../prototype/campus-buildings.js';
import {characterTimetables} from '../../prototype/timetable.js';
import {communityPosts} from '../../prototype/community.js';
const world={buildings:Object.entries(campusBuildings).map(([id,b])=>({id,name:b.name,entry:b.entry,outdoor:!!b.outdoor,rooms:(b.areas??[]).map(a=>({id:a.id,name:a.name,floor:a.floor,text:a.text}))})),lessons:[],posts:communityPosts.map(p=>({id:p.id,day:p.day,board:p.board,title:p.title,body:p.body,club:p.club??'',kind:p.kind,comments:p.comments??[]}))};
world.buildings.push({id:'library',name:'창조관 도서관',entry:'페이지 넘기는 소리 사이로 복도를 지나는 발소리가 들린다.',rooms:[]},{id:'cafe',name:'대학가 카페',entry:'주문대 앞에서 학생 한 명이 지갑을 찾는다. 창가에는 빈자리가 보인다.',rooms:[]});
for(const [person,days]of Object.entries(characterTimetables))for(const [day,lessons]of Object.entries(days))for(const c of lessons)world.lessons.push({id:c.id,person,day:Number(day),name:c.name,start:c.start,end:c.end,location:c.location,room:c.area,topic:c.topic,choices:c.choices.map(a=>({id:a.id,label:a.label,text:a.text}))});
fs.writeFileSync(new URL('../CampusSurvival/Assets/Campus/Resources/Data/world.json',import.meta.url),JSON.stringify(world,null,2)+'\n');
