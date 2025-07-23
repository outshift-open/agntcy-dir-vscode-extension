// Copyright © 2025 Cisco Systems, Inc. and its affiliates.
// All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import * as vscode from "vscode";
import * as path from 'path';
import { TextEncoder } from 'util';

export async function newEditorWithContent(fileName: string, content: string, languageId?: string) {
  const newFileUri = vscode.Uri.parse(`untitled:${fileName}`);
  return vscode.workspace.openTextDocument(newFileUri).then(async document => {
    if (languageId) {
      vscode.languages.setTextDocumentLanguage(document, languageId);
    }
    const editor = await vscode.window.showTextDocument(document);
    return await editor.edit(editBuilder => {
      editBuilder.insert(new vscode.Position(0, 0), content);
    });
  });
}

export async function saveAndOpenFile(directoryPath: string, fileName: string, content: string): Promise<void> {
  console.log('Saving file to:', path.join(directoryPath, fileName));
  try {
    const filePath = path.join(directoryPath, fileName);
    const fileUri = vscode.Uri.file(filePath);

    const contentBytes = new TextEncoder().encode(content);
    await vscode.workspace.fs.writeFile(fileUri, contentBytes);

    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);

  } catch (error) {
    console.error('Failed to save file:', error);
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to save file: ${message}`);
  }
}
