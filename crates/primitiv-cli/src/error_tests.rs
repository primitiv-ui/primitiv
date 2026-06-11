use std::io;

use harmoni_core::ColorInputError;
use pretty_assertions::assert_eq;

use crate::error::CliError;

#[test]
fn maps_each_variant_to_a_stable_exit_code() {
    assert_eq!(CliError::Usage("bad".to_string()).exit_code(), 2);
    assert_eq!(
        CliError::InvalidColor(ColorInputError::InvalidCss("zzz".to_string())).exit_code(),
        3
    );
    assert_eq!(
        CliError::Io(io::Error::new(io::ErrorKind::PermissionDenied, "nope")).exit_code(),
        4
    );
}

#[test]
fn renders_a_usage_message_verbatim() {
    let error = CliError::Usage("unknown command 'frob'".to_string());

    assert_eq!(error.to_string(), "unknown command 'frob'");
}

#[test]
fn renders_an_invalid_colour_with_the_offending_value() {
    let error = CliError::InvalidColor(ColorInputError::InvalidCss("zzz".to_string()));

    assert_eq!(error.to_string(), "invalid colour 'zzz'");
}

#[test]
fn renders_an_io_error_through_its_own_display() {
    let error = CliError::Io(io::Error::new(io::ErrorKind::NotFound, "no such file"));

    assert_eq!(error.to_string(), "no such file");
}
