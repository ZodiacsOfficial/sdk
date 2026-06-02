import { useEffect, useMemo, useState } from "react";
import type { PublicClient } from "viem";
import {
  getBaseZodiacBalance,
  getBaseZodiacsOwnership,
  getCosmicReceiptData,
  getCurrentZodiacSeason,
  getRepresentationByAddress,
  getSolanaZodiacsOwnership,
  getZodiacAsset,
  getZodiacIdentityContext,
  getZodiacMetadata,
  getZodiacToken,
  getZodiacsRegistry,
  isOfficialZodiacAddress,
  readZodiacBalance,
  type BaseZodiacBalance,
  type BaseZodiacsOwnership,
  type ConnectionOrRpcUrl,
  type CosmicReceiptData,
  type CosmicReceiptDataOptions,
  type CrossChainZodiacsOwnership,
  type ZodiacsOwnership,
  type ZodiacAddressLookupOptions,
  type ZodiacAsset,
  type ZodiacBalanceResult,
  type ZodiacIdentityContext,
  type ZodiacIdentityContextOptions,
  type ZodiacIdentityOwnershipInput,
  type ZodiacMetadata,
  type ZodiacRepresentation,
  type ZodiacSeason,
  type ZodiacSign,
  type ZodiacToken,
  type ZodiacsRegistry
} from "../core/index.js";
import {
  readMarketSafely,
  type ZodiacMarketData
} from "../market/index.js";
import { useZodiacs } from "./context.js";

const balanceReaderNotConfiguredMessage =
  "Balance reader is not configured. Provide rpcUrl or balanceReader to ZodiacsProvider.";

export interface UseZodiacTokenResult {
  readonly metadata: ZodiacMetadata;
  readonly token: ZodiacToken;
}

export interface AsyncHookState<T> {
  readonly data: T | null;
  readonly error: Error | null;
  readonly loading: boolean;
}

export interface UseZodiacMarketOptions {
  readonly enabled?: boolean;
}

export interface UseZodiacBalanceOptions {
  readonly enabled?: boolean;
}

export function useZodiacsRegistry(): ZodiacsRegistry {
  return getZodiacsRegistry();
}

export function useOfficialZodiacToken(sign: ZodiacSign): ZodiacAsset {
  return useMemo(() => getZodiacAsset(sign), [sign]);
}

export function useIsOfficialZodiacAddress(
  address: string | null | undefined,
  options: ZodiacAddressLookupOptions = {}
): boolean {
  const chain = options.chain;
  return useMemo(
    () => (address ? isOfficialZodiacAddress(address, chain ? { chain } : {}) : false),
    [address, chain]
  );
}

export function useZodiacRepresentation(
  address: string | null | undefined,
  options: ZodiacAddressLookupOptions = {}
): ZodiacRepresentation | null {
  const chain = options.chain;
  return useMemo(
    () => (address ? getRepresentationByAddress(address, chain ? { chain } : {}) : null),
    [address, chain]
  );
}

export function useCurrentZodiacSeason(date?: Date): ZodiacSeason {
  const time = date?.getTime() ?? null;

  return useMemo(() => getCurrentZodiacSeason(date), [time]);
}

export function useZodiacIdentityContext(
  ownership: ZodiacIdentityOwnershipInput,
  options: ZodiacIdentityContextOptions = {}
): ZodiacIdentityContext {
  const dateTime = options.date?.getTime() ?? null;

  return useMemo(
    () => getZodiacIdentityContext(ownership, options),
    [ownership, dateTime, options.sunSign, options.moonSign, options.risingSign]
  );
}

export function useCosmicReceiptData(
  ownership: ZodiacIdentityOwnershipInput,
  options: CosmicReceiptDataOptions = {}
): CosmicReceiptData {
  const dateTime = options.date?.getTime() ?? null;

  return useMemo(
    () => getCosmicReceiptData(ownership, options),
    [ownership, dateTime, options.sunSign, options.moonSign, options.risingSign, options.label]
  );
}

export function useZodiacToken(sign: ZodiacSign): UseZodiacTokenResult {
  const { registry } = useZodiacs();

  return useMemo(
    () => ({
      metadata: getZodiacMetadata(sign),
      token: getZodiacToken(sign, registry)
    }),
    [registry, sign]
  );
}

export function useZodiacBalance(
  sign: ZodiacSign,
  ownerAddress: string | null | undefined,
  options: UseZodiacBalanceOptions = {}
): AsyncHookState<ZodiacBalanceResult> {
  const { balanceReader, registry } = useZodiacs();
  const { token } = useZodiacToken(sign);
  const enabled = options.enabled ?? true;
  const [state, setState] = useState<AsyncHookState<ZodiacBalanceResult>>({
    data: null,
    error: null,
    loading: false
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false });
      return;
    }

    const normalizedOwnerAddress = ownerAddress?.trim();

    if (!normalizedOwnerAddress) {
      setState({ data: null, error: null, loading: false });
      return;
    }

    if (!balanceReader) {
      const error = new Error(balanceReaderNotConfiguredMessage);
      setState({
        data: unavailableZodiacBalanceResult(sign, token, error.message),
        error,
        loading: false
      });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, error: null, loading: true }));

    readZodiacBalance({
      ownerAddress: normalizedOwnerAddress,
      reader: balanceReader,
      registry,
      sign
    })
      .then((data: ZodiacBalanceResult) => {
        if (!cancelled) {
          const error = data.status === "unavailable" ? new Error(data.reason ?? "Balance unavailable.") : null;
          setState({ data, error, loading: false });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error("Balance request failed."),
            loading: false
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [balanceReader, enabled, ownerAddress, registry, sign, token]);

  return state;
}

export function useZodiacMarket(
  sign: ZodiacSign,
  options: UseZodiacMarketOptions = {}
): AsyncHookState<ZodiacMarketData> {
  const { marketAdapter } = useZodiacs();
  const { token } = useZodiacToken(sign);
  const enabled = options.enabled ?? true;
  const [state, setState] = useState<AsyncHookState<ZodiacMarketData>>({
    data: null,
    error: null,
    loading: enabled
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setState((current) => ({ ...current, error: null, loading: true }));

    readMarketSafely(marketAdapter, {
      sign,
      signal: controller.signal,
      token
    })
      .then((data: ZodiacMarketData) => {
        if (!cancelled) {
          setState({ data, error: null, loading: false });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error("Market request failed."),
            loading: false
          });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, marketAdapter, sign, token]);

  return state;
}

export function useBaseZodiacBalance(
  publicClient: PublicClient | null | undefined,
  ownerAddress: string | null | undefined,
  sign: ZodiacSign
): AsyncHookState<BaseZodiacBalance> {
  const [state, setState] = useState<AsyncHookState<BaseZodiacBalance>>({
    data: null,
    error: null,
    loading: false
  });

  useEffect(() => {
    if (!publicClient || !ownerAddress?.trim()) {
      setState({ data: null, error: null, loading: false });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, error: null, loading: true }));

    getBaseZodiacBalance(publicClient, ownerAddress, sign)
      .then((data) => {
        if (!cancelled) {
          const error = data.status === "unavailable" ? new Error(data.error?.message ?? "Base balance unavailable.") : null;
          setState({ data, error, loading: false });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error("Base balance request failed."),
            loading: false
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ownerAddress, publicClient, sign]);

  return state;
}

export function useBaseZodiacsOwnership(
  publicClient: PublicClient | null | undefined,
  ownerAddress: string | null | undefined
): AsyncHookState<BaseZodiacsOwnership> {
  return useAsyncOwnership(publicClient && ownerAddress?.trim()
    ? () => getBaseZodiacsOwnership(publicClient, ownerAddress)
    : null, [ownerAddress, publicClient]);
}

export function useSolanaZodiacsOwnership(
  connection: ConnectionOrRpcUrl | null | undefined,
  ownerAddress: string | null | undefined
): AsyncHookState<ZodiacsOwnership> {
  return useAsyncOwnership(connection && ownerAddress?.trim()
    ? () => getSolanaZodiacsOwnership(connection, ownerAddress)
    : null, [connection, ownerAddress]);
}

export function useCrossChainZodiacsOwnership(params: {
  readonly solana?: { readonly connection: ConnectionOrRpcUrl; readonly ownerAddress: string };
  readonly base?: { readonly publicClient: PublicClient; readonly ownerAddress: string };
}): AsyncHookState<CrossChainZodiacsOwnership> {
  const solanaConnection = params.solana?.connection ?? null;
  const solanaOwnerAddress = params.solana?.ownerAddress.trim() ?? "";
  const basePublicClient = params.base?.publicClient ?? null;
  const baseOwnerAddress = params.base?.ownerAddress.trim() ?? "";
  const enabled = Boolean(
    (solanaConnection && solanaOwnerAddress) ||
    (basePublicClient && baseOwnerAddress)
  );

  return useAsyncOwnership(enabled
    ? async () => {
        const [solana, base] = await Promise.all([
          solanaConnection && solanaOwnerAddress
            ? getSolanaZodiacsOwnership(solanaConnection, solanaOwnerAddress)
            : Promise.resolve(undefined),
          basePublicClient && baseOwnerAddress
            ? getBaseZodiacsOwnership(basePublicClient, baseOwnerAddress)
            : Promise.resolve(undefined)
        ]);

        return {
          ...(solana ? { solana } : {}),
          ...(base ? { base } : {})
        };
      }
    : null, [solanaConnection, solanaOwnerAddress, basePublicClient, baseOwnerAddress]);
}

function unavailableZodiacBalanceResult(
  sign: ZodiacSign,
  token: ZodiacToken,
  reason: string
): ZodiacBalanceResult {
  return {
    sign,
    token,
    balance: null,
    status: "unavailable",
    reason
  };
}

function useAsyncOwnership<T>(
  loader: (() => Promise<T>) | null,
  deps: readonly unknown[]
): AsyncHookState<T> {
  const [state, setState] = useState<AsyncHookState<T>>({
    data: null,
    error: null,
    loading: false
  });

  useEffect(() => {
    if (!loader) {
      setState({ data: null, error: null, loading: false });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, error: null, loading: true }));

    loader()
      .then((data) => {
        if (!cancelled) {
          setState({ data, error: null, loading: false });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error("Zodiacs ownership request failed."),
            loading: false
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
}
