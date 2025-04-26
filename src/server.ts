import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  Range,
  Hover,
  MarkupKind,
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  documentColor,
  getComplete,
  resolveCSS,
  resolveCSSByOffset,
  resolveConfig,
} from './service.js';
import { SuggestResult } from '@unocss/core';

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );

  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
      },
      hoverProvider: true,
      documentHighlightProvider: false,
      colorProvider: true,
    },
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }

  let rootDir = '';

  // check for the worspace capability and if the workspace folders are available
  if (hasWorkspaceFolderCapability && params.workspaceFolders && params.workspaceFolders[0]) {
    rootDir = params.workspaceFolders[0].uri || params.workspaceFolders[0].name;
  }

  // otherwise we'll check for rootUri
  if (!rootDir && params.rootUri) {
    rootDir = params.rootUri;
  }

  if (rootDir) {
    resolveConfig(rootDir);
  }

  return result;
});

connection.console.log('unocss: before add onCompletion listener');
connection.onCompletion(
  async (
    _textDocumentPosition: TextDocumentPositionParams
  ): Promise<CompletionItem[]> => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    connection.console.log('unocss: onCompletion start');
    await new Promise((resolve) => setTimeout(resolve, 500));

    const doc = documents.get(_textDocumentPosition.textDocument.uri);
    const content = doc?.getText();
    const cursor = doc?.offsetAt(_textDocumentPosition.position);
    connection.console.log('unocss: onCompletion get content and cursor');

    if (!content || cursor === undefined) {
      return [];
    }
    let result: SuggestResult;
    try {
      result = await getComplete(content, cursor);
    } catch (e) {
      connection.console.log('unocss:' + e.message + e.stack);
    }
    connection.console.log('unocss: onCompletion getComplete');

    if (!result) {
      return [];
    }

    const ret = result.suggestions.map((s, i) => {
      const resolved = result.resolveReplacement(s[0]);
      return {
        label: s[0],
        kind: CompletionItemKind.Constant,
        data: i,
        textEdit: {
          newText: resolved.replacement,
          range: Range.create(
            doc.positionAt(resolved.start),
            doc.positionAt(resolved.end)
          ),
        },
      };
    });

    connection.console.log('unocss: onCompletion return');
    return ret;
  }
);
connection.console.log('unocss: after add listener');

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
  async (item: CompletionItem): Promise<CompletionItem> => {
    const result = await resolveCSS(item);
    const css = result.css;
    item.documentation = {
      value: `\`\`\`css\n${css}\n\`\`\``,
      kind: MarkupKind.Markdown,
    };
    return item;
  }
);

connection.onHover(async (params): Promise<Hover> => {
  const doc = documents.get(params.textDocument.uri);
  const content = doc?.getText();
  const cursor = doc?.offsetAt(params.position);
  const css = (await resolveCSSByOffset(content, cursor)).css;
  return {
    contents: css && `\`\`\`css\n${css}\n\`\`\``,
  };
});

connection.onDocumentColor(async (args) => {
  const uri = args.textDocument.uri;
  const doc = documents.get(uri);
  const colors = await documentColor(doc.getText(), uri);
  return colors.map((c) => {
    return {
      color: c.color,
      range: {
        start: doc.positionAt(c.range.start),
        end: doc.positionAt(c.range.end),
      },
    };
  });
});

documents.listen(connection);
connection.listen();
