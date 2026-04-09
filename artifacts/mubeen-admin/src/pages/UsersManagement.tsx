import { useEffect, useState, useCallback, useRef } from "react";
import { useSearch } from "wouter";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Ban,
  CheckCircle,
  User,
  X,
} from "lucide-react";

interface AppUser {
  id: string;
  displayName: string;
  email: string;
  points: number;
  total_points: number;
  profileImage: string;
  isBanned: boolean;
  role: string;
}

type SortField = "points" | "total_points" | null;
type SortDir = "asc" | "desc";

export default function UsersManagement() {
  const searchString = useSearch();
  const initialSearch = new URLSearchParams(searchString).get("search") || "";
  const didInit = useRef(false);

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!didInit.current && initialSearch) {
      setSearch(initialSearch);
      didInit.current = true;
    }
  }, [initialSearch]);

  const fetchUsers = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, "users"), where("role", "==", "user")));
      const data: AppUser[] = snap.docs.map((d) => ({
        id: d.id,
        displayName: d.data().displayName || "",
        email: d.data().email || "",
        points: d.data().points || 0,
        total_points: d.data().total_points || 0,
        profileImage: d.data().profileImage || "",
        isBanned: d.data().isBanned || false,
        role: d.data().role || "user",
      }));
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const toggleBan = async (userId: string, currentBanned: boolean) => {
    setActionLoading(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        isBanned: !currentBanned,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isBanned: !currentBanned } : u
        )
      );
    } catch (err) {
      console.error("Error toggling ban:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const diff = a[sortField] - b[sortField];
    return sortDir === "asc" ? diff : -diff;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-4 w-4 text-[#670320]" />
    ) : (
      <ChevronDown className="h-4 w-4 text-[#670320]" />
    );
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
        <p className="text-gray-500 text-sm mt-1">
          عرض وإدارة جميع مستخدمي التطبيق
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو البريد الإلكتروني..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#670320]/20 focus:border-[#670320] bg-gray-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right py-3 px-4 font-semibold text-gray-600">
                  المستخدم
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">
                  البريد الإلكتروني
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold text-gray-600 cursor-pointer hover:text-[#670320] select-none"
                  onClick={() => toggleSort("points")}
                >
                  <div className="flex items-center gap-1">
                    النقاط <SortIcon field="points" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold text-gray-600 cursor-pointer hover:text-[#670320] select-none"
                  onClick={() => toggleSort("total_points")}
                >
                  <div className="flex items-center gap-1">
                    إجمالي النقاط <SortIcon field="total_points" />
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">
                  الحالة
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    لا توجد نتائج مطابقة للبحث
                  </td>
                </tr>
              ) : (
                sorted.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.displayName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-[#c2a05e] transition"
                            onClick={() => setPreviewImage(user.profileImage)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#670320]/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-[#670320]" />
                          </div>
                        )}
                        <span className="font-medium text-gray-800">
                          {user.displayName || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#c2a05e]">
                        {user.points.toLocaleString("ar-SA")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-700">
                        {user.total_points.toLocaleString("ar-SA")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <Ban className="h-3 w-3" />
                          محظور
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          نشط
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleBan(user.id, user.isBanned)}
                        disabled={actionLoading === user.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          user.isBanned
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {actionLoading === user.id ? (
                          <span className="flex items-center gap-1">
                            <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                          </span>
                        ) : user.isBanned ? (
                          "رفع الحظر"
                        ) : (
                          "حظر"
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 text-xs text-gray-400">
          إجمالي: {sorted.length} مستخدم
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="صورة المستخدم"
              className="max-h-[80vh] max-w-[80vw] rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -left-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
