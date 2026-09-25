# DEPRECATED — use `versetool` (Verse tool) instead

`scripts/appmgr` is superseded by the Verse tool at `core/src/Verse.Cli`
(`versetool start/stop/restart/status/logs/health/doctor/app`,
binary built to `core/src/Verse.Cli/bin/versetool`).

* `verse` manages the new dual-process layout: Go `verse-engine` daemon
  (`core/src/Verse.Engine`) + C# `Verse.Api` (`core/src`), plus
  PostgreSQL/Redis containers in production mode.
* `verse` supports the three runtime modes (`databaseless` / `lite` /
  `production`) via `ASAGITY_MODE` / `--mode`.
* `appmgr` only knows the old single-process Go layout and is no longer
  updated. It stays here for reference until the migration is complete.
