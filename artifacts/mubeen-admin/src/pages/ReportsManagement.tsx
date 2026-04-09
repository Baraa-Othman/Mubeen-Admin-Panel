import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Flag,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface UserInfo {
  email: string;
  displayName: string;
  points: number;
}

interface QuestionInfo {
  question_text: string;
  type: string;
}

interface Report {
  id: string;
  report_title: string;
  report_text: string;
  status: "pending" | "resolved";
  created_at: Timestamp | null;
  reporting_user: UserInfo;
  reported_user: UserInfo;
  reported_question: QuestionInfo;
}

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "reports"));
      const data: Report[] = snap.docs.map((d) => ({
        id: d.id,
        report_title: d.data().report_title || "",
        report_text: d.data().report_text || "",
        status: d.data().status || "pending",
        created_at: d.data().created_at || null,
        reporting_user: d.data().reporting_user || {
          email: "",
          displayName: "",
          points: 0,
        },
        reported_user: d.data().reported_user || {
          email: "",
          displayName: "",
          points: 0,
        },
        reported_question: d.data().reported_question || {
          question_text: "",
          type: "",
        },
      }));

      data.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return 0;
      });

      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const markResolved = async (reportId: string) => {
    setResolvingId(reportId);
    try {
      await updateDoc(doc(db, "reports", reportId), { status: "resolved" });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r))
      );
    } catch (err) {
      console.error("Error resolving report:", err);
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (ts: Timestamp | null) => {
    if (!ts) return "—";
    try {
      return ts.toDate().toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const filtered = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة التقارير</h1>
        <p className="text-gray-500 text-sm mt-1">مراجعة ومعالجة تقارير المستخدمين</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: "all", label: `الكل (${reports.length})` },
          { key: "pending", label: `معلّقة (${pendingCount})` },
          { key: "resolved", label: `محلولة (${resolvedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === tab.key
                ? "bg-[#670320] text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#670320]/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse"
            >
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            لا توجد تقارير في هذه الفئة
          </div>
        ) : (
          filtered.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`mt-0.5 flex-shrink-0 p-2 rounded-lg ${
                        report.status === "pending"
                          ? "bg-orange-100"
                          : "bg-green-100"
                      }`}
                    >
                      {report.status === "pending" ? (
                        <Clock className="h-4 w-4 text-orange-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm">
                          {report.report_title || "تقرير بدون عنوان"}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {report.status === "pending" ? "معلّق" : "محلول"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        {formatDate(report.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === report.id ? null : report.id
                        )
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                    >
                      {expandedId === report.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {report.status === "pending" && (
                      <button
                        onClick={() => markResolved(report.id)}
                        disabled={resolvingId === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-200 disabled:opacity-50 transition"
                      >
                        {resolvingId === report.id ? (
                          <span className="animate-spin rounded-full h-3 w-3 border-2 border-green-700 border-t-transparent" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        تم الحل
                      </button>
                    )}
                  </div>
                </div>

                {expandedId === report.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {report.report_text && (
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-1">
                            نص التقرير
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {report.report_text}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-[#670320]" />
                          <p className="text-xs font-semibold text-gray-500">
                            المُبلِّغ
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                          {report.reporting_user.displayName || "—"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {report.reporting_user.email}
                        </p>
                        <p className="text-xs text-[#c2a05e] mt-1">
                          {report.reporting_user.points?.toLocaleString("ar-SA")} نقطة
                        </p>
                      </div>

                      <div className="bg-red-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="h-4 w-4 text-red-500" />
                          <p className="text-xs font-semibold text-gray-500">
                            المُبلَّغ عنه
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                          {report.reported_user.displayName || "—"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {report.reported_user.email}
                        </p>
                        <p className="text-xs text-[#c2a05e] mt-1">
                          {report.reported_user.points?.toLocaleString("ar-SA")} نقطة
                        </p>
                      </div>
                    </div>

                    {report.reported_question?.question_text && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          السؤال المُبلَّغ عنه
                          {report.reported_question.type && (
                            <span className="mr-2 px-1.5 py-0.5 bg-[#c2a05e]/20 text-[#a8833a] rounded text-xs">
                              {report.reported_question.type}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {report.reported_question.question_text}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
