import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import UsersManagement from "@/pages/UsersManagement";
import QuestionsManager from "@/pages/QuestionsManager";
import BulkUpload from "@/pages/BulkUpload";
import ReportsManagement from "@/pages/ReportsManagement";
import logo from "@assets/‏‏Mubeen_Shrinked_Official_Logo_Transparent_1776516893933.png";

const queryClient = new QueryClient();

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50"
        dir="rtl"
      >
        <div className="text-center">
          <img src={logo} alt="مُبين" className="w-44 mx-auto rounded-xl mb-4" />
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#670320] border-t-transparent"></span>
            جارٍ التحميل...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!user.emailVerified) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            التحقق من البريد الإلكتروني مطلوب
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            يرجى التحقق من بريدك الإلكتروني أولاً. تحقق من صندوق الوارد
            وانقر على رابط التفعيل.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/users" component={UsersManagement} />
        <Route path="/questions" component={QuestionsManager} />
        <Route path="/upload" component={BulkUpload} />
        <Route path="/reports" component={ReportsManagement} />
        <Route>
          <div className="p-8 text-center text-gray-400" dir="rtl">
            الصفحة غير موجودة
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
