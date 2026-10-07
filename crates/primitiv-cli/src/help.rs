//! The `--help` text. Plain strings rather than generated from the parser: the
//! parser is hand-rolled (see [`crate::cli::parse`]), so there is no flag table
//! to derive these from. A flag added to a `parse_*` function needs its line
//! here too.

/// The help text for one command, or the overview when `command` is `None`.
/// `command` is always a name from [`crate::cli::COMMANDS`] — the parser
/// rejects anything else before a help request reaches here.
pub fn help_text(command: Option<&str>) -> &'static str {
    match command {
        Some("init") => INIT,
        Some("add") => ADD,
        Some("list") => LIST,
        Some("theme") => THEME,
        Some("tokens") => TOKENS,
        Some("dtcg") => DTCG,
        _ => OVERVIEW,
    }
}

const OVERVIEW: &str = "\
Usage: primitiv <command> [options]

Commands:
  init     Set up Primitiv in this project: writes primitiv.json and the token layer
  add      Copy styled components into the project, as code you own
  list     List the components the registry carries
  theme    Generate palette ramps from brand / status colours
  tokens   Emit the design-token layer as CSS, SCSS or Tailwind
  dtcg     Export palette ramps as a DTCG token document for design tools

Run `primitiv <command> --help` for a command's options.
";

const INIT: &str = "\
Usage: primitiv init [options]

Writes primitiv.json and generates the shared token layer. Prompts for any
choice not given as a flag when run in a terminal.

Options:
  --format <css|scss|tailwind>   Stylesheet format
  --name <name>                  Project name
  --brand <colour>               Brand seed colour (any CSS colour)
  --path <dir>                   Where component styles are written
  --styles | --no-styles         Copy styled surfaces, or headless only
  --alias-components <alias>     Import alias for components (detected from tsconfig)
  --force                        Overwrite an existing primitiv.json
  --yes                          Accept every default without prompting
";

const ADD: &str = "\
Usage: primitiv add <component...> | --all [options]

Copies each component's styles and React wrapper into the project and installs
the packages it needs.

Options:
  --all                          Add every component in the registry
  --dry-run                      Show the plan without changing anything
  --json                         Print the plan as JSON
  --styles-only                  Copy styles without installing the headless package
  --no-styles                    Install the headless package without copying styles
  --format <css|scss|tailwind>   Override the configured stylesheet format
  --path <dir>                   Override the configured styles path
  --force                        Overwrite files even if you have edited them
  --no-wiring                    Print the wiring snippet instead of applying it
  --registry <url|version|dir>   Use a different registry source
";

const LIST: &str = "\
Usage: primitiv list [--json]

Lists the registry's components and which are installed in this project.

Options:
  --json                         Print the list as JSON
";

const THEME: &str = "\
Usage: primitiv theme [--<family> <colour>]... [options]

Generates light and dark ramps for each seeded family. Families: brand, danger,
warning, success, info. Seeds fall back to primitiv.json's theme block.

Options:
  --<family> <colour>            Seed colour (any CSS colour, e.g. --brand #236ce1)
  --out <path>                   Where to write (defaults beside the token layer)
  --format <css|scss|tailwind>   Output format (defaults to the configured one)
  --steps <n>                    Steps per ramp, 3-32 (default 10)
";

const TOKENS: &str = "\
Usage: primitiv tokens [options]

Emits the design-token layer. Without primitiv.json or --out, streams CSS to
stdout.

Options:
  --out <path>                   Where to write
  --format <css|scss|tailwind>   Output format
  --from <palette>               Apply a palette document
  --ramps-only                   Emit only the colour ramps
";

const DTCG: &str = "\
Usage: primitiv dtcg [--<family> <colour>]... --out <path> [options]

Writes each seeded family's light and dark ramps as a DTCG token document in
hex, for importing into a design tool. Families: brand, danger, warning,
success, info.

Options:
  --<family> <colour>            Seed colour (any CSS colour)
  --out <path>                   Where to write (required)
  --steps <n>                    Steps per ramp, 3-32 (default 10)
";
