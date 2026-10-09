const names = [
  ["Black", "مشکی"], ["White", "سفید"], ["Blue", "آبی"], ["Sky blue", "آبی آسمانی"],
  ["Green", "سبز"], ["Pistachio green", "سبز پسته ای"], ["Navy", "سرمه ای"],
  ["Gray", "طوسی"], ["Dark gray", "طوسی تیره"], ["Light gray", "طوسی روشن"],
  ["Red", "قرمز"], ["Yellow", "زرد"], ["Brown", "قهوه ای"], ["Cream", "کرم"],
  ["Khaki", "خاکی"], ["Coffee", "نسکافه ای"], ["Beige", "بژ"], ["Pink", "صورتی"],
  ["Purple", "بنفش"], ["Orange", "نارنجی"],
];
const key = value => String(value || "").trim().toLowerCase()
  .replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\u200c/g, " ").replace(/\s+/g, " ");
const translations = new Map(names.flatMap(pair => pair.map(name => [key(name), pair])));
translations.set("grey", ["Gray", "طوسی"]);
translations.set("خاکستری", ["Gray", "طوسی"]);

// Translate presentation only: filter values and variant identities stay intact.
export function colorDisplayName(color, language = "english") {
  const raw = typeof color === "string" ? color : color?.label || color?.labelFa || "";
  const translated = translations.get(key(raw));
  if (language === "farsi") return color?.labelFa || translated?.[1] || raw;
  return color?.labelEn || translated?.[0] || raw;
}
