/**
 * Icon Badger - A tool for adding badges to your application icons
 * Main application logic
 */

const { createApp, ref, computed, watch, onMounted } = Vue;

// Application configuration
const APP_STORAGE_KEY = "icon-badger-settings";
const TOAST_DURATION = 2000; // milliseconds

createApp({
  setup() {
    // ----------------
    // State management
    // ----------------
    const imageFile = ref(null);
    const imagePreview = ref("");
    const imageType = ref("");
    const badgeText = ref("Debug");
    const badgeColor = ref("#ff0000");
    const versionText = ref("");
    const versionColor = ref("#000000");
    const isDragging = ref(false);
    const lastSaved = ref(Date.now());

    // --------------
    // Computed props
    // --------------
    const hasImage = computed(() => imagePreview.value !== "");

    // -----------------
    // Lifecycle methods
    // -----------------
    onMounted(() => {
      // Load saved settings from localStorage
      loadSettings();

      // Set up background pattern
      setupBackground();

      // Setup watchers for auto-saving settings
      setupAutoSave();

      // Add browser cache control hints
      addCacheControl();
    });

    // -------------
    // Watch effects
    // -------------
    function setupAutoSave() {
      // Watch for changes to save to localStorage
      watch([badgeText, badgeColor, versionText, versionColor], () => {
        // Debounce saving to avoid excessive writes
        const now = Date.now();
        if (now - lastSaved.value > 500) {
          // Only save if 500ms have passed since last save
          saveSettings();
          lastSaved.value = now;
        }
      });
    }

    // ---------------
    // Method handlers
    // ---------------

    /**
     * Triggers file input click when the preview area is clicked
     */
    function triggerFileInput() {
      if (!hasImage.value) {
        document.getElementById("fileInput").click();
      }
    }

    /**
     * Handles file selection from the file input
     * @param {Event} event - The file selection event
     */
    function onFileSelected(event) {
      const file = event.target.files[0];
      if (file && file.type.match("image.*")) {
        processImageFile(file);
      }
    }

    /**
     * Handles drag over event for the drop zone
     */
    function onDragOver() {
      isDragging.value = true;
    }

    /**
     * Handles drag leave event for the drop zone
     */
    function onDragLeave() {
      isDragging.value = false;
    }

    /**
     * Handles file drop event
     * @param {DragEvent} event - The drop event
     */
    function onFileDrop(event) {
      isDragging.value = false;
      event.preventDefault();

      const file = event.dataTransfer.files[0];
      if (file && file.type.match("image.*")) {
        processImageFile(file);
      }
    }

    /**
     * Processes the selected image file
     * @param {File} file - The image file to process
     */
    function processImageFile(file) {
      // Use object URL for better performance and memory management
      if (imagePreview.value) {
        URL.revokeObjectURL(imagePreview.value);
      }

      imageFile.value = file;
      imageType.value = file.type;

      // Create an efficient object URL instead of data URL
      imagePreview.value = URL.createObjectURL(file);

      // Save settings after image is processed
      saveSettings();
    }

    /**
     * Handles preset selection from dropdown
     * @param {Event} event - The change event
     */
    function onPresetChange(event) {
      const selectedValue = event.target.value;

      // Define preset configurations
      const presets = {
        debug: { text: "Debug", color: "#ff0000" },
        preview: { text: "Preview", color: "#ffa500" },
        sandbox: { text: "Sandbox", color: "#4b0082" },
        beta: { text: "Beta", color: "#0000ff" },
        alpha: { text: "Alpha", color: "#00aa00" },
      };

      if (presets[selectedValue]) {
        setPreset(presets[selectedValue].text, presets[selectedValue].color);
      }
    }

    /**
     * Sets a preset badge configuration
     * @param {string} text - The badge text
     * @param {string} color - The badge color in hex format
     */
    function setPreset(text, color) {
      // Apply with subtle animation effect
      const badgeEl = document.querySelector(".badge-ribbon");
      if (badgeEl) {
        badgeEl.classList.add("animate-change");
        setTimeout(() => badgeEl.classList.remove("animate-change"), 300);
      }

      badgeText.value = text;
      badgeColor.value = color;

      // Show toast message only if there's an image
      if (imagePreview.value) {
        showToast(`${text} preset applied`);
      }
    }

    /**
     * Converts hex color to rgba
     * @param {string} hex - Hex color code
     * @param {number} alpha - Alpha transparency value
     * @returns {string} - RGBA color string
     */
    function hexToRgba(hex, alpha) {
      if (!hex) return `rgba(0, 0, 0, ${alpha})`;

      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Creates and downloads the badged image
     */
    function downloadImage() {
      // Show processing feedback
      showToast("Preparing download...");

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.getElementById("logoPreview");

      // Set canvas dimensions based on image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw base image with smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0);

      // Add badge ribbon (bottom)
      const ribbonHeight = Math.max(36, canvas.height / 8);
      ctx.fillStyle = hexToRgba(badgeColor.value, 0.75);
      ctx.fillRect(0, canvas.height - ribbonHeight, canvas.width, ribbonHeight);

      // Add badge text with improved rendering
      ctx.fillStyle = "white";
      const fontSize = Math.max(20, ribbonHeight * 0.6);
      ctx.font = `bold ${fontSize}px Roboto, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Add text shadow for better readability
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(
        badgeText.value || "Badge",
        canvas.width / 2,
        canvas.height - ribbonHeight / 2
      );

      // Reset shadow settings
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Add version ribbon if specified (top)
      if (versionText.value.trim()) {
        ctx.fillStyle = hexToRgba(versionColor.value, 0.75);
        ctx.fillRect(0, 0, canvas.width, ribbonHeight);

        // Add text shadow again for better readability
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(versionText.value, canvas.width / 2, ribbonHeight / 2);

        // Reset shadow settings
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      // Determine output format based on input
      let outputType = "image/png";
      let filename = `icon_${(badgeText.value || "badge")
        .toLowerCase()
        .replace(/\s+/g, "_")}`;

      // Preserve original format if possible, with fallback to PNG
      if (imageType.value === "image/svg+xml") {
        outputType = "image/svg+xml";
        filename += ".svg";
        downloadSvgVersion(canvas, img, filename);
        return;
      } else if (imageType.value === "image/jpeg") {
        outputType = "image/jpeg";
        filename += ".jpg";
      } else {
        filename += ".png";
      }

      // Download the image
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL(outputType, 1.0);
      link.click();

      // Show toast notification
      showToast("Image downloaded successfully!");
    }

    /**
     * Downloads the SVG version of the processed image
     * @param {HTMLCanvasElement} canvas - The canvas with the processed image
     * @param {HTMLImageElement} img - The original image element
     * @param {string} filename - The filename for the download
     */
    function downloadSvgVersion(canvas, img, filename) {
      // Create SVG with embedded image and overlay ribbons
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", img.naturalWidth);
      svg.setAttribute("height", img.naturalHeight);
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      // Add the base image
      const imageData = canvas.toDataURL("image/png");
      const imageElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "image"
      );
      imageElement.setAttribute("width", img.naturalWidth);
      imageElement.setAttribute("height", img.naturalHeight);
      imageElement.setAttribute("href", imageData);
      svg.appendChild(imageElement);

      // Convert SVG to a blob
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml" });

      // Download
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);

      // Show toast notification
      showToast("SVG downloaded successfully!");
    }

    /**
     * Resets all application state
     */
    function resetAll() {
      // Revoke any existing object URLs to prevent memory leaks
      if (imagePreview.value) {
        URL.revokeObjectURL(imagePreview.value);
      }

      // Reset all state values
      imageFile.value = null;
      imagePreview.value = "";
      imageType.value = "";
      badgeText.value = "Debug";
      badgeColor.value = "#ff0000";
      versionText.value = "";
      versionColor.value = "#000000";

      // Clear file input
      document.getElementById("fileInput").value = "";

      // Save the reset state to localStorage
      saveSettings();

      // Show toast notification
      showToast("All settings reset");
    }

    /**
     * Shows a toast notification
     * @param {string} message - The message to display
     */
    function showToast(message) {
      // Only show toast when there's an image or it's an action not related to loading settings
      if (imagePreview.value || message !== "Settings loaded") {
        const toast = document.getElementById("toast");
        const toastMessage = document.getElementById("toastMessage");

        toastMessage.textContent = message;
        toast.classList.add("visible");

        setTimeout(() => {
          toast.classList.remove("visible");
        }, TOAST_DURATION);
      }
    }

    /**
     * Sets up the background pattern
     */
    function setupBackground() {
      // Add the bg-pattern class to body
      document.body.classList.add("bg-pattern");
    }

    /**
     * Saves current settings to localStorage
     */
    function saveSettings() {
      const settings = {
        badgeText: badgeText.value,
        badgeColor: badgeColor.value,
        versionText: versionText.value,
        versionColor: versionColor.value,
        // Store image reference if available
        imageData: imagePreview.value
          ? {
              type: imageType.value,
              // Store only the Object URL reference, not the full data
              // This is more efficient for localStorage
              url: imagePreview.value,
            }
          : null,
      };

      try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(settings));
        // Don't show toast for auto-saves to avoid UI noise
      } catch (error) {
        console.error("Error saving settings:", error);
        // Handle localStorage quota exceeded
        if (error.name === "QuotaExceededError") {
          showToast("Storage limit reached. Some settings may not be saved.");
        }
      }
    }

    /**
     * Loads settings from localStorage
     */
    function loadSettings() {
      try {
        const settings = JSON.parse(localStorage.getItem(APP_STORAGE_KEY));

        if (settings) {
          badgeText.value = settings.badgeText || "Debug";
          badgeColor.value = settings.badgeColor || "#ff0000";
          versionText.value = settings.versionText || "";
          versionColor.value = settings.versionColor || "#000000";

          // Don't show toast when loading settings with no image
          // The original code doesn't actually load any image here, so no toast is needed
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        // If loading fails, use defaults without showing toast
      }
    }

    /**
     * Adds cache control hints for better performance
     */
    function addCacheControl() {
      // Add HTTP headers hints where possible
      const meta = document.createElement("meta");
      meta.httpEquiv = "Cache-Control";
      meta.content = "public, max-age=31536000";
      document.head.appendChild(meta);

      // Enable service worker if browser supports it
      if ("serviceWorker" in navigator) {
        // This would normally register a service worker for caching
        // But we're just setting up meta tags for now
        console.log("Service worker support detected");
      }
    }

    return {
      // State exposures
      imagePreview,
      badgeText,
      badgeColor,
      versionText,
      versionColor,
      isDragging,
      hasImage,

      // Methods
      triggerFileInput,
      onFileSelected,
      onDragOver,
      onDragLeave,
      onFileDrop,
      setPreset,
      onPresetChange,
      hexToRgba,
      downloadImage,
      resetAll,
    };
  },
}).mount("#app");

// Add animation keyframes for badge ribbons
document.addEventListener("DOMContentLoaded", function () {
  // Add a CSS class for the animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes animate-change {
      0% { transform: translateY(0); }
      50% { transform: translateY(2px); }
      100% { transform: translateY(0); }
    }
    .animate-change {
      animation: animate-change 0.3s ease;
    }
  `;
  document.head.appendChild(style);
});
