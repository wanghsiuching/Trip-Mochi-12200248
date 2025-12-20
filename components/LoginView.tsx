
import React, { useState, useEffect } from 'react';

interface LoginViewProps {
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Auto-focus logic or animation effects could go here
  useEffect(() => {
    if (error) {
      setShaking(true);
      const timer = setTimeout(() => {
        setShaking(false);
        setError(false);
        setPin('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    // Default PIN for public template
    if (pin === '0000') {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F7F4EB] flex flex-col items-center justify-center p-4">
      <div className={`w-full max-w-xs bg-white rounded-[2.5rem] p-8 soft-shadow border-4 border-[#E0E5D5] text-center transition-transform ${shaking ? 'animate-shake' : ''}`}>
        
        <div className="w-20 h-20 bg-[#E0F2F1] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-[#B2DFDB] shadow-sm">
          <i className="fa-solid fa-lock text-3xl text-ac-teal"></i>
        </div>

        <h1 className="text-2xl font-black text-ac-brown mb-2 tracking-wide">Travel Planner</h1>
        <p className="text-xs text-ac-subtext font-bold mb-8">請輸入通行密碼以繼續</p>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > i 
                  ? 'bg-ac-brown border-ac-brown scale-110' 
                  : 'bg-transparent border-[#D6CDB6]'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="w-16 h-16 rounded-2xl bg-[#F9FAFB] text-ac-brown text-xl font-black border-2 border-[#E0E5D5] active:scale-95 active:bg-[#F0F8F0] active:border-ac-green transition-all shadow-[0_2px_0_#E0E5D5] active:shadow-none active:translate-y-[2px] mx-auto"
            >
              {num}
            </button>
          ))}
          <div className="flex items-center justify-center">
             {/* Empty spacer */}
          </div>
          <button
            onClick={() => handleNumberClick('0')}
            className="w-16 h-16 rounded-2xl bg-[#F9FAFB] text-ac-brown text-xl font-black border-2 border-[#E0E5D5] active:scale-95 active:bg-[#F0F8F0] active:border-ac-green transition-all shadow-[0_2px_0_#E0E5D5] active:shadow-none active:translate-y-[2px] mx-auto"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-[#FFF5F5] text-red-400 text-xl border-2 border-red-100 active:scale-95 active:bg-red-50 transition-all shadow-[0_2px_0_#FFE3E3] active:shadow-none active:translate-y-[2px] mx-auto flex items-center justify-center"
          >
            <i className="fa-solid fa-delete-left"></i>
          </button>
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-ac-green text-white font-black text-lg shadow-[0_4px_0_rgb(89,136,64)] active:shadow-none active:translate-y-[4px] transition-all border-2 border-[#68A04B]"
        >
          進入旅程
        </button>
        
        <p className="mt-4 text-[10px] text-[#D6CDB6] font-mono">Default PIN: 0000</p>
      </div>
    </div>
  );
};
