import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Algo Fi Jib.", template: "%s | Algo Fi Jib" },
  description: "Explore, teste et comprends les algorithmes en Python. Une bibliothèque collaborative pensée pour les lycéens tunisiens.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Header /><main>{children}</main><footer className="footer"><div className="shell footer-inner"><div><strong>algo<span>fi</span>jib.</strong><p>L&apos;algo kollou fi jibek.</p></div><div className="footer-links"><Link href="/bibliotheque">El biblioteque.</Link><Link href="/parcours">Parcours</Link><Link href="/studio">El studio.</Link><Link href="/compte">Mon compte</Link></div></div><div className="shell footer-bottom">Fait pour apprendre, partager et progresser <Heart size={13}/> · Tunisie · Développé par Med Ali Tej, avec l’aide d’outils d’IA.</div></footer></body></html>;
}
