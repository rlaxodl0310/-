(function(root){
  class Engine{
    constructor(data){this.data=data;this.state={active:null,completed:[],minutes:0,flags:[]};this.history=[];}
    event(id){const e=this.data.events.find(e=>e.id===id);if(!e)throw Error('없는 이벤트입니다.');return e;}
    current(){const a=this.state.active;return a?this.event(a.id).nodes[a.node]:null;}
    start(id,context){
      if(this.state.active)throw Error('진행 중인 이벤트부터 이어 주세요.');
      const e=this.event(id);
      if(this.state.completed.includes(id))throw Error('이미 완료한 이벤트입니다.');
      if(!context||context.location!==e.location||!Array.isArray(context.members)||e.members.some(m=>!context.members.includes(m)))throw Error('장소나 참여 인물 조건이 맞지 않습니다.');
      this.state.active={id,node:e.entry,pendingMinutes:0};
      this.history.push({type:'start',id,context:{location:context.location,members:[...context.members]}});
    }
    advance(choiceId=null){
      const a=this.state.active;if(!a)throw Error('진행 중인 이벤트가 없습니다.');
      const e=this.event(a.id),n=e.nodes[a.node];
      if(n.end){
        this.state.minutes+=a.pendingMinutes;
        this.state.completed.push(a.id);
        this.state.flags=[...new Set([...this.state.flags,...(n.flags||[])])];
        this.state.active=null;
      }else{
        let next=n.next,minutes=0;
        if(n.choices){const choice=n.choices.find(c=>c.id===choiceId);if(!choice)throw Error('선택지를 골라 주세요.');next=choice.next;minutes=choice.minutes||0;}
        else if(choiceId!==null)throw Error('현재 장면에는 그 선택지가 없습니다.');
        if(!e.nodes[next])throw Error('잘못된 장면 연결입니다.');
        a.pendingMinutes+=minutes;a.node=next;
      }
      this.history.push({type:'advance',choiceId});
    }
    serialize(){return JSON.stringify({version:this.data.version,history:this.history});}
    static restore(data,text){
      const saved=JSON.parse(text);if(saved.version!==data.version||!Array.isArray(saved.history)||saved.history.length>2000)throw Error('지원하지 않는 저장입니다.');
      const engine=new Engine(data);
      for(const action of saved.history){
        if(action.type==='start')engine.start(action.id,action.context);
        else if(action.type==='advance')engine.advance(action.choiceId??null);
        else throw Error('잘못된 저장 동작입니다.');
      }
      return engine;
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports=Engine;else root.StoryKitEngine=Engine;
})(globalThis);
