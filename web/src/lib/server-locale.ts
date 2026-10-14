import "server-only";
import { cookies } from "next/headers";
import { parseLocale } from "@/lib/translations";
export async function getServerLocale(){
 return parseLocale((await cookies()).get("afj_locale")?.value);
}
