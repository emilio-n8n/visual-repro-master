import { useState } from "react";
import { Download, FileJson, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportData {
  projects?: unknown[];
  renders?: unknown[];
  [key: string]: unknown[] | undefined;
}

interface ExportMenuProps {
  data: ExportData;
  filename?: string;
  disabled?: boolean;
}

export function ExportMenu({ data, filename = "export", disabled }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      // Flatten data to CSV
      const allData = [...(data.projects || []), ...(data.renders || [])];
      if (allData.length === 0) return;

      const headers = Object.keys(allData[0] as object);
      const csvRows = [
        headers.join(","),
        ...allData.map((row) =>
          headers.map((h) => JSON.stringify((row as Record<string, unknown>)[h] ?? "")).join(",")
        ),
      ];

      const csv = csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting} className="gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToJSON}>
          <FileJson className="w-4 h-4 mr-2" />
          JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <FileText className="w-4 h-4 mr-2" />
          PDF (bientôt)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}