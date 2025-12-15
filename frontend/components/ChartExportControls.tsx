"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Image as ImageIcon,
  FileImage,
  Loader2,
  Camera,
} from "lucide-react";
import {
  ChartExporter,
  handleExportSuccess,
  handleExportError,
} from "@/utils/exportUtils";
import { toast } from "@/lib/toast";

interface ChartExportControlsProps {
  chartId: string;
  chartTitle: string;
  className?: string;
  variant?: "default" | "compact" | "dropdown";
  showLabels?: boolean;
}

const ChartExportControls: React.FC<ChartExportControlsProps> = ({
  chartId,
  chartTitle,
  className = "",
  variant = "default",
  showLabels = true,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string>("");

  const exportChart = async (format: "png" | "jpg") => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      setExportingFormat(format);

      const filename = `${chartTitle
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")}_chart`;

      await ChartExporter.exportChartAsImage(chartId, {
        filename,
        format,
        quality: format === "jpg" ? 0.9 : 1.0,
        includeTimestamp: true,
      });

      handleExportSuccess(format, `${filename}.${format}`);
      toast.success(`${format.toUpperCase()} grafiği başarıyla indirildi!`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Bilinmeyen hata";
      handleExportError(format, new Error(errorMessage));
      toast.error(`${format.toUpperCase()} export hatası: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      setExportingFormat("");
    }
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={() => exportChart("png")}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="h-8 px-2"
          title="PNG olarak indir"
        >
          {isExporting && exportingFormat === "png" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <FileImage className="h-3 w-3" />
          )}
          {showLabels && <span className="ml-1 text-xs">PNG</span>}
        </Button>
        <Button
          onClick={() => exportChart("jpg")}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="h-8 px-2"
          title="JPG olarak indir"
        >
          {isExporting && exportingFormat === "jpg" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ImageIcon className="h-3 w-3" />
          )}
          {showLabels && <span className="ml-1 text-xs">JPG</span>}
        </Button>
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className={`relative ${className}`}>
        <details className="relative">
          <summary className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Camera className="h-4 w-4" />
            Grafik İndir
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="py-1">
              <button
                onClick={() => exportChart("png")}
                disabled={isExporting}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {isExporting && exportingFormat === "png" ? (
                  <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                ) : (
                  <FileImage className="h-4 w-4 mr-3" />
                )}
                PNG olarak indir
              </button>
              <button
                onClick={() => exportChart("jpg")}
                disabled={isExporting}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {isExporting && exportingFormat === "jpg" ? (
                  <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-3" />
                )}
                JPG olarak indir
              </button>
            </div>
          </div>
        </details>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="text-xs font-medium text-gray-600 mb-1">
        📊 Grafik Export
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => exportChart("png")}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {isExporting && exportingFormat === "png" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileImage className="mr-2 h-4 w-4" />
          )}
          PNG İndir
        </Button>
        <Button
          onClick={() => exportChart("jpg")}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {isExporting && exportingFormat === "jpg" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="mr-2 h-4 w-4" />
          )}
          JPG İndir
        </Button>
      </div>
    </div>
  );
};

export default ChartExportControls;
