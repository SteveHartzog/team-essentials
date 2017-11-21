# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Remove vsix used in testing

## [1.1.1] - 2017-11-21

### Changed

- README.md corrected to point to overall release notes, not the original 1.0 Mult-Root Update.

### Fixed

- Bonehead override of welcome for testing has been removed.

## [1.1.0] - 2017-11-20

### Changed

- Updated the location of the release notes.
- Refactored ui.ShowChoices() & ShowMessage to await a string from an async promise, instead of using a callback.
- Refactored welcome, activate & register methods to fix bugs with activation.
- Refactored wizards to accommodate new UI controls and for more interaction consistency and clarity.
- Refactored the `Change Windows Shell` feature so that it works in or out of a workspace.

### Fixed

- Bug in apply team extensions prevented any installations.

## [1.0.2] - 2017-11-17

### Fixed

- Prevent configuration files from being written if empty.
- Major bug in activation events prevented new users from running the configWizard.

### Changed

- Updated slack badge: `# vscode-dev-community | team-essentials`

### Added

- Add tslint & markdown lint config.
- Added linting to project tasks.

## [1.0.1] - 2017-11-15

### Fixed

- getGlobal was pulling the wrong value for workspaces (was globalValue, now is workspaceValue)
- MultiRoot config.js was being saved to the wrong location '/' instead of `ConfigurationFiles.teamEssentialsSingleRoot`
- When you saved a shell, it was writing to the workspace config in multi-root - it is now saving to the user's global.

### Added

- Added `teamEssentials.logLevel` setting. Options include 'errors' (only), 'info' (default) and 'verbose'.

### Changed

- Replaced `comment-json` with Microsoft's `jsonc-parser`

## [1.0.0] - 2017-11-13

### Added

- Welcome message now appears if not disabled and Team Essentials has been updated since the last time you opened VS Code. It comes with (3) options:
  1. View Documentation: Opens the [documentation wiki](https://github.com/SteveHartzog/team-essentials/wiki).
  2. Run Configuration Wizard: Starts the new configuration wizard (see below).
  > This essentially uses a new configuration setting `teamEssentials.disableWelcome`.
  3. Never Show Again: Prevents the welcome message from ever showing again.
- Configuration Wizard: Depending on the state of your project one wizard will run (on all folders in the current workspace):
  1. New User Wizard: This will create the `.vscode/team-essentials` directory, all config files (with some defaults), will copy the existing `.vscode/settings.json` file into a `.vscode/team-essentials/settings.json` file (for single-root only) or to the multi-root workspace file (to support local explorer filtering) and will append the needed settings to your `.gitignore` file. This will occur on all workspaces.
  2. Migration Wizard: This will take the old `.vscode/team.json` and split it out into (4) files in the `.vscode/team-essentials` folder. The migration will only be done on workspaces that currently have a `.vscode/team.json`.
- Multi-root workspace support. Major refactor for 1.18+. ([@SteveHartzog](https://github.com/stevehartzog) in [#8](https://github.com/SteveHartzog/team-essentials/issues/8))
  - Statusbar now shows workspace name as a prefix to the filter if in a mult-root workspace. Additionally the filter selection indicates which workspace you are filtering (based on what document is open in the editor).
  - Statusbar is hidden if in a root folder that does not have a `.vscode/team-essentials/filters.json` configuration.
- Added new configuration settings:
  - `teamEssentials.disableWelcome`: Disables the Welcome message.
  - `teamEssentials.currentVersion`: Stores the current version of the Team Essentials extension.
  - `teamEssentials.statusbar.disable`: Disables the statusbar.
  - `teamEssentials.statusbar.align`: Specifies if the statusbar should be aligned 'left' or 'right'.
  - `teamEssentials.statusbar.hideIcon`: Hides the icon for the filter on the statusbar.
  - `teamEssentials.statusbar.icon`: Set a custom icon from the octicon list @ [https://octicons.github.com/](https://octicons.github.com/).
  - `teamEssentials.statusbar.priority`:Set a custom priority for the statusbar setting.
- Added badges to `README.md`: vscode, issues, license.
- Added social links (twitter & slack) to `README.md` header.

### Changed

- Statusbar icon defaults to 'search' instead of 'repo' now.
- Team configuration files split from a single file `.vscode/team.json` to multiple files in `.vscode/team-essentials`.
- State file changed/moved from `.vscode/user.json` to `.vscode/team-essentials/state.json`
- Change Shell has been updated to actually kill and restart the current terminal... allowing a single click change of your current shell without any additional steps.
- The user shell choice is no longer saved to state nor applied.
- Overhauled wiki to reflect the rewrite.
- Old `src/utils` has been refactored into an `API` under the `./api` folder. So now you can access the entire API with one `import * as API from './api';`.

### Removed

- No one was rating the extension so I removed the badge from the `README.md`.

### Deprecated

- `.vscode/team.json` & `.vscode/user.json` are no longer needed and can be removed from your project and your `.gitignore` (after migration using the wizard).
- The migration wizard will be removed in a few minor releases (~1.2) as it is only for the legacy users (pre 1.0.0).

## [0.2.10] - 2017-03-06

### Fixed

- Version comparison fix for 1.10+. ([@SteveHartzog](https://github.com/stevehartzog) in [#7](https://github.com/SteveHartzog/team-essentials/issues/7))

## [0.2.9] - 2017-02-06

### Fixed

- Fix breaking change in vscode 1.9.0.  ([@SteveHartzog](https://github.com/stevehartzog) in [#5](https://github.com/SteveHartzog/team-essentials/issues/5))

## [0.2.8] - 2017-01-08

### Added

- Allow default settings to be reapplied (even if previously applied). ([@SteveHartzog](https://github.com/stevehartzog) in [#3](https://github.com/SteveHartzog/team-essentials/issues/3))

## [0.2.7] - 2017-01-07

### Fixed

- Team Default settings added incorrectly to `{project}\.vscode\settings.json`. ([@SteveHartzog](https://github.com/stevehartzog) in [#1](https://github.com/SteveHartzog/team-essentials/issues/1))
- New users have default teriminal applied incorrectly. ([@SteveHartzog](https://github.com/stevehartzog) in [#4](https://github.com/SteveHartzog/team-essentials/issues/4))

### Changed

- Simplified the `README.md` and moved the bulk of the documentation to the wiki, changes to `CHANGELOG.md`.

### Added

- Added `CONTRIBUTING.md` to provide instructions for submitting issues and feature enhancements.
- Added VSCode Marketplace & David Badges.
- Added commit guidelines and style guide to the wiki.
- Added tslint to the project.
- Added vs code default project settings to team.json

## [0.2.6] - 2016-12-13

### Changed

- Made the debug experience configurable.

### Fixed

- Corrected some file loading issues.

## [0.2.5] - 2016-11-28

### Fixed

- Watcher now allows changes to `team.json` to be immediately reflected in the `explorerFilter`.

## [0.2.4] - 2016-11-28

### Fixed

- Corrected some typos.

## [0.2.3] - 2016-11-28

### Fixed

- Statusbar errored because it was calling the wrong command.

## [0.2.2] - 2016-11-28

### Fixed

- Squashed an initial loading bug.

## [0.2.1] - 2016-11-28

### Fixed

- Loading issue with `team.json` schema.

## [0.2.0] - 2016-11-28

### Changed

- First published version of Team Essentials.