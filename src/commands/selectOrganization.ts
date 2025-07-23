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
import { ADRestClient } from "../clients/ADRestClient";

export async function selectOrganization(context: vscode.ExtensionContext, adRestClient: ADRestClient) {
  const orgsResponse = await adRestClient.getOrganizations();
  let quickPick = orgsResponse.organizations.map(org => `${org.organization.name}`);
  const selectedOrg = await vscode.window.showQuickPick(quickPick, {
    placeHolder: "Select an organization"
  });
  if (selectedOrg) {
    const selected = orgsResponse.organizations.find(org => `${org.organization.name}` === selectedOrg);
    const selectedOrganization = selected?.organization;
    context.workspaceState.update("agent-directory.selectedOrganization", selectedOrganization);

    // Notify webview
    vscode.commands.executeCommand("agent-directory.refresh-auth-view");
  }
}
