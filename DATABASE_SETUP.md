# إعداد قاعدة البيانات

## معلومات الاتصال بقاعدة البيانات

```
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5441
DB_NAME=scientific_plan_db
DB_USER=sp_admin
DB_PASSWORD=SHsh321321
```

## الخطوات اللازمة

### 1. إنشاء ملف .env.local

قم بإنشاء ملف `.env.local` في الجذر الرئيسي للمشروع وأضف المحتوى التالي:

```env
# Database Configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5441
DB_NAME=scientific_plan_db
DB_USER=sp_admin
DB_PASSWORD=SHsh321321

# Database Connection String
DATABASE_URL=postgresql://sp_admin:SHsh321321@localhost:5441/scientific_plan_db
```

### 2. التأكد من تشغيل PostgreSQL

تأكد من أن PostgreSQL يعمل على المنفذ 5441 وأن قاعدة البيانات `scientific_plan_db` موجودة.

### 3. إنشاء قاعدة البيانات (إذا لم تكن موجودة)

إذا لم تكن قاعدة البيانات موجودة، قم بإنشائها:

```sql
CREATE DATABASE scientific_plan_db;
```

### 4. اختبار الاتصال بقاعدة البيانات

قم بتشغيل الأمر التالي لاختبار الاتصال وتهيئة الجداول:

```bash
npm run test-db
```

أو:

```bash
npm run db:init
```

## بنية قاعدة البيانات

### جدول المستخدمين (users)

- `id`: معرف فريد (SERIAL PRIMARY KEY)
- `username`: اسم المستخدم (VARCHAR, UNIQUE, NOT NULL)
- `email`: البريد الإلكتروني (VARCHAR, UNIQUE)
- `password_hash`: كلمة المرور المشفرة (VARCHAR, NOT NULL)
- `full_name`: الاسم الكامل (VARCHAR)
- `role`: الدور (VARCHAR, DEFAULT 'teacher')
- `department`: القسم (VARCHAR)
- `is_active`: حالة المستخدم (BOOLEAN, DEFAULT true)
- `created_at`: تاريخ الإنشاء (TIMESTAMP)
- `updated_at`: تاريخ التحديث (TIMESTAMP)
- `last_login`: آخر تسجيل دخول (TIMESTAMP)

### جدول الجلسات (sessions)

- `id`: معرف فريد (SERIAL PRIMARY KEY)
- `user_id`: معرف المستخدم (INTEGER, FOREIGN KEY)
- `session_token`: رمز الجلسة (VARCHAR, UNIQUE, NOT NULL)
- `expires_at`: تاريخ انتهاء الجلسة (TIMESTAMP, NOT NULL)
- `created_at`: تاريخ الإنشاء (TIMESTAMP)
- `ip_address`: عنوان IP (VARCHAR)
- `user_agent`: معلومات المتصفح (TEXT)

## الأمان

- جميع كلمات المرور مشفرة باستخدام bcryptjs
- المصادقة تتم بالكامل من خلال قاعدة البيانات
- لا توجد بيانات اعتماد مخزنة محلياً خارج قاعدة البيانات

## ملفات قاعدة البيانات

- `lib/db/config.ts`: إعدادات الاتصال بقاعدة البيانات
- `lib/db/pool.ts`: تجميع الاتصالات (Connection Pool)
- `lib/db/query.ts`: دوال مساعدة لتنفيذ الاستعلامات
- `lib/db/schema.ts`: تعريف الجداول وبنية قاعدة البيانات
- `lib/db/auth.ts`: دوال المصادقة وإدارة المستخدمين

## استخدام دوال المصادقة

```typescript
import { createUser, authenticateUser, getUserByUsername } from '@/lib/db/auth';

// إنشاء مستخدم جديد
const user = await createUser('username', 'password', {
  full_name: 'اسم المستخدم',
  role: 'teacher',
  department: 'قسم العلوم'
});

// المصادقة
const authenticatedUser = await authenticateUser('username', 'password');

// الحصول على مستخدم
const user = await getUserByUsername('username');
```
