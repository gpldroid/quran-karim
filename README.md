# WOW — Web, API/CMS, Database & Mobile

هذا المستودع هو المصدر الموحد لمشروع WOW، مع اعتماد بنية واحدة للويب ولوحة الإدارة وواجهة البيانات وتطبيق الجوال.

## البنية المعتمدة

```text
GitHub Repository
├── Web        → Next.js → Vercel / Netlify
├── API / CMS  → Supabase PostgreSQL + Supabase Admin
├── Mobile     → React Native / Expo أو Flutter
├── Database   → Supabase PostgreSQL
└── CI/CD      → GitHub Actions
```

### التقنيات

| المكوّن | التقنية |
|---|---|
| مستودع الكود | GitHub |
| Web | Next.js |
| API / CMS | Supabase، مع إمكانية إضافة Strapi Cloud لاحقاً |
| Database | Supabase PostgreSQL |
| Mobile | React Native (Expo) أو Flutter |
| Web Hosting | Vercel أو Netlify |
| CI/CD | GitHub Actions |

## Repository layout

```text
web/          # تطبيق Next.js العام
dashboard/    # لوحة الإدارة
mobile/       # طبقة تطبيق الجوال
shared/       # الأنواع والعقود المشتركة
supabase/     # إعدادات ومهاجرات قاعدة البيانات
.github/      # CI/CD
```

## قواعد الأمان

- لا يتم رفع `.env` أو مفاتيح Supabase السرية إلى GitHub.
- لا يتم رفع Service Role Key إلى الواجهة أو التطبيق.
- مفاتيح التوقيع الخاصة بتطبيق Android تبقى داخل GitHub Secrets.
- مفاتيح Vercel/Expo وأي رموز وصول تبقى داخل Secrets.
- يتم فصل بيانات الإنتاج عن بيانات التطوير.

## مراحل التنفيذ

1. تأسيس المستودع والبنية المشتركة.
2. ربط Supabase وإنشاء قاعدة البيانات وRLS.
3. بناء واجهة Next.js وربطها بالـ API.
4. بناء لوحة الإدارة.
5. اعتماد React Native/Expo أو Flutter لتطبيق الجوال.
6. إعداد CI/CD وبناء APK/AAB.
7. إعداد النشر على Vercel.
8. إعداد إصدار Production الموقّع بعد إضافة Secrets المطلوبة.

> النسخة الحالية هي Foundation للبنية وCI. لن يتم اختراع جداول أو وظائف خاصة بالمشروع قبل تحديد متطلبات المنتج.

