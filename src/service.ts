import { createGenerator } from "@unocss/core";
import { createAutocomplete, searchUsageBoundary } from "@unocss/autocomplete";
import preserUno from "@unocss/preset-uno";
import { loadConfig } from "@unocss/config";
import { sourcePluginFactory, sourceObjectFields } from "unconfig/presets";
import type { CompletionItem } from "vscode-languageserver";
import { getMatchedPositionsFromCode } from "./share-common.js";
import { getColorString } from "./utils.js";

const defaultConfig = {
  presets: [preserUno()],
  separators: [],
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

export const documentColor = async (content: string, id: string) => {
  const pos = await getMatchedPositionsFromCode(generator, content, id);
  const ret = (
    await Promise.all(
      pos.map(async (p) => {
        const [start, end, text] = p;
        const css = (
          await generator.generate(text, {
            preflights: false,
            safelist: false,
          })
        ).css;
        console.log(css);

        const color = getColorString(css);
        if (color) {
          return {
            range: { start, end },
            color,
          };
        } else {
          return;
        }
      }),
    )
  ).filter((p) => !!p);
  return ret;
};

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
