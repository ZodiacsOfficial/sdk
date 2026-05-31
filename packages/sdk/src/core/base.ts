import { erc20Abi, getAddress, isAddress, type PublicClient } from "viem";
import { formatTokenAmount } from "./format.js";
import {
  getAllBaseBridgedZodiacs,
  getBaseZodiacRepresentation
} from "./official-registry.js";
import type {
  BaseZodiacBalance,
  BaseZodiacsHolding,
  BaseZodiacsOwnership,
  ZodiacRepresentation,
  ZodiacSerializableError,
  ZodiacSign,
  ZodiacsOwnershipStatus
} from "./types.js";

export async function getBaseZodiacBalance(
  publicClient: PublicClient,
  ownerAddress: string,
  sign: ZodiacSign
): Promise<BaseZodiacBalance> {
  const representation = getBaseZodiacRepresentation(sign);
  const normalizedOwner = normalizeOwnerAddress(ownerAddress);

  if (!normalizedOwner) {
    return unavailableBaseBalance(representation, ownerAddress, {
      code: "invalid-zodiac-address",
      message: `Invalid Base owner address: ${ownerAddress}`
    });
  }

  try {
    const rawAmount = await publicClient.readContract({
      address: representation.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [normalizedOwner]
    });
    const decimals = representation.decimals ?? Number(await publicClient.readContract({
      address: representation.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals"
    }));
    const rawAmountString = rawAmount.toString();

    return {
      sign,
      ownerAddress: normalizedOwner,
      representation,
      chain: "base",
      kind: "bridged",
      tokenStandard: "ERC20",
      rawAmount: rawAmountString,
      uiAmountString: formatTokenAmount(rawAmountString, Number(decimals)),
      decimals: Number(decimals),
      status: rawAmount === 0n ? "zero" : "ok"
    };
  } catch (error) {
    return unavailableBaseBalance(representation, normalizedOwner, {
      code: "zodiac-read-unavailable",
      message: error instanceof Error ? error.message : "Base ERC-20 balance read failed."
    });
  }
}

export async function getBaseZodiacBalances(
  publicClient: PublicClient,
  ownerAddress: string
): Promise<readonly BaseZodiacBalance[]> {
  return Promise.all(
    getAllBaseBridgedZodiacs().map((representation) =>
      getBaseZodiacBalance(publicClient, ownerAddress, representation.sign)
    )
  );
}

export async function getBaseZodiacsOwnership(
  publicClient: PublicClient,
  ownerAddress: string
): Promise<BaseZodiacsOwnership> {
  const balances = await getBaseZodiacBalances(publicClient, ownerAddress);
  const holdings = balances.map<BaseZodiacsHolding>((balance) => ({
    sign: balance.sign,
    representation: balance.representation,
    balance,
    held: balance.status === "ok" && balance.rawAmount !== "0"
  }));
  const heldSigns = holdings.filter((holding) => holding.held).map((holding) => holding.sign);
  const errors = balances.flatMap((balance) => (balance.error ? [balance.error] : []));

  return {
    ownerAddress,
    chain: "base",
    status: getBaseOwnershipStatus(balances),
    holdings,
    heldSigns,
    totalHeld: heldSigns.length,
    errors
  };
}

export async function getBaseHeldZodiacs(
  publicClient: PublicClient,
  ownerAddress: string
): Promise<readonly BaseZodiacsHolding[]> {
  const ownership = await getBaseZodiacsOwnership(publicClient, ownerAddress);
  return ownership.holdings.filter((holding) => holding.held);
}

function unavailableBaseBalance(
  representation: ZodiacRepresentation,
  ownerAddress: string,
  error: ZodiacSerializableError
): BaseZodiacBalance {
  return {
    sign: representation.sign,
    ownerAddress,
    representation,
    chain: "base",
    kind: "bridged",
    tokenStandard: "ERC20",
    rawAmount: "0",
    uiAmountString: "0",
    decimals: representation.decimals ?? 0,
    status: "unavailable",
    error
  };
}

function getBaseOwnershipStatus(balances: readonly BaseZodiacBalance[]): ZodiacsOwnershipStatus {
  const unavailableCount = balances.filter((balance) => balance.status === "unavailable").length;

  if (unavailableCount === 0) {
    return "available";
  }

  return unavailableCount === balances.length ? "unavailable" : "partial";
}

function normalizeOwnerAddress(ownerAddress: string): `0x${string}` | null {
  return isAddress(ownerAddress) ? getAddress(ownerAddress) : null;
}
