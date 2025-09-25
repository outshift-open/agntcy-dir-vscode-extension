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

export async function browseForDirctlBinary() {
  const options: vscode.OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Select dirctl binary",
    filters: {
      "All files": ["*"],
    },
  };

  const fileUri = await vscode.window.showOpenDialog(options);

  if (fileUri && fileUri[0]) {
    const config = vscode.workspace.getConfiguration("agntcy.agent-directory");
    await config.update("dirctlBinary", fileUri[0].fsPath, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`dirctl binary path set to: ${fileUri[0].fsPath}`);
    vscode.commands.executeCommand("workbench.action.openSettings", "agntcy.agent-directory");
  }
}
