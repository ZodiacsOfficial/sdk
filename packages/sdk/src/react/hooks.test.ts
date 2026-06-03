import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ZODIAC_TOKEN_REGISTRY,
  createReadonlySolanaBalanceReader,
  getZodiacToken,
  type ReadonlyZodiacBalanceReader,
  type SolanaBalanceConnection,
  type ZodiacBalanceResult
} from "../core/index.js";
import type { ZodiacsContextValue } from "./context.js";
import type { AsyncHookState } from "./hooks.js";
import type { PublicClient } from "viem";

const mockState = vi.hoisted(() => ({
  contextValue: null as ZodiacsContextValue | null,
  latestEffectDeps: null as readonly unknown[] | undefined | null,
  latestHookState: null as AsyncHookState<ZodiacBalanceResult> | null
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useCallback: (callback: unknown) => callback,
    useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
      mockState.latestEffectDeps = deps;
      effect();
    },
    useMemo: (factory: () => unknown) => factory(),
    useState: (initial: unknown | (() => unknown)) => {
      const current = typeof initial === "function" ? (initial as () => unknown)() : initial;
      mockState.latestHookState = current as AsyncHookState<ZodiacBalanceResult>;

      return [
        current,
        (next: unknown | ((currentState: unknown) => unknown)) => {
          const previous = mockState.latestHookState;
          mockState.latestHookState =
            typeof next === "function"
              ? ((next as (currentState: unknown) => unknown)(
                  previous
                ) as AsyncHookState<ZodiacBalanceResult>)
              : (next as AsyncHookState<ZodiacBalanceResult>);
        }
      ];
    }
  };
});

vi.mock("./context.js", () => ({
  useZodiacs: () => {
    if (!mockState.contextValue) {
      throw new Error("Missing mocked Zodiacs context.");
    }

    return mockState.contextValue;
  }
}));

const walletAddress = "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ";

beforeEach(() => {
  mockState.contextValue = createMockContext();
  mockState.latestEffectDeps = null;
  mockState.latestHookState = null;
});

function createMockContext(overrides: Partial<ZodiacsContextValue> = {}): ZodiacsContextValue {
  return {
    balanceReader: null,
    registry: DEFAULT_ZODIAC_TOKEN_REGISTRY,
    ...overrides
  };
}

async function currentHookState(): Promise<AsyncHookState<ZodiacBalanceResult>> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  if (!mockState.latestHookState) {
    throw new Error("Hook state was not captured.");
  }

  return mockState.latestHookState;
}

describe("useZodiacBalance", () => {
  it("uses a custom balanceReader", async () => {
    const token = getZodiacToken("aries");
    const customBalanceReader: ReadonlyZodiacBalanceReader = {
      getTokenBalance: vi.fn(async () => ({
        amountRaw: "2000000",
        decimals: 6,
        mintAddress: token.mintAddress,
        ownerAddress: walletAddress,
        uiAmount: 2
      }))
    };
    mockState.contextValue = createMockContext({ balanceReader: customBalanceReader });
    const { useZodiacBalance } = await import("./hooks.js");

    useZodiacBalance("aries", walletAddress);
    const state = await currentHookState();

    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.refetch).toEqual(expect.any(Function));
    expect(state.data).toMatchObject({
      balance: {
        amountRaw: "2000000",
        uiAmount: 2
      },
      status: "available"
    });
  });

  it("returns a clear unavailable state when no rpcUrl or balanceReader is configured", async () => {
    const { useZodiacBalance } = await import("./hooks.js");

    useZodiacBalance("aries", walletAddress);
    const state = await currentHookState();

    expect(state.loading).toBe(false);
    expect(state.error?.message).toContain("Provide rpcUrl or balanceReader");
    expect(state.data).toMatchObject({
      reason: expect.stringContaining("Provide rpcUrl or balanceReader"),
      status: "unavailable"
    });
  });

  it("does not call the balance reader when disabled", async () => {
    const customBalanceReader: ReadonlyZodiacBalanceReader = {
      getTokenBalance: vi.fn(async () => null)
    };
    mockState.contextValue = createMockContext({ balanceReader: customBalanceReader });
    const { useZodiacBalance } = await import("./hooks.js");

    useZodiacBalance("aries", walletAddress, { enabled: false });
    const state = await currentHookState();

    expect(customBalanceReader.getTokenBalance).not.toHaveBeenCalled();
    expect(state).toMatchObject({ data: null, error: null, loading: false });
    expect(state.refetch).toEqual(expect.any(Function));
  });

  it("returns a safe error state for invalid wallet addresses", async () => {
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner: vi.fn(async () => ({ value: [] }))
    };
    mockState.contextValue = createMockContext({
      balanceReader: createReadonlySolanaBalanceReader(connection)
    });
    const { useZodiacBalance } = await import("./hooks.js");

    useZodiacBalance("aries", "not-a-wallet");
    const state = await currentHookState();

    expect(state.loading).toBe(false);
    expect(state.error?.message).toContain("Invalid wallet address");
    expect(state.data).toMatchObject({
      reason: expect.stringContaining("Invalid wallet address"),
      status: "unavailable"
    });
  });

  it("returns a safe error state for RPC failures", async () => {
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner: vi.fn(async () => {
        throw new Error("RPC unavailable");
      })
    };
    mockState.contextValue = createMockContext({
      balanceReader: createReadonlySolanaBalanceReader(connection)
    });
    const { useZodiacBalance } = await import("./hooks.js");

    useZodiacBalance("aries", walletAddress);
    const state = await currentHookState();

    expect(state.loading).toBe(false);
    expect(state.error?.message).toBe("RPC unavailable");
    expect(state.data).toMatchObject({
      reason: "RPC unavailable",
      status: "unavailable"
    });
  });

  it("uses stable dependency values for cross-chain ownership params", async () => {
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner: vi.fn(async () => ({ value: [] }))
    };
    const publicClient = { readContract: vi.fn() } as unknown as PublicClient;
    const params = {
      solana: { connection, ownerAddress: " " },
      base: { publicClient, ownerAddress: "" }
    };
    const { useCrossChainZodiacsOwnership } = await import("./hooks.js");

    useCrossChainZodiacsOwnership(params);

    expect(mockState.latestEffectDeps?.slice(0, 4)).toEqual([connection, "", publicClient, ""]);
    expect(mockState.latestEffectDeps?.[5]).toEqual(expect.any(Function));
    expect(mockState.latestEffectDeps).not.toContain(params);
  });

  it("returns deterministic identity context without network calls", async () => {
    const ownership = {
      holdings: [
        { sign: "aries", held: true },
        { sign: "taurus", held: false }
      ]
    } as const;
    const {
      useCompatibilityContext,
      useCurrentZodiacSeason,
      useCosmicReceiptData,
      useZodiacIdentityContext,
      useZodiacWheelData
    } = await import("./hooks.js");

    expect(useCurrentZodiacSeason(new Date("2026-03-22T00:00:00.000Z"))).toMatchObject({
      sign: "aries"
    });
    expect(
      useZodiacIdentityContext(ownership, {
        date: new Date("2026-03-22T00:00:00.000Z"),
        sunSign: "aries"
      })
    ).toMatchObject({
      heldSigns: ["aries"],
      currentSeasonHeld: true,
      alignments: [{ placement: "sun", sign: "aries", held: true }]
    });
    expect(
      useCosmicReceiptData(ownership, {
        date: new Date("2026-04-21T00:00:00.000Z")
      })
    ).toMatchObject({
      label: "public Zodiacs shelf",
      currentSeason: { sign: "taurus" },
      currentSeasonHeld: false
    });
    expect(useZodiacWheelData(ownership)).toMatchObject({
      heldSigns: ["aries"],
      coverage: 8.33
    });
    expect(
      useCompatibilityContext(ownership, {
        holdings: [{ sign: "aries", held: true }]
      })
    ).toMatchObject({
      sharedSigns: ["aries"],
      overlapCount: 1
    });
  });
});
