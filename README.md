# GitHub trending snapshots

Daily JSON snapshots of the GitHub Trending page (daily, weekly, monthly; top 25). Written by a scheduled GitHub Actions workflow into `lists/<YYYY-MM-DD>/<list>.json` and `lists/latest/`. Public data only; consumed by Tenon's trending digest, which runs where github.com is not reachable.
