import { algorithms, type Algorithm } from "@/lib/catalog";
const base = algorithms.find(a=>a.slug==="tableau")!;
/** Built-in classroom Base #2, never a forged contributor approval. */
export const tableauTriLesson: Algorithm = {
 ...base, slug:"tableau-tri",name:"TABLEAU · TRI",title:"Tri par sélection",
 summary:"Trier un tableau par sélection, en ordre croissant ou décroissant.",
 principle:"À chaque passage, trouver la valeur maximale parmi les cases restantes, puis échanger. Inverser ensuite pour obtenir un ordre croissant.",
 example:"[8,3,11,2,5] → [2,3,5,8,11]",tags:["tableau","tri","sélection"],
 inputs:[base.inputs[0],{name:"ordre",label:"Ordre du tri",kind:"choice",
 default:"Croissant",options:["Croissant","Décroissant"],min_value:null,max_value:null,hint:"Choisis le sens du tri."}],
 code_sections:[{"title":"Tri par sélection — méthode Base","pseudocode":"Fonction TRI(T : Tab, n : Entier) : Tab\nDébut\n    Pour i de 0 à n - 2 Faire\n        p ← i\n        Pour j de i + 1 à n - 1 Faire\n            Si T[j] > T[p] Alors\n                p ← j\n            Fin Si\n        Fin Pour\n        Si p ≠ i Alors\n            a ← T[i]\n            T[i] ← T[p]\n            T[p] ← a\n        Fin Si\n    Fin Pour\n    Retourner T\nFin","python":"def tri(T, n):\n    for i in range(n - 1):\n        p = i\n        for j in range(i + 1, n):\n            if T[j] > T[p]:\n                p = j\n        if p != i:\n            a = T[i]\n            T[i] = T[p]\n            T[p] = a\n    return T","note":"Cette variante Base classe dans l’ordre décroissant. Pour trier directement en croissant, remplacer > par < dans ce code ; dans l’atelier, le tri croissant inverse le résultat décroissant."}],
};
