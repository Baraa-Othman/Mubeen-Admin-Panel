import { useState, useRef, useCallback } from "react";
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Upload,
  FileJson,
  CheckCircle,
  AlertCircle,
  X,
  Loader,
} from "lucide-react";

interface MCQItem {
  question_id: string;
  question: string;
  answer: string;
  choices: string[];
  explanation: string;
  type?: "MCQ";
}

interface EssayItem {
  question_id: string;
  question: string;
  perfect_answer: string;
  category: string;
  type: "essay";
}

type QuestionItem = MCQItem | EssayItem;

interface UploadResult {
  success: boolean;
  collectionName: string;
  count: number;
  message: string;
}

export default function BulkUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<QuestionItem[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [collectionType, setCollectionType] = useState<"MCQ" | "essay">("MCQ");
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((f: File) => {
    setFile(f);
    setParsed(null);
    setParseError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
          setParseError("الملف يجب أن يحتوي على مصفوفة JSON.");
          return;
        }
        setParsed(data as QuestionItem[]);
      } catch {
        setParseError("خطأ في تحليل ملف JSON. تأكد من صحة التنسيق.");
      }
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && f.name.endsWith(".json")) {
        processFile(f);
      } else {
        setParseError("يُسمح فقط بملفات JSON.");
      }
    },
    [processFile]
  );

  const handleUpload = async () => {
    if (!parsed || parsed.length === 0) return;
    setUploading(true);
    setResult(null);

    try {
      const collName =
        collectionType === "MCQ" ? "MCQ" : "essay_questions";

      const BATCH_SIZE = 500;
      let uploaded = 0;

      for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = parsed.slice(i, i + BATCH_SIZE);
        chunk.forEach((item) => {
          const { question_id, ...data } = item as any;
          const docId = question_id != null ? String(question_id) : null;
          const ref = docId ? doc(db, collName, docId) : doc(collection(db, collName));
          batch.set(ref, data);
        });
        await batch.commit();
        uploaded += chunk.length;
      }

      setResult({
        success: true,
        collectionName: collName,
        count: uploaded,
        message: `تم رفع ${uploaded} سؤال بنجاح إلى مجموعة "${collName}".`,
      });
      setParsed(null);
      setFile(null);
    } catch (err) {
      setResult({
        success: false,
        collectionName: collectionType === "MCQ" ? "MCQ" : "essay_questions",
        count: 0,
        message: "حدث خطأ أثناء الرفع. يرجى المحاولة مجدداً.",
      });
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParsed(null);
    setParseError(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">رفع الأسئلة بالجملة</h1>
        <p className="text-gray-500 text-sm mt-1">
          ارفع ملف JSON يحتوي على مصفوفة من الأسئلة لإضافتها دفعة واحدة
        </p>
      </div>

      <div className="max-w-2xl space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-700 mb-4">
            نوع الأسئلة
          </h2>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="MCQ"
                checked={collectionType === "MCQ"}
                onChange={() => setCollectionType("MCQ")}
                className="accent-[#670320]"
              />
              <span className="text-sm font-medium text-gray-700">
                اختيار من متعدد (MCQ)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="essay"
                checked={collectionType === "essay"}
                onChange={() => setCollectionType("essay")}
                className="accent-[#670320]"
              />
              <span className="text-sm font-medium text-gray-700">مقالية</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-700 mb-4">
            تنسيق الملف المطلوب
          </h2>
          <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs text-gray-600 leading-relaxed overflow-x-auto">
            {collectionType === "MCQ" ? (
              <pre>{`[
  {
    "question_id": "q_76",
    "question": "نص السؤال",
    "answer": "الإجابة الصحيحة",
    "choices": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
    "explanation": "شرح الإجابة"
  }
]`}</pre>
            ) : (
              <pre>{`[
  {
    "question_id": "q_76",
    "question": "نص السؤال",
    "perfect_answer": "الإجابة النموذجية",
    "category": "التصنيف"
  }
]`}</pre>
            )}
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-[#670320] bg-[#670320]/5"
              : "border-gray-200 bg-white hover:border-[#670320]/40 hover:bg-gray-50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
            }}
          />
          <FileJson className="h-12 w-12 text-[#670320]/30 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">
            اسحب ملف JSON وأفلته هنا أو انقر للاختيار
          </p>
          <p className="text-gray-400 text-sm">يُدعم: .json فقط</p>
        </div>

        {parseError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{parseError}</span>
          </div>
        )}

        {file && parsed && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#670320]/10 rounded-xl flex items-center justify-center">
                  <FileJson className="h-5 w-5 text-[#670320]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {file.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {parsed.length} سؤال جاهز للرفع
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#670320] text-white font-bold rounded-xl hover:bg-[#8a0428] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {uploading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  جارٍ الرفع...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  رفع {parsed.length} سؤال
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border ${
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
            <p className="text-sm">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
