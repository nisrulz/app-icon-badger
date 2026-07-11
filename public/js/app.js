/**
 * Icon Badger - A tool for adding badges to your application icons
 * Main application logic
 */

const { createApp, ref, computed, watch, onMounted } = Vue;

// Application configuration
const APP_STORAGE_KEY = "icon-badger-settings";
const TOAST_DURATION = 2000;

// Shared default state values
const DEFAULTS = {
  badgeText: "Debug",
  badgeColor: "#ff0000",
  versionText: "",
  versionColor: "#ffffff",
};

// Preset badge configurations
const PRESETS = {
  debug: { text: "Debug", color: "#ff0000", icon: "\u{1F41B}" },
  preview: { text: "Preview", color: "#ffa500", icon: "\u{1F441}" },
  sandbox: { text: "Sandbox", color: "#4b0082", icon: "\u{1F9D6}" },
  beta: { text: "Beta", color: "#0000ff", icon: "\u{1F9EA}" },
  alpha: { text: "Alpha", color: "#00aa00", icon: "\u{1F9EC}" },
};

// ---------------
// Utility functions
// ---------------

function isImageFile(file) {
  return file && file.type.match("image.*");
}

function triggerDownload(filename, href) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = href;
  link.click();
}

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(0, 0, 0, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function withTextShadow(ctx, drawFn) {
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  drawFn();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawRibbon(ctx, { text, color, textColor, y, width, height, fontSize }) {
  ctx.fillStyle = hexToRgba(color, 0.75);
  ctx.fillRect(0, y, width, height);

  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px Inter, Roboto, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  withTextShadow(ctx, () => {
    ctx.fillText(text, width / 2, y + height / 2);
  });
}

// ---------------
// Vue application
// ---------------

createApp({
  setup() {
    // State
    const imagePreview = ref("");
    const imageType = ref("");
    const badgeText = ref(DEFAULTS.badgeText);
    const badgeColor = ref(DEFAULTS.badgeColor);
    const versionText = ref(DEFAULTS.versionText);
    const versionColor = ref(DEFAULTS.versionColor);
    const isDragging = ref(false);
    const selectedPreset = ref("");

    let lastSaved = Date.now();

    const hasImage = computed(() => imagePreview.value !== "");

    // Lifecycle
    onMounted(() => {
      loadSettings();
      setupAutoSave();
    });

    // Auto-save with throttling
    function setupAutoSave() {
      watch([badgeText, badgeColor, versionText, versionColor], () => {
        const now = Date.now();
        if (now - lastSaved > 500) {
          saveSettings();
          lastSaved = now;
        }
      });
    }

    // Toast
    let toastTimer = null;

    function showToast(message) {
      const toast = document.getElementById("toast");
      const toastMessage = document.getElementById("toastMessage");

      toastMessage.textContent = message;
      toast.classList.add("visible");

      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove("visible");
      }, TOAST_DURATION);
    }

    // Settings persistence
    function saveSettings() {
      const settings = {
        badgeText: badgeText.value,
        badgeColor: badgeColor.value,
        versionText: versionText.value,
        versionColor: versionColor.value,
      };

      try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Error saving settings:", error);
        if (error.name === "QuotaExceededError") {
          showToast("Storage limit reached. Some settings may not be saved.");
        }
      }
    }

    function loadSettings() {
      try {
        const settings = JSON.parse(localStorage.getItem(APP_STORAGE_KEY));
        if (settings) {
          badgeText.value = settings.badgeText || DEFAULTS.badgeText;
          badgeColor.value = settings.badgeColor || DEFAULTS.badgeColor;
          versionText.value = settings.versionText || DEFAULTS.versionText;
          versionColor.value = settings.versionColor || DEFAULTS.versionColor;
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }

    // Image handling
    function processImageFile(file) {
      if (imagePreview.value) {
        URL.revokeObjectURL(imagePreview.value);
      }

      imageType.value = file.type;
      imagePreview.value = URL.createObjectURL(file);
      saveSettings();

      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth !== 512 || img.naturalHeight !== 512) {
          showToast(`Icon is ${img.naturalWidth}×${img.naturalHeight}. Optimal size is 512×512`);
        }
      };
      img.src = imagePreview.value;
    }

    function handleFileSelection(file) {
      if (isImageFile(file)) {
        processImageFile(file);
      }
    }

    // File input handlers
    function triggerFileInput() {
      document.getElementById("fileInput").click();
    }

    function onFileSelected(event) {
      handleFileSelection(event.target.files[0]);
    }

    function onDragOver() {
      isDragging.value = true;
    }

    function onDragLeave() {
      isDragging.value = false;
    }

    function onFileDrop(event) {
      isDragging.value = false;
      event.preventDefault();
      handleFileSelection(event.dataTransfer.files[0]);
    }

    // Preset handling
    function setPreset(text, color) {
      const badgeEl = document.querySelector(".badge-ribbon");
      if (badgeEl) {
        badgeEl.classList.add("animate-change");
        setTimeout(() => badgeEl.classList.remove("animate-change"), 300);
      }

      badgeText.value = text;
      badgeColor.value = color;

      if (imagePreview.value) {
        showToast(`${text} preset applied`);
      }
    }

    function selectPreset(key) {
      if (selectedPreset.value === key) {
        selectedPreset.value = "";
        return;
      }
      const preset = PRESETS[key];
      if (preset) {
        selectedPreset.value = key;
        setPreset(preset.text, preset.color);
      }
    }

    // Download
    function downloadImage() {
      showToast("Preparing download...");

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.getElementById("logoPreview");

      // Scale small images up to 512x512 minimum
      const minSize = 512;
      canvas.width = Math.max(img.naturalWidth, minSize);
      canvas.height = Math.max(img.naturalHeight, minSize);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const ribbonHeight = Math.max(36, canvas.height / 8);
      const fontSize = Math.max(20, ribbonHeight * 0.6);

      // Badge ribbon (bottom)
      drawRibbon(ctx, {
        text: badgeText.value || "Badge",
        color: badgeColor.value,
        textColor: versionColor.value,
        y: canvas.height - ribbonHeight,
        width: canvas.width,
        height: ribbonHeight,
        fontSize,
      });

      // Version ribbon (top) if specified
      if (versionText.value.trim()) {
        drawRibbon(ctx, {
          text: versionText.value,
          color: badgeColor.value,
          textColor: versionColor.value,
          y: 0,
          width: canvas.width,
          height: ribbonHeight,
          fontSize,
        });
      }

      // Determine output format
      let outputType = "image/png";
      let filename = `icon_${(badgeText.value || "badge")
        .toLowerCase()
        .replace(/\s+/g, "_")}`;

      if (imageType.value === "image/svg+xml") {
        filename += ".svg";
        downloadSvgVersion(canvas, img, filename);
        return;
      } else if (imageType.value === "image/jpeg") {
        outputType = "image/jpeg";
        filename += ".jpg";
      } else {
        filename += ".png";
      }

      triggerDownload(filename, canvas.toDataURL(outputType, 1.0));
      showToast("Image downloaded successfully!");
    }

    function downloadSvgVersion(canvas, img, filename) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", img.naturalWidth);
      svg.setAttribute("height", img.naturalHeight);

      const imageData = canvas.toDataURL("image/png");
      const imageElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "image"
      );
      imageElement.setAttribute("width", img.naturalWidth);
      imageElement.setAttribute("height", img.naturalHeight);
      imageElement.setAttribute("href", imageData);
      svg.appendChild(imageElement);

      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml" });

      triggerDownload(filename, URL.createObjectURL(blob));
      showToast("SVG downloaded successfully!");
    }

    // Reset
    function resetAll() {
      if (imagePreview.value) {
        URL.revokeObjectURL(imagePreview.value);
      }

      imagePreview.value = "";
      imageType.value = "";
      badgeText.value = DEFAULTS.badgeText;
      badgeColor.value = DEFAULTS.badgeColor;
      versionText.value = DEFAULTS.versionText;
      versionColor.value = DEFAULTS.versionColor;
      selectedPreset.value = "";

      document.getElementById("fileInput").value = "";
      saveSettings();
      showToast("All settings reset");
    }

    return {
      imagePreview,
      badgeText,
      badgeColor,
      versionText,
      versionColor,
      isDragging,
      hasImage,
      selectedPreset,
      PRESETS,
      triggerFileInput,
      onFileSelected,
      onDragOver,
      onDragLeave,
      onFileDrop,
      hexToRgba,
      selectPreset,
      downloadImage,
      resetAll,
    };
  },
}).mount("#app");
