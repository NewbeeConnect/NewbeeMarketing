# Current work

Goal: patch security issues while preserving the device-aware download link.
Branch: fix/security-dependency-updates, based on current origin/main.

## Completed

- Updated Next.js and its ESLint config to stable 16.4.2, React and React DOM
  together to compatible stable 19.3.1, and available transitive security fixes.
- Added a narrow local braces patch for the upstream recursion advisory. It bounds
  parsed brace/parenthesis nesting and direct AST walkers before stack exhaustion.
- Installation applies the patch and runs its time-bounded security regression.
- The regression fails on unpatched code and passes on patched code, covering
  malicious strings/ASTs, cycles, boundary depth and ordinary glob semantics.
- Clean npm ci applies the patch; lint, TypeScript and production build pass.
- Production HTTP smoke checks pass for / and /download with iPhone, Android and
  Macintosh user agents; unknown routes still return 404.
- Production dependency audit reports no known vulnerabilities.

## Remaining

- npm audit still flags the upstream braces version and its development-tool
  dependents: it cannot detect a local source patch. The advisory is mitigated
  locally, not suppressed. Remove the patch when upstream releases a fixed version.
- Draft PR open: https://github.com/NewbeeConnect/NewbeeMarketing/pull/6
- Review and deploy separately; no merge or production deployment performed.

## Notes

Redirect logic and destination addresses are unchanged. Next correctly ignores an
unrelated lockfile outside this Git repository during the build.
