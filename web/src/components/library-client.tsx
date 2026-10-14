"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Algorithm } from "@/lib/catalog";
import type { MethodRecord } from "@/lib/public-catalog-model";
import { AlgorithmCard } from "@/components/algorithm-card";
import { PublishedMethodCard } from "@/components/published-method-card";

export function LibraryClient({lessons, methods, connected}: {
  lessons: Algorithm[]; methods: MethodRecord[]; connected: boolean;
}) {
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("Toutes");
  const [collection,setCollection]=useState("Toutes");
  const categories=useMemo(()=>Array.from(new Set([...lessons.map(a=>a.category),...methods.map(m=>m.category)])),[lessons,methods]);
  const normalized=query.trim().toLowerCase();
  const match=(categoryName:string,text:string)=>
    (category==="Toutes" || categoryName===category) && text.toLowerCase().includes(normalized);
  const filtered=useMemo(()=>lessons.filter(a=>
    collection!=="Contributions" && match(a.category,`${a.name} ${a.title} ${a.summary} ${a.tags.join(" ")}`)
  ),[lessons,category,collection,normalized]);
  const filteredMethods=useMemo(()=>methods.filter(m=>
    collection!=="Fondamentaux" && match(m.category,`${m.title} ${m.topic_title} ${m.explanation} ${m.method_type}`)
  ),[methods,category,collection,normalized]);
  const count=filtered.length+filteredMethods.length;
  return <>
    {!connected && <p className="catalog-offline" role="status">Connexion au catalogue collaboratif indisponible. Les sept modules scolaires restent accessibles.</p>}
    <div className="library-tools">
      <label className="search-field"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher PGCD, tableau, matrice..." aria-label="Rechercher un algorithme"/></label>
      <label className="filter-field"><SlidersHorizontal size={17}/><select aria-label="Filtrer par catégorie" value={category} onChange={e=>setCategory(e.target.value)}><option>Toutes</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="filter-field"><select aria-label="Filtrer par collection" value={collection} onChange={e=>setCollection(e.target.value)}><option>Toutes</option><option>Fondamentaux</option><option>Contributions</option></select></label>
    </div>
    <div className="list-meta"><strong>{count} module{count!==1?"s":""}</strong><span>{lessons.length} fondamentaux · {methods.length} contributions approuvées</span></div>
    {count ? <div className="algorithm-grid">
      {filtered.map(a=><AlgorithmCard algorithm={a} key={`base-${a.slug}`}/>)}
      {filteredMethods.map(m=><PublishedMethodCard method={m} key={`method-${m.id}`}/>)}
    </div>:<div className="empty-state">Aucun résultat pour cette recherche.</div>}
  </>;
}
