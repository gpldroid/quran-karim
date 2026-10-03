import {createClient} from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export function subscribeToTable(table,callback){
 if(!supabase)return {unsubscribe:async()=>{}};
 const channel=supabase.channel(`dashboard-${table}`).on("postgres_changes",{event:"*",schema:"public",table},callback).subscribe();
 return channel;
}