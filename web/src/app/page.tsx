import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenText, ChevronRight, Code2, GitPullRequestArrow, Play, ShieldCheck, Sparkles, TerminalSquare, Users } from "lucide-react";
import { algorithms } from "@/lib/catalog";
import { AlgorithmCard } from "@/components/algorithm-card";

export default function Home() {
  const cards = algorithms.slice(0, 6);
  return <>
    <section className="hero shell">
      <div className="hero-glow" />
      <div className="hero-copy">
        <div className="eyebrow"><span className="live-dot"/> CONÇU POUR LES LYCÉENS TUNISIENS <span className="eyebrow-line"/> V2 EN CONSTRUCTION</div>
        <h1>L&apos;algorithmique,<br/><em>à ta portée.</em></h1>
        <p>Des fonctions expliquées simplement. Du vrai Python à tester. Et bientôt, une communauté qui partage ses meilleures idées.</p>
        <div className="hero-actions"><Link className="btn btn-primary" href="/bibliotheque">Explorer les fonctions <ArrowRight size={18}/></Link><Link className="btn btn-muted" href="/parcours">Choisir mon parcours <ChevronRight size={17}/></Link></div>
        <div className="hero-metrics"><div><strong>07</strong><span>modules fondateurs</span></div><div><strong>02</strong><span>méthodes à explorer</span></div><div><strong>∞</strong><span>idées à partager</span></div></div>
      </div>
      <div className="hero-visual" aria-label="Exemple de code PGCD en Python">
        <div className="code-window"><div className="code-window-bar"><span className="window-dots"><i/><i/><i/></span><span><Code2 size={15}/> pgcd.py</span><span className="code-label">PYTHON</span></div><div className="code-body"><div className="line"><span>01</span><code><b>def</b> <strong>pgcd</strong>(a, b):</code></div><div className="line"><span>02</span><code>    <b>while</b> a != b:</code></div><div className="line"><span>03</span><code>        <b>if</b> a &gt; b:</code></div><div className="line"><span>04</span><code>            a -= b</code></div><div className="line"><span>05</span><code>        <b>else</b>:</code></div><div className="line"><span>06</span><code>            b -= a</code></div><div className="line"><span>07</span><code>    <b>return</b> a</code></div></div><div className="code-result"><span><TerminalSquare size={15}/> EXECUTION</span><span>pgcd(48, 18) <i>→</i> <strong>6</strong></span></div></div>
        <div className="floating-note"><span>✦</span><div><strong>Comprends. Teste. Progresse.</strong><small>Na7i la7fatha !</small></div></div>
      </div>
    </section>
    <section className="benefits shell" aria-label="Points forts"><div><BookOpenText/><span><strong>Conçu pour tes cours</strong><small>Algorithmes scolaires &amp; Python</small></span></div><div><Play/><span><strong>Apprends en testant</strong><small>Change les valeurs, observe le résultat</small></span></div><div><Users/><span><strong>Une communauté en devenir</strong><small>Des contributions relues avant publication</small></span></div></section>
    <section className="section shell"><div className="section-heading"><div><span className="section-kicker">DÉCOUVRIR</span><h2>Commence par l&apos;essentiel<span className="title-dot">.</span></h2><p>Sept modules hérités de Fonctions, expliqués étape par étape.</p></div><Link className="text-link" href="/bibliotheque">Toute la bibliothèque <ArrowUpRight size={17}/></Link></div><div className="algorithm-grid">{cards.map(item=><AlgorithmCard key={item.slug} algorithm={item}/>)}</div></section>
    <section className="method-section shell"><div className="method-banner"><div><span className="section-kicker">DEUX MANIÈRES DE RÉSOUDRE</span><h2>La méthode de classe.<br/><span>Et les idées qui vont plus loin.</span></h2><p>Chaque concept pourra accueillir sa version <strong>Base</strong> (fidèle au cours) et des versions <strong>Advanced</strong> (autres méthodes, astuces et optimisations expliquées).</p><Link className="btn btn-primary" href="/bibliotheque">Découvrir les modules <ArrowRight size={17}/></Link></div><div className="method-compare"><div><span className="compare-num">01</span><span className="compare-label"><BookOpenText size={16}/> BASE</span><strong>La méthode scolaire</strong><small>Une explication claire, alignée sur le cours.</small></div><div><span className="compare-num">02</span><span className="compare-label"><Sparkles size={16}/> ADVANCED</span><strong>L&apos;idée en plus</strong><small>Des approches alternatives, accompagnées et relues.</small></div></div></div></section>
    <section className="section shell how-section"><div className="section-heading"><div><span className="section-kicker">COLLABORATION</span><h2>Une plateforme qui grandit <em>ensemble.</em></h2><p>Les contributions seront testées puis vérifiées avant d&apos;être accessibles aux élèves.</p></div></div><div className="steps-grid"><div><span className="step-icon"><Code2/></span><small>ÉTAPE 01</small><h3>Écrire</h3><p>Crée ton algorithme et sa fiche pédagogique depuis un espace dédié.</p></div><div><span className="step-icon"><ShieldCheck/></span><small>ÉTAPE 02</small><h3>Faire vérifier</h3><p>Des tests techniques et une relecture éducative protègent la bibliothèque.</p></div><div><span className="step-icon"><GitPullRequestArrow/></span><small>ÉTAPE 03</small><h3>Partager</h3><p>Une fois approuvée, ta contribution rejoint la bibliothèque publique.</p></div></div><div className="launch-note">Les contributions collaboratives sont en cours de développement. <Link href="/studio">Voir l&apos;espace contributeur <ArrowUpRight size={15}/></Link></div></section>
  </>;
}
