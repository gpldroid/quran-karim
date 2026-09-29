# WOW — Web, API/CMS, Database & Mobile

هذا المستودع هو المصدر الموحد لمشروع WOW، مع بنية مشتركة للويب ولوحة الإدارة وتطبيق الجوال وقاعدة البيانات.

## البنية المعتمدة

```text
GitHub Repository
├── Web        → Next.js → Vercel / Netlify
├── API / CMS  → Supabase PostgreSQL + Supabase Admin
├── Mobile     → React Native + Expo
├── Database   → Supabase PostgreSQL
└── CI/CD      → GitHub Actions
```

### التقنيات

| المكوّن | التقنية |
|---|---|
| مستودع الكود | GitHub |
| Web | Next.js |
| API / CMS | Supabase |
| Database | Supabase PostgreSQL |
| Mobile | React Native + Expo |
| OTA Updates | EAS Update |
| Web Hosting | Vercel أو Netlify |
| CI/CD | GitHub Actions |
| تخزين الصور والملفات | Cloudinary اختياري |

## تطبيق الجوال

المجلد `mobile/` أصبح مشروع React Native + Expo مستقل، ويقرأ المحتوى المنشور مباشرة من جدول `content_items` في Supabase.

- لا يتم تضمين بيانات Service Role في التطبيق.
- يستخدم التطبيق `EXPO_PUBLIC_SUPABASE_URL` و`EXPO_PUBLIC_SUPABASE_ANON_KEY` فقط.
- يتم الاستماع إلى تغييرات `content_items` عبر Supabase Realtime، ثم إعادة تحميل القائمة تلقائياً.
- تحديث المحتوى من Supabase لا يحتاج إلى إصدار APK جديد.
- تحديث JavaScript والأصول يمكن نشره عبر EAS Update بعد ربط المشروع بحساب Expo وإعداد EAS project.

### إعداد EAS Update

بعد إنشاء/ربط مشروع Expo:

```bash
cd mobile
npx eas init
eas update:configure
```

ثم بعد إنشاء Build يدعم EAS Update:

```bash
eas update --channel production --message "تحديث جديد" --environment production
```

مهم: تحديث OTA يغيّر JavaScript والملفات التي يدعمها Expo، لكنه لا يستبدل تغييرات الكود الأصلي Native أو إعدادات Android/iOS؛ هذه التغييرات تحتاج Build جديد.

## متغيرات الجوال

انسخ `mobile/.env.example` إلى ملف بيئة محلي، ولا ترفع الملف الحقيقي إلى GitHub:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

هذه القيم مخصصة للعميل وليست Service Role Key.

## Supabase Realtime

تم تجهيز migration لتفعيل استقبال تغييرات `content_items` عبر قناة `supabase_realtime`. بعد تنفيذ migration في مشروع Supabase، يمكن للتطبيق والموقع استخدام نفس البيانات.

## Repository layout

```text
web/          # تطبيق Next.js العام
dashboard/    # لوحة الإدارة
mobile/       # React Native + Expo
shared/       # الأنواع والعقود المشتركة
supabase/     # إعدادات ومهاجرات قاعدة البيانات
.github/      # CI/CD
```

## قواعد الأمان

- لا يتم رفع `.env` أو مفاتيح Supabase السرية إلى GitHub.
- لا يتم رفع Service Role Key إلى الواجهة أو التطبيق.
- مفاتيح التوقيع الخاصة بتطبيق Android تبقى داخل GitHub Secrets.
- مفاتيح Vercel وExpo وأي رموز وصول تبقى داخل Secrets.
- لا تضع أي قيمة سرية داخل `EXPO_PUBLIC_*`؛ قيم هذه المتغيرات ستكون قابلة للقراءة داخل التطبيق.

## إدارة التحديثات

### تحديث المحتوى

تعديل النصوص أو المنتجات أو الصفحات في Supabase يحدّث البيانات التي يقرأها الموقع والتطبيق. ومع تفعيل Realtime في قاعدة البيانات، يعيد تطبيق الجوال تحميل المحتوى عند وصول تغيير.

### تحديث الكود

1. تعديل الكود.
2. رفع التغيير إلى GitHub.
3. GitHub Actions يتحقق من مشروع Expo.
4. Vercel ينشر الموقع تلقائياً عند ربطه بالمستودع.
5. عند الحاجة، نشر تحديث OTA عبر EAS Update.
6. إذا تغيّر Native runtime، يتم إنشاء Build جديد.

## مراحل التنفيذ

1. تأسيس المستودع والبنية المشتركة.
2. ربط Supabase وإنشاء قاعدة البيانات وRLS.
3. بناء واجهة Next.js وربطها بالـ API.
4. بناء لوحة الإدارة.
5. **تم تنفيذ أساس تطبيق React Native + Expo وربطه بـ Supabase.**
6. إعداد EAS Build وEAS Update بعد ربط حساب Expo.
7. إعداد النشر على Vercel.
8. إعداد إصدار Production الموقّع بعد إضافة Secrets المطلوبة.

> لا يتم وضع أي مفاتيح أو رموز وصول حقيقية داخل هذا المستودع.
