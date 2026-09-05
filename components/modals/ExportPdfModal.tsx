import React, { useMemo, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  HelpCircle, 
  Check, 
  Sparkles, 
  Calendar, 
  Plane, 
  CreditCard,
  Smartphone,
  Laptop
} from 'lucide-react';
import { 
  TripExportData, 
  generateTripPdfHtml, 
  printTripToPdf, 
  downloadOfflineTripHtml 
} from '../../utils/pdfExport';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TripExportData;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({ isOpen, onClose, data }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // 產生 HTML 預覽字串
  const htmlContent = useMemo(() => {
    if (!isOpen) return '';
    return generateTripPdfHtml(data);
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    await printTripToPdf(data);
    setTimeout(() => setIsPrinting(false), 800);
  };

  const handleDownload = () => {
    downloadOfflineTripHtml(data);
    setHasDownloaded(true);
    setTimeout(() => setHasDownloaded(false), 3000);
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
              <h3 className="text-lg sm:text-xl font-black text-cocoa flex items-center gap-2">
                匯出行程手帳 (PDF)
                <span className="text-[10px] bg-sage text-white px-2 py-0.5 rounded-full font-bold">Aesthetic</span>
              </h3>
              <p className="text-xs text-gray-500 font-medium">排程、機票住宿訂單與開銷概覽，整理為可列印手帳</p>
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
            {/* Action 1: Print / Save as PDF */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="p-3.5 bg-sage text-white font-black rounded-2xl shadow-hard-sm-sage hover:bg-sage-dark transition-all flex items-center justify-center gap-2.5 text-sm active:scale-[0.98]"
            >
              <Printer size={18} />
              <span>{isPrinting ? '正在開啟列印視窗...' : '🖨️ 列印 / 另存為 PDF (推薦)'}</span>
            </button>

            {/* Action 2: Download Offline HTML */}
            <button
              onClick={handleDownload}
              className="p-3.5 bg-white text-cocoa border-2 border-beige-dark font-black rounded-2xl shadow-sm hover:bg-beige/40 transition-all flex items-center justify-center gap-2.5 text-sm active:scale-[0.98]"
            >
              {hasDownloaded ? (
                <>
                  <Check size={18} className="text-green-600" />
                  <span className="text-green-700">已下載離線手帳檔案！</span>
                </>
              ) : (
                <>
                  <Download size={18} className="text-sage" />
                  <span>📥 下載離線手帳檔案 (.html)</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Tips Toggle */}
          <div className="flex-shrink-0">
            <button 
              onClick={() => setShowTips(!showTips)}
              className="text-xs text-gray-500 hover:text-sage font-bold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle size={14} className="text-sage" />
              <span>如何直接儲存為 PDF？(點此查看裝置教學)</span>
            </button>

            {showTips && (
              <div className="mt-2 bg-white border border-beige-dark p-3 rounded-2xl text-xs space-y-2 text-gray-600 animate-fade-in shadow-xs">
                <div className="flex items-start gap-2">
                  <Laptop size={15} className="text-sage flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cocoa">電腦瀏覽器 (Chrome / Safari / Edge)：</strong>
                    <p>點選「列印 / 另存為 PDF」後，在列印彈窗的<strong>「目的地 / 印表機」</strong>下拉選單選擇<strong>「另存為 PDF (Save as PDF)」</strong>即可保存為離線檔案。</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Smartphone size={15} className="text-sage flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cocoa">iPhone / iPad (iOS Safari)：</strong>
                    <p>點擊列印後，在列印預覽頁面上「雙指外推放大預覽」，即可直接轉為標準 PDF，點擊分享圖示即可「儲存到檔案」或分享至 LINE。</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Badges Bar */}
          <div className="flex-shrink-0 flex items-center gap-3 overflow-x-auto py-1 text-xs text-cocoa font-bold">
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
              {data.expenses?.length || 0} 筆記帳
            </span>
          </div>

          {/* Live A4 Aesthetic Preview Box */}
          <div className="flex-1 bg-gray-100 rounded-2xl border-2 border-beige-dark overflow-hidden relative shadow-inner flex flex-col">
            <div className="bg-white/80 border-b border-beige-dark px-3 py-1.5 text-[11px] text-gray-500 font-bold flex justify-between items-center">
              <span>📄 手帳排版即時預覽 (A4 Aesthetic Preview)</span>
              <span className="text-sage font-medium">支援雙面列印與離線閱讀</span>
            </div>
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
