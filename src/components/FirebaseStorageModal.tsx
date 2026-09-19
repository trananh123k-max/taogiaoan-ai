import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Cloud,
  CheckCircle2,
  Sparkles,
  Search,
  Plus,
  Trash2,
  UploadCloud,
  Check,
  Users,
  ShieldCheck,
  Edit3,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  UserX,
  Building,
  Calendar,
  AlertCircle, Loader2, AlertTriangle,
  Database,
  Layers,
  FileText,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';
import { TextbookSample, CustomUploadedBook, CustomUploadedPPCT } from '../types';
import { SUBJECTS_LIST, MAM_NON_SUBJECTS_LIST, MAM_NON_NEW_ACTIVITIES, getVerifiedLessons } from '../data/curriculumData';
import { SEED_SAMPLE_BOOKS, SEED_SAMPLE_PPCT } from '../data/seedData';
import { extractTextFromPDF } from '../utils/pdfExtractor';
import { getApiHeaders } from '../utils/apiKeyManager';
import {
  ManagedUserAccount,
  DEFAULT_USER_ACCOUNTS,
  loadUserAccountsFromFirestore,
  saveUserAccountToFirestore,
  deleteUserAccountFromFirestore,
  toggleUserAccountStatusInFirestore,
  saveTextbookToFirestore,
  loadTextbooksFromFirestore,
  deleteTextbookFromFirestore,
  savePPCTToFirestore,
  loadPPCTFromFirestore,
  deletePPCTFromFirestore,
  bulkSyncToServer,
} from '../utils/firebase';

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

interface FirebaseStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTextbook: (sample: TextbookSample) => void;
  onUpdateTeacherInfo?: (name: string, school: string) => void;
  onBooksUpdated?: (books: CustomUploadedBook[]) => void;
  onPPCTUpdated?: (ppcts: any[]) => void;
  userRole?: 'teacher' | 'admin';
}

export const FirebaseStorageModal: React.FC<FirebaseStorageModalProps> = ({
  isOpen,
  onClose,
  onSelectTextbook,
  onUpdateTeacherInfo,
  onBooksUpdated,
  onPPCTUpdated,
  userRole = 'admin',
}) => {
  const [selectedTab, setSelectedTab] = useState<
    'my_books' | 'ppct_list' | 'upload_new' | 'upload_ppct' | 'cloud_sync'
  >('my_books');

  // Search state for Books & PPCT
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookSubjectFilter, setBookSubjectFilter] = useState('Tất cả');
  const [ppctSearchQuery, setPpctSearchQuery] = useState('');
  const [ppctSubjectFilter, setPpctSubjectFilter] = useState('Tất cả');
  const [bookLevelFilter, setBookLevelFilter] = useState('Tất cả');
  const [ppctLevelFilter, setPpctLevelFilter] = useState('Tất cả');



  // Form upload state (Môn học, Khối lớp, Tên bộ sách, Tệp PDF)
  const [newSubject, setNewSubject] = useState('Tin học');
  const [newGrade, setNewGrade] = useState('Nhiều khối lớp (Tự động nhận diện)');
  const [newBookSeries, setNewBookSeries] = useState('Kết nối tri thức với cuộc sống');
  const [newVolume, setNewVolume] = useState('Cả năm / Không phân tập');

  const isMamNon = newGrade.includes('Nhà trẻ') || newGrade.includes('Mẫu giáo');
  const currentSubjectsList = isMamNon ? MAM_NON_SUBJECTS_LIST : SUBJECTS_LIST;

  useEffect(() => {
    const isMam = newGrade.includes('Nhà trẻ') || newGrade.includes('Mẫu giáo');
    const validList = isMam ? MAM_NON_SUBJECTS_LIST : SUBJECTS_LIST;
    if (!validList.includes(newSubject)) {
      setNewSubject(validList[0] || 'Tin học');
    }
  }, [newGrade, newSubject]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Custom books stored in Firestore & local state
  const [myUploadedBooks, setMyUploadedBooks] = useState<CustomUploadedBook[]>(() => {
    try {
      const saved = localStorage.getItem('khbd_my_firebase_books');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 12) {
          return parsed;
        }
      }
      return SEED_SAMPLE_BOOKS;
    } catch {
      return SEED_SAMPLE_BOOKS;
    }
  });

  const [myUploadedPPCTs, setMyUploadedPPCTs] = useState<CustomUploadedPPCT[]>(() => {
    try {
      const saved = localStorage.getItem('khbd_my_firebase_ppct');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(
            (p: any) =>
              !p.fileName?.includes('ChuanKNTT.xlsx') &&
              !p.id?.startsWith('ppct_toán_') &&
              !p.id?.startsWith('ppct_ngữ_văn_') &&
              !p.id?.startsWith('ppct_khoa_học_') &&
              !SEED_SAMPLE_PPCT.some((s) => s.id === p.id)
          );
          return [...SEED_SAMPLE_PPCT, ...cleaned];
        }
      }
      return SEED_SAMPLE_PPCT;
    } catch {
      return SEED_SAMPLE_PPCT;
    }
  });

  // User Accounts Managed in Firestore
  const [userAccounts, setUserAccounts] = useState<ManagedUserAccount[]>(DEFAULT_USER_ACCOUNTS);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<ManagedUserAccount>>({
    fullName: '',
    username: '',
    accessCode: '',
    schoolName: '',
    role: 'teacher',
    status: 'active',
    expiresAt: 'Vĩnh viễn',
    notes: '',
  });
  const [userSaveMsg, setUserSaveMsg] = useState('');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Load User Accounts and Textbooks from Firestore on modal open
  useEffect(() => {
    if (isOpen) {
      loadUserAccountsFromFirestore().then((accounts) => {
        if (accounts && accounts.length > 0) {
          setUserAccounts(accounts);
        }
      });
      
      loadPPCTFromFirestore().then((ppcts) => {
        if (ppcts && ppcts.length > 0) {
          setMyUploadedPPCTs(ppcts);
        }
      });

      loadTextbooksFromFirestore().then((books) => {
        if (books && books.length > 0) {
          // Auto-heal any books that have incomplete lesson count (e.g. old 4 dummy lessons)
          const healedBooks = books.map((b) => {
            if ((!b.lessons || b.lessons.length <= 4) && b.subject && b.grade) {
              const verified = getVerifiedLessons(b.subject, b.grade);
              if (verified && verified.lessons.length > 4) {
                const updatedBook = {
                  ...b,
                  lessons: verified.lessons,
                  summary: `Sách giáo khoa ${b.subject} ${b.grade} (${b.bookSeries || 'Kết nối tri thức'}) gồm ${verified.lessons.length} bài học.`,
                };
                saveTextbookToFirestore(updatedBook).catch(() => {});
                return updatedBook;
              }
            }
            return b;
          });

          setMyUploadedBooks(healedBooks);
          if (onBooksUpdated) onBooksUpdated(healedBooks);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('khbd_my_firebase_books', JSON.stringify(myUploadedBooks));
      if (onBooksUpdated) onBooksUpdated(myUploadedBooks);
    } catch {
      // ignore
    }
  }, [myUploadedBooks]);

  useEffect(() => {
    try {
      localStorage.setItem('khbd_my_firebase_ppct', JSON.stringify(myUploadedPPCTs));
    } catch {
      // ignore
    }
  }, [myUploadedPPCTs]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFile(files[0]);
      setSelectedFiles(files);
    }
  };

  
  const handleSavePPCTToFirebase = async () => {
    setIsUploading(true);
    setUploadStatusMsg('AI đang phân tích tệp Phân phối chương trình (PPCT)...');

    try {
      let fileBase64 = '';
      if (selectedFile) {
        fileBase64 = await readFileAsBase64(selectedFile);
      }

      const res = await fetch('/api/extract-ppct', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          subject: newSubject,
          grade: newGrade,
          bookSeries: newBookSeries,
          volume: newVolume,
          fileName: selectedFile?.name || '',
          fileBase64: fileBase64,
          mimeType: selectedFile?.type || '',
        }),
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
           const errText = await res.text();
           throw new Error("Server returned HTML or non-JSON response (possibly due to proxy timeout or login redirect). " + errText.substring(0, 50));
        }
        const data = await res.json();
        if (data.success && data.results && data.results.length > 0) {
          setUploadStatusMsg('Đang lưu PPCT vào Firestore...');
          let newPPCTs = [];
          for (const resItem of data.results) {
            const detectedGrade = resItem.grade || newGrade;
            const newPPCT = {
              id: `ppct_${newSubject}_${detectedGrade}_${Date.now()}_${Math.random().toString(36).substring(7)}`.replace(/\s+/g, '_').toLowerCase(),
              title: `PPCT ${newSubject} ${detectedGrade}`,
              subject: newSubject,
              grade: detectedGrade,
              fileName: selectedFile?.name || `ppct_${newSubject}_${detectedGrade}`,
              fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
              uploadedAt: new Date().toLocaleDateString('vi-VN'),
              summary: `PPCT gồm ${resItem.lessonConfigs.length} bài học có cấu trúc phân bổ tiết.`,
              lessonConfigs: resItem.lessonConfigs,
            };
            await savePPCTToFirestore(newPPCT);
            newPPCTs.push(newPPCT);
          }
          const updatedPPCTs = [...newPPCTs, ...myUploadedPPCTs.filter((p) => !newPPCTs.find(n => n.subject === p.subject && n.grade === p.grade))];
          setMyUploadedPPCTs(updatedPPCTs);
          if (onPPCTUpdated) onPPCTUpdated(updatedPPCTs);
          
          setIsUploading(false);
          setUploadSuccess(true);
          setUploadStatusMsg(`✅ Đã lưu thành công ${newPPCTs.length} bản PPCT (tổng cộng ${data.results.reduce((acc, r) => acc + r.lessonConfigs.length, 0)} cấu trúc bài học)!`);
          setTimeout(() => {
            setUploadSuccess(false);
            setUploadStatusMsg('');
            setSelectedTab('ppct_list');
          }, 3000);
          return;
        }
        if (data.success && data.lessonConfigs && data.lessonConfigs.length > 0) {
          const newPPCT: CustomUploadedPPCT = {
            id: `ppct_${newSubject}_${newGrade}_${Date.now()}`.replace(/\s+/g, '_').toLowerCase(),
            title: `PPCT ${newSubject} ${newGrade}`,
            subject: newSubject,
            grade: newGrade,
            fileName: selectedFile?.name || `ppct_${newSubject}_${newGrade}`,
            fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
            uploadedAt: new Date().toLocaleDateString('vi-VN'),
            summary: `PPCT gồm ${data.lessonConfigs.length} bài học có cấu trúc phân bổ tiết.`,
            lessonConfigs: data.lessonConfigs,
          };

          setUploadStatusMsg('Đang lưu PPCT vào Firestore...');
          await savePPCTToFirestore(newPPCT);

          const updatedPPCTs = [newPPCT, ...myUploadedPPCTs.filter((p) => !(p.subject === newSubject && p.grade === newGrade))];
          setMyUploadedPPCTs(updatedPPCTs);
          
          setIsUploading(false);
          setUploadSuccess(true);
          setUploadStatusMsg(`✅ Đã lưu PPCT thành công và trích xuất ${data.lessonConfigs.length} cấu trúc bài học!`);

          setTimeout(() => {
            setUploadSuccess(false);
            setUploadStatusMsg('');
            setSelectedTab('ppct_list');
          }, 3000);
          return;
        }
      } else {
        const errText = await res.text();
        throw new Error(errText.substring(0, 100) || "Lỗi Server hoặc Quá tải API");
      }
      throw new Error('Could not extract PPCT data from file');
    } catch (err: any) {
      console.error(err);
      setUploadStatusMsg('❌ Lỗi khi phân tích PPCT: Quá tải giới hạn miễn phí hoặc lỗi hệ thống. Chi tiết: ' + err.message);
      setIsUploading(false);
    }
  };

  const handleDeletePPCT = async (id: string) => {
    setIsUploading(true);
    setUploadStatusMsg('Đang xóa PPCT...');
    const success = await deletePPCTFromFirestore(id);
    if (success) {
      const updated = myUploadedPPCTs.filter(p => p.id !== id);
      setMyUploadedPPCTs(updated);
    }
    setIsUploading(false);
  };

  const handleSaveBookToFirebase = async () => {
    setIsUploading(true);
    const filesToProcess = selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);
    let newBooks = [];
    let hasError = false;
    let errorMessage = '';
    
    for (const file of filesToProcess) {
      setUploadStatusMsg(`Đang xử lý tệp: ${file.name}...`);
      let extractedLessons: string[] = [];
      let detectedGrade = newGrade;
      let detectedSubject = newSubject;
      let detectedVolume = newVolume;

      try {
        setUploadStatusMsg(`Đang trích xuất nội dung Mục lục từ tệp ${file.name}...`);
        const pdfInfo = await extractTextFromPDF(file);

        if (pdfInfo.detectedSubject && (!newSubject || newSubject === 'Toán học')) {
          detectedSubject = pdfInfo.detectedSubject;
        }
        if (pdfInfo.detectedGrade && (newGrade === 'Nhiều khối lớp (Tự động nhận diện)' || !newGrade)) {
          detectedGrade = pdfInfo.detectedGrade;
        }
        if (pdfInfo.detectedVolume && (newVolume === 'Cả năm / Không phân tập' || !newVolume)) {
          detectedVolume = pdfInfo.detectedVolume;
        }

        // Check verified database first
        const verified = getVerifiedLessons(detectedSubject, detectedGrade, detectedVolume);

        setUploadStatusMsg(`Đang phân tích cấu trúc bài học ${detectedSubject} ${detectedGrade} (${detectedVolume})...`);
        
        try {
          const res = await fetch('/api/extract-textbook-toc', {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({
              subject: detectedSubject,
              grade: detectedGrade,
              bookSeries: newBookSeries,
              volume: detectedVolume,
              fileName: file.name,
              fileTextSnippet: pdfInfo.extractedText || `Sách giáo khoa môn ${detectedSubject} ${detectedGrade} ${detectedVolume} bộ sách ${newBookSeries}`,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.lessons && Array.isArray(data.lessons) && data.lessons.length > 0) {
              extractedLessons = data.lessons;
            }
            if (data.detectedGrade && data.detectedGrade !== "Nhiều khối lớp (Tự động nhận diện)") detectedGrade = data.detectedGrade;
            if (data.detectedSubject) detectedSubject = data.detectedSubject;
            if (data.detectedVolume) detectedVolume = data.detectedVolume;
          }
        } catch (apiErr) {
          console.warn('API TOC extraction notice:', apiErr);
        }

        // Seamless fallback to verified standard MOET curriculum if AI extraction is short or failed
        if (extractedLessons.length <= 4 && verified && verified.lessons.length > extractedLessons.length) {
          extractedLessons = verified.lessons;
        }
      } catch (err: any) {
        console.error('Could not extract TOC for', file.name, err);
        const verified = getVerifiedLessons(detectedSubject, detectedGrade, detectedVolume);
        if (verified && verified.lessons.length > 0) {
          extractedLessons = verified.lessons;
        }
      }

      if (extractedLessons.length <= 4) {
        const verified = getVerifiedLessons(detectedSubject, detectedGrade, detectedVolume);
        if (verified && verified.lessons.length > extractedLessons.length) {
          extractedLessons = verified.lessons;
        }
      }

      if (extractedLessons.length === 0) {
        extractedLessons = [
          `Bài 1: Khởi động & Tổng quan ${detectedSubject} ${detectedGrade}`,
          `Bài 2: Kiến thức trọng tâm & Kỹ năng số`,
          `Bài 3: Thực hành và Ứng dụng thực tiễn`,
          `Bài 4: Ôn tập và Đánh giá năng lực`,
        ];
      }

      const bookTitle = `SGK ${detectedSubject} ${detectedGrade} ${detectedVolume !== "Cả năm / Không phân tập" ? detectedVolume : ""} - ${newBookSeries}`;
      const newBook: CustomUploadedBook = {
        id: `sgk_${detectedSubject}_${detectedGrade}_${Date.now()}_${Math.random().toString(36).substring(7)}`.replace(/\s+/g, '_').toLowerCase(),
        title: bookTitle,
        subject: detectedSubject,
        grade: detectedGrade,
        bookSeries: newBookSeries,
        volume: detectedVolume,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: new Date().toLocaleDateString('vi-VN'),
        summary: `Sách giáo khoa ${detectedSubject} ${detectedGrade} (${newBookSeries}) gồm ${extractedLessons.length} bài học.`,
        lessons: extractedLessons,
      };

      setUploadStatusMsg(`Đang lưu ${file.name} vào kho Firestore...`);
      await saveTextbookToFirestore(newBook);
      newBooks.push(newBook);
    }

    if (newBooks.length > 0) {
      let updatedBooks = [...newBooks, ...myUploadedBooks];
      // Keep only unique
      const uniqueIds = new Set();
      updatedBooks = updatedBooks.filter(b => {
         const dup = uniqueIds.has(b.id);
         uniqueIds.add(b.id);
         return !dup;
      });
      setMyUploadedBooks(updatedBooks);
      if (onBooksUpdated) onBooksUpdated(updatedBooks);
    }

    setIsUploading(false);
    
    if (hasError) {
      setUploadStatusMsg(errorMessage);
    } else {
      setUploadSuccess(true);
      setUploadStatusMsg(`✅ Đã lưu thành công ${newBooks.length} cuốn sách với đầy đủ danh mục bài học!`);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadStatusMsg('');
        setSelectedTab('my_books');
      }, 3000);
    }
  };

  const handleRescanBookTOC = async (book: CustomUploadedBook) => {
    setIsUploading(true);
    setUploadStatusMsg(`Đang quét lại Mục lục cho SGK ${book.subject} ${book.grade}...`);
    try {
      const vol = (book as any).volume || 'Cả năm / Không phân tập';
      const verified = getVerifiedLessons(book.subject, book.grade, vol);
      let lessons = book.lessons;

      try {
        const res = await fetch('/api/extract-textbook-toc', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            subject: book.subject,
            grade: book.grade,
            bookSeries: book.bookSeries,
            volume: vol,
            fileName: book.fileName,
            fileTextSnippet: `Sách giáo khoa môn ${book.subject} ${book.grade} bộ sách ${book.bookSeries}`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.lessons && Array.isArray(data.lessons) && data.lessons.length > 0) {
            lessons = data.lessons;
          }
        }
      } catch (apiErr) {
        console.warn('API rescan notice:', apiErr);
      }

      if (!lessons || lessons.length <= 4) {
        if (verified && verified.lessons.length > 0) {
          lessons = verified.lessons;
        }
      }

      const updatedBook: CustomUploadedBook = {
        ...book,
        lessons: lessons,
        summary: `Sách giáo khoa ${book.subject} ${book.grade} (${book.bookSeries}) gồm ${lessons.length} bài học.`,
      };

      await saveTextbookToFirestore(updatedBook);
      const updatedList = myUploadedBooks.map((b) => (b.id === book.id ? updatedBook : b));
      setMyUploadedBooks(updatedList);
      if (onBooksUpdated) onBooksUpdated(updatedList);
      alert(`✅ Đã cập nhật thành công ${lessons.length} bài học cho ${book.title}!`);
    } catch (e: any) {
      console.error(e);
      alert('Không thể quét lại: ' + e.message);
    } finally {
      setIsUploading(false);
      setUploadStatusMsg('');
    }
  };

  const handleDeleteBook = async (id: string) => {
    setIsUploading(true);
    setUploadStatusMsg('Đang xóa sách...');
    const success = await deleteTextbookFromFirestore(id);
    if (success) {
      const updated = myUploadedBooks.filter((b) => b.id !== id);
      setMyUploadedBooks(updated);
      if (onBooksUpdated) onBooksUpdated(updated);
    }
    setIsUploading(false);
  };

  // User Account Management Handlers
  const handleOpenCreateUserModal = () => {
    setEditingUserId(null);
    setUserFormData({
      fullName: '',
      username: '',
      accessCode: `GV@${Math.floor(1000 + Math.random() * 9000)}`,
      schoolName: 'THPT Chuyên Châu Văn Liêm',
      role: 'teacher',
      status: 'active',
      expiresAt: 'Chưa cấp',
      notes: '',
    });
    setUserSaveMsg('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (acc: ManagedUserAccount) => {
    setEditingUserId(acc.id);
    setUserFormData({ ...acc });
    setUserSaveMsg('');
    setIsUserModalOpen(true);
  };

  const handleSaveUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.fullName?.trim() || !userFormData.username?.trim()) {
      alert('Vui lòng nhập đầy đủ Họ tên và Tên đăng nhập / Email!');
      return;
    }

    const accountToSave: ManagedUserAccount = {
      id: editingUserId || `user_${Date.now()}`,
      username: userFormData.username.trim(),
      fullName: userFormData.fullName.trim(),
      email: userFormData.username.includes('@') ? userFormData.username.trim() : undefined,
      phone: userFormData.phone?.trim(),
      schoolName: userFormData.schoolName?.trim() || 'Đang cập nhật',
      role: userFormData.role || 'teacher',
      status: userFormData.status || 'active',
      accessCode: userFormData.accessCode?.trim() || '123456',
      createdAt: userFormData.createdAt || new Date().toLocaleDateString('vi-VN'),
      expiresAt: userFormData.expiresAt?.trim() || 'Vĩnh viễn',
      notes: userFormData.notes?.trim() || '',
      lastLogin: userFormData.lastLogin || 'Chưa đăng nhập',
    };

    await saveUserAccountToFirestore(accountToSave);
    const updated = [accountToSave, ...userAccounts.filter((a) => a.id !== accountToSave.id)];
    setUserAccounts(updated);
    setUserSaveMsg('✅ Đã lưu tài khoản người dùng thành công vào Firestore!');

    setTimeout(() => {
      setIsUserModalOpen(false);
      setUserSaveMsg('');
    }, 1000);
  };

  const handleToggleUserStatus = async (acc: ManagedUserAccount) => {
    const nextStatus = acc.status === 'active' ? 'locked' : 'active';
    await toggleUserAccountStatusInFirestore(acc.id, nextStatus);
    setUserAccounts((prev) =>
      prev.map((a) => (a.id === acc.id ? { ...a, status: nextStatus } : a))
    );
  };

  const handleDeleteUserAccount = async (id: string) => {
    setIsUploading(true);
    setUploadStatusMsg('Đang xóa tài khoản...');
    const target = userAccounts.find((a) => a.id === id || a.username === id);
    const success = await deleteUserAccountFromFirestore(id, target);
    if (success) {
      setUserAccounts((prev) =>
        prev.filter((a) => a.id !== id && a.username !== id && (!target?.email || a.email !== target.email))
      );
    }
    setIsUploading(false);
  };

  // Export all repository data as JSON
  const handleExportRepositoryJSON = () => {
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      books: myUploadedBooks,
      ppcts: myUploadedPPCTs,
      userAccounts: userAccounts,
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KHBD_KhoDuLieu_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import repository data from JSON file
  const handleImportRepositoryJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsUploading(true);
        setUploadStatusMsg('Đang nhập dữ liệu từ tệp JSON và lưu vào Firestore & Máy chủ...');
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const importedBooks = Array.isArray(parsed.books) ? parsed.books : [];
        const importedPPCTs = Array.isArray(parsed.ppcts) ? parsed.ppcts : [];
        const importedUsers = Array.isArray(parsed.userAccounts) ? parsed.userAccounts : [];

        if (importedBooks.length > 0) {
          setMyUploadedBooks(importedBooks);
          if (onBooksUpdated) onBooksUpdated(importedBooks);
          for (const b of importedBooks) {
            saveTextbookToFirestore(b).catch(() => {});
          }
        }
        if (importedPPCTs.length > 0) {
          setMyUploadedPPCTs(importedPPCTs);
          if (onPPCTUpdated) onPPCTUpdated(importedPPCTs);
          for (const p of importedPPCTs) {
            savePPCTToFirestore(p).catch(() => {});
          }
        }
        if (importedUsers.length > 0) {
          setUserAccounts(importedUsers);
          for (const u of importedUsers) {
            saveUserAccountToFirestore(u).catch(() => {});
          }
        }

        await bulkSyncToServer(
          importedBooks.length > 0 ? importedBooks : myUploadedBooks,
          importedPPCTs.length > 0 ? importedPPCTs : myUploadedPPCTs,
          importedUsers.length > 0 ? importedUsers : userAccounts
        );

        setIsUploading(false);
        setUploadSuccess(true);
        setUploadStatusMsg(`✅ Đã nhập thành công ${importedBooks.length} SGK, ${importedPPCTs.length} PPCT, ${importedUsers.length} tài khoản!`);
        setTimeout(() => setUploadSuccess(false), 4000);
      } catch (err: any) {
        setIsUploading(false);
        alert('Tệp JSON không hợp lệ: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Seed Standard MOET Library with 1 click
  const handleSeedFullLibrary = async () => {
    if (
      confirm(
        'Bạn có chắc chắn muốn nạp toàn bộ Kho Sách Giáo Khoa Chuẩn và 4 File PPCT Phụ lục 03 (Tin học 6, 7, 8, 9) vào hệ thống?'
      )
    ) {
      setIsUploading(true);
      setUploadStatusMsg('Đang nạp Kho SGK Chuẩn và 4 File PPCT Phụ lục 03 vào Firestore & Máy chủ...');

      setMyUploadedBooks(SEED_SAMPLE_BOOKS);
      setMyUploadedPPCTs(SEED_SAMPLE_PPCT);
      if (onBooksUpdated) onBooksUpdated(SEED_SAMPLE_BOOKS);
      if (onPPCTUpdated) onPPCTUpdated(SEED_SAMPLE_PPCT);

      await bulkSyncToServer(SEED_SAMPLE_BOOKS, SEED_SAMPLE_PPCT, userAccounts);

      for (const b of SEED_SAMPLE_BOOKS) {
        saveTextbookToFirestore(b).catch(() => {});
      }
      for (const p of SEED_SAMPLE_PPCT) {
        savePPCTToFirestore(p).catch(() => {});
      }

      setIsUploading(false);
      setUploadSuccess(true);
      setUploadStatusMsg(
        `✅ Đã nạp thành công ${SEED_SAMPLE_BOOKS.length} bộ SGK và 4 File PPCT Phụ lục 03 chuẩn vào Kho dùng chung!`
      );
      setTimeout(() => setUploadSuccess(false), 4000);
    }
  };

  // Manual Full Sync to Server & Firestore
  const handleManualSyncServer = async () => {
    setIsUploading(true);
    setUploadStatusMsg('Đang đồng bộ dữ liệu lên Máy chủ Render & Firebase Firestore...');
    try {
      const ok = await bulkSyncToServer(myUploadedBooks, myUploadedPPCTs, userAccounts);
      for (const b of myUploadedBooks) {
        saveTextbookToFirestore(b).catch(() => {});
      }
      for (const p of myUploadedPPCTs) {
        savePPCTToFirestore(p).catch(() => {});
      }
      for (const u of userAccounts) {
        saveUserAccountToFirestore(u).catch(() => {});
      }
      setIsUploading(false);
      setUploadSuccess(true);
      setUploadStatusMsg(
        ok
          ? `✅ Đồng bộ thành công: ${myUploadedBooks.length} SGK, ${myUploadedPPCTs.length} PPCT, ${userAccounts.length} tài khoản!`
          : `✅ Đã lưu cục bộ & gửi lệnh đồng bộ lên hệ thống!`
      );
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (e: any) {
      setIsUploading(false);
      alert('Lỗi khi đồng bộ: ' + e.message);
    }
  };

  // Filtered lists

  const getLevelFromGrade = (grade: string) => {
    if (!grade) return 'Khác';
    if (grade.includes('Nhà trẻ') || grade.includes('Mẫu giáo')) return 'Mầm non';
    const match = grade.match(/Lớp\s+(\d+)/i);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= 1 && num <= 5) return 'Tiểu học';
      if (num >= 6 && num <= 9) return 'THCS';
      if (num >= 10 && num <= 12) return 'THPT';
    }
    return 'Khác';
  };

  const filteredUploadedBooks = myUploadedBooks.filter(
    (b) => {
      const matchSearch = (b.title || '').toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
                          (b.subject || '').toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
                          (b.grade || '').toLowerCase().includes(bookSearchQuery.toLowerCase());
      const matchSubject = bookSubjectFilter === 'Tất cả' || b.subject === bookSubjectFilter;
      const matchLevel = bookLevelFilter === 'Tất cả' || getLevelFromGrade(b.grade) === bookLevelFilter;
      return matchSearch && matchSubject && matchLevel;
    }
  );

  const filteredUploadedPPCTs = myUploadedPPCTs.filter(
    (p) => {
      const matchSearch = (p.title || '').toLowerCase().includes(ppctSearchQuery.toLowerCase()) ||
                          (p.subject || '').toLowerCase().includes(ppctSearchQuery.toLowerCase()) ||
                          (p.grade || '').toLowerCase().includes(ppctSearchQuery.toLowerCase());
      const matchSubject = ppctSubjectFilter === 'Tất cả' || p.subject === ppctSubjectFilter;
      const matchLevel = ppctLevelFilter === 'Tất cả' || getLevelFromGrade(p.grade) === ppctLevelFilter;
      return matchSearch && matchSubject && matchLevel;
    }
  );



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] h-full shadow-2xl flex flex-col overflow-hidden text-slate-800">
        
        {/* Header (shrink-0) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-md shadow-amber-500/20 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Kho Học Liệu Sách SGK & Kế Hoạch Dạy Học
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Firestore: Đã kết nối
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Kho lưu trữ dùng chung SGK và Kế hoạch dạy học (PPCT)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (shrink-0 with clean overflow-x) */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto shrink-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedTab('my_books')}
            className={`pb-2.5 pt-1 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              selectedTab === 'my_books'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-lg'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Kho Sách SGK ({myUploadedBooks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('ppct_list')}
            className={`pb-2.5 pt-1 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              selectedTab === 'ppct_list'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-lg'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Kho Phân Phối Chương Trình ({myUploadedPPCTs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('upload_new')}
            className={`pb-2.5 pt-1 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              selectedTab === 'upload_new'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-lg'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-amber-600" />
            <span>+ Tải Sách SGK Mới (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('upload_ppct')}
            className={`pb-2.5 pt-1 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              selectedTab === 'upload_ppct'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-lg'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-amber-600" />
            <span>+ Tải PPCT Mới & Phân Tích</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('cloud_sync')}
            className={`pb-2.5 pt-1 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              selectedTab === 'cloud_sync'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-lg'
            }`}
          >
            <Cloud className="w-4 h-4 text-amber-600" />
            <span>Cấu Hình Firebase</span>
          </button>
        </div>

        {/* TAB 1: KHO SÁCH ĐÃ TẢI LÊN (DÙNG CHUNG) */}
        {selectedTab === 'my_books' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
            {/* Quick Management & Seed Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Tiện ích Kho Sách:
                </span>
                <span className="text-[11px] text-amber-900 hidden sm:inline font-medium">
                  {myUploadedBooks.length} bộ sách đã sẵn sàng
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSeedFullLibrary}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                  title="Nạp đầy đủ toàn bộ SGK & PPCT tất cả các môn từ Lớp 1 đến Lớp 12"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>✨ Nạp Kho Mẫu Chuẩn</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportRepositoryJSON}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Tải tệp sao lưu dữ liệu kho dạng JSON về máy tính"
                >
                  <Download className="w-3 h-3 text-slate-600" />
                  <span>Xuất JSON</span>
                </button>
                <label className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs">
                  <Upload className="w-3 h-3 text-slate-600" />
                  <span>Nhập JSON</span>
                  <input type="file" accept=".json" onChange={handleImportRepositoryJSON} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleManualSyncServer}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Đồng bộ ngay dữ liệu lên Máy chủ Render và Firestore"
                >
                  <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>Đồng Bộ Cloud</span>
                </button>
              </div>
            </div>

            {uploadStatusMsg && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${uploadSuccess ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
                <span>{uploadStatusMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm sách, khối lớp..."
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
                

                <select
                  value={bookLevelFilter}
                  onChange={(e) => setBookLevelFilter(e.target.value)}
                  className="w-full sm:w-auto bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-600 shadow-2xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả cấp học</option>
                  {['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'Khác'].map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>

                <select
                  value={bookSubjectFilter}
                  onChange={(e) => setBookSubjectFilter(e.target.value)}
                  className="w-full sm:w-auto bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-600 shadow-2xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả môn học</option>
                  {SUBJECTS_LIST.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTab('upload_new')}
                  className="px-3.5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tải Sách Mới Lên Kho</span>
                </button>
              </div>
            </div>

            {filteredUploadedBooks.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl space-y-3 bg-[#f8fafc]">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <h4 className="font-bold text-sm text-slate-700">Chưa có bộ sách nào trong kho lưu trữ</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Admin tải bộ sách PDF lên (Ví dụ: Tin học, Lớp 6). AI sẽ quét 10 trang đầu để bóc tách và lưu vĩnh viễn danh sách bài học vào Firestore dùng chung.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTab('upload_new')}
                  className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tải Sách & AI Quét Mục Lục Ngay</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {filteredUploadedBooks.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 flex flex-col gap-2.5 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              {b.subject} • {b.grade}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {b.bookSeries}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Đã lưu {b.lessons?.length || 0} bài học
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{b.title}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRescanBookTOC(b)}
                            disabled={isUploading}
                            className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Quét lại toàn bộ mục lục bằng AI"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                            <span>Quét lại Mục lục AI</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBook(b.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                            title="Xóa khỏi kho"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Lesson list preview */}
                      {b.lessons && b.lessons.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <span>📋 Danh sách bài học trích xuất vĩnh viễn ({b.lessons.length} bài)</span>
                            </p>
                            <span className="text-[10px] text-slate-500 font-medium">Dùng chung cho toàn bộ giáo viên</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1 scrollbar-thin">
                            {b.lessons.map((les, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-md bg-white text-slate-800 border border-slate-200 text-[11px] font-medium shadow-2xs leading-tight"
                              >
                                {les}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        
        {/* TAB: KHO PPCT ĐÃ TẢI LÊN */}
        {selectedTab === 'ppct_list' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
            {/* Quick Management & Seed Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Tiện ích Kho PPCT:
                </span>
                <span className="text-[11px] text-amber-900 hidden sm:inline font-medium">
                  {myUploadedPPCTs.length} bộ PPCT đã lưu trữ
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSeedFullLibrary}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                  title="Nạp 4 File Phân phối chương trình Phụ lục 03 chuẩn KNTT (Tin học 6, 7, 8, 9)"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>✨ Nạp 4 File PPCT Chuẩn (Phụ Lục 03)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportRepositoryJSON}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Tải tệp sao lưu dữ liệu kho dạng JSON về máy tính"
                >
                  <Download className="w-3 h-3 text-slate-600" />
                  <span>Xuất JSON</span>
                </button>
                <label className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs">
                  <Upload className="w-3 h-3 text-slate-600" />
                  <span>Nhập JSON</span>
                  <input type="file" accept=".json" onChange={handleImportRepositoryJSON} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={handleManualSyncServer}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Đồng bộ ngay dữ liệu lên Máy chủ Render và Firestore"
                >
                  <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>Đồng Bộ Cloud</span>
                </button>
              </div>
            </div>

            {uploadStatusMsg && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${uploadSuccess ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
                <span>{uploadStatusMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={ppctSearchQuery}
                    onChange={(e) => setPpctSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm PPCT..."
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
                

                <select
                  value={ppctLevelFilter}
                  onChange={(e) => setPpctLevelFilter(e.target.value)}
                  className="w-full sm:w-auto bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-600 shadow-2xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả cấp học</option>
                  {['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'Khác'].map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>

                <select
                  value={ppctSubjectFilter}
                  onChange={(e) => setPpctSubjectFilter(e.target.value)}
                  className="w-full sm:w-auto bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-600 shadow-2xs cursor-pointer"
                >
                  <option value="Tất cả">Tất cả môn học</option>
                  {SUBJECTS_LIST.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {userRole === 'admin' && (
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedTab('upload_ppct')}
                    className="px-3.5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>+ Tải PPCT Mới Lên Kho</span>
                  </button>
                </div>
              )}
            </div>

            {filteredUploadedPPCTs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Chưa có hoặc không tìm thấy PPCT</p>
                <p className="text-xs mb-4">Chưa có File Phân phối chương trình nào phù hợp được tìm thấy.</p>
                {userRole === 'admin' && (
                  <button
                    onClick={() => setSelectedTab('upload_ppct')}
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Tải File PPCT Lên Ngay
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredUploadedPPCTs.map((ppct) => (
                  <div key={ppct.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-amber-300 transition-colors shadow-xs group">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{ppct.title}</h4>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{ppct.subject}</span> • <span>{ppct.grade}</span> • <span>{ppct.fileSize}</span>
                          </p>
                        </div>
                      </div>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => handleDeletePPCT(ppct.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Xóa vĩnh viễn khỏi hệ thống"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="p-3 text-xs text-slate-600 space-y-2">
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Đã tải lên Firestore: <strong className="text-slate-800">{ppct.uploadedAt}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Tệp gốc: <strong className="text-slate-800 line-clamp-1">{ppct.fileName}</strong>
                      </p>
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-slate-500 italic line-clamp-2">"{ppct.summary}"</p>
                        <p className="mt-1 font-semibold text-emerald-600">Trích xuất {ppct.lessonConfigs.length} cấu trúc tiết học</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: UPLOAD PPCT (ADMIN ONLY) */}
        {selectedTab === 'upload_ppct' && (
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 bg-slate-50/50">
            {userRole !== 'admin' ? (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-10 h-10 mx-auto text-red-400 mb-2" />
                <p className="font-semibold text-slate-700">Không có quyền truy cập</p>
                <p className="text-xs">Chỉ Admin mới có quyền Tải file Phân phối chương trình lên Kho dùng chung.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 text-xs sm:text-sm">
                  <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Upload PPCT - Trích xuất Cấu trúc tự động bằng AI</p>
                    <p>Tải tệp Phân phối chương trình (Word, Excel, PDF) để hệ thống tự động quét số tiết và các yêu cầu tích hợp Năng lực số / AI. Thông tin này sẽ được dùng để tự động thiết lập số tiết khi soạn giáo án.</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{isMamNon ? "Lĩnh vực" : "Môn học"}</label>
                      <select
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        style={{
                          color: isMamNon && MAM_NON_NEW_ACTIVITIES.includes(newSubject) ? '#1d4ed8' : '#0f172a',
                        }}
                        className={`w-full text-sm border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                          isMamNon && MAM_NON_NEW_ACTIVITIES.includes(newSubject) ? 'bg-blue-50/50 text-blue-700 font-bold border-blue-300' : 'bg-slate-50'
                        }`}
                      >
                        {currentSubjectsList.map((subj) => {
                          const isNew = isMamNon && MAM_NON_NEW_ACTIVITIES.includes(subj);
                          return (
                            <option
                              key={subj}
                              value={subj}
                              style={{
                                color: isNew ? '#1d4ed8' : '#1e293b',
                                fontWeight: isNew ? 'bold' : 'normal',
                                backgroundColor: isNew ? '#eff6ff' : '#ffffff',
                              }}
                              className={isNew ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-white text-slate-800'}
                            >
                              {subj}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Khối lớp</label>
                      <select
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50"
                      >
                        {['Nhiều khối lớp (Tự động nhận diện)', 'Nhà trẻ (24-36 tháng)', 'Mẫu giáo bé (3-4 tuổi)', 'Mẫu giáo nhỡ (4-5 tuổi)', 'Mẫu giáo lớn (5-6 tuổi)', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tệp PPCT (PDF, Word, Excel)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Hỗ trợ Excel nhiều sheet, AI sẽ tự động đọc đúng môn và khối lớp để lọc.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePPCTToFirebase}
                    disabled={isUploading || !selectedFile}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isUploading || !selectedFile
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang phân tích PPCT...
                      </>
                    ) : uploadSuccess ? (
                      <>
                        <Check className="w-5 h-5" />
                        Thành công!
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        Tải Lên Kho Chung & Quét Bằng AI
                      </>
                    )}
                  </button>

                  {uploadStatusMsg && (
                    <div className={`p-3 rounded-lg text-xs font-medium border ${
                      uploadSuccess 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : isUploading 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        {isUploading ? <Sparkles className="w-4 h-4 mt-0.5 animate-pulse" /> : null}
                        <p className="leading-relaxed">{uploadStatusMsg}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TẢI SÁCH MỚI & AI QUÉT MỤC LỤC */}
        {selectedTab === 'upload_new' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0 text-xs">
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
              <UploadCloud className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-amber-950">
                  Tải Sách Giáo Khoa Lên Kho Firebase (Dùng Chung Toàn Hệ Thống)
                </h4>
                <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                  Cấu hình: <strong>Môn học</strong>, <strong>Khối lớp</strong>, <strong>Tên bộ sách</strong> và tệp PDF. AI sẽ quét 10 trang đầu để tự động bóc tách và lưu vĩnh viễn danh sách tên bài học vào Firestore.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Môn học */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">{isMamNon ? "Lĩnh vực:" : "Môn học:"}</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  style={{
                    color: isMamNon && MAM_NON_NEW_ACTIVITIES.includes(newSubject) ? '#1d4ed8' : '#0f172a',
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs ${
                    isMamNon && MAM_NON_NEW_ACTIVITIES.includes(newSubject) ? 'bg-blue-50/50 text-blue-700 font-bold border-blue-300' : 'bg-[#f8fafc] border-slate-200 text-slate-900'
                  }`}
                >
                  {currentSubjectsList.map((s) => {
                    const isNew = isMamNon && MAM_NON_NEW_ACTIVITIES.includes(s);
                    return (
                      <option
                        key={s}
                        value={s}
                        style={{
                          color: isNew ? '#1d4ed8' : '#1e293b',
                          fontWeight: isNew ? 'bold' : 'normal',
                          backgroundColor: isNew ? '#eff6ff' : '#ffffff',
                        }}
                        className={isNew ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-white text-slate-800'}
                      >
                        {s}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Khối lớp */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Khối lớp:</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                >
                  {['Nhiều khối lớp (Tự động nhận diện)', 'Nhà trẻ (24-36 tháng)', 'Mẫu giáo bé (3-4 tuổi)', 'Mẫu giáo nhỡ (4-5 tuổi)', 'Mẫu giáo lớn (5-6 tuổi)', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Bộ sách */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bộ sách:</label>
                <input
                  type="text"
                  value={newBookSeries}
                  onChange={(e) => setNewBookSeries(e.target.value)}
                  placeholder="VD: Kết nối tri thức với cuộc sống"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>
              {/* Tập sách */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tập sách:</label>
                <select
                  value={newVolume}
                  onChange={(e) => setNewVolume(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                >
                  {['Cả năm / Không phân tập', 'Tập 1', 'Tập 2'].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* File upload */}
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Tệp Sách PDF / Mục lục:</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-4 text-center bg-[#f8fafc] cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {selectedFiles && selectedFiles.length > 1 ? (
                    <div className="flex flex-col items-center justify-center gap-1 text-emerald-700 font-bold">
                      <FileText className="w-5 h-5" />
                      <span>Đã chọn {selectedFiles.length} tệp (Ví dụ: {selectedFile?.name})</span>
                    </div>
                  ) : selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold">
                      <FileText className="w-5 h-5" />
                      <span>{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-700 text-xs">Kéo thả tệp PDF vào đây hoặc bấm để chọn tệp</p>
                      <p className="text-[10px] text-slate-500">Hỗ trợ file PDF SGK, Mục lục scan hoặc Word DOCX</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {uploadStatusMsg && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium text-xs">
                {uploadStatusMsg}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTab('my_books')}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={isUploading}
                onClick={handleSaveBookToFirebase}
                className="px-5 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI đang quét 10 trang đầu & Lưu Firestore...</span>
                  </>
                ) : uploadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Đã lưu thành công!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Tải Lên & AI Quét Mục Lục (Lưu Vĩnh Viễn)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: FIREBASE CLOUD INFO */}
        {selectedTab === 'cloud_sync' && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0 text-xs">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Thông Tin Kho Dữ Liệu Firebase Chung
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã kết nối Live
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-lg bg-[#f8fafc] border border-slate-200">
                  <span className="text-slate-500 block font-medium">Kho học liệu:</span>
                  <span className="font-bold text-amber-800">
                    Kho Sách Giáo Khoa & Quản Lý Cấp Tài Khoản
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] border border-slate-200">
                  <span className="text-slate-500 block font-medium">Mục đích sử dụng:</span>
                  <span className="font-semibold text-slate-800">
                    1. Lưu trữ file SGK &nbsp;•&nbsp; 2. Quản lý & cấp tài khoản người dùng
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] border border-slate-200">
                  <span className="text-slate-500 block font-medium">Project ID:</span>
                  <span className="font-mono font-bold text-slate-800">khbd-ai</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] border border-slate-200">
                  <span className="text-slate-500 block font-medium">Storage Bucket:</span>
                  <span className="font-mono font-bold text-slate-800">khbd-ai.firebasestorage.app</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] border border-slate-200 sm:col-span-2">
                  <span className="text-slate-500 block font-medium">Firestore Database:</span>
                  <span className="font-mono font-bold text-slate-800">(default) • Cloud Firestore</span>
                </div>
              </div>
            </div>

            {/* Sync & Backup Management Center */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-700" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Trung Tâm Quản Trị & Sao Lưu Dữ Liệu (Admin Tools)
                  </h4>
                </div>
                <span className="text-[11px] text-amber-800 font-semibold">
                  Tự động đồng bộ Đa Tầng (Firestore + Máy chủ Render + Local)
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Sử dụng các công cụ bên dưới để nạp dữ liệu sách chuẩn, xuất tệp sao lưu JSON để lưu trữ ngoại tuyến hoặc khôi phục dữ liệu lên bất kỳ máy chủ nào.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSeedFullLibrary}
                  disabled={isUploading}
                  className="p-3 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-left transition-all shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-600 group-hover:rotate-12 transition-transform" />
                    <span>Nạp Kho Mẫu Chuẩn (1-Click)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Nạp trọn bộ SGK và PPCT đầy đủ tất cả các môn từ Lớp 1 - 12 vào Firestore & Máy chủ.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleManualSyncServer}
                  disabled={isUploading}
                  className="p-3 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-left transition-all shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                    <RefreshCw className={`w-4 h-4 text-amber-600 ${isUploading ? 'animate-spin' : ''}`} />
                    <span>Đồng Bộ Ngay (Firestore + Máy chủ)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ghi đè và đồng bộ toàn bộ SGK, PPCT và tài khoản hiện tại vào Máy chủ Render.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleExportRepositoryJSON}
                  className="p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-left transition-all shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                    <Download className="w-4 h-4 text-slate-600 group-hover:-translate-y-0.5 transition-transform" />
                    <span>Xuất Tệp Sao Lưu (.JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tải về máy tính một tệp JSON chứa toàn bộ dữ liệu sách, PPCT và tài khoản.
                  </p>
                </button>

                <label className="p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-left transition-all shadow-2xs cursor-pointer group block">
                  <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                    <Upload className="w-4 h-4 text-slate-600 group-hover:-translate-y-0.5 transition-transform" />
                    <span>Nhập Dữ Liệu Khôi Phục (.JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tải tệp JSON sao lưu trước đó lên để phục hồi kho học liệu và tài khoản.
                  </p>
                  <input type="file" accept=".json" onChange={handleImportRepositoryJSON} className="hidden" />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Cấu trúc Firestore Collections</span>
                <span className="text-emerald-400">● Live Synchronization</span>
              </div>
              <pre className="text-emerald-300">
{`Firestore Collections:
├── /user_accounts/{userId}
│   ├── fullName: "Thầy Nguyễn Văn An"
│   ├── username: "nguyenvanan.toan@edu.vn"
│   ├── schoolName: "THPT Chuyên Châu Văn Liêm"
│   ├── role: "teacher" | "admin"
│   ├── status: "active" | "locked"
│   └── accessCode: "GVToan@2025"
└── /textbooks/{bookId}
    ├── title, grade, subject, bookSeries
    └── lessons: ["Bài 1...", "Bài 2..."] (Dùng chung cho toàn hệ thống)`}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
