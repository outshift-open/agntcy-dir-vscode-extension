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
import { execFile } from "child_process";
import * as path from "path";
import * as fs from "fs";

import { OASFRecord } from "../model/oasfRecord-0.7.0";

export class DirctlWrapper {
  private static getDirctlBinary(): string {
    const config = vscode.workspace.getConfiguration("agntcy.agent-directory");
    let binaryPath = config.get<string>("dirctlBinary");
    if (!binaryPath) {
      throw new Error("dirctlBinary is not configured.");
    }
    // Expand ~ to home directory if present
    if (binaryPath.startsWith("~")) {
      binaryPath = path.join(process.env.HOME || "", binaryPath.slice(1));
    }

    try {
      fs.accessSync(binaryPath, fs.constants.X_OK);
    } catch (err) {
      throw new Error(
        `dirctl binary not found or not executable at: ${binaryPath}`
      );
    }
    return binaryPath;
  }

  static exec(args: string[], options?: { cwd?: string, stdin?: string }): Promise<string> {
    const config = vscode.workspace.getConfiguration("agntcy.agent-directory");
    const directoryURL = config.get<string>("directoryURL");

    if (!directoryURL) {
      throw new Error("directoryURL is not configured.");
    }

    return new Promise((resolve, reject) => {
      const binary = DirctlWrapper.getDirctlBinary();
      if (args[0] === "hub") {
        args.push("--server-address", directoryURL);
      } else {
        args.push("--server-addr", directoryURL);
      }
      if (options?.stdin) {
        args.push("--stdin");
      }
      const child = execFile(binary, args, options, (error, stdout, stderr) => {
        if (error) {
          reject(stderr || error.message);
        } else {
          resolve(typeof stdout === "string" ? stdout : stdout.toString());
        }
      });

      if (options?.stdin) {
        child.stdin?.write(options.stdin);
        child.stdin?.end();
      }

      console.debug("Executing ", binary, args);
    });
  }
}
