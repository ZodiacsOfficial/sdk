"use client";

import { getZodiacIdentityContext } from "@zodiacs/sdk/identity";
import { ZODIAC_SIGNS, getZodiacToken } from "@zodiacs/sdk/core";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  auraShareText,
  buildAuraProfile,
  buildZodiaBasket,
  resolveBirthChart
} from "../../lib/astroProfile";
import type { BirthChartDraft, RiskMode } from "../../lib/astroProfile";
import type { ZodiacSign } from "../../lib/zodiac";
import { ShareButton } from "../ShareButton";
import { SignIcon } from "../SignIcon";
import { SIGN_COLORS } from "../signTheme";

const STORAGE_KEY = "zodia:cosmic-profile:v1";
const DEFAULT_DRAFT: BirthChartDraft = {
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  moonSign: "",
  risingSign: ""
};
const RISK_MODES: readonly { value: RiskMode; label: string }[] = [
  { value: "grounded", label: "Grounded" },
  { value: "balanced", label: "Balanced" },
  { value: "chaotic", label: "Chaotic" }
];

interface StoredCosmicProfile {
  readonly version: 1;
  readonly draft: BirthChartDraft;
  readonly riskMode: RiskMode;
}

function isRiskMode(value: unknown): value is RiskMode {
  return value === "grounded" || value === "balanced" || value === "chaotic";
}

function isSignValue(value: unknown): value is ZodiacSign | "" {
  return (
    value === "" ||
    (typeof value === "string" && (ZODIAC_SIGNS as readonly string[]).includes(value))
  );
}

function readStoredProfile(): StoredCosmicProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredCosmicProfile>;
    if (parsed.version !== 1 || !parsed.draft || !isRiskMode(parsed.riskMode)) {
      return null;
    }
    return {
      version: 1,
      riskMode: parsed.riskMode,
      draft: {
        birthDate: typeof parsed.draft.birthDate === "string" ? parsed.draft.birthDate : "",
        birthTime: typeof parsed.draft.birthTime === "string" ? parsed.draft.birthTime : "",
        birthPlace: typeof parsed.draft.birthPlace === "string" ? parsed.draft.birthPlace : "",
        moonSign: isSignValue(parsed.draft.moonSign) ? parsed.draft.moonSign : "",
        risingSign: isSignValue(parsed.draft.risingSign) ? parsed.draft.risingSign : ""
      }
    };
  } catch {
    return null;
  }
}

function signOptions() {
  return ZODIAC_SIGNS.map((sign) => (
    <option key={sign} value={sign}>
      {getZodiacToken(sign).name}
    </option>
  ));
}

function placementLabel(sign: ZodiacSign | null): string {
  return sign ? getZodiacToken(sign).name : "Unset";
}

function titleForSign(sign: ZodiacSign): string {
  return getZodiacToken(sign).name;
}

export function CosmicProfile({ heldSigns }: { heldSigns: readonly ZodiacSign[] }) {
  const [draft, setDraft] = useState<BirthChartDraft>(DEFAULT_DRAFT);
  const [riskMode, setRiskMode] = useState<RiskMode>("balanced");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredProfile();
    if (stored) {
      setDraft(stored.draft);
      setRiskMode(stored.riskMode);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        draft,
        riskMode
      } satisfies StoredCosmicProfile)
    );
  }, [draft, hydrated, riskMode]);

  const chart = useMemo(() => resolveBirthChart(draft), [draft]);
  const identityContext = useMemo(
    () => {
      const options: { sunSign?: ZodiacSign; moonSign?: ZodiacSign; risingSign?: ZodiacSign } = {};
      if (chart.sunSign) options.sunSign = chart.sunSign;
      if (chart.moonSign) options.moonSign = chart.moonSign;
      if (chart.risingSign) options.risingSign = chart.risingSign;

      return getZodiacIdentityContext(
        {
          holdings: ZODIAC_SIGNS.map((sign) => ({
            sign,
            held: heldSigns.includes(sign)
          }))
        },
        options
      );
    },
    [chart.moonSign, chart.risingSign, chart.sunSign, heldSigns]
  );
  const aura = useMemo(
    () => buildAuraProfile(chart, riskMode, heldSigns),
    [chart, heldSigns, riskMode]
  );
  const basket = useMemo(
    () => buildZodiaBasket(chart, riskMode, heldSigns),
    [chart, heldSigns, riskMode]
  );
  const heroSign = chart.sunSign ?? heldSigns[0] ?? "leo";
  const heroStyle = { "--sign-accent": SIGN_COLORS[heroSign] } as CSSProperties;

  function updateDraft<K extends keyof BirthChartDraft>(key: K, value: BirthChartDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="cosmic-profile">
      <section className="card aura-card" style={heroStyle}>
        <div className="row spread">
          <div>
            <span className="eyebrow">About me</span>
            <h2>{aura?.title ?? "Build your Zodia Aura"}</h2>
            <p className="aura-subtitle">
              {aura?.subtitle ?? "Add a birth date to unlock chart-based token affinities."}
            </p>
          </div>
          <SignIcon sign={heroSign} size={48} />
        </div>

        {aura ? (
          <>
            <p className="aura-temperament">{aura.marketTemperament}</p>
            <p className="aura-about">{aura.about}</p>
            <div className="aura-facts">
              <span>{aura.dominantElement} dominant</span>
              <span>{aura.dominantModality} mode</span>
              <span>{identityContext.wheelCoverage}% shelf coverage</span>
            </div>
            <div className="aura-strengths">
              {aura.strengths.map((strength) => (
                <span key={strength}>{strength}</span>
              ))}
            </div>
            <p className="aura-shadow">{aura.shadow}</p>
            <ShareButton
              label="Share my Aura"
              text={auraShareText(aura, basket)}
              embedPath="/profile"
            />
          </>
        ) : (
          <p className="aura-about">
            Your Aura blends chart placements, optional verified zodiac holdings, and your chosen
            risk mood into a symbolic crypto profile.
          </p>
        )}
      </section>

      <section className="card chart-card">
        <div>
          <h2>Birth chart</h2>
          <p className="muted">
            Sun is calculated from date. Moon and Rising are optional manual inputs for this pass.
          </p>
        </div>
        <div className="field-grid">
          <label className="field-label">
            Birth date
            <input
              className="field"
              type="date"
              value={draft.birthDate ?? ""}
              onInput={(event) => updateDraft("birthDate", event.currentTarget.value)}
              onChange={(event) => updateDraft("birthDate", event.currentTarget.value)}
            />
          </label>
          <label className="field-label">
            Birth time
            <input
              className="field"
              type="time"
              value={draft.birthTime ?? ""}
              onInput={(event) => updateDraft("birthTime", event.currentTarget.value)}
              onChange={(event) => updateDraft("birthTime", event.currentTarget.value)}
            />
          </label>
          <label className="field-label field-wide">
            Birth place
            <input
              className="field"
              placeholder="City, country"
              value={draft.birthPlace ?? ""}
              onInput={(event) => updateDraft("birthPlace", event.currentTarget.value)}
              onChange={(event) => updateDraft("birthPlace", event.currentTarget.value)}
            />
          </label>
          <label className="field-label">
            Moon
            <select
              className="field"
              value={draft.moonSign ?? ""}
              onChange={(event) =>
                updateDraft("moonSign", event.currentTarget.value as ZodiacSign | "")
              }
            >
              <option value="">Unknown</option>
              {signOptions()}
            </select>
          </label>
          <label className="field-label">
            Rising
            <select
              className="field"
              value={draft.risingSign ?? ""}
              onChange={(event) =>
                updateDraft("risingSign", event.currentTarget.value as ZodiacSign | "")
              }
            >
              <option value="">Unknown</option>
              {signOptions()}
            </select>
          </label>
        </div>
        <div className="placement-row">
          <span>Sun: {placementLabel(chart.sunSign)}</span>
          <span>Moon: {placementLabel(chart.moonSign)}</span>
          <span>Rising: {placementLabel(chart.risingSign)}</span>
        </div>
        <div className="chips" aria-label="Risk mood">
          {RISK_MODES.map((mode) => (
            <button
              key={mode.value}
              className="chip"
              data-active={mode.value === riskMode}
              onClick={() => setRiskMode(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card basket-card">
        <div className="row spread">
          <div>
            <h2>Cosmic Basket</h2>
            <p className="muted">A symbolic watchlist from chart, Aura, and shelf context.</p>
          </div>
          <span className="basket-total">100%</span>
        </div>
        {basket.length > 0 ? (
          <div className="basket-list">
            {basket.map((entry) => (
              <Link key={entry.sign} className="basket-row" href={`/exchange/${entry.sign}`}>
                <SignIcon sign={entry.sign} size={34} />
                <span className="grow">
                  <span className="basket-name">
                    {titleForSign(entry.sign)} · ${entry.ticker}
                  </span>
                  <span className="basket-reason">{entry.reason}</span>
                </span>
                <span className="basket-allocation">{entry.allocation}%</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">Add a birth date or connect a shelf to form your first basket.</p>
        )}
        <p className="disclaimer">
          Cosmic Basket is an entertainment watchlist, not financial advice or automated portfolio
          management.
        </p>
      </section>

      {identityContext.alignments.length > 0 ? (
        <section className="card alignment-card">
          <h2>Chart x shelf</h2>
          <div className="alignment-list">
            {identityContext.alignments.map((alignment) => (
              <div key={alignment.placement} className="alignment-row">
                <span>{alignment.placement}</span>
                <strong>{titleForSign(alignment.sign)}</strong>
                <em>{alignment.held ? "held in shelf" : "not held yet"}</em>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
