import "../styles/main.css";
import App from "./views/app.js";
import "regenerator-runtime/runtime";

const app = new App({
  button: document.querySelector("#menu"),
  drawer: document.querySelector("#drawer"),
  content: document.querySelector("#page-container"),
});

window.addEventListener("hashchange", () => {
  app.renderPage();
});

window.addEventListener("load", () => {
  app.renderPage();
});

// Check if View Transition API is supported
if ("startViewTransition" in document) {
  // Enable View Transition API for navigation
  window.addEventListener("beforeunload", () => {
    if (document.startViewTransition) {
      document.startViewTransition();
    }
  });
}
