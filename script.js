"use strict";

/* ------------------------------------------------------------------
   STEP: after you deploy Code.gs as a Web app, paste its URL below.
   It looks like: https://script.google.com/macros/s/AKfy.../exec
------------------------------------------------------------------- */
const SCRIPT_URL = "PASTE_YOUR_WEB_APP_URL_HERE";

const form = document.getElementById("entry-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

const messages = {
  fullName: "Enter the name.",
  department: "Enter the department name.",
  gender: "Choose one option.",
  city: "Enter the city."
};

const fieldNames = Object.keys(messages);

function getValues() {
  const data = new FormData(form);
  const values = {};
  fieldNames.forEach((key) => {
    values[key] = String(data.get(key) || "").trim();
  });
  return values;
}

/* Live preview of the row that will be written to the sheet */
function updatePreview() {
  const values = getValues();
  fieldNames.forEach((key) => {
    document.getElementById("pv-" + key).textContent = values[key] || "\u2014";
  });
}

function setStatus(type, text) {
  statusEl.className = "status" + (type ? " " + type : "");
  statusEl.textContent = text || "";
}

function validate(values) {
  let firstInvalid = null;

  fieldNames.forEach((key) => {
    const errorEl = document.getElementById(key + "-error");
    const control = form.elements[key];
    const isInput = control instanceof HTMLInputElement;

    if (!values[key]) {
      errorEl.textContent = messages[key];
      if (isInput) control.setAttribute("aria-invalid", "true");
      if (!firstInvalid) firstInvalid = isInput ? control : control[0];
    } else {
      errorEl.textContent = "";
      if (isInput) control.removeAttribute("aria-invalid");
    }
  });

  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

function setBusy(isBusy) {
  submitBtn.disabled = isBusy;
  submitBtn.textContent = isBusy ? "Adding…" : "Add to sheet";
}

form.addEventListener("input", () => {
  updatePreview();
  setStatus("", "");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("", "");

  const values = getValues();
  if (!validate(values)) return;

  if (SCRIPT_URL.includes("PASTE_YOUR")) {
    setStatus("error", "Paste your web app URL into SCRIPT_URL in script.js first.");
    return;
  }

  setBusy(true);
  setStatus("pending", "Saving to your sheet…");

  try {
    // URLSearchParams sends a simple form POST, so the browser needs no CORS preflight.
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: new URLSearchParams(values)
    });
    const result = await response.json();

    if (result.result !== "success") {
      throw new Error(result.message || "The sheet did not accept this entry.");
    }

    setStatus("success", "Added to sheet. You can enter the next person.");
    form.reset();
    updatePreview();
    form.elements.fullName.focus();
  } catch (error) {
    if (error instanceof TypeError || error instanceof SyntaxError) {
      setStatus(
        "error",
        "Could not reach the sheet. Check the web app URL, and that access is set to Anyone."
      );
    } else {
      setStatus("error", error.message);
    }
  } finally {
    setBusy(false);
  }
});
