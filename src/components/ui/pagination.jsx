import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button";

const Pagination = ({
  className,
  ...props
}) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props} />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props} />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(buttonVariants({
      variant: isActive ? "outline" : "ghost",
      size,
    }), className)}
    {...props} />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}>
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}

// ============ Higher-level Pagination Components ============

import { Button } from "./button";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Full-featured pagination with page numbers and item count
 * Designed for use with usePaginatedQuery hooks
 */
export function DataPagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  hasNextPage = false,
  hasPrevPage = false,
  isLoading = false,
  className = "",
}) {
  // Calculate display range
  const startItem = Math.min((page - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(page * pageSize, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 3) end = 4;
      if (page >= totalPages - 2) start = totalPages - 3;

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1 && totalItems === 0) return null;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", className)}>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {totalItems > 0 ? (
          <>
            <span className="font-medium">{startItem}</span>
            {' - '}
            <span className="font-medium">{endItem}</span>
            {' van '}
            <span className="font-medium">{totalItems}</span>
            {' items'}
          </>
        ) : (
          'Geen items'
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!hasPrevPage || isLoading}
            className="h-8 w-8 p-0 hidden sm:flex"
            title="Eerste pagina"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage || isLoading}
            className="h-8 w-8 p-0"
            title="Vorige pagina"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((pageNum, index) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
              ) : (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  disabled={isLoading}
                  className={cn("h-8 w-8 p-0", page === pageNum && 'bg-[#4A9B8C] hover:bg-[#3d8273]')}
                >
                  {pageNum}
                </Button>
              )
            ))}
          </div>

          <span className="sm:hidden px-3 text-sm text-gray-600 dark:text-gray-300">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage || isLoading}
            className="h-8 w-8 p-0"
            title="Volgende pagina"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage || isLoading}
            className="h-8 w-8 p-0 hidden sm:flex"
            title="Laatste pagina"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Simple pagination with just prev/next buttons
 */
export function SimplePagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  hasNextPage = false,
  hasPrevPage = false,
  isLoading = false,
  className = "",
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage || isLoading}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Vorige
      </Button>

      <span className="text-sm text-gray-600 dark:text-gray-300 px-3">
        Pagina {page} van {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage || isLoading}
      >
        Volgende
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
