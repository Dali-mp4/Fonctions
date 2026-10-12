import type { Metadata } from "next";
import Link from "next/link";
import { Github, Heart } from "lucide-react";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Algo Fi Jib — Fonctions", template: "%s | Algo Fi Jib" },
  description: "Explore, teste et comprends les algorithmes en Python. Une bibliothèque collaborative pensée pour les lycéens tunisiens.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Header /><main>{children}</main><footer className="footer"><div className="shell footer-inner"><div><strong>algo<span>fi</span>jib.</strong><p>L&apos;algo kollou fi jibek. Un projet éducatif qui grandit avec vous.</p></div><div className="footer-links"><Link href="/bibliotheque">Bibliothèque</Link><Link href="/parcours">Parcours</Link><Link href="/studio">Contribuer</Link><a href="https://github.com/Dali-mp4/Fonctions" target="_blank" rel="noopener noreferrer"><Github size={16}/> GitHub</a></div></div><div className="shell footer-bottom">Fait pour apprendre, partager et progresser <Heart size={13}/> · Tunisie · Version de développement</div></footer></body></html>;
}
