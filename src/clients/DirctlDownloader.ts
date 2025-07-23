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


import * as vscode from 'vscode';
import * as https from 'https';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import * as os from 'os';
import * as stream from 'stream';
import * as cp from 'child_process';
import { promisify } from 'util';

const pipeline = promisify(stream.pipeline);
const execFile = promisify(cp.execFile);

const DIRCTL_VERSION = '0.3.0';
const BINARY_NAME = 'dirctl';

type Platform = 'darwin' | 'linux' | 'windows';
type Arch = 'amd64' | 'arm64';

interface Asset {
  platform: Platform;
  arch: Arch;
  sha256: string;
}

export class DirctlDownloader {
  private static assets: Asset[] = [
    { platform: 'darwin', arch: 'amd64', sha256: 'df1af977204b332e3b8e8fc4e308677b360b3b64c0a7c7fe64824f25b47fa74e' },
    { platform: 'darwin', arch: 'arm64', sha256: '6668ba123e67cb3b13da7aa782268bfd5cfec2ea757c006c8e959ff7e78eb611' },
    { platform: 'linux', arch: 'amd64', sha256: 'c2b8a1c61700e58df1ebb56b877b1fc044b7a0d8d0899c710a3d3b7718b6238c' },
    { platform: 'linux', arch: 'arm64', sha256: '93fc407b680b6e3e17e18f6e27863f274624cffc9cab79093be8ed6f24e50c83' },
    { platform: 'windows', arch: 'amd64', sha256: '9e5461da8343daf30ed2e2c74a8c85175deae02140ec39087eb9cf575bf2634e' }
  ];

  constructor(private context: vscode.ExtensionContext) { }

  public async ensureCorrectVersion(currentPath?: string): Promise<string> {
    if (currentPath && await this.checkVersionMatch(currentPath)) {
      return currentPath;
    }

    return await this.handleVersionMismatch(currentPath);
  }

  private async checkVersionMatch(binaryPath: string): Promise<boolean> {
    try {
      const version = await this.getVersionFromBinary(binaryPath);
      return version === DIRCTL_VERSION;
    } catch {
      return false;
    }
  }

  private async getVersionFromBinary(binaryPath: string): Promise<string> {
    try {
      await fs.promises.access(binaryPath, fs.constants.F_OK | fs.constants.X_OK);
      const { stdout } = await execFile(binaryPath, ['version']);

      const lines = stdout.trim().split('\n');
      if (lines.length > 0) {
        const versionLine = lines[0];
        const match = versionLine.match(/Application Version:\s*v([\d.\w-]+)/);
        if (match) {
          return match[1];
        }
      }

      throw new Error('Unable to parse version from dirctl output');
    } catch (error) {
      throw new Error(`Failed to get version from ${binaryPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleVersionMismatch(existingPath?: string): Promise<string> {
    const currentVersion = existingPath ? await this.getVersionFromBinary(existingPath).catch(() => 'unknown') : 'not found';

    const choice = await vscode.window.showWarningMessage(
      `dirctl version mismatch. Expected v${DIRCTL_VERSION}, but found v${currentVersion}. Would you like to download the correct version?`,
      `Download ${DIRCTL_VERSION}`,
      'Continue anyway',
      'Cancel'
    );

    switch (choice) {
      case `Download ${DIRCTL_VERSION}`:
        const downloadedPath = await this.downloadAndInstall();
        return downloadedPath;

      case 'Continue anyway':
        if (existingPath) {
          return existingPath;
        }
        throw new Error('No valid dirctl binary found');

      default:
        throw new Error('Operation cancelled by user');
    }
  }

  private static getAsset(): Asset | undefined {
    const platform = os.platform();
    const arch = os.arch();

    const platformMap: { [key: string]: Platform } = {
      'darwin': 'darwin',
      'linux': 'linux',
      'win32': 'windows'
    };
    const archMap: { [key: string]: Arch } = {
      'x64': 'amd64',
      'arm64': 'arm64'
    };

    const mappedPlatform = platformMap[platform];
    const mappedArch = archMap[arch];

    if (!mappedPlatform || !mappedArch) {
      return undefined;
    }

    return this.assets.find(a => a.platform === mappedPlatform && a.arch === mappedArch);
  }

  public async downloadAndInstall(): Promise<string> {
    const asset = DirctlDownloader.getAsset();
    if (!asset) {
      throw new Error(`Unsupported platform/architecture: ${os.platform()}/${os.arch()}`);
    }

    const downloadUrl = `https://github.com/agntcy/dir/releases/download/v${DIRCTL_VERSION}/dirctl-${asset.platform}-${asset.arch}`;

    await fs.promises.mkdir(this.context.globalStorageUri.fsPath, { recursive: true });
    const binaryPath = path.join(this.context.globalStorageUri.fsPath, BINARY_NAME);

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Installing dirctl v${DIRCTL_VERSION}...`,
      cancellable: false
    }, async (progress) => {
      progress.report({ message: "Downloading dirctl binary..." });
      await this.downloadFile(downloadUrl, binaryPath);
      progress.report({ message: "Verifying checksum..." });
      await this.verifyChecksum(binaryPath, asset.sha256);
    });

    await fs.promises.chmod(binaryPath, 0o755);

    return binaryPath;
  }

  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          if (response.headers.location) {
            this.downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            return;
          } else {
            reject(new Error('Redirected but no location header found.'));
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: ${response.statusCode}`));
          return;
        }

        pipeline(response, fs.createWriteStream(dest))
          .then(resolve)
          .catch(reject);

      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  private async verifyChecksum(filePath: string, expectedChecksum: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => {
        const actualChecksum = hash.digest('hex');
        if (actualChecksum === expectedChecksum) {
          resolve();
        } else {
          reject(new Error(`Checksum mismatch. Expected ${expectedChecksum}, got ${actualChecksum}`));
        }
      });
      stream.on('error', (err) => reject(err));
    });
  }
}

export async function ensureDirctlIsInstalled(context: vscode.ExtensionContext): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration("agntcy.agent-directory");
  let dirctlPath = config.get<string>("dirctlBinary");

  try {
    const downloader = new DirctlDownloader(context);

    if (dirctlPath?.startsWith("~")) {
      const path = await import("path");
      dirctlPath = path.join(process.env.HOME || "", dirctlPath.slice(1));
    }

    const correctPath = await downloader.ensureCorrectVersion(dirctlPath);

    if (correctPath !== dirctlPath) {
      await config.update("dirctlBinary", correctPath, vscode.ConfigurationTarget.Global);
    }

    return correctPath;
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to ensure dirctl is properly installed: ${error.message}`);
    return undefined;
  }
}
