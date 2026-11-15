# Start here

This repository has local Phase 1 improvements awaiting review. Nothing has been published by this work.

1. Read docs/workspace-audit-and-migration.md for all projects and the staged migration plan.
2. Read docs/client-and-schema.md before adapting any website.
3. Read docs/channel-identities.md before enabling a creator. Five candidates remain disabled.
4. With Node 22+, run npm test. No install is needed.
5. Do not run npm run update casually: it writes public/data and requires the server-side YOUTUBE_API_KEY environment variable. Tests use mock data and never need that key.
6. A later, separately approved deployment should use the existing update-youtube workflow. It commits generated JSON and explicitly deploys Pages. This local phase did not execute it.

## Existing custom domain

On 14 November 2026, DNS api.creatorpromote.com was verified as a CNAME to thewebtuber.github.io; all four existing HTTPS feed endpoints returned HTTP 200 and Access-Control-Allow-Origin: *. The unauthenticated repository Pages-settings API returned 404, which does not establish whether settings are absent or simply require authentication. Before a future deployment, inspect Settings > Pages and confirm Source: GitHub Actions, Custom domain: api.creatorpromote.com and HTTPS enforcement.

public/CNAME records the intended domain, but GitHub custom Actions deployments ignore this file for domain configuration. The repository Pages setting remains authoritative. Do not change DNS or domain settings as part of a routine feed migration. Reference: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Future activation

For each disabled creator, complete the documented identity verification, record evidence, then obtain activation approval. Only then set identityVerified:true and enabled:true. No candidate was enabled during Phase 1. Preserve the existing Actions secret; never put keys in public files.
