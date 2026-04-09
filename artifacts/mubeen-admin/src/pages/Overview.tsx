import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, HelpCircle, Flag, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalMCQ: number;
  totalEssay: number;
  pendingReports: number;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalMCQ: 0,
    totalEssay: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, mcqSnap, essaySnap, pendingSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "MCQ")),
          getDocs(collection(db, "essay_questions")),
          getDocs(query(collection(db, "reports"), where("status", "==", "pending"))),
        ]);

        setStats({
          totalUsers: usersSnap.size,
          totalMCQ: mcqSnap.size,
          totalEssay: essaySnap.size,
          pendingReports: pendingSnap.size,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      label: "إجمالي المستخدمين",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-[#670320]",
      light: "bg-red-50",
      textColor: "text-[#670320]",
    },
    {
      label: "أسئلة الاختيار من متعدد",
      value: stats.totalMCQ,
      icon: HelpCircle,
      color: "bg-[#c2a05e]",
      light: "bg-amber-50",
      textColor: "text-[#a8833a]",
    },
    {
      label: "أسئلة المقالة",
      value: stats.totalEssay,
      icon: TrendingUp,
      color: "bg-gray-700",
      light: "bg-gray-50",
      textColor: "text-gray-700",
    },
    {
      label: "البلاغات المعلّقة",
      value: stats.pendingReports,
      icon: Flag,
      color: "bg-orange-600",
      light: "bg-orange-50",
      textColor: "text-orange-700",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          لوحة التحكم الرئيسية
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          نظرة عامة على إحصاءات التطبيق
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-100 animate-pulse rounded-lg" />
                ) : (
                  <p className={`text-3xl font-bold ${card.textColor}`}>
                    {card.value.toLocaleString("ar-SA")}
                  </p>
                )}
              </div>
              <div className={`${card.light} p-3 rounded-xl`}>
                <card.icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          مرحباً بك في لوحة تحكم مُبين
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          استخدم القائمة الجانبية للتنقل بين الأقسام المختلفة. يمكنك إدارة
          المستخدمين، الأسئلة، والتقارير من هنا.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">إجمالي الأسئلة</p>
            <p className="text-2xl font-bold text-gray-700">
              {loading ? (
                <span className="inline-block h-7 w-12 bg-gray-200 animate-pulse rounded" />
              ) : (
                (stats.totalMCQ + stats.totalEssay).toLocaleString("ar-SA")
              )}
            </p>
          </div>
          <div className="bg-[#670320]/5 rounded-xl p-4 border border-[#670320]/10">
            <p className="text-xs text-[#670320]/60 mb-1">تقارير تحتاج مراجعة</p>
            <p className="text-2xl font-bold text-[#670320]">
              {loading ? (
                <span className="inline-block h-7 w-12 bg-red-100 animate-pulse rounded" />
              ) : (
                stats.pendingReports.toLocaleString("ar-SA")
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
