import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Header } from "@/components/header";
import { SITE_ORIGIN } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: "Algo Fi Jib. — Algorithmique et Python en Tunisie", template: "%s | Algo Fi Jib" },
  description: "Cours, exercices et méthodes d'algorithmique en Python pour les lycéens tunisiens : tableaux NumPy, matrices, PGCD, chaînes de caractères et programmation.",
  applicationName: "Algo Fi Jib",
  keywords: ["algorithmique Tunisie", "3ème informatique", "Python lycée", "tableaux NumPy", "matrices", "exercices algorithmes"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Algo Fi Jib — L'algorithmique, dans ta poche",
    description: "Apprends l'algorithmique et Python avec des méthodes expliquées pour les lycéens tunisiens.",
    url: SITE_ORIGIN,
    siteName: "Algo Fi Jib",
    locale: "fr_TN",
    type: "website",
  },
  twitter: { card: "summary", title: "Algo Fi Jib — Algorithmique en Tunisie" },
  // Paste the verification token from Search Console into Vercel Environment Variables.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Header /><main>{children}</main><footer className="footer"><div className="shell footer-inner"><div><strong>algo<span>fi</span>jib.</strong><p>L&apos;algo kollou fi jibek.</p></div><div className="footer-links"><Link href="/bibliotheque">El biblioteque.</Link><Link href="/parcours">Parcours</Link><Link href="/studio">El studio.</Link><Link href="/compte">Mon compte</Link></div></div><div className="shell footer-bottom">Fait pour apprendre, partager et progresser <Heart size={13}/> · Tunisie · Développé par Med Ali Tej, avec l’aide d’outils d’IA.</div></footer></body></html>;
}
