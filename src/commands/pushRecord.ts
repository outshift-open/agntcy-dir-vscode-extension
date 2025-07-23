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

export function pushRecord() {
  return async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found.");
      return;
    }
    const oasfRecordContent = editor.document.getText();
    const oasfRecord: OASFRecord = JSON.parse(oasfRecordContent) as OASFRecord;

    try {
      const directory = DirectoryFactory.getInstance();
      const output = await directory.push(oasfRecord);
      vscode.window.showInformationMessage("Pushed new record: " + output.trim());
    } catch (error) {
      vscode.window.showErrorMessage("Failed to push record: " + error);
    }
  };
}
