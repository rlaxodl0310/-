const utilityIconPaths={
 phone:'M8 2h8v20H8z M11 18h2',travel:'m3 11 18-8-8 18-2-8z',
 timetable:'M5 5h14v16H5z M8 2v6 M16 2v6 M5 10h14 M8 14h3 M14 14h2 M8 17h3',
 community:'M3 4h18v13H9l-5 4v-4H3z M7 8h10 M7 12h6',
 weather:'M7 16a5 5 0 1 1 10 0 M5 16h14 M12 2v2 M3 6l2 2 M21 6l-2 2 M3 12H1 M23 12h-2',
 schedule:'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9 M12 7v5l4 2',
 messages:'M3 5h18v14H3z m0 0 9 7 9-7',map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16',
 discoveries:'M4 8h16v13H4z M8 8V4h8v4 M4 13h16 M10 13v3h4v-3',
 peopleRecord:'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 21v-3a8 8 0 0 1 16 0v3',
 journal:'M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h5',clubs:'M4 21V8l8-5 8 5v13 M9 21v-7h6v7 M8 9h1 M15 9h1',
 observations:'m12 3 10 18H2z M12 9v5 M12 17v1',save:'M4 3h13l3 3v15H4z M8 3v6h8V3 M8 21v-7h8v7',back:'m14 5-7 7 7 7',arrow:'m9 5 7 7-7 7'
};
export function utilityIcon(id){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${utilityIconPaths[id]??utilityIconPaths.journal}"/></svg>`;}
export function utilityShortcut({label,id,hint='',badge=0,style='row',action='go'}){
 // All fields come from the UI's fixed catalog, not external/community content.
 return `<button class="utility-shortcut ${style}" data-action="${action}" data-value="${id}" aria-label="${label}" aria-description="${badge?'새 항목 '+badge+'개. ':''}${hint}"><span class="shortcut-icon tone-${id}">${utilityIcon(id)}${badge?`<span class="shortcut-badge" aria-hidden="true">${badge>99?'99+':badge}</span>`:''}</span><span class="shortcut-copy"><strong>${label}</strong>${hint?`<small>${hint}</small>`:''}</span>${style==='row'?`<span class="shortcut-arrow">${utilityIcon('arrow')}</span>`:''}${badge?`<span class="sr-only">새 항목 ${badge}개</span>`:''}</button>`;
}
