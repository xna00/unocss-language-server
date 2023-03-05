import { createGenerator } from "@unocss/core";
import { createAutocomplete, searchUsageBoundary } from "@unocss/autocomplete";
import preserUno from "@unocss/preset-uno";
import { loadConfig } from "@unocss/config";
import { sourcePluginFactory, sourceObjectFields } from "unconfig/presets";
import { CompletionItem } from "vscode-languageserver";

const defaultConfig = {
  presets: [preserUno()],
  separators: []
};

const generator = createGenerator({}, defaultConfig);
let autocomplete = createAutocomplete(generator);

export function resolveConfig(roorDir: string) {
  return loadConfig(process.cwd(), roorDir, [
    sourcePluginFactory({
      files: ["vite.config", "svelte.config", "iles.config"],
      targetModule: "unocss/vite",
      parameters: [{ command: "serve", mode: "development" }],
    }),
    sourcePluginFactory({
      files: ["astro.config"],
      targetModule: "unocss/astro",
    }),
    sourceObjectFields({
      files: "nuxt.config",
      fields: "unocss",
    }),
  ]).then((result) => {
    generator.setConfig(result.config, defaultConfig);
    autocomplete = createAutocomplete(generator);
    return generator.config;
  });
}

export function getComplete(content: string, cursor: number) {
  return autocomplete.suggestInFile(content, cursor);
}

export function resolveCSS(item: CompletionItem) {
  return generator.generate(item.label, {
    preflights: false,
    safelist: false,
  });
}

export function resolveCSSByOffset(content: string, cursor: number) {
  return generator.generate(searchUsageBoundary(content, cursor).content, {
    preflights: false,
    safelist: false,
  });
}
