import { SkipNavLinkProps } from "./types";

function SkipNavLink({ children, contentId, ...rest }: SkipNavLinkProps) {
  return (
    <a href={`#${contentId}`} {...rest}>
      {children}
    </a>
  );
}

SkipNavLink.displayName = "SkipNavLink";

const SkipNav = {
  Link: SkipNavLink,
};

export { SkipNav };
