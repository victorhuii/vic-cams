const key='vic-cams-tab-session';
export function sessionId(){let id=sessionStorage.getItem(key);if(!id){id=crypto.randomUUID();sessionStorage.setItem(key,id);}return id;}
