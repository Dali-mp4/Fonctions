"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Algorithm } from "@/lib/catalog";
import type { MethodRecord } from "@/lib/public-catalog-model";
import { AlgorithmCard } from "@/components/algorithm-card";

/** One card per school topic. Contributions are alternative methods WITHIN it. */
export function LibraryClient({ lessons, methods, connected }: {
  lessons: Algorithm[]; methods: MethodRecord[]; connected: boolean;
}) {
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
    `${a.name} ${a.title} ${a.summary} ${a.tags.join(" ")} ${methods.filter(m=>m.topic_slug===a.slug).map(m=>m.title).join(" ")}`.toLowerCase().includes(text));
  return <>
    {!connected && <p className="catalog-offline" role="status">Catalogue collaboratif temporairement indisponible. Les sept modules scolaires restent accessibles.</p>}
    <div className="library-tools">
      <label className="search-field"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher PGCD, tableau, matrice..." aria-label="Rechercher un algorithme"/></label>
      <label className="filter-field"><SlidersHorizontal size={17}/><select aria-label="Filtrer par catégorie" value={category} onChange={e=>setCategory(e.target.value)}><option>Toutes</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="filter-field"><select aria-label="Filtrer par méthode" value={collection} onChange={e=>setCollection(e.target.value)}><option>Toutes</option><option>Avec variantes</option></select></label>
    </div>
    <div className="list-meta"><strong>{filtered.length} module{filtered.length!==1?"s":""}</strong><span>{lessons.length} notions scolaires · {methods.length} méthodes approuvées intégrées</span></div>
    {filtered.length?<div className="algorithm-grid">{filtered.map(a=><AlgorithmCard algorithm={a} methodCount={counts[a.slug]??0} key={a.slug}/>)}</div>:<div className="empty-state">Aucun résultat pour cette recherche.</div>}
  </>;
}
