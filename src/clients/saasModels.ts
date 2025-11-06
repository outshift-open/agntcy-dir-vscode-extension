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



export interface RecordsResponse {
  paginatedResponse: {
    count: number;
    pages: number;
  };
  records: DMRecord[];
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleProtobufAny {
  '@type': string;
  [key: string]: any;
}

export interface GoogleProtobufValue {
  [key: string]: any;
}

export interface A2A {
  protocolVersion?: string;
  version?: string;
  url?: string;
  capabilities?: Record<string, any>;
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  skills?: Record<string, any>[];
}

export interface Mcp {
  tools?: GoogleProtobufValue[];
  resources?: GoogleProtobufValue[];
  prompts?: GoogleProtobufValue[];
}

export enum Visibility {
  UNSPECIFIED = 'unspecified',
  PRIVATE = 'private',
  PUBLIC = 'public'
}

export interface DMRecord {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  nameRef?: string;
  name?: string;
  version?: string;
  blobRef?: string;
  annotations?: Record<string, string>;
  categories?: Category[];
  locators?: Locators[];
  userId?: string;
  description?: string;
  authors: string[];
  modules?: string[];
  mcp?: Mcp;
  a2a?: A2A;
  recordType?: string;
  identityAppId?: string;
  visibility?: Visibility;
  previousRecordCid?: string;
  recordCid?: string;
}