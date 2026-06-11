use std::path::Path;

use pretty_assertions::assert_eq;

use crate::package_manager::PackageManager;
use crate::ports::fs::{FileSystem, InMemoryFs};

/// A project whose only lockfile is `lockfile`, rooted at `dir`.
fn project_with(lockfile: &str, dir: &str) -> InMemoryFs {
    let fs = InMemoryFs::new();
    fs.write(&Path::new(dir).join(lockfile), b"").unwrap();
    fs
}

#[test]
fn detects_pnpm_from_its_lockfile() {
    let fs = project_with("pnpm-lock.yaml", "project");

    assert_eq!(
        PackageManager::detect(&fs, Path::new("project")),
        PackageManager::Pnpm
    );
}

#[test]
fn detects_yarn_from_its_lockfile() {
    let fs = project_with("yarn.lock", "project");

    assert_eq!(
        PackageManager::detect(&fs, Path::new("project")),
        PackageManager::Yarn
    );
}

#[test]
fn detects_bun_from_its_lockfile() {
    let fs = project_with("bun.lockb", "project");

    assert_eq!(
        PackageManager::detect(&fs, Path::new("project")),
        PackageManager::Bun
    );
}

#[test]
fn detects_npm_from_its_lockfile_skipping_the_absent_ones() {
    // Only npm's lockfile is present, so detection walks past pnpm/yarn/bun.
    let fs = project_with("package-lock.json", "project");

    assert_eq!(
        PackageManager::detect(&fs, Path::new("project")),
        PackageManager::Npm
    );
}

#[test]
fn defaults_to_npm_when_no_lockfile_is_present() {
    let fs = InMemoryFs::new();

    assert_eq!(
        PackageManager::detect(&fs, Path::new("project")),
        PackageManager::Npm
    );
}

#[test]
fn prefers_pnpm_over_npm_when_both_lockfiles_exist() {
    let fs = project_with("pnpm-lock.yaml", "project");
    fs.write(Path::new("project/package-lock.json"), b"").unwrap();

    assert_eq!(
        PackageManager::detect(&fs, Path::new("project")),
        PackageManager::Pnpm
    );
}

#[test]
fn maps_each_manager_to_its_program_name() {
    assert_eq!(PackageManager::Pnpm.program(), "pnpm");
    assert_eq!(PackageManager::Npm.program(), "npm");
    assert_eq!(PackageManager::Yarn.program(), "yarn");
    assert_eq!(PackageManager::Bun.program(), "bun");
}

#[test]
fn builds_an_add_argument_list_for_pnpm() {
    assert_eq!(
        PackageManager::Pnpm.install_args(&["@primitiv-ui/react", "@primitiv-ui/icons"]),
        vec![
            "add".to_string(),
            "@primitiv-ui/react".to_string(),
            "@primitiv-ui/icons".to_string(),
        ]
    );
}

#[test]
fn builds_an_install_argument_list_for_npm() {
    assert_eq!(
        PackageManager::Npm.install_args(&["@primitiv-ui/react"]),
        vec!["install".to_string(), "@primitiv-ui/react".to_string()]
    );
}
