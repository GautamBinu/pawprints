"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/auth/AuthContext";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { NotificationBell } from "../Notifications/NotificationBell";
import { ModeToggle } from "@/components/mode-toggle";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="border-b h-16 bg-[#F76902]">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/pawprints-white.svg"
            alt="RIT Paw Logo"
            width={140}
            height={40}
            className="object-contain h-10 w-auto"
          />
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent text-white hover:bg-white/20 hover:text-white focus:bg-white/20 focus:text-white data-[active]:bg-white/20 data-[state=open]:bg-white/20",
                  )}
                >
                  <Link href="/about">About</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent text-white hover:bg-white/20 hover:text-white focus:bg-white/20 focus:text-white",
                  )}
                >
                  <Link href="/">Browse</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent text-white hover:bg-white/20 hover:text-white focus:bg-white/20 focus:text-white",
                  )}
                >
                  <Link href="/create">Create</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <ModeToggle />

          {user ? (
            <>
              <NotificationBell />
              <Link href="/profile">
                <Avatar className="h-10 w-10 border-2 border-white/20 hover:border-white transition-colors">
                  <AvatarImage
                    src={user.photoURL || ""}
                    alt={user.displayName || "User"}
                  />
                  <AvatarFallback className="bg-orange-700 text-white">
                    {user.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <Button
              asChild
              variant="secondary"
              className="bg-white text-[#F76902] hover:bg-gray-100"
            >
              <Link href="/login">Log In</Link>
            </Button>
          )}
        </div>

        <div className="md:hidden flex items-center gap-4">
          <ModeToggle />
          {user && (
            <>
              <NotificationBell />
              <Link href="/profile">
                <Avatar className="h-8 w-8 border-2 border-white/20 hover:border-white transition-colors">
                  <AvatarImage
                    src={user.photoURL || ""}
                    alt={user.displayName || "User"}
                  />
                  <AvatarFallback className="bg-orange-700 text-white">
                    {user.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="px-6 pt-6 text-left">
                <SheetTitle className="text-2xl font-bold text-[#F76902]">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 px-6 mt-6">
                <Link
                  href="#"
                  className="text-lg font-medium hover:text-[#F76902] transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/"
                  className="text-lg font-medium hover:text-[#F76902] transition-colors"
                >
                  Browse
                </Link>
                <Link
                  href="/create"
                  className="text-lg font-medium hover:text-[#F76902] transition-colors"
                >
                  Create
                </Link>
                {!user && (
                  <>
                    <Separator className="my-2" />
                    <Button
                      asChild
                      className="w-full bg-[#F76902] hover:bg-[#d55a02] text-white"
                    >
                      <Link href="/login">Log In</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
