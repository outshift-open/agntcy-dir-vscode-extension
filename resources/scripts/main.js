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

// This script will be run within the webview itself
(function () {
  const vscode = acquireVsCodeApi();

  const loginButton = document.getElementById("login-button");
  loginButton.addEventListener("click", () => {
    vscode.postMessage({
      type: "login-button-click",
      command: "agent-directory.login",
    });
  });

  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", () => {
    vscode.postMessage({
      type: "logout-button-click",
      command: "agent-directory.logout",
    });
  });

  const selectOrgButton = document.getElementById("select-org-button");
  selectOrgButton.addEventListener("click", () => {
    vscode.postMessage({
      type: "select-org-button-click",
      command: "agent-directory.selectOrganization"
    });
  });

  const loginMessage = document.getElementById("login-message");

  function updateView(state) {
    loginButton.style.display = "none";
    logoutButton.style.display = "none";
    loginMessage.style.display = "none";
    selectOrgButton.style.display = "none";

    if (state.dirctlMode === "standard") {
      loginMessage.innerHTML = `
        <div class="info-panel">
          <h3>Local Directory Mode</h3>
          <p>You are currently using a local directory. Search and filter agents using <code>key=value</code> syntax:</p>
          <div class="code-example">
            <code>name=my-agent-name</code>
            <code>version=v1.0.0</code>
            <code>skill-id=10201</code>
            <code>skill-name=Text Completion</code>
            <code>locator=docker-image:https://example.com/docker-image</code>
            <code>extension=my-custom-extension-name:v1.0.0</code>
          </div>
        </div>
      `;

      loginMessage.style.display = "block";
      return;
    }

    if (!state.isLoggedIn) {
      loginButton.style.display = "block";
      logoutButton.style.display = "none";
      loginMessage.style.display = "none";
      selectOrgButton.style.display = "none";
      return;
    }

    // Here we are logged in
    logoutButton.style.display = "block";
    selectOrgButton.style.display = "block";
    loginMessage.innerHTML = `You are currently logged-in as <strong>${state.user}</strong> in ${state.loggedInServer}`;
    loginMessage.style.display = "block";

    if (state.selectedOrganization) {
      selectOrgButton.textContent = `Organization: ${state.selectedOrganization.name}`;
    } else {
      selectOrgButton.textContent = "Select Organization";
    }
  }

  window.addEventListener("message", (event) => {
    const message = event.data;
    updateView(message.data);
  });
})();
