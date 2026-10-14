import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, BookCheck, Code2, ShieldCheck } from "lucide-react";
import { getPublicMethod } from "@/lib/public-catalog-server";
type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const m=await getPublicMethod((await params).id);
  return { title: m?.title ?? "Méthode indisponible" };
}
export default async function MethodPage({params}:Props) {
 const m=await getPublicMethod((await params).id);
 if (!m) notFound();
 const cases=Array.isArray(m.test_cases)?m.test_cases:[];
 return <div className="shell inner-page">
  <Link href="/bibliotheque" className="back-link"><ArrowLeft size={17}/> Retour à la bibliothèque</Link>
  <div className="page-eyebrow">/ CONTRIBUTION APPROUVÉE</div>
  <h1>{m.title}<span className="title-dot">.</span></h1>
  <p className="page-lead">{m.explanation}</p>
  <div className="lesson-chips"><span><BookCheck size={14}/> {m.method_type==="advanced"?"Advanced":"Base"}</span><span>{m.topic_title}</span><span>Revue et approuvée</span></div>
  <div className="method-public-note"><ShieldCheck size={20}/><p>Cette contribution a été testée en sandbox puis approuvée par une autre personne. Le code est présenté pour l&apos;apprentissage et n&apos;est pas exécuté directement par la page publique.</p></div>
  <div className="method-learning-layout">
    <section className="panel"><h2><Code2 size={19}/> Algorithme / Pseudo-code</h2><pre className="method-public-code">{m.pseudocode||"Non fourni"}</pre></section>
    <section className="panel"><h2><Code2 size={19}/> Python approuvé</h2><pre className="method-public-code">{m.python_code}</pre></section>
  </div>
  <section className="method-public-tests"><h2>Signature et exemples de test</h2>
    <p className="studio-hint">Fonction : <code>{m.entry_function??"non précisée"}</code>. Les cas sont publiés à titre d&apos;exemples ; les résultats présentés sont les valeurs attendues, pas une nouvelle exécution.</p>
    <pre className="method-public-code">{JSON.stringify(m.input_schema,null,2)}</pre>
    <div className="method-case-grid">{cases.map((tc,i)=>{
      if (!tc || typeof tc!=="object") return null;
      const obj=tc as Record<string,unknown>;
      return <article className="method-case-card" key={i}><strong>{typeof obj.label==="string"?obj.label:`Cas ${i+1}`}</strong><p>Entrées : <code>{JSON.stringify(obj.inputs)}</code></p><p>Attendu : <code>{JSON.stringify(obj.expected)}</code></p></article>;
    })}</div>
  </section>
  <p className="studio-hint">Version approuvée le {new Date(m.reviewed_at).toLocaleDateString("fr-FR")}. Les auteurs des contributions sont conservés dans la base, sans rendre leurs identifiants personnels publics.</p>
  <Link href={`/algorithme/${m.topic_slug}`} className="back-link"><ArrowLeft size={16}/> Revoir le module scolaire {m.topic_title}</Link>
 </div>;
}
