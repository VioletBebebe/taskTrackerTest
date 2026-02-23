import { configureStore } from "@reduxjs/toolkit"
import taskReducer from '../components/task/taskSlice'
import authReducer from "../auth/authSlice"
import profileReducer from "../pages/board/profile/funcs/profileSlice"
export const store = configureStore({
  reducer: {
    tasks: taskReducer, 
    auth: authReducer, 
    profile: profileReducer, 
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch