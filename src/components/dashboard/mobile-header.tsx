"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="text-lg font-bold">
          BarberLine AI
        </Link>

        <UserButton afterSignOutUrl="/" />
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="text-xl font-bold"
              >
                BarberLine AI
              </Link>
            </SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
