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

const DIRCTL_VERSION = '0.4.0';
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
    { platform: 'darwin', arch: 'amd64', sha256: 'a45db4dac480fcfa9b7e85add9b0b89197c82d6caf0b81ecb4275a4af2969431' },
    { platform: 'darwin', arch: 'arm64', sha256: '7b489b5636af54d5c1aa06ea412047255d019eec2809c9ba5ca62659a91f89b2' },
    { platform: 'linux', arch: 'amd64', sha256: '532bd9fbfc6e15c0c33f6ceb62677d47a5e19588860f79805a0207a21de2f25a' },
    { platform: 'linux', arch: 'arm64', sha256: '3bc013aa8a1067893a91a3e87cee0455e98318040323cfa2e20c705590be527f' },
    { platform: 'windows', arch: 'amd64', sha256: '7e5c8f9da35dd0487035f4453012b0dd09959ff2eee0fde5a1a2af7a97b602a9' }
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
