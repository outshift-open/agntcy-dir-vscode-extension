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


export const OASF_RECORD_SCHEMA_VERSION = "v0.6.0";

export interface StringMap {
  [key: string]: string;
}

export interface Domain {
  annotations?: StringMap;
  id?: number;
  name?: string;
}

export interface Skill {
  annotations?: StringMap;
  id?: number;
  name?: string;
}

export interface Locator {
  annotations?: StringMap;
  digest?: string;
  size?: number;
  type: "binary" | "unspecified" | "helm_chart" | "docker_image" | "python_package" | "source_code";
  url: string;
}

export interface RecordSignature {
  algorithm: string;
  annotations?: StringMap;
  certificate: string;
  content_bundle: string;
  content_type: string;
  signature: string;
  signed_at: Date;
}

export interface Extension {
  annotations?: StringMap;
  data: any;
  name: string;
  version?: string;
}

export interface OASFRecord {
  annotations?: StringMap;
  authors: string[];
  created_at: Date;
  description: string;
  domains: Domain[];
  extensions?: Extension[];
  locators: Locator[];
  name: string;
  previous_record_cid?: string;
  schema_url?: string;
  schema_version: "v0.6.0";
  signature?: RecordSignature;
  skills: Skill[];
  version: string;
}


// == MCP OASF Extension ==
export interface EnvironmentVariable {
  default_value?: string;
  description: string;
  name: string;
  required?: boolean;
}

export interface MCPServerPrompt {
  args?: string[];
  command: string;
  description: string;
  name: string;
}

export type MCPServerResource = {
  audience: Array<'user' | 'assistant'>;
  description?: string;
  mime_type?: string;
  name: string;
  priority?: number;
  title?: string;
} & ({ uri: string; uri_template?: never; } | { uri?: never; uri_template: string; });

export interface MCPServerTool {
  description?: string;
  name: string;
  scopes?: Array<'external' | 'read_only' | 'idempotent' | 'destructive'>;
  title?: string;
}

export interface MCPServer {
  args?: string[];
  capabilities: Array<'notify' | 'subscribe'>;
  command?: string;
  description?: string;
  env_vars?: EnvironmentVariable[];
  headers?: StringMap;
  name: string;
  prompts?: MCPServerPrompt[];
  resources?: MCPServerResource[];
  scope?: 'local' | 'project' | 'user';
  title?: string
  tools?: MCPServerTool[];
  type: 'http' | 'local' | 'sse';
  url?: string;
}

export interface MCPData {
  servers: MCPServer[];
}

export const MCP_EXTENSION_NAME = 'runtime/mcp';
export interface OASFMCPExtension extends Extension {
  name: typeof MCP_EXTENSION_NAME;
  data: MCPData;
}
// == MCP OASF Extension ==

// == Prompt OASF Extension ==
export interface LLMPrompt {
  name: string;
  description: string;
  command: string;
}

export interface OASFPromptExtensionData {
  prompts: LLMPrompt[];
}

export const PROMPT_EXTENSION_NAME = 'runtime/prompt';
export interface OASFPromptExtension extends Extension {
  name: typeof PROMPT_EXTENSION_NAME;
  data: OASFPromptExtensionData;
}
// == Prompt OASF Extension ==

// == Model OASF Extension ==
export interface LLMModel {
  api_base: string;
  api_key: string;
  model: string;
  provider: string;
}

export interface LLMModelData {
  models: LLMModel[];
}

export const MODEL_EXTENSION_NAME = 'runtime/model';
export interface OASFModelExtension extends Extension {
  name: typeof MODEL_EXTENSION_NAME;
  data: LLMModelData;
}
// == Model OASF Extension ==

// == LLMTools OASF Extension ==
export interface LLMToolsData {
  mcp_server_tools?: string[];
  models: string[];
  prompts: string[];
  tools?: string[];
}
export const LLM_TOOLS_EXTENSION_NAME = 'runtime/llm_tools';
export interface OASFLLMToolsExtension extends Extension {
  name: typeof LLM_TOOLS_EXTENSION_NAME;
  data: LLMToolsData;
}
// == LLMTools OASF Extension ==
