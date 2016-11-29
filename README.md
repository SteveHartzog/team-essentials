# Team Essentials
  ![Team Essentials](./images/team-essentials.png)

  Team essentials was designed to help team leads define default settings, default extensions and allow easy configuration per developer within the constraints provided by the team lead. For instance: required extensions will be installed if defined when the project is opened for the first time.

## After installation steps:
> This extension will not work until you follow these steps.
1. Add `.vscode/user.json` and vscode's workspace settings (`.vscode/settings.json`) to `.gitignore` (and remove them if they are already in your git source). This will allow individual team member workspace settings to be modified without being committed to your project.
   - `terminal`: This sets the users' default shell and will be applied every time the project is loaded.
   - `extensions.required.installed`: This confirms that the required extensions have been installed.
   - `explorer.filter`: This sets the users filter that will be applied every time the project is loaded.
2. Create a `.vscode/team.json` to configure your teams' settings. Team Essentials adds intellisense to make this easy.
   - `defaults`: Put all of your default workspace settings (editor.tabSize, stylelint.enable, etc).
   - `explorer.filters`: Put your custom workspace filters in named groups. A `default` group must be created that will be applied with each filter except for the `admin` filter. You must have at least `default`, `admin` and one other group.
   - `extensions.required`: Purl an array of strings representing the extensions that **must** be installed with your projects in the "publisher.project" fromat (e.g. "msjsdiag.debugger-for-chrome").

# Features
> This extension will not work until you do the after installation steps.

## Commands
### `Team Essentials: Change Workspace Shell`<br/><small>teamEssentials.changeWindowsShell</small><br/>
You can change your workspace shell very easily with a simple selection. This setting is then persisted at `.vscode/user.json#terminal`.
  ![Change Workspace Shell](./images/change-shell.png)
> Currently this works for windows users only.

### `Team Essentials: Filter Explorer`<br/><small>teamEssentials.filterExplorer</small><br/>
You can define different groups of files to be be excluded. For instance, one for nodejs backend and one for frontend devs. A `default` group will be applied in addition to group filters to all but the `admin` filter. Developers can then set their desired filter with a quickpick.
  ![Filter Explorer](./images/filter-explorer.png)

### `Team Essentials: Update Team Extensions`<br/><small>teamEssentials.updateExtensions</small><br/>
You can define a list of required Team extensions (recommended extensions comes out of the box) in the team.json under `extensions.required` that must be installed. These extensions are installed the first time the project is loaded with Team Essentials. You can also run it manually with a quickpick for Required, Recommended (which is loaded from extensions.json) or All.
  ![Required Extensions](./images/required-extensions.png)


## Debugging
### onDebugStart
When you start a debugging session, the debug view and console are shown.

### `shift+f5`
When you stop a debugging session with `shift+f5`, the explorer view and output window are shown.


## Change Log
### 0.2.5

Bug Fixes:
 - Watcher now works so changes to team.json can immediately be reflected in the explorerFilter.

### 0.2.4

Bug Fixes:
 - Addressed some typos.

### 0.2.3

Bug Fixes:
 - Statusbar command called the wrong command.

### 0.2.2

Bug Fixes:
 - Fixed an initial loading bug.

### 0.2.1

Fixed team.json schema load issue.

### 0.2.0

First published version of Team Essentials.