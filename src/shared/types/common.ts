export type Tab = 'schedule' | 'bookings' | 'expense' | 'journal' | 'planning' | 'members';
export type ViewState = 'landing' | 'app';

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export const THEME = {
  colors: {
    bg: 'bg-beige',
    card: 'bg-white',
    primary: 'bg-sage', 
    text: 'text-cocoa', 
    shadow: 'shadow-hard',
    shadowActive: 'active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
  },
  animation: {
    overshoot: 'transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
  }
};
