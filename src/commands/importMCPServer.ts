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
import { MCP_EXTENSION_NAME, OASFRecord, OASFMCPExtension } from "../model/oasfRecord-0.6.0";
import { MCPServerConfiguration } from "../model/vscodeModels";
import { DirectoryFactory } from "../clients/directory/DirectoryFactory";

function createMcpServerConfiguration(oasfRecord: OASFRecord): MCPServerConfiguration | undefined {
  const mcpExtension = oasfRecord.extensions?.find(
    (ext) => ext.name === MCP_EXTENSION_NAME
  ) as OASFMCPExtension | undefined;

  if (!mcpExtension) {
    throw new Error("No MCP extension found in OASF record.");
  }

  const servers = mcpExtension.data.servers;
  if (!servers || Object.keys(servers).length === 0) {
    throw new Error("No servers defined in MCP extension.");
  }

  const server = servers[0];

  if (["local"].includes(server.type) && server.command) {
    let env_vars: Record<string, string> = {};
    server.env_vars?.forEach((envVar) => {
      env_vars[envVar.name] = envVar.default_value ?? "";
    });

    return {
      name: server.name,
      type: "stdio",
      command: server.command,
      args: server.args,
      env: env_vars,
    };
  }

  if (["http", "sse"].includes(server.type) && server.url) {
    return {
      name: server.name,
      type: server.type,
      url: server.url,
      headers: server.headers || {},
    };
  }

  throw new Error("Unsupported server type");
}

export function importMCPServer() {
  return async (item: any) => {
    await vscode.window.withProgress(
      {
        location: { viewId: "agent-directory.listof-records" },
        cancellable: true,
      },
      async (progress, token) => {
        try {
          token.onCancellationRequested(() => {
            console.log("Operation canceled");
          });
          const agent = item.agent;
          vscode.window.showInformationMessage(
            `Importing ${agent.name}:${agent.version} as MCP server...`
          );

          const directory = DirectoryFactory.getInstance();
          const oasfRecord = await directory.pull(agent.digest);

          const mcpConfiguration = createMcpServerConfiguration(oasfRecord);
          const link = vscode.Uri.parse(
            `vscode:mcp/install?${encodeURIComponent(
              JSON.stringify(mcpConfiguration)
            )}`
          );
          vscode.env.openExternal(link).then((success) => {
            if (!success) {
              vscode.window.showWarningMessage(
                "Failed to open MCP installation."
              );
            }
          });

          progress.report({ increment: 100 });
        } catch (e) {
          vscode.window.showErrorMessage(
            "Failed to open MCP installation, due to :" +
            (e?.toString() || "Unknown error")
          );
        }
      }
    );
  };
}
