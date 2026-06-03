import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  createReadonlySolanaBalanceReader,
  DEFAULT_ZODIAC_TOKEN_REGISTRY,
  type ConnectionOrRpcUrl,
  type ReadonlyZodiacBalanceReader,
  type ZodiacTokenRegistry
} from "../core/index.js";

export interface ZodiacsContextValue {
  readonly registry: ZodiacTokenRegistry;
  readonly balanceReader: ReadonlyZodiacBalanceReader | null;
  /** @deprecated Import market helpers explicitly from @zodiacs/sdk/market. */
  readonly marketAdapter?: unknown;
}

export interface ZodiacsProviderProps {
  readonly children: ReactNode;
  readonly registry?: ZodiacTokenRegistry;
  readonly balanceReader?: ReadonlyZodiacBalanceReader | null;
  readonly rpcUrl?: ConnectionOrRpcUrl;
  /** @deprecated Import market helpers explicitly from @zodiacs/sdk/market. */
  readonly marketAdapter?: unknown;
}

const ZodiacsContext = createContext<ZodiacsContextValue>({
  registry: DEFAULT_ZODIAC_TOKEN_REGISTRY,
  balanceReader: null
});

export function ZodiacsProvider({
  children,
  registry = DEFAULT_ZODIAC_TOKEN_REGISTRY,
  balanceReader,
  rpcUrl,
  marketAdapter
}: ZodiacsProviderProps) {
  const rpcBalanceReader = useMemo(
    () => (rpcUrl ? createReadonlySolanaBalanceReader(rpcUrl) : null),
    [rpcUrl]
  );
  const resolvedBalanceReader = balanceReader === undefined ? rpcBalanceReader : balanceReader;
  const value = useMemo<ZodiacsContextValue>(
    () => ({
      registry,
      balanceReader: resolvedBalanceReader,
      ...(marketAdapter === undefined ? {} : { marketAdapter })
    }),
    [registry, resolvedBalanceReader, marketAdapter]
  );

  return <ZodiacsContext.Provider value={value}>{children}</ZodiacsContext.Provider>;
}

export function useZodiacs(): ZodiacsContextValue {
  return useContext(ZodiacsContext);
}
