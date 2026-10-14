//provider.js
"use client";
import { Provider } from "react-redux";
import { persistor, store } from "."
import { PersistGate } from "redux-persist/integration/react";
import PersistHydrationGate from "./PersistHydrationGate";

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PersistHydrationGate>{children}</PersistHydrationGate>
      </PersistGate>
    </Provider>
  );
}