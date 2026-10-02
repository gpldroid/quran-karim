import type { ReactNode } from "react";
export function V2Card({title,children,wide=false}:{title:string;children:ReactNode;wide?:boolean}){return <article className={"v2-card"+(wide?" v2-wide":"")}><h2>{title}</h2>{children}</article>}
