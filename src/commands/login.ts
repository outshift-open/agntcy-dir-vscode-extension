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
import { DirectoryFactory } from "../clients/directory/DirectoryFactory";

export function login(context: vscode.ExtensionContext) {
  return async () => {
    const config = vscode.workspace.getConfiguration("agntcy.agent-directory");
    const directoryURL = config.get<string>("directoryURL");

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Logging in to " + directoryURL,
        cancellable: true,
      },
      async (progress, token) => {
        try {
          token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
          });
          const directory = DirectoryFactory.getInstance();
          const output = await directory.login();
          vscode.window.showInformationMessage(output.trim());
          vscode.commands.executeCommand(
            "setContext",
            "agent-directory.isLogged",
            true
          );

          context.workspaceState.update("agent-directory.selectedOrganization", null);
          progress.report({ increment: 100, message: "Completed!" });
        } catch (err: any) {
          vscode.window.showErrorMessage(
            "dirctl login failed: " + (err?.toString() || "Unknown error")
          );
        }
      }
    );
    vscode.commands.executeCommand("agent-directory.refresh-auth-view");
  };
}

export function logout(context: vscode.ExtensionContext) {
  return async () => {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Logging out",
        cancellable: true,
      },
      async (progress, token) => {
        try {
          token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
          });
          const directory = DirectoryFactory.getInstance();
          const output = await directory.logout();
          vscode.window.showInformationMessage(output.trim());
          vscode.commands.executeCommand(
            "setContext",
            "agent-directory.isLogged",
            false
          );
          progress.report({ increment: 100, message: "Completed!" });
        } catch (err: any) {
          vscode.window.showErrorMessage(
            "dirctl logout failed: " + (err?.toString() || "Unknown error")
          );
        }
      }
    );
    vscode.commands.executeCommand("agent-directory.refresh-auth-view");
  };
}
