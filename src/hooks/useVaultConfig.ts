import { useContext } from "react";
import { VaultsConfigContext } from "@/context";
export function useVaultsConfig() {
  const context = useContext(VaultsConfigContext);
  if (!context) {
    throw new Error(
      "useVaultsConfig must be used within a VaultsConfigProvider",
    );
  }
  return context;
}
