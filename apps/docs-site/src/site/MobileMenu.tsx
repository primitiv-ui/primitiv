"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Close, Menu } from "@primitiv-ui/icons";

import { Button } from "@/components/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer";

import { HeaderModeControls } from "./HeaderModeControls";
import { SideNav } from "./SideNav";

import "./mobile-menu.css";

/**
 * The mobile menu — a burger button that opens a left drawer holding everything
 * the header sheds on a narrow viewport: the framework / consumption-mode
 * switches (hidden below 48rem) and the full documentation nav (the sidebar is
 * hidden below 64rem). The burger itself only shows below 64rem, where the
 * sidebar is gone.
 *
 * Controlled, so it can close itself on navigation — a nav link is a client-side
 * route change, which would otherwise leave the drawer open over the new page.
 * `usePathname` changing is the signal. The `SideNav` inside is the SAME
 * component the desktop rail renders, so the two never diverge.
 */
export const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="docs-mobile-menu-trigger"
          aria-label="Open menu"
        >
          <Menu aria-hidden="true" />
        </button>
      </DrawerTrigger>

      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent side="left" width="lg" className="docs-mobile-drawer">
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" aria-label="Close menu">
                <Close aria-hidden="true" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <DrawerBody>
            <div className="docs-mobile-drawer-controls">
              <HeaderModeControls size="sm" />
            </div>
            <SideNav />
          </DrawerBody>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};
