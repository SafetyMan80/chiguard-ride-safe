import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const PaginationControls = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  isLoading = false
}: PaginationControlsProps) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPreviousPage = currentPage > 0;

  if (totalPages <= 1) return null;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalCount} results
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage || isLoading}
          className="touch-target"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {/* Show first page */}
          {currentPage > 2 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(0)}
                disabled={isLoading}
                className="touch-target"
              >
                1
              </Button>
              {currentPage > 3 && <span className="text-muted-foreground">...</span>}
            </>
          )}
          
          {/* Show current page and adjacent pages */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageIndex = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
            if (pageIndex >= totalPages) return null;
            
            return (
              <Button
                key={pageIndex}
                variant={pageIndex === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageIndex)}
                disabled={isLoading}
                className="touch-target"
              >
                {pageIndex + 1}
              </Button>
            );
          })}
          
          {/* Show last page */}
          {currentPage < totalPages - 3 && (
            <>
              {currentPage < totalPages - 4 && <span className="text-muted-foreground">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages - 1)}
                disabled={isLoading}
                className="touch-target"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || isLoading}
          className="touch-target"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};