import React, { useMemo, useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Check, 
  Sparkles, 
  Calendar, 
  Plane, 
  CreditCard,
  Users,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { 
  TripExportData, 
  generateTripPdfHtml, 
  exportTripToPdfFile, 
  downloadOfflineTripHtml 
} from '../../utils/pdfExport';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TripExportData;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({ isOpen, onClose, data }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [hasDownloadedHtml, setHasDownloadedHtml] = useState(false);

  // 產生 HTML 預覽字串
  const htmlContent = useMemo(() => {
    if (!isOpen) return '';
    return generateTripPdfHtml(data);
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleConvertToPdf = async () => {
    if (isConverting) return;
    setIsConverting(true);
    setPdfProgress('正在準備手帳與分攤明細 (15%)...');

    const ok = await exportTripToPdfFile(data, (msg, pct) => {
      setPdfProgress(`${msg} (${pct}%)`);
    });

    setIsConverting(false);
    if (ok) {
      setHasDownloaded(true);
      setPdfProgress('✨ PDF 檔案已成功下載！');
      setTimeout(() => {
        setHasDownloaded(false);
        setPdfProgress(null);
      }, 4000);
    } else {
      setPdfProgress('轉為 PDF 時發生錯誤，建議使用離線 HTML');
      setTimeout(() => setPdfProgress(null), 3500);
    }
  };

  const handleDownloadHtml = () => {
    downloadOfflineTripHtml(data);
    setHasDownloadedHtml(true);
    setTimeout(() => setHasDownloadedHtml(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[80] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F2] w-full h-[94vh] sm:h-[90vh] sm:max-w-3xl sm:rounded-[2.5rem] rounded-t-[2rem] p-4 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sage/15 text-sage flex items-center justify-center font-bold">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-cocoa">
                匯出行程為 PDF
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"
          >
            <X size={18}/>
          </button>
        </div>

        {/* Content & Options */}
        <div className="flex-1 overflow-hidden flex flex-col py-3 space-y-3">
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-shrink-0">
            {/* Primary Action: Direct Convert to PDF */}
            <button
              onClick={handleConvertToPdf}
              disabled={isConverting}
              className="p-3.5 bg-sage text-white font-black rounded-2xl shadow-hard-sm-sage hover:bg-sage-dark transition-all flex items-center justify-center gap-2.5 text-sm active:scale-[0.98] disabled:opacity-75"
            >
              {isConverting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{pdfProgress || '正在轉換為 PDF...'}</span>
                </>
              ) : hasDownloaded ? (
                <>
                  <CheckCircle2 size={18} className="text-green-300" />
                  <span>PDF 下載完成！</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>📥 轉為 PDF 檔案並下載 (.pdf)</span>
                </>
              )}
            </button>

            {/* Secondary Action: Download Offline HTML */}
            <button
              onClick={handleDownloadHtml}
              className="p-3.5 bg-white text-cocoa border-2 border-beige-dark font-black rounded-2xl shadow-sm hover:bg-beige/40 transition-all flex items-center justify-center gap-2.5 text-sm active:scale-[0.98]"
            >
              {hasDownloadedHtml ? (
                <>
                  <Check size={18} className="text-green-600" />
                  <span className="text-green-700">已下載離線手帳檔案！</span>
                </>
              ) : (
                <>
                  <FileText size={18} className="text-sage" />
                  <span>📄 下載離線手帳網頁 (.html)</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Status Bar (if any) */}
          {pdfProgress && (
            <div className="flex-shrink-0 bg-sage/10 border border-sage/30 px-3.5 py-2 rounded-xl text-xs text-sage-dark font-bold flex items-center justify-between animate-fade-in">
              <span>{pdfProgress}</span>
              {isConverting && <Loader2 size={14} className="animate-spin text-sage" />}
            </div>
          )}

          {/* Summary Badges Bar */}
          <div className="flex-shrink-0 flex items-center gap-2.5 overflow-x-auto py-1 text-xs text-cocoa font-bold">
            <span className="bg-white border border-beige-dark px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap">
              <Calendar size={13} className="text-sage" />
              {data.tripDays.length} 天行程
            </span>
            <span className="bg-white border border-beige-dark px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap">
              <Sparkles size={13} className="text-amber-500" />
              {data.scheduleItems.length} 個排程點
            </span>
            <span className="bg-white border border-beige-dark px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap">
              <Plane size={13} className="text-blue-500" />
              {(data.bookingFlights?.length || 0) + (data.bookingAccommodations?.length || 0)} 筆預訂
            </span>
            <span className="bg-white border border-beige-dark px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap">
              <CreditCard size={13} className="text-pink-500" />
              {data.expenses?.length || 0} 筆開銷
            </span>
            <span className="bg-white border border-sage/50 text-sage px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs whitespace-nowrap">
              <Users size={13} className="text-sage" />
              {data.members?.length || 0} 位成員分攤
            </span>
          </div>

          {/* Live A4 Aesthetic Preview Box */}
          <div className="flex-1 bg-gray-100 rounded-2xl border-2 border-beige-dark overflow-hidden relative shadow-inner flex flex-col">
            <div className="flex-1 overflow-auto p-2 sm:p-4 flex justify-center bg-[#EBE7DF]">
              <div className="w-full max-w-[760px] bg-white shadow-lg rounded-xl overflow-hidden min-h-full border border-black/5">
                <iframe
                  title="PDF Preview"
                  srcDoc={htmlContent}
                  className="w-full h-full min-h-[600px] border-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0 flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-cocoa bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors"
          >
            返回行程設定
          </button>
        </div>
      </div>
    </div>
  );
};

