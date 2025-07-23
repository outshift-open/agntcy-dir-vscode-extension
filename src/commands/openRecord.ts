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
import { newEditorWithContent } from "./utils";
import { DirectoryFactory } from "../clients/directory/DirectoryFactory";

export function openRecord() {
  return async (item: any) => {
    if (!item?.agent) {
      vscode.window.showErrorMessage("Invalid item selected to open record.");
      return;
    }

    try {
      const { agent } = item;

      const directory = DirectoryFactory.getInstance();
      const oasfRecord = await directory.pull(agent.digest);
      const oasfRecordContent = JSON.stringify(oasfRecord, null, 2);

      const safeAgentName = agent.name.replace(/[^\w.-]/g, "_");
      const fileName = `${safeAgentName}-${agent.version}.oasf.json`;

      const itemTypeToLanguageId: Record<string, string> = {
        "mcpRecordItem": "agent-directory.languageId.oasf.mcp",
        "vscodeChatModeAgentItem": "agent-directory.languageId.oasf.chatmode",
      };
      const languageId = itemTypeToLanguageId[item.webviewSection];
      newEditorWithContent(fileName, oasfRecordContent, languageId);
    } catch (error) {
      console.error("Failed to open record:", error);
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to open record: ${message}`);
    }
  };
}
