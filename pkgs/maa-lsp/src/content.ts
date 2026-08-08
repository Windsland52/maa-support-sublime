import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { type TextDocument } from 'vscode-languageserver-textdocument'
import { type TextDocuments } from 'vscode-languageserver/node.js'
import { URI } from 'vscode-uri'

import {
  FsContentWatcher,
  type IContentLoader,
  type IContentWatcher,
  type IContentWatcherController,
  type IContentWatcherDelegate
} from '@nekosu/maa-pipeline-manager'

function normalizeFile(file: string): string {
  const normalized = path.normalize(file)
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized
}

function documentFile(document: TextDocument): string | null {
  try {
    return URI.parse(document.uri).fsPath
  } catch {
    return null
  }
}

function matchesRoot(root: string, isFile: boolean, file: string): boolean {
  if (isFile) {
    return normalizeFile(root) === normalizeFile(file)
  }
  const relative = path.relative(root, file)
  return (
    relative === '' ||
    (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`))
  )
}

export class LspContentLoader implements IContentLoader {
  constructor(private readonly documents: TextDocuments<TextDocument>) {}

  async get(file: string): Promise<string | null> {
    const expected = normalizeFile(file)
    const open = this.documents
      .all()
      .find(document => normalizeFile(documentFile(document) ?? '') === expected)
    if (open) {
      return open.getText()
    }
    try {
      return await fs.readFile(file, 'utf8')
    } catch {
      return null
    }
  }
}

export class LspContentWatcher extends FsContentWatcher implements IContentWatcher {
  constructor(private readonly documents: TextDocuments<TextDocument>) {
    super()
  }

  override async watch(
    root: string,
    isFile: boolean,
    delegate: IContentWatcherDelegate
  ): Promise<IContentWatcherController> {
    const changed = this.documents.onDidChangeContent(event => {
      const file = documentFile(event.document)
      if (file && matchesRoot(root, isFile, file)) {
        delegate.fileChanged(file)
      }
    })
    const closed = this.documents.onDidClose(event => {
      const file = documentFile(event.document)
      if (file && matchesRoot(root, isFile, file)) {
        delegate.fileChanged(file)
      }
    })
    const watcher = await super.watch(root, isFile, delegate)

    return {
      stop() {
        watcher.stop()
        changed.dispose()
        closed.dispose()
      }
    }
  }
}
