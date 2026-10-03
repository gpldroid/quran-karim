const BASE=(process.env.NEXT_PUBLIC_ISLAMWAY_API_URL||"https://quranapi.islamway.net").replace(/\/$/,"");
const TTL=900000,STALE=86400000,memory=new Map();
async function cached(path){
 const url=`${BASE}/${path.replace(/^\//,"")}`,k=`islamway:${url}`,now=Date.now(),m=memory.get(k);
 if(m&&now-m.time<TTL)return m.data;
 try{const r=await fetch(url,{headers:{accept:"application/json"},cache:"no-store"});if(!r.ok)throw Error(`Islamway API ${r.status}`);const data=await r.json();memory.set(k,{time:now,data});if(typeof window!=="undefined")localStorage.setItem(k,JSON.stringify({time:now,data}));return data}
 catch(e){if(typeof window!=="undefined"){const raw=localStorage.getItem(k);if(raw){const s=JSON.parse(raw);if(now-s.time<STALE)return s.data}}if(m&&now-m.time<STALE)return m.data;throw e}
}
export const islamwayApi={readers:()=>cached("readers"),surahs:id=>cached(`surahs?reader=${encodeURIComponent(id)}`)};
