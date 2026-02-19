import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";

// Configure store
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Define RootState and AppDispatch types for use in your app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
