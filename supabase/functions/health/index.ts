import {createClient} from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="GET")return Response.json({error:"Method not allowed"},{status:405,headers:cors});
  const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const started=Date.now(); const checks:Record<string,unknown>={};
  try{
    const {error}=await client.from("quran_settings").select("id").eq("id",1).maybeSingle();
    checks.supabase=error?{ok:false,error:error.message}:{ok:true};
    const islamway=await fetch("https://quranapi.islamway.net/readers",{headers:{accept:"application/json"}});
    checks.islamway={ok:islamway.ok,status:islamway.status};
    const ok=Boolean((checks.supabase as {ok:boolean}).ok&&(checks.islamway as {ok:boolean}).ok);
    return Response.json({ok,duration_ms:Date.now()-started,checks},{status:ok?200:503,headers:cors});
  }catch(error){return Response.json({ok:false,duration_ms:Date.now()-started,checks,error:error instanceof Error?error.message:"Unexpected error"},{status:503,headers:cors});}
});
