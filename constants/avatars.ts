// Minimalist, Clean & Cute Vector Human Face Avatars (純向量簡約可愛人像，100% 不破圖、無外部 API 依賴)

export interface AvatarOption {
  id: string;
  name: string;
  category: 'girls' | 'boys';
  url: string;
  bg: string;
}

export interface AvatarCategory {
  id: 'all' | 'girls' | 'boys';
  label: string;
  icon: string;
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  { id: 'all', label: '全部人像', icon: '✨' },
  { id: 'girls', label: '可愛女孩', icon: '👧' },
  { id: 'boys', label: '陽光男孩', icon: '👦' },
];

const svgToUri = (svgStr: string) => 
  `data:image/svg+xml;utf8,${encodeURIComponent(svgStr.replace(/\s+/g, ' ').trim())}`;

// Base components for consistent kawaii style
const faceBase = `
  <!-- Neck & Clothes -->
  <path d="M42 72 L42 84 L58 84 L58 72 Z" fill="#FFEAD5"/>
  <path d="M30 84 C30 76 70 76 70 84 L78 100 L22 100 Z" fill="#VAR_CLOTHES#"/>
  <path d="M42 84 C42 88 58 88 58 84 Z" fill="#FFEAD5"/>
  
  <!-- Ears -->
  <circle cx="25" cy="52" r="5.5" fill="#FFEAD5"/>
  <circle cx="75" cy="52" r="5.5" fill="#FFEAD5"/>
  <circle cx="25" cy="52" r="3" fill="#FFD7BD"/>
  <circle cx="75" cy="52" r="3" fill="#FFD7BD"/>

  <!-- Face Head -->
  <circle cx="50" cy="50" r="26" fill="#FFF4E6"/>

  <!-- Blushing Cheeks -->
  <circle cx="35" cy="57" r="4.5" fill="#FFB0B0" opacity="0.6"/>
  <circle cx="65" cy="57" r="4.5" fill="#FFB0B0" opacity="0.6"/>
`;

// Helper generator for pure SVG avatars
const makeAvatar = (
  bgColor: string,
  clothesColor: string,
  hairSvg: string,
  eyesSvg: string,
  mouthSvg: string,
  extrasSvg: string = ''
) => {
  const body = faceBase.replace('#VAR_CLOTHES#', clothesColor);
  const fullSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="50" fill="${bgColor}"/>
  ${body}
  ${hairSvg}
  ${eyesSvg}
  ${mouthSvg}
  ${extrasSvg}
</svg>`;
  return svgToUri(fullSvg);
};

// --- Reusable Eyes & Mouths ---
const dotEyes = `
  <circle cx="40" cy="50" r="2.8" fill="#382E2B"/>
  <circle cx="60" cy="50" r="2.8" fill="#382E2B"/>
  <circle cx="41" cy="49" r="0.9" fill="#FFFFFF"/>
  <circle cx="61" cy="49" r="0.9" fill="#FFFFFF"/>
`;

const smileEyes = `
  <path d="M37 51 Q40 46 43 51" stroke="#382E2B" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <path d="M57 51 Q60 46 63 51" stroke="#382E2B" stroke-width="2.4" stroke-linecap="round" fill="none"/>
`;

const winkEyes = `
  <path d="M37 51 Q40 46 43 51" stroke="#382E2B" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <circle cx="60" cy="50" r="2.8" fill="#382E2B"/>
  <circle cx="61" cy="49" r="0.9" fill="#FFFFFF"/>
`;

const happyMouth = `
  <path d="M47 59 Q50 63 53 59" stroke="#382E2B" stroke-width="2" stroke-linecap="round" fill="none"/>
`;

const openSmileMouth = `
  <path d="M46 58 Q50 65 54 58 Z" fill="#E86A6A"/>
  <path d="M46 58 Q50 61 54 58" stroke="#382E2B" stroke-width="1.6" fill="none"/>
`;

const tinyDotMouth = `
  <circle cx="50" cy="60" r="1.5" fill="#E86A6A"/>
`;

// --- DEFINED CUTE AVATARS ---
export const CUTE_AVATARS: AvatarOption[] = [
  // ==================== 可愛女孩 (GIRLS) ====================
  {
    id: 'girl-1',
    name: '齊瀏海短髮',
    category: 'girls',
    bg: '#FFE8EC',
    url: makeAvatar(
      '#FFE8EC',
      '#FF8E9E',
      `<!-- Bob Hair -->
       <path d="M24 50 C24 30 76 30 76 50 C76 66 73 70 70 70 C68 56 68 50 68 50 C68 36 32 36 32 50 C32 50 32 56 30 70 C27 70 24 66 24 50 Z" fill="#4E342E"/>
       <path d="M26 44 C34 42 42 44 50 42 C58 44 66 42 74 44 C72 32 62 25 50 25 C38 25 28 32 26 44 Z" fill="#4E342E"/>
       <path d="M33 43 Q41 47 50 44 Q59 47 67 43" stroke="#4E342E" stroke-width="3" stroke-linecap="round" fill="none"/>`,
      dotEyes,
      happyMouth
    ),
  },
  {
    id: 'girl-2',
    name: '雙丸子頭',
    category: 'girls',
    bg: '#EAF4FF',
    url: makeAvatar(
      '#EAF4FF',
      '#6EA8FE',
      `<!-- Space Buns -->
       <circle cx="24" cy="28" r="10" fill="#3E2723"/>
       <circle cx="76" cy="28" r="10" fill="#3E2723"/>
       <circle cx="24" cy="28" r="4" fill="#FF8E9E"/>
       <circle cx="76" cy="28" r="4" fill="#FF8E9E"/>
       <!-- Hair base -->
       <path d="M25 48 C25 28 75 28 75 48 C75 58 71 65 68 62 C68 40 32 40 32 62 C29 65 25 58 25 48 Z" fill="#3E2723"/>
       <path d="M30 42 Q50 48 70 42 C68 30 58 25 50 25 C42 25 32 30 30 42 Z" fill="#3E2723"/>`,
      smileEyes,
      openSmileMouth
    ),
  },
  {
    id: 'girl-3',
    name: '粉紅貝雷帽',
    category: 'girls',
    bg: '#FFF0F5',
    url: makeAvatar(
      '#FFF0F5',
      '#F472B6',
      `<!-- Hair under hat -->
       <path d="M24 50 C24 32 76 32 76 50 C76 68 70 74 68 70 C68 55 68 48 68 48 C68 38 32 38 32 48 C32 48 32 55 32 70 C30 74 24 68 24 50 Z" fill="#5D4037"/>
       <path d="M33 46 Q50 50 67 46" stroke="#5D4037" stroke-width="4" stroke-linecap="round" fill="none"/>
       <!-- Beret Hat -->
       <ellipse cx="50" cy="28" rx="27" ry="12" fill="#FB7185" transform="rotate(-6 50 28)"/>
       <circle cx="47" cy="16" r="2.5" fill="#E11D48"/>`,
      winkEyes,
      happyMouth
    ),
  },
  {
    id: 'girl-4',
    name: '文青圓眼鏡',
    category: 'girls',
    bg: '#F3E8FF',
    url: makeAvatar(
      '#F3E8FF',
      '#A855F7',
      `<!-- Wavy Hair -->
       <path d="M23 48 C23 30 77 30 77 48 C77 65 72 75 66 75 C66 52 34 52 34 75 C28 75 23 65 23 48 Z" fill="#4A3728"/>
       <path d="M27 42 Q50 46 73 42 C70 30 60 25 50 25 C40 25 30 30 27 42 Z" fill="#4A3728"/>`,
      dotEyes,
      happyMouth,
      `<!-- Cute Round Glasses -->
       <circle cx="40" cy="50" r="7" stroke="#78350F" stroke-width="2" fill="none"/>
       <circle cx="60" cy="50" r="7" stroke="#78350F" stroke-width="2" fill="none"/>
       <line x1="47" y1="50" x2="53" y2="50" stroke="#78350F" stroke-width="2"/>`
    ),
  },
  {
    id: 'girl-5',
    name: '俏皮雙馬尾',
    category: 'girls',
    bg: '#FEF3C7',
    url: makeAvatar(
      '#FEF3C7',
      '#F59E0B',
      `<!-- Twin Tails Base -->
       <path d="M20 50 Q12 65 18 78 Q22 68 25 55 Z" fill="#3E2723"/>
       <path d="M80 50 Q88 65 82 78 Q78 68 75 55 Z" fill="#3E2723"/>
       <circle cx="23" cy="53" r="3" fill="#EF4444"/>
       <circle cx="77" cy="53" r="3" fill="#EF4444"/>
       <!-- Top hair -->
       <path d="M26 44 C34 42 42 44 50 42 C58 44 66 42 74 44 C72 30 62 25 50 25 C38 25 28 30 26 44 Z" fill="#3E2723"/>
       <path d="M34 44 Q50 49 66 44" stroke="#3E2723" stroke-width="3" stroke-linecap="round" fill="none"/>`,
      dotEyes,
      openSmileMouth
    ),
  },
  {
    id: 'girl-6',
    name: '小花髮夾',
    category: 'girls',
    bg: '#ECFDF5',
    url: makeAvatar(
      '#ECFDF5',
      '#10B981',
      `<!-- Gentle Bob -->
       <path d="M24 50 C24 30 76 30 76 50 C76 65 72 70 68 68 C68 50 32 50 32 68 C28 70 24 65 24 50 Z" fill="#2E1C14"/>
       <path d="M26 42 Q48 46 74 42 C71 30 61 25 50 25 C39 25 29 30 26 42 Z" fill="#2E1C14"/>`,
      smileEyes,
      happyMouth,
      `<!-- Little Flower Clip -->
       <circle cx="32" cy="38" r="3.5" fill="#FDE047"/>
       <circle cx="32" cy="38" r="1.5" fill="#EA580C"/>`
    ),
  },
  {
    id: 'girl-7',
    name: '奶茶色長髮',
    category: 'girls',
    bg: '#FFF7ED',
    url: makeAvatar(
      '#FFF7ED',
      '#FB923C',
      `<!-- Milk Tea Long Hair -->
       <path d="M22 50 C22 28 78 28 78 50 C78 75 72 85 67 85 C67 55 33 55 33 85 C28 85 22 75 22 50 Z" fill="#8D6E63"/>
       <path d="M26 43 Q45 46 60 41 Q68 44 74 43 C70 30 60 25 50 25 C40 25 30 30 26 43 Z" fill="#8D6E63"/>`,
      dotEyes,
      happyMouth
    ),
  },
  {
    id: 'girl-8',
    name: '活力棒球帽',
    category: 'girls',
    bg: '#EEF2FF',
    url: makeAvatar(
      '#EEF2FF',
      '#6366F1',
      `<!-- Hair under cap -->
       <path d="M24 50 C24 35 76 35 76 50 C76 65 72 72 68 70 C68 52 32 52 32 70 C28 72 24 65 24 50 Z" fill="#374151"/>
       <path d="M33 46 Q50 49 67 46" stroke="#374151" stroke-width="3" fill="none"/>
       <!-- Baseball Cap -->
       <path d="M26 36 C26 22 74 22 74 36 Z" fill="#6366F1"/>
       <ellipse cx="50" cy="36" rx="26" ry="6" fill="#4F46E5"/>
       <circle cx="50" cy="22" r="2" fill="#E0E7FF"/>`,
      winkEyes,
      openSmileMouth
    ),
  },
  {
    id: 'girl-9',
    name: '溫柔微捲髮',
    category: 'girls',
    bg: '#FDF2F8',
    url: makeAvatar(
      '#FDF2F8',
      '#EC4899',
      `<!-- Soft Curly Hair -->
       <path d="M22 50 C22 30 78 30 78 50 C80 62 76 74 70 76 C68 65 67 52 67 52 C67 36 33 36 33 52 C33 52 32 65 30 76 C24 74 20 62 22 50 Z" fill="#5C3D2E"/>
       <path d="M27 42 Q38 46 50 43 Q62 46 73 42 C70 30 60 25 50 25 C40 25 30 30 27 42 Z" fill="#5C3D2E"/>`,
      smileEyes,
      happyMouth
    ),
  },
  {
    id: 'girl-10',
    name: '溫暖毛線帽',
    category: 'girls',
    bg: '#F1F5F9',
    url: makeAvatar(
      '#F1F5F9',
      '#64748B',
      `<!-- Hair peeking -->
       <path d="M25 52 C25 65 30 74 33 74 C34 55 66 55 67 74 C70 74 75 65 75 52 Z" fill="#451A03"/>
       <path d="M34 46 Q50 49 66 46" stroke="#451A03" stroke-width="3" fill="none"/>
       <!-- Beanie -->
       <path d="M26 40 C26 18 74 18 74 40 Z" fill="#E2E8F0"/>
       <rect x="24" y="36" width="52" height="8" rx="4" fill="#CBD5E1"/>
       <circle cx="50" cy="18" r="5" fill="#CBD5E1"/>`,
      dotEyes,
      happyMouth
    ),
  },
  {
    id: 'girl-11',
    name: '清爽極短髮',
    category: 'girls',
    bg: '#F0FDFA',
    url: makeAvatar(
      '#F0FDFA',
      '#14B8A6',
      `<!-- Pixie Hair -->
       <path d="M24 48 C24 28 76 28 76 48 C76 56 73 60 70 56 C70 36 30 36 30 56 C27 60 24 56 24 48 Z" fill="#1F2937"/>
       <path d="M26 40 Q40 44 54 39 Q65 44 74 40 C70 28 60 24 50 24 C40 24 30 28 26 40 Z" fill="#1F2937"/>`,
      winkEyes,
      happyMouth
    ),
  },
  {
    id: 'girl-12',
    name: '可愛紅髮妹',
    category: 'girls',
    bg: '#FFF1F2',
    url: makeAvatar(
      '#FFF1F2',
      '#F43F5E',
      `<!-- Auburn Hair -->
       <path d="M23 48 C23 28 77 28 77 48 C77 68 71 76 67 74 C67 52 33 52 33 74 C29 76 23 68 23 48 Z" fill="#B91C1C"/>
       <path d="M27 42 Q50 47 73 42 C70 30 60 25 50 25 C40 25 30 30 27 42 Z" fill="#B91C1C"/>`,
      smileEyes,
      openSmileMouth
    ),
  },

  // ==================== 陽光男孩 (BOYS) ====================
  {
    id: 'boy-1',
    name: '清爽陽光短髮',
    category: 'boys',
    bg: '#E0F2FE',
    url: makeAvatar(
      '#E0F2FE',
      '#0284C7',
      `<!-- Short Hair -->
       <path d="M25 46 C25 26 75 26 75 46 C75 52 72 56 68 52 C68 34 32 34 32 52 C28 56 25 52 25 46 Z" fill="#292524"/>
       <path d="M25 40 Q38 43 48 38 Q58 44 75 39 C70 26 60 22 50 22 C40 22 30 26 25 40 Z" fill="#292524"/>
       <!-- Hair Tufts -->
       <path d="M38 23 Q42 16 46 22" stroke="#292524" stroke-width="3" stroke-linecap="round" fill="none"/>
       <path d="M50 22 Q54 15 58 22" stroke="#292524" stroke-width="3" stroke-linecap="round" fill="none"/>`,
      dotEyes,
      happyMouth
    ),
  },
  {
    id: 'boy-2',
    name: '韓系中分帥哥',
    category: 'boys',
    bg: '#F5F3FF',
    url: makeAvatar(
      '#F5F3FF',
      '#7C3AED',
      `<!-- Curtain Hair -->
       <path d="M24 48 C24 28 76 28 76 48 C76 54 72 58 68 52 C68 36 32 36 32 52 C28 58 24 54 24 48 Z" fill="#1C1917"/>
       <!-- Curtain Bangs -->
       <path d="M26 38 C32 36 43 40 46 45 C43 32 35 24 26 38 Z" fill="#1C1917"/>
       <path d="M74 38 C68 36 57 40 54 45 C57 32 65 24 74 38 Z" fill="#1C1917"/>
       <path d="M35 25 C45 23 55 23 65 25 C58 22 42 22 35 25 Z" fill="#1C1917"/>`,
      winkEyes,
      happyMouth
    ),
  },
  {
    id: 'boy-3',
    name: '文青圓眼鏡',
    category: 'boys',
    bg: '#FEFCE8',
    url: makeAvatar(
      '#FEFCE8',
      '#CA8A04',
      `<!-- Messy Soft Hair -->
       <path d="M24 46 C24 26 76 26 76 46 C76 54 72 56 68 50 C68 35 32 35 32 50 C28 56 24 54 24 46 Z" fill="#451A03"/>
       <path d="M25 41 Q40 45 52 40 Q64 45 75 40 C70 27 60 23 50 23 C40 23 30 27 25 41 Z" fill="#451A03"/>`,
      dotEyes,
      happyMouth,
      `<!-- Round Glasses -->
       <circle cx="40" cy="50" r="7" stroke="#374151" stroke-width="2" fill="none"/>
       <circle cx="60" cy="50" r="7" stroke="#374151" stroke-width="2" fill="none"/>
       <line x1="47" y1="50" x2="53" y2="50" stroke="#374151" stroke-width="2"/>`
    ),
  },
  {
    id: 'boy-4',
    name: '活力棒球帽',
    category: 'boys',
    bg: '#ECFDF5',
    url: makeAvatar(
      '#ECFDF5',
      '#059669',
      `<!-- Hair peeking -->
       <path d="M26 48 C26 56 30 58 32 52 C32 40 68 40 68 52 C70 58 74 56 74 48 Z" fill="#18181B"/>
       <!-- Baseball Cap Forward -->
       <path d="M26 36 C26 20 74 20 74 36 Z" fill="#10B981"/>
       <path d="M22 36 Q50 40 82 32 Q50 36 22 36 Z" fill="#047857"/>
       <circle cx="50" cy="20" r="2" fill="#A7F3D0"/>`,
      smileEyes,
      openSmileMouth
    ),
  },
  {
    id: 'boy-5',
    name: '呆萌平瀏海',
    category: 'boys',
    bg: '#FFFBEB',
    url: makeAvatar(
      '#FFFBEB',
      '#D97706',
      `<!-- Bowl / Straight Fringe Hair -->
       <path d="M24 46 C24 26 76 26 76 46 C76 54 72 56 68 52 C68 35 32 35 32 52 C28 56 24 54 24 46 Z" fill="#3B2F2F"/>
       <path d="M25 42 L75 42 C72 28 62 23 50 23 C38 23 28 28 25 42 Z" fill="#3B2F2F"/>
       <line x1="28" y1="42" x2="72" y2="42" stroke="#3B2F2F" stroke-width="3" stroke-linecap="round"/>`,
      dotEyes,
      tinyDotMouth
    ),
  },
  {
    id: 'boy-6',
    name: '蓬鬆小捲毛',
    category: 'boys',
    bg: '#FDF4FF',
    url: makeAvatar(
      '#FDF4FF',
      '#C026D3',
      `<!-- Fluffy Curls -->
       <circle cx="30" cy="30" r="8" fill="#5C3D2E"/>
       <circle cx="42" cy="24" r="8" fill="#5C3D2E"/>
       <circle cx="58" cy="24" r="8" fill="#5C3D2E"/>
       <circle cx="70" cy="30" r="8" fill="#5C3D2E"/>
       <path d="M24 46 C24 28 76 28 76 46 C76 54 72 56 68 50 C68 35 32 35 32 50 C28 56 24 54 24 46 Z" fill="#5C3D2E"/>
       <path d="M26 41 Q38 45 50 41 Q62 45 74 41 C70 28 60 24 50 24 C40 24 30 28 26 41 Z" fill="#5C3D2E"/>`,
      smileEyes,
      happyMouth
    ),
  },
  {
    id: 'boy-7',
    name: '暖冬毛帽男',
    category: 'boys',
    bg: '#F8FAFC',
    url: makeAvatar(
      '#F8FAFC',
      '#3B82F6',
      `<!-- Sideburns -->
       <path d="M28 46 L28 54 L32 50 Z" fill="#18181B"/>
       <path d="M72 46 L72 54 L68 50 Z" fill="#18181B"/>
       <path d="M36 44 Q50 47 64 44" stroke="#18181B" stroke-width="3" fill="none"/>
       <!-- Beanie -->
       <path d="M26 38 C26 18 74 18 74 38 Z" fill="#1E40AF"/>
       <rect x="24" y="34" width="52" height="8" rx="4" fill="#3B82F6"/>
       <circle cx="50" cy="18" r="4" fill="#93C5FD"/>`,
      dotEyes,
      openSmileMouth
    ),
  },
  {
    id: 'boy-8',
    name: '運動頭帶少年',
    category: 'boys',
    bg: '#FEF2F2',
    url: makeAvatar(
      '#FEF2F2',
      '#EF4444',
      `<!-- Spiky Hair -->
       <path d="M24 44 C24 24 76 24 76 44 C76 52 72 54 68 50 C68 34 32 34 32 50 C28 54 24 52 24 44 Z" fill="#172554"/>
       <!-- Hair Tufts -->
       <path d="M35 22 L38 15 L43 21 L50 14 L57 21 L62 15 L65 22 Z" fill="#172554"/>
       <!-- Sport Headband -->
       <rect x="25" y="32" width="50" height="7" rx="3" fill="#EF4444"/>
       <line x1="25" y1="35.5" x2="75" y2="35.5" stroke="#FFFFFF" stroke-width="1.5"/>`,
      winkEyes,
      openSmileMouth
    ),
  },
  {
    id: 'boy-9',
    name: '咖啡色側分',
    category: 'boys',
    bg: '#FDF6B2',
    url: makeAvatar(
      '#FDF6B2',
      '#84CC16',
      `<!-- Side Part Hair -->
       <path d="M24 46 C24 26 76 26 76 46 C76 54 72 56 68 50 C68 35 32 35 32 50 C28 56 24 54 24 46 Z" fill="#78350F"/>
       <path d="M25 38 C35 34 50 36 74 42 C70 28 60 23 50 23 C40 23 30 27 25 38 Z" fill="#78350F"/>`,
      dotEyes,
      happyMouth
    ),
  },
  {
    id: 'boy-10',
    name: '酷帥黑短髮',
    category: 'boys',
    bg: '#F3F4F6',
    url: makeAvatar(
      '#F3F4F6',
      '#374151',
      `<!-- Cool Short Hair -->
       <path d="M24 46 C24 26 76 26 76 46 C76 52 72 56 68 50 C68 34 32 34 32 50 C28 56 24 52 24 46 Z" fill="#111827"/>
       <path d="M25 40 Q40 43 50 37 Q60 43 75 39 C70 26 60 22 50 22 C40 22 30 26 25 40 Z" fill="#111827"/>`,
      smileEyes,
      happyMouth
    ),
  },
  {
    id: 'boy-11',
    name: '露額清爽少年',
    category: 'boys',
    bg: '#E0E7FF',
    url: makeAvatar(
      '#E0E7FF',
      '#4F46E5',
      `<!-- Forehead Exposed Hair -->
       <path d="M25 44 C25 24 75 24 75 44 C75 52 72 54 68 48 C68 32 32 32 32 48 C28 54 25 52 25 44 Z" fill="#312E81"/>
       <path d="M26 36 Q50 32 74 36 C70 24 60 20 50 20 C40 20 30 24 26 36 Z" fill="#312E81"/>
       <path d="M42 20 Q46 13 50 19 Q54 13 58 20" stroke="#312E81" stroke-width="3" stroke-linecap="round" fill="none"/>`,
      winkEyes,
      openSmileMouth
    ),
  },
  {
    id: 'boy-12',
    name: '溫暖金棕髮',
    category: 'boys',
    bg: '#FEF3C7',
    url: makeAvatar(
      '#FEF3C7',
      '#EA580C',
      `<!-- Golden Brown Hair -->
       <path d="M24 46 C24 26 76 26 76 46 C76 54 72 56 68 50 C68 35 32 35 32 50 C28 56 24 54 24 46 Z" fill="#B45309"/>
       <path d="M26 40 Q40 44 52 39 Q64 44 74 40 C70 27 60 23 50 23 C40 23 30 27 26 40 Z" fill="#B45309"/>`,
      dotEyes,
      happyMouth
    ),
  },
];

// Helper to get a deterministic cute avatar if a member has none set
export const getDefaultMemberAvatar = (identifier: string = '', index: number = 0): string => {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  const safeIndex = Math.abs(hash + index) % CUTE_AVATARS.length;
  return CUTE_AVATARS[safeIndex].url;
};

// Helper to check if string is an image URL or SVG data
export const getMemberAvatarSrc = (avatar?: string | null, name: string = '', id: string = ''): string => {
  // If the stored avatar is an old dicebear URL that might be broken/clipped, replace it smoothly with deterministic cute avatar
  if (avatar && avatar.trim().length > 0) {
    if (avatar.includes('dicebear.com') || avatar.includes('miniavs') || avatar.includes('avataaars')) {
      return getDefaultMemberAvatar(name || id || 'user');
    }
    return avatar;
  }
  return getDefaultMemberAvatar(name || id || 'user');
};
