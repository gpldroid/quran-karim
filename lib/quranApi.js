const BASE="https://api.alquran.cloud/v1";

async function request(path){
  const response=await fetch(`${BASE}/${path}`,{headers:{accept:"application/json"},cache:"no-store"});
  if(!response.ok)throw new Error(`Quran API HTTP ${response.status}`);
  const json=await response.json();
  if(json.code!==200)throw new Error(json.status||"تعذر تحميل بيانات القرآن");
  return json.data;
}

export const quranApi={
  surahs:()=>request("surah"),
  surah:number=>request(`surah/${Number(number)}/quran-uthmani-quran-academy`),
  randomAyah:()=>request("ayah/random/quran-uthmani-quran-academy")
};
