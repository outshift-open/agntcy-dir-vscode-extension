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

export interface Directory {
  login(): Promise<string>;
  logout(): Promise<string>;
  search(
    searchTerm: string, 
    oldestFirst?: boolean,
    organizationId?: string): Promise<{ records: OASFRecord[], ids?: string[], cids: string[] }>;
  push(record: OASFRecord, organization: string): Promise<string>;
  sign(organization: string, cid: string): Promise<string>;
  pull(cid: string): Promise<OASFRecord>;
}
