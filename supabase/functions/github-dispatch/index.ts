const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-webhook-secret","Content-Type":"application/json"};
const GITHUB_API="https://api.github.com";
const ALLOWED_TABLES=new Set(["quran_settings","site_config"]);
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const expected=Deno.env.get("SUPABASE_GITHUB_WEBHOOK_SECRET");
  if(!expected || req.headers.get("x-webhook-secret")!==expected)return json({error:"Unauthorized"},401);
  const token=Deno.env.get("GITHUB_ACTIONS_TOKEN");
  const repository=Deno.env.env?.GITHUB_REPOSITORY ?? Deno.env.get("GITHUB_REPOSITORY") ?? "gpldroid/quran-karim";
  if(!token)return json({error:"GITHUB_ACTIONS_TOKEN is not configured"},500);
  try{
    const payload=await req.json();
    if(!ALLOWED_TABLES.has(String(payload?.table)))return json({ok:true,skipped:true});
    const response=await fetch(GITHUB_API+"/repos/"+repository+"/dispatches",{
      method:"POST",
      headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+token,"X-GitHub-Api-Version":"2026-03-10","Content-Type":"application/json"},
      body:JSON.stringify({event_type:"supabase_content_changed",client_payload:{table:payload.table,event:payload.type,schema:payload.schema,record_id:payload.record?.id??null}})
    });
    if(!response.ok)return json({error:"GitHub dispatch failed",details:await response.text()},502);
    return json({ok:true,repository,event_type:"supabase_content_changed"});
  }catch(error){return json({error:error instanceof Error?error.message:"Unexpected error"},500);}
});
