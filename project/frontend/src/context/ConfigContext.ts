import { createContext, useContext } from "react";
import type { Config } from "@/shared/types";

export interface ConfigContextValue {
  config: Config | null;
  setConfig: (config: Config) => void;
}

export const ConfigContext = createContext<ConfigContextValue>({
  config: null,
  setConfig: () => {},
});

export const useConfig = () => useContext(ConfigContext);
