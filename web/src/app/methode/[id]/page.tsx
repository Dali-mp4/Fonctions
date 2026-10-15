import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPublicMethod } from "@/lib/public-catalog-server";
type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const m=await getPublicMethod((await params).id);
 return {title:m?.title??"Méthode indisponible",robots:{index:false,follow:false}};
}
// Existing Phase 5 bookmarks continue to work, but all approved teaching
// content now lives in the parent lesson and uses the same three tabs.
export default async function MethodPage({params}:Props){
 const method=await getPublicMethod((await params).id);
 if(!method) notFound();
 redirect(`/algorithme/${method.topic_slug}?m=${method.id}`);
}
