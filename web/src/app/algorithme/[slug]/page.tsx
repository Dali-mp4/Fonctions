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
 const totalMethods=related.length+(builtIn?1:0)+(slug==="tableau"?1:0);
 const selected=related.find(item=>item.id===m) || (!builtIn && !m ? related.find(item=>item.method_type==="base") || related[0] : undefined);
 if (m && !selected && !staticTri) notFound(); // Withdrawn or unapproved method link.
 if (!builtIn && !selected) notFound();
 return <div className="shell inner-page">
  <Link href="/bibliotheque" className="back-link"><ArrowLeft size={17}/> Retour à la bibliothèque</Link>
  <div className="lesson-heading"><div><div className="eyebrow"><BookOpen size={14}/> {a.category.toUpperCase()} <span className="eyebrow-line"/> MODULE ALGO FI JIB</div>
    <h1><span className="lesson-emoji">{a.icon}</span> {a.name}</h1><p>{a.title}</p>
    <div className="lesson-chips"><span>Module Algo Fi Jib</span><span>{a.level}</span><span>{totalMethods} méthode{totalMethods>1?"s":""} disponible{totalMethods>1?"s":""}</span></div>
  </div><div className="lesson-advanced"><Sparkles size={22}/><strong>Plusieurs façons d&apos;apprendre</strong><span>Choisis une méthode ci-dessous. Le parcours et les onglets restent les mêmes.</span></div></div>
  <section className="module-methods" aria-label="Choisir une méthode">
    <h2>Méthode de résolution</h2>
    <div className="method-switcher">
      {builtIn && <Link href={`/algorithme/${a.slug}`} className={!selected&&!staticTri?"active":""} aria-current={!selected&&!staticTri?"page":undefined}>
        <strong>Base · {a.name}</strong><small>Explorer cette méthode</small>
      </Link>}
      {slug==="tableau" && <Link href="/algorithme/tableau?m=tableau-tri"
        className={staticTri?"active":""} aria-current={staticTri?"page":undefined}>
        <strong>Base · Tri par sélection</strong><small>Explorer cette méthode</small>
      </Link>}
      {related.map(item=><Link key={item.id} href={`/algorithme/${a.slug}?m=${item.id}`} className={selected?.id===item.id?"active":""} aria-current={selected?.id===item.id?"page":undefined}>
        <strong>{item.method_type==="advanced"?"Advanced":"Base"} · {item.title}</strong><small>Explorer cette méthode</small>
      </Link>)}
    </div>
  </section>
  {staticTri ? <LessonTabs algorithm={tableauTriLesson}/> :
    selected ? <CommunityLessonTabs key={selected.id} method={selected}/> : <LessonTabs algorithm={a}/>}
  <div className="lesson-disclaimer"><ShieldCheck size={19}/><p>
    Chaque méthode présentée fait pleinement partie d&apos;Algo Fi Jib. Les ateliers utilisent une exécution encadrée ; certaines méthodes demandent une connexion et sont soumises à des quotas.
    <Lightbulb size={15}/> Comprends le raisonnement, pas seulement le code.</p></div>
 </div>;
}
