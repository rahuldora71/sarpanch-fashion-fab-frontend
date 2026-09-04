import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { NavLink } from "react-router-dom";

import { menuItems } from "@/config/menuItems";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import { cn } from "@/lib/utils";

export default function MobileMenu() {
    const [open, setOpen] = useState(false);

    const bottomItems = menuItems.filter(
        (item) => item.bottomNav
    );

    const moreItems = menuItems.filter(
        (item) => !item.bottomNav
    );

    return (
        <Sheet
            open={open}
            onOpenChange={setOpen}
        >

            {/* =====================================================
          MOBILE / TABLET BOTTOM NAVIGATION
      ====================================================== */}

            <div
                className="
          fixed
          bottom-0
          left-0
          right-0
          z-50
          border-t
          border-border
          bg-background
          md:hidden
        "
            >
                <div
                    className="
            mx-auto
            grid
            h-16
            w-full
            max-w-xl
            grid-cols-5
          "
                >

                    {/* =================================================
              MAIN NAVIGATION
          ================================================= */}

                    {bottomItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                className={({ isActive }) =>
                                    cn(
                                        `
                    relative
                    flex
                    w-full
                    flex-col
                    items-center
                    justify-center
                    gap-1
                    text-[10px]
                    font-medium
                    transition-colors
                    `,
                                        isActive
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            className={cn(
                                                "size-5",
                                                isActive
                                                    ? "text-primary"
                                                    : "text-muted-foreground"
                                            )}
                                        />

                                        <span>
                                            {item.label === "Dashboard"
                                                ? "Home"
                                                : item.label}
                                        </span>

                                        {isActive && (
                                            <span
                                                className="
                          absolute
                          bottom-0
                          h-0.5
                          w-8
                          rounded-full
                          bg-primary
                        "
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}


                    {/* =================================================
              MORE BUTTON
          ================================================= */}

                    <SheetTrigger
                        type="button"
                        className="
                                flex
                                flex-col
                                items-center
                                justify-center
                                gap-1
                                text-[10px]
                                font-medium
                                text-muted-foreground
                                transition-colors
                                hover:text-foreground
                            "
                    >
                        <MoreHorizontal className="size-5" />

                        <span>
                            More
                        </span>
                    </SheetTrigger>
                </div>
            </div>


            {/* =====================================================
          MORE SHEET
      ====================================================== */}

            <SheetContent
                side="bottom"
                className="
          max-h-[80vh]
          rounded-t-2xl
          px-4
          pb-8
          pt-4
          sm:px-6
        "
            >

                <SheetHeader className="mb-6 text-left">
                    <SheetTitle>
                        More
                    </SheetTitle>
                </SheetHeader>


                {/* =================================================
            MORE MENU ITEMS
        ================================================= */}

                <div
                    className="
            grid
            grid-cols-3
            gap-x-4
            gap-y-7
            sm:grid-cols-4
          "
                >

                    {moreItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    cn(
                                        `
                    flex
                    min-h-16
                    flex-col
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    text-center
                    text-xs
                    font-medium
                    transition-colors
                    `,
                                        isActive
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            className={cn(
                                                "size-6",
                                                isActive
                                                    ? "text-primary"
                                                    : "text-muted-foreground"
                                            )}
                                        />

                                        <span className="max-w-28">
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                </div>

            </SheetContent>

        </Sheet>
    );
}