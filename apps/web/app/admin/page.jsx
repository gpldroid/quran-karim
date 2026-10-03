"use client";

import { useEffect } from "react";
import { checkAdmin, supabase } from "../../lib/supabaseClient";

const base =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (process.env.GITHUB_ACTIONS === "true" ? "/quran-karim" : "");

export default function AdminIndex() {
  useEffect(() => {
    let active = true;

    (async () => {
      const result = await checkAdmin();

      if (!active) return;

      if (result.isAdmin) {
        window.location.replace(base + "/admin/dashboard/");
        return;
      }

      await supabase.auth.signOut();

      if (active) {
        window.location.replace(base + "/admin/login/");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <p>جاري التحقق من صلاحية الإدارة...</p>
    </main>
  );
}
