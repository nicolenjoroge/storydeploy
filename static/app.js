//app.js functions:
// Dynamic rendering of CMS Portal content from JSON File
// Form Validation
// Handle post, put and delete changes

let editingIndex = null;
let editingType = null;

let serverSnapshot = {};
let state = {};

const mainContent = document.getElementById("main-content");

const API_BASE = "";
``;

function updateSidebar(section) {
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.remove("active");
  });

  const map = {
    section2: "nav-rea",
    section3: "nav-innov",
    section4: "nav-hof",
    section5: "nav-dyk",
  };

  const activeId = map[section];
  if (activeId) {
    document.getElementById(activeId)?.classList.add("active");
  }
}

let currentView = {
  section: null, // e.g. "section4"
  form: null, // e.g. "hof"
  idx: null, // e.g. 2
};

function setView(section, form = null, idx = null, tab = undefined) {
  try {
    const preserveTab =
      tab !== undefined
        ? tab
        : currentView.section === section
        ? currentView.tab
        : "shaped_us";

    currentView = { section, form, idx, tab: preserveTab };
    sessionStorage.setItem("currentView", JSON.stringify(currentView));
    updateSidebar(section);
  } catch (err) {
    console.error("setView error:", err);
  }
}

function restoreView() {
  const saved = sessionStorage.getItem("currentView");
  if (saved) currentView = JSON.parse(saved);
}

function fadeRerender(fn, ...args) {
  const renderFn = typeof fn === "string" ? window[fn] : fn;
  mainContent.classList.add("fading");

  setTimeout(() => {
    renderFn(...args);
    mainContent.classList.remove("fading");
  }, 150);
}

let loaderTimer = null;

function showLoader(message = "Loading...") {
  const loader = document.getElementById("app-loader");
  const msg = document.getElementById("app-loader-msg");
  if (msg) msg.textContent = message;
  if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
  const loader = document.getElementById("app-loader");
  if (loader) loader.classList.add("hidden");
}

// Always shows for at least 'minMs' milliseconds
async function withLoader(fn, message = "Loading...", minMs = 4000) {
  showLoader(message);
  const start = Date.now();

  try {
    await fn();
  } finally {
    const elapsed = Date.now() - start;
    const remaining = minMs - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    hideLoader();
  }
}

let db;

function openDraftDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("storyhub", 1);

    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("draft");
    };

    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    req.onerror = () => reject(req.error);
  });
}

//Load All Content from the last saved Snapshot
const loadContent = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/content`);

    const data = await res.json();

    serverSnapshot = structuredClone(data);
    state = structuredClone(data);
  } catch (err) {
    console.error("Error fetching content:", err);
    mainContent.innerHTML =
      "<p>Error loading content. Please try again later.</p>";
    return;
  }
};

//Loading screen
function ensureDataLoad() {
  if (!state) {
    mainContent.innerHTML = "<p>Loading content, please wait...</p>";
    return false;
  }
  return true;
}

//#### EDIT FUNCTION
function editItem(type, idx) {
  editingType = type;
  editingIndex = idx;

  if (type === "initiatives") {
    fadeRerender(renderInitiativeForm, idx);
  }

  if (type === "hof") {
    fadeRerender(renderHofForm, idx);
  }

  if (type === "dyk") {
    fadeRerender(renderDykForm, idx);
  }
}

//## ADD ITEM FUNCTION
function newItem(type, category) {
  if (type === "initiatives") {
    state.section_3.initiatives.push({
      name: "",
      business_area: "",
      solution_type: "RPA",
      category: category || currentView.tab || "shaped_us",
      description: "",
      tangible_benefits: [{ type: "man_hours", value: 0 }],
      image: "",
    });

    editItem("initiatives", state.section_3.initiatives.length - 1);
  } else if (type === "hof") {
    state.section_4.innovations.push({
      name: "",
      description: "",
      video: "",
    });

    editItem("hof", state.section_4.innovations.length - 1);
  } else if (type === "dyk") {
    state.section_5.items.push({
      name: "",
      description: "",
      benefits: [],
    });

    editItem("dyk", state.section_5.items.length - 1);
  }
}

//## DELETE ITEM FUNCTION
async function deleteItem(type, idx) {
  if (!confirm("Delete this item?")) return;

  let section, list;

  if (type === "initiatives") {
    section = 3;
    list = "initiatives";
  }

  if (type === "hof") {
    section = 4;
    list = "innovations";
  }

  if (type === "dyk") {
    section = 5;
    list = "items";
  }

  await fetch(`${API_BASE}/${section}/${list}/${idx}`, {
    method: "DELETE",
  });

  // update state locally (faster + no flicker)
  if (type === "initiatives") {
    const item = state.section_3.initiatives[idx];
    if (item.image) deleteUploadedFile(item.image);
    state.section_3.initiatives.splice(idx, 1);
    fadeRerender(renderSection3);
  }

  if (type === "hof") {
    const item = state.section_4.innovations[idx];
    if (item.image) deleteUploadedFile(item.image);
    if (item.video) deleteUploadedFile(item.video);
    state.section_4.innovations.splice(idx, 1);
    fadeRerender(renderSection4);
  }

  if (type === "dyk") {
    state.section_5.items.splice(idx, 1);
    fadeRerender(renderSection5);
  }
}

async function handleMediaUpload(input, idx, section, field, renderFnName) {
  const file = input.files[0];
  if (!file) return;

  await withLoader(async () => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(300000),
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    const url = data.url;

    if (section === "initiatives") {
      state.section_3.initiatives[idx][field] = url;
    } else if (section === "hof") {
      state.section_4.innovations[idx][field] = url;
    }

    persistDraftLocally();
    window[renderFnName](idx);
    makeDirty();
  }, `Uploading ${file.name}...`);
}

async function removeMedia(idx, section, field, renderFnName) {
  const url =
    section === "hof"
      ? state.section_4.innovations[idx][field]
      : state.section_3.initiatives[idx][field];

  await withLoader(async () => {
    document.querySelectorAll("video, img").forEach((el) => {
      const src = el.src || el.currentSrc || el.querySelector?.("source")?.src;
      if (src === url) {
        if (el.tagName === "VIDEO") {
          el.pause();
          el.removeAttribute("src");
          el.innerHTML = "";
          el.load();
        } else {
          el.removeAttribute("src");
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    await deleteUploadedFile(url);

    if (section === "hof") {
      state.section_4.innovations[idx][field] = "";
    } else {
      state.section_3.initiatives[idx][field] = "";
    }

    persistDraftLocally();
    makeDirty();
    fadeRerender(window[renderFnName], idx);
  }, "Removing media...");
}

//Delete file from uploads/ when Remove is clicked
async function deleteUploadedFile(url) {
  console.log("deleteUploadedFile called with:", url); // ← what is this?
  if (!url) return;
  // Extract filename from full URL e.g. http://localhost:8000/stream/abc123.mp4
  const filename = url.split("/").pop();
  console.log("extracted filename:", filename); // ← is this correct?
  try {
    const res = await fetch(`${API_BASE}/media/${filename}`, {
      method: "DELETE",
    });
    console.log("delete status:", res.status); // ← is this 200?
  } catch (err) {
    console.error("Failed to delete file:", err);
  }
}

function showUploadLoader(fieldId, fileName, fileSize) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const sizeMB = (fileSize / 1024 / 1024).toFixed(1);

  field.innerHTML = `
    <div style="
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:12px;padding:32px;
      border:2px dashed #d1d5db;border-radius:10px;
      background:#fafafa;color:#6b7280;
    ">
      <div class="upload-spinner"></div>
      <span style="font-size:13px;font-weight:500;">Uploading ${fileName}</span>
      <span style="font-size:11px;">${sizeMB} MB — please wait</span>
    </div>
  `;
}

//Check for any Local changes made on forms So as to enable 'Publish' button
function makeDirty() {
  const dirty = JSON.stringify(state) !== JSON.stringify(serverSnapshot);

  const pushBtn = document.getElementById("main-save-btn");
  const saveStatus = document.getElementById("save-status");

  if (pushBtn) pushBtn.disabled = !dirty;
  if (saveStatus)
    saveStatus.textContent = dirty ? "Unsaved Changes" : "All Changes Saved";

  // ✅ Only persist if not called from handleMediaUpload
  // (handleMediaUpload persists manually before calling this)
}

// Separate function for explicit persist calls
function markDirtyAndPersist() {
  makeDirty();
  persistDraftLocally();
}

//Cache changes made if not published
function persistDraftLocally() {
  if (!db) return;

  // ✅ Ensure media URLs from state are preserved
  const snapshot = structuredClone(state);

  const tx = db.transaction("draft", "readwrite");
  tx.objectStore("draft").put(
    { data: snapshot, savedAt: Date.now() },
    "current",
  );
}

async function pushChanges() {
  const confirmed = confirm("Are you sure you want to publish all changes?");
  if (!confirmed) return;

  await withLoader(async () => {
    const res = await fetch(`${API_BASE}/`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });

    if (!res.ok) throw new Error("Save failed");

    serverSnapshot = structuredClone(state);
    clearDraft();
  }, "Publishing changes...");

  // Update UI after loader closes
  const pushBtn = document.getElementById("main-save-btn");
  const saveStatus = document.getElementById("save-status");
  if (pushBtn) {
    pushBtn.disabled = true;
    pushBtn.textContent = "Publish";
  }
  if (saveStatus) saveStatus.textContent = "All Changes Saved";
}

//Restore from most recent cache
let draftRestored = false;

// 1. Fix restoreDraftFromLocal to return a Promise so it can be awaited
function restoreDraftFromLocal() {
  return new Promise((resolve) => {
    if (!db || draftRestored) return resolve();

    const tx = db.transaction("draft", "readonly");
    const req = tx.objectStore("draft").get("current");

    req.onsuccess = () => {
      if (!req.result) return resolve();

      const draft = req.result.data || req.result;

      if (!draft?.section_2?.metrics || !draft?.section_4?.innovations) {
        clearDraft();
        return resolve();
      }

      mergeMediaFromServer(draft, serverSnapshot);
      state = draft;
      draftRestored = true;
      resolve();
    };

    req.onerror = () => resolve(); // don't block on error
  });
}

function mergeMediaFromServer(draft, server) {
  // Initiatives — keep server URL if draft has empty image
  draft.section_3?.initiatives?.forEach((item, i) => {
    const serverItem = server.section_3?.initiatives?.[i];
    if (!item.image && serverItem?.image) item.image = serverItem.image;
  });

  // HoF — keep server URL if draft has empty image or video
  draft.section_4?.innovations?.forEach((item, i) => {
    const serverItem = server.section_4?.innovations?.[i];
    if (!item.image && serverItem?.image) item.image = serverItem.image;
    if (!item.video && serverItem?.video) item.video = serverItem.video;
  });
}

function clearDraft() {
  if (!db) return;
  const tx = db.transaction("draft", "readwrite");
  tx.objectStore("draft").delete("current");
}

// RENDERING ALL SECTIONS: REA BACKGROUND, INNOVATION PORTFOLIO, HALL OF FAME, DID YOU KNOW

//#1. REA BACKGROUND RENDER
function renderSection2() {
  if (!ensureDataLoad()) return;

  const data = state.section_2;

  setView("section2");
  mainContent.innerHTML = `
    <div class="content-header">
      <div class="content-title">REA Background</div>
    </div>

<!-- Metrics Cards -->
    <div class="form-card">
      <div class="form-card-title">Metrics</div>
      <div class="metrics-grid">
        ${Object.entries(data.metrics)
          .map(
            ([key, value]) => `
          <div class="metric-card">
            <div class="metric-card-label">${key.replace(/_/g, " ")}</div>
            <input
              class="metric-card-input"
              value="${value}"
              oninput="state.section_2.metrics['${key}'] = parseInt(this.value, 10) || 0; markDirtyAndPersist();"
            />
          </div>
        `,
          )
          .join("")}
      </div>
    </div>


<!-- Description Card -->
<div class="form-card">
  <div class="form-card-title">Description</div>
  <div class="form-grid">
    <div class="field form-full">
      <label>Description</label>
      <textarea
        rows="6"
        oninput="
          state.section_2.description = this.value.split('\n\n');
          markDirtyAndPersist();
        "
      >${data.description.join("\n\n")}</textarea>
    </div>

    <!-- Closing Statement Card -->
      <div class="field form-full" style="margin-top: 12px;">
        <label>Closing Statement</label>
        <textarea
          oninput="state.section_2.closing = this.value; markDirtyAndPersist();"
          rows="2"
        >${data.closing}</textarea>
      </div>
    </div>   
  `;
}

//#2. INNOVATION PORTFOLIO RENDER
const SECTION3_TABS = [
  { key: "shaped_us", label: "Innovations That Shaped Us" },
  { key: "in_action", label: "Innovations In Action" },
];

function switchSection3Tab(tab) {
  if (currentView.tab === tab) return;
  currentView.tab = tab;
  sessionStorage.setItem("currentView", JSON.stringify(currentView));
  fadeRerender(renderSection3);
}

function renderSection3() {
  if (!ensureDataLoad()) return;

  const initiatives = state.section_3?.initiatives || [];
  const activeTab = currentView.tab || "shaped_us";

  setView("section3", null, null, activeTab);

  const visible = initiatives
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => (item.category || "shaped_us") === activeTab);

  mainContent.innerHTML = `
    <div class="content-header">
      <div class="content-title">Innovation Portfolio</div>
      <button class="save-btn" onclick="newItem('initiatives', '${activeTab}')">
        + Add Initiative
      </button>
    </div>

    <div class="tabs">
      ${SECTION3_TABS.map(
        (t) => `
        <div class="tab ${activeTab === t.key ? "active" : ""}" onclick="switchSection3Tab('${t.key}')">
          ${t.label}
        </div>
      `,
      ).join("")}
    </div>

    ${
      visible.length
        ? visible
            .map(
              ({ item, idx }) => `
      <div class="list-item" onclick="editItem('initiatives', ${idx})">
        <div>
          <div class="list-item-title">${item.name}</div>
          <div class="list-item-meta">${item.business_area}</div>
        </div>
        <div class="list-item-right">
          <span class="badge">${item.solution_type}</span>
          <span class="badge"></span>
        </div>
      </div>
    `,
            )
            .join("")
        : `
      <div class="empty-state">
        <span class="empty-icon-char">＋</span>
        <p>No initiatives in this category yet</p>
      </div>
    `
    }
  `;
}

//#3. HALL OF FAME RENDER
function renderSection4() {
  if (!ensureDataLoad()) return;

  const items = state.section_4.innovations;

  setView("section4");

  if (!items.length) {
    mainContent.innerHTML = `
      <h2>Hall of Fame</h2>
      <p>No innovations available</p>
    `;
    return;
  }

  mainContent.innerHTML = `
    <div class = "content-header">
    <div class="content-title">Hall of Fame</div>
    <button class="save-btn" onclick="newItem('hof')">
      + Add Innovation
    </button>
    </div>

    ${items
      .map(
        (item, idx) => `
      <div class="list-item" onclick="editItem('hof', ${idx})">
        <div>
          <div class="list-item-title">${item.name}</div>
          <div class="list-item-meta">${item.description}</div>
        </div>
        <div class="list-item-right">
          <span class="badge">
            ${(item.capabilities || []).length} capabilities
          </span>
        </div>
      </div>
    `,
      )
      .join("")}
  `;
}

//#4. DID YOU KNOW SERIES RENDER
function renderSection5() {
  if (!ensureDataLoad()) return;

  const items = state.section_5.items;

  setView("section5");

  if (!items.length) {
    mainContent.innerHTML = `
      <h2>Did You Know Series</h2>
      <p>No items available</p>
    `;
    return;
  }

  mainContent.innerHTML = `
    <div class = "content-header">
    <div class="content-title">Did You Know Series</div>
    <button class="save-btn" onclick="newItem('dyk')">
      + Add Did You Know Item
    </button>
    </div>

    ${items
      .map(
        (item, idx) => `
      <div class="list-item" onclick="editItem('dyk', ${idx})">
        <div>
          <div class="list-item-title">${item.name}</div>
          <div class="list-item-meta">${item.description}</div>
        </div>
        <div class="list-item-right">
          <span class="badge">
            ${(item.benefits || []).length} benefits
          </span>
        </div>
      </div>
    `,
      )
      .join("")}
  `;
}

// ------RENDERING ALL FORMS PER ITEM ON CLICK ----------- //

//##1 INITIATIVES FORM RENDER
function renderInitiativeForm(idx, errors = {}) {
  setView("section3", "initiatives", idx);

  const item = state.section_3.initiatives[idx];

  const fieldError = (key) =>
    errors[key] ? `<span class="field-error">${errors[key]}</span>` : "";

  mainContent.innerHTML = `
    <div class="content-header">
      <div>
        <div style="font-size:12px;color:var(--teal);cursor:pointer;margin-bottom:4px;" onclick="editingIndex=null;renderSection3()">← Initiatives</div>
        <div class="content-title">${item.name || "New initiative"}</div>
      </div>
      <button class="delete-btn" onclick="deleteItem('initiatives', ${idx})">Delete</button>
    </div>

    <div class="form-card">
      <div class="form-card-title">Initiative Details</div>
      <div class="form-grid">

        <div class="field">
          <label>Name</label>
          <input
            value="${item.name}"
            oninput="state.section_3.initiatives[${idx}].name = this.value; markDirtyAndPersist();">
          ${fieldError("name")}
        </div>

        <div class="field">
          <label>Business Area</label>
          <input
            value="${item.business_area}"
            oninput="state.section_3.initiatives[${idx}].business_area=this.value; markDirtyAndPersist();">
          ${fieldError("business_area")}
        </div>

        <div class="field">
  <label>Solution Type</label>
  <select
    onchange="state.section_3.initiatives[${idx}].solution_type=this.value; markDirtyAndPersist();">
    <option value="" ${!item.solution_type ? "selected" : ""}>Select type...</option>
    <option value="RPA" ${item.solution_type === "RPA" ? "selected" : ""}>RPA</option>
    <option value="Power Apps" ${item.solution_type === "Power Apps" ? "selected" : ""}>Power Apps</option>
    <option value="Agentic AI" ${item.solution_type === "Agentic AI" ? "selected" : ""}>Agentic AI</option>
    <option value="LLM" ${item.solution_type === "LLM" ? "selected" : ""}>LLM</option>
  </select>
  ${fieldError("solution_type")}
</div>
<div class="field">
  <label>Category</label>
  <select
    onchange="state.section_3.initiatives[${idx}].category=this.value; markDirtyAndPersist();">
    <option value="shaped_us" ${(item.category || "shaped_us") === "shaped_us" ? "selected" : ""}>Innovations That Shaped Us</option>
    <option value="in_action" ${item.category === "in_action" ? "selected" : ""}>Innovations In Action</option>
  </select>
  ${fieldError("category")}
</div>

        <div class="field form-full">
          <label>Description</label>
          <textarea
            rows="5"
            oninput="state.section_3.initiatives[${idx}].description = this.value; markDirtyAndPersist();"
          >${item.description}</textarea>
          ${fieldError("description")}
        </div>

        <!-- Tangible Benefits (multiple) -->
        <div class="field form-full">
          <label>Tangible Benefits</label>

          <div class="benefits-list">
            ${(item.tangible_benefits || [])
              .map(
                (b, bIdx) => `
              <div class="benefit-row">
                <input
                  list="benefit-types"
                  class="benefit-type-input"
                  placeholder="Type (e.g. man_hours)"
                  value="${b.type || ""}"
                  oninput="state.section_3.initiatives[${idx}].tangible_benefits[${bIdx}].type = this.value; markDirtyAndPersist();">
                <input
                  type="number"
                  class="benefit-value-input"
                  placeholder="Value"
                  value="${b.value ?? ""}"
                  oninput="state.section_3.initiatives[${idx}].tangible_benefits[${bIdx}].value = Number(this.value); markDirtyAndPersist();">
                <button type="button" class="benefit-remove-btn"
                  onclick="removeTangibleBenefit(${idx}, ${bIdx})">✕</button>
              </div>
            `,
              )
              .join("")}
          </div>

          <datalist id="benefit-types">
            <option value="man_hours">
            <option value="cost_savings_kes">
            <option value="users">
            <option value="papers_saved">
            <option value="envelopes_processed">
            <option value="same_day_completion_pct">
          </datalist>

          <button type="button" class="add-benefit-btn" onclick="addTangibleBenefit(${idx})">
            + Add Benefit
          </button>

          ${fieldError("tangible_benefits")}
        </div>

        <!-- Image Upload -->
        <div class="field form-full" id="init-img-field-${idx}">
          <label>Initiative Image</label>

          ${
            item.image
              ? `
            <div class="image-preview-wrapper">
              <img src="${item.image}" class="image-preview" alt="Initiative image"/>
              <button type="button" class="image-remove-btn"
                onclick="removeMedia(${idx}, 'initiatives', 'image', 'renderInitiativeForm')">
                Remove
              </button>
            </div>
          `
              : `
            <div class="image-upload-area" onclick="document.getElementById('img-upload-${idx}').click()">
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M4 16l4-4 4 4 4-6 4 6M4 20h16M12 4v8"/>
              </svg>
              <span>Click to upload image</span>
              <span style="font-size:11px;color:#9ca3af">PNG, JPG, WEBP up to 2MB</span>
            </div>
          `
          }

          <input type="file" id="img-upload-${idx}" accept="image/*" style="display:none">
        </div>

      </div>

      <button type="button" class="save-btn"
        onclick="handleDone('initiative', ${idx}, renderInitiativeForm, renderSection3)">
        Done
      </button>
    </div>
  `;

  const imgInput = document.getElementById(`img-upload-${idx}`);
  if (imgInput) {
    imgInput.addEventListener("change", () =>
      handleMediaUpload(
        imgInput,
        idx,
        "initiatives",
        "image",
        "renderInitiativeForm",
      ),
    );
  }
}

//### HALL OF FAME FORM RENDER
function renderHofForm(idx, errors = {}) {
  setView("section4", "hof", idx);

  const item = state.section_4.innovations[idx];

  mainContent.innerHTML = `
    <div class="content-header">
      <div>
        <div style="font-size:12px;color:var(--teal);cursor:pointer;margin-bottom:4px;" onclick="editingIndex=null;renderSection4()">← Innovations</div>
        <div class="content-title">${item.name || "New initiative"}</div>
      </div>
      <button class="delete-btn" onclick="deleteItem('hof',${idx})">Delete</button>
    </div>

    <div class="form-card">
      <div class="form-card-title">
        Innovation Details
      </div>

      <div class="form-grid">

        <div class="field">
          <label>Name</label>
          <input
            value="${item.name}"
            oninput="
  state.section_4.innovations[${idx}].name = this.value;
  markDirtyAndPersist();
">
${fieldError(errors, "name")}
        </div>

        <div class="field form-full">
          <label>Description</label>
          <textarea
            oninput="state.section_4.innovations[${idx}].description=this.value;">${item.description}</textarea>
            ${fieldError(errors, "description")}
        </div>


        <!-- Video Upload -->
        <div class="field form-full" id="hof-vid-field-${idx}">
          <label>Video</label>
          
        ${
          item.video && !item.video.includes("undefined")
            ? `
          <div class="image-preview-wrapper">
            <video
              id="hof-vid-preview-${idx}"
              controls
              preload="metadata"
              class="image-preview"
              style="max-height:220px;width:100%;"
            >
              <source src="${item.video}" type="video/mp4">
            </video>
            <button type="button" class="image-remove-btn"
              onclick="removeMedia(${idx}, 'hof', 'video', 'renderHofForm')">
                Remove
            </button>
          </div>
          `
            : `
            <div class="image-upload-area" onclick="document.getElementById('hof-vid-${idx}').click()">
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
              <span>Click to upload video</span>
              <span style="font-size:11px;color:#9ca3af">MP4 up to 500MB</span>
            </div>
          `
        }
          <input type="file" id="hof-vid-${idx}" accept="video/*"
            style="display:none">
        </div>
      </div>

      <button
      type="button"
        class="save-btn"
        onclick="handleDone('hof', ${idx}, renderHofForm, renderSection4);">
        Done
      </button>
    </div>
  `;
  const vidInput = document.getElementById(`hof-vid-${idx}`);

  if (vidInput) {
    vidInput.addEventListener("change", () =>
      handleMediaUpload(vidInput, idx, "hof", "video", "renderHofForm"),
    );
  }

  if (item.video) {
    // Check if video URL is still valid
    fetch(item.video, { method: "HEAD" })
      .then((res) => {
        if (!res.ok) {
          console.warn("Video URL invalid, clearing");
          state.section_4.innovations[idx].video = "";
          persistDraftLocally();
          fadeRerender(renderHofForm, idx);
        }
      })
      .catch(() => {
        state.section_4.innovations[idx].video = "";
        persistDraftLocally();
        fadeRerender(renderHofForm, idx);
      });
  }
}

//## DID YOU KNOW SERIES FORM RENDER
function renderDykForm(idx, errors = {}) {
  setView("section5", "dyk", idx);

  const item = state.section_5.items[idx];

  mainContent.innerHTML = `
    <div class="content-header">
      <div>
        <div style="font-size:12px;color:var(--teal);cursor:pointer;margin-bottom:4px;" onclick="editingIndex=null;renderSection5()">← Did You Know</div>
        <div class="content-title">${item.name || "New Did You Know"}</div>
      </div>
      <button class="delete-btn" onclick="deleteItem('dyk',${idx})">Delete</button>
    </div>

    <div class="form-card">
      <div class="form-card-title">
        Item Details
      </div>

      <div class="form-grid">

        <div class="field">
          <label>Name</label>
          <input
            value="${item.name}"
            oninput="state.section_5.items[${idx}].name=this.value; markDirtyAndPersist();">
            ${fieldError(errors, "name")}
        </div>

        <div class="field form-full">
          <label>Description</label>
          <textarea
            oninput="state.section_5.items[${idx}].description=this.value; markDirtyAndPersist();">
            ${item.description}
          </textarea>
          ${fieldError(errors, "description")}
        </div>

        <div class="field form-full">
          <label>Benefits (comma separated)</label>
          <input
  value="${item.benefits.join(", ")}"
  oninput="
    state.section_5.items[${idx}].benefits =
    this.value.split(',').map(x => x.trim());
    markDirtyAndPersist();
  "
>
${fieldError(errors, "benefits")}
        </div>

      </div>

      <button
        type="button"
        class="save-btn"
        onclick="handleDone('dyk', ${idx}, renderDykForm, renderSection5);">
        Done
      </button>
    </div>
  `;
}

//---------- FORM VALIDATION FUNCTIONS ------------ //
function validate(item, requiredFields) {
  const errors = {};
  requiredFields.forEach((key) => {
    if (key === "tangible_benefits") {
      const benefits = item.tangible_benefits;
      if (!Array.isArray(benefits) || benefits.length === 0) {
        errors[key] = "At least one tangible benefit is required";
        return;
      }
      const invalid = benefits.some(
        (b) =>
          !b.type?.trim() ||
          b.value === null ||
          b.value === undefined ||
          isNaN(b.value),
      );
      if (invalid) errors[key] = "Each benefit needs a type and a value";
      return;
    }

    const val = key.includes(".")
      ? key.split(".").reduce((obj, k) => obj?.[k], item)
      : item[key];

    const empty =
      val === null ||
      val === undefined ||
      (typeof val === "string" && !val.trim()) ||
      (typeof val === "number" && isNaN(val)) ||
      (Array.isArray(val) && val.length === 0);

    if (empty) errors[key] = "This field is required";
  });
  return errors;
}

function fieldError(errors, key) {
  return errors[key] ? `<span class="field-error">${errors[key]}</span>` : "";
}

function fieldClass(errors, key, extra = "") {
  return `field ${extra} ${errors[key] ? "field-invalid" : ""}`.trim();
}

//--------- ERROR SCHEMAS ------------//
const SCHEMAS = {
  initiative: [
    "name",
    "business_area",
    "solution_type",
    "description",
    "tangible_benefits",
  ],
  hof: ["name", "description"],
  dyk: ["name", "description", "benefits"],
};

function addTangibleBenefit(idx) {
  const item = state.section_3.initiatives[idx];

  // ✅ Ensure array exists before pushing
  if (!Array.isArray(item.tangible_benefits)) {
    item.tangible_benefits = [];
  }

  item.tangible_benefits.push({ type: "man_hours", value: 0 });
  markDirtyAndPersist();
  renderInitiativeForm(idx);
}

function removeTangibleBenefit(idx, bIdx) {
  state.section_3.initiatives[idx].tangible_benefits.splice(bIdx, 1);
  markDirtyAndPersist();
  renderInitiativeForm(idx);
}

function handleDone(formType, idx, renderFn, afterFn) {
  const schemas = {
    initiative: () => state.section_3.initiatives[idx],
    hof: () => state.section_4.innovations[idx],
    dyk: () => state.section_5.items[idx],
  };

  const item = schemas[formType]();
  const errors = validate(item, SCHEMAS[formType]);

  if (Object.keys(errors).length > 0) {
    renderFn(idx, errors);
    return;
  }

  fadeRerender(afterFn);
  makeDirty(); // ← was empty semicolon
}

//-------------- LOADING BEHAVIOR ------------------ //
window.onload = async () => {
  await openDraftDB();
  await loadContent();
  await restoreDraftFromLocal();
  restoreView(); // ← load last known view

  // Navigate to last view instead of always going to section2
  if (currentView.form && currentView.idx !== null) {
    // Was on a form page
    if (currentView.form === "initiatives")
      fadeRerender(renderInitiativeForm, currentView.idx);
    else if (currentView.form === "hof")
      fadeRerender(renderHofForm, currentView.idx);
    else if (currentView.form === "dyk")
      fadeRerender(renderDykForm, currentView.idx);
  } else if (currentView.section) {
    // Was on a section list page
    if (currentView.section === "section2") fadeRerender(renderSection2);
    else if (currentView.section === "section3") fadeRerender(renderSection3);
    else if (currentView.section === "section4") fadeRerender(renderSection4);
    else if (currentView.section === "section5") fadeRerender(renderSection5);
  } else {
    fadeRerender(renderSection2); // default
  }
};
