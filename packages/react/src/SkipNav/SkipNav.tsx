import { SkipNavContentProps, SkipNavLinkProps } from "./types";

const DEFAULT_CONTENT_ID = "primitiv-skip-nav";

function SkipNavLink({
  children,
  contentId = DEFAULT_CONTENT_ID,
  ...rest
}: SkipNavLinkProps) {
  return (
    <a href={`#${contentId}`} {...rest}>
      {children}
    </a>
  );
}

SkipNavLink.displayName = "SkipNavLink";

function SkipNavContent({ children, ...rest }: SkipNavContentProps) {
  return (
    <div id={DEFAULT_CONTENT_ID} tabIndex={-1} {...rest}>
      {children}
    </div>
  );
}

SkipNavContent.displayName = "SkipNavContent";

const SkipNav = {
  Link: SkipNavLink,
  Content: SkipNavContent,
};

export { SkipNav };
