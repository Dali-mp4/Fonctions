import Link from "next/link";
import { ArrowUpRight, BookCheck, Sparkles } from "lucide-react";
import type { MethodRecord } from "@/lib/public-catalog-model";

export function PublishedMethodCard({method:m}: {method:MethodRecord}) {
  return <Link href={`/methode/${m.id}`} className="algo-card published-method-card">
    <div className="algo-card-top"><span className="algo-glyph" aria-hidden>✦</span><ArrowUpRight size={19} className="card-arrow"/></div>
    <div className="algo-card-meta"><span className="tiny-tag"><BookCheck size={12}/> {m.method_type==="advanced"?"ADVANCED":"BASE · CONTRIBUTION"}</span><span>{m.category}</span></div>
    <h3>{m.title}</h3><p>{m.explanation}</p>
    <div className="algo-card-bottom"><span>Lire la méthode vérifiée</span><span><Sparkles size={13}/> Relecture humaine</span></div>
  </Link>;
}
