import React, { useState, useEffect } from 'react';
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
  Loader2,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { 
  TripExportData, 
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

  useEffect(() => {
    if (isOpen) {
      setPdfProgress(null);
      setHasDownloaded(false);
      setHasDownloadedHtml(false);
    }
  }, [isOpen]);

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
        className="bg-[#FAF8F2] w-full max-h-[92vh] sm:max-h-[85vh] sm:max-w-xl sm:rounded-[2.5rem] rounded-t-[2.5rem] p-4 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3.5 border-b-2 border-beige-dark flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sage/20 text-sage flex items-center justify-center font-bold flex-shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-cocoa truncate">
                匯出行程手帳檔案
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 font-bold truncate">
                {data.tripName || '我的旅程手帳'} • {data.tripDays.length} 天行程
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors cursor-pointer flex-shrink-0"
          >
            <X size={18}/>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3.5 space-y-3.5">
          {/* Trip Summary Stat Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-bold text-gray-600">
            <span className="bg-white border border-beige-dark px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs whitespace-nowrap flex-shrink-0">
              <Calendar size={12} className="text-sage" />
              {data.tripDays.length} 天行程
            </span>
            <span className="bg-white border border-beige-dark px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs whitespace-nowrap flex-shrink-0">
              <Sparkles size={12} className="text-amber-500" />
              {data.scheduleItems.length} 個排程點
            </span>
            <span className="bg-white border border-beige-dark px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs whitespace-nowrap flex-shrink-0">
              <Plane size={12} className="text-blue-500" />
              {(data.bookingFlights?.length || 0) + (data.bookingAccommodations?.length || 0)} 筆預訂
            </span>
            <span className="bg-white border border-beige-dark px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs whitespace-nowrap flex-shrink-0">
              <CreditCard size={12} className="text-rose-500" />
              {data.expenses?.length || 0} 筆開銷
            </span>
            <span className="bg-white border border-beige-dark px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs whitespace-nowrap flex-shrink-0">
              <Users size={12} className="text-purple-500" />
              {data.members?.length || 0} 位成員
            </span>
          </div>

          {/* Progress Bar (if converting) */}
          {pdfProgress && (
            <div className="bg-sage/10 border border-sage/30 p-3 rounded-2xl text-xs text-sage-dark font-bold space-y-1.5 animate-fade-in shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  {isConverting && <Loader2 size={13} className="animate-spin text-sage" />}
                  <span>{pdfProgress}</span>
                </span>
              </div>
              {isConverting && (
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sage h-full rounded-full animate-pulse w-3/4 transition-all" />
                </div>
              )}
            </div>
          )}

          {/* Card 1: PDF Export (Primary) */}
          <div className="bg-white rounded-2xl border-2 border-sage/40 hover:border-sage p-4 shadow-xs transition-all space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sage text-white flex items-center justify-center font-black shadow-xs flex-shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-sm sm:text-base text-cocoa">
                      PDF 隨身手帳
                    </h4>
                    <span className="bg-sage/15 text-sage font-black text-[10px] px-2 py-0.5 rounded-md border border-sage/30 whitespace-nowrap flex items-center gap-1">
                      <ShieldCheck size={11} /> 智能防裁切排版
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    格式：.pdf • 包含時間軸、交通憑證、住宿與分帳表
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-cocoa/80 leading-relaxed bg-[#FAF8F2] p-2.5 rounded-xl border border-beige-dark/70">
              已啟用 A4 自動分頁避讓算法，智能偵測景點卡片與表格邊界，自動將跨頁內容安排於下一頁頂部，文字與區塊不再被橫切斷裂。
            </p>

            <button
              type="button"
              onClick={handleConvertToPdf}
              disabled={isConverting}
              className="w-full h-11 bg-sage hover:bg-sage-dark text-white font-black rounded-xl shadow-hard-sm-sage border-2 border-sage-dark transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:translate-y-0.5 active:shadow-none disabled:opacity-60 cursor-pointer"
            >
              {isConverting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>正在轉換 PDF 檔案中...</span>
                </>
              ) : hasDownloaded ? (
                <>
                  <CheckCircle2 size={16} className="text-green-300" />
                  <span>PDF 已成功下載！</span>
                </>
              ) : (
                <>
                  <Download size={16} strokeWidth={2.5} />
                  <span>轉為 PDF 檔案並下載 (.pdf)</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Offline HTML Export (Secondary) */}
          <div className="bg-white rounded-2xl border-2 border-beige-dark hover:border-amber-300 p-4 shadow-xs transition-all space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shadow-xs flex-shrink-0">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-sm sm:text-base text-cocoa">
                      離線 HTML 互動手帳
                    </h4>
                    <span className="bg-amber-50 text-amber-800 font-black text-[10px] px-2 py-0.5 rounded-md border border-amber-200 whitespace-nowrap">
                      秒開輕量
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    格式：.html • 單一檔案，手機或電腦瀏覽器直接開
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-cocoa/80 leading-relaxed bg-[#FAF8F2] p-2.5 rounded-xl border border-beige-dark/70">
              無需安裝任何 PDF 閱讀器，在國外飛航模式或無網路深山中，手機瀏覽器點擊即可離線順暢查看全部行程！
            </p>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="w-full h-11 bg-white hover:bg-amber-50/60 text-cocoa font-black rounded-xl border-2 border-beige-dark hover:border-amber-400 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:translate-y-0.5 shadow-xs cursor-pointer"
            >
              {hasDownloadedHtml ? (
                <>
                  <Check size={16} className="text-green-600" />
                  <span className="text-green-700">已下載離線 HTML 檔案！</span>
                </>
              ) : (
                <>
                  <FileText size={16} className="text-amber-600" />
                  <span>下載離線手帳網頁 (.html)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-beige-dark flex-shrink-0 flex justify-end">
          <button 
            type="button"
            onClick={onClose} 
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm text-cocoa bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors cursor-pointer"
          >
            返回行程設定
          </button>
        </div>
      </div>
    </div>
  );
};
