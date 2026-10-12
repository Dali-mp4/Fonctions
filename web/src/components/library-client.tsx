"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { algorithms, categories } from "@/lib/catalog";
import { AlgorithmCard } from "@/components/algorithm-card";
export function LibraryClient(){
 const [query,setQuery]=useState("");const [category,setCategory]=useState("Toutes");
 const filtered=useMemo(()=>algorithms.filter(a=>(category==="Toutes"||a.category===category)&&`${a.name} ${a.title} ${a.summary} ${a.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase().trim())),[query,category]);
 return <><div className="library-tools"><label className="search-field"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher PGCD, tableau, matrice..." aria-label="Rechercher un algorithme"/></label><label className="filter-field"><SlidersHorizontal size={17}/><select aria-label="Filtrer par catégorie" value={category} onChange={e=>setCategory(e.target.value)}><option>Toutes</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div><div className="list-meta"><strong>{filtered.length} module{filtered.length!==1?"s":""}</strong><span>Collection générale · Méthodes Base</span></div>{filtered.length?<div className="algorithm-grid">{filtered.map(a=><AlgorithmCard algorithm={a} key={a.slug}/>)}</div>:<div className="empty-state">Aucun résultat pour cette recherche.</div>}</>;
}
