import { Menu } from "lucide-react";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import MenuBar from "./MenuBar";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* =================================================
          HAMBURGER BUTTON
      ================================================== */}

      <SheetTrigger data-testid="mobile-sidebar-trigger">
        <Button
          variant="outline"
          size="icon"
          className="
            size-10
            shrink-0
            md:hidden
          "
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>


      {/* =================================================
          MOBILE SIDEBAR
      ================================================== */}

      <SheetContent
        side="left"
        className="
          w-72
          p-0
          bg-sidebar
          text-sidebar-foreground
        "
      >

        {/* Logo */}

        <SheetHeader
          className="
            h-16
            border-b
            border-sidebar-border
            px-4
            text-left
          "
        >
          <SheetTitle
            className="
              flex
              items-center
              gap-3
              text-sidebar-foreground
            "
          >

            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-primary/20 shadow-xs">
              <img src="/icons/icon-192.png" alt="SFF" className="size-full object-cover" />
            </span>

            <span>
              <span className="block text-sm font-bold">
                Sarpanch
              </span>

              <span className="block text-[10px] font-normal text-sidebar-foreground/60">
                Fashion Fab
              </span>
            </span>

          </SheetTitle>
        </SheetHeader>


        {/* Menu */}

        <div
          onClick={() => setOpen(false)}
          className="h-[calc(100vh-4rem)]"
        >
          <MenuBar />
        </div>

      </SheetContent>
    </Sheet>
  );
}