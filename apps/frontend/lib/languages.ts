export const LANGUAGES = [
  { code: "en", label: "English", name: "English", dir: "ltr" },
  { code: "ar", label: "العربية", name: "Arabic", dir: "rtl" },
  { code: "ur", label: "اردو", name: "Urdu", dir: "rtl" },
  { code: "de", label: "Deutsch", name: "German", dir: "ltr" },
  { code: "es", label: "Español", name: "Spanish", dir: "ltr" },
  { code: "it", label: "Italiano", name: "Italian", dir: "ltr" },
  { code: "zh", label: "中文", name: "Chinese (Simplified)", dir: "ltr" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
export const RESUME_LANGUAGES = LANGUAGES;

const messages: Record<LanguageCode, Record<string, string>> = {
  en: {},
  ar: { Home: "الرئيسية", "My Resumes": "سيرتي الذاتية", Templates: "القوالب", Persona: "الشخصيات", Settings: "الإعدادات", "Log out": "تسجيل الخروج", "Resume Builder": "منشئ السيرة الذاتية", "Your career workspace": "مساحة عملك المهنية", "App language": "لغة التطبيق", "Resume language": "لغة السيرة الذاتية", "Language preferences": "تفضيلات اللغة", "Account profile": "ملف الحساب", "Create a focused first draft": "أنشئ مسودة أولى مخصصة", "Download PDF": "تنزيل PDF", "Create your resume": "أنشئ سيرتك الذاتية", "Create a resume": "إنشاء سيرة ذاتية", "Your resumes": "سيرك الذاتية", "Choose a template": "اختر قالبًا", "Profile": "الملف الشخصي", "Security": "الأمان", "Package": "الباقة" },
  ur: { Home: "صفحۂ اول", "My Resumes": "میرے ریزیومے", Templates: "ٹیمپلیٹس", Persona: "پروفائل", Settings: "ترتیبات", "Log out": "لاگ آؤٹ", "Resume Builder": "ریزیومے بنانے والا", "Your career workspace": "آپ کی پیشہ ورانہ جگہ", "App language": "ایپ کی زبان", "Resume language": "ریزیومے کی زبان", "Language preferences": "زبان کی ترجیحات", "Account profile": "اکاؤنٹ پروفائل", "Create a focused first draft": "پہلا مسودہ بنائیں", "Download PDF": "PDF ڈاؤن لوڈ کریں", "Create your resume": "اپنا ریزیومے بنائیں", "Create a resume": "ریزیومے بنائیں", "Your resumes": "آپ کے ریزیومے", "Choose a template": "ٹیمپلیٹ منتخب کریں", "Profile": "پروفائل", "Security": "سیکیورٹی", "Package": "پیکیج" },
  de: { Home: "Startseite", "My Resumes": "Meine Lebensläufe", Templates: "Vorlagen", Persona: "Profil", Settings: "Einstellungen", "Log out": "Abmelden", "Resume Builder": "Lebenslauf-Generator", "Your career workspace": "Ihr Karrierebereich", "App language": "App-Sprache", "Resume language": "Sprache des Lebenslaufs", "Language preferences": "Spracheinstellungen", "Account profile": "Kontoprofil", "Create a focused first draft": "Einen gezielten ersten Entwurf erstellen", "Download PDF": "PDF herunterladen", "Create your resume": "Lebenslauf erstellen", "Create a resume": "Lebenslauf erstellen", "Your resumes": "Meine Lebensläufe", "Choose a template": "Vorlage auswählen", Profile: "Profil", Security: "Sicherheit", Package: "Paket" },
  es: { Home: "Inicio", "My Resumes": "Mis currículums", Templates: "Plantillas", Persona: "Perfil", Settings: "Configuración", "Log out": "Cerrar sesión", "Resume Builder": "Creador de currículums", "Your career workspace": "Tu espacio profesional", "App language": "Idioma de la aplicación", "Resume language": "Idioma del currículum", "Language preferences": "Preferencias de idioma", "Account profile": "Perfil de la cuenta", "Create a focused first draft": "Crea un primer borrador enfocado", "Download PDF": "Descargar PDF", "Create your resume": "Crea tu currículum", "Create a resume": "Crear un currículum", "Your resumes": "Tus currículums", "Choose a template": "Elige una plantilla", Profile: "Perfil", Security: "Seguridad", Package: "Paquete" },
  it: { Home: "Home", "My Resumes": "I miei curriculum", Templates: "Modelli", Persona: "Profilo", Settings: "Impostazioni", "Log out": "Esci", "Resume Builder": "Crea curriculum", "Your career workspace": "Il tuo spazio professionale", "App language": "Lingua dell'app", "Resume language": "Lingua del curriculum", "Language preferences": "Preferenze lingua", "Account profile": "Profilo account", "Create a focused first draft": "Crea una prima bozza mirata", "Download PDF": "Scarica PDF", "Create your resume": "Crea il tuo curriculum", "Create a resume": "Crea un curriculum", "Your resumes": "I tuoi curriculum", "Choose a template": "Scegli un modello", Profile: "Profilo", Security: "Sicurezza", Package: "Piano" },
  zh: { Home: "首页", "My Resumes": "我的简历", Templates: "模板", Persona: "个人资料", Settings: "设置", "Log out": "退出登录", "Resume Builder": "简历制作工具", "Your career workspace": "您的职业工作区", "App language": "应用语言", "Resume language": "简历语言", "Language preferences": "语言偏好", "Account profile": "账户资料", "Create a focused first draft": "创建有针对性的初稿", "Download PDF": "下载 PDF", "Create your resume": "创建您的简历", "Create a resume": "创建简历", "Your resumes": "我的简历", "Choose a template": "选择模板", Profile: "个人资料", Security: "安全", Package: "套餐" },
};

export function translate(code: LanguageCode, message: string): string {
  return messages[code][message] || message;
}
