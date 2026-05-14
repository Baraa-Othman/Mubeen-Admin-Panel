import { useEffect, useState, type ReactNode } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Activity,
  Ban,
  BarChart3,
  CheckCircle,
  Flag,
  HelpCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalMCQ: number;
  totalEssay: number;
  pendingReports: number;
  resolvedReports: number;
  totalReports: number;
  averagePoints: number;
  averageTotalPoints: number;
  highestPoints: number;
}

interface ChartDatum {
  name: string;
  value: number;
  fill: string;
}

interface PointsBin {
  name: string;
  users: number;
}

interface ReportTypeDatum {
  name: string;
  pending: number;
  resolved: number;
}

interface ScatterDatum {
  name: string;
  points: number;
  totalPoints: number;
}

interface DashboardData {
  questionTypeData: ChartDatum[];
  reportStatusData: ChartDatum[];
  pointsHistogram: PointsBin[];
  reportTypeData: ReportTypeDatum[];
  userScatterData: ScatterDatum[];
}

const emptyStats: Stats = {
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  totalMCQ: 0,
  totalEssay: 0,
  pendingReports: 0,
  resolvedReports: 0,
  totalReports: 0,
  averagePoints: 0,
  averageTotalPoints: 0,
  highestPoints: 0,
};

const emptyDashboardData: DashboardData = {
  questionTypeData: [],
  reportStatusData: [],
  pointsHistogram: [],
  reportTypeData: [],
  userScatterData: [],
};

const reportTypeLabels: Record<string, string> = {
  question: "بلاغات الأسئلة",
  user: "بلاغات المستخدمين",
  general: "بلاغات عامة",
};

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("ar-SA");
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm text-gray-400">
      لا توجد بيانات كافية
    </div>
  );
}

export default function Overview() {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(emptyDashboardData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, mcqSnap, essaySnap, reportsSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), where("role", "==", "user"))),
          getDocs(collection(db, "MCQ")),
          getDocs(collection(db, "essay_questions")),
          getDocs(collection(db, "reports")),
        ]);

        const users = usersSnap.docs.map((d) => {
          const data = d.data();
          const points = toNumber(data.points);
          const totalPoints = toNumber(data.total_points);

          return {
            name: data.displayName || data.email || "مستخدم",
            points,
            totalPoints,
            isBanned: Boolean(data.isBanned),
          };
        });

        const reports = reportsSnap.docs.map((d) => {
          const data = d.data();
          return {
            status: data.status === "resolved" ? "resolved" : "pending",
            type: data.report_type || "general",
          };
        });

        const totalUsers = users.length;
        const bannedUsers = users.filter((user) => user.isBanned).length;
        const pendingReports = reports.filter(
          (report) => report.status === "pending"
        ).length;
        const resolvedReports = reports.filter(
          (report) => report.status === "resolved"
        ).length;
        const currentPointsSum = users.reduce(
          (sum, user) => sum + user.points,
          0
        );
        const lifetimePointsSum = users.reduce(
          (sum, user) => sum + user.totalPoints,
          0
        );
        const highestPoints = users.reduce(
          (highest, user) => Math.max(highest, user.points),
          0
        );

        const pointRanges = [
          { name: "0", min: 0, max: 0 },
          { name: "1-99", min: 1, max: 99 },
          { name: "100-499", min: 100, max: 499 },
          { name: "500-999", min: 500, max: 999 },
          { name: "+1000", min: 1000, max: Number.POSITIVE_INFINITY },
        ];

        const pointsHistogram = pointRanges.map((range) => ({
          name: range.name,
          users: users.filter(
            (user) => user.points >= range.min && user.points <= range.max
          ).length,
        }));

        const reportsByType = new Map<string, ReportTypeDatum>();
        reports.forEach((report) => {
          const name = reportTypeLabels[report.type] || report.type;
          const current =
            reportsByType.get(name) || { name, pending: 0, resolved: 0 };

          if (report.status === "pending") {
            current.pending += 1;
          } else {
            current.resolved += 1;
          }

          reportsByType.set(name, current);
        });

        const userScatterData = users
          .filter((user) => user.points > 0 || user.totalPoints > 0)
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, 30)
          .map((user) => ({
            name: user.name,
            points: user.points,
            totalPoints: user.totalPoints,
          }));

        setStats({
          totalUsers,
          activeUsers: totalUsers - bannedUsers,
          bannedUsers,
          totalMCQ: mcqSnap.size,
          totalEssay: essaySnap.size,
          pendingReports,
          resolvedReports,
          totalReports: reports.length,
          averagePoints: totalUsers ? currentPointsSum / totalUsers : 0,
          averageTotalPoints: totalUsers ? lifetimePointsSum / totalUsers : 0,
          highestPoints,
        });

        setDashboardData({
          questionTypeData: [
            {
              name: "اختيار من متعدد",
              value: mcqSnap.size,
              fill: "#c2a05e",
            },
            { name: "مقالية", value: essaySnap.size, fill: "#374151" },
          ],
          reportStatusData: [
            {
              name: "بانتظار المراجعة",
              value: pendingReports,
              fill: "#f97316",
            },
            { name: "معالج", value: resolvedReports, fill: "#16a34a" },
          ],
          pointsHistogram,
          reportTypeData: Array.from(reportsByType.values()),
          userScatterData,
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
      light: "bg-red-50",
      textColor: "text-[#670320]",
    },
    {
      label: "إجمالي الأسئلة",
      value: stats.totalMCQ + stats.totalEssay,
      icon: HelpCircle,
      light: "bg-amber-50",
      textColor: "text-[#a8833a]",
    },
    {
      label: "بلاغات تحتاج مراجعة",
      value: stats.pendingReports,
      icon: Flag,
      light: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      label: "مستخدمون محظورون",
      value: stats.bannedUsers,
      icon: Ban,
      light: "bg-gray-50",
      textColor: "text-gray-700",
    },
  ];

  const summaryCards = [
    {
      label: "المستخدمون النشطون",
      value: stats.activeUsers,
      icon: CheckCircle,
      textColor: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "متوسط النقاط الحالية",
      value: stats.averagePoints,
      icon: Activity,
      textColor: "text-[#670320]",
      bg: "bg-[#670320]/5",
    },
    {
      label: "متوسط النقاط الكلي",
      value: stats.averageTotalPoints,
      icon: BarChart3,
      textColor: "text-[#a8833a]",
      bg: "bg-amber-50",
    },
    {
      label: "أعلى رصيد نقاط",
      value: stats.highestPoints,
      icon: TrendingUp,
      textColor: "text-gray-700",
      bg: "bg-gray-50",
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
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
                    {formatNumber(card.value)}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((item) => (
          <div
            key={item.label}
            className={`${item.bg} rounded-2xl border border-gray-100 p-4`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/70 p-2 rounded-xl">
                <item.icon className={`h-5 w-5 ${item.textColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                {loading ? (
                  <div className="h-6 w-12 bg-white/70 animate-pulse rounded" />
                ) : (
                  <p className={`text-2xl font-bold ${item.textColor}`}>
                    {formatNumber(item.value)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <ChartPanel
          title="توزيع الأسئلة"
          description="مقارنة بين أسئلة الاختيار من متعدد والأسئلة المقالية"
        >
          {loading ? (
            <div className="h-full bg-gray-50 animate-pulse rounded-xl" />
          ) : dashboardData.questionTypeData.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.questionTypeData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => formatNumber(Number(value))}
                  contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {dashboardData.questionTypeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartPanel>

        <ChartPanel
          title="حالة البلاغات"
          description="نسبة البلاغات التي تحتاج مراجعة مقابل البلاغات المعالجة"
        >
          {loading ? (
            <div className="h-full bg-gray-50 animate-pulse rounded-xl" />
          ) : dashboardData.reportStatusData.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.reportStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={95}
                  paddingAngle={4}
                  label={({ name, value }) =>
                    `${name}: ${formatNumber(Number(value))}`
                  }
                >
                  {dashboardData.reportStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatNumber(Number(value))}
                  contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartPanel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartPanel
          title="توزيع نقاط المستخدمين"
          description="مخطط أعمدة يوضح عدد المستخدمين داخل كل نطاق نقاط"
        >
          {loading ? (
            <div className="h-full bg-gray-50 animate-pulse rounded-xl" />
          ) : dashboardData.pointsHistogram.some((item) => item.users > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.pointsHistogram}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => formatNumber(Number(value))}
                  contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
                />
                <Bar dataKey="users" fill="#670320" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartPanel>

        <ChartPanel
          title="نشاط المستخدمين"
          description="مخطط نقاط بين الرصيد الحالي والنقاط الكلية لأبرز المستخدمين"
        >
          {loading ? (
            <div className="h-full bg-gray-50 animate-pulse rounded-xl" />
          ) : dashboardData.userScatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="points"
                  name="النقاط الحالية"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="totalPoints"
                  name="النقاط الكلية"
                  tick={{ fontSize: 12 }}
                />
                <ZAxis range={[80, 320]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value) => formatNumber(Number(value))}
                  contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
                />
                <Scatter
                  name="المستخدمون"
                  data={dashboardData.userScatterData}
                  fill="#c2a05e"
                />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartPanel>
      </div>

      <div className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              البلاغات حسب النوع
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              مقارنة البلاغات المعلقة والمعالجة داخل كل فئة
            </p>
          </div>
          <div className="text-xs text-gray-400">
            الإجمالي: {formatNumber(stats.totalReports)} بلاغ
          </div>
        </div>
        <div className="h-72">
          {loading ? (
            <div className="h-full bg-gray-50 animate-pulse rounded-xl" />
          ) : dashboardData.reportTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.reportTypeData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => formatNumber(Number(value))}
                  contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
                />
                <Bar
                  dataKey="pending"
                  name="بانتظار المراجعة"
                  fill="#f97316"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="resolved"
                  name="معالج"
                  fill="#16a34a"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>
    </div>
  );
}
