import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Layers3 } from "lucide-react";
import { getPublicCatalog } from "@/lib/public-catalog-server";
import { getSchoolPaths } from "@/lib/school-paths";

export const metadata: Metadata = { title: "Parcours scolaires" };
export const dynamic = "force-dynamic";

export default async function Parcours() {
  const { lessons } = await getPublicCatalog();
  const paths = getSchoolPaths(lessons);

  return <div className="shell inner-page">
    <div className="page-eyebrow">/ APPRENDRE</div>
    <h1>Ton parcours, <em>ton rythme.</em></h1>
    <p className="page-lead">
      Retrouve les modules d&apos;algorithmique selon ton niveau.
      Choisis une notion et entraîne-toi avec ses différentes méthodes.
    </p>
    <div className="path-grid">
      {paths.map(path => <article className="path-card" key={path.year}>
        <div className={path.year===4?"path-illustration secondary":"path-illustration"}>
          {path.year===4?<Layers3 size={36}/>:<GraduationCap size={36}/>}
          <span>{String(path.year).padStart(2,"0")}</span>
        </div>
        <span className="tiny-tag">{path.modules.length} module{path.modules.length>1?"s":""}</span>
        <h2>{path.year===3?"3ème Sciences de l'Informatique":"4ème Sciences de l'Informatique"}</h2>
        <p>Explore les notions disponibles à ton niveau et découvre les méthodes de chaque module.</p>
        <div className="path-modules" aria-label={`Modules de ${path.year}ème`}>
          {path.modules.map(module => <Link key={module.slug} href={`/algorithme/${module.slug}`}>
            {module.name}<ArrowRight size={14}/>
          </Link>)}
        </div>
        <Link href="/bibliotheque">Explorer El biblioteque. <ArrowRight size={17}/></Link>
      </article>)}
    </div>
    {paths.length===0 && <p className="page-lead">
      Consulte <Link href="/bibliotheque">El biblioteque.</Link> pour découvrir les modules disponibles.
    </p>}
  </div>;
}
