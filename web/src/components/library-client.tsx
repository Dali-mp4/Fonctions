"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Algorithm } from "@/lib/catalog";
import type { MethodRecord } from "@/lib/public-catalog-model";
import { AlgorithmCard } from "@/components/algorithm-card";
import { useTranslate } from "@/components/language-provider";

/** Each approved topic has the same card and place in the library. */
export function LibraryClient({ lessons, methods, connected }: {
  lessons: Algorithm[]; methods: MethodRecord[]; connected: boolean;
}) {
  const t=useTranslate();
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("Toutes");
  const [collection,setCollection]=useState("Toutes");
  const categories=useMemo(()=>Array.from(new Set(lessons.map(a=>a.category))),[lessons]);
  const counts=useMemo(()=>methods.reduce<Record<string,number>>((all,m)=>{
    all[m.topic_slug]=(all[m.topic_slug]??0)+1; return all;
  },{}),[methods]);
  const text=query.trim().toLowerCase();
  const filtered=lessons.filter(a=>
    (category==="Toutes"||a.category===category) &&
    (collection!=="Avec variantes" || Boolean(counts[a.slug])) &&
    `${a.name} ${a.title} ${a.summary} ${a.tags.join(" ")} ${methods.filter(m=>m.topic_slug===a.slug).map(m=>m.title).join(" ")}`.toLowerCase().includes(text)).sort((a,b)=>a.name.localeCompare(b.name,"fr"));
  return <>
    {!connected && <p className="catalog-offline" role="status">{t("La bibliothèque est momentanément indisponible en partie. Certains modules peuvent manquer ; réessaie plus tard.")}</p>}
    <div className="library-tools">
      <label className="search-field"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Rechercher PGCD, tableau, matrice...")} aria-label={t("Rechercher un algorithme")}/></label>
      <label className="filter-field"><SlidersHorizontal size={17}/><select aria-label={t("Filtrer par catégorie")} value={category} onChange={e=>setCategory(e.target.value)}><option value="Toutes">{t("Toutes")}</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="filter-field"><select aria-label={t("Filtrer par méthode")} value={collection} onChange={e=>setCollection(e.target.value)}><option value="Toutes">{t("Toutes")}</option><option value="Avec variantes">{t("Avec variantes")}</option></select></label>
    </div>
    <div className="list-meta"><strong>{filtered.length} module{filtered.length!==1?"s":""}</strong><span>{lessons.length} {t("modules publiés")} · {t("Toutes les méthodes réunies dans El biblioteque.")}</span></div>
    {filtered.length?<div className="algorithm-grid">{filtered.map(a=><AlgorithmCard algorithm={a} key={a.slug}/>)}</div>:<div className="empty-state">{t("Aucun résultat pour cette recherche.")}</div>}
  </>;
}
