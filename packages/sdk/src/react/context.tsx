import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  createReadonlySolanaBalanceReader,
  DEFAULT_ZODIAC_TOKEN_REGISTRY,
  type ConnectionOrRpcUrl,
  type ReadonlyZodiacBalanceReader,
  type ZodiacTokenRegistry
} from "../core/index.js";
import {
  createPlaceholderMarketAdapter,
  type ZodiacMarketAdapter
} from "../market/index.js";

const defaultMarketAdapter = createPlaceholderMarketAdapter();

export interface ZodiacsContextValue {
  readonly registry: ZodiacTokenRegistry;
  readonly balanceReader: ReadonlyZodiacBalanceReader | null;
  readonly marketAdapter: ZodiacMarketAdapter;
}

export interface ZodiacsProviderProps {
  readonly children: ReactNode;
  readonly registry?: ZodiacTokenRegistry;
  readonly balanceReader?: ReadonlyZodiacBalanceReader | null;
  readonly rpcUrl?: ConnectionOrRpcUrl;
  readonly marketAdapter?: ZodiacMarketAdapter;
}

const ZodiacsContext = createContext<ZodiacsContextValue>({
  registry: DEFAULT_ZODIAC_TOKEN_REGISTRY,
  balanceReader: null,
  marketAdapter: defaultMarketAdapter
});

export function ZodiacsProvider({
  children,
  registry = DEFAULT_ZODIAC_TOKEN_REGISTRY,
  balanceReader,
  rpcUrl,
  marketAdapter = defaultMarketAdapter
}: ZodiacsProviderProps) {
  const rpcBalanceReader = useMemo(
    () => (rpcUrl ? createReadonlySolanaBalanceReader(rpcUrl) : null),
    [rpcUrl]
  );
  const resolvedBalanceReader = balanceReader === undefined ? rpcBalanceReader : balanceReader;
  const value = useMemo<ZodiacsContextValue>(
    () => ({ registry, balanceReader: resolvedBalanceReader, marketAdapter }),
    [registry, resolvedBalanceReader, marketAdapter]
  );

  return (
    <ZodiacsContext.Provider value={value}>
      {children}
    </ZodiacsContext.Provider>
  );
}

export function useZodiacs(): ZodiacsContextValue {
  return useContext(ZodiacsContext);
}
