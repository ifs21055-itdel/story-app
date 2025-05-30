class AddStoryPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
    this.stream = null;
    this.map = null;
    this.marker = null;
    this.isActive = true;
  }

  async init() {
    const isLoggedIn = await this.model.isUserLoggedIn();
    if (!isLoggedIn) {
      this.view.renderAuthenticationRequired();

      return false;
    }

    this.initializeCameraControls();
    this.initializeLocationMap();

    return true; // Mengindikasikan view bisa melanjutkan render
  }

  initializeCameraControls() {
    this.view.setupCameraControls({
      onStartCamera: () => this.startCamera(),
      onCapture: () => this.capturePhoto(),
      onRetake: () => this.retakePhoto(),
      onUpload: (file) => this.handleFileUpload(file),
    });
  }

  async startCamera() {
    try {
      if (!this.isActive) return;

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (!this.isActive) {
        this.stopCamera();
        return;
      }

      this.view.showCameraPreview(this.stream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      if (this.isActive) {
        this.view.showError(
          "Unable to access camera. Please check permissions."
        );
      }
    }
  }

  async capturePhoto() {
    if (!this.stream || !this.isActive) return;

    const canvasData = this.view.getCaptureCanvas();
    if (!canvasData) return;

    const { canvas, context } = canvasData;
    const blob = await this.view.captureFromVideo(canvas, context);

    if (blob && this.isActive) {
      const capturedFile = new File([blob], "captured-photo.jpg", {
        type: "image/jpeg",
      });

      this.model.setCapturedPhoto(capturedFile);

      const url = URL.createObjectURL(capturedFile);
      this.view.showPhotoPreview(url);

      this.stopCamera();
    }
  }

  retakePhoto() {
    if (!this.isActive) return;

    this.view.hidePhotoPreview();
    this.model.setCapturedPhoto(null);
    this.view.showRetakeControls();
  }

  handleFileUpload(file) {
    if (!file || !this.isActive) return;

    this.stopCamera();
    this.model.setCapturedPhoto(file);

    const url = URL.createObjectURL(file);
    this.view.showPhotoPreview(url);
  }

  stopCamera() {
    if (this.stream) {
      try {
        this.stream.getTracks().forEach((track) => {
          track.stop();
          console.log("Camera track stopped:", track.label);
        });
        this.stream = null;

        const video = document.querySelector("#camera-preview");
        if (video) {
          video.srcObject = null;
          video.style.display = "none";
        }

        console.log("Camera stopped successfully");
      } catch (error) {
        console.error("Error stopping camera:", error);
      }
    }
  }

  initializeLocationMap() {
    if (!this.isActive) return;

    setTimeout(() => {
      if (!this.isActive) return;

      try {
        this.map = L.map("location-map").setView([-2.5489, 118.0149], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);

        this.map.on("click", (e) => this.onMapClick(e));
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }, 100);
  }

  onMapClick(e) {
    if (!this.isActive) return;

    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    const location = { lat, lon };
    this.model.setSelectedLocation(location);
    this.view.updateLocationInputs(lat, lon);

    if (this.marker) {
      this.marker.setLatLng([lat, lon]);
    } else {
      this.marker = L.marker([lat, lon])
        .addTo(this.map)
        .bindPopup("Story Location")
        .openPopup();
    }
  }

  async submitStory(description) {
    if (!this.isActive) return;

    try {
      if (!this.model.isUserLoggedIn()) {
        this.view.showError("You must login to share a story.");
        // Hapus baris ini: this.view.redirectToLoginAfterDelay(2000);
        return;
      }

      this.view.showLoading();

      this.model.setDescription(description);

      const validation = this.model.validateStoryData();
      if (!validation.isValid) {
        this.view.showValidationErrors(validation.errors);
        this.view.hideLoading();
        return;
      }

      const result = await this.model.submitStoryToServer();

      if (!this.isActive) return;

      if (result.error) {
        if (
          result.message &&
          (result.message.includes("token") ||
            result.message.includes("unauthorized"))
        ) {
          this.model.logoutUser();
          this.view.showError("Your session has expired. Please login again.");
          // Hapus baris ini: this.view.redirectToLoginAfterDelay(2000);
          return;
        }
        throw new Error(result.message);
      }

      this.view.showSuccess("Story shared successfully!");
      this.cleanup();
      // Redirect ke home setelah delay (ini tetap, karena ini adalah redirect sukses)
      this.view.redirectToHomeAfterDelay(2000);
    } catch (error) {
      console.error("Add story error:", error);

      if (!this.isActive) return;

      if (
        error.message &&
        (error.message.includes("token") ||
          error.message.includes("unauthorized"))
      ) {
        this.model.logoutUser();
        this.view.showError("Your session has expired. Please login again.");
        // Hapus baris ini: this.view.redirectToLoginAfterDelay(2000);
        return;
      }

      this.view.showError(
        error.message || "Failed to share story. Please try again."
      );
    } finally {
      if (this.isActive) {
        this.view.hideLoading();
      }
    }
  }

  onDescriptionBlur(description) {
    if (!this.isActive) return;

    const error = this.model.validateDescription(description);
    if (error) {
      this.view.showFieldError("description", error);
    } else {
      this.view.hideFieldError("description");
    }
  }

  cleanup() {
    console.log("Cleaning up AddStoryPresenter...");

    this.isActive = false;
    this.stopCamera();

    if (this.map) {
      try {
        this.map.remove();
        this.map = null;
        this.marker = null;
        console.log("Map cleaned up");
      } catch (error) {
        console.error("Error cleaning up map:", error);
      }
    }

    const capturedPhoto = this.model.getCapturedPhoto();
    if (capturedPhoto && capturedPhoto instanceof File) {
      try {
        const photoPreview = document.querySelector("#photo-preview");
        if (photoPreview && photoPreview.src) {
          URL.revokeObjectURL(photoPreview.src);
        }
      } catch (error) {
        console.error("Error revoking object URL:", error);
      }
    }

    this.model.reset();

    console.log("AddStoryPresenter cleanup completed");
  }

  isPresenterActive() {
    return this.isActive;
  }
}

export default AddStoryPresenter;
