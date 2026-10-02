# Quran Karim
Next.js static export + Supabase + GitHub Pages + GitHub Releases.
## التشغيل
npm install && npm run dev
نفّذ supabase/schema.sql في Supabase ثم ضع متغيرات .env.local.
فعّل GitHub Pages من Settings > Pages > GitHub Actions.
أضف Repository Variables: NEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_ANON_KEY وNEXT_PUBLIC_ISLAMWAY_API_URL.
لـ APK أضف SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY كـ Secrets. لا تستخدم service-role key في المتصفح.
ملاحظة: عنوان Islamway API يظل قابلاً للضبط لأن نقطة API الفعلية تختلف حسب الخدمة المستخدمة.