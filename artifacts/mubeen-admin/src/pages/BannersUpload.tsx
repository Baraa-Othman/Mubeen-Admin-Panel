import { useState, useRef, useCallback } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ImagePlus,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Tag,
  DollarSign,
} from "lucide-react";

const CLOUDINARY_CLOUD = "dqmoclpsi";
const CLOUDINARY_PRESET = "b9vosg3g";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

export default function BannersUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const reset = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setPrice("");
    setResult(null);
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

      const cloudRes = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      if (!cloudRes.ok) {
        throw new Error("فشل رفع الصورة إلى Cloudinary");
      }

      const cloudData = await cloudRes.json();
      const url_path: string = cloudData.secure_url;

      await addDoc(collection(db, "banners"), {
        title: title.trim(),
        price: parseInt(price, 10),
        url_path,
      });

      setResult({ success: true, message: `تمت إضافة الخلفية "${title.trim()}" بنجاح.` });
      reset();
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || "حدث خطأ أثناء الرفع. يرجى المحاولة مجدداً.",
      });
    } finally {
      setUploading(false);
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

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
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
              <img
                src={preview}
                alt="معاينة"
                className="w-full max-h-64 object-contain bg-gray-50"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); reset(); }}
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
              <p className="text-gray-600 font-medium mb-1">
                اسحب صورة الخلفية وأفلتها هنا أو انقر للاختيار
              </p>
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
              placeholder='مثال: كوكبات'
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
            <>
              <Loader className="h-5 w-5 animate-spin" />
              جارٍ الرفع...
            </>
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              إضافة الخلفية
            </>
          )}
        </button>
      </form>
    </div>
  );
}
