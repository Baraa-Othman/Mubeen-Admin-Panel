import { useState, useRef, useCallback, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ImagePlus,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Tag,
  DollarSign,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

const CLOUDINARY_CLOUD = "dqmoclpsi";
const CLOUDINARY_PRESET = "b9vosg3g";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

interface BannerDoc {
  id: string;
  title: string;
  price: number;
  url_path: string;
}

export default function BannersUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [banners, setBanners] = useState<BannerDoc[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const snap = await getDocs(collection(db, "banners"));
      const data: BannerDoc[] = snap.docs.map((d) => ({
        id: d.id,
        title: d.data().title || "",
        price: d.data().price ?? 0,
        url_path: d.data().url_path || "",
      }));
      data.sort((a, b) => a.price - b.price);
      setBanners(data);
    } finally {
      setLoadingBanners(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const pickFile = useCallback((f: File) => {
    if (!f.type.match(/image\/(png|jpeg|jpg|webp)/)) {
      setResult({ success: false, message: "يُسمح فقط بملفات PNG أو JPEG." });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) pickFile(f);
    },
    [pickFile]
  );

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setPrice("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !price) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_PRESET);

      const cloudRes = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
      if (!cloudRes.ok) throw new Error("فشل رفع الصورة إلى Cloudinary");

      const cloudData = await cloudRes.json();
      const url_path: string = cloudData.secure_url;
      const priceInt = parseInt(price, 10);
      const addedTitle = title.trim();

      const ref = await addDoc(collection(db, "banners"), {
        title: addedTitle,
        price: priceInt,
        url_path,
      });

      setBanners((prev) =>
        [...prev, { id: ref.id, title: addedTitle, price: priceInt, url_path }].sort(
          (a, b) => a.price - b.price
        )
      );

      resetForm();
      setResult({ success: true, message: `تمت إضافة الخلفية "${addedTitle}" بنجاح.` });
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || "حدث خطأ أثناء الرفع. يرجى المحاولة مجدداً.",
      });
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (b: BannerDoc) => {
    setEditingId(b.id);
    setEditTitle(b.title);
    setEditPrice(String(b.price));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditPrice("");
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim() || !editPrice) return;
    setSavingId(id);
    try {
      const priceInt = parseInt(editPrice, 10);
      await updateDoc(doc(db, "banners", id), {
        title: editTitle.trim(),
        price: priceInt,
      });
      setBanners((prev) =>
        prev
          .map((b) => (b.id === id ? { ...b, title: editTitle.trim(), price: priceInt } : b))
          .sort((a, b) => a.price - b.price)
      );
      cancelEdit();
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف الخلفية "${title}"؟`)) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "banners", id));
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const isValid = file && title.trim() && price && parseInt(price, 10) >= 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إضافة خلفيات</h1>
        <p className="text-gray-500 text-sm mt-1">
          ارفع صورة خلفية وحدد اسمها وسعرها لإضافتها إلى المتجر
        </p>
      </div>

      <div className="max-w-xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden ${
              dragOver
                ? "border-[#670320] bg-[#670320]/5"
                : preview
                ? "border-[#c2a05e] bg-white"
                : "border-gray-200 bg-white hover:border-[#670320]/40 hover:bg-gray-50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !preview && fileRef.current?.click()}
            style={{ minHeight: 200 }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
            />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="معاينة" className="w-full max-h-64 object-contain bg-gray-50" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); resetForm(); }}
                  className="absolute top-2 left-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
                <div className="absolute bottom-2 right-2 bg-white/90 text-xs text-gray-600 px-2 py-1 rounded-lg shadow">
                  {file?.name}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <ImagePlus className="h-12 w-12 text-[#670320]/30 mb-3" />
                <p className="text-gray-600 font-medium mb-1">اسحب صورة الخلفية وأفلتها هنا أو انقر للاختيار</p>
                <p className="text-gray-400 text-sm">PNG، JPEG، WebP</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-[#670320]" />
                  اسم الخلفية
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: كوكبات"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320] transition"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-[#c2a05e]" />
                  السعر (نقاط)
                </span>
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320] transition"
                dir="ltr"
              />
            </div>
          </div>

          {result && (
            <div
              className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
                result.success
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <p>{result.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || uploading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#670320] text-white font-bold rounded-xl hover:bg-[#8a0428] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {uploading ? (
              <><Loader className="h-5 w-5 animate-spin" />جارٍ الرفع...</>
            ) : (
              <><ImagePlus className="h-5 w-5" />إضافة الخلفية</>
            )}
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-700">الخلفيات المتاحة</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
              {banners.length} خلفية
            </span>
          </div>

          {loadingBanners ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">لا توجد خلفيات بعد</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {banners.map((b) =>
                editingId === b.id ? (
                  <li key={b.id} className="px-4 py-3 bg-[#670320]/3">
                    <div className="flex items-center gap-2">
                      <img
                        src={b.url_path}
                        alt={b.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                      />
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[#670320]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320]"
                        dir="rtl"
                        autoFocus
                      />
                      <input
                        type="number"
                        min="0"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-24 px-3 py-2 rounded-lg border border-[#670320]/30 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320]"
                        dir="ltr"
                      />
                      <button
                        onClick={() => saveEdit(b.id)}
                        disabled={savingId === b.id || !editTitle.trim() || !editPrice}
                        className="p-2 bg-[#670320] text-white rounded-lg hover:bg-[#8a0428] disabled:opacity-50 transition"
                      >
                        {savingId === b.id ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ) : (
                  <li key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                    <img
                      src={b.url_path}
                      alt={b.title}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-200 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{b.title}</p>
                      <p className="text-xs text-[#c2a05e] font-medium mt-0.5">
                        {b.price.toLocaleString("ar-SA")} نقطة
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => startEdit(b)}
                        className="p-1.5 text-gray-400 hover:text-[#670320] rounded-lg hover:bg-[#670320]/10 transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.title)}
                        disabled={deletingId === b.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {deletingId === b.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
