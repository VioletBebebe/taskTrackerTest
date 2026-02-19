import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { RouterProvider } from "react-router-dom"
import { store } from "./app/store"
import { router } from "./app/router"
import { taskSocket } from "./ws/ws"
import { addTaskFromWS } from "./components/task/taskSlice"

taskSocket.subscribe((data) => {
  if (data.event === "taskCreated") {
    store.dispatch(addTaskFromWS(data.task))
  }
})

function Root() {
  return <RouterProvider router={router} />
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <Root />
  </Provider>
)