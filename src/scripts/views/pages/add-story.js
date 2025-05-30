import AddStoryPresenter from "../../presenters/AddStoryPresenter.js";
import AddStoryModel from "../../models/AddStoryModel.js";

const AddStory = {
  presenter: null,
  model: null,

  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">
          <i class="fas fa-plus-circle" aria-hidden="true"></i>
          Share Your Story
        </h2>
        
        <div id="add-story-message"></div>
        
        <form id="add-story-form" novalidate>
          <div class="form-group">
            <label for="description">Story Description</label>
            <textarea 
              id="description" 
              name="description" 
              required 
              aria-describedby="description-error"
              placeholder="Tell us about your amazing experience..."
              rows="5"
            ></textarea>
            <div id="description-error" class="error-message" style="display: none;" role="alert"></div>
          </div>
          
          <div class="form-group">
            <label for="photo-input">Photo</label>
            <input 
              type="file" 
              id="photo-input" 
              name="photo" 
              accept="image/*" 
              required
              aria-describedby="photo-error"
              style="display: none;"
            />
            <div class="camera-container">
              <video id="camera-preview" autoplay playsinline style="display: none;" aria-label="Camera preview"></video>
              <canvas id="photo-canvas" style="display: none;"></canvas>
              <img id="photo-preview" style="display: none;" alt="Captured photo preview" />
              
              <div class="camera-controls">
                <button type="button" id="start-camera-btn" class="btn btn-secondary">
                  <i class="fas fa-video" aria-hidden="true"></i>
                  Start Camera
                </button>
                <button type="button" id="capture-btn" class="btn" style="display: none;">
                  <i class="fas fa-camera" aria-hidden="true"></i>
                  Capture Photo
                </button>
                <button type="button" id="retake-btn" class="btn btn-secondary" style="display: none;">
                  <i class="fas fa-redo" aria-hidden="true"></i>
                  Retake
                </button>
                
              </div>
            </div>
            <div id="photo-error" class="error-message" style="display: none;" role="alert"></div>
          </div>
          
          <div class="form-group">
            <div class="map-container" style="margin-bottom: 1rem;">
              <div class="map-header">
                <h4 class="map-title">Select Location</h4>
                <p class="map-subtitle">Click on the map to set your story location (optional)</p>
              </div>
              <div id="location-map" style="height: 300px; border-radius: 15px;"></div>
            </div>
            <div style="display: flex; gap: 1rem;">
              <div style="flex: 1;">
                <label for="latitude">Latitude</label>
                <input type="number" id="latitude" step="any" readonly placeholder="Click on map">
              </div>
              <div style="flex: 1;">
                <label for="longitude">Longitude</label>
                <input type="number" id="longitude" step="any" readonly placeholder="Click on map">
              </div>
            </div>
          </div>
          
          <button type="submit" class="btn" id="submit-story-btn">
            <i class="fas fa-share" aria-hidden="true"></i>
            Share Story
          </button>
        </form>
      </div>
    `;
  },

  async afterRender() {
    this.model = new AddStoryModel();
    this.presenter = new AddStoryPresenter(this, this.model);

    await this.presenter.init();

    this._setupEventListeners();
    this._setupPageChangeListeners(); // Pastikan cleanup tetap berfungsi
  },

  _setupEventListeners() {
    const form = document.querySelector("#add-story-form");
    const descriptionInput = document.querySelector("#description");

    descriptionInput.addEventListener("blur", () => {
      const description = descriptionInput.value.trim();
      this.presenter.onDescriptionBlur(description);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const description = descriptionInput.value.trim();
      await this.presenter.submitStory(description);
    });
  },

  _setupPageChangeListeners() {
    // Cleanup when hash changes (navigation)
    window.addEventListener("hashchange", () => {
      this._cleanup();
    });

    // Cleanup when page is about to unload
    window.addEventListener("beforeunload", () => {
      this._cleanup();
    });

    // Cleanup when visibility changes (tab switch, minimize)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this._cleanup();
      }
    });

    // Cleanup when page loses focus
    window.addEventListener("blur", () => {
      this._cleanup();
    });
  },

  _cleanup() {
    if (this.presenter) {
      this.presenter.cleanup();
    }
  },

  beforeDestroy() {
    this._cleanup();
  },

  // View methods called by presenter
  renderAuthenticationRequired() {
    const container = document.querySelector("#add-story-message");
    container.innerHTML = `
      <div class="message error" role="alert">
        <i class="fas fa-lock" aria-hidden="true"></i>
        You need to login to share your story.
        <div style="margin-top: 1rem;">
          <a href="#/login" class="btn">
            <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
            Login
          </a>
        </div>
      </div>
    `;

    const form = document.querySelector("#add-story-form");
    if (form) {
      form.style.display = "none";
    }
    // Hapus baris ini: this.redirectToLoginAfterDelay(2000);
  },

  setupCameraControls(handlers) {
    const startCameraBtn = document.querySelector("#start-camera-btn");
    const captureBtn = document.querySelector("#capture-btn");
    const retakeBtn = document.querySelector("#retake-btn");
    const uploadBtn = document.querySelector("#upload-btn");
    const photoInput = document.querySelector("#photo-input");

    startCameraBtn?.addEventListener("click", handlers.onStartCamera);
    captureBtn?.addEventListener("click", handlers.onCapture);
    retakeBtn?.addEventListener("click", handlers.onRetake);
    uploadBtn?.addEventListener("click", () => photoInput.click());

    photoInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        handlers.onUpload(file);
      }
    });
  },

  showCameraPreview(stream) {
    const video = document.querySelector("#camera-preview");
    const photoPreview = document.querySelector("#photo-preview");
    const startCameraBtn = document.querySelector("#start-camera-btn");
    const captureBtn = document.querySelector("#capture-btn");
    const retakeBtn = document.querySelector("#retake-btn");

    if (video) {
      video.srcObject = stream;
      video.style.display = "block";
    }
    if (photoPreview) {
      photoPreview.style.display = "none";
    }

    if (startCameraBtn) startCameraBtn.style.display = "none";
    if (captureBtn) captureBtn.style.display = "inline-flex";
    if (retakeBtn) retakeBtn.style.display = "none";
  },

  getCaptureCanvas() {
    const video = document.querySelector("#camera-preview");
    const canvas = document.querySelector("#photo-canvas");

    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    return {
      canvas,
      context: canvas.getContext("2d"),
    };
  },

  captureFromVideo(canvas, context) {
    const video = document.querySelector("#camera-preview");
    if (!video || !canvas || !context) return null;

    context.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.8);
    });
  },

  showPhotoPreview(url) {
    const video = document.querySelector("#camera-preview");
    const photoPreview = document.querySelector("#photo-preview");
    const captureBtn = document.querySelector("#capture-btn");
    const retakeBtn = document.querySelector("#retake-btn");
    const startCameraBtn = document.querySelector("#start-camera-btn");

    if (photoPreview) {
      photoPreview.src = url;
      photoPreview.style.display = "block";
    }
    if (video) video.style.display = "none";

    if (captureBtn) captureBtn.style.display = "none";
    if (retakeBtn) retakeBtn.style.display = "inline-flex";
    if (startCameraBtn) startCameraBtn.style.display = "none";
  },

  hidePhotoPreview() {
    const photoPreview = document.querySelector("#photo-preview");
    if (photoPreview) {
      photoPreview.style.display = "none";
    }
  },

  showRetakeControls() {
    const retakeBtn = document.querySelector("#retake-btn");
    const startCameraBtn = document.querySelector("#start-camera-btn");

    if (retakeBtn) retakeBtn.style.display = "none";
    if (startCameraBtn) startCameraBtn.style.display = "inline-flex";
  },

  updateLocationInputs(lat, lng) {
    const latitudeInput = document.querySelector("#latitude");
    const longitudeInput = document.querySelector("#longitude");

    if (latitudeInput) latitudeInput.value = lat.toFixed(6);
    if (longitudeInput) longitudeInput.value = lng.toFixed(6);
  },

  showFieldError(fieldName, message) {
    const inputElement = document.querySelector(`#${fieldName}`);
    const errorElement = document.querySelector(`#${fieldName}-error`);

    if (inputElement) inputElement.style.borderColor = "#dc2626";
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  },

  hideFieldError(fieldName) {
    const inputElement = document.querySelector(`#${fieldName}`);
    const errorElement = document.querySelector(`#${fieldName}-error`);

    if (inputElement)
      inputElement.style.borderColor = "rgba(102, 126, 234, 0.2)";
    if (errorElement) errorElement.style.display = "none";
  },

  showValidationErrors(errors) {
    this.hideFieldError("description");
    this.hideFieldError("photo");

    Object.keys(errors).forEach((field) => {
      this.showFieldError(field, errors[field]);
    });
  },

  showMessage(message, type = "error") {
    const messageContainer = document.querySelector("#add-story-message");
    if (messageContainer) {
      messageContainer.innerHTML = `
        <div class="message ${type}" role="alert">
          <i class="fas fa-${
            type === "error" ? "exclamation-triangle" : "check-circle"
          }" aria-hidden="true"></i>
          ${message}
        </div>
      `;
    }
  },

  showError(message) {
    this.showMessage(message, "error");
  },

  showSuccess(message) {
    this.showMessage(message, "success");
  },

  showLoading() {
    const submitBtn = document.querySelector("#submit-story-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <div class="spinner" style="width: 16px; height: 16px; margin-right: 0.5rem;" aria-hidden="true"></div>
        Sharing Story...
      `;
    }
  },

  hideLoading() {
    const submitBtn = document.querySelector("#submit-story-btn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <i class="fas fa-share" aria-hidden="true"></i>
        Share Story
      `;
    }
  },

  // New view methods for redirection
  redirectToHomeAfterDelay(delay) {
    setTimeout(() => {
      window.location.hash = "#/home";
    }, delay);
  },

  redirectToLoginAfterDelay(delay) {
    setTimeout(() => {
      window.location.hash = "#/login";
    }, delay);
  },
};

export default AddStory;
