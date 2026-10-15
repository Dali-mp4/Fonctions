import type { Metadata } from "next";
import { LibraryClient } from "@/components/library-client";
import { getPublicCatalog } from "@/lib/public-catalog-server";
export const metadata: Metadata = {
  title: "El biblioteque. — Cours et exercices d'algorithmique",
  description: "Découvre les chapitres d'algorithmique et leurs méthodes Python approuvées : PGCD, PPCM, tableaux, matrices et autres notions pour les lycéens tunisiens.",
  alternates: { canonical: "/bibliotheque" },
  openGraph: { title: "El biblioteque. | Algo Fi Jib", url: "/bibliotheque" },
};
export const dynamic = "force-dynamic";
export default async function LibraryPage() {
 const catalog = await getPublicCatalog();
 return <div className="shell inner-page"><div className="page-eyebrow">/ EXPLORER</div><h1>El biblioteque<span className="title-dot">.</span></h1><p className="page-lead">Tous les modules et toutes les méthodes publiés dans une seule bibliothèque, sans distinction d&apos;origine.</p><LibraryClient {...catalog}/></div>;
}
