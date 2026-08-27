# تطبيق أندرويد — مصروفي

الويب الحالي أصبح PWA قابل للتثبيت. مسار أندرويد الأصلي لاحقًا بدون إعادة بناء المنتج:

## الخطة المقترحة (Capacitor)

1. الإبقاء على Next.js كتطبيق الويب الأساسي.
2. إضافة Capacitor فوق نفس الواجهة (أو نسخة export ثابتة عند الحاجة).
3. توليد مشروع Android Studio.
4. اختبار على جهاز/محاكي.
5. رفع AAB على Google Play عند الطلب.

## أوامر تمهيدية (للمرحلة القادمة فقط)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "مصروفي" com.masroofy.app
npx cap add android
npx cap open android
```

## ملاحظات

- التخزين المحلي الحالي (`localStorage`) يعمل داخل WebView.
- عند الحاجة لمزامنة سحابية أو WordPress، نستخدم نفس عقد `ExpenseRepository`.
- لا تبنِ أندرويد منفصل بلغة Kotlin إلا إذا ظهرت حاجة متجر/أداء خاصة.
