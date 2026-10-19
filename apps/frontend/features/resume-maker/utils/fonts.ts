export const fonts = [
  "Arial",
  "Calibri",
  "Cambria",
  "Georgia",
  "Times New Roman",
  "Garamond",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Courier New",
  "Open Sans",
  "Lato",
  "Roboto",
  "Merriweather",
  "Lora",
  "Source Sans 3",
];
const loaders: Record<string, () => Promise<unknown>> = {
  "Open Sans": () => import("@fontsource/open-sans/400.css"),
  Lato: () => import("@fontsource/lato/400.css"),
  Roboto: () => import("@fontsource/roboto/400.css"),
  Merriweather: () => import("@fontsource/merriweather/400.css"),
  Lora: () => import("@fontsource/lora/400.css"),
  "Source Sans 3": () => import("@fontsource/source-sans-3/400.css"),
};
const loaded = new Map<string, Promise<unknown>>();
export async function loadFont(font: string) {
  if (!loaded.has(font))
    loaded.set(font, loaders[font] ? loaders[font]() : Promise.resolve());
  await loaded.get(font);
  await document.fonts.ready;
}
