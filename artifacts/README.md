# Frozen review artifacts

These are unreleased review candidates, not npm publications. Never replace an
existing version's bytes. SDK PR #5 remains explicitly held for review and
publication authority.

| Archive                         | Source commit                              | SHA-256                                                            |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| `zodiacs-engine-0.1.1-rc.2.tgz` | `0da0941e23035df3be95e5aa40f4f270222b57dd` | `b5c0c63bddc8c1ccfc717551bdd57b1bfe7c439568851780575c8586456e0826` |

The rc.2 optional GeoNames client permits a later explicit call to retry a
rejected fetch/HTTP/JSON-parsing request. It does not add automatic retries or
validate structurally invalid JSON. The site and public starter retain their
separate immutable rc.1 archive. See [evidence](../docs/platform/EVIDENCE.md).
