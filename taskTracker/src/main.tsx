import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { store } from "./app/store"
import Root from "./root";
import "./main.scss"


ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <Root />
  </Provider>
)

