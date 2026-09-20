import React from "react";
import { Clock, Inbox, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The review list's loading state. `/review` fetches every petition and then
 * evaluates the whole pending pipeline to build the caller's queue, which is
 * the right work to do and too much to block navigation on.
 *
 * The nav on the left is real — its labels never change — so only the parts
 * that depend on data are placeholders.
 */
export default function ReviewLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      aria-busy="true"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:w-56 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {[
            { label: "Petitions", icon: Inbox, active: true },
            { label: "Assigned to me", icon: UserCheck, active: false },
            { label: "Recent activity", icon: Clock, active: false },
          ].map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`relative flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap lg:w-full ${
                active
                  ? "bg-muted font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 hidden h-4 w-1 -translate-y-1/2 rounded-full bg-[#F76902] lg:block" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold sm:text-2xl">All petitions</h1>
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>

          <Skeleton className="h-11 w-full rounded-md" />

          <div className="overflow-hidden rounded-lg border">
            <div className="flex flex-col gap-2 border-b bg-muted/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-24" />
                ))}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
            <ul className="divide-y">
              {Array.from({ length: 8 }).map((_, index) => (
                <li key={index} className="flex items-start gap-3 px-3 py-3 sm:px-4">
                  <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className={`h-5 ${index % 3 === 0 ? "w-2/3" : index % 3 === 1 ? "w-1/2" : "w-3/4"}`} />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-1.5 w-16 rounded-full" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
