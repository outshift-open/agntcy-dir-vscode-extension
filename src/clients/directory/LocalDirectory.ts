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

  async search(searchTerm: string): Promise<{ records: OASFRecord[], digests: string[] }> {
    searchTerm = searchTerm.trim();

    // Do not execute the search query if this doesn't look like a valid search term
    const validSearchTerm = /^[a-zA-Z0-9-_=,]+$/;
    if (searchTerm.length !== 0 && !validSearchTerm.test(searchTerm)) {
      return { records: [], digests: [] };
    }

    // Do not execute the search query if this doesn't look like key=value pairs
    let searchQuery = [];
    if (searchTerm.length !== 0) {
      const pairs = searchTerm.split(',');
      for (const pair of pairs) {
        const parts = pair.split('=');
        if (parts.length !== 2) {
          return { records: [], digests: [] };
        }
        if (parts[0].trim().length === 0 || parts[1].trim().length === 0) {
          return { records: [], digests: [] };
        }
        searchQuery.push("--query", pair.trim());
      }
    }

    const recordsDigests: string[] = (await DirctlWrapper.exec(["search", ...searchQuery])).split("\n").map(line => line.trim()).filter(line => line.length > 0);
    const oasfRecords: OASFRecord[] = [];
    for (const digest of recordsDigests) {
      try {
        const record = await DirctlWrapper.exec(["pull", digest]);
        const oasfRecord = JSON.parse(record) as OASFRecord;
        oasfRecords.push(oasfRecord);
      } catch (e) {
        console.error(`Failed to pull record with digest ${digest}:`, e);
      }
    }
    return { records: oasfRecords, digests: recordsDigests };
  }

  async push(oasfRecord: OASFRecord): Promise<string> {
    const output = await DirctlWrapper.exec(["push"], {
      stdin: JSON.stringify(oasfRecord)
    });
    return output.trim();
  }

  async sign(record: OASFRecord): Promise<string> {
    const dataToSign = JSON.stringify(record);
    const signedOutput = await DirctlWrapper.exec(["sign"], {
      stdin: dataToSign
    });
    return signedOutput.trim();
  }

  async pull(digest: string): Promise<OASFRecord> {
    const output = await DirctlWrapper.exec(["pull", digest]);
    return JSON.parse(output) as OASFRecord;
  }
}
