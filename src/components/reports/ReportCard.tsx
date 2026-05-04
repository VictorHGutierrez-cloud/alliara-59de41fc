import { forwardRef, useRef, useImperativeHandle, type ReactNode } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { downloadCsv, downloadPng, slugifyForFile } from "@/lib/report-export";
import { toast } from "sonner";

export interface ReportCardHandle {
  exportPng: () => Promise<void>;
  exportCsv: () => void;
}

export interface ReportCardProps {
  title: string;
  description?: string;
  /** Returns the rows that will be exported as CSV. Called only on demand. */
  csvRows?: () => Record<string, unknown>[];
  /** Optional extra controls rendered top-right (e.g. a metric switcher). */
  controls?: ReactNode;
  children: ReactNode;
  /** When false the export buttons are hidden (e.g. nothing to export). */
  exportable?: boolean;
}

export const ReportCard = forwardRef<ReportCardHandle, ReportCardProps>(
  ({ title, description, csvRows, controls, children, exportable = true }, ref) => {
    const captureRef = useRef<HTMLDivElement>(null);

    const handleCsv = () => {
      if (!csvRows) return;
      const rows = csvRows();
      if (rows.length === 0) {
        toast.message("Nothing to export", { description: "No rows match the current filters." });
        return;
      }
      downloadCsv(`${slugifyForFile(title)}.csv`, rows);
    };

    const handlePng = async () => {
      if (!captureRef.current) return;
      try {
        await downloadPng(captureRef.current, `${slugifyForFile(title)}.png`);
      } catch (e) {
        toast.error("Couldn't export PNG", { description: (e as Error).message });
      }
    };

    useImperativeHandle(ref, () => ({ exportPng: handlePng, exportCsv: handleCsv }));

    return (
      <section
        ref={captureRef}
        className="rounded-2xl border border-border/60 bg-card p-6 card-elev"
      >
        <header className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {controls}
            {exportable && csvRows && (
              <button
                onClick={handleCsv}
                className="btn-candy-ghost"
                title="Export CSV (filtered data)"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            )}
            {exportable && (
              <button
                onClick={handlePng}
                className="btn-candy-ghost"
                title="Export PNG (snapshot)"
              >
                <ImageIcon className="h-3.5 w-3.5" /> PNG
              </button>
            )}
          </div>
        </header>
        <div>{children}</div>
      </section>
    );
  },
);
ReportCard.displayName = "ReportCard";