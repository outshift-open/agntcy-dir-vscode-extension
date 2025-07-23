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
import * as path from "path";
import * as os from "os";

export interface DirctlAuthConfig {
  client_id: string;
  product_id: string;
  idp_frontend: string;
  idp_backend: string;
  idp_issuer: string;
  hub_backend: string;
  api_key_client_id: string;
}

export interface DirctlTokens {
  id_token: string;
  refresh_token: string;
  access_token: string;
}

export interface DirctlHubSession {
  tokens: DirctlTokens;
  user: string;
  auth_config: DirctlAuthConfig;
}

export interface DirctlHubSessions {
  [hubUrl: string]: DirctlHubSession;
}

export interface DirctlConfig {
  hub_sessions: DirctlHubSessions;
}

export function readDirctlConfigFile(
  filePath: string
): DirctlConfig | undefined {
  if (filePath.startsWith("~")) {
    filePath = path.join(os.homedir(), filePath.substring(1));
  }

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  try {
    const fileContent = fs.readFileSync(absolutePath, "utf-8");
    const json = JSON.parse(fileContent);
    return json as DirctlConfig;
  } catch (err) {
    throw err;
  }
}
