"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export default function PondFilesTableSkeleton() {
  const rows = Array.from({ length: 10 })

  return (
    <div className="rounded-2xl border bg-background p-4 animate-pulse">

      {/* SEARCH */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-10 w-64 rounded-md" />        
      </div>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-4 w-32 rounded" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16 rounded" /></TableHead>
            <TableHead className="text-center">
              <Skeleton className="h-4 w-20 rounded mx-auto" />
            </TableHead>
            <TableHead><Skeleton className="h-4 w-28 rounded" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24 rounded" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20 rounded" /></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((_, i) => (
            <TableRow key={i}>
              {/* NAME */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 w-40 rounded" />
                </div>
              </TableCell>

              {/* SIZE */}
              <TableCell>
                <Skeleton className="h-4 w-16 rounded" />
              </TableCell>

              {/* SCAN STATUS */}
              <TableCell>
                <div className="flex justify-center">
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </TableCell>

              {/* UPLOADED AT */}
              <TableCell>
                <Skeleton className="h-4 w-32 rounded" />
              </TableCell>

              {/* UPLOADER */}
              <TableCell>
                <Skeleton className="h-4 w-24 rounded" />
              </TableCell>

              {/* ACTIONS */}
              <TableCell>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* FOOTER */}
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-48 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}
