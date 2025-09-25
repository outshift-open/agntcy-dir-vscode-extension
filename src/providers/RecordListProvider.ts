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


import * as fs from "fs";
import vscode from "vscode";
import { getNonce } from "./utils";
import { getConfigs } from "../config/readSession";
import { MCP_MODULE_NAME, LLM_TOOLS_MODULE_NAME, OASFRecord } from "../model/oasfRecord-0.7.0";
import { DirectoryFactory } from "../clients/directory/DirectoryFactory";
import { Organization } from "../clients/saasModels";

export class RecordListProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "agent-directory.listof-records";
  private searchTerm = "";
  private _view?: vscode.WebviewView;
  private filter: "all" | "mcps" | "agents" = "all";
  private oldestFirst: boolean = false;
  private ownedOnly: boolean = false;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) { }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      enableForms: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "resources"),
        vscode.Uri.joinPath(
          this._extensionUri,
          "node_modules/@vscode/codicons"
        ),
      ],
    };
    webviewView.webview.html = this._getHTMLForWebView(webviewView.webview);
    webviewView.webview.postMessage({
      command: "agent-directory.listRecordsViewLoaded",
    });

    this._view.webview.onDidReceiveMessage((m) => {
      if (m.command === "agent-directory.searchRecords") {
        this.search(m.text);
      } else if (m.command === "agent-directory.openInbrowser") {
        const config = getConfigs();
        const url = vscode.Uri.parse(
          `${config.directoryURL}/explore/${m.text}`
        );
        vscode.env.openExternal(url);
      } else if (m.command === "agent-directory.clearFilter") {
        this.filter = "all";
      } else if (m.command === "agent-directory.importAsMCPServer") {
        vscode.commands.executeCommand("setContext", "agent", m.data);
        vscode.commands.executeCommand(m.command, m.data);
      } else {
        this._view?.webview.postMessage(m);
      }
    });
  }

  public async updateListOfRecords() {
    if (!this._view) {
      return;
    }

    await vscode.window.withProgress(
      {
        location: { viewId: "agent-directory.listof-records" },
      },
      async (progress) => {
        if (!this._view) {
          return;
        }

        const agenticServices: Array<
          OASFRecord & {
            digest: string;
            repoId?: string;
            iconUri: string;
            itemType: "agentItem" | "mcpRecordItem" | "vscodeChatModeAgentItem";
          }
        > = [];
        const mcpIcon = this._view.webview.asWebviewUri(
          vscode.Uri.joinPath(this._extensionUri, "resources", "mcp_icon.svg")
        );

        const agentIcon = this._view.webview.asWebviewUri(
          vscode.Uri.joinPath(this._extensionUri, "resources", "agent_icon.svg")
        );
        const selectedOrganization = this.context.workspaceState.get<Organization>("agent-directory.selectedOrganization")?.id || "";
        const directory = DirectoryFactory.getInstance();
        const { records: oasfRecords, digests, repoIds } = await directory.search(
          this.searchTerm, this.filter, this.oldestFirst, this.ownedOnly, selectedOrganization);

        oasfRecords.forEach((oasfRecord: OASFRecord) => {
          const isChatMode = this.isLLMTools(oasfRecord);
          const isMcp = this.isMCPServer(oasfRecord);
          agenticServices.push({
            ...oasfRecord,
            digest: digests[oasfRecords.indexOf(oasfRecord)],
            repoId: repoIds?.[oasfRecords.indexOf(oasfRecord)],
            iconUri: isMcp ? mcpIcon.toString() : agentIcon.toString(),
            itemType: isMcp
              ? "mcpRecordItem"
              : isChatMode
                ? "vscodeChatModeAgentItem"
                : "agentItem",
          });
        });

        this._view.webview.postMessage({
          command: "agent-directory.listRecords",
          data: agenticServices,
          dirctlMode: getConfigs().dirctlMode,
        });
        progress.report({ increment: 100 });
      }
    );
  }

  _getHTMLForWebView(webview: vscode.Webview) {
    const scriptPathOnDisk = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "scripts/records_list.js")
    );
    const stylePathOnDisk = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "resources",
        "styles/records_list.css"
      )
    );

    const htmlPath = vscode.Uri.joinPath(
      this._extensionUri,
      "resources",
      "templates/records_list.html"
    );

    const nonce = getNonce();
    let html = fs.readFileSync(htmlPath.fsPath, "utf8");

    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const styleUri = webview.asWebviewUri(stylePathOnDisk);
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css"
      )
    );

    // Replace placeholders in the HTML file with the correct paths and nonce
    html = html.replace(/{{nonce}}/g, nonce);
    html = html.replace(/{{cspSource}}/g, webview.cspSource);
    html = html.replace(/{{codiconsUri}}/g, codiconsUri.toString());

    html = html.replace(/{{styleUri}}/g, styleUri.toString());
    html = html.replace(/{{scriptUri}}/g, scriptUri.toString());

    return html;
  }

  async search(term: string): Promise<void> {
    this.searchTerm = term;
    await vscode.window.withProgress(
      {
        location: { viewId: "agent-directory.listof-records" },
      },
      async (progress) => {
        await this.updateListOfRecords();

        progress.report({ increment: 100 });
      }
    );
  }

  async setOwnedOnly(ownedOnly: boolean) {
    this.ownedOnly = ownedOnly;
    await vscode.window.withProgress(
      {
        location: { viewId: "agent-directory.listof-records" },
      },
      async (progress) => {
        await this.updateListOfRecords();

        progress.report({ increment: 100 });
      }
    );
  }

  async filterRecords(filter: "all" | "mcps" | "agents") {
    this.filter = filter;
    await vscode.window.withProgress(
      {
        location: { viewId: "agent-directory.listof-records" },
      },
      async (progress) => {
        this._view?.webview.postMessage({
          command: "agent-directory.updateFilter",
          text: filter,
        });
        await this.updateListOfRecords();

        progress.report({ increment: 100 });
      }
    );
  }

  async sortRecords(oldestFirst: boolean = false) {
    this.oldestFirst = oldestFirst;
    await vscode.window.withProgress(
      {
        location: { viewId: "agent-directory.listof-records" },
      },
      async (progress) => {
        await this.updateListOfRecords();

        progress.report({ increment: 100 });
      }
    );
  }

  private isMCPServer(oasfRecord: OASFRecord): boolean {
    return oasfRecord.modules?.find((ext) => ext.name === MCP_MODULE_NAME) !== undefined;
  }

  private isLLMTools(oasfRecord: OASFRecord): boolean {
    return oasfRecord.modules?.find((ext) => ext.name === LLM_TOOLS_MODULE_NAME) !== undefined;
  }
}
