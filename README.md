# WOW — المنصة الموحدة للويب والتطبيق ولوحة التحكم

هذا المستودع هو المصدر الموحد لمنصة WOW، ويضم الموقع العام، لوحة التحكم، تطبيق Android، وSupabase.

## المسارات المعتمدة

- الموقع العام: `https://gpldroid.github.io/wow/`
- تسجيل الدخول: `https://gpldroid.github.io/wow/login/`
- لوحة التحكم: `https://gpldroid.github.io/wow/dashboard/`
- رابط APK المستقر: `https://github.com/gpldroid/wow/releases/latest/download/wow.apk`

لا توجد بوابة مؤقتة في `index.html`. الصفحة الرئيسية هي المنصة الإسلامية الموحدة، ولوحة التحكم لها مسار مستقل.

## البنية

```text
wow/
├── web/                 # Next.js + static export + الموقع العام ولوحة التحكم
│   ├── app/login/       # تسجيل الدخول عبر Supabase Auth
│   ├── app/dashboard/   # لوحة التحكم
│   └── public/quran.html# الواجهة الإسلامية الموحدة
├── mobile/              # React Native + Expo + WebView
│   └── assets/quran.html
├── supabase/migrations/ # قاعدة البيانات وRLS والأدوار
├── shared/              # مساحة العقود المشتركة
└── .github/workflows/   # النشر والتحقق وبناء Android
```

## Supabase

يستخدم الويب متغيري:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

وتستخدم بيئة Expo:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

لا يتم تخزين Service Role Key أو مفاتيح التوقيع داخل المستودع.

### قاعدة البيانات

التنفيذ بالترتيب:
1. `supabase/migrations/001_initial_content.sql`
2. `supabase/migrations/002_dashboard_foundation.sql`

تم تجهيز RLS للمحتوى والتصنيفات والإعدادات، مع أدوار `admin` و`editor`.

## Android / EAS

- `mobile/eas.json` يحتوي ملف `preview` لإنتاج APK وملف `production` لإنتاج AAB.
- Workflow البناء الرسمي الوحيد هو `.github/workflows/android.yml`.
- البناء لا يبدأ تلقائياً مع كل تعديل؛ يتم تشغيله يدوياً لحماية حصة EAS المجانية.
- عند نجاح البناء، يتم رفع APK كـ GitHub Actions Artifact وإنشاء GitHub Release حديث يحتوي `wow.apk`.

## GitHub Pages

Workflow الموقع هو `.github/workflows/web.yml`. يبني نسخة Next.js ثابتة ثم ينشرها إلى GitHub Pages. الصفحة الإسلامية الموحدة تبقى الصفحة الرئيسية، بينما صفحات `login` و`dashboard` تبقى ضمن ناتج Next.js ولا يتم تحويلها إلى بوابة.

## الوظائف

الواجهة العامة تشمل:
- المصحف والقراء والتلاوة والتفسير والترجمة.
- إذاعات القرآن.
- الأذكار والمسبحة.
- مواقيت الصلاة باستخدام الموقع الجغرافي مع fallback.
- اتجاه القبلة.
- مخطط الختمة.
- صفحات الخصوصية والشروط والأسئلة الشائعة.
- نموذج اتصال يفتح تطبيق البريد بدلاً من عرض نجاح وهمي.

## قواعد الأمان

- لا ترفع ملفات `.env` الحقيقية.
- لا تضع Service Role Key في الواجهة أو التطبيق.
- لا تضع أسرار Expo أو GitHub أو مفاتيح توقيع Android في الملفات.
- قيم `EXPO_PUBLIC_*` و`NEXT_PUBLIC_*` مخصصة للعميل ويمكن تضمينها في build؛ لا تستخدمها للأسرار.

## مزامنة الموقع والتطبيق

- التطبيق Android يفتح النسخة المنشورة من الموقع `https://gpldroid.github.io/wow/` عند التشغيل وعند العودة للتطبيق بعد فترة، مع الاحتفاظ بنسخة `quran.html` محلية كـ fallback عند انقطاع الإنترنت.
- لذلك تعديلات HTML/CSS/JS التي تحفظ من لوحة التحكم ثم تصل إلى GitHub Pages لا تتطلب إعادة بناء APK بعد كل تعديل واجهة.
- إعدادات Supabase الديناميكية مثل المظهر والإعلانات والصيانة والإصدار الأدنى تُقرأ مباشرة من Supabase، مع Realtime لإعادة جلب الإعدادات عند تغييرها.
- تغييرات الكود الأصلي Native داخل `android/` ما زالت تتطلب APK/AAB جديدًا.

## دورة العمل

1. عدّل الكود.
2. تحقق من Workflow الويب/الموبايل.
3. انشر الموقع عبر GitHub Pages.
4. لا تشغّل EAS إلا عند الحاجة إلى APK/AAB جديد.
5. استخدم Supabase لتحديث المحتوى دون الحاجة إلى إعادة بناء التطبيق عندما لا يكون التغيير Native.
