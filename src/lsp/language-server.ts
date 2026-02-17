/**
 * ════════════════════════════════════════════════════════════════════
 * FreeLang Language Server (LSP 3.16)
 *
 * Real-time IDE support for:
 * - VS Code
 * - WebStorm / IntelliJ
 * - Vim / Neovim (with coc.nvim)
 *
 * Features:
 * - Text document synchronization
 * - Hover information (type hints)
 * - Code completion (smart suggestions)
 * - Go to definition
 * - Find references
 * - Diagnostics (type errors, warnings)
 * ════════════════════════════════════════════════════════════════════
 */

import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  InitializeResult,
  ServerCapabilities,
  TextDocumentSyncKind,
  TextDocumentPositionParams,
  Hover,
  CompletionItem,
  CompletionItemKind,
  Location,
  Range,
  Position
} from 'vscode-languageserver';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { AIFirstTypeInferenceEngine } from '../analyzer/ai-first-type-inference-engine';
import { FreeLangAnalyzer } from '../analyzer';

/**
 * FreeLang LSP Server
 */
export class FreeLangLanguageServer {
  private connection = createConnection();
  private documents = new TextDocuments(TextDocument);
  private analyzer: FreeLangAnalyzer;
  private typeInference: AIFirstTypeInferenceEngine;
  private hasConfigurationCapability = false;
  private hasDiagnosticRelatedInformationCapability = false;

  constructor() {
    this.analyzer = new FreeLangAnalyzer();
    this.typeInference = new AIFirstTypeInferenceEngine();

    // Document changed event
    this.documents.onDidChangeContent((change) => {
      this.validateDocument(change.document);
    });

    // Document open event
    this.documents.onDidOpen((event) => {
      console.log(`Opened: ${event.document.uri}`);
    });

    // Hover provider
    this.connection.onHover((params) => this.onHover(params));

    // Completion provider
    this.connection.onCompletion((params) => this.onCompletion(params));

    // Definition provider
    this.connection.onDefinition((params) => this.onDefinition(params));

    // References provider
    this.connection.onReferences((params) => this.onReferences(params));

    // Initialize
    this.connection.onInitialize((params) => this.onInitialize(params));

    // Shutdown
    this.connection.onShutdown(() => this.onShutdown());

    // Text document lifecycle
    this.documents.listen(this.connection);
  }

  /**
   * Server initialization
   */
  private onInitialize(params: any): InitializeResult {
    this.hasConfigurationCapability = !!params.capabilities.workspace?.configuration;
    this.hasDiagnosticRelatedInformationCapability =
      !!params.capabilities.textDocument?.publishDiagnostics?.relatedInformation;

    const result: InitializeResult = {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Full,
        hoverProvider: true,
        completionProvider: {
          resolveProvider: false,
          triggerCharacters: ['.', ':', '<', '(', ' ']
        },
        definitionProvider: true,
        referencesProvider: true,
        workspaceSymbolProvider: false,
        documentFormattingProvider: false
      } as ServerCapabilities
    };

    return result;
  }

  /**
   * Hover: Display type information
   */
  private onHover(params: TextDocumentPositionParams): Hover | null {
    const document = this.documents.get(params.textDocument.uri);
    if (!document) return null;

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    try {
      // 1. Find variable/function name at position
      const word = this.getWordAtPosition(text, offset);
      if (!word) return null;

      // 2. Infer type
      const inferredType = this.typeInference.inferType(word, 'variable', undefined, text);

      if (!inferredType || !inferredType.type) {
        return null;
      }

      // 3. Build hover content
      const markdown = this.formatHoverContent(word, inferredType);

      return {
        contents: {
          kind: 'markdown',
          value: markdown
        }
      };
    } catch (e) {
      console.error(`Hover error: ${e}`);
      return null;
    }
  }

  /**
   * Completion: Smart code suggestions
   */
  private onCompletion(params: TextDocumentPositionParams): CompletionItem[] {
    const document = this.documents.get(params.textDocument.uri);
    if (!document) return [];

    const position = params.position;
    const text = document.getText();
    const line = document.getText(
      Range.create(Position.create(position.line, 0), position)
    );

    const completions: CompletionItem[] = [];

    try {
      // 1. Get context (what's being typed)
      const context = line.trim();

      // 2. Generic types
      if (context.includes('<')) {
        completions.push(
          { label: 'T', kind: CompletionItemKind.TypeParameter, detail: 'Type variable' },
          { label: 'K', kind: CompletionItemKind.TypeParameter, detail: 'Key type' },
          { label: 'V', kind: CompletionItemKind.TypeParameter, detail: 'Value type' }
        );
      }

      // 3. Keywords
      const keywords = [
        'trait', 'impl', 'fn', 'let', 'if', 'else', 'while', 'for', 'return',
        'extends', 'where', 'type', 'interface', 'class', 'enum'
      ];

      for (const keyword of keywords) {
        if (keyword.startsWith(context.slice(-2))) {
          completions.push({
            label: keyword,
            kind: CompletionItemKind.Keyword,
            detail: 'FreeLang keyword'
          });
        }
      }

      // 4. Type constructors
      if (context.endsWith(':') || context.endsWith('<')) {
        const types = [
          { label: 'number', kind: CompletionItemKind.TypeParameter },
          { label: 'string', kind: CompletionItemKind.TypeParameter },
          { label: 'boolean', kind: CompletionItemKind.TypeParameter },
          { label: 'array<T>', kind: CompletionItemKind.TypeParameter },
          { label: 'Map<K,V>', kind: CompletionItemKind.TypeParameter },
          { label: 'Set<T>', kind: CompletionItemKind.TypeParameter },
          { label: 'Option<T>', kind: CompletionItemKind.TypeParameter }
        ];
        completions.push(...types);
      }

      // 5. Common patterns
      if (context.endsWith('(')) {
        completions.push({
          label: 'param: Type',
          kind: CompletionItemKind.Snippet,
          insertText: 'param: ${1:Type}'
        });
      }

      return completions;
    } catch (e) {
      console.error(`Completion error: ${e}`);
      return [];
    }
  }

  /**
   * Definition: Go to definition
   */
  private onDefinition(params: TextDocumentPositionParams): Location[] | null {
    const document = this.documents.get(params.textDocument.uri);
    if (!document) return null;

    const text = document.getText();
    const position = params.position;
    const offset = document.offsetAt(position);

    try {
      const word = this.getWordAtPosition(text, offset);
      if (!word) return null;

      // Find definition in same file
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const regex = new RegExp(`(?:fn|let|trait|type)\\s+${word}\\b`);
        if (regex.test(line)) {
          const column = line.indexOf(word);
          return [
            {
              uri: document.uri,
              range: Range.create(Position.create(i, column), Position.create(i, column + word.length))
            }
          ];
        }
      }

      return null;
    } catch (e) {
      console.error(`Definition error: ${e}`);
      return null;
    }
  }

  /**
   * References: Find all usages
   */
  private onReferences(params: TextDocumentPositionParams & { context: { includeDeclaration: boolean } }): Location[] {
    const document = this.documents.get(params.textDocument.uri);
    if (!document) return [];

    const text = document.getText();
    const position = params.position;
    const offset = document.offsetAt(position);

    try {
      const word = this.getWordAtPosition(text, offset);
      if (!word) return [];

      const locations: Location[] = [];
      const lines = text.split('\n');
      const regex = new RegExp(`\\b${word}\\b`, 'g');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match;
        while ((match = regex.exec(line)) !== null) {
          locations.push({
            uri: document.uri,
            range: Range.create(
              Position.create(i, match.index),
              Position.create(i, match.index + word.length)
            )
          });
        }
      }

      return locations;
    } catch (e) {
      console.error(`References error: ${e}`);
      return [];
    }
  }

  /**
   * Validate document and send diagnostics
   */
  private validateDocument(document: TextDocument): void {
    const text = document.getText();
    const diagnostics: Diagnostic[] = [];

    try {
      // Type checking
      const typeErrors = this.analyzer.validateTypes(text);
      for (const error of typeErrors) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: error.range,
          message: error.message,
          source: 'FreeLang Type Checker'
        });
      }

      // Syntax checking
      const syntaxErrors = this.analyzer.validateSyntax(text);
      for (const error of syntaxErrors) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: error.range,
          message: error.message,
          source: 'FreeLang Syntax'
        });
      }

      // Send diagnostics
      this.connection.sendDiagnostics({ uri: document.uri, diagnostics });
    } catch (e) {
      console.error(`Validation error: ${e}`);
    }
  }

  /**
   * Utility: Get word at position
   */
  private getWordAtPosition(text: string, offset: number): string | null {
    const start = Math.max(0, offset - 30);
    const end = Math.min(text.length, offset + 30);
    const context = text.substring(start, end);

    const match = context.match(/\b(\w+)\b/);
    return match ? match[1] : null;
  }

  /**
   * Format hover content
   */
  private formatHoverContent(name: string, inferredType: any): string {
    const type = inferredType.type || 'unknown';
    const confidence = ((inferredType.confidence || 0) * 100).toFixed(0);

    return `## ${name}
\`\`\`
${type}
\`\`\`

**Confidence**: ${confidence}%
**Sources**: ${(inferredType.sources || []).join(', ') || 'N/A'}
`;
  }

  /**
   * Shutdown
   */
  private onShutdown(): void {
    console.log('FreeLang LSP Server shutting down');
  }

  /**
   * Start server
   */
  start(): void {
    this.connection.listen();
    console.log('FreeLang LSP Server started');
  }
}

/**
 * Main entry point
 */
export async function startLanguageServer(): Promise<void> {
  const server = new FreeLangLanguageServer();
  server.start();

  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

// Start if called directly
if (require.main === module) {
  startLanguageServer().catch(console.error);
}
