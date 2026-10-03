import {requireSupabase} from "../lib/supabase";
import {getCached, setCached} from "../lib/cache";

export type Reader={id:string;name:string;raw?:unknown};
export type Surah={id:string|number;number:number;name:string;audioUrl?:string;raw?:unknown};

const CACHE_TTL_MS=15*60*1000;
const MAX_STALE_MS=24*60*60*1000;
const inFlight=new Map<string,Promise<unknown>>();

async function fetchIslamway<T>(action:string,params:Record<string,string|number|undefined>={}):Promise<T>{
  const base=import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string|undefined;
  if(!base)throw new Error("VITE_SUPABASE_FUNCTIONS_URL غير مضبوط.");
  const cacheKey=`islamway:${action}:${JSON.stringify(params)}`;
  const cached=await getCached<T>(cacheKey);
  const age=cached?Date.now()-cached.savedAt:Infinity;
  if(cached && age<=CACHE_TTL_MS)return cached.value;

  const existing=inFlight.get(cacheKey);
  if(existing)return existing as Promise<T>;

  const request=(async()=>{
    try{
      const {data,error}=await requireSupabase().functions.invoke("islamway",{body:{action,params}});
      if(error)throw error;
      await setCached(cacheKey,data as T);
      return data as T;
    }catch(error){
      if(cached && age<=MAX_STALE_MS)return cached.value;
      throw error;
    }finally{inFlight.delete(cacheKey);}
  })();

  inFlight.set(cacheKey,request);
  return request;
}

export async function islamway(action:string,params:Record<string,string|number|undefined>={}){
  return fetchIslamway<unknown>(action,params);
}

export async function getReaders():Promise<Reader[]>{
  const d=await fetchIslamway<{readers?:Reader[]}>( "readers");
  return Array.isArray(d?.readers)?d.readers:[];
}

export async function getSurahs(readerId?:string):Promise<Surah[]>{
  const d=await fetchIslamway<{surahs?:Surah[]}>( "surahs",{readerId});
  return Array.isArray(d?.surahs)?d.surahs:[];
}
