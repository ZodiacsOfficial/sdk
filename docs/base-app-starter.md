# Base App Starter Guide

See `examples/base-app`.

The starter is a read-only Base profile app using Next.js, wagmi, viem, TanStack Query, Base Account,
and SDK React/UI subpaths. It includes Base mainnet and Base Sepolia config.

Base Builder Codes are configured through `NEXT_PUBLIC_BASE_BUILDER_CODE` and `dataSuffix`, but the starter
does not include transaction UI. Base App automatic attribution and outside-Base-App web attribution belong
in the app layer.
