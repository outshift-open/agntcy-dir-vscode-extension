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
import * as fs from "fs";
import { getConfigs } from "../config/readSession";
import { getNonce } from "./utils";

export class SettingsProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "agent-directory.authentication";
  private _webviewView: vscode.WebviewView | undefined;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context?: vscode.ExtensionContext
  ) { }

  public async refresh() {
    if (this._webviewView) {
      const { dirctlSession, directoryURL, isLoggedIn, dirctlMode } = getConfigs();
      const selectedOrganization = this._context?.workspaceState?.get("agent-directory.selectedOrganization");
      this._webviewView.webview.postMessage({
        command: "agent-directory.refresh",
        data: {
          isLoggedIn: isLoggedIn,
          loggedInServer: isLoggedIn ? directoryURL : undefined,
          user: dirctlSession?.["hub_sessions"]?.[directoryURL]?.user,
          dirctlMode: dirctlMode,
          selectedOrganization: selectedOrganization,
        },
      });
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "resources"),
      ],
    };

    webviewView.webview.html = this._getHTMLForWebView(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "agent-directory.login":
          vscode.commands.executeCommand(message.command);
          break;
        case "agent-directory.logout":
          vscode.commands.executeCommand(message.command);
          break;
        case "agent-directory.selectOrganization":
          vscode.commands.executeCommand(message.command);
          break;
      }
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.refresh();
      }
    });

    this.refresh();
  }

  _getHTMLForWebView(webview: vscode.Webview) {
    const scriptPathOnDisk = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "scripts/main.js")
    );
    const stylePathOnDisk = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "resources",
        "styles/authentication.css"
      )
    );
    const htmlPath = vscode.Uri.joinPath(
      this._extensionUri,
      "resources",
      "templates/authentication.html"
    );

    const nonce = getNonce();
    let html = fs.readFileSync(htmlPath.fsPath, "utf8");

    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const styleUri = webview.asWebviewUri(stylePathOnDisk);

    // Replace placeholders in the HTML file with the correct paths and nonce
    html = html.replace(/{{nonce}}/g, nonce);

    html = html.replace(/{{styleUri}}/g, styleUri.toString());
    html = html.replace(/{{scriptUri}}/g, scriptUri.toString());

    html = html.replace(/{{cspSource}}/g, webview.cspSource);

    return html;
  }
}

