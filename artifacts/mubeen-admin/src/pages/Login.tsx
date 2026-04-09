import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import logo from "@assets/Baraa_and_khalid_future_1775732882119.png";

export default function Login() {
  const { login, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#670320] mb-3 overflow-hidden shadow-xl">
            <img
              src={logo}
              alt="مُبين"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-[#670320] mb-0.5">مُبين</h1>
          <p className="text-gray-400 text-sm">لوحة تحكم المسؤول</p>
        </div>

        <div
          className="bg-white rounded-2xl shadow-lg p-8"
          style={{
            border: "2px solid #c2a05e",
            boxShadow: "0 4px 32px 0 rgba(194,160,94,0.15), 0 2px 8px 0 rgba(103,3,32,0.08)",
          }}
        >
          <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">
            تسجيل الدخول
          </h2>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-[#c2a05e]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@mubeen.com"
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c2a05e]/30 focus:border-[#c2a05e] text-gray-800 bg-gray-50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-[#c2a05e]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pr-10 pl-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c2a05e]/30 focus:border-[#c2a05e] text-gray-800 bg-gray-50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#670320] text-white font-bold rounded-xl hover:bg-[#8a0428] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  جارٍ تسجيل الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-5">
          © 2024 مُبين - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
