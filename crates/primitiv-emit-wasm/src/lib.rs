//! wasm bindings for `primitiv-emit` — the token emitter, reachable from a
//! JavaScript consumer.
//!
//! **This layer holds no decisions, deliberately.** It deserialises, dispatches and
//! maps an error; everything else — which serialiser a format selects, whether a
//! colour comes out as `oklch()` or hex, how a wire payload becomes ramps — lives in
//! `primitiv_emit::export`, under that crate's 100% lines/regions/functions gate.
//!
//! The reason is not taste. A `cdylib` has no test target, and `JsError::new`
//! panics off-wasm (*"cannot call wasm-bindgen imported functions on non-wasm
//! targets"*), so nothing written here can be exercised by `cargo test` at all.
//! Anything that could be wrong therefore belongs on the other side of the call.
//!
//! It also exists because a second serialiser is forbidden (RFC 0029 D5): a
//! consumer emitting CSS must go through this crate rather than reimplementing the
//! emitter in TypeScript, or the two would drift and only one of them would be the
//! one Primitiv ships.

use wasm_bindgen::prelude::*;

use primitiv_emit::export::{ExportFormat, ExportInput, ExportRequest};

fn to_js_error(e: impl std::fmt::Debug) -> JsError {
    JsError::new(&format!("{e:?}"))
}

/// Emit a whole palette as `css`, `scss`, `tailwind` or `dtcg`.
///
/// `request` is an `ExportInput`: `{ seeds: [{ family, seed }], steps, neutral?,
/// roles? }`, every colour a CSS string. Returns the file's contents.
///
/// An unknown format name is an error rather than a fallback — writing a stylesheet
/// when the caller asked for a token file would be worse than refusing.
#[wasm_bindgen]
pub fn emit_export(request: JsValue, format: &str) -> Result<String, JsError> {
    let input: ExportInput = serde_wasm_bindgen::from_value(request).map_err(to_js_error)?;
    let format = ExportFormat::parse(format)
        .ok_or_else(|| JsError::new(&format!("Unknown export format: {format}")))?;
    let request: ExportRequest = input.into();
    primitiv_emit::export::emit_export(&request, format).map_err(to_js_error)
}
