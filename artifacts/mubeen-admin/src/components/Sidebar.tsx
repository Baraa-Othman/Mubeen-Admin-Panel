import { Link, useRoute } from "wouter";
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  Upload,
  Flag,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "الرئيسية" },
  { href: "/users", icon: Users, label: "إدارة المستخدمين" },
  { href: "/questions", icon: HelpCircle, label: "إدارة الأسئلة" },
  { href: "/upload", icon: Upload, label: "رفع الأسئلة" },
  { href: "/reports", icon: Flag, label: "التقارير" },
];

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  const [isActive] = useRoute(href === "/" ? "/" : `${href}*`);

  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group",
          isActive
            ? "bg-[#c2a05e] text-[#670320] shadow-md font-bold"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 flex-shrink-0 transition-colors",
            isActive ? "text-[#670320]" : "text-white/60 group-hover:text-white"
          )}
        />
        <span className="text-sm">{label}</span>
        {isActive && (
          <ChevronLeft className="h-4 w-4 mr-auto text-[#670320]" />
        )}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      className="w-64 bg-[#670320] min-h-screen flex flex-col shadow-2xl"
      dir="rtl"
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#c2a05e] flex items-center justify-center flex-shrink-0">
            <span className="text-[#670320] font-bold text-lg">م</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">مُبين</h1>
            <p className="text-white/50 text-xs">لوحة التحكم</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="mb-3 px-2">
          <p className="text-white/40 text-xs mb-0.5">مسجّل كـ</p>
          <p className="text-white/80 text-sm font-medium truncate">
            {user?.displayName || user?.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200 text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
