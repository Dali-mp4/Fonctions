import type { Metadata } from "next";
import { LibraryClient } from "@/components/library-client";
import { getPublicCatalog } from "@/lib/public-catalog-server";
export const metadata: Metadata = { title: "Bibliothèque" };
export const dynamic = "force-dynamic";
export default async function LibraryPage() {
 const catalog = await getPublicCatalog();
 return <div className="shell inner-page"><div className="page-eyebrow">/ EXPLORER</div><h1>La bibliothèque<span className="title-dot">.</span></h1><p className="page-lead">Les modules scolaires originaux, puis les méthodes de la communauté après relecture indépendante.</p><LibraryClient {...catalog}/></div>;
}
