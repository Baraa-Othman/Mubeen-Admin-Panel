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
import logo from "@assets/Baraa_and_khalid_future_1775732882119.png";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "الرئيسية" },
  { href: "/users", icon: Users, label: "إدارة المستخدمين" },
  { href: "/questions", icon: HelpCircle, label: "إدارة الأسئلة" },
  { href: "/upload", icon: Upload, label: "رفع الأسئلة" },
  { href: "/reports", icon: Flag, label: "البلاغات" },
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
            ? "bg-[#670320] text-white shadow-md font-bold"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 flex-shrink-0 transition-colors",
            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
          )}
        />
        <span className="text-sm">{label}</span>
        {isActive && (
          <ChevronLeft className="h-4 w-4 mr-auto text-white/70" />
        )}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      className="w-64 bg-white min-h-screen flex flex-col shadow-[1px_0_0_0_#e5e7eb]"
      dir="rtl"
    >
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#670320] flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-[#c2a05e]/60">
            <img
              src={logo}
              alt="مُبين"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-[#670320] font-bold text-lg leading-tight">مُبين</h1>
            <p className="text-gray-400 text-xs">لوحة التحكم</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="mb-3 px-2">
          <p className="text-gray-400 text-xs mb-0.5">مسجّل كـ</p>
          <p className="text-gray-600 text-sm font-medium truncate">
            {user?.displayName || user?.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
