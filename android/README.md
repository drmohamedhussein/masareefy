# تطبيق أندرويد — مصاريفي

غلاف أندرويد أصلي عبر [Capacitor](https://capacitorjs.com/) فوق نفس واجهة Next.js، مع تخزين محلي يعمل دون اتصال.

| الحقل | القيمة |
|--------|--------|
| اسم التطبيق | مصاريفي |
| معرف الحزمة (appId) | `com.masareefy.app` |
| مجلد الويب | `out` (تصدير ثابت لاحقًا) |

---

## 1. المتطلبات

- Node.js 20+
- Android Studio (SDK + محاكي أو جهاز USB)
- Java 17 (موصى به لـ Gradle الحديث)

---

## 2. تثبيت الحزم

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/preferences
```

> الحزم مثبتة مسبقًا في `package.json`. شغّل الأمر أعلاه فقط بعد `git clone` أو تحديث التبعيات.

---

## 3. إعداد مشروع Android (مرة واحدة)

```bash
npx cap add android
```

ينشئ مجلد `android/` بمشروع Gradle جاهز لـ Android Studio.

---

## 4. التخزين دون اتصال (Preferences ↔ localStorage)

التطبيق يخزّن المصروفات محليًا تحت المفتاح `masareefy.v1` في `localStorage` (انظر `src/lib/storage/local-repository.ts`).

داخل WebView على أندرويد:

- **`localStorage`** يعمل فورًا دون إعداد إضافي.
- **`@capacitor/preferences`** يحفظ نسخة في SharedPreferences الأصلية (أكثر مقاومة لمسح النظام للبيانات).

الجسر المخطّط في `src/lib/storage/preferences-bridge.ts`:

1. بعد كل كتابة في المستودع المحلي → `mirrorLocalStorageToPreferences()`
2. عند فتح التطبيق → `hydrateLocalStorageFromPreferences()` إذا كان `localStorage` فارغًا
3. استدعاء `initPreferencesBridge()` مرة واحدة من نقطة دخول العميل (لم يُربط بعد في التطبيق)

---

## 5. بناء وتشغيل

### أ) تطوير حي (Live URL — قبل التصدير الثابت)

1. شغّل خادم التطوير على الشبكة المحلية:

   ```bash
   npm run dev:lan
   ```

   (المنفذ **3737** — لا تغيّره)

2. في `capacitor.config.ts` فعّل `server.url` بعنوان IP جهازك، مثل:

   ```ts
   server: {
     url: "http://192.168.1.100:3737",
     cleartext: true,
   },
   ```

3. مزامنة وفتح Android Studio:

   ```bash
   npm run cap:sync
   npm run cap:open:android
   ```

4. Run من Android Studio على محاكي أو جهاز.

### ب) إنتاج (تصدير ثابت — لاحقًا)

1. في `next.config.ts` أضف `output: "export"` (مع أي تعديلات مطلوبة لـ Serwist/المسارات).
2. علّق أو احذف `server.url` من `capacitor.config.ts`.
3. ابنِ وانسخ:

   ```bash
   npm run build
   npm run cap:sync
   npm run cap:open:android
   ```

4. من Android Studio: **Build → Generate Signed Bundle / APK** لرفع AAB على Google Play.

---

## 6. أوامر npm المساعدة

| الأمر | الوصف |
|--------|--------|
| `npm run dev` | Next.js محلي على المنفذ 3737 |
| `npm run dev:lan` | نفس المنفذ، متاح على LAN للجهاز |
| `npm run cap:sync` | نسخ `out/` وتحديث الإضافات الأصلية |
| `npm run cap:copy` | نسخ أصول الويب فقط |
| `npm run cap:open:android` | فتح المشروع في Android Studio |

---

## 7. ملاحظات

- لا تبنِ تطبيق Kotlin منفصل؛ الواجهة واحدة (Next.js + WebView).
- عقد `ExpenseRepository` يبقى كما هو؛ Supabase/WordPress لاحقًا عبر محولات منفصلة.
- مجلد `android/` (Gradle) يُولَّد بـ `cap add android` ولا يُ commit أحيانًا حتى اكتمال الإعداد — راجع `.gitignore` قبل الدفع.
