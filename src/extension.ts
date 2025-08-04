import * as path from 'path'

import * as vscode from 'vscode'

class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
  private readonly context: vscode.ExtensionContext
  private updateInProgress = false

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new MarkdownEditorProvider(context)
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      'editor-markdown-notes.markdownEditor',
      provider
    )
    return providerRegistration
  }

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Set up the webview options
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'dist')),
        vscode.Uri.file(path.join(this.context.extensionPath, 'out')),
      ],
    }

    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      document
    )

    // Update the webview when the document changes (but not during our own saves)
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (
          e.document.uri.toString() === document.uri.toString() &&
          !this.updateInProgress
        ) {
          this.updateWebview(webviewPanel, document)
        }
      }
    )

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'save':
          await this.saveDocument(document, message.content)
          break
        case 'getContent':
          this.updateWebview(webviewPanel, document)
          break
      }
    })

    // Clean up subscriptions when the panel is disposed
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose()
    })
  }

  private getHtmlForWebview(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): string {
    const distPath = path.join(this.context.extensionPath, 'dist')
    const assetsPath = path.join(distPath, 'assets')

    // Find the actual built file names (they have content hashes)
    const fs = require('fs')
    let jsFile = ''
    let cssFile = ''

    try {
      const assetFiles = fs.readdirSync(assetsPath)
      jsFile =
        assetFiles.find(
          (file: string) => file.startsWith('index-') && file.endsWith('.js')
        ) || ''
      cssFile =
        assetFiles.find(
          (file: string) => file.startsWith('index-') && file.endsWith('.css')
        ) || ''
    } catch (error) {
      console.error('Failed to read assets directory:', error)
    }

    const jsUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(assetsPath, jsFile))
    )
    const cssUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(assetsPath, cssFile))
    )

    // Generate nonce for CSP
    const nonce = getNonce()

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource} data:; connect-src ${webview.cspSource};">
        <title>Markdown Editor</title>
        <link rel="stylesheet" crossorigin href="${cssUri}">
        <style>
            body, html {
                margin: 0;
                padding: 0;
                height: 100vh;
            }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script nonce="${nonce}">
            window.vscode = acquireVsCodeApi();
            window.initialContent = ${JSON.stringify(document.getText())};
            window.fileName = ${JSON.stringify(path.basename(document.fileName))};
        </script>
        <script type="module" crossorigin src="${jsUri}" nonce="${nonce}"></script>
    </body>
    </html>`
  }

  private updateWebview(
    panel: vscode.WebviewPanel,
    document: vscode.TextDocument
  ) {
    panel.webview.postMessage({
      type: 'update',
      content: document.getText(),
      fileName: path.basename(document.fileName),
    })
  }

  private async saveDocument(document: vscode.TextDocument, content: string) {
    // Prevent update loop
    this.updateInProgress = true

    try {
      const edit = new vscode.WorkspaceEdit()

      // Replace the entire document content
      edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        content
      )

      await vscode.workspace.applyEdit(edit)

      // Save the document to persist changes
      await document.save()
    } finally {
      // Reset flag after a brief delay to ensure all events have processed
      setTimeout(() => {
        this.updateInProgress = false
      }, 100)
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Markdown Editor extension is now active!')

  // Register the custom editor provider
  context.subscriptions.push(MarkdownEditorProvider.register(context))

  // Register the command to open markdown files with our editor
  const openEditorCommand = vscode.commands.registerCommand(
    'editor-markdown-notes.openMarkdownEditor',
    (uri?: vscode.Uri) => {
      // If no URI is passed, try to get the active editor's URI
      if (!uri) {
        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
          uri = activeEditor.document.uri
        } else {
          vscode.window.showErrorMessage('No markdown file selected')
          return
        }
      }

      console.log('Opening markdown editor for:', uri.toString())
      vscode.commands.executeCommand(
        'vscode.openWith',
        uri,
        'editor-markdown-notes.markdownEditor'
      )
    }
  )

  context.subscriptions.push(openEditorCommand)
}

function getNonce() {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

// This method is called when your extension is deactivated
export function deactivate() {}
