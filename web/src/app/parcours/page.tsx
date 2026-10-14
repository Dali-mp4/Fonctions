import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Layers3 } from "lucide-react";
import { getPublicCatalog } from "@/lib/public-catalog-server";
import { getSchoolPaths } from "@/lib/school-paths";

import { getServerLocale } from "@/lib/server-locale";
import { tr } from "@/lib/translations";
import { localizeLesson } from "@/lib/lesson-translations";
export const metadata: Metadata = { title: "Parcours scolaires" };
export const dynamic = "force-dynamic";

export default async function Parcours() {
  const locale=await getServerLocale();
  const { lessons } = await getPublicCatalog();
  const paths = getSchoolPaths(lessons);

  return <div className="shell inner-page">
    <div className="page-eyebrow">{tr(locale,"/ APPRENDRE")}</div>
    <h1>{tr(locale,"Ton parcours,")} <em>{tr(locale,"ton rythme.")}</em></h1>
    <p className="page-lead">
      {tr(locale,"Retrouve les modules d'algorithmique selon ton niveau. Choisis une notion et entraîne-toi avec ses différentes méthodes.")}
    </p>
    <div className="path-grid">
      {paths.map(path => <article className="path-card" key={path.year}>
        <div className={path.year===4?"path-illustration secondary":"path-illustration"}>
          {path.year===4?<Layers3 size={36}/>:<GraduationCap size={36}/>}
          <span>{String(path.year).padStart(2,"0")}</span>
        </div>
        <span className="tiny-tag">{path.modules.length} module{path.modules.length>1?"s":""}</span>
        <h2>{tr(locale,path.year===3?"3ème Sciences de l'Informatique":"4ème Sciences de l'Informatique")}</h2>
        <p>{tr(locale,"Explore les notions disponibles à ton niveau et découvre les méthodes de chaque module.")}</p>
        <div className="path-modules" aria-label={`Modules de ${path.year}ème`}>
          {path.modules.map(module => <Link key={module.slug} href={`/algorithme/${module.slug}`}>
            {localizeLesson(module,locale).name}<ArrowRight size={14}/>
          </Link>)}
        </div>
        <Link href="/bibliotheque">{tr(locale,"Explorer la bibliothèque")} <ArrowRight size={17}/></Link>
      </article>)}
    </div>
    {paths.length===0 && <p className="page-lead">
      {tr(locale,"Consulte")} <Link href="/bibliotheque">{tr(locale,"El biblioteque.")}</Link> {tr(locale,"pour découvrir les modules disponibles.")}
    </p>}
  </div>;
}
