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
import { OASF_RECORD_SCHEMA_VERSION, OASFRecord, Locator } from "../../model/oasfRecord-0.6.0";
import { Directory } from "./Directory";
import { DirctlWrapper } from "../../clients/DirctlWrapper";
import { HubRecord } from "../saasModels";

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

  async search(searchTerm: string, filter?: "all" | "mcps" | "agents", oldestFirst?: boolean, ownedOnly?: boolean,
    organizationId?: string): Promise<{ records: OASFRecord[], digests: string[], repoIds: string[] }> {
    const repositories = await this.adRestClient.getRepositories(
      searchTerm, filter, oldestFirst, ownedOnly, organizationId
    );
    const mostRecentRecords: HubRecord[] = repositories.map(repo => repo.records?.[0]);
    const oasfRecords: OASFRecord[] = mostRecentRecords.map(hubRecordToOASFRecord);
    const digests = mostRecentRecords.map(record => record.digest);
    const repoIds = mostRecentRecords.map(record => record.repositoryId);
    return { records: oasfRecords, digests, repoIds };
  }

  async push(oasfRecord: OASFRecord): Promise<string> {
    const output = await DirctlWrapper.exec(["hub", "push", oasfRecord.name], {
      stdin: JSON.stringify(oasfRecord)
    });
    return output.trim();
  }

  async sign(record: OASFRecord): Promise<string> {
    const dataToSign = JSON.stringify(record);
    const signedOutput = await DirctlWrapper.exec(["hub", "sign"], {
      stdin: dataToSign
    });
    return signedOutput.trim();
  }

  async pull(digest: string): Promise<OASFRecord> {
    const output = await DirctlWrapper.exec(["hub", "pull", digest]);
    return JSON.parse(output) as OASFRecord;
  }
}

function hubRecordToOASFRecord(hubRecord: HubRecord): OASFRecord {
  return {
    authors: hubRecord.authors,
    created_at: new Date(hubRecord.createdAt),
    description: hubRecord.description,
    domains: [],
    extensions: hubRecord.extensions ? hubRecord.extensions.map(ext => ({
      data: undefined,
      name: ext
    })) : [],
    locators: hubRecord.locators?.map(locator => ({ type: locator.type, url: locator.url } as Locator)),
    name: hubRecord.name,
    schema_version: OASF_RECORD_SCHEMA_VERSION,
    skills: [],
    version: hubRecord.version,
  };
}
