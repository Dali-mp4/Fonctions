import type { Metadata } from "next";
import Link from "next/link";
import { Github, Heart } from "lucide-react";
import { Header } from "@/components/header";
import { getServerLocale } from "@/lib/server-locale";
import { tr } from "@/lib/translations";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Algo Fi Jib.", template: "%s | Algo Fi Jib" },
  description: "Explore, teste et comprends les algorithmes en Python. Une bibliothèque collaborative pensée pour les lycéens tunisiens.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale=await getServerLocale();
  return <html lang={locale} dir={locale==="ar"?"rtl":"ltr"}><body><LanguageProvider locale={locale}><Header /><main>{children}</main><footer className="footer"><div className="shell footer-inner"><div><strong>algo<span>fi</span>jib.</strong><p>L&apos;algo kollou fi jibek.</p></div><div className="footer-links"><Link href="/bibliotheque">{tr(locale,"El biblioteque.")}</Link><Link href="/parcours">{tr(locale,"Parcours")}</Link><Link href="/studio">{tr(locale,"El studio.")}</Link><Link href="/compte">{tr(locale,"Mon compte")}</Link><a href="https://github.com/Dali-mp4/Fonctions" target="_blank" rel="noopener noreferrer"><Github size={16}/> GitHub</a></div></div><div className="shell footer-bottom">{tr(locale,"Fait pour apprendre, partager et progresser")} <Heart size={13}/> · {tr(locale,"Tunisie")} · {tr(locale,"Développé par Med Ali Tej, avec l’aide d’outils d’IA.")}</div></footer></LanguageProvider></body></html>;
}
