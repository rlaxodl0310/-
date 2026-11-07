// A conversation reserves only its actual participant for its short duration.
export function personalEventPosition(s,id){const r=s.personalEvents?.records?.[s.personalEvents?.active];return r?.person===id&&r.status==='active'&&r.day===s.day&&s.clock.minute<=r.until?r.location:null;}
