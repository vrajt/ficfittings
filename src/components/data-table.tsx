
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import type { DateRange } from "react-day-picker";
import axios from 'axios';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Pencil, Trash2, Search, FileDown, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { DatePickerWithRange } from './ui/date-range-picker';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { generateCertificatePDF } from '@/lib/pdf-generator';
import type { Certificate } from '@/lib/types';
import { Checkbox } from './ui/checkbox';

interface DataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  isLoading?: boolean;
  masterType?: string;
  onRefresh?: () => void;
  onEdit?: (data: TData) => void;
}

export function DataTable<TData extends { id: string; status?: 'Active' | 'Inactive' | 'Issued' | 'Draft', date?: string }, TValue>({
  data,
  columns: propColumns,
  isLoading = false,
  masterType,
  onRefresh,
  onEdit,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const handleDownload = (rowData: TData) => {
    generateCertificatePDF(rowData as Certificate);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/${masterType}/${id}`);
      toast({
        title: "Record Deleted",
        description: `The record with ID ${id} has been deleted.`,
        variant: 'success'
      });
      onRefresh?.();
    } catch (error) {
      console.error(`Failed to delete record ${id}:`, error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete the record. Please try again.",
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSelected = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const idsToDelete = selectedRows.map(r => r.original.id);
    
    try {
      await Promise.all(idsToDelete.map(id => axios.delete(`/api/${masterType}/${id}`)));
      toast({
        title: "Bulk Deletion Successful",
        description: `${selectedRows.length} record(s) have been deleted.`,
        variant: 'success'
      });
      onRefresh?.();
      table.resetRowSelection();
    } catch(error) {
      console.error(`Failed to delete selected records:`, error);
      toast({
        title: "Bulk Deletion Failed",
        description: "Could not delete the selected records. Please try again.",
        variant: 'destructive'
      });
    }
  };

  const selectionColumn: ColumnDef<TData> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const actionColumn: ColumnDef<TData> = {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-2">
         {propColumns.some((c: any) => c.accessorKey === 'certificateNumber') && (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(row.original)}>
                        <FileDown className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download PDF</p>
                </TooltipContent>
            </Tooltip>
        )}
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onEdit?.(row.original)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Edit record</p>
            </TooltipContent>
        </Tooltip>
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
                <p>Delete record</p>
            </TooltipContent>
          </Tooltip>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this record.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(row.original.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
    meta: {
      sticky: true,
    }
  };

  const statusColumn: ColumnDef<TData> = {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      if (!status) return null;
      let badgeVariant: "default" | "secondary" | "destructive" | "outline" | null | undefined = 'secondary';
      let badgeClass = '';

      switch (status) {
        case 'Active':
        case 'Issued':
            badgeVariant = 'default';
            badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            break;
        case 'Inactive':
        case 'Draft':
            badgeVariant = 'secondary';
            badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            break;
      }

      return (
          <Badge variant={badgeVariant} className={cn('whitespace-nowrap', badgeClass)}>
            {status}
          </Badge>
      );
    },
  };
  
  const columns = React.useMemo(() => [selectionColumn, ...propColumns, statusColumn, actionColumn], [propColumns, onEdit, masterType]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    filterFns: {
        dateRange: (row, columnId, value) => {
          const date = new Date(row.getValue(columnId));
          const [start, end] = value as [Date, Date];
          const startDate = new Date(start);
          startDate.setHours(0,0,0,0);
          const endDate = new Date(end);
          endDate.setHours(23,59,59,999);
          return date >= startDate && date <= endDate;
        },
    },
    state: {
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
        pagination: {
            pageSize: 10,
        }
    }
  });

  const hasDateColumn = React.useMemo(
    () => propColumns.some((c: any) => c.accessorKey === 'date'),
    [propColumns]
  );
  
  React.useEffect(() => {
    if (hasDateColumn) {
        const dateColumn = table.getColumn('date');
        if (dateColumn) {
          if (dateRange?.from && dateRange?.to) {
            dateColumn.setFilterValue([dateRange.from, dateRange.to]);
          } else {
            dateColumn.setFilterValue(undefined);
          }
        }
    }
  }, [dateRange, table, hasDateColumn]);


  const handleExport = () => {
    const dataToExport = table.getFilteredRowModel().rows.map(row => {
        const exportedRow: Record<string, any> = {};
        propColumns.forEach(col => {
            const key = (col as any).accessorKey;
            if (key) {
                exportedRow[(col as any).header] = row.original[key as keyof TData];
            }
        });
        if (row.original.status) {
            exportedRow['Status'] = row.original.status;
        }
        return exportedRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, 'data-export.xlsx');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file);
      toast({
        title: "File Selected",
        description: `You have selected ${file.name}. Ready for upload.`,
      });
      event.target.value = '';
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <Skeleton className="h-10 w-full sm:max-w-sm" />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Skeleton className="h-10 w-full sm:w-32" />
                    <Skeleton className="h-10 w-full sm:w-24" />
                </div>
            </div>
            <div className="rounded-lg border">
                <Skeleton className="h-[500px] w-full" />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Skeleton className="h-5 w-24" />
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    <Skeleton className="h-8 w-full sm:w-32" />
                    <Skeleton className="h-8 w-full sm:w-32" />
                    <Skeleton className="h-8 w-full sm:w-32" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter records..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-full sm:max-w-xs pl-9"
                />
            </div>
            {hasDateColumn && (
                <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange}
                />
            )}
             {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({table.getFilteredSelectedRowModel().rows.length})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the selected
                                {table.getFilteredSelectedRowModel().rows.length} record(s).
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls, .csv"
            />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={handleUploadClick} variant="outline" className="w-full sm:w-auto">
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Upload
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Upload data from an Excel or CSV file.</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Export the current view to an Excel file.</p>
                </TooltipContent>
            </Tooltip>
        </div>
      </div>
      <div className="rounded-lg border flex-1">
        <ScrollArea className="h-[500px] w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={header.column.columnDef.meta?.sticky ? 'sticky right-0 bg-card shadow-sm' : ''}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cell.column.columnDef.meta?.sticky ? 'sticky right-0 bg-card' : ''}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                        table.setPageSize(Number(value))
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[10, 25, 50, 100].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex w-full sm:w-auto items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="w-full"
                >
                Previous
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="w-full"
                >
                Next
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
