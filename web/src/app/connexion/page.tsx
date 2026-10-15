import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };
export default function Login(){return <div className="shell auth-layout"><div className="auth-side"><span className="section-kicker">ESPACE MEMBRES</span><h1>Ensemble, on va <em>plus loin.</em></h1><p>Connecte-toi pour accéder à ton espace. Les contributeurs invités pourront créer des brouillons qui seront relus avant publication.</p><div className="auth-quote">« Le meilleur algorithme est celui qu&apos;on comprend. »</div></div><LoginForm/></div>}
