class PWAUtils {
  constructor() {
    this.deferredPrompt = null;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this._createInstallButton();
    });
  }

  isAppInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  _createInstallButton() {
    const installButton = document.createElement("button");
    installButton.textContent = "Pasang Aplikasi";
    installButton.classList.add("install-button");
    document.body.appendChild(installButton);

    installButton.addEventListener("click", async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const choiceResult = await this.deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        this.deferredPrompt = null;
        installButton.remove();
      }
    });
  }
}

export default PWAUtils;
