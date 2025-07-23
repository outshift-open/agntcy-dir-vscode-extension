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
import { DirctlConfig, readDirctlConfigFile } from "../model/dirctl-config";

export const DEFAULT_AGENT_DIRECTORY_URL = "https://agent-directory.outshift.com";
export const DEFAULT_DIRCTL_SESSION_FILE = "~/.dirctl/session.json";
export const DEFAULT_DIRCTL_BINARY_LOC = "~/.agntcy/bin/dirctl";

export function getConfigs() {
  const config = vscode.workspace.getConfiguration("agntcy.agent-directory");

  const directoryURL: string = config.get("directoryURL") ?? DEFAULT_AGENT_DIRECTORY_URL;
  const dirctlBinaryLocation: string = config.get("dirctlBinary") ?? DEFAULT_DIRCTL_BINARY_LOC;

  let dirctlSession: DirctlConfig | undefined =
    readDirctlConfigFile(DEFAULT_DIRCTL_SESSION_FILE);

  let currentSession = dirctlSession?.hub_sessions[directoryURL];
  let accessToken = currentSession?.tokens.access_token;
  let isLoggedIn = _isLoggedIn(accessToken);

  return {
    DEFAULT_DIRCTL_SESSION_FILE,
    dirctlSession,
    directoryURL,
    accessToken,
    isLoggedIn,
    dirctlBinaryLocation,
    dirctlMode: detectDirctlMode(),
  };
}

export function detectDirctlMode(): "saas" | "standard" {
  const config = vscode.workspace.getConfiguration("agntcy.agent-directory");
  const directoryURL = config.get<string>("directoryURL");

  if (directoryURL?.startsWith("https://") || directoryURL?.startsWith("http://")) {
    return "saas";
  } else {
    return "standard";
  }
}

export function _isLoggedIn(accessToken: string | undefined): boolean {
  var isLogged = false;
  if (accessToken) {
    try {
      const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString());
      if (payload.exp * 1000 > Date.now()) {
        isLogged = true;
      }
    } catch (error) {
      isLogged = false;
    }
  }

  return isLogged;
}
