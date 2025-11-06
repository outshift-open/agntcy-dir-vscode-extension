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


import { ADRestClient } from "../../clients/ADRestClient";
import { OASF_RECORD_SCHEMA_VERSION, OASFRecord, RecordLocator } from "../../model/oasfRecord-0.7.0";
import { Directory } from "./Directory";
import { DirctlWrapper } from "../../clients/DirctlWrapper";
import { DMRecord } from "../saasModels";

export class SaaSDirectory implements Directory {
  constructor(private readonly adRestClient: ADRestClient) { }

  async login(): Promise<string> {
    const output = await DirctlWrapper.exec(["hub", "login"]);
    return output.trim();
  }

  async logout(): Promise<string> {
    const output = await DirctlWrapper.exec(["hub", "logout"]);
    return output.trim();
  }

  async search(searchTerm: string, oldestFirst?: boolean,
    organizationId?: string): Promise<{ records: OASFRecord[], cids: string[], ids: string[]}> {
    const dmRecords = await this.adRestClient.getRecords(
      searchTerm, oldestFirst, organizationId
    );
    const oasfRecords: OASFRecord[] = dmRecords.map(dmRecordToOASFRecord);
    const cids = dmRecords.map(record => record.recordCid || "");
    const ids = dmRecords.map(record => record.id || "");
    return { records: oasfRecords, ids, cids };
  }

  async push(oasfRecord: OASFRecord, organization: string): Promise<string> {
    const output = await DirctlWrapper.exec(["hub", "push", organization], {
      stdin: JSON.stringify(oasfRecord)
    });
    return output.trim();
  }

  async sign(organization: string, cid: string): Promise<string> {
    const signedOutput = await DirctlWrapper.exec(["hub", "sign", organization, cid]);
    return signedOutput.trim();
  }

  async pull(cid: string): Promise<OASFRecord> {
    const output = await DirctlWrapper.exec(["hub", "pull", cid]);
    return JSON.parse(output) as OASFRecord;
  }
}

function dmRecordToOASFRecord(dmRecord: DMRecord): OASFRecord {
  return {
    authors: dmRecord.authors,
    created_at: new Date(dmRecord.createdAt || ""),
    description: dmRecord.description || "",
    domains: [],
    modules: dmRecord.modules ? dmRecord.modules.map(ext => ({
      data: undefined,
      name: ext
    })) : [],
    locators: dmRecord.locators?.map(locator => ({ type: locator.type, url: locator.url } as RecordLocator)) || [],
    name: dmRecord.name || "",
    schema_version: OASF_RECORD_SCHEMA_VERSION,
    skills: [],
    version: dmRecord.version || "",
  };
}
