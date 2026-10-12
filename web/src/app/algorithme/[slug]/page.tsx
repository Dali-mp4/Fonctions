import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { bySlug, algorithms } from "@/lib/catalog";
import { LessonTabs } from "@/components/lesson-tabs";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams(){return algorithms.map(a=>({slug:a.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const a=bySlug((await params).slug);return {title:a?.name??"Algorithme"};}
export default async function AlgorithmPage({params}:Props){const a=bySlug((await params).slug);if(!a)notFound();return <div className="shell inner-page"><Link href="/bibliotheque" className="back-link"><ArrowLeft size={17}/> Retour à la bibliothèque</Link><div className="lesson-heading"><div><div className="eyebrow"><BookOpen size={14}/> {a.category.toUpperCase()} <span className="eyebrow-line"/> MODULE DE BASE</div><h1><span className="lesson-emoji">{a.icon}</span> {a.name}</h1><p>{a.title}</p><div className="lesson-chips"><span>Version scolaire</span><span>{a.level}</span><span>Collection générale</span></div></div><div className="lesson-advanced"><Sparkles size={22}/><strong>Et la version Advanced ?</strong><span>Les autres méthodes apparaîtront ici après validation des contributeurs.</span></div></div><LessonTabs algorithm={a}/><div className="lesson-disclaimer"><ShieldCheck size={19}/><p>Ce module reprend la collection Fonctions initiale. Les exemples scolaires sont séparés du moteur d&apos;exécution. <Lightbulb size={15}/> Comprends le raisonnement, pas seulement le code.</p></div></div>}
