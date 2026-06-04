# UI Component Guide

UI components are optional and live under `@zodiacs/sdk/ui`. They accept SDK data objects and do not submit
transactions.

```tsx
import { ProfileSummaryCard, ShareCardPreview, ZodiacWheel } from "@zodiacs/sdk/ui";
import { getZodiacIdentityContext, getZodiacWheelData } from "@zodiacs/sdk/core";

const context = getZodiacIdentityContext(ownership);
const wheel = getZodiacWheelData(ownership);

<ProfileSummaryCard context={context} />
<ZodiacWheel wheel={wheel} />
<ShareCardPreview context={context} />
```

Components label Solana-native and Base-bridged provenance. They intentionally avoid asset acquisition, asset disposal, asset exchange, approval,
crypto-incentive, promotional-return, or price-prediction calls to action.
