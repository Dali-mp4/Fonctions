import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenText, ChevronRight, Code2, GitPullRequestArrow, Play, ShieldCheck, Sparkles, TerminalSquare, Users } from "lucide-react";
import { getPublicCatalog } from "@/lib/public-catalog-server";
import { AlgorithmCard } from "@/components/algorithm-card";
import { getServerLocale } from "@/lib/server-locale";
import { tr } from "@/lib/translations";

export const dynamic = "force-dynamic";
export default async function Home() {
  const locale=await getServerLocale();
  const {lessons,methods} = await getPublicCatalog(locale);
  const cards = [...lessons].sort((a,b)=>a.name.localeCompare(b.name,"fr")).slice(0, 6);
  return <>
    <section className="hero shell">
      <div className="hero-glow" />
      <div className="hero-copy">
        <div className="eyebrow"><span className="live-dot"/> {tr(locale,"CONÇU POUR LES LYCÉENS TUNISIENS")}</div>
        <h1>{tr(locale,"L\u0027algorithmique")}<br/><em>{tr(locale,"dans ta poche.")}</em></h1>
        <p>{tr(locale,"Tous les modules publiés réunis au même endroit. Des explications claires, plusieurs méthodes et du Python à tester.")}</p>
        <div className="hero-actions"><Link className="btn btn-primary" href="/bibliotheque">{tr(locale,"Explorer les fonctions")} <ArrowRight size={18}/></Link><Link className="btn btn-muted" href="/parcours">{tr(locale,"Choisir mon parcours")} <ChevronRight size={17}/></Link></div>
        <div className="hero-metrics"><div><strong>{String(lessons.length).padStart(2,"0")}</strong><span>{tr(locale,"modules disponibles")}</span></div><div><strong>02</strong><span>{tr(locale,"approches Base et Advanced")}</span></div><div><strong>∞</strong><span>{tr(locale,"idées à partager")}</span></div></div>
      </div>
      <div className="hero-visual" aria-label="Exemple de code PGCD en Python">
        <div className="code-window"><div className="code-window-bar"><span className="window-dots"><i/><i/><i/></span><span><Code2 size={15}/> pgcd.py</span><span className="code-label">PYTHON</span></div><div className="code-body"><div className="line"><span>01</span><code><b>def</b> <strong>pgcd</strong>(a, b):</code></div><div className="line"><span>02</span><code>    <b>while</b> a != b:</code></div><div className="line"><span>03</span><code>        <b>if</b> a &gt; b:</code></div><div className="line"><span>04</span><code>            a -= b</code></div><div className="line"><span>05</span><code>        <b>else</b>:</code></div><div className="line"><span>06</span><code>            b -= a</code></div><div className="line"><span>07</span><code>    <b>return</b> a</code></div></div><div className="code-result"><span><TerminalSquare size={15}/> EXECUTION</span><span>pgcd(48, 18) <i>→</i> <strong>6</strong></span></div></div>
        <div className="floating-note"><span>✦</span><div><strong>{tr(locale,"Comprends. Teste. Progresse.")}</strong><small>Na7i la7fatha !</small></div></div>
      </div>
    </section>
    <section className="benefits shell" aria-label="Points forts"><div><BookOpenText/><span><strong>{tr(locale,"Conçu pour tes cours")}</strong><small>{tr(locale,"Algorithmes scolaires & Python")}</small></span></div><div><Play/><span><strong>{tr(locale,"Apprends en testant")}</strong><small>{tr(locale,"Change les valeurs, observe le résultat")}</small></span></div><div><Users/><span><strong>{tr(locale,"Une bibliothèque qui grandit")}</strong><small>{tr(locale,"Chaque méthode publiée a sa place")}</small></span></div></section>
    <section className="section shell"><div className="section-heading"><div><span className="section-kicker">{tr(locale,"DÉCOUVRIR")}</span><h2>{tr(locale,"Découvre les modules")}<span className="title-dot">.</span></h2><p>{tr(locale,"Une seule bibliothèque : tous les modules publiés, avec leurs méthodes et leurs explications.")}</p></div><Link className="text-link" href="/bibliotheque">{tr(locale,"Toute la bibliothèque")} <ArrowUpRight size={17}/></Link></div><div className="algorithm-grid">{cards.map(item=><AlgorithmCard key={item.slug} algorithm={item}/>)}</div></section>
    <section className="method-section shell"><div className="method-banner"><div><span className="section-kicker">{tr(locale,"DEUX MANIÈRES DE RÉSOUDRE")}</span><h2>{tr(locale,"À chaque problème,")}<br/><span>{tr(locale,"plusieurs méthodes.")}</span></h2><p>{tr(locale,"Chaque module peut proposer des méthodes")} <strong>Base</strong> {tr(locale,"pour apprendre progressivement et")} <strong>Advanced</strong> {tr(locale,"pour approfondir. Toutes font partie d\u0027Algo Fi Jib.")}</p><Link className="btn btn-primary" href="/bibliotheque">{tr(locale,"Découvrir les modules")} <ArrowRight size={17}/></Link></div><div className="method-compare"><div><span className="compare-num">01</span><span className="compare-label"><BookOpenText size={16}/> BASE</span><strong>{tr(locale,"Pour bien commencer")}</strong><small>{tr(locale,"Une méthode expliquée simplement, étape par étape.")}</small></div><div><span className="compare-num">02</span><span className="compare-label"><Sparkles size={16}/> ADVANCED</span><strong>{tr(locale,"Pour aller plus loin")}</strong><small>{tr(locale,"D\u0027autres approches, avec des explications détaillées.")}</small></div></div></div></section>
    <section className="section shell how-section"><div className="section-heading"><div><span className="section-kicker">{tr(locale,"COLLABORATION")}</span><h2>{tr(locale,"Une plateforme qui grandit")} <em>{tr(locale,"ensemble.")}</em></h2><p>{tr(locale,"Les contributions sont testées puis vérifiées avant d'être accessibles aux élèves.")}</p></div></div><div className="steps-grid"><div><span className="step-icon"><Code2/></span><small>{tr(locale,"ÉTAPE 01")}</small><h3>{tr(locale,"Écrire")}</h3><p>{tr(locale,"Crée ton algorithme et sa fiche pédagogique depuis un espace dédié.")}</p></div><div><span className="step-icon"><ShieldCheck/></span><small>{tr(locale,"ÉTAPE 02")}</small><h3>{tr(locale,"Faire vérifier")}</h3><p>{tr(locale,"Des tests techniques et une relecture éducative protègent la bibliothèque.")}</p></div><div><span className="step-icon"><GitPullRequestArrow/></span><small>{tr(locale,"ÉTAPE 03")}</small><h3>{tr(locale,"Partager")}</h3><p>{tr(locale,"Une fois approuvée, ta méthode fait pleinement partie d'Algo Fi Jib.")}</p></div></div><div className="launch-note">{tr(locale,"La bibliothèque évolue grâce aux méthodes approuvées.")} <Link href="/studio">{tr(locale,"Voir l\u0027espace contributeur")} <ArrowUpRight size={15}/></Link></div></section>
  </>;
}
