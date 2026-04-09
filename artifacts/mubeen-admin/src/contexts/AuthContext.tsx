import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  authError: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === "admin") {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: userData.displayName || firebaseUser.displayName,
                emailVerified: firebaseUser.emailVerified,
                role: userData.role,
              });
            } else {
              setUser(null);
              await signOut(auth);
            }
          } else {
            setUser(null);
            await signOut(auth);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      if (!firebaseUser.emailVerified) {
        await signOut(auth);
        setAuthError("يرجى التحقق من بريدك الإلكتروني أولاً قبل تسجيل الدخول.");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        setAuthError("المستخدم غير موجود في قاعدة البيانات.");
        return;
      }

      const userData = userDoc.data();
      if (userData.role !== "admin") {
        await signOut(auth);
        setAuthError("ليس لديك صلاحيات الوصول إلى لوحة التحكم.");
        return;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: userData.displayName || firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified,
        role: userData.role,
      });
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/wrong-password" ||
        firebaseError.code === "auth/invalid-credential"
      ) {
        setAuthError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else if (firebaseError.code === "auth/too-many-requests") {
        setAuthError("تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً.");
      } else {
        setAuthError("حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مجدداً.");
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
