
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
} from '@tanstack/react-table';
import * as XLSX from 'xlsx';

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
import { toast } from '@/hooks/use-toast';


interface DataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
}

export function DataTable<TData extends { id: string; status?: 'Active' | 'Inactive' | 'Issued' | 'Draft' }, TValue>({
  data,
  columns: propColumns,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const actionColumn: ColumnDef<TData> = {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
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
            badgeClass = 'bg-green-100 text-green-800';
            break;
        case 'Inactive':
        case 'Draft':
            badgeVariant = 'secondary';
            badgeClass = 'bg-yellow-100 text-yellow-800';
            break;
      }

      return (
          <Badge variant={badgeVariant} className={badgeClass}>
            {status}
          </Badge>
      );
    },
  };
  
  const columns = React.useMemo(() => [...propColumns, statusColumn, actionColumn], [propColumns]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
        pagination: {
            pageSize: 10,
        }
    }
  });

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter records..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls, .csv"
            />
            <Button onClick={handleUploadClick} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
            </Button>
            <Button onClick={handleExport} variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export to Excel
            </Button>
        </div>
      </div>
      <div className="rounded-lg border">
        <ScrollArea className="h-[60vh] w-full">
          <Table className="relative">
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
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} record(s).
        </div>
        <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
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
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                >
                Previous
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                >
                Next
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
