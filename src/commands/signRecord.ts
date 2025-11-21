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
import { Organization } from "../clients/saasModels";

export function signRecord(context: vscode.ExtensionContext) {
  return async (item?: any) => {
    if (!item?.agent) {
      vscode.window.showErrorMessage("Please sign the record from the record list view.");
      return;
    }

    const { agent } = item;

    if (!agent.cid) {
      vscode.window.showErrorMessage("No CID found for the selected record.");
      return;
    }

    let signedOutput = '';
    try {
      const selectedOrganization = context.workspaceState.get<Organization>("agent-directory.selectedOrganization")?.name || "";
      
      const directory = DirectoryFactory.getInstance();
      signedOutput = await directory.sign(selectedOrganization, agent.cid);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to sign record '${agent.name}': ${error}`);
      return;
    }

    vscode.window.showInformationMessage(`Record '${agent.name}' signed successfully: ${signedOutput.trim()}`);
  };
}
