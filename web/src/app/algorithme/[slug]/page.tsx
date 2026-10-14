import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { getPublicCatalog } from "@/lib/public-catalog-server";
import { LessonTabs } from "@/components/lesson-tabs";
import { algorithms } from "@/lib/catalog";
import { tableauTriLesson } from "@/lib/tableau-tri";
import { CommunityLessonTabs } from "@/components/community-lesson-tabs";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ m?: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({params, searchParams}:Props):Promise<Metadata>{
 const {slug}=await params; const {m}=await searchParams;
 const {lessons,methods}=await getPublicCatalog();
 const a=lessons.find(item=>item.slug===slug);
 const selected=methods.find(item=>item.id===m && item.topic_slug===slug);
 return {title:m==="tableau-tri" && slug==="tableau" ? "TABLEAU · Tri par sélection" : selected?`${a?.name??slug} · ${selected.title}`:a?.name??"Algorithme"};
}
export default async function AlgorithmPage({params,searchParams}:Props){
 const {slug}=await params; const {m}=await searchParams;
 const {lessons,methods}=await getPublicCatalog();
 const a=lessons.find(item=>item.slug===slug); if(!a)notFound();
 const related=methods.filter(item=>item.topic_slug===slug);
 const builtIn=algorithms.some(item=>item.slug===slug);
 const staticTri=slug==="tableau" && m==="tableau-tri";
 const selected=related.find(item=>item.id===m) || (!builtIn && !m ? related.find(item=>item.method_type==="base") || related[0] : undefined);
 if (m && !selected && !staticTri) notFound(); // Withdrawn or unapproved method link.
 if (!builtIn && !selected) notFound();
 return <div className="shell inner-page">
  <Link href="/bibliotheque" className="back-link"><ArrowLeft size={17}/> Retour à la bibliothèque</Link>
  <div className="lesson-heading"><div><div className="eyebrow"><BookOpen size={14}/> {a.category.toUpperCase()} <span className="eyebrow-line"/> MODULE SCOLAIRE</div>
    <h1><span className="lesson-emoji">{a.icon}</span> {a.name}</h1><p>{a.title}</p>
    <div className="lesson-chips"><span>{builtIn?"Module scolaire d'origine":"Chapitre de la communauté"}</span><span>{a.level}</span><span>{related.length} variante{related.length>1?"s":""} approuvée{related.length>1?"s":""}</span></div>
  </div><div className="lesson-advanced"><Sparkles size={22}/><strong>Plusieurs façons d&apos;apprendre</strong><span>Choisis une méthode ci-dessous. Le parcours et les onglets restent les mêmes.</span></div></div>
  <section className="module-methods" aria-label="Choisir une méthode">
    <h2>Méthode de résolution</h2>
    <div className="method-switcher">
      {builtIn && <Link href={`/algorithme/${a.slug}`} className={!selected&&!staticTri?"active":""} aria-current={!selected&&!staticTri?"page":undefined}>
        <strong>Base · {a.name}</strong><small>Méthode scolaire originale</small>
      </Link>}
      {slug==="tableau" && <Link href="/algorithme/tableau?m=tableau-tri"
        className={staticTri?"active":""} aria-current={staticTri?"page":undefined}>
        <strong>Base · Tri par sélection</strong><small>Deuxième variante scolaire du TABLEAU</small>
      </Link>}
      {related.map(item=><Link key={item.id} href={`/algorithme/${a.slug}?m=${item.id}`} className={selected?.id===item.id?"active":""} aria-current={selected?.id===item.id?"page":undefined}>
        <strong>{item.method_type==="advanced"?"Advanced":"Base"} · {item.title}</strong><small>Méthode proposée et approuvée</small>
      </Link>)}
    </div>
  </section>
  {staticTri ? <LessonTabs algorithm={tableauTriLesson}/> :
    selected ? <CommunityLessonTabs key={selected.id} method={selected}/> : <LessonTabs algorithm={a}/>}
  <div className="lesson-disclaimer"><ShieldCheck size={19}/><p>{selected ?
    "Méthode approuvée : exécution de tes valeurs uniquement dans un sandbox Modal isolé, après connexion et sous quotas." :
    "Cours Fonctions V1 original, conservé intégralement. L’atelier interactif exécute uniquement le moteur scolaire éprouvé."}
    <Lightbulb size={15}/> Comprends le raisonnement, pas seulement le code.</p></div>
 </div>;
}
