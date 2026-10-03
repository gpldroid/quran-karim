import {supabase} from "./supabaseClient";

const TTL=15*60*1000;
const STALE=24*60*60*1000;
const memory=new Map();

async function cached(action,params={}){
  const key=`islamway:${action}:${JSON.stringify(params)}`;
  const now=Date.now();
  const hit=memory.get(key);
  if(hit&&now-hit.time<TTL)return hit.data;
  try{
    const {data,error}=await supabase.functions.invoke("islamway",{body:{action,params}});
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    const value=data?.[action]??data;
    memory.set(key,{time:now,data:value});
    if(typeof window!=="undefined")localStorage.setItem(key,JSON.stringify({time:now,data:value}));
    return value;
  }catch(e){
    if(typeof window!=="undefined"){
      try{
        const raw=localStorage.getItem(key);
        if(raw){const stale=JSON.parse(raw);if(now-stale.time<STALE)return stale.data;}
      }catch{}
    }
    if(hit&&now-hit.time<STALE)return hit.data;
    throw e;
  }
}

export const islamwayApi={
  readers:()=>cached("readers"),
  surahs:id=>cached("surahs",{reader:id})
};
