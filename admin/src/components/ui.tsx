import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function Button({variant="default",className="",...props}:{variant?:"default"|"primary"|"danger";className?:string}&ButtonHTMLAttributes<HTMLButtonElement>){
  const base="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50";
  const variants={default:"bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50",primary:"bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",danger:"bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100"};
  return <button className={base+" "+variants[variant]+" "+className} {...props}/>;
}
export function Card({children,className=""}:{children:ReactNode;className?:string}){return <section className={"rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 "+className}>{children}</section>}
export function Field({label,children}:{label:string;children:ReactNode}){return <label className="grid gap-2 text-sm font-medium text-slate-700">{label}{children}</label>}
export function Input(props:InputHTMLAttributes<HTMLInputElement>){return <input {...props} className={"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 "+(props.className||"")}/>}
export function Textarea(props:TextareaHTMLAttributes<HTMLTextAreaElement>){return <textarea {...props} className={"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 "+(props.className||"")}/>}
export function Select({children,...props}:SelectHTMLAttributes<HTMLSelectElement>){return <select {...props} className={"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 "+(props.className||"")}>{children}</select>}
