import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6" aria-busy="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <Skeleton className="mt-1 h-4 w-24" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 border-b">
        <div className="-mb-px border-b-2 border-[#F76902] px-3 py-2 text-sm font-medium">
          All
        </div>
        <div className="px-3 py-2 text-sm text-muted-foreground">Unread</div>
      </div>

      <ul className="divide-y">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index} className="flex gap-3 px-1 py-4">
            <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className={`h-4 ${index % 2 ? "w-48" : "w-64"}`} />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-3 w-20" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
