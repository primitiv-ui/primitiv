/*
 * ConfirmDialog styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Unlike the generated registry components, ConfirmDialog's wrapper is
 * hand-authored (confirm-dialog.tsx) — it composes Modal's own Content/Header/
 * Body/Footer/Title/Close parts rather than introducing new dialog anatomy.
 * This recipe adds a single reserved `.primitiv-confirm-dialog` marker class
 * alongside Modal's own `modal({size})` classes, carrying no declarations of
 * its own today; size and tone are plain props (size forwards to Modal's own
 * size modifier, tone selects the Confirm button's variant), so neither needs
 * a class here. Change registry/components/confirm-dialog/contract.json + this
 * file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const confirmDialog = cva("primitiv-confirm-dialog");

export type ConfirmDialogVariants = VariantProps<typeof confirmDialog>;
