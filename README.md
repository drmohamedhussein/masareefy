# مصاريفي (Masareefy)

تطبيق عربي لتتبع المصاريف الشخصية — جدول Notion-like · وسوم ملوّنة · تقويم · إحصاءات · PWA · مزامنة Google Sheets وNotion · مصروفات متكررة · قراءة فاتورة (OCR) · جاهز لووردبريس وأندرويد.

## استخدام مباشر

- محلي دائم: http://localhost:3737
- الكود: https://github.com/drmohamedhussein/masareefy

```bash
npm install
npm run dev
```

## أعمدة الجدول

`#` · السعر · اسم المشتريات · التصنيف (وسوم) · ملاحظات

## المزامنة التلقائية

كل إضافة/تعديل/حذف يُزامن فورًا للوجهات المربوطة:

- **Google Sheets**: الإعدادات → Google Sheets (Client ID + ربط Gmail)
- **Notion**: الإعدادات → Notion (Integration Token + Database ID)

## الميزات 1–8

1. نطاق لايف / PWA للتثبيت على الهاتف
2. تصنيفات = وسوم بألوان (جاهزة لـ Notion multi_select)
3. ميزانية شهرية مع تنبيه التجاوز
4. مصروفات متكررة (يوم الشهر)
5. تخزين محلي + مسار مزامنة سحابية (Supabase جاهز لاحقًا)
6. إضافة ووردبريس متعددة المستخدمين: `wordpress/masareefy`
7. غلاف أندرويد Capacitor أوفلاين: مجلد `android/` + `docs/android.md`
8. تصوير فاتورة + OCR من زر «فاتورة»

## النشر اللايف (موقع دائم)

الكود مرفوع بالكامل على GitHub. لربط موقع لايف:

### Netlify (موصى به — مجاني)

1. افتح: https://app.netlify.com/start/deploy?repository=https://github.com/drmohamedhussein/masareefy
2. سجّل دخول GitHub واختر الريبو `masareefy`
3. اضغط **Deploy** (يقرأ `netlify.toml` تلقائيًا)
4. أضف `NEXT_PUBLIC_GOOGLE_CLIENT_ID` في Environment variables
5. أضف رابط موقعك في Google OAuth origins

### Cloudflare Workers (بديل)

```bash
npm run deploy
```

يحتاج خطة مدفوعة (حجم التطبيق > 3MB على المجاني).

## ووردبريس

انسخ `wordpress/masareefy` إلى `wp-content/plugins/` وفعّل الإضافة. كل مستخدم يرى مصاريفه فقط (REST + جدول لكل user_id).

## أندرويد

```bash
npm run dev:lan
# فعّل server.url في capacitor.config.ts بعنوان جهازك
npm run cap:sync
npm run cap:open:android
```
