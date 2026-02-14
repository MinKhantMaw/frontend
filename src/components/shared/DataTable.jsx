import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function DataTable({
  columns,
  rows,
  loading,
  pagination,
  onPageChange,
  search,
  onSearchChange,
  sort,
  onSort,
}) {
  const renderSortIcon = (columnKey) => {
    if (!sort || sort.column !== columnKey) return <ArrowUpDown className="h-3.5 w-3.5" />
    return sort.direction === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>
                {column.sortable ? (
                  <button className="inline-flex items-center gap-2" onClick={() => onSort(column.key)}>
                    {column.label}
                    {renderSortIcon(column.key)}
                  </button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? [...Array(5)].map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.length > 0
              ? rows.map((row, rowIndex) => (
                  <TableRow key={row.id || rowIndex}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render ? column.render(row) : row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} total)
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.currentPage <= 1 || loading}
            onClick={() => onPageChange(pagination.currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.currentPage >= pagination.lastPage || loading}
            onClick={() => onPageChange(pagination.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
