(function () {
  const vscode = acquireVsCodeApi();
  let filter = "";
  let searchText = "";
  function renderItems(items, dirctlMode) {
    const listContainer = document.querySelector(".list-container");
    listContainer.innerHTML = ""; // Clear existing items

    items.forEach((item) => {
      const card = document.createElement("div");
      const cardId = `record_${item.id}`;
      card.className = "card";
      card.id = cardId;

      const recordJson = {
        webviewSection: item.itemType,
        preventDefaultContextMenuItems: true,
        agent: {
          name: item.name,
          version: item.version,
          cid: item.cid,
        },
      };

      const cardContent = document.createElement("div");
      cardContent.className = "card-content";

      const cardIcon = document.createElement("img");
      cardIcon.className = "card-icon";
      cardIcon.src = item.iconUri;

      const cardDetails = document.createElement("div");

      const cardName = document.createElement("h3");
      cardName.className = "card-name";
      cardName.textContent = item.name;

      const cardDescription = document.createElement("p");
      cardDescription.className = "card-description";
      cardDescription.textContent = item.description;

      cardDetails.appendChild(cardName);
      cardDetails.appendChild(cardDescription);

      cardContent.appendChild(cardIcon);
      cardContent.appendChild(cardDetails);

      const cardActions = document.createElement("div");
      cardActions.className = "card-actions";

      const installButton = document.createElement("button");
      installButton.id = `install_btn_${item.itemType}`;
      installButton.className = "install-button";
      installButton.dataset.record = JSON.stringify(recordJson);
      installButton.textContent = "install";

      const settingsIcon = document.createElement("i");
      settingsIcon.className = "icon codicon codicon-gear";
      settingsIcon.id = `_${item.id}_settings`;
      settingsIcon.dataset.vscodeContext = JSON.stringify(recordJson);

      cardActions.appendChild(installButton);
      cardActions.appendChild(settingsIcon);

      if (dirctlMode === "saas") {
        const globeIcon = document.createElement("i");
        globeIcon.className = "icon codicon codicon-globe";
        globeIcon.id = `_${item.id}_browse`;
        cardActions.appendChild(globeIcon);
        card.dataset.cid = item.cid;
      }

      card.appendChild(cardContent);
      card.appendChild(cardActions);

      listContainer.appendChild(card);
    });

    const installBtns = listContainer.querySelectorAll(
      "#install_btn_mcpRecordItem"
    );
    installBtns.forEach((btn) => {
      btn.style.display = "block";
    });
  }

  const listContainer = document.querySelector(".list-container");
  listContainer.addEventListener("click", (e) => {
    const target = e.target;

    if (target.classList.contains("codicon-gear")) {
      e.preventDefault();
      target.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: e.clientX,
          clientY: e.clientY,
        })
      );
      e.stopPropagation();
    } else if (target.classList.contains("codicon-globe")) {
      e.preventDefault();
      e.stopPropagation();
      const card = target.closest(".card");
      const cardcid = card.dataset.cid;
      console.log("Opening in browser:", cardcid);
      vscode.postMessage({
        command: "agent-directory.openInbrowser",
        text: cardcid,
      });
    } else if (target.classList.contains("install-button")) {
      const record = JSON.parse(target.dataset.record);
      vscode.postMessage({
        command: "agent-directory.importAsMCPServer",
        data: record,
      });
    } else {
      const card = target.closest(".card");
      if (card) {
        vscode.postMessage({
          command: "resetSelection",
        });

        vscode.postMessage({
          command: "selectCard",
          text: card.id,
        });
      }
    }
  });

  const clearSearch = document.getElementById("clear-all");
  const searchInput = document.getElementById("search-input");

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const originalTarget = e.target.value;
      searchText = e.target.value.replaceAll(filter, "");
      e.stopPropagation();

      if (!originalTarget.includes(filter)) {
        filter = "";
        vscode.postMessage({
          command: "agent-directory.clearFilter",
        });
      }
      vscode.postMessage({
        command: "agent-directory.searchRecords",
        text: searchText,
      });
    }
  });

  const filterButton = document.getElementById("filter-search");
  filterButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.target.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        clientX: e.clientX,
        clientY: e.clientY,
      })
    );

    e.stopPropagation();
  });

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.command === "agent-directory.listRecords") {
      renderItems(message.data, message.dirctlMode);
    } else if (message.command === "selectCard") {
      const selectedCard = document.getElementById(message.text);
      selectedCard.classList.add("selected");
    } else if (message.command === "resetSelection") {
      const cards = document.querySelectorAll(".card");
      cards.forEach((card) => {
        card.classList.remove("selected");
      });
    } else if (message.command === "agent-directory.listRecordsViewLoaded") {
      clearSearch.style.cursor = "default";
      clearSearch.style.opacity = "0.6";
    } else if (message.command === "agent-directory.updateFilter") {
      searchInput.value = searchInput.value.replaceAll(filter, "");
      filter = " @" + message.text;
      searchInput.value += filter;
    }
  });
})();
