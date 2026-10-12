import type { Metadata } from "next";
import { LibraryClient } from "@/components/library-client";
export const metadata: Metadata = { title: "Bibliothèque" };
export default function LibraryPage(){ return <div className="shell inner-page"><div className="page-eyebrow">/ EXPLORER</div><h1>La bibliothèque<span className="title-dot">.</span></h1><p className="page-lead">Des fonctions pour comprendre, pratiquer et aller plus loin. Commence par les méthodes scolaires.</p><LibraryClient/></div>; }
