"use client";
import {useEffect,useState} from "react";
export default function DirectionToggle(){
  const [dir,setDir]=useState("rtl");
  useEffect(()=>{const saved=window.localStorage.getItem("quran-direction");const next=saved==="ltr"?"ltr":"rtl";document.documentElement.dir=next;setDir(next);},[]);
  function change(next){document.documentElement.dir=next;window.localStorage.setItem("quran-direction",next);setDir(next);}
  return <div className="direction-toggle" role="group" aria-label="اتجاه الواجهة"><button type="button" className={dir==="rtl"?"active":""} onClick={()=>change("rtl")}>RTL</button><button type="button" className={dir==="ltr"?"active":""} onClick={()=>change("ltr")}>LTR</button></div>;
}
