(function(root,f){if(typeof module==='object'&&module.exports)module.exports=f();else root.CombatFeedback=f();})(globalThis,()=>{
const timings={think:330,move:680,dodge:560,guard:420,aim:560,cast:650,projectile:380,attack:660,hit:290,miss:250,tell:450,skill:580,heal:450,down:440,end:550};
function duration(event,speed=1,reduced=false){const base=timings[event.type]||240;return (reduced?Math.min(base,160):base)/Math.max(1,Math.min(4,Number(speed)||1));}
function burst(type,weapon='gauntlet'){return type==='miss'?{count:0,label:'MISS'}:weapon==='magic'?{count:10,label:null}:weapon==='bow'?{count:6,label:null}:{count:9,label:null};}
function show(layer,event,point,scale=1,reduced=false){if(!layer||!point)return;const node=document.createElement('div');node.className='combat-feedback '+event.type;node.style.left=point.x+'px';node.style.top=point.y+'px';layer.append(node);
 const label=document.createElement('span');label.className='damage-number';label.textContent=event.type==='miss'?'MISS':event.type==='heal'?'+'+(event.amount||20):'−'+event.damage;node.append(label);
 const info=burst(event.type,event.weapon);
 if(!reduced&&event.type==='hit'){
  const ring=document.createElement('i');ring.className='impact-ring '+(event.weapon||'gauntlet');node.append(ring);
  for(let i=0;i<info.count;i++){const spark=document.createElement('i');spark.className='impact-spark '+(event.weapon||'gauntlet');const angle=i*Math.PI*2/info.count;node.append(spark);spark.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(angle)*30*scale}px,${Math.sin(angle)*22*scale}px) scale(.2)`,opacity:0}],{duration:260+i*9,easing:'cubic-bezier(0,.5,.4,1)',fill:'forwards'});}
 }
 if(!reduced)label.animate([{transform:'translate(-50%,0) scale(.8)',opacity:0},{offset:.16,transform:'translate(-50%,-12px) scale(1.16)',opacity:1},{offset:.5,transform:'translate(-50%,-25px) scale(1)',opacity:1},{transform:'translate(-50%,-40px) scale(1)',opacity:0}],{duration:850,fill:'forwards'});
 setTimeout(()=>node.remove(),reduced?500:900);
}
return{duration,burst,show};
});
