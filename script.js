(() => {
  "use strict";

  const container = document.getElementById("sites-container");
  const searchInput = document.getElementById("site-search");
  const countValue = document.getElementById("site-count");
  const countLabel = document.getElementById("count-label");
  const yearValue = document.getElementById("current-year");

  let sites = [];

  const icons = {
    globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"></path>',
    link: '<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"></path><path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"></path>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 4.2 4.2"></path>',
    alert: '<path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path><path d="M12 9v4m0 4h.01"></path>',
    arrow: '<path d="M7 17 17 7M7 7h10v10"></path>'
  };

  function iconSvg(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.globe}</svg>`;
  }

  function setCount(count) {
    countValue.textContent = String(count);
    countLabel.textContent = count === 1 ? "website" : "websites";
  }

  function showState(title, message, type = "empty") {
    const symbol = type === "error" ? "alert" : "search";
    container.replaceChildren();

    const card = document.createElement("div");
    card.className = `state-card${type === "error" ? " error" : ""}`;

    const symbolEl = document.createElement("div");
    symbolEl.className = "state-symbol";
    symbolEl.innerHTML = iconSvg(symbol);

    const heading = document.createElement("h3");
    heading.textContent = title;

    const description = document.createElement("p");
    description.textContent = message;

    card.append(symbolEl, heading, description);
    container.appendChild(card);
    container.setAttribute("aria-busy", "false");
  }

  function safeHttpUrl(rawUrl) {
    if (typeof rawUrl !== "string" || !rawUrl.trim()) return null;

    try {
      const url = new URL(rawUrl.trim(), window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function getDisplayHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  function makeSiteCard(site, index) {
    const card = document.createElement("article");
    card.className = "site-card";
    card.style.setProperty("--delay", `${Math.min(index * 45, 360)}ms`);

    const top = document.createElement("div");
    top.className = "card-top";

    const icon = document.createElement("div");
    icon.className = "site-icon";
    icon.innerHTML = iconSvg("globe");

    const headingWrap = document.createElement("div");
    headingWrap.className = "site-heading";

    const title = document.createElement("h3");
    title.className = "site-title";
    title.textContent = typeof site.title === "string" && site.title.trim()
      ? site.title.trim()
      : getDisplayHost(site.url);

    const domain = document.createElement("span");
    domain.className = "site-domain";
    domain.textContent = getDisplayHost(site.url);
    domain.title = site.url;

    headingWrap.append(title, domain);
    top.append(icon, headingWrap);

    const bottom = document.createElement("div");
    bottom.className = "card-bottom";

    const label = document.createElement("span");
    label.className = "external-label";
    label.textContent = "External website";

    const link = document.createElement("a");
    link.className = "open-link";
    link.href = site.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(document.createTextNode("Open website"));

    const arrow = document.createElement("span");
    arrow.innerHTML = iconSvg("arrow");
    link.appendChild(arrow);

    bottom.append(label, link);
    card.append(top, bottom);
    return card;
  }

  function renderSites(filter = "") {
    const query = filter.trim().toLocaleLowerCase();
    const filteredSites = sites.filter(site => {
      const title = typeof site.title === "string" ? site.title : "";
      return title.toLocaleLowerCase().includes(query) ||
        site.url.toLocaleLowerCase().includes(query);
    });

    container.replaceChildren();
    setCount(filteredSites.length);

    if (sites.length === 0) {
      showState("No websites yet", "Apni websites ko sites.json file mein add karo, phir yahan dikhengi.");
      return;
    }

    if (filteredSites.length === 0) {
      showState("No matches found", "Kisi doosre naam ya domain se search karke dekho.");
      return;
    }

    const fragment = document.createDocumentFragment();
    filteredSites.forEach((site, index) => fragment.appendChild(makeSiteCard(site, index)));
    container.appendChild(fragment);
    container.setAttribute("aria-busy", "false");
  }

  async function loadSites() {
    try {
      const response = await fetch("sites.json", { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`sites.json load failed (${response.status})`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("sites.json must contain a JSON array");
      }

      sites = data
        .filter(item => item && typeof item === "object")
        .map(item => ({ title: item.title, url: safeHttpUrl(item.url) }))
        .filter(item => item.url);

      renderSites(searchInput.value);
    } catch (error) {
      console.error("Vadhwa Portal:", error);
      setCount(0);
      showState(
        "Websites load nahi ho sakin",
        "Check karo ki sites.json file index.html ke same folder mein hai aur uska JSON format sahi hai. GitHub Pages par fetch chalane ke liye site ko web server se open karo.",
        "error"
      );
    }
  }

  searchInput.addEventListener("input", () => renderSites(searchInput.value));

  document.addEventListener("keydown", event => {
    const activeTag = document.activeElement?.tagName;
    const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || document.activeElement?.isContentEditable;

    if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      searchInput.focus();
    }

    if (event.key === "Escape" && document.activeElement === searchInput) {
      searchInput.value = "";
      renderSites("");
      searchInput.blur();
    }
  });

  yearValue.textContent = String(new Date().getFullYear());
  loadSites();
})();
