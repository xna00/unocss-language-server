import { createGenerator } from "@unocss/core";
import { createAutocomplete, searchUsageBoundary } from "@unocss/autocomplete";
import preserUno from "@unocss/preset-uno";
import { CompletionItem } from "vscode-languageserver";

const generator = createGenerator(
  {},
  {
    presets: [preserUno()],
  }
);
const autocomplete = createAutocomplete(generator);

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
