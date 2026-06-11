use std::path::Path;

use crate::ports::fs::FileSystem;

/// The Node package managers the CLI can drive (RFC 0005 §2.1 / D49 — pnpm,
/// npm, yarn, bun; Deno is out of scope for v1). `add` detects which one a
/// project uses from its lockfile, then runs that manager to install the
/// headless package.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PackageManager {
    Pnpm,
    Npm,
    Yarn,
    Bun,
}

/// The lockfiles that identify each manager, in the precedence `detect` applies
/// when a project carries more than one (RFC 0005 §2.1).
const LOCKFILES: [(&str, PackageManager); 4] = [
    ("pnpm-lock.yaml", PackageManager::Pnpm),
    ("yarn.lock", PackageManager::Yarn),
    ("bun.lockb", PackageManager::Bun),
    ("package-lock.json", PackageManager::Npm),
];

impl PackageManager {
    /// Detect the manager from the lockfile in `dir` (RFC 0005 §2.1). The fixed
    /// [`LOCKFILES`] precedence makes a project with several lockfiles resolve
    /// deterministically; with none present, npm is the baseline (it ships with
    /// Node).
    pub fn detect(fs: &impl FileSystem, dir: &Path) -> PackageManager {
        for (lockfile, manager) in LOCKFILES {
            if fs.exists(&dir.join(lockfile)) {
                return manager;
            }
        }
        PackageManager::Npm
    }

    /// The program name to invoke on the command line.
    pub fn program(self) -> &'static str {
        match self {
            PackageManager::Pnpm => "pnpm",
            PackageManager::Npm => "npm",
            PackageManager::Yarn => "yarn",
            PackageManager::Bun => "bun",
        }
    }

    /// The full argument list to install `packages` — the manager's add
    /// subcommand (`add` for pnpm/yarn/bun, `install` for npm) followed by the
    /// package names, e.g. `["add", "@primitiv-ui/react"]`.
    pub fn install_args(self, packages: &[&str]) -> Vec<String> {
        let subcommand = match self {
            PackageManager::Npm => "install",
            _ => "add",
        };
        let mut args = vec![subcommand.to_string()];
        args.extend(packages.iter().map(|package| package.to_string()));
        args
    }
}
