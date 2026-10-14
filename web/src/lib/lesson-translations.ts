import type { Algorithm } from "@/lib/catalog";
import type { Locale } from "@/lib/translations";

/** Translated teaching prose for the seven reviewed originals. Pseudocode and Python
 * remain unmodified: their grammar is educational source material, not UI. */
type LessonWords = { name:string;title:string;category:string;summary:string;principle:string;example:string;limits:string;sections:[string,string][];inputs:[string,string][] };
const translations:Record<"en"|"ar",Record<string,LessonWords>> = {
  "en": {
    "enregistrement": {
      "name": "RECORD",
      "title": "Named and typed values",
      "category": "Data structures",
      "summary": "Define named fields with values of different types.",
      "principle": "Associate each field with a name, type, and value, then group them together. In Python we represent this with a dictionary.",
      "example": "name = '3mor' · age = 17 · admitted = True",
      "limits": "Field names must be unique and valid. Demonstrated with a Python dictionary.",
      "sections": [
        [
          "Declare a record — TDNT and TDOG",
          "Fixed example with three fields. The playground also lets you add more fields."
        ],
        [
          "Fill the fields",
          ""
        ],
        [
          "Display the fields",
          ""
        ]
      ],
      "inputs": [
        [
          "Record fields",
          ""
        ]
      ]
    },
    "matrice": {
      "name": "MATRIX",
      "title": "Two-dimensional array",
      "category": "Data structures",
      "summary": "Fill and display a matrix of integers.",
      "principle": "A matrix is organized into rows and columns. Visit each cell using two indices.",
      "example": "[[1, 2, 3], [4, 5, 6]] → 2 rows × 3 columns",
      "limits": "Up to 10 × 10 cells to keep the display readable.",
      "sections": [
        [
          "Declare the matrix — TDNT and TDOG",
          ""
        ],
        [
          "Fill manually",
          ""
        ],
        [
          "Fill randomly",
          ""
        ],
        [
          "Display the cells",
          "This matrix lesson does not include sorting."
        ]
      ],
      "inputs": [
        [
          "Matrix values",
          "Use one row per line and separate integers with commas."
        ]
      ]
    },
    "pgcd": {
      "name": "GCD",
      "title": "Greatest common divisor",
      "category": "Mathematics",
      "summary": "Find the greatest common divisor of two integers.",
      "principle": "Subtract the smaller positive number from the larger until both values are equal.",
      "example": "GCD(48, 18) = 6",
      "limits": "Both integers must be strictly positive. This lesson uses repeated subtraction.",
      "sections": [
        [
          "GCD function by repeated subtraction",
          "Both integers must be strictly positive."
        ]
      ],
      "inputs": [
        [
          "First integer (a)",
          ""
        ],
        [
          "Second integer (b)",
          ""
        ]
      ]
    },
    "ppcm": {
      "name": "LCM",
      "title": "Least common multiple",
      "category": "Mathematics",
      "summary": "Find the least common multiple of two integers.",
      "principle": "Try consecutive multiples of the first number until one is divisible by the second.",
      "example": "LCM(12, 18) = 36",
      "limits": "Both integers must be strictly positive; inputs are bounded for responsive execution.",
      "sections": [
        [
          "LCM function by repeated addition",
          "Both integers must be strictly positive."
        ]
      ],
      "inputs": [
        [
          "First integer (a)",
          ""
        ],
        [
          "Second integer (b)",
          ""
        ]
      ]
    },
    "som-ch": {
      "name": "DIGIT SUM",
      "title": "Sum of digits",
      "category": "Processing",
      "summary": "Add all the digits of an integer.",
      "principle": "Convert the number into a string, iterate over its characters, and add their numeric values.",
      "example": "DIGIT_SUM(4825) = 19",
      "limits": "Non-negative integer with at most nine digits in this playground.",
      "sections": [
        [
          "Sum the digits of a number",
          "Convert to a string, then process one character at a time."
        ]
      ],
      "inputs": [
        [
          "Integer (n)",
          ""
        ]
      ]
    },
    "tableau": {
      "name": "ARRAY",
      "title": "Declare, fill, and display an array",
      "category": "Data structures",
      "summary": "Understand how to declare, fill and display an array.",
      "principle": "An array stores values of the same type, accessible by index. Declare it, fill its cells, then display them in order.",
      "example": "T = [8, 3, 11, 2, 5] ; T[0] = 8 ; n = 5",
      "limits": "Up to 40 integers to keep the playground easy to read.",
      "sections": [
        [
          "Declare an array — TDNT and TDOG",
          ""
        ],
        [
          "Fill manually",
          "T and n are declared in the first step."
        ],
        [
          "Fill randomly",
          ""
        ],
        [
          "Display the elements",
          ""
        ]
      ],
      "inputs": [
        [
          "Array elements",
          "Separate integers using commas."
        ]
      ]
    },
    "verif": {
      "name": "RANGE CHECK",
      "title": "Membership in an interval",
      "category": "Processing",
      "summary": "Check whether a number belongs to a closed interval.",
      "principle": "A number belongs to [min, max] exactly when min ≤ number ≤ max.",
      "example": "CHECK(7, 2, 10) = True",
      "limits": "Closed interval: both bounds are included. The minimum cannot exceed the maximum.",
      "sections": [
        [
          "Check a closed interval",
          "The function explicitly returns False when the check fails."
        ]
      ],
      "inputs": [
        [
          "Number to check",
          ""
        ],
        [
          "Minimum bound",
          ""
        ],
        [
          "Maximum bound",
          ""
        ]
      ]
    }
  },
  "ar": {
    "enregistrement": {
      "name": "التسجيل",
      "title": "قيم مسمّاة ومحدّدة الأنواع",
      "category": "هياكل البيانات",
      "summary": "تعريف حقول بأسماء وقيم من أنواع مختلفة.",
      "principle": "نربط بكل حقل اسمًا ونوعًا وقيمة ثم نجمع الحقول. في بايثون نمثّلها بقاموس.",
      "example": "الاسم = '3mor' · العمر = 17 · مقبول = صحيح",
      "limits": "يجب أن تكون أسماء الحقول فريدة وصحيحة. المثال يستخدم قاموس بايثون.",
      "sections": [
        [
          "تعريف سجل — TDNT وTDOG",
          "مثال ثابت بثلاثة حقول، ويمكنك إضافة حقول أخرى في الورشة."
        ],
        [
          "تعبئة الحقول",
          ""
        ],
        [
          "عرض الحقول",
          ""
        ]
      ],
      "inputs": [
        [
          "حقول السجل",
          ""
        ]
      ]
    },
    "matrice": {
      "name": "مصفوفة",
      "title": "جدول ثنائي الأبعاد",
      "category": "هياكل البيانات",
      "summary": "تعبئة مصفوفة من الأعداد الصحيحة وعرضها.",
      "principle": "تتكوّن المصفوفة من أسطر وأعمدة. نتنقّل بين خلاياها باستعمال مؤشّرين.",
      "example": "[[1, 2, 3], [4, 5, 6]] ← سطران × ثلاثة أعمدة",
      "limits": "الحد الأقصى 10 × 10 خلايا للحفاظ على وضوح العرض.",
      "sections": [
        [
          "تعريف المصفوفة — TDNT وTDOG",
          ""
        ],
        [
          "التعبئة يدويًا",
          ""
        ],
        [
          "التعبئة عشوائيًا",
          ""
        ],
        [
          "عرض الخلايا",
          "لا يتضمن هذا الدرس ترتيب المصفوفة."
        ]
      ],
      "inputs": [
        [
          "قيم المصفوفة",
          "اكتب سطرًا لكل صف وافصل الأعداد بفواصل."
        ]
      ]
    },
    "pgcd": {
      "name": "القاسم المشترك الأكبر",
      "title": "القاسم المشترك الأكبر",
      "category": "الرياضيات",
      "summary": "إيجاد أكبر قاسم مشترك لعددين صحيحين.",
      "principle": "نطرح العدد الأصغر من الأكبر مرارًا حتى تتساوى القيمتان.",
      "example": "PGCD(48, 18) = 6",
      "limits": "يجب أن يكون العددان موجبين تمامًا. تعتمد الطريقة على الطرح المتكرر.",
      "sections": [
        [
          "حساب القاسم المشترك الأكبر بالطرح المتكرر",
          "يجب أن يكون العددان موجبين تمامًا."
        ]
      ],
      "inputs": [
        [
          "العدد الأول (a)",
          ""
        ],
        [
          "العدد الثاني (b)",
          ""
        ]
      ]
    },
    "ppcm": {
      "name": "المضاعف المشترك الأصغر",
      "title": "المضاعف المشترك الأصغر",
      "category": "الرياضيات",
      "summary": "إيجاد أصغر مضاعف مشترك لعددين صحيحين.",
      "principle": "نختبر مضاعفات العدد الأول بالتتابع حتى نجد مضاعفًا يقبل القسمة على العدد الثاني.",
      "example": "PPCM(12, 18) = 36",
      "limits": "العددان موجبان تمامًا مع حدود على المدخلات لضمان سرعة التنفيذ.",
      "sections": [
        [
          "حساب المضاعف المشترك الأصغر بالجمع المتكرر",
          "يجب أن يكون العددان موجبين تمامًا."
        ]
      ],
      "inputs": [
        [
          "العدد الأول (a)",
          ""
        ],
        [
          "العدد الثاني (b)",
          ""
        ]
      ]
    },
    "som-ch": {
      "name": "مجموع الأرقام",
      "title": "مجموع أرقام عدد",
      "category": "معالجة البيانات",
      "summary": "حساب مجموع كل أرقام عدد صحيح.",
      "principle": "نحوّل العدد إلى سلسلة نصية ونمرّ على كل رمز ونجمع قيمته الرقمية.",
      "example": "SOM_CH(4825) = 19",
      "limits": "عدد صحيح غير سالب من تسعة أرقام على الأكثر في هذه الورشة.",
      "sections": [
        [
          "جمع أرقام عدد",
          "حوّل العدد إلى سلسلة نصية ثم عالج الرموز واحدًا تلو الآخر."
        ]
      ],
      "inputs": [
        [
          "العدد الصحيح (n)",
          ""
        ]
      ]
    },
    "tableau": {
      "name": "جدول",
      "title": "تعريف جدول وتعبئته وعرضه",
      "category": "هياكل البيانات",
      "summary": "فهم تعريف الجدول وتعبئته وعرض عناصره.",
      "principle": "يحتوي الجدول على قيم من النوع نفسه ويمكن الوصول إليها بالفهرس. نعرّفه ونملأ خاناته ثم نعرضها بالترتيب.",
      "example": "T = [8, 3, 11, 2, 5] ; T[0] = 8 ; n = 5",
      "limits": "حتى 40 عددًا صحيحًا للحفاظ على سهولة القراءة.",
      "sections": [
        [
          "تعريف الجدول — TDNT وTDOG",
          ""
        ],
        [
          "التعبئة يدويًا",
          "تم تعريف T وn في الخطوة الأولى."
        ],
        [
          "التعبئة عشوائيًا",
          ""
        ],
        [
          "عرض العناصر",
          ""
        ]
      ],
      "inputs": [
        [
          "عناصر الجدول",
          "افصل الأعداد بفواصل."
        ]
      ]
    },
    "verif": {
      "name": "التحقّق",
      "title": "الانتماء إلى مجال",
      "category": "معالجة البيانات",
      "summary": "التحقق مما إذا كان عدد ينتمي إلى مجال مغلق.",
      "principle": "ينتمي العدد إلى [min, max] إذا وفقط إذا تحقق min ≤ العدد ≤ max.",
      "example": "VERIF(7, 2, 10) = صحيح",
      "limits": "المجال مغلق: يشمل الحدّين. لا يمكن أن يتجاوز الحد الأدنى الحد الأقصى.",
      "sections": [
        [
          "التحقق من مجال مغلق",
          "تعيد الدالة False صراحةً عندما لا يتحقق الشرط."
        ]
      ],
      "inputs": [
        [
          "العدد المطلوب التحقق منه",
          ""
        ],
        [
          "الحد الأدنى",
          ""
        ],
        [
          "الحد الأقصى",
          ""
        ]
      ]
    }
  }
};
export function localizeLesson(item:Algorithm,locale:Locale):Algorithm {
 if(locale==="fr")return item;
 if(item.slug==="tableau-tri"){
   return {...item,
     name:item.name,
     title:locale==="en"?"Selection sort":"الترتيب بالاختيار",
     summary:locale==="en"?"Sort an array using selection sort in ascending or descending order.":"رتّب جدولًا بالاختيار تصاعديًا أو تنازليًا.",
     principle:locale==="en"?"On each pass, find the greatest remaining item and swap it into position. Reverse the result for ascending order.":"في كل دورة نجد أكبر عنصر متبقٍ ونبدّله مع العنصر الحالي، ثم نعكس النتيجة للترتيب التصاعدي.",
     limits:locale==="en"?"At most 40 integers. Selection sort takes quadratic time.":"حتى 40 عددًا صحيحًا. تتطلب طريقة الترتيب زمنًا تربيعيًا.",
     inputs:item.inputs.map((field,i)=>({...field,
       label:i===0?(locale==="en"?"Array elements":"عناصر الجدول"):(locale==="en"?"Sort order":"اتجاه الترتيب"),
       hint:i===0?(locale==="en"?"Separate integers using commas.":"افصل الأعداد بفواصل."):(locale==="en"?"Choose the sort direction.":"اختر اتجاه الترتيب.")
     })),
     code_sections:item.code_sections.map(sec=>({...sec,
       title:locale==="en"?"Selection sort — Base method":"الترتيب بالاختيار — طريقة Base",
       note:locale==="en"?"This method sorts from greatest to smallest. To sort directly in ascending order, replace > with < in the code.":"ترتب هذه الطريقة من الأكبر إلى الأصغر. للترتيب التصاعدي مباشرة، استبدل > بـ < في الكود."
     }))
   };
 }
 const x=translations[locale][item.slug];
 if(!x)return item;
 return {...item,name:item.name,title:x.title,category:x.category,summary:x.summary,
  principle:x.principle,example:x.example,limits:x.limits,
  code_sections:item.code_sections.map((s,i)=>({...s,title:x.sections[i]?.[0]??s.title,note:x.sections[i]?.[1]??s.note})),
  inputs:item.inputs.map((f,i)=>({...f,label:x.inputs[i]?.[0]??f.label,hint:x.inputs[i]?.[1]??f.hint}))};
}
export function isTranslatedLesson(item:Algorithm,locale:Locale):boolean {
 return locale==="fr" || item.slug==="tableau-tri" || Boolean(translations[locale][item.slug]);
}
