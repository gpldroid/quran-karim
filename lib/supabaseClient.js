import {createClient} from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://tqmjueqdfdyhiukhbant.supabase.co";
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"sb_publishable_xfJu5T9gZ4UsysK6LxWcFQ_FkG6nmbh";
export const supabase=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export function subscribeToTable(table,callback){
 if(!supabase)return {unsubscribe:async()=>{}};
 const channel=supabase.channel(`dashboard-${table}`).on("postgres_changes",{event:"*",schema:"public",table},callback).subscribe();
 return channel;
}