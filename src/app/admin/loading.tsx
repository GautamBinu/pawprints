import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The admin dashboard's loading state. It fetches the audit log, every user
 * with petition counts, and both reviewer lists before it can render — a
 * few round trips that add up. This mirrors the spreadsheet shell so the
 * real table drops into place rather than pushing things around.
 */
export default function AdminLoading() {
  return (
    <div
      className="flex h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden"
      aria-busy="true"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-3 py-3 sm:px-4 lg:px-8">
        <h1 className="text-xl font-bold sm:text-2xl">Admin</h1>
        <div className="flex h-9 items-center gap-1 rounded-lg bg-muted p-[3px]">
          {["w-24", "w-20", "w-24", "w-24"].map((width, index) => (
            <Skeleton
              key={index}
              className={`h-7 ${width} rounded-md ${index === 0 ? "bg-background" : "bg-transparent"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-b px-3 py-2 sm:flex-row sm:items-center sm:px-4 lg:px-8">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-full rounded-md sm:w-[220px]" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background">
            <tr className="[&_th]:shadow-[inset_0_-1px_0_var(--border)]">
              {["w-20", "w-32", "w-48", "w-28"].map((width, index) => (
                <th
                  key={index}
                  className={`h-10 px-2 text-left ${index === 0 ? "lg:pl-8" : ""} ${index === 3 ? "lg:pr-8" : ""}`}
                >
                  <Skeleton className={`h-4 ${width}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 14 }).map((_, row) => (
              <tr key={row} className="border-b">
                <td className="p-2 py-3 lg:pl-8">
                  <Skeleton className="h-5 w-28 rounded-full" />
                </td>
                <td className="p-2 py-3">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </td>
                <td className="p-2 py-3">
                  <Skeleton className={`h-3 ${row % 2 ? "w-64" : "w-52"}`} />
                </td>
                <td className="p-2 py-3 lg:pr-8">
                  <Skeleton className="h-3 w-36" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex shrink-0 justify-end border-t bg-muted/30 px-3 py-1.5 sm:px-4 lg:px-8">
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
