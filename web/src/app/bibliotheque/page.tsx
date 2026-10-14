import type { Metadata } from "next";
import { LibraryClient } from "@/components/library-client";
import { getPublicCatalog } from "@/lib/public-catalog-server";
import { getServerLocale } from "@/lib/server-locale";
import { tr } from "@/lib/translations";
export const metadata: Metadata = { title: "El biblioteque." };
export const dynamic = "force-dynamic";
export default async function LibraryPage() {
 const locale=await getServerLocale();
 const catalog = await getPublicCatalog();
 return <div className="shell inner-page"><div className="page-eyebrow">{tr(locale,"/ EXPLORER")}</div><h1>{tr(locale,"El biblioteque.").replace(/\.$/,"")}<span className="title-dot">.</span></h1><p className="page-lead">{tr(locale,"Tous les modules et toutes les méthodes publiés dans une seule bibliothèque, sans distinction d'origine.")}</p><LibraryClient {...catalog}/></div>;
}
