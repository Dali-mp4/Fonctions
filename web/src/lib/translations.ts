/** Public interface translations. French is the canonical fallback. Never translate code. */
export type Locale = "fr" | "en" | "ar";
export const locales: Locale[] = ["fr","en","ar"];
export function parseLocale(value: string | undefined | null): Locale {
 return value === "en" || value === "ar" ? value : "fr";
}
const extra:Record<string,[string,string]>={"Langue":["Language","اللغة"]};
const english: Record<string,string> = {
  "Accueil": "Home",
  "El biblioteque.": "The library",
  "El studio.": "The studio",
  "Parcours": "Study paths",
  "Mon compte": "My account",
  "Afficher la navigation": "Show navigation",
  "Navigation principale": "Main navigation",
  "CONÇU POUR LES LYCÉENS TUNISIENS": "BUILT FOR TUNISIAN HIGH SCHOOL STUDENTS",
  "L'algorithmique,": "Algorithms,",
  "à ta portée.": "made simple.",
  "Tous les modules publiés réunis au même endroit. Des explications claires, plusieurs méthodes et du Python à tester.": "All published modules in one place. Clear explanations, different methods, and Python you can try.",
  "Explorer les fonctions": "Explore algorithms",
  "Choisir mon parcours": "Choose my path",
  "modules disponibles": "available modules",
  "approches Base et Advanced": "Base and Advanced approaches",
  "idées à partager": "ideas to share",
  "Comprends. Teste. Progresse.": "Understand. Test. Improve.",
  "Conçu pour tes cours": "Designed for your classes",
  "Algorithmes scolaires & Python": "School algorithms & Python",
  "Apprends en testant": "Learn by trying",
  "Change les valeurs, observe le résultat": "Change inputs and see the result",
  "Une bibliothèque qui grandit": "A growing library",
  "Chaque méthode publiée a sa place": "Every published method belongs here",
  "DÉCOUVRIR": "DISCOVER",
  "Découvre les modules": "Explore the modules",
  "Une seule bibliothèque : tous les modules publiés, avec leurs méthodes et leurs explications.": "One library for all published modules, their methods and explanations.",
  "Toute la bibliothèque": "Browse the library",
  "DEUX MANIÈRES DE RÉSOUDRE": "TWO WAYS TO SOLVE",
  "À chaque problème,": "For every problem,",
  "plusieurs méthodes.": "more than one method.",
  "Chaque module peut proposer des méthodes": "Each module can offer",
  "pour apprendre progressivement et": "to learn step by step, and",
  "pour approfondir. Toutes font partie d'Algo Fi Jib.": "to explore further. All belong to Algo Fi Jib.",
  "Découvrir les modules": "Explore modules",
  "Pour bien commencer": "Start with the basics",
  "Une méthode expliquée simplement, étape par étape.": "A clear method explained step by step.",
  "Pour aller plus loin": "Explore further",
  "D'autres approches, avec des explications détaillées.": "Other approaches with detailed explanations.",
  "COLLABORATION": "COLLABORATION",
  "Une plateforme qui grandit": "A platform that grows",
  "ensemble.": "together.",
  "Les contributions sont testées puis vérifiées avant d'être accessibles aux élèves.": "Submissions are tested and reviewed before they become available to students.",
  "ÉTAPE 01": "STEP 01",
  "ÉTAPE 02": "STEP 02",
  "ÉTAPE 03": "STEP 03",
  "Écrire": "Write",
  "Faire vérifier": "Get reviewed",
  "Partager": "Share",
  "Crée ton algorithme et sa fiche pédagogique depuis un espace dédié.": "Create an algorithm and teaching guide in your own workspace.",
  "Des tests techniques et une relecture éducative protègent la bibliothèque.": "Technical tests and educational reviews protect the library.",
  "Une fois approuvée, ta méthode fait pleinement partie d'Algo Fi Jib.": "Once approved, your method becomes a full part of Algo Fi Jib.",
  "La bibliothèque évolue grâce aux méthodes approuvées.": "The library grows through approved methods.",
  "Voir l'espace contributeur": "Open contributor workspace",
  "/ EXPLORER": "/ EXPLORE",
  "Tous les modules et toutes les méthodes publiés dans une seule bibliothèque, sans distinction d'origine.": "All published modules and methods in one library, regardless of their origin.",
  "La bibliothèque est momentanément indisponible en partie. Certains modules peuvent manquer ; réessaie plus tard.": "Some modules are temporarily unavailable. Please try again later.",
  "Rechercher PGCD, tableau, matrice...": "Search GCD, arrays, matrices...",
  "Rechercher un algorithme": "Search an algorithm",
  "Filtrer par catégorie": "Filter by category",
  "Filtrer par méthode": "Filter by method",
  "Toutes": "All",
  "Avec variantes": "With alternatives",
  "modules publiés": "published modules",
  "Toutes les méthodes réunies dans El biblioteque.": "All methods together in the library.",
  "Aucun résultat pour cette recherche.": "No matching results.",
  "MODULE": "MODULE",
  "Explorer les méthodes": "Explore methods",
  "Atelier interactif": "Interactive playground",
  "Retour à la bibliothèque": "Back to the library",
  "MODULE ALGO FI JIB": "ALGO FI JIB MODULE",
  "Module Algo Fi Jib": "Algo Fi Jib module",
  "Plusieurs façons d'apprendre": "More ways to learn",
  "Choisis une méthode ci-dessous. Le parcours et les onglets restent les mêmes.": "Choose a method below. The lessons and tabs stay consistent.",
  "Méthode de résolution": "Solution method",
  "Explorer cette méthode": "Explore this method",
  "Tri par sélection": "Selection sort",
  "Chaque méthode présentée fait pleinement partie d'Algo Fi Jib. Les ateliers utilisent une exécution encadrée ; certaines méthodes demandent une connexion et sont soumises à des quotas.": "Every method here is part of Algo Fi Jib. Execution runs in a controlled environment; some methods require sign-in and usage limits.",
  "Comprends le raisonnement, pas seulement le code.": "Understand the reasoning, not just the code.",
  "/ APPRENDRE": "/ LEARN",
  "Ton parcours,": "Your path,",
  "ton rythme.": "your pace.",
  "Retrouve les modules d'algorithmique selon ton niveau. Choisis une notion et entraîne-toi avec ses différentes méthodes.": "Find algorithm modules for your school level. Pick a concept and practice its methods.",
  "3ème Sciences de l'Informatique": "3rd-year Computer Science",
  "4ème Sciences de l'Informatique": "4th-year Computer Science",
  "Explore les notions disponibles à ton niveau et découvre les méthodes de chaque module.": "Explore the concepts for your level and discover each module's methods.",
  "Consulte": "See",
  "pour découvrir les modules disponibles.": "to explore available modules.",
  "/ CONTRIBUER": "/ CONTRIBUTE",
  "Crée ton implémentation, rédige ton explication et conserve un brouillon privé. Chaque publication passera par une validation.": "Write an implementation and explanation, and save a private draft. Every publication is reviewed.",
  "Configuration nécessaire": "Setup required",
  "Pour activer le studio, crée un projet Supabase puis configure les variables d'environnement. Aucun accès administrateur simulé n'est accordé.": "Supabase authentication needs to be configured to enable the studio.",
  "Explorer la bibliothèque": "Explore the library",
  "Connexion requise": "Sign-in required",
  "L'éditeur est réservé aux contributeurs invités.": "The editor is reserved for invited contributors.",
  "Se connecter": "Sign in",
  "Accès réservé aux contributeurs": "Contributors only",
  "Ton compte étudiant peut explorer tous les modules. Demande une invitation au propriétaire pour créer des brouillons.": "You can explore all modules as a student. Ask the owner for an invitation to contribute.",
  "/ MON COMPTE": "/ MY ACCOUNT",
  "/ ESPACE MEMBRES": "/ MEMBER AREA",
  "Informations personnelles, sécurité et contrôle de tes sessions.": "Personal details, security and session management.",
  "Connecte-toi pour consulter et gérer ton profil en toute sécurité.": "Sign in to securely view and manage your profile.",
  "L'authentification Supabase n'est pas configurée.": "Supabase authentication is not configured.",
  "ESPACE MEMBRES": "MEMBER AREA",
  "Ensemble, on va": "Together, we go",
  "plus loin.": "further.",
  "Connecte-toi pour accéder à ton espace. Les contributeurs invités pourront créer des brouillons qui seront relus avant publication.": "Sign in to access your account. Invited contributors can submit drafts for review.",
  "Le meilleur algorithme est celui qu'on comprend.": "The best algorithm is one you understand.",
  "Fait pour apprendre, partager et progresser": "Made to learn, share and grow",
  "Tunisie": "Tunisia",
  "Développé par Med Ali Tej, avec l’aide d’outils d’IA.": "Developed by Med Ali Tej, with AI-assisted tools.",
  "Essayer": "Try it",
  "Comprendre": "Understand",
  "Algorithme & Python": "Algorithm & Python",
  "LE PRINCIPE": "THE IDEA",
  "EXEMPLE": "EXAMPLE",
  "À RETENIR / LIMITES": "TAKEAWAYS / LIMITS",
  "Du pseudo-code au Python.": "From pseudocode to Python.",
  "Explore les étapes et comprends le raisonnement de cette méthode.": "Follow the steps and understand how this method works.",
  "ALGORITHME / PSEUDO-CODE": "ALGORITHM / PSEUDOCODE",
  "PYTHON": "PYTHON",
  "Résultat réel": "Actual result",
  "Prêt à tester ?": "Ready to try?",
  "EXÉCUTION RÉUSSIE": "EXECUTION SUCCESSFUL",
  "Non fourni": "Not provided",
  "Copier le pseudo-code": "Copy pseudocode",
  "Copier le code Python": "Copy Python code",
  "Développé par": "Developed by",
  "langue originale": "original language",
  "Contenu pédagogique dans sa langue de publication.": "Lesson content is shown in its published language.",
  "Connexion requise · 2 exécutions/minute et 15/jour par compte · quota global de protection.": "Sign-in required · 2 runs/minute and 15/day per account · global quota.",
  "Modifie librement les valeurs, puis exécute la méthode approuvée dans un sandbox isolé.": "Change the input values and run the approved method in an isolated sandbox.",
  "Exécuter la méthode": "Run method",
  "Exécution isolée…": "Running in sandbox…",
  "Entre tes valeurs et lance une exécution Python isolée.": "Enter values and run Python safely.",
  "Vrai": "True",
  "Faux": "False",
  "Saisis ta propre valeur.": "Enter your own value.",
  "Utilise la notation JSON.": "Use JSON notation.",
  "Connexion à Google": "Google sign-in",
  "Continuer avec Google": "Continue with Google",
  "ou avec ton e-mail": "or with email",
  "E-mail": "Email",
  "Mot de passe": "Password",
  "Bienvenue !": "Welcome!",
  "Créer mon compte": "Create my account",
  "Choisis une méthode pour te connecter.": "Choose how to sign in.",
  "Un nouveau compte commence avec le rôle étudiant.": "New accounts start as students.",
  "Créer un compte": "Create an account",
  "Pas encore de compte ?": "Don't have an account?",
  "Déjà un compte ?": "Already have an account?",
  "S'inscrire": "Sign up",
  "Retour à l'accueil": "Back to home",
  "Les rôles contributeur et relecteur restent réservés aux invitations.": "Contributor and reviewer roles are invitation-only.",
  "Paramètres": "Parameters",
  "Profil": "Profile",
  "E-mail et connexion": "Email and sign-in",
  "Sessions et appareils": "Sessions and devices",
  "Suppression définitive": "Permanently delete account",
  "Connexion Google": "Google sign-in",
  "Enregistrer le nom": "Save name",
  "Changer mon mot de passe": "Change password",
  "Se déconnecter ici": "Sign out here",
  "Se déconnecter partout": "Sign out everywhere",
  "Supprimer définitivement mon compte": "Permanently delete my account",
  "Contributeur": "Contributor",
  "Relecteur": "Reviewer",
  "Étudiant": "Student",
  "Propriétaire": "Owner",
  "Chargement…": "Loading…",
  "Actualiser": "Refresh",
  "Annuler": "Cancel",
  "Enregistrer": "Save",
  "Envoyer": "Submit",
  "Soumettre": "Submit",
  "Modifier": "Edit",
  "Ajouter": "Add",
  "Supprimer": "Delete",
  "Approuver et publier": "Approve and publish",
  "Brouillon": "Draft",
  "Publié": "Published",
  "Archivé": "Archived",
  "Non disponible": "Unavailable",
  "Définition et cas de test": "Definition and test cases",
  "TESTS PYTHON ISOLÉS": "ISOLATED PYTHON TESTS",
  "Nom de la fonction Python": "Python function name",
  "Type de retour": "Return type",
  "Ajouter un paramètre": "Add a parameter",
  "Entier": "Integer",
  "Nombre": "Number",
  "Texte": "Text",
  "Booléen": "Boolean",
  "Tableau d'entiers": "List of integers",
  "Matrice d'entiers": "Integer matrix"
};
const arabic: Record<string,string> = {
  "Accueil": "الرئيسية",
  "El biblioteque.": "المكتبة",
  "El studio.": "الاستوديو",
  "Parcours": "المسارات",
  "Mon compte": "حسابي",
  "Afficher la navigation": "إظهار القائمة",
  "Navigation principale": "القائمة الرئيسية",
  "CONÇU POUR LES LYCÉENS TUNISIENS": "صُمّم لتلاميذ المعاهد التونسية",
  "L'algorithmique,": "الخوارزميات،",
  "à ta portée.": "في متناولك.",
  "Tous les modules publiés réunis au même endroit. Des explications claires, plusieurs méthodes et du Python à tester.": "كل الوحدات المنشورة في مكان واحد. شروحات واضحة وطرق متنوعة وكود بايثون يمكنك تجربته.",
  "Explorer les fonctions": "استكشف الخوارزميات",
  "Choisir mon parcours": "اختر مساري",
  "modules disponibles": "وحدات متاحة",
  "approches Base et Advanced": "طريقتا Base وAdvanced",
  "idées à partager": "أفكار للمشاركة",
  "Comprends. Teste. Progresse.": "افهم. جرّب. تقدّم.",
  "Conçu pour tes cours": "مصمم لدروسك",
  "Algorithmes scolaires & Python": "خوارزميات مدرسية وبايثون",
  "Apprends en testant": "تعلّم بالتجربة",
  "Change les valeurs, observe le résultat": "غيّر القيم وشاهد النتيجة",
  "Une bibliothèque qui grandit": "مكتبة تتطوّر",
  "Chaque méthode publiée a sa place": "لكل طريقة منشورة مكانها",
  "DÉCOUVRIR": "اكتشف",
  "Découvre les modules": "اكتشف الوحدات",
  "Une seule bibliothèque : tous les modules publiés, avec leurs méthodes et leurs explications.": "مكتبة واحدة لكل الوحدات المنشورة وطرقها وشروحها.",
  "Toute la bibliothèque": "تصفّح المكتبة",
  "DEUX MANIÈRES DE RÉSOUDRE": "طريقتان للحل",
  "À chaque problème,": "لكل مسألة،",
  "plusieurs méthodes.": "أكثر من طريقة.",
  "Chaque module peut proposer des méthodes": "يمكن لكل وحدة تقديم",
  "pour apprendre progressivement et": "للتعلّم تدريجيًا، و",
  "pour approfondir. Toutes font partie d'Algo Fi Jib.": "للتعمّق أكثر. جميعها جزء من Algo Fi Jib.",
  "Découvrir les modules": "اكتشف الوحدات",
  "Pour bien commencer": "ابدأ بالأساسيات",
  "Une méthode expliquée simplement, étape par étape.": "طريقة واضحة مشروحة خطوة بخطوة.",
  "Pour aller plus loin": "تعمّق أكثر",
  "D'autres approches, avec des explications détaillées.": "طرق أخرى مع شروحات مفصّلة.",
  "COLLABORATION": "التعاون",
  "Une plateforme qui grandit": "منصّة تنمو",
  "ensemble.": "معًا.",
  "Les contributions sont testées puis vérifiées avant d'être accessibles aux élèves.": "تُختبر المساهمات وتُراجع قبل إتاحتها للتلاميذ.",
  "ÉTAPE 01": "الخطوة 01",
  "ÉTAPE 02": "الخطوة 02",
  "ÉTAPE 03": "الخطوة 03",
  "Écrire": "اكتب",
  "Faire vérifier": "المراجعة",
  "Partager": "شارك",
  "Crée ton algorithme et sa fiche pédagogique depuis un espace dédié.": "أنشئ خوارزميتك وشرحها التعليمي في مساحة مخصّصة.",
  "Des tests techniques et une relecture éducative protègent la bibliothèque.": "تحمي الاختبارات التقنية والمراجعة التعليمية المكتبة.",
  "Une fois approuvée, ta méthode fait pleinement partie d'Algo Fi Jib.": "بعد الموافقة تصبح طريقتك جزءًا كاملًا من Algo Fi Jib.",
  "La bibliothèque évolue grâce aux méthodes approuvées.": "تتطوّر المكتبة بفضل الطرق المعتمدة.",
  "Voir l'espace contributeur": "افتح مساحة المساهمين",
  "/ EXPLORER": "/ استكشف",
  "Tous les modules et toutes les méthodes publiés dans une seule bibliothèque, sans distinction d'origine.": "جميع الوحدات والطرق المنشورة في مكتبة واحدة دون تمييز حسب المصدر.",
  "La bibliothèque est momentanément indisponible en partie. Certains modules peuvent manquer ; réessaie plus tard.": "بعض الوحدات غير متاحة مؤقتًا. حاول مجددًا لاحقًا.",
  "Rechercher PGCD, tableau, matrice...": "ابحث عن القاسم المشترك أو المصفوفات...",
  "Rechercher un algorithme": "ابحث عن خوارزمية",
  "Filtrer par catégorie": "تصفية حسب الصنف",
  "Filtrer par méthode": "تصفية حسب الطريقة",
  "Toutes": "الكل",
  "Avec variantes": "مع طرق بديلة",
  "modules publiés": "وحدات منشورة",
  "Toutes les méthodes réunies dans El biblioteque.": "كل الطرق موجودة في المكتبة.",
  "Aucun résultat pour cette recherche.": "لا توجد نتائج مطابقة.",
  "MODULE": "وحدة",
  "Explorer les méthodes": "استكشف الطرق",
  "Atelier interactif": "ورشة تفاعلية",
  "Retour à la bibliothèque": "العودة إلى المكتبة",
  "MODULE ALGO FI JIB": "وحدة ALGO FI JIB",
  "Module Algo Fi Jib": "وحدة Algo Fi Jib",
  "Plusieurs façons d'apprendre": "طرق متعددة للتعلّم",
  "Choisis une méthode ci-dessous. Le parcours et les onglets restent les mêmes.": "اختر طريقة أدناه. تبقى الدروس والتبويبات نفسها.",
  "Méthode de résolution": "طريقة الحل",
  "Explorer cette méthode": "استكشف هذه الطريقة",
  "Tri par sélection": "الترتيب بالاختيار",
  "Chaque méthode présentée fait pleinement partie d'Algo Fi Jib. Les ateliers utilisent une exécution encadrée ; certaines méthodes demandent une connexion et sont soumises à des quotas.": "كل طريقة هنا جزء من Algo Fi Jib. يجري التنفيذ في بيئة آمنة؛ وقد تتطلب بعض الطرق تسجيل الدخول وتخضع لحدود الاستعمال.",
  "Comprends le raisonnement, pas seulement le code.": "افهم المنطق لا الكود فقط.",
  "/ APPRENDRE": "/ تعلّم",
  "Ton parcours,": "مسارك،",
  "ton rythme.": "بنسقك.",
  "Retrouve les modules d'algorithmique selon ton niveau. Choisis une notion et entraîne-toi avec ses différentes méthodes.": "اكتشف وحدات الخوارزميات حسب مستواك الدراسي. اختر مفهومًا وتدرّب على طرقه.",
  "3ème Sciences de l'Informatique": "السنة الثالثة علوم الإعلامية",
  "4ème Sciences de l'Informatique": "السنة الرابعة علوم الإعلامية",
  "Explore les notions disponibles à ton niveau et découvre les méthodes de chaque module.": "تصفّح المفاهيم المتاحة لمستواك واكتشف طرق كل وحدة.",
  "Consulte": "راجع",
  "pour découvrir les modules disponibles.": "لاكتشاف الوحدات المتاحة.",
  "/ CONTRIBUER": "/ ساهم",
  "Crée ton implémentation, rédige ton explication et conserve un brouillon privé. Chaque publication passera par une validation.": "اكتب تطبيقك وشرحه واحفظ مسودّة خاصة. تخضع كل مساهمة للمراجعة قبل النشر.",
  "Configuration nécessaire": "الإعداد مطلوب",
  "Pour activer le studio, crée un projet Supabase puis configure les variables d'environnement. Aucun accès administrateur simulé n'est accordé.": "يجب إعداد المصادقة عبر Supabase لتفعيل الاستوديو.",
  "Explorer la bibliothèque": "استكشف المكتبة",
  "Connexion requise": "تسجيل الدخول مطلوب",
  "L'éditeur est réservé aux contributeurs invités.": "المحرر متاح للمساهمين المدعوين فقط.",
  "Se connecter": "تسجيل الدخول",
  "Accès réservé aux contributeurs": "خاص بالمساهمين",
  "Ton compte étudiant peut explorer tous les modules. Demande une invitation au propriétaire pour créer des brouillons.": "يمكنك استكشاف جميع الوحدات كتلميذ. اطلب دعوة من المالك للمساهمة.",
  "/ MON COMPTE": "/ حسابي",
  "/ ESPACE MEMBRES": "/ فضاء الأعضاء",
  "Informations personnelles, sécurité et contrôle de tes sessions.": "معلومات شخصية وأمان الحساب وإدارة الجلسات.",
  "Connecte-toi pour consulter et gérer ton profil en toute sécurité.": "سجّل الدخول لعرض ملفك وإدارته بأمان.",
  "L'authentification Supabase n'est pas configurée.": "لم تتم تهيئة المصادقة عبر Supabase.",
  "ESPACE MEMBRES": "فضاء الأعضاء",
  "Ensemble, on va": "معًا نذهب",
  "plus loin.": "أبعد.",
  "Connecte-toi pour accéder à ton espace. Les contributeurs invités pourront créer des brouillons qui seront relus avant publication.": "سجّل الدخول للوصول إلى حسابك. يمكن للمساهمين المدعوين تقديم مسودات للمراجعة.",
  "Le meilleur algorithme est celui qu'on comprend.": "أفضل خوارزمية هي التي تفهمها.",
  "Fait pour apprendre, partager et progresser": "صُنع للتعلّم والمشاركة والتقدّم",
  "Tunisie": "تونس",
  "Développé par Med Ali Tej, avec l’aide d’outils d’IA.": "طوّره Med Ali Tej بمساعدة أدوات الذكاء الاصطناعي.",
  "Essayer": "جرّب",
  "Comprendre": "افهم",
  "Algorithme & Python": "الخوارزمية وبايثون",
  "LE PRINCIPE": "الفكرة",
  "EXEMPLE": "مثال",
  "À RETENIR / LIMITES": "ملاحظات وحدود",
  "Du pseudo-code au Python.": "من الخوارزمية إلى بايثون.",
  "Explore les étapes et comprends le raisonnement de cette méthode.": "تابع الخطوات وافهم طريقة عمل هذه الخوارزمية.",
  "ALGORITHME / PSEUDO-CODE": "الخوارزمية / الشفرة الوصفية",
  "PYTHON": "بايثون",
  "Résultat réel": "النتيجة الفعلية",
  "Prêt à tester ?": "مستعد للتجربة؟",
  "EXÉCUTION RÉUSSIE": "تم التنفيذ بنجاح",
  "Non fourni": "غير متوفّر",
  "Copier le pseudo-code": "انسخ الخوارزمية",
  "Copier le code Python": "انسخ كود بايثون",
  "Développé par": "طوّره",
  "langue originale": "اللغة الأصلية",
  "Contenu pédagogique dans sa langue de publication.": "يُعرض المحتوى التعليمي بلغته المنشورة.",
  "Connexion requise · 2 exécutions/minute et 15/jour par compte · quota global de protection.": "يلزم تسجيل الدخول · تنفيذان في الدقيقة و15 يوميًا لكل حساب · حد إجمالي للحماية.",
  "Modifie librement les valeurs, puis exécute la méthode approuvée dans un sandbox isolé.": "غيّر القيم وشغّل الطريقة المعتمدة في بيئة معزولة.",
  "Exécuter la méthode": "نفّذ الطريقة",
  "Exécution isolée…": "جارٍ التنفيذ في بيئة معزولة…",
  "Entre tes valeurs et lance une exécution Python isolée.": "أدخل قيمك ونفّذ بايثون بأمان.",
  "Vrai": "صحيح",
  "Faux": "خطأ",
  "Saisis ta propre valeur.": "أدخل قيمتك.",
  "Utilise la notation JSON.": "استخدم صيغة JSON.",
  "Connexion à Google": "تسجيل الدخول عبر غوغل",
  "Continuer avec Google": "المتابعة باستخدام Google",
  "ou avec ton e-mail": "أو بالبريد الإلكتروني",
  "E-mail": "البريد الإلكتروني",
  "Mot de passe": "كلمة المرور",
  "Bienvenue !": "مرحبًا!",
  "Créer mon compte": "إنشاء حسابي",
  "Choisis une méthode pour te connecter.": "اختر طريقة تسجيل الدخول.",
  "Un nouveau compte commence avec le rôle étudiant.": "تبدأ الحسابات الجديدة بصلاحية تلميذ.",
  "Créer un compte": "إنشاء حساب",
  "Pas encore de compte ?": "ليس لديك حساب؟",
  "Déjà un compte ?": "لديك حساب بالفعل؟",
  "S'inscrire": "التسجيل",
  "Retour à l'accueil": "العودة للرئيسية",
  "Les rôles contributeur et relecteur restent réservés aux invitations.": "صلاحيات المساهم والمراجع متاحة بالدعوة فقط.",
  "Paramètres": "المعاملات",
  "Profil": "الملف الشخصي",
  "E-mail et connexion": "البريد وتسجيل الدخول",
  "Sessions et appareils": "الجلسات والأجهزة",
  "Suppression définitive": "حذف الحساب نهائيًا",
  "Connexion Google": "الدخول بغوغل",
  "Enregistrer le nom": "حفظ الاسم",
  "Changer mon mot de passe": "تغيير كلمة المرور",
  "Se déconnecter ici": "تسجيل الخروج هنا",
  "Se déconnecter partout": "تسجيل الخروج من كل الأجهزة",
  "Supprimer définitivement mon compte": "حذف حسابي نهائيًا",
  "Contributeur": "مساهم",
  "Relecteur": "مراجع",
  "Étudiant": "تلميذ",
  "Propriétaire": "مالك",
  "Chargement…": "جارٍ التحميل…",
  "Actualiser": "تحديث",
  "Annuler": "إلغاء",
  "Enregistrer": "حفظ",
  "Envoyer": "إرسال",
  "Soumettre": "إرسال للمراجعة",
  "Modifier": "تعديل",
  "Ajouter": "إضافة",
  "Supprimer": "حذف",
  "Approuver et publier": "الموافقة والنشر",
  "Brouillon": "مسودة",
  "Publié": "منشور",
  "Archivé": "مؤرشف",
  "Non disponible": "غير متوفّر",
  "Définition et cas de test": "تعريف الدالة وحالات الاختبار",
  "TESTS PYTHON ISOLÉS": "اختبارات بايثون المعزولة",
  "Nom de la fonction Python": "اسم دالة بايثون",
  "Type de retour": "نوع القيمة المُعادة",
  "Ajouter un paramètre": "أضف معاملًا",
  "Entier": "عدد صحيح",
  "Nombre": "عدد",
  "Texte": "نص",
  "Booléen": "منطقي",
  "Tableau d'entiers": "قائمة أعداد صحيحة",
  "Matrice d'entiers": "مصفوفة أعداد صحيحة"
};
Object.assign(extra,{
  "Onglets du module": [
    "Module tabs",
    "تبويبات الوحدة"
  ],
  "Paramètres d'entrée": [
    "Input parameters",
    "معطيات الإدخال"
  ],
  "Résultat de l'exécution": [
    "Execution result",
    "نتيجة التنفيذ"
  ],
  "Voir les étapes": [
    "View steps",
    "عرض الخطوات"
  ],
  "À RETENIR": [
    "REMEMBER",
    "تذكّر"
  ],
  "Comment fonctionne": [
    "How does",
    "كيف تعمل"
  ],
  "Tes paramètres": [
    "Your inputs",
    "قيم الإدخال"
  ],
  "Remplis le tableau et affiche ses valeurs.": [
    "Fill the array and display its values.",
    "املأ الجدول واعرض قيمه."
  ],
  "Remplis la matrice ligne par ligne pour observer ses cases et ses indices.": [
    "Fill the matrix row by row to see its cells and indices.",
    "املأ المصفوفة سطرًا بسطر لملاحظة الخلايا والفهارس."
  ],
  "Modifie les valeurs pour observer le comportement de la fonction.": [
    "Change the values to see how the function behaves.",
    "غيّر القيم لملاحظة سلوك الدالة."
  ],
  "Une ligne par champ : nom;type;valeur": [
    "One field per line: name;type;value",
    "حقل لكل سطر: الاسم؛النوع؛القيمة"
  ],
  "Exécuter l'algorithme": [
    "Run algorithm",
    "تنفيذ الخوارزمية"
  ],
  "Exécution...": [
    "Running...",
    "جارٍ التنفيذ..."
  ],
  "Entre tes valeurs et lance l'exécution. Le résultat apparaîtra ici.": [
    "Enter values and run. The result will appear here.",
    "أدخل قيمك ونفّذ الخوارزمية. ستظهر النتيجة هنا."
  ],
  "Les exécutions se font uniquement dans un sandbox isolé, soumis à des quotas.": [
    "Runs take place only in a rate-limited isolated sandbox.",
    "يجري التنفيذ فقط في بيئة معزولة مع حدود للاستخدام."
  ],
  "Inscription": [
    "Joined",
    "تاريخ التسجيل"
  ],
  "Dernière connexion": [
    "Last sign-in",
    "آخر دخول"
  ],
  "Adresse vérifiée": [
    "Verified email",
    "بريد مؤكد"
  ],
  "Ouvrir El studio. →": [
    "Open the studio →",
    "افتح الاستوديو ←"
  ],
  "Ton nom d'affichage est indépendant de ton rôle et de tes contributions.": [
    "Your display name is separate from your role and contributions.",
    "اسم العرض مستقل عن دورك ومساهماتك."
  ],
  "Nom d'affichage": [
    "Display name",
    "اسم العرض"
  ],
  "Méthodes liées à ce compte :": [
    "Sign-in methods linked to this account:",
    "طرق الدخول المرتبطة بالحساب:"
  ],
  "Nouvelle adresse e-mail": [
    "New email address",
    "عنوان بريد جديد"
  ],
  "Choisis au moins 12 caractères. Une reconnexion ou une vérification supplémentaire peut être demandée.": [
    "Use at least 12 characters. You may be asked to sign in again.",
    "استخدم 12 حرفًا على الأقل. قد يلزم تسجيل الدخول مجددًا."
  ],
  "Nouveau mot de passe": [
    "New password",
    "كلمة المرور الجديدة"
  ],
  "Confirmer le mot de passe": [
    "Confirm password",
    "تأكيد كلمة المرور"
  ],
  "Gère la session de ce navigateur ou révoque les sessions des autres appareils.": [
    "Manage this browser session or revoke sessions on other devices.",
    "أدر جلسة هذا المتصفح أو ألغِ الجلسات على الأجهزة الأخرى."
  ],
  "Déconnecter les autres appareils": [
    "Sign out other devices",
    "تسجيل خروج الأجهزة الأخرى"
  ],
  "La révocation des sessions n'invalide pas instantanément les jetons d'accès déjà émis ; ils expirent naturellement.": [
    "Previously issued access tokens remain valid until expiry.",
    "تبقى رموز الوصول السابقة صالحة حتى انتهاء مدتها."
  ],
  "Le compte propriétaire ne peut pas être supprimé depuis cette page. Un transfert de propriété est nécessaire.": [
    "The owner account cannot be deleted here; ownership must be transferred first.",
    "لا يمكن حذف حساب المالك هنا؛ يجب نقل الملكية أولًا."
  ],
  "Demandes antérieures": [
    "Previous requests",
    "طلبات سابقة"
  ],
  "Ces demandes datent de l'ancien système. Les membres peuvent désormais supprimer directement leur compte après confirmation et reconnexion récente.": [
    "These requests are from the old system. Members can now delete their accounts after confirmation and recent sign-in.",
    "هذه الطلبات من النظام السابق. يمكن للأعضاء حذف حساباتهم بعد التأكيد وتسجيل دخول حديث."
  ],
  "Aucune demande en attente.": [
    "No pending requests.",
    "لا توجد طلبات معلقة."
  ],
  "Retrouve l'identifiant dans Supabase → Authentication → Users. Les contenus pédagogiques et l'historique sont conservés de manière pseudonyme.": [
    "Find the user ID in Supabase → Authentication → Users. Educational content and history are retained under pseudonyms.",
    "ابحث عن المعرّف في Supabase → Authentication → Users. يُحتفظ بالمحتوى التعليمي والسجل بهويات مستعارة."
  ],
  "Ton nom public": [
    "Your public name",
    "اسمك العلني"
  ],
  "Choisis un nom de 2 à 80 caractères.": [
    "Choose a name between 2 and 80 characters.",
    "اختر اسمًا يتكون من 2 إلى 80 حرفًا."
  ],
  "Supabase non configuré.": [
    "Supabase is not configured.",
    "لم يتم إعداد Supabase."
  ],
  "Ton nom d'affichage a été mis à jour.": [
    "Display name updated.",
    "تم تحديث اسم العرض."
  ],
  "Adresse e-mail invalide.": [
    "Invalid email address.",
    "عنوان البريد غير صالح."
  ],
  "Cette adresse est déjà associée au compte.": [
    "This email is already associated with your account.",
    "هذا البريد مرتبط بحسابك بالفعل."
  ],
  "Demande envoyée. Confirme le changement depuis les e-mails de validation avant qu'il prenne effet.": [
    "Request sent. Confirm the change using the verification emails.",
    "تم إرسال الطلب. أكّد التغيير عبر رسائل التحقق."
  ],
  "Utilise un mot de passe de 12 à 72 caractères.": [
    "Use a password between 12 and 72 characters.",
    "استخدم كلمة مرور من 12 إلى 72 حرفًا."
  ],
  "Les deux mots de passe ne correspondent pas.": [
    "Passwords do not match.",
    "كلمتا المرور غير متطابقتين."
  ],
  "Mot de passe mis à jour. Supabase peut demander une reconnexion selon les paramètres de sécurité.": [
    "Password updated. Supabase may ask you to sign in again.",
    "تم تحديث كلمة المرور. قد يطلب Supabase تسجيل الدخول مجددًا."
  ],
  "Les autres sessions ont été révoquées. Les jetons déjà émis peuvent rester valides jusqu'à expiration.": [
    "Other sessions were revoked. Existing tokens may remain valid until they expire.",
    "أُلغيت الجلسات الأخرى. قد تبقى الرموز الحالية صالحة حتى انتهاء مدتها."
  ],
  "Confirme les conséquences et recopie ton adresse e-mail exacte.": [
    "Confirm and re-enter your exact email address.",
    "أكّد العملية وأعد كتابة بريدك الإلكتروني بدقة."
  ],
  "Mes implémentations": [
    "My implementations",
    "تطبيقاتي"
  ],
  "Nouvelle": [
    "New",
    "جديد"
  ],
  "Chargement des brouillons…": [
    "Loading drafts…",
    "جارٍ تحميل المسودات…"
  ],
  "Tu n'as pas encore de brouillon. Crée ta première méthode ci-dessous.": [
    "You have no drafts yet. Create your first method below.",
    "ليس لديك مسودات بعد. أنشئ طريقتك الأولى أدناه."
  ],
  "Ouvrir et modifier →": [
    "Open and edit →",
    "افتح وعدّل ←"
  ],
  "Réussis les tests Python avant de soumettre.": [
    "Pass the Python tests before submitting.",
    "اجتز اختبارات بايثون قبل الإرسال."
  ],
  "Concept": [
    "Concept",
    "مفهوم"
  ],
  "Nouveau chapitre": [
    "New chapter",
    "فصل جديد"
  ],
  "Ce chapitre reste privé jusqu'à l'approbation de sa première méthode par un autre relecteur.": [
    "This chapter stays private until another reviewer approves its first method.",
    "يبقى هذا الفصل خاصًا حتى يوافق مراجع آخر على طريقته الأولى."
  ],
  "Identifiant URL": [
    "URL slug",
    "معرّف الرابط"
  ],
  "Nom": [
    "Name",
    "الاسم"
  ],
  "Catégorie": [
    "Category",
    "الصنف"
  ],
  "Niveau scolaire": [
    "School level",
    "المستوى الدراسي"
  ],
  "Présentation": [
    "Overview",
    "تقديم"
  ],
  "Type": [
    "Type",
    "النوع"
  ],
  "Base — méthode progressive": [
    "Base — progressive method",
    "Base — طريقة تدريجية"
  ],
  "Advanced — autre méthode": [
    "Advanced — alternative method",
    "Advanced — طريقة بديلة"
  ],
  "Titre": [
    "Title",
    "العنوان"
  ],
  "Explication": [
    "Explanation",
    "الشرح"
  ],
  "Présentation de la méthode": [
    "Method overview",
    "تقديم الطريقة"
  ],
  "Toutes les méthodes utilisent la même présentation : principe, exemple, limites et sections de pseudo-code / Python.": [
    "All methods use the same layout: idea, example, limits, pseudocode and Python sections.",
    "تستخدم جميع الطرق نفس العرض: الفكرة والمثال والحدود وأقسام الخوارزمية وبايثون."
  ],
  "Le principe": [
    "The idea",
    "الفكرة"
  ],
  "Exemple expliqué": [
    "Worked example",
    "مثال محلول"
  ],
  "À retenir / limites": [
    "Notes / limits",
    "ملاحظات وحدود"
  ],
  "Titre de la section principale": [
    "Main section title",
    "عنوان القسم الرئيسي"
  ],
  "Pseudo-code principal": [
    "Main pseudocode",
    "الخوارزمية الرئيسية"
  ],
  "Le Python principal est le code de l'éditeur à droite, qui sera testé par le sandbox.": [
    "The main Python is the editor code on the right, tested in the sandbox.",
    "كود بايثون الرئيسي هو الموجود في المحرر على اليمين وسيُختبر في بيئة معزولة."
  ],
  "Pseudo-code": [
    "Pseudocode",
    "الخوارزمية الوصفية"
  ],
  "Extrait Python": [
    "Python snippet",
    "مقطع بايثون"
  ],
  "Note": [
    "Note",
    "ملاحظة"
  ],
  "Retirer cette section": [
    "Remove section",
    "حذف القسم"
  ],
  "Ajouter une section (TDNT, TDOG, algorithme…)": [
    "Add a section (TDNT, TDOG, algorithm…)",
    "أضف قسمًا (TDNT، TDOG، خوارزمية...)"
  ],
  "Code Python": [
    "Python code",
    "كود بايثون"
  ],
  "NUMPY + RANDOM PRÉVUS": [
    "NUMPY + RANDOM",
    "NUMPY + RANDOM"
  ],
  "Exécution Python isolée.": [
    "Isolated Python execution.",
    "تنفيذ بايثون في بيئة معزولة."
  ],
  "Chargement de l'éditeur...": [
    "Loading editor...",
    "جارٍ تحميل المحرر..."
  ],
  "Nouvelle implémentation": [
    "New implementation",
    "تطبيق جديد"
  ],
  "Modifier le brouillon": [
    "Edit draft",
    "تعديل المسودة"
  ],
  "Enregistrer le brouillon": [
    "Save draft",
    "حفظ المسودة"
  ],
  "Créer le brouillon": [
    "Create draft",
    "إنشاء مسودة"
  ],
  "Exécuter les tests": [
    "Run tests",
    "إجراء الاختبارات"
  ],
  "Soumettre à la relecture →": [
    "Submit for review →",
    "إرسال للمراجعة ←"
  ],
  "Envoi…": [
    "Sending…",
    "جارٍ الإرسال…"
  ],
  "Déclare le nom de la fonction, les paramètres et le résultat attendu. Les valeurs sont enregistrées avec ton brouillon. Cette vérification contrôle": [
    "Declare the function name, parameters and expected result. This validation checks",
    "حدّد اسم الدالة والمعاملات والنتيجة المتوقعة. يتحقق هذا الفحص من"
  ],
  "le format": [
    "format",
    "الصيغة"
  ],
  ", pas le résultat du code Python.": [
    ", not Python's actual result.",
    "، وليس نتيجة تنفيذ بايثون."
  ],
  "Ajouter un test": [
    "Add test",
    "إضافة اختبار"
  ],
  "Cette fonction ne reçoit aucun argument.": [
    "This function takes no arguments.",
    "هذه الدالة لا تستقبل معاملات."
  ],
  "Aucun test défini. Ajoute des exemples avant de soumettre ta méthode à la vérification Python (prochaine étape).": [
    "No tests defined. Add examples before testing your method.",
    "لا توجد اختبارات. أضف أمثلة قبل اختبار طريقتك."
  ],
  "Nom du test": [
    "Test name",
    "اسم الاختبار"
  ],
  "Entrées (objet JSON)": [
    "Inputs (JSON object)",
    "المدخلات (JSON)"
  ],
  "Résultat attendu (JSON)": [
    "Expected result (JSON)",
    "النتيجة المتوقعة (JSON)"
  ],
  "Tableau :": [
    "Array:",
    "جدول:"
  ],
  "· Matrice :": [
    "· Matrix:",
    "· مصفوفة:"
  ],
  "Vérifier le format des tests": [
    "Validate test format",
    "تحقق من صيغة الاختبارات"
  ],
  "Exécution dans un sandbox sécurisé…": [
    "Running in a secure sandbox…",
    "جارٍ التنفيذ في بيئة آمنة..."
  ],
  "Chaque lancement prépare un environnement isolé. Patiente pendant la vérification des tests.": [
    "Each run starts an isolated environment. Wait while the tests run.",
    "كل تشغيل يجهّز بيئة معزولة. انتظر إتمام الاختبارات."
  ],
  "La préparation du sandbox peut prendre plusieurs secondes.": [
    "Preparing the sandbox can take several seconds.",
    "قد يستغرق تجهيز بيئة التنفيذ بضع ثوان."
  ],
  "Durée serveur :": [
    "Server time:",
    "زمن الخادم:"
  ],
  "Sandbox :": [
    "Sandbox:",
    "بيئة التنفيذ:"
  ],
  "Démarrage Modal :": [
    "Modal startup:",
    "تشغيل Modal:"
  ],
  "Python :": [
    "Python:",
    "بايثون:"
  ],
  "Résultat de la vérification du format": [
    "Test format validation result",
    "نتيجة التحقق من صيغة الاختبارات"
  ],
  "Aucun test Python n'a été exécuté et aucun cas n'est certifié réussi.": [
    "No Python tests have run; none is verified as passed.",
    "لم تُنفّذ اختبارات بايثون بعد ولم يتم التحقق من نجاح أي حالة."
  ],
  "File de relecture": [
    "Review queue",
    "قائمة المراجعة"
  ],
  "Inspecte le code Python, le pseudo-code, les cas de test et les résultats avant d'approuver. Un test réussi n'est pas une preuve de correction complète. Tu ne peux pas relire ton propre travail.": [
    "Review code, pseudocode, tests and results before approval. A passing test is not proof of correctness. You cannot review your own work.",
    "راجع بايثون والخوارزمية والاختبارات ونتائجها قبل الموافقة. نجاح الاختبار لا يضمن الصحة الكاملة. لا يمكنك مراجعة عملك."
  ],
  "Aucune soumission en attente. Les brouillons privés ne figurent pas ici.": [
    "No submissions awaiting review. Private drafts are not listed.",
    "لا توجد مساهمات تنتظر المراجعة. المسودات الخاصة لا تظهر هنا."
  ],
  "Code Python et pseudo-code soumis": [
    "Submitted code and pseudocode",
    "الكود والخوارزمية المقدّمان"
  ],
  "Contrat, tests et résultats d'exécution": [
    "Contract, tests and execution results",
    "تعريف الدالة والاختبارات ونتائج التنفيذ"
  ],
  "Résultats réels": [
    "Actual results",
    "النتائج الفعلية"
  ],
  "Aucune preuve enregistrée.": [
    "No evidence recorded.",
    "لا توجد أدلة محفوظة."
  ],
  "Fiche pédagogique présentée aux élèves": [
    "Teaching guide shown to students",
    "الشرح التعليمي المعروض للتلاميذ"
  ],
  "Sections d'apprentissage": [
    "Learning sections",
    "أقسام التعلّم"
  ],
  "Cette soumission t'appartient. Demande à un autre relecteur de la valider.": [
    "This is your submission. Another reviewer must approve it.",
    "هذه مساهمتك. يجب أن يوافق عليها مراجع آخر."
  ],
  "Demander des modifications": [
    "Request changes",
    "طلب تعديلات"
  ],
  "Envoyer le retour": [
    "Send feedback",
    "إرسال الملاحظات"
  ],
  "Explique précisément les changements à effectuer.": [
    "Describe the required changes precisely.",
    "اشرح التعديلات المطلوبة بدقة."
  ],
  "Publications · Propriétaire": [
    "Publications · Owner",
    "المنشورات · المالك"
  ],
  "Les méthodes approuvées rejoignent immédiatement la bibliothèque. Retirer une publication la rend indisponible sans effacer son historique.": [
    "Approved methods appear in the library. Withdrawing hides them without erasing their history.",
    "تظهر الطرق المعتمدة في المكتبة. يؤدي سحبها إلى إخفائها دون حذف سجلّها."
  ],
  "Aucune version publiée ou archivée.": [
    "No published or archived revisions.",
    "لا توجد نسخ منشورة أو مؤرشفة."
  ],
  "Retirer de publication": [
    "Withdraw publication",
    "سحب النشر"
  ],
  "Restaurer cette version": [
    "Restore this revision",
    "استعادة هذه النسخة"
  ],
  "Gérer les contributeurs": [
    "Manage contributors",
    "إدارة المساهمين"
  ],
  "Le compte de ton ami doit déjà exister. Retrouve son User UID dans Supabase → Authentication → Users. Seul le propriétaire peut accorder ou retirer ces rôles.": [
    "The member must already have an account. Find their UID in Supabase → Authentication → Users. Only the owner can manage these roles.",
    "يجب أن يكون العضو مسجلًا. اعثر على معرّفه في Supabase → Authentication → Users. يحق للمالك فقط إدارة هذه الصلاحيات."
  ],
  "User UID": [
    "User UID",
    "معرّف المستخدم"
  ],
  "Rôle": [
    "Role",
    "الدور"
  ],
  "Contributeur — crée des brouillons": [
    "Contributor — creates drafts",
    "مساهم — ينشئ مسودات"
  ],
  "Relecteur — vérifie les soumissions": [
    "Reviewer — reviews submissions",
    "مراجع — يراجع المساهمات"
  ],
  "Étudiant — retire les droits élevés": [
    "Student — removes elevated privileges",
    "تلميذ — سحب الصلاحيات المرتفعة"
  ],
  "Le rôle propriétaire n'est jamais attribuable depuis cette interface.": [
    "Owner access cannot be assigned here.",
    "لا يمكن منح دور المالك من هذه الواجهة."
  ],
  "Aucun événement enregistré.": [
    "No events recorded.",
    "لا توجد أحداث مسجلة."
  ],
  "Ouvrir les modules": [
    "Open modules",
    "افتح الوحدات"
  ],
  "Voir les cas de test": [
    "See test cases",
    "عرض حالات الاختبار"
  ],
  "Algorithme proposé": [
    "Submitted algorithm",
    "الخوارزمية المقترحة"
  ],
  "Entrées invalides": [
    "Invalid inputs",
    "مدخلات غير صحيحة"
  ]
});
Object.assign(extra,{
  "Oui": [
    "Yes",
    "نعم"
  ],
  "En attente": [
    "Pending",
    "قيد الانتظار"
  ],
  "Enregistrement…": [
    "Saving…",
    "جارٍ الحفظ…"
  ],
  "Demander le changement d'e-mail": [
    "Request email change",
    "طلب تغيير البريد الإلكتروني"
  ],
  "Envoi…": [
    "Sending…",
    "جارٍ الإرسال…"
  ],
  "Mise à jour…": [
    "Updating…",
    "جارٍ التحديث…"
  ],
  "Suppression…": [
    "Deleting…",
    "جارٍ الحذف…"
  ],
  "Ton identité Google est associée à ce compte. Les paramètres de Google se gèrent également chez Google.": [
    "Your Google identity is linked to this account. Google settings are managed through Google.",
    "هويتك في Google مرتبطة بهذا الحساب. يمكن إدارة إعداداتها عبر Google."
  ],
  "Tu peux choisir Continuer avec Google depuis la page de connexion après avoir activé ce fournisseur dans Supabase Auth.": [
    "You can choose Continue with Google on the sign-in page after enabling Google in Supabase Auth.",
    "يمكنك اختيار المتابعة باستخدام Google من صفحة الدخول بعد تفعيل Google في Supabase Auth."
  ],
  "Supprime ton compte sans validation administrative. Ton accès, ton e-mail et ton nom d'affichage seront effacés. Les cours, les méthodes et les décisions de relecture restent conservés sans identité personnelle liée.": [
    "You can delete your account without administrator approval. Your login, email and display name will be erased. Lessons, methods and review decisions remain without a linked personal identity.",
    "يمكنك حذف حسابك دون موافقة المسؤول. سيُحذف الوصول إلى حسابك وبريدك الإلكتروني واسم العرض. ستبقى الدروس والطرق وقرارات المراجعة دون ربطها بهويتك الشخصية."
  ],
  "Par sécurité, reconnecte-toi dans les 15 minutes précédant cette opération. La suppression est irréversible. Les contenus que tu as créés restent visibles s'ils ont été approuvés.": [
    "For security, sign in again within 15 minutes before this action. Account deletion cannot be undone. Your approved educational content stays available.",
    "للأمان، سجّل الدخول من جديد خلال 15 دقيقة قبل هذه العملية. لا يمكن التراجع عن الحذف. سيبقى محتواك التعليمي المعتمد متاحًا."
  ],
  "Tu avais une demande en attente. Tu peux maintenant supprimer directement ton compte.": [
    "You had a pending request. You can now delete your account directly.",
    "كان لديك طلب معلّق. يمكنك الآن حذف حسابك مباشرة."
  ],
  "Je comprends que mon compte sera supprimé et que mes contributions pédagogiques et leurs validations resteront conservées sous un auteur pseudonyme.": [
    "I understand that my account will be deleted and that my educational contributions and their approvals will be kept under a pseudonymous author.",
    "أفهم أن حسابي سيُحذف، وستبقى مساهماتي التعليمية وموافقات مراجعتها محفوظة باسم مستعار."
  ],
  "Recopie ton e-mail pour confirmer": [
    "Re-enter your email to confirm",
    "أعد كتابة بريدك للتأكيد"
  ],
  "Veuillez patienter...": [
    "Please wait...",
    "يرجى الانتظار..."
  ],
  "Redirection vers Google…": [
    "Redirecting to Google…",
    "جارٍ الانتقال إلى Google…"
  ],
  "toi@exemple.com": [
    "you@example.com",
    "you@example.com"
  ],
  "Configure Supabase pour activer les comptes.": [
    "Configure Supabase to enable accounts.",
    "قم بإعداد Supabase لتفعيل الحسابات."
  ],
  "L'authentification n'est pas encore configurée.": [
    "Authentication is not configured yet.",
    "لم يتم إعداد المصادقة بعد."
  ],
  "Compte créé. Vérifie ta boîte mail si la confirmation est activée.": [
    "Account created. Check your email if confirmation is enabled.",
    "تم إنشاء الحساب. تحقق من بريدك إذا كان تأكيد البريد مفعّلًا."
  ],
  "La connexion Google a échoué.": [
    "Google sign-in failed.",
    "فشل تسجيل الدخول عبر Google."
  ],
  "Ton compte a été supprimé. Tes anciennes contributions restent consultables sans identité personnelle liée.": [
    "Your account has been deleted. Your earlier contributions remain available without a linked personal identity.",
    "تم حذف حسابك. تبقى مساهماتك السابقة متاحة دون ربطها بهويتك الشخصية."
  ],
  "Connexion Google interrompue. Réessaie ou utilise ton e-mail.": [
    "Google sign-in was interrupted. Try again or use email.",
    "انقطع تسجيل الدخول عبر Google. حاول مجددًا أو استخدم بريدك الإلكتروني."
  ],
  "Google a annulé ou refusé la connexion. Vérifie que ton compte Google est autorisé comme utilisateur de test si l'application est en mode Test.": [
    "Google denied or cancelled the sign-in. If the OAuth app is in testing mode, check that your account is an allowed test user.",
    "رفض Google أو ألغى تسجيل الدخول. إذا كان التطبيق في وضع الاختبار، تحقق من إضافة حسابك إلى المستخدمين المسموح لهم."
  ],
  "Google ou Supabase a refusé l'autorisation. Vérifie le fournisseur Google, l'écran de consentement et ses URL de redirection.": [
    "Google or Supabase rejected authorization. Check your Google provider, consent screen and redirect URLs.",
    "رفض Google أو Supabase الترخيص. تحقق من إعداد Google وشاشة الموافقة وروابط إعادة التوجيه."
  ],
  "Le retour de Google ne contenait pas de code de connexion. Vérifie l'URL de rappel Supabase et les URL autorisées.": [
    "Google's callback did not include an authorization code. Check Supabase callback and allowed redirect URLs.",
    "لم تتضمن عودة Google رمز ترخيص. تحقق من عنوان العودة في Supabase والروابط المسموحة."
  ],
  "La configuration Supabase de cette application est incomplète.": [
    "The application's Supabase configuration is incomplete.",
    "إعداد Supabase لهذا التطبيق غير مكتمل."
  ],
  "La vérification de sécurité PKCE a échoué. Ouvre http://localhost:3000, utilise le même nom d'hôte durant la connexion et autorise les cookies.": [
    "PKCE verification failed. Use http://localhost:3000 consistently and allow browser cookies.",
    "فشل تحقق PKCE الأمني. استخدم http://localhost:3000 طوال عملية الدخول واسمح بملفات تعريف الارتباط."
  ],
  "Supabase n'a pas pu valider la connexion Google. Vérifie les URL de rappel, puis recommence depuis la page de connexion.": [
    "Supabase could not validate the Google sign-in. Check callback URLs and try again.",
    "لم يتمكن Supabase من التحقق من دخول Google. افحص روابط العودة وحاول من جديد."
  ],
  "Une erreur inattendue est survenue pendant la connexion Google. Consulte le terminal Next.js.": [
    "An unexpected Google sign-in error occurred. Check the Next.js server logs.",
    "حدث خطأ غير متوقع في دخول Google. راجع سجلات خادم Next.js."
  ],
  "Rôle :": [
    "Role:",
    "الدور:"
  ],
  "La base de données protège tes brouillons privés.": [
    "Your private drafts are protected by the database.",
    "تحمي قاعدة البيانات مسوداتك الخاصة."
  ],
  "Structures de données": [
    "Data structures",
    "هياكل البيانات"
  ],
  "Mathématiques": [
    "Mathematics",
    "الرياضيات"
  ],
  "Traitement": [
    "Processing",
    "المعالجة"
  ],
  "Algorithmes scolaires & Python": [
    "School algorithms & Python",
    "خوارزميات مدرسية وبايثون"
  ],
  "Retrouve les modules d'algorithmique selon ton niveau.": [
    "Browse algorithm modules for your level.",
    "تصفح وحدات الخوارزميات حسب مستواك."
  ],
  "Voir les cas de test": [
    "View test cases",
    "عرض حالات الاختبار"
  ]
});
export function tr(locale:Locale, french:string):string {
 if(locale==="fr")return french;
 if(extra[french])return extra[french][locale==="en"?0:1];
 return (locale==="en"?english:arabic)[french] ?? french;
}
