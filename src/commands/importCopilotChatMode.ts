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
import * as yaml from "js-yaml";
import path from "path";
import * as os from "os";

import { VscodeCopilotChatMode } from "../model/vscodeModels";
import {
  OASF_RECORD_SCHEMA_VERSION, OASFRecord,
  LLM_TOOLS_EXTENSION_NAME, OASFLLMToolsExtension as OASFLLMToolsExtension,
  MODEL_EXTENSION_NAME, OASFModelExtension, LLMModel,
  PROMPT_EXTENSION_NAME, OASFPromptExtension,
  MCP_EXTENSION_NAME, OASFMCPExtension,
  Extension
} from "../model/oasfRecord-0.6.0";
import { newEditorWithContent, saveAndOpenFile } from "./utils";
import { DirectoryFactory } from "../clients/directory/DirectoryFactory";

function safeRecordName(name: string): string {
  return name.replace(/[.-]/g, '_');
}

function oasfToChatMode(oasf: OASFRecord): VscodeCopilotChatMode | undefined {
  const llmToolsExtension = oasf.extensions?.find(
    (ext): ext is OASFLLMToolsExtension => ext.name === LLM_TOOLS_EXTENSION_NAME
  );
  if (!llmToolsExtension) {
    console.log("LLM Tools extension not found");
    return undefined;
  }

  // Find the prompt extension
  const promptExtension = oasf.extensions?.find(
    (ext): ext is OASFPromptExtension => ext.name === PROMPT_EXTENSION_NAME
  );
  if (!promptExtension) {
    console.log("Required prompt extension not found");
    return undefined;
  }
  // Take the first prompt of the list and find the corresponding prompt in the prompt extension
  const promptName = llmToolsExtension.data.prompts?.[0];
  const prompt = promptName ? promptExtension.data.prompts.find(p => p.name === promptName) : undefined;
  if (!prompt) {
    console.log("Prompt not found");
    return undefined;
  }

  // Find the model extension (optional)
  // Take the first model of the list and find the corresponding model in the model extension
  var model: LLMModel | undefined = undefined;
  const modelName = llmToolsExtension.data.models?.[0];
  if (modelName) {
    const modelExtension = oasf.extensions?.find(
      (ext): ext is OASFModelExtension => ext.name === MODEL_EXTENSION_NAME
    );
    if (!modelExtension) {
      console.log("Model extension not found");
      return undefined;
    }
    model = modelExtension.data.models.find(m => m.model === modelName);
    if (!model) {
      console.log("Model not found in the model extension");
      return undefined;
    }
  }

  // Find the MCP extension (optional)
  var mcpExtension: OASFMCPExtension | undefined = undefined;
  if (llmToolsExtension.data.mcp_server_tools && llmToolsExtension.data.mcp_server_tools.length > 0) {
    mcpExtension = oasf.extensions?.find(
      (ext): ext is OASFMCPExtension => ext.name === MCP_EXTENSION_NAME
    );
    if (!mcpExtension) {
      console.log("MCP extension not found");
      return undefined;
    }
  }

  const externalTools = llmToolsExtension.data.tools ?? [];

  // Don't get the tools from the extension at the moment.
  // Just use the MCP tools list
  const mcpTools = llmToolsExtension.data.mcp_server_tools ?? [];

  if (llmToolsExtension) {
    return {
      description: prompt.description,
      tools: [...externalTools, ...mcpTools],
      model: model?.model || "",
      prompt: prompt.command
    };
  }
}

function getAuthors(): string[] {
  try {
    const userName = os.userInfo().username;
    return userName ? [userName] : [];
  } catch (error) {
    console.error("Error getting username:", error);
    return [];
  }
}

function convertChatModeToOASF(chatModeName: string, chatMode: VscodeCopilotChatMode): OASFRecord {
  var extensions: Extension[] = [];

  const llmToolsExtension: OASFLLMToolsExtension = {
    name: LLM_TOOLS_EXTENSION_NAME,
    data: {
      mcp_server_tools: [],
      models: chatMode.model ? [chatMode.model] : [],
      prompts: [chatModeName],
      tools: chatMode.tools,
    }
  };
  extensions.push(llmToolsExtension);

  const promptExtension: OASFPromptExtension = {
    name: PROMPT_EXTENSION_NAME,
    data: {
      prompts: [
        {
          command: chatMode.prompt,
          description: chatMode.description,
          name: chatModeName
        }
      ]
    }
  };
  extensions.push(promptExtension);

  if (chatMode.model) {
    const modelExtension: OASFModelExtension = {
      name: MODEL_EXTENSION_NAME,
      data: {
        models: [
          {
            api_base: "NOTUSED",
            api_key: "NOTUSED",
            model: chatMode.model,
            provider: "NOTUSED"
          }
        ]
      }
    };
    extensions.push(modelExtension);
  }

  const authors = getAuthors();
  const oasfRecord: OASFRecord = {
    authors: authors,
    created_at: new Date(),
    description: chatMode.description,
    domains: [
      {
        "name": "technology/software_engineering"
      }
    ],
    extensions: extensions,
    locators: [],
    name: chatModeName,
    schema_version: OASF_RECORD_SCHEMA_VERSION,
    skills: [],
    version: "1.0.0",
  };

  return oasfRecord;
}

function chatModeToString(chatMode: VscodeCopilotChatMode): string {
  const frontMatter = {
    description: chatMode.description,
    tools: chatMode.tools,
    model: chatMode.model,
  };
  const yamlFrontMatter = yaml.dump(frontMatter, { forceQuotes: true, noArrayIndent: true, flowLevel: 1 });
  const content = `---\n${yamlFrontMatter}---\n\n${chatMode.prompt}`;
  return content;
};

function parseChatMode(content: string): VscodeCopilotChatMode {
  const parts = content.split("---");
  if (parts.length < 3) {
    throw new Error("Invalid chat mode file format.");
  }

  const frontMatter: any = yaml.load(parts[1]);
  const body = parts.slice(2).join("---").trim();

  return {
    description: frontMatter.description || "",
    tools: frontMatter.tools || [],
    model: frontMatter.model || "",
    prompt: body || "",
  };
}

export function openChatModeCommand(context: vscode.ExtensionContext) {
  return async (item: any) => {
    if (!item?.agent) {
      vscode.window.showErrorMessage("Invalid item selected to open chat mode.");
      return;
    }

    try {
      const { agent } = item;
      DirectoryFactory.getInstance();
      const directory = DirectoryFactory.getInstance();
      const oasfRecord = await directory.pull(agent.digest);
      const chatMode = oasfToChatMode(oasfRecord);
      if (!chatMode) {
        vscode.window.showErrorMessage("Failed to convert OASF to chat mode.");
        return;
      }

      const content = chatModeToString(chatMode);
      const recordName = safeRecordName(agent.name);

      let { location, modeName } = await askChatModeLocation(context, `${recordName}-${agent.version}`);
      if (!modeName) {
        modeName = `${recordName}-${agent.version}`;
      }

      const filename = `${modeName}.chatmode.md`;
      saveAndOpenFile(location!, filename, content);
    } catch (error) {
      console.error("Failed to open chat mode:", error);
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to open chat mode: ${message}`);
    }
  };
}

export function convertOASFToChatModeCommand() {
  return async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found.");
      return;
    }
    try {
      const oasfContent = editor.document.getText();
      const oasf = JSON.parse(oasfContent) as OASFRecord;
      const chatMode = oasfToChatMode(oasf);
      if (!chatMode) {
        vscode.window.showErrorMessage("Failed to convert OASF to chat mode.");
        return;
      }
      const chatModeContent = chatModeToString(chatMode);
      const recordName = safeRecordName(oasf.name);
      const fileName = `${recordName}-${oasf.version}.chatmode.md`;

      newEditorWithContent(fileName, chatModeContent);
      vscode.window.showInformationMessage(`Converted chat mode to OASF and opened ${fileName}`);
    } catch (error) {
      console.error("Failed to convert OASF to chat mode:", error);
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to convert OASF to chat mode: ${message}`);
    }
  };
}

export function convertChatModeToOASFCommand() {
  return async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found.");
      return;
    }
    try {
      const chatModeContent = editor.document.getText();
      const parsedChatMode = parseChatMode(chatModeContent);

      let chatModeName: string = vscode.workspace.name || "converted-chat-mode";
      if (editor.document.fileName.endsWith(".chatmode.md")) {
        chatModeName = path.basename(editor.document.uri.fsPath, ".chatmode.md");
      }
      let filename = `${chatModeName}.oasf.json`;

      const recordName = safeRecordName(chatModeName);

      const oasfRecord: OASFRecord = convertChatModeToOASF(recordName, parsedChatMode);
      const oasfRecordContent = JSON.stringify(oasfRecord, null, 2);

      newEditorWithContent(filename, oasfRecordContent);
      vscode.window.showInformationMessage(`Converted chat mode to OASF and opened ${filename}`);
    } catch (error) {
      console.error("Failed to convert chat mode to OASF:", error);
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to convert chat mode to OASF: ${message}`);
    }
  };
}

export async function askChatModeLocation(context: vscode.ExtensionContext, safeRecordName?: string) {
  const CONFIG_PARENT_MODE_LOCATION_KEY = 'chat';
  const CONFIG_MODE_LOCATION_KEY = 'modeFilesLocations';

  const chatConfig = vscode.workspace.getConfiguration(CONFIG_PARENT_MODE_LOCATION_KEY);
  let locations: { [key: string]: boolean } | undefined = chatConfig.get(CONFIG_MODE_LOCATION_KEY);

  let locationsToPick = [];

  if (locations) {
    for (const loc of Object.keys(locations)) {
      if (locations[loc]) {
        locationsToPick.push({
          type: 'item',
          label: loc,
          chatModeLocation: loc
        });
      }
    }
  }

  const extensionDataFolder = context.globalStorageUri.fsPath;
  // Go back 2 folders to get to the user data folder
  const userDataFolder = path.join(extensionDataFolder, '..', '..');
  locationsToPick.push({
    type: 'item',
    label: "User Data Folder",
    chatModeLocation: path.join(userDataFolder, 'prompts')
  });

  const selectedLocation = await vscode.window.showQuickPick(locationsToPick, {
    placeHolder: "Select a location to create the chat mode in…",
    canPickMany: false,
    matchOnDescription: true,
  });

  console.log(selectedLocation?.chatModeLocation);

  let chatModeName = await vscode.window.showInputBox({
    prompt: "Enter the name for the chat mode",
    placeHolder: "e.g., golang-programmer",
    value: safeRecordName,
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "Chat mode name cannot be empty";
      }
      if (!/^[a-zA-Z0-9_.\-]+$/.test(value)) {
        return "Chat mode name can only contain letters, numbers, hyphens, underscores, and periods";
      }
      return undefined;
    }
  });

  if (chatModeName) {
    chatModeName.trim();
  }

  return {
    location: selectedLocation?.chatModeLocation,
    modeName: chatModeName
  };
}
