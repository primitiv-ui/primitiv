pub mod cli;
pub mod commands;
pub mod config;
pub mod detect;
pub mod error;
pub mod format;
pub mod package_manager;
pub mod ports;
pub mod registry;
pub mod run;

#[cfg(test)]
mod cli_tests;
#[cfg(test)]
mod config_tests;
#[cfg(test)]
mod detect_tests;
#[cfg(test)]
mod error_tests;
#[cfg(test)]
mod package_manager_tests;
#[cfg(test)]
mod registry_tests;
#[cfg(test)]
mod run_tests;
