import React, { useState } from 'react';
import { Settings, X, Coins, Plus, Save, Copy, Check, Hash, FileText, Eye, Printer, Download } from 'lucide-react';
import { 
  Currency, 
  TripDay, 
  ScheduleItem, 
  BookingFlight, 
  BookingAccommodation, 
  BookingCarRental, 
  BookingTicket, 
  Expense, 
  Member 
} from '../../types';
import { ExportPdfModal } from './ExportPdfModal';
import { printTripToPdf, downloadOfflineTripHtml, TripExportData } from '../../utils/pdfExport';

export const TripSettingsModal = ({ 
    isOpen, onClose, currencies, onAddCurrency, onRemoveCurrency, onDuplicate,
    tripId, tripName,
    tripDays = [],
    scheduleItems = [],
    bookingFlights = [],
    bookingAccommodations = [],
    bookingCarRentals = [],
    bookingTickets = [],
    expenses = [],
    members = []
}: { 
    isOpen: boolean;
    onClose: () => void;
    currencies: Currency[];
    onAddCurrency: (c: Currency) => void;
    onRemoveCurrency: (code: string) => void;
    onDuplicate?: () => void;
    tripId?: string;
    tripName?: string;
    tripDays?: TripDay[];
    scheduleItems?: ScheduleItem[];
    bookingFlights?: BookingFlight[];
    bookingAccommodations?: BookingAccommodation[];
    bookingCarRentals?: BookingCarRental[];
    bookingTickets?: BookingTicket[];
    expenses?: Expense[];
    members?: Member[];
}) => {
    const [newCurrencyCode, setNewCurrencyCode] = useState('');
    const [newCurrencyRate, setNewCurrencyRate] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);
    const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
    const [isDirectPrinting, setIsDirectPrinting] = useState(false);

    if (!isOpen) return null;

    const exportData: TripExportData = {
      tripId: tripId || '',
      tripName: tripName || '旅行行程手帳',
      tripDays,
      scheduleItems,
      bookingFlights,
      bookingAccommodations,
      bookingCarRentals,
      bookingTickets,
      expenses,
      members,
      currencies
    };

    const handleCopyCode = () => {
        if (!tripId) return;
        navigator.clipboard.writeText(tripId).then(() => {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        });
    };

    const handleAddCurrency = () => {
        if (newCurrencyCode && newCurrencyRate) {
            onAddCurrency({ code: newCurrencyCode.toUpperCase(), rate: Number(newCurrencyRate) });
            setNewCurrencyCode('');
            setNewCurrencyRate('');
        }
    };

    const handleDirectPrint = async () => {
        setIsDirectPrinting(true);
        await printTripToPdf(exportData);
        setTimeout(() => setIsDirectPrinting(false), 1000);
    };

    return (
      <>
        <div className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-end sm:justify-center sm:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#FAF8F2] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-[2.5rem] rounded-none p-5 sm:p-6 shadow-2xl border-0 sm:border-4 sm:border-beige-dark flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                    <h3 className="text-xl font-black text-cocoa flex items-center gap-2"><Settings size={20} className="text-sage"/> 行程設定</h3>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"><X size={18}/></button>
                </div>

                <div className="overflow-y-auto custom-scroll flex-1 py-4 pr-1 space-y-6">
                    {/* Trip Code Section */}
                    {tripId && (
                        <div className="bg-white border-2 border-beige-dark p-4 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <Hash size={12} className="text-sage"/> 行程專屬代碼 (Trip Code)
                                    </span>
                                    <p className="text-lg font-black text-cocoa font-mono tracking-wide mt-0.5">{tripId}</p>
                                </div>
                                <button
                                    onClick={handleCopyCode}
                                    className="px-3.5 py-2 bg-sage/10 hover:bg-sage/20 text-sage font-black text-xs rounded-xl border border-sage/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                                >
                                    {copiedCode ? <><Check size={14} className="text-sage"/> 已複製</> : <><Copy size={14}/> 複製代碼</>}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">好友可在首頁輸入此代碼加入或查看此行程。</p>
                        </div>
                    )}

                    {/* PDF Export Section */}
                    <div className="bg-gradient-to-br from-white to-[#F6F4ED] border-2 border-sage/40 p-4 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-sage text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0 mt-0.5">
                                <FileText size={22} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-base font-black text-cocoa">匯出行程手帳 (PDF)</h4>
                                    <span className="text-[10px] bg-sage text-white font-black px-2 py-0.5 rounded-full">離線列印</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    自動彙整<strong>每日排程、機票住宿訂單、花費概覽</strong>，轉化為日系手帳風格 A4 離線檔案。
                                </p>
                            </div>
                        </div>

                        <div className="mt-3.5 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setIsExportPdfOpen(true)}
                                className="py-3 px-2.5 bg-white text-cocoa border-2 border-beige-dark hover:border-sage font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                            >
                                <Eye size={15} className="text-sage" />
                                <span>預覽手帳版型</span>
                            </button>
                            <button
                                onClick={handleDirectPrint}
                                disabled={isDirectPrinting}
                                className="py-3 px-2.5 bg-sage text-white font-black rounded-xl text-xs hover:bg-sage-dark flex items-center justify-center gap-1.5 shadow-hard-sm-sage transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Printer size={15} />
                                <span>{isDirectPrinting ? '開啟列印中...' : '列印 / 存為 PDF'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Currency Section */}
                    <div>
                         <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Coins size={16}/> 匯率設定 (相對於 TWD)</h4>
                         <div className="space-y-2 mb-3">
                             {currencies.map(c => (
                                 <div key={c.code} className="flex justify-between items-center bg-white border border-beige-dark p-3 rounded-xl shadow-sm">
                                     <span className="font-bold text-cocoa">{c.code}</span>
                                     <div className="flex items-center gap-3">
                                         <span className="font-mono text-gray-500 font-bold">{c.rate}</span>
                                         <button onClick={() => onRemoveCurrency(c.code)} className="text-red-300 hover:text-red-500"><X size={14}/></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                         <div className="flex gap-2 items-center">
                             <input value={newCurrencyCode} onChange={e => setNewCurrencyCode(e.target.value)} placeholder="幣別 (如 CHF)" className="w-24 h-11 bg-white px-3 rounded-xl text-sm font-bold outline-none border border-beige-dark focus:border-sage text-cocoa text-center uppercase"/>
                             <input type="number" value={newCurrencyRate} onChange={e => setNewCurrencyRate(e.target.value)} placeholder="匯率 (如 37.5)" className="w-32 h-11 bg-white px-3 rounded-xl text-sm font-bold outline-none border border-beige-dark focus:border-sage text-cocoa text-center"/>
                             <button onClick={handleAddCurrency} disabled={!newCurrencyCode || !newCurrencyRate} className="h-11 w-11 flex-shrink-0 flex items-center justify-center bg-sage text-white rounded-xl shadow-hard-sm-sage disabled:opacity-50 hover:bg-sage-dark transition-colors"><Plus size={20}/></button>
                         </div>
                    </div>

                    {/* Backup Section */}
                    <div className="border-t border-dashed border-gray-200 pt-6">
                        <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Save size={16}/> 備份</h4>
                        {onDuplicate && (
                            <>
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(); }} 
                                className="w-full py-3.5 bg-blue-50 text-blue-500 font-black rounded-2xl border-2 border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                type="button"
                            >
                                <Copy size={16}/> 建立行程副本
                            </button>
                            <p className="text-[10px] text-gray-400 mt-2 text-center">這將會建立一個內容完全相同但代碼不同的新行程 (副本)，不會影響目前裝置上的資料。</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="pt-3 border-t-2 border-beige-dark mt-auto flex-shrink-0">
                    <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-bold text-cocoa bg-white border-2 border-beige-dark hover:bg-gray-50 transition-colors">關閉</button>
                </div>
            </div>
        </div>

        {/* 匯出 PDF 預覽彈窗 */}
        <ExportPdfModal 
          isOpen={isExportPdfOpen}
          onClose={() => setIsExportPdfOpen(false)}
          data={exportData}
        />
      </>
    );
};

