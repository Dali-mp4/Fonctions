import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { getServerLocale } from "@/lib/server-locale";
import { tr } from "@/lib/translations";
export const metadata: Metadata = { title: "Connexion" };
export default async function Login(){const locale=await getServerLocale();return <div className="shell auth-layout"><div className="auth-side"><span className="section-kicker">{tr(locale,"ESPACE MEMBRES")}</span><h1>{tr(locale,"Ensemble, on va")} <em>{tr(locale,"plus loin.")}</em></h1><p>{tr(locale,"Connecte-toi pour accéder à ton espace. Les contributeurs invités pourront créer des brouillons qui seront relus avant publication.")}</p><div className="auth-quote">« {tr(locale,"Le meilleur algorithme est celui qu'on comprend.")} »</div></div><LoginForm/></div>}
