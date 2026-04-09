import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

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
      className="min-h-screen bg-gradient-to-br from-[#670320] via-[#8a0428] to-[#4a0218] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <span className="text-4xl font-bold text-[#c2a05e]">م</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">مُبين</h1>
          <p className="text-white/60 text-sm">لوحة تحكم المسؤول</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-[#670320] mb-6 text-center">
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
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@mubeen.com"
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#670320]/30 focus:border-[#670320] text-gray-800 bg-gray-50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pr-10 pl-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#670320]/30 focus:border-[#670320] text-gray-800 bg-gray-50 transition"
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
              className="w-full py-3 bg-[#670320] text-white font-bold rounded-lg hover:bg-[#8a0428] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl mt-2"
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

        <p className="text-center text-white/40 text-xs mt-6">
          © 2024 مُبين - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
