import { SkipNavLinkProps } from "./types";

function SkipNavLink({ children, ...rest }: SkipNavLinkProps) {
  return <a {...rest}>{children}</a>;
}

SkipNavLink.displayName = "SkipNavLink";

const SkipNav = {
  Link: SkipNavLink,
};

export { SkipNav };
