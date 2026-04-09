import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Pencil,
  Trash2,
  X,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface MCQQuestion {
  id: string;
  type: "MCQ";
  question: string;
  answer: string;
  choices: string[];
  explanation: string;
}

interface EssayQuestion {
  id: string;
  type: "essay";
  question: string;
  perfect_answer: string;
  category: string;
}

type Question = MCQQuestion | EssayQuestion;

interface EditData {
  question: string;
  answer?: string;
  choices?: string[];
  explanation?: string;
  perfect_answer?: string;
  category?: string;
}

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"MCQ" | "essay">("MCQ");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData>({} as EditData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const [mcqSnap, essaySnap] = await Promise.all([
        getDocs(collection(db, "MCQ")),
        getDocs(collection(db, "essay_questions")),
      ]);

      const mcqList: MCQQuestion[] = mcqSnap.docs.map((d) => ({
        id: d.id,
        type: "MCQ",
        question: d.data().question || "",
        answer: d.data().answer || "",
        choices: d.data().choices || [],
        explanation: d.data().explanation || "",
      }));

      const essayList: EssayQuestion[] = essaySnap.docs.map((d) => ({
        id: d.id,
        type: "essay",
        question: d.data().question || "",
        perfect_answer: d.data().perfect_answer || "",
        category: d.data().category || "",
      }));

      setQuestions([...mcqList, ...essayList]);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    if (q.type === "MCQ") {
      setEditData({
        question: q.question,
        answer: q.answer,
        choices: [...q.choices],
        explanation: q.explanation,
      });
    } else {
      setEditData({
        question: q.question,
        perfect_answer: q.perfect_answer,
        category: q.category,
      });
    }
  };

  const saveEdit = async (q: Question) => {
    setSaving(true);
    try {
      const collName = q.type === "MCQ" ? "MCQ" : "essay_questions";
      await updateDoc(doc(db, collName, q.id), editData);
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id ? ({ ...item, ...editData } as Question) : item
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: Question) => {
    const collName = q.type === "MCQ" ? "MCQ" : "essay_questions";
    try {
      await deleteDoc(doc(db, collName, q.id));
      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const displayed = questions.filter((q) => q.type === activeTab);

  const currentChoices = (editData.choices || []).filter((c) => c.trim() !== "");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الأسئلة</h1>
        <p className="text-gray-500 text-sm mt-1">تعديل وحذف الأسئلة الموجودة</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("MCQ")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "MCQ"
              ? "bg-[#670320] text-white shadow"
              : "bg-white text-gray-600 border border-gray-200 hover:border-[#670320]/30"
          }`}
        >
          اختيار من متعدد ({questions.filter((q) => q.type === "MCQ").length})
        </button>
        <button
          onClick={() => setActiveTab("essay")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "essay"
              ? "bg-[#670320] text-white shadow"
              : "bg-white text-gray-600 border border-gray-200 hover:border-[#670320]/30"
          }`}
        >
          مقالية ({questions.filter((q) => q.type === "essay").length})
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse"
            >
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            لا توجد أسئلة في هذه الفئة
          </div>
        ) : (
          displayed.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {editingId === q.id ? (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      السؤال
                    </label>
                    <textarea
                      value={editData.question}
                      onChange={(e) =>
                        setEditData((d) => ({ ...d, question: e.target.value }))
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320] resize-none"
                      rows={3}
                    />
                  </div>

                  {q.type === "MCQ" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          الخيارات (كل خيار في سطر)
                        </label>
                        <textarea
                          value={(editData.choices || []).join("\n")}
                          onChange={(e) =>
                            setEditData((d) => ({
                              ...d,
                              choices: e.target.value.split("\n"),
                              answer:
                                d.answer &&
                                !e.target.value
                                  .split("\n")
                                  .filter((c) => c.trim())
                                  .includes(d.answer)
                                  ? ""
                                  : d.answer,
                            }))
                          }
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320] resize-none"
                          rows={4}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          أضف أو عدّل الخيارات أولاً، ثم اختر الإجابة الصحيحة من القائمة أدناه
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          الإجابة الصحيحة
                        </label>
                        {currentChoices.length > 0 ? (
                          <div className="space-y-2">
                            {currentChoices.map((choice, i) => (
                              <label
                                key={i}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  editData.answer === choice
                                    ? "border-[#670320] bg-[#670320]/5"
                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    editData.answer === choice
                                      ? "border-[#670320] bg-[#670320]"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {editData.answer === choice && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                                <input
                                  type="radio"
                                  name={`answer-${q.id}`}
                                  value={choice}
                                  checked={editData.answer === choice}
                                  onChange={() =>
                                    setEditData((d) => ({ ...d, answer: choice }))
                                  }
                                  className="sr-only"
                                />
                                <span
                                  className={`text-sm ${
                                    editData.answer === choice
                                      ? "font-semibold text-[#670320]"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {choice}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                            أضف الخيارات أولاً لتتمكن من اختيار الإجابة الصحيحة
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          التفسير
                        </label>
                        <textarea
                          value={editData.explanation || ""}
                          onChange={(e) =>
                            setEditData((d) => ({
                              ...d,
                              explanation: e.target.value,
                            }))
                          }
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320] resize-none"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {q.type === "essay" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          الإجابة النموذجية
                        </label>
                        <textarea
                          value={editData.perfect_answer || ""}
                          onChange={(e) =>
                            setEditData((d) => ({
                              ...d,
                              perfect_answer: e.target.value,
                            }))
                          }
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320] resize-none"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          التصنيف
                        </label>
                        <input
                          value={editData.category || ""}
                          onChange={(e) =>
                            setEditData((d) => ({
                              ...d,
                              category: e.target.value,
                            }))
                          }
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320]"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => saveEdit(q)}
                      disabled={saving || (q.type === "MCQ" && !editData.answer)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#670320] text-white text-sm font-semibold rounded-lg hover:bg-[#8a0428] disabled:opacity-50 transition"
                      title={q.type === "MCQ" && !editData.answer ? "اختر الإجابة الصحيحة أولاً" : ""}
                    >
                      {saving ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      حفظ
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
                    >
                      <X className="h-4 w-4" />
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium leading-relaxed">
                        {q.question}
                      </p>
                      {q.type === "MCQ" && (
                        <p className="text-xs text-[#670320] mt-1 font-medium">
                          ✓ {q.answer}
                        </p>
                      )}
                      {q.type === "essay" && q.category && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#c2a05e]/10 text-[#a8833a] text-xs rounded-full font-medium">
                          {q.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === q.id ? null : q.id)
                        }
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                      >
                        {expandedId === q.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(q)}
                        className="p-2 text-[#670320]/60 hover:text-[#670320] rounded-lg hover:bg-[#670320]/5 transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {deleteConfirm === q.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(q)}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                          >
                            تأكيد
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(q.id)}
                          className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedId === q.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      {q.type === "MCQ" && (
                        <>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">
                              الخيارات
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {q.choices.map((c, i) => (
                                <span
                                  key={i}
                                  className={`px-2 py-1 rounded-lg text-xs ${
                                    c === q.answer
                                      ? "bg-[#670320]/10 text-[#670320] font-semibold ring-1 ring-[#670320]/30"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {c === q.answer ? `✓ ${c}` : c}
                                </span>
                              ))}
                            </div>
                          </div>
                          {q.explanation && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">
                                التفسير
                              </p>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      {q.type === "essay" && q.perfect_answer && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-1">
                            الإجابة النموذجية
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {q.perfect_answer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
