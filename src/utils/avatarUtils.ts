/**
 * Avatar Utilities for User Profile & System Management
 * Provides image compression for Firestore storage and built-in preset avatars.
 */

export interface PresetAvatar {
  id: string;
  name: string;
  category: 'teacher' | 'admin' | 'special';
  dataUrl: string;
}

// Crisp, lightweight SVG Data URLs for built-in avatars
export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'preset_admin_gold',
    name: 'Quản Trị Viên Hoàng Gia',
    category: 'admin',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#b45309" />
            <stop offset="50%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#78350f" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g1)" stroke="#fef3c7" stroke-width="4"/>
        <path d="M50 22 L58 38 L76 38 L62 49 L67 66 L50 56 L33 66 L38 49 L24 38 L42 38 Z" fill="#fef08a" stroke="#ffffff" stroke-width="2"/>
        <circle cx="50" cy="50" r="10" fill="#ffffff" opacity="0.9"/>
        <path d="M46 50 L49 53 L55 47" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    `)}`,
  },
  {
    id: 'preset_teacher_male',
    name: 'Thầy Giáo Tri Thức',
    category: 'teacher',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#047857" />
            <stop offset="100%" stop-color="#064e3b" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g2)" stroke="#a7f3d0" stroke-width="4"/>
        <circle cx="50" cy="40" r="18" fill="#fde047"/>
        <path d="M50 20 C40 20 35 26 35 32 C42 30 58 30 65 32 C65 26 60 20 50 20 Z" fill="#1e293b"/>
        <rect x="42" y="38" width="6" height="4" rx="1" fill="none" stroke="#0f172a" stroke-width="1.5"/>
        <rect x="52" y="38" width="6" height="4" rx="1" fill="none" stroke="#0f172a" stroke-width="1.5"/>
        <line x1="48" y1="40" x2="52" y2="40" stroke="#0f172a" stroke-width="1.5"/>
        <path d="M26 82 C28 65 38 60 50 60 C62 60 72 65 74 82 Z" fill="#0284c7"/>
        <polygon points="50,62 46,74 54,74" fill="#f8fafc"/>
        <polygon points="48,74 52,74 50,86" fill="#ef4444"/>
      </svg>
    `)}`,
  },
  {
    id: 'preset_teacher_female',
    name: 'Cô Giáo Tận Tụy',
    category: 'teacher',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#be185d" />
            <stop offset="100%" stop-color="#831843" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g3)" stroke="#fbcfe8" stroke-width="4"/>
        <path d="M30 36 C28 48 30 62 36 66 C38 52 38 40 42 34 Z" fill="#334155"/>
        <path d="M70 36 C72 48 70 62 64 66 C62 52 62 40 58 34 Z" fill="#334155"/>
        <circle cx="50" cy="40" r="17" fill="#fed7aa"/>
        <path d="M32 34 C36 22 64 22 68 34 C58 28 42 28 32 34 Z" fill="#334155"/>
        <circle cx="43" cy="40" r="2.5" fill="#1e293b"/>
        <circle cx="57" cy="40" r="2.5" fill="#1e293b"/>
        <path d="M46 47 Q50 51 54 47" stroke="#e11d48" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M26 82 C28 65 38 60 50 60 C62 60 72 65 74 82 Z" fill="#f43f5e"/>
        <circle cx="50" cy="68" r="3" fill="#fef08a"/>
      </svg>
    `)}`,
  },
  {
    id: 'preset_stem_ai',
    name: 'Chuyên Gia STEM & AI',
    category: 'special',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4338ca" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g4)" stroke="#c7d2fe" stroke-width="4"/>
        <circle cx="50" cy="42" r="20" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <circle cx="43" cy="40" r="3" fill="#38bdf8"/>
        <circle cx="57" cy="40" r="3" fill="#38bdf8"/>
        <path d="M44 48 Q50 52 56 48" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" fill="none"/>
        <line x1="50" y1="22" x2="50" y2="14" stroke="#38bdf8" stroke-width="2.5"/>
        <circle cx="50" cy="12" r="4" fill="#fbbf24"/>
        <path d="M26 82 C28 66 38 62 50 62 C62 62 72 66 74 82 Z" fill="#0f172a" stroke="#818cf8" stroke-width="2"/>
        <circle cx="50" cy="72" r="4" fill="#38bdf8"/>
      </svg>
    `)}`,
  },
  {
    id: 'preset_scholar_cap',
    name: 'Mũ Cử Nhân Tri Thức',
    category: 'teacher',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#0369a1" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g5)" stroke="#bae6fd" stroke-width="4"/>
        <polygon points="50,24 82,36 50,48 18,36" fill="#0f172a" stroke="#facc15" stroke-width="2"/>
        <path d="M28 42 L28 54 C28 62 72 62 72 54 L72 42" fill="#1e293b"/>
        <circle cx="50" cy="36" r="3" fill="#facc15"/>
        <path d="M76 38 L80 56" stroke="#facc15" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="80" cy="58" r="3" fill="#facc15"/>
        <path d="M26 82 C28 66 38 62 50 62 C62 62 72 66 74 82 Z" fill="#0f172a"/>
      </svg>
    `)}`,
  },
  {
    id: 'preset_wise_owl',
    name: 'Cú Mèo Thông Thái',
    category: 'special',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#854d0e" />
            <stop offset="100%" stop-color="#451a03" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g6)" stroke="#fde047" stroke-width="4"/>
        <ellipse cx="50" cy="54" rx="28" ry="30" fill="#fef08a"/>
        <circle cx="38" cy="44" r="11" fill="#ffffff" stroke="#78350f" stroke-width="3"/>
        <circle cx="62" cy="44" r="11" fill="#ffffff" stroke="#78350f" stroke-width="3"/>
        <circle cx="38" cy="44" r="5" fill="#1e293b"/>
        <circle cx="62" cy="44" r="5" fill="#1e293b"/>
        <polygon points="50,48 45,56 55,56" fill="#ea580c"/>
        <polygon points="26,24 34,36 22,38" fill="#78350f"/>
        <polygon points="74,24 66,36 78,38" fill="#78350f"/>
      </svg>
    `)}`,
  },
  {
    id: 'preset_open_book',
    name: 'Ngọn Lửa Sách Vàng',
    category: 'special',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ea580c" />
            <stop offset="100%" stop-color="#9a3412" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#g7)" stroke="#fed7aa" stroke-width="4"/>
        <path d="M50 20 Q54 32 60 36 Q66 40 64 48 Q60 56 50 60 Q40 56 36 48 Q34 40 40 36 Q46 32 50 20 Z" fill="#fef08a"/>
        <path d="M50 30 Q52 38 56 40 Q58 46 50 52 Q42 46 44 40 Q48 38 50 30 Z" fill="#f97316"/>
        <path d="M22 66 Q36 60 50 64 Q64 60 78 66 L78 78 Q64 72 50 76 Q36 72 22 78 Z" fill="#ffffff" stroke="#7c2d12" stroke-width="2"/>
        <line x1="50" y1="64" x2="50" y2="76" stroke="#ea580c" stroke-width="2"/>
      </svg>
    `)}`,
  },
];

/**
 * Compresses and resizes any uploaded image file into a lightweight base64 Data URL (Max 220x220px, ~20KB)
 * Perfect for storing directly inside Firebase Firestore documents without taking quota.
 */
export function compressAndResizeImage(file: File, maxDimension: number = 220, quality: number = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tệp tải lên không phải là định dạng hình ảnh hợp lệ!'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh!'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể tải hình ảnh để xử lý!'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate square crop or aspect ratio containment
        const minSide = Math.min(width, height);
        const startX = (width - minSide) / 2;
        const startY = (height - minSide) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = maxDimension;
        canvas.height = maxDimension;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể tạo canvas đồ họa!'));
          return;
        }

        // Draw cropped center square to target dimension
        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDimension, maxDimension);

        // Convert to lightweight JPEG or WebP Data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Get user initials for default avatar display
 */
export function getUserInitials(name?: string, username?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (username && username.trim()) {
    return username.slice(0, 2).toUpperCase();
  }
  return 'GV';
}
