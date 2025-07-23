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


export interface Category {
  uid: number;
  name: string;
  description: string;
  caption: string;
  parentUid: number;
}

export interface Locators {
  type: string;
  url: string;
}

export interface HubRecord {
  authors: string[];
  createdAt: string;
  description: string;
  digest: string;
  extensions?: string[];
  id: string;
  locators: Locators[];
  name: string;
  repositoryId: string;
  updatedAt: string;
  userId: string;
  version: string;
}

export interface Repository {
  createdAt: string;
  description: string;
  id: string;
  name: string;
  organizationId: string,
  private: boolean;
  records: HubRecord[];
  repoType: string;
  updatedAt: string;
  userId: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
