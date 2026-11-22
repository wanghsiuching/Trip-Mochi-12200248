import React, { useState, useEffect } from 'react';
import { Settings, X, Coins, Plus, Save, Copy, Check, Hash, FileText, Eye, Download, Loader2, RefreshCw, Edit3 } from 'lucide-react';
import { 
  Currency, 
  TripDay, 
  ScheduleItem, 
  BookingFlight, 
  BookingAccommodation, 
  BookingCarRental, 
  BookingTicket, 
  Expense, 
  Member,
  PocketItem,
  TodoItem,
  TravelDocument
} from '../../types';
import { ExportPdfModal } from './ExportPdfModal';
import { exportTripToPdfFile, TripExportData } from '../../utils/pdfExport';
import { AutoWrapInput } from '../AutoWrapInput';

export const TripSettingsModal = ({ 
    isOpen, onClose, currencies, onAddCurrency, onRemoveCurrency, onDuplicate,
    tripId, tripName, onRenameTrip,
    tripDays = [],
    scheduleItems = [],
    bookingFlights = [],
    bookingAccommodations = [],
    bookingCarRentals = [],
    bookingTickets = [],
    expenses = [],
    members = [],
    pocketItems = [],
    planningLists,
    onCheckAppUpdate,
    hasAppUpdate = false,
    onApplyAppUpdate
}: { 
    isOpen: boolean;
    onClose: () => void;
    currencies: Currency[];
    onAddCurrency: (c: Currency) => void;
    onRemoveCurrency: (code: string) => void;
    onDuplicate?: () => void;
    tripId?: string;
    tripName?: string;
    onRenameTrip?: (newName: string) => Promise<void> | void;
    tripDays?: TripDay[];
    scheduleItems?: ScheduleItem[];
    bookingFlights?: BookingFlight[];
    bookingAccommodations?: BookingAccommodation[];
    bookingCarRentals?: BookingCarRental[];
    bookingTickets?: BookingTicket[];
    expenses?: Expense[];
    members?: Member[];
    pocketItems?: PocketItem[];
    planningLists?: {
      todo?: TodoItem[];
      packing?: TodoItem[];
      wish?: TodoItem[];
      shopping?: TodoItem[];
      documents?: TravelDocument[];
    };
    onCheckAppUpdate?: () => Promise<'update-available' | 'up-to-date' | 'error'>;
    hasAppUpdate?: boolean;
    onApplyAppUpdate?: () => void;
}) => {
    const [newCurrencyCode, setNewCurrencyCode] = useState('');
    const [newCurrencyRate, setNewCurrencyRate] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);
    const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
    const [isConvertingPdf, setIsConvertingPdf] = useState(false);
    const [pdfSuccess, setPdfSuccess] = useState(false);
    const [updateCheckStatus, setUpdateCheckStatus] = useState<'idle' | 'checking' | 'latest' | 'found' | 'error'>('idle');
    const [editedTripName, setEditedTripName] = useState(tripName || '');
    const [isSavingName, setIsSavingName] = useState(false);
    const [savedNameSuccess, setSavedNameSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEditedTripName(tripName || '');
            setSavedNameSuccess(false);
        }
    }, [isOpen, tripName]);

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
      currencies,
      pocketItems,
      planningLists
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

    const handleSaveTripName = async () => {
        const trimmed = editedTripName.trim();
        if (!trimmed || !onRenameTrip || isSavingName || trimmed === (tripName || '').trim()) return;
        setIsSavingName(true);
        try {
            await onRenameTrip(trimmed);
            setSavedNameSuccess(true);
            setTimeout(() => setSavedNameSuccess(false), 2500);
        } finally {
            setIsSavingName(false);
        }
    };

    const handleDirectExportPdf = async () => {
        if (isConvertingPdf) return;
        setIsConvertingPdf(true);
        const ok = await exportTripToPdfFile(exportData);
        setIsConvertingPdf(false);
        if (ok) {
            setPdfSuccess(true);
            setTimeout(() => setPdfSuccess(false), 3500);
        }
    };

    return (
      <>
        <div 
          className="fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-[70] flex flex-col items-center justify-center p-3 sm:p-4 animate-fade-in" 
          onClick={onClose}
          style={{
            paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
            <div className="bg-[#FAF8F2] w-full max-w-lg max-h-[92vh] max-h-[92dvh] rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 shadow-2xl border-2 sm:border-4 border-beige-dark flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b-2 border-beige-dark flex-shrink-0">
                    <h3 className="text-xl font-black text-cocoa flex items-center gap-2"><Settings size={20} className="text-sage"/> 行程設定</h3>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-400 border border-beige-dark shadow-sm transition-colors"><X size={18}/></button>
                </div>

                <div className="overflow-y-auto custom-scroll flex-1 min-h-0 py-4 pr-1 space-y-6">
                    {/* Trip Title Rename Section */}
                    {onRenameTrip && (
                        <div className="bg-white border-2 border-beige-dark p-4 rounded-2xl shadow-sm">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                                <Edit3 size={12} className="text-sage"/> 更改行程標題名稱
                            </label>
                            <div className="flex gap-2 items-center">
                                <AutoWrapInput
                                    value={editedTripName}
                                    onChange={(e) => {
                                        setEditedTripName(e.target.value);
                                        if (savedNameSuccess) setSavedNameSuccess(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveTripName();
                                        }
                                    }}
                                    placeholder="輸入行程標題名稱..."
                                    className="flex-1 min-w-0 min-h-[44px] py-2.5 bg-[#FAF8F2] px-3.5 rounded-xl text-sm font-black text-cocoa outline-none border-2 border-beige-dark focus:border-sage transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveTripName}
                                    disabled={isSavingName || !editedTripName.trim() || editedTripName.trim() === (tripName || '').trim()}
                                    className="h-11 px-4 flex-shrink-0 bg-sage hover:bg-sage-dark text-white font-black text-xs rounded-xl shadow-hard-sm-sage disabled:opacity-50 disabled:shadow-none flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                >
                                    {isSavingName ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>儲存中</span>
                                        </>
                                    ) : savedNameSuccess ? (
                                        <>
                                            <Check size={14} />
                                            <span>已儲存</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            <span>儲存</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

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
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-sage text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                                <FileText size={22} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-base font-black text-cocoa">匯出行程為 PDF</h4>
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
                                onClick={handleDirectExportPdf}
                                disabled={isConvertingPdf}
                                className="py-3 px-2.5 bg-sage text-white font-black rounded-xl text-xs hover:bg-sage-dark flex items-center justify-center gap-1.5 shadow-hard-sm-sage transition-all active:scale-95 disabled:opacity-60"
                            >
                                {isConvertingPdf ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        <span>轉為 PDF 中...</span>
                                    </>
                                ) : pdfSuccess ? (
                                    <>
                                        <Check size={15} className="text-green-300" />
                                        <span>已下載 PDF！</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={15} />
                                        <span>轉為 PDF 檔案</span>
                                    </>
                                )}
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

                    {/* App Version & Update Check Section */}
                    {onCheckAppUpdate && (
                      <div className="border-t border-dashed border-gray-200 pt-6">
                        <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                          <RefreshCw size={16}/> 版本同步
                        </h4>
                        {hasAppUpdate && onApplyAppUpdate ? (
                          <button
                            type="button"
                            onClick={onApplyAppUpdate}
                            className="w-full py-3.5 bg-sage text-white font-black rounded-2xl border-2 border-sage-dark hover:bg-sage-dark transition-colors flex items-center justify-center gap-2 shadow-hard-sm-sage cursor-pointer"
                          >
                            <RefreshCw size={16} />
                            <span>發現新版本！點擊立即更新</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              setUpdateCheckStatus('checking');
                              const result = await onCheckAppUpdate();
                              if (result === 'update-available') setUpdateCheckStatus('found');
                              else if (result === 'up-to-date') setUpdateCheckStatus('latest');
                              else setUpdateCheckStatus('error');
                            }}
                            disabled={updateCheckStatus === 'checking'}
                            className="w-full py-3 bg-white text-cocoa font-black rounded-2xl border-2 border-beige-dark hover:border-sage transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                          >
                            <RefreshCw size={15} className={updateCheckStatus === 'checking' ? 'animate-spin text-sage' : 'text-sage'} />
                            <span>
                              {updateCheckStatus === 'checking'
                                ? '檢查最新版本中...'
                                : updateCheckStatus === 'latest'
                                ? '目前已是最新版本'
                                : updateCheckStatus === 'error'
                                ? '檢查失敗，請確認網路連線'
                                : '檢查 App 版本更新'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
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

