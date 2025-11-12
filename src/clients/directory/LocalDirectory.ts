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


import { OASFRecord } from "../../model/oasfRecord-0.7.0";
import { Directory } from "./Directory";
import { DirctlWrapper } from "../../clients/DirctlWrapper";

export class LocalDirectory implements Directory {
  constructor() { }

  async login(): Promise<string> {
    return Promise.resolve("No login required for local directory");
  }

  async logout(): Promise<string> {
    return Promise.resolve("No logout available for local directory");
  }

  async search(searchTerm: string): Promise<{ records: OASFRecord[], cids: string[] }> {
    searchTerm = searchTerm.trim();

    // Do not execute the search query if this doesn't look like a valid search term
    const validSearchTerm = /^[a-zA-Z0-9-_=,*]+$/;
    if (searchTerm.length !== 0 && !validSearchTerm.test(searchTerm)) {
      return { records: [], cids: [] };
    }

    // Parse key=value pairs and map to command-line flags
    let searchQuery: string[] = [];
    if (searchTerm.length !== 0) {
      const pairs = searchTerm.split(',');
      for (const pair of pairs) {
        const parts = pair.split('=');
        if (parts.length !== 2) {
          return { records: [], cids: [] };
        }
        const key = parts[0].trim();
        const value = parts[1].trim();
        if (key.length === 0 || value.length === 0) {
          return { records: [], cids: [] };
        }

        switch (key) {
          case 'locator':
            searchQuery.push('--locator', value);
            break;
          case 'module':
            searchQuery.push('--module', value);
            break;
          case 'name':
            searchQuery.push('--name', value);
            break;
          case 'skill':
            searchQuery.push('--skill', value);
            break;
          case 'skill-id':
            searchQuery.push('--skill-id', value);
            break;
          case 'version':
            searchQuery.push('--version', value);
            break;
          default:
            return { records: [], cids: [] };
        }
      }
    }

    const jsonRecordCids: string = await DirctlWrapper.exec(["search", "--json",  ...searchQuery]);
    if (jsonRecordCids.trim() === "No record CIDs found") {
      return { records: [], cids: [] };
    }

    const recordsCids: string[] = JSON.parse(jsonRecordCids);

    const oasfRecords: OASFRecord[] = [];
    for (const cid of recordsCids) {
      try {
        const record = await DirctlWrapper.exec(["pull", "--json", cid]);
        const oasfRecord = JSON.parse(record) as OASFRecord;
        oasfRecords.push(oasfRecord);
      } catch (e) {
        console.error(`Failed to pull record with cid ${cid}:`, e);
      }
    }
    return { records: oasfRecords, cids: recordsCids };
  }

  async push(oasfRecord: OASFRecord): Promise<string> {
    const output = await DirctlWrapper.exec(["push"], {
      stdin: JSON.stringify(oasfRecord)
    });
    return output.trim();
  }

  async sign(organization: string = "", cid: string): Promise<string> {
    const signedOutput = await DirctlWrapper.exec(["sign", cid]);
    return signedOutput.trim();
  }

  async pull(cid: string): Promise<OASFRecord> {
    const output = await DirctlWrapper.exec(["pull", "--json", cid]);
    return JSON.parse(output) as OASFRecord;
  }
}
