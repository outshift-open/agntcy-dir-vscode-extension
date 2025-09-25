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
import { login as loginCmd, logout as logoutCmd } from "./commands/login";
import { openRecord } from "./commands/openRecord";
import { importMCPServer } from "./commands/importMCPServer";
import { pushRecord } from "./commands/pushRecord";
import { signRecord } from "./commands/signRecord";
import { selectOrganization } from "./commands/selectOrganization";
import { SettingsProvider } from "./providers/SettingsProvider";
import { RecordListProvider } from "./providers/RecordListProvider";
import { openChatModeCommand, convertChatModeToOASFCommand, convertOASFToChatModeCommand } from "./commands/importCopilotChatMode";
import { ADRestClient } from "./clients/ADRestClient";
import { browseForDirctlBinary } from "./commands/browseDirctlBinary";
import { ensureDirctlIsInstalled } from "./clients/DirctlDownloader";

export async function activate(context: vscode.ExtensionContext) {
  const dirctlPath = await ensureDirctlIsInstalled(context);
  if (!dirctlPath) {
    return;
  }

  let adRestClient = new ADRestClient();

  const configChangeListener = vscode.workspace.onDidChangeConfiguration(async (e) => {
    if (e.affectsConfiguration("agntcy.agent-directory.directoryURL")) {
      settingsProvider.refresh();
    }
  });
  context.subscriptions.push(configChangeListener);

  const settingsProvider = new SettingsProvider(context.extensionUri, context);
  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.refresh-auth-view", async () => { await settingsProvider.refresh(); }));

  const agentListProvider = new RecordListProvider(context.extensionUri, context);

  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.browseDirctlBinary", browseForDirctlBinary));
  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.login", loginCmd(context)));
  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.logout", logoutCmd(context)));
  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.selectOrganization", async () => {
    await selectOrganization(context, adRestClient);
  }));

  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.searchRecords", async () => { await agentListProvider.updateListOfRecords(); }));

  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.openRecord", openRecord()));
  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.saveAndOpenAsCopilotChatMode", openChatModeCommand(context)));
  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.importAsMCPServer", importMCPServer()));

  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.convertChatModeToOASF", convertChatModeToOASFCommand()));
  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.convertOASFToChatMode", convertOASFToChatModeCommand()));
  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.pushRecord", pushRecord()));
  context.subscriptions.push(vscode.commands.registerCommand("agent-directory.signRecord", signRecord()));

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      RecordListProvider.viewType,
      agentListProvider
    )
  );

  vscode.window.registerWebviewViewProvider(
    SettingsProvider.viewType,
    settingsProvider
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("agent-directory.allRecords", async () => {
      vscode.commands.executeCommand(
        "setContext",
        "filterRecords",
        "agent-directory.allRecords"
      );
      await agentListProvider.filterRecords("all");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "agent-directory.agentsRecords",
      async () => {
        await agentListProvider.filterRecords("agents");
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("agent-directory.mcpRecords", async () => {
      await agentListProvider.filterRecords("mcps");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "agent-directory.sortMostRecent",
      async () => {
        await agentListProvider.sortRecords();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("agent-directory.sortOldest", async () => {
      await agentListProvider.sortRecords(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "agent-directory.publicRecords",
      async () => { await agentListProvider.setOwnedOnly(false); }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "agent-directory.privateRecords",
      async () => { await agentListProvider.setOwnedOnly(true); }
    )
  );
}

export function deactivate() { }
