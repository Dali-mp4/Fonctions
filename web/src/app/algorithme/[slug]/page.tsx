import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { getPublicCatalog } from "@/lib/public-catalog-server";
import { LessonTabs } from "@/components/lesson-tabs";
type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const {lessons}=await getPublicCatalog();
 const a=lessons.find(item=>item.slug===slug);
 return {title:a?.name??"Algorithme"};
}
export default async function AlgorithmPage({params}:Props){
 const {slug}=await params;
 const {lessons,methods}=await getPublicCatalog();
 const a=lessons.find(item=>item.slug===slug);
 if(!a)notFound();
 const related=methods.filter(m=>m.topic_slug===slug);
 return <div className="shell inner-page">
  <Link href="/bibliotheque" className="back-link"><ArrowLeft size={17}/> Retour à la bibliothèque</Link>
  <div className="lesson-heading"><div><div className="eyebrow"><BookOpen size={14}/> {a.category.toUpperCase()} <span className="eyebrow-line"/> MODULE DE BASE</div><h1><span className="lesson-emoji">{a.icon}</span> {a.name}</h1><p>{a.title}</p><div className="lesson-chips"><span>Version scolaire</span><span>{a.level}</span><span>Collection originale · Fonctions V1</span></div></div>
  <div className="lesson-advanced"><Sparkles size={22}/><strong>Méthodes de la communauté</strong><span>{related.length>0?`${related.length} version(s) approuvée(s) à découvrir ci-dessous.`:"Les variantes apparaîtront ici après validation des contributeurs."}</span></div></div>
  <LessonTabs algorithm={a}/>
  {related.length>0 && <section className="lesson-related"><h2>Autres méthodes approuvées</h2><div className="approved-method-links">{related.map(m=><Link key={m.id} href={`/methode/${m.id}`}>{m.method_type==="advanced"?"Advanced":"Base"} · {m.title} →</Link>)}</div></section>}
  <div className="lesson-disclaimer"><ShieldCheck size={19}/><p>Collection pédagogique Fonctions V1, conservée intégralement. Seuls ces sept modules officiels utilisent le moteur interactif existant. <Lightbulb size={15}/> Comprends le raisonnement, pas seulement le code.</p></div>
 </div>;
}
