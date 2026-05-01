import { useState, useEffect } from "react";
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
  Award,
  CheckCircle,
  AlertCircle,
  Loader,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

interface TitleDoc {
  id: string;
  title: string;
  price: number;
}

export default function TitlesManager() {
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<{ success: boolean; message: string } | null>(null);

  const [titles, setTitles] = useState<TitleDoc[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTitles = async () => {
    setLoadingTitles(true);
    try {
      const snap = await getDocs(collection(db, "titles"));
      const data: TitleDoc[] = snap.docs.map((d) => ({
        id: d.id,
        title: d.data().title || "",
        price: d.data().price ?? 0,
      }));
      data.sort((a, b) => a.price - b.price);
      setTitles(data);
    } finally {
      setLoadingTitles(false);
    }
  };

  useEffect(() => { fetchTitles(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;
    setAdding(true);
    setAddResult(null);
    try {
      const saved = newTitle.trim();
      const priceInt = parseInt(newPrice, 10);
      const ref = await addDoc(collection(db, "titles"), {
        title: saved,
        price: priceInt,
      });
      setTitles((prev) =>
        [...prev, { id: ref.id, title: saved, price: priceInt }].sort(
          (a, b) => a.price - b.price
        )
      );
      setNewTitle("");
      setNewPrice("");
      setAddResult({ success: true, message: `تمت إضافة اللقب "${saved}" بنجاح.` });
    } catch {
      setAddResult({ success: false, message: "حدث خطأ أثناء الإضافة. يرجى المحاولة مجدداً." });
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (t: TitleDoc) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditPrice(String(t.price));
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
      await updateDoc(doc(db, "titles", id), {
        title: editTitle.trim(),
        price: priceInt,
      });
      setTitles((prev) =>
        prev
          .map((t) =>
            t.id === id ? { ...t, title: editTitle.trim(), price: priceInt } : t
          )
          .sort((a, b) => a.price - b.price)
      );
      cancelEdit();
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف اللقب "${title}"؟`)) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "titles", id));
      setTitles((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إضافة ألقاب</h1>
        <p className="text-gray-500 text-sm mt-1">
          أضف ألقاباً جديدة وعدّل الألقاب الموجودة في المتجر
        </p>
      </div>

      <div className="max-w-xl space-y-5">
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-gray-700">لقب جديد</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              اسم اللقب
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder='مثال: حليف العدالة'
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320] transition"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              السعر (نقاط)
            </label>
            <input
              type="number"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="500"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320] transition"
              dir="ltr"
            />
          </div>

          {addResult && (
            <div
              className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                addResult.success
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {addResult.success ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              )}
              <p>{addResult.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!newTitle.trim() || !newPrice || adding}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#670320] text-white font-bold rounded-xl hover:bg-[#8a0428] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm"
          >
            {adding ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                جارٍ الإضافة...
              </>
            ) : (
              <>
                <Award className="h-4 w-4" />
                إضافة اللقب
              </>
            )}
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-700">الألقاب المتاحة</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
              {titles.length} لقب
            </span>
          </div>

          {loadingTitles ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : titles.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              لا توجد ألقاب بعد
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {titles.map((t) =>
                editingId === t.id ? (
                  <li key={t.id} className="px-5 py-3 bg-[#670320]/3">
                    <div className="flex items-center gap-2">
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
                        onClick={() => saveEdit(t.id)}
                        disabled={savingId === t.id || !editTitle.trim() || !editPrice}
                        className="p-2 bg-[#670320] text-white rounded-lg hover:bg-[#8a0428] disabled:opacity-50 transition"
                      >
                        {savingId === t.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
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
                  <li
                    key={t.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#670320]/10 flex items-center justify-center flex-shrink-0">
                        <Award className="h-4 w-4 text-[#670320]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {t.title}
                        </p>
                        <p className="text-xs text-[#c2a05e] font-medium">
                          {t.price.toLocaleString("ar-SA")} نقطة
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => startEdit(t)}
                        className="p-1.5 text-gray-400 hover:text-[#670320] rounded-lg hover:bg-[#670320]/10 transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id, t.title)}
                        disabled={deletingId === t.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {deletingId === t.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
