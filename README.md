# AGNTCY Agent Directory extension for Visual Studio Code

> **⚠️ REPOSITORY ARCHIVED**
>
> Thank you for your engagement with this public hosted service. Based on your valuable feedback and usage patterns, we have evolved the AGNTCY Directory code base and will be decommissioning this service effective **January 20, 2026**.
>
> Please stay engaged by joining the [AGNTCY Directory Core Working Group](https://github.com/agntcy).

---

The AGNTCY Agent Directory extension for Visual Studio Code provides a seamless
interface for developers to interact with agent directory (https://github.com/agntcy/dir) or its public hosted instance (https://agent-directory.outshift.com/). 

## Installation and Getting Started

### Download and Install
1. Go to the [GitHub Releases page](https://github.com/outshift-open/agntcy-dir-vscode-extension/releases)
2. Download the latest `.vsix` file
3. In VS Code, open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
4. Run the command "Extensions: Install from VSIX..."
5. Select the downloaded `.vsix` file

### Start the Walkthrough
After installation, you can start the interactive walkthrough:
1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Search for and run "AGNTCY: Start Walkthrough"
3. Follow the guided tour to learn about all the extension features

## Use Cases

This extension is intended to support several use cases:
* **Automatic Record Pull and Push**:
		Developers will be able to seamlessly pull and push [OASF](https://docs.agntcy.org/oasf/open-agentic-schema-framework/) based records to the Agent Directory directly from VSCode.
* **Search and Configuration of MCP Servers for Github Copilot**:
		Developers using Github Copilot in Agent Mode will be able to discover MCP Servers within the Agent Directory and install them in VSCode. This will make it easier to leverage additional tools and functionalities exposed by MCP servers.
* **Configuration of Github Copilot Agent Mode**:
		The extension will allow developers to search for and apply specific configurations -such as prompts, models, or tools- stored as records in the Agent Directory to Github Copilot in Agent Mode.

## Features Details

- **Browse and Search:** Explore agent directory with a built-in agent tree view. Search for specific agents to quickly find what you need.
- **Authentication:** Securely log in to the hosted instance of Agent Directory to manage your
private agents and perform authenticated actions.
- **OASF Record Management:**
  - **Open Record:** Directly open a record in the editor.
  - **Sign Record:** Cryptographically sign your record to ensure
  its integrity and authenticity.
  - **Push Record:** Publish your records to the directory.
- **MCP Server Integration:** Import and install a record for local MCP
server configuration.
- **VS Code Copilot Integration:**
  - **Open as Chat Mode:** Open a record as a VSCode Github Copilot Chat Mode configuration.
  - **Convert to OASF:** Convert an existing VSCode Github Copilot Chat Mode configuration file
  (`.chatmode.md`) into an OASF formatted record.

## Requirements

- [Visual Studio Code](https://code.visualstudio.com/) (version 1.102.0 or higher)
- [`dirctl` CLI](https://docs.agntcy.org/dir/hosted-agent-directory/#pre-req-1-install-dirctl): 
This extension requires the `dirctl` command-line tool to be installed and
available in your system's PATH or configured in the extension settings.
If not available, it will be download by the extension.

## Extension Settings

This extension contributes the following settings, which can be configured in
your VS Code `settings.json` file:

- `agntcy.agent-directory.directoryURL`: URL of the Agent Directory. (Default: `https://agent-directory.outshift.com`). This can be a private running intance of the directory or the publicly hosted one.
- `agntcy.agent-directory.dirctlBinary`: Path to the `dirctl` binary. (Default:
`~/.agntcy/bin/dirctl`)

## Known Issues

There are no known issues at this time. Please report any bugs or feature
requests on the [GitHub issues
page](https://github.com/outshift-open/agntcy-dir-vscode-extension/issues).

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated. For detailed contributing guidelines, please see [contributing guidelines](CONTRIBUTING.md).


### Copyright Notice

[Copyright Notice and License](./LICENSE.txt)

Copyright © 2025 Cisco Systems, Inc. and its affiliates.
All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

**Enjoy!**
