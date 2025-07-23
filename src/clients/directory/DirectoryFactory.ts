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
import { Directory } from "./Directory";
import { LocalDirectory } from "./LocalDirectory";
import { SaaSDirectory } from "./SaaSDirectory";
import { detectDirctlMode } from "../../config/readSession";

export class DirectoryFactory {
  static getInstance(): Directory {
    if (detectDirctlMode() === "saas") {
      const adRestClient = new ADRestClient();
      return new SaaSDirectory(adRestClient);
    } else {
      return new LocalDirectory();
    }
  }
}
