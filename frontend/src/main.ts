import "../input.css";
import { createApp } from "vue";
import App from "./app/App.vue";
import { installCodeThemes } from "./ui/code-themes";
installCodeThemes();
createApp(App).mount("#app");
