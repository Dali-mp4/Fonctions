import Link from "next/link";
import { ArrowUpRight, BookOpen, Zap } from "lucide-react";
import type { Algorithm } from "@/lib/catalog";

export function AlgorithmCard({ algorithm: item, methodCount = 0 }: { algorithm: Algorithm; methodCount?: number }) {
  return (
    <Link href={`/algorithme/${item.slug}`} className="algo-card">
      <div className="algo-card-top"><span className="algo-glyph" aria-hidden>{item.icon}</span><ArrowUpRight size={19} className="card-arrow" /></div>
      <div className="algo-card-meta"><span className="tiny-tag"><BookOpen size={12}/> {item.collection==="community"?"NOUVEAU CHAPITRE":`BASE · ${methodCount ? `${methodCount} variante${methodCount>1?"s":""}` : "cours"}`}</span><span>{item.category}</span></div>
      <h3>{item.name}</h3><p>{item.summary}</p>
      <div className="algo-card-bottom"><span>{methodCount ? "Voir les méthodes" : "Voir le module"}</span><span><Zap size={13}/> Atelier interactif</span></div>
    </Link>
  );
}
