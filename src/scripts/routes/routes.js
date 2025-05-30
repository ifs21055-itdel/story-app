import Home from "../views/pages/home.js";
import Login from "../views/pages/login.js";
import Register from "../views/pages/register.js";
import AddStory from "../views/pages/add-story.js";
import StoryDetail from "../views/pages/story-detail.js";

const routes = {
  "/": Home, // default page
  "/home": Home,
  "/login": Login,
  "/register": Register,
  "/add-story": AddStory,
  "/story/:id": StoryDetail,
};

export default routes;
