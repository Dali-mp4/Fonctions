"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Code2, Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher, useTranslate } from "@/components/language-provider";

const nav = [
  { label: "Accueil", href: "/" },
  { label: "El biblioteque.", href: "/bibliotheque" },
  { label: "Parcours", href: "/parcours" },
];
export function Header() {
  const pathname = usePathname();
  const t=useTranslate();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)} aria-label="Algo Fi Jib — Accueil">
          <span className="brand-symbol"><Code2 size={23} strokeWidth={2.4} /></span>
          <span className="brand-copy"><strong>algo<span>fi</span>jib.</strong><small>FONCTIONS / TUNISIE</small></span>
        </Link>
        <nav className={open ? "main-nav open" : "main-nav"} aria-label="Navigation principale">
          {nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={pathname === item.href ? "active" : ""}>{t(item.label)}</Link>)}
          <Link href="/studio" onClick={() => setOpen(false)} className={pathname === "/studio" ? "active" : ""}>{t("El studio.")}</Link>
        </nav>
        <LanguageSwitcher/>
        <Link href="/compte" className="header-login">{t("Mon compte")} <ArrowUpRight size={16}/></Link>
        <button className="mobile-menu" type="button" aria-label={t("Afficher la navigation")} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  );
}
