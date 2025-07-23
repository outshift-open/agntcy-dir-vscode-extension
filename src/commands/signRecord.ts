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
import { OASFRecord } from "../model/oasfRecord-0.6.0";
import { DirectoryFactory } from "../clients/directory/DirectoryFactory";

export function signRecord() {
  return async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found.");
      return;
    }

    const oasfRecordContent = editor.document.getText();
    const oasfRecord = JSON.parse(oasfRecordContent) as OASFRecord;

    let signedOutput = '';
    try {
      const directory = DirectoryFactory.getInstance();
      signedOutput = await directory.sign(oasfRecord);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to sign record '${oasfRecord.name}': ${error}`);
      return;
    }
    await editor.edit(editBuilder => {
      const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
      const fullDocumentRange = new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
      editBuilder.replace(fullDocumentRange, signedOutput);
    });
    vscode.window.showInformationMessage(`Record '${oasfRecord.name}' signed, and content updated`);
  };
}
