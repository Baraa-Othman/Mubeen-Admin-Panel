import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocation } from "wouter";
import {
  Flag,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  ExternalLink,
} from "lucide-react";

interface UserInfo {
  email: string;
  displayName: string;
  points: number;
  profileImage?: string;
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
  report_type: string;
  created_at: Timestamp | null;
  reporting_user: UserInfo;
  reported_user: UserInfo;
  reported_question: QuestionInfo;
}

function UserCard({
  user,
  label,
  variant,
  onNavigate,
}: {
  user: UserInfo;
  label: string;
  variant: "reporter" | "reported";
  onNavigate?: () => void;
}) {
  const isReported = variant === "reported";

  return (
    <div
      className={`rounded-xl p-4 ${isReported ? "bg-red-50 border border-red-100" : "bg-gray-50 border border-gray-100"}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isReported ? (
            <Flag className="h-4 w-4 text-red-500" />
          ) : (
            <User className="h-4 w-4 text-[#670320]" />
          )}
          <p className="text-xs font-semibold text-gray-500">{label}</p>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#670320] text-white text-xs font-semibold rounded-lg hover:bg-[#8a0428] transition shadow-sm"
          >
            <ExternalLink className="h-3 w-3" />
            عرض المستخدم
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.displayName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {user.displayName || "—"}
          </p>
          <p className="text-xs text-gray-500 font-mono truncate">{user.email}</p>
          {user.points != null && (
            <p className="text-xs text-[#c2a05e] font-medium mt-0.5">
              {user.points.toLocaleString("ar-SA")} نقطة
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const reportTypeLabels: Record<string, string> = {
  question: "بلاغ عن سؤال",
  user: "بلاغ عن مستخدم",
  general: "بلاغ عام",
};

export default function ReportsManagement() {
  const [_location, navigate] = useLocation();
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
        report_type: d.data().report_type || "",
        created_at: d.data().created_at || null,
        reporting_user: d.data().reporting_user || {
          email: "",
          displayName: "",
          points: 0,
          profileImage: "",
        },
        reported_user: d.data().reported_user || {
          email: "",
          displayName: "",
          points: 0,
          profileImage: "",
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
        <h1 className="text-2xl font-bold text-gray-800">إدارة البلاغات</h1>
        <p className="text-gray-500 text-sm mt-1">
          مراجعة ومعالجة بلاغات المستخدمين
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: "all", label: `الكل (${reports.length})` },
          { key: "pending", label: `بانتظار المراجعة (${pendingCount})` },
          { key: "resolved", label: `تمت المعالجة (${resolvedCount})` },
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
            لا توجد بلاغات في هذه الفئة
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
                          : "bg-gray-100"
                      }`}
                    >
                      {report.status === "pending" ? (
                        <Clock className="h-4 w-4 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm">
                          {report.report_title || "بلاغ بدون عنوان"}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {report.status === "pending"
                            ? "بانتظار المراجعة"
                            : "تمت المعالجة"}
                        </span>
                        {report.report_type && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#670320]/10 text-[#670320]">
                            {reportTypeLabels[report.report_type] ||
                              report.report_type}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">
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

                    {report.status === "pending" ? (
                      <button
                        onClick={() => markResolved(report.id)}
                        disabled={resolvingId === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#670320] text-white text-xs font-semibold rounded-lg hover:bg-[#8a0428] disabled:opacity-50 transition shadow-sm"
                      >
                        {resolvingId === report.id ? (
                          <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        تعيين كمُعالَج
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-400 text-xs font-medium rounded-lg border border-gray-200">
                        <CheckCircle className="h-3.5 w-3.5" />
                        مُعالَج
                      </span>
                    )}
                  </div>
                </div>

                {expandedId === report.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {report.report_text && (
                      <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-1">
                            نص البلاغ
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {report.report_text}
                          </p>
                        </div>
                      </div>
                    )}

                    {report.report_type === "general" ? (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-blue-500" />
                          <p className="text-xs font-semibold text-gray-500">
                            بلاغ عام
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          هذا البلاغ ذو طابع عام ولا يتعلق بمستخدم أو سؤال
                          محدد. يرجى الاطلاع على نص البلاغ أعلاه واتخاذ
                          الإجراء المناسب.
                        </p>
                        <div className="mt-3">
                          <UserCard
                            user={report.reporting_user}
                            label="المُبلِّغ"
                            variant="reporter"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`grid gap-3 ${
                          report.report_type === "question" ||
                          report.report_type === "user"
                            ? "grid-cols-1"
                            : "grid-cols-1 sm:grid-cols-2"
                        }`}
                      >
                        <UserCard
                          user={report.reporting_user}
                          label="المُبلِّغ"
                          variant="reporter"
                        />

                        {report.report_type !== "question" &&
                          (report.reported_user?.email ||
                            report.reported_user?.displayName) && (
                            <UserCard
                              user={report.reported_user}
                              label="المُبلَّغ عنه"
                              variant="reported"
                              onNavigate={
                                report.reported_user?.email
                                  ? () =>
                                      navigate(
                                        `/users?search=${encodeURIComponent(report.reported_user.email)}`
                                      )
                                  : undefined
                              }
                            />
                          )}
                      </div>
                    )}

                    {report.report_type !== "user" &&
                      report.report_type !== "general" &&
                      report.reported_question?.question_text && (
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-amber-600" />
                              <p className="text-xs font-semibold text-gray-500">
                                السؤال المُبلَّغ عنه
                                {report.reported_question.type && (
                                  <span className="mr-2 px-1.5 py-0.5 bg-[#c2a05e]/20 text-[#a8833a] rounded text-xs">
                                    {report.reported_question.type}
                                  </span>
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const q = report.reported_question;
                                const tab = q.type === "essay" ? "essay" : "MCQ";
                                navigate(
                                  `/questions?search=${encodeURIComponent(q.question_text.slice(0, 60))}&tab=${tab}`
                                );
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#670320] text-white text-xs font-semibold rounded-lg hover:bg-[#8a0428] transition shadow-sm flex-shrink-0"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              تعديل السؤال
                            </button>
                          </div>
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
