"use client";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Zap } from "lucide-react";
import type { Algorithm } from "@/lib/catalog";
import { useLocale, useTranslate } from "@/components/language-provider";
import { localizeLesson } from "@/lib/lesson-translations";

export function AlgorithmCard({ algorithm }: { algorithm: Algorithm }) {
  const locale=useLocale(),t=useTranslate();
  const item=localizeLesson(algorithm,locale);
  return (
    <Link href={`/algorithme/${item.slug}`} className="algo-card">
      <div className="algo-card-top"><span className="algo-glyph" aria-hidden>{item.icon}</span><ArrowUpRight size={19} className="card-arrow" /></div>
      <div className="algo-card-meta"><span className="tiny-tag"><BookOpen size={12}/> {t("MODULE")}</span><span>{item.category}</span></div>
      <h3>{item.name}</h3><p>{item.summary}</p>
      <div className="algo-card-bottom"><span>{t("Explorer les méthodes")}</span><span><Zap size={13}/> {t("Atelier interactif")}</span></div>
    </Link>
  );
}
