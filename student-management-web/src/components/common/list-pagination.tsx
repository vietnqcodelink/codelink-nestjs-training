"use client"

import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import type { PaginationMeta } from "@/lib/types"

type PageItem = number | "start-ellipsis" | "end-ellipsis"

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ]
}

export function ListPagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(meta.totalPages, 1)
  const firstItem = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1
  const lastItem = Math.min(meta.page * meta.limit, meta.total)
  const pageItems = getPageItems(meta.page, totalPages)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing {firstItem}–{lastItem} of {meta.total}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
          </PaginationItem>
          {pageItems.map((item) =>
            typeof item === "number" ? (
              <PaginationItem key={item}>
                <Button
                  variant={item === meta.page ? "outline" : "ghost"}
                  size="icon-sm"
                  aria-current={item === meta.page ? "page" : undefined}
                  aria-label={`Go to page ${item}`}
                  disabled={item === meta.page}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
