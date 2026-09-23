export type Lang = "en" | "hi" | "gu";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "gu", label: "ગુજરાતી" },
];

export function getInitialLang(): Lang {
  const s = localStorage.getItem("lang");
  return s === "hi" || s === "gu" ? s : "en";
}
