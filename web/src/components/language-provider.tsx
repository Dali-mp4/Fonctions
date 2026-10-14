"use client";
import { createContext, useContext, type ReactNode } from "react";

import { type Locale, tr } from "@/lib/translations";

const LocaleContext=createContext<Locale>("fr");
export function LanguageProvider({locale,children}:{locale:Locale;children:ReactNode}){
 return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
export function useLocale(){return useContext(LocaleContext);}
export function useTranslate(){
 const locale=useLocale();
 return (french:string)=>tr(locale,french);
}
export function LanguageSwitcher(){
 const locale=useLocale();
 function choose(raw:string){
   const next=raw==="en"||raw==="ar"?raw:"fr";
   document.cookie="afj_locale="+next+"; Path=/; Max-Age=31536000; SameSite=Lax";
   // Full reload updates the HTML lang/dir attributes and server content.
   window.location.reload();
 }
 return <label className="language-switch" dir="ltr">
   <span className="sr-only">{tr(locale,"Langue")}</span>
   <select aria-label={tr(locale,"Langue")} value={locale} onChange={e=>choose(e.target.value)}>
     <option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option>
   </select>
 </label>;
}
