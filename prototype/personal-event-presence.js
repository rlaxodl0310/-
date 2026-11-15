// A conversation reserves only its actual participant for its short duration.
export function personalEventPosition(s,id){const r=s.personalEvents?.records?.[s.personalEvents?.active];return r?.person===id&&s.location===r.location&&r.status==='active'&&r.day===s.day&&s.clock.minute<=r.until?r.location:null;}

export function expirePersonalPresence(s){const store=s.personalEvents,r=store?.records?.[store.active];if(r?.status==='active'&&(r.day!==s.day||r.location!==s.location||s.clock.minute>r.until)){r.status='paused';r.pauseReason='장소나 시간이 달라져 다음 만남에 이어가기로 했다.';store.active=null;}return s;}
