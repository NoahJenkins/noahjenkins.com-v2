# Prune dependency overrides

On November 2, 2026, each workspace override was removed alone, the lockfile was resolved again with pnpm 10.17.1, and `pnpm audit --json` was compared with the baseline. Then all candidates were removed together and the resolved versions were compared.

## Removed

Ten overrides bring back no advisory: `@babel/core`, `brace-expansion`, `js-yaml`, `minimatch: ">=10.2.1"`, `nanoid`, `picomatch`, `sharp`, `source-map-js`, `test-exclude`, and `ws`.

- `minimatch: ">=10.2.1"` overlapped `"minimatch@<11.0.1": ">=11.0.1"`. Every `minimatch` copy still resolves to 11.0.4.
- Without `js-yaml`, the Jest coverage path (`@istanbuljs/load-nyc-config`) resolves `js-yaml@3.15.2`, `argparse@1.0.10`, and `sprintf-js@1.0.3` again. The October 20 override removed that path for alert #66 (GHSA-hp3w-g68c-fv3c). GitHub withdrew that advisory on 2026-10-22. The tests keep their direct `js-yaml` 4.3.2 development dependency.
- Other version changes: `nanoid` 3.3.18 → 3.3.20, `test-exclude` 8.0.0 → 7.0.2, and `picomatch@2.3.2` returns beside 4.0.7. The GitHub Advisory Database lists no active advisory for any of these versions.

## Kept

- `"glob@>=9.0.0 <=14.0.1": ">=14.0.2"` and `"minimatch@<11.0.1": ">=11.0.1"`: without them, GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249 return.
- `postcss: "8.5.30"`: removing it brings back no advisory (Next.js would resolve 8.5.23, which is patched for GHSA-fxqj-rqcc-2cmp). It stays because `test/github/dependabot-controller-policy.test.ts` edits the `postcss` line of the committed file.

## Verification

`pnpm audit` reports only `deepmerge` (GHSA-gcqx-w48m-w2h4, low, no patched release) before and after. Jest (24 suites, 408 tests), `tsc --noEmit`, and `next build` pass.
