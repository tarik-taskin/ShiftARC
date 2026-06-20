# ShiftARC

ShiftARC; günlük ve haftalık planlama, zaman analizi, takvim kontrolü ve odak
akışları için geliştirilen web tabanlı bir planlama uygulamasıdır.

Mevcut `0.1.0` geliştirme sürümü, doğrulanmış lokal temelin üzerinde ilk
kullanılabilir ürün akışını oluşturmaktadır. React frontend, Spring Boot API ve
PostgreSQL aynı makinede birlikte çalışır. Deployment ve kullanıcı hesabı henüz
kapsamda değildir.

## Teknoloji tabanı

- React 19, TypeScript 6, Vite 8
- Spring Boot 4.1, Java 17, Gradle Wrapper
- PostgreSQL 16, Flyway 12
- Spring Data JPA (yalnız mapping/query; DDL yalnız Flyway)
- Contract-first OpenAPI 3.1
- Vitest, Testing Library, JUnit 5 ve MockMvc

## Mevcut ürün akışı

İlk açılışta ShiftARC lokal workspace kaydını API üzerinden yükler ve onboarding
ekranını gösterir. Kullanıcı IANA saat dilimini, `Arc Midnight`, `Dawn` veya
`Aurora` temasını, saate duyarlı ya da sabit arka plan davranışını ve örnek
planlama verilerinin eklenip eklenmeyeceğini seçebilir.

Örnek veri seçeneği altı kategori, iki gün tipi ve pazartesi–pazar şablonunu tek
transaction içinde oluşturur; görev oluşturmaz. Tercihler daha sonra `Görünüm`
sayfasından güncellenebilir.

`Kategoriler` sayfası görev ve zaman bloklarında kullanılacak planlama sözlüğünü
yönetir. Kategoriler isim, renk ve ikonla oluşturulabilir; aranabilir, düzenlenebilir,
arşivlenebilir ve veri kaybı olmadan geri yüklenebilir. Aynı çalışma alanında kategori
adları büyük-küçük harf ayrımından bağımsız olarak benzersizdir.

`Gün tipleri` sayfası 00:00–24:00 arasını kesintisiz zaman blokları halinde tasarlar.
Yeni bir gün tipi tam günü kaplayan `Plansız` blokla başlar. Çizelgeye tıklanan nokta
en yakın beş dakikaya yuvarlanarak yeni blok sınırı oluşturur; bloklara birden fazla
aktif kategori atanabilir, bloklar düzenlenebilir veya komşusuyla birleştirilebilir.
Gün tipleri geçmiş bağlantıları silmeden arşivlenip geri yüklenebilir.

`Haftalık plan` sayfası pazartesiden pazara yedi sabit gün yuvasına aktif gün
tiplerini atar. Plan eksik günlerle taslak olarak kaydedilebilir; yedi günün tamamı
atandığında tamamlandı durumuna geçer. Bütün hafta tek transaction içinde yazılır ve
workspace sürümü üzerinden eşzamanlı değişiklik çakışmaları engellenir.

`Görevler` sayfası son tarih ve toplam süre taşıyan iş parçacıklarıyla haftalık süre
hedefli alışkanlıkları yönetir. Her görev 1–5 önem derecesi ve birden fazla kategori
taşıyabilir; önem, son tarih, oluşturulma zamanı, tip, durum ve kategoriye göre
filtrelenebilir. Görevler tamamlanabilir, arşivlenebilir ve yeniden aktifleştirilebilir.
Uygulama üst çubuğundaki `Yeni görev` eylemi aynı dialogu her sayfadan açar.

Ana sayfa workspace saat diliminde canlı saat ve saniyeyi, bugünün gün tipinden
üretilmiş 24 saatlik snapshot çizelgesini ve kırmızı mevcut-zaman imlecini gösterir.
Günlük plan üreticisi görevleri kategori uyumu ve önem sırasıyla değerlendirir; iş
parçacığı süresini son tarihe kalan günlere, alışkanlık hedefini haftada kalan günlere
böler. Beş dakikalık günlük hedefler uygun bloklara yerleştirilir, sığmayan kısım
silinmek yerine açık bir plan uyarısı olarak saklanır. Aynı güne yapılan normal GET
mevcut snapshot'ı korur; kullanıcı isterse sürüm kontrollü yeniden üretim yapabilir.

Planlanan görevler ana sayfadan başlatılabilir ve bitirilebilir. `Sıradaki görev`
eylemi mevcut oturumu bitirip bir sonraki plan öğesini aynı transaction içinde
başlatır. Workspace genelinde yalnız bir aktif çalışma oturumu bulunabilir. Başlama,
bitiş ve geçişler değiştirilemeyen execution event kayıtlarıyla denetlenebilir biçimde
saklanır; plan öğeleri yürütme durumuna göre görsel olarak ayrılır.

Bugün tamamlanan oturumların başlangıç ve bitiş zamanları sonradan düzeltilebilir.
Düzeltme başka bir oturumla çakışamaz, oturumu yeniden açıp kapatamaz ve önceki
değerleri `TIMES_CORRECTED` olayıyla append-only geçmişte korur. Gerçekleşen dakikalar
iş parçacığının toplam süresinden, alışkanlığın mevcut haftalık hedefinden düşülür;
görev kartları tamamlanan ve kalan süreyi gösterir. Execution geçmişi bulunan günlük
snapshot, bağlantıları koparacak şekilde yeniden üretilemez.

`Triggerlar` sayfası görevlerden görsel ve davranışsal olarak ayrılan kısa eylemleri
yönetir. İş parçacığı triggerları sonlu tekrar sayısıyla, alışkanlık triggerları sürekli
olarak çalışır. Kurallar belirli dakika aralıklarına veya kategori sonrasına bağlanabilir;
gerçekleşmeler ayrı geçmiş kayıtlarıdır. Vadesi gelen triggerlar öncelikli görünür ve
kullanıcı izniyle tarayıcı bildirimi gönderir.

## Ön koşullar

- Windows PowerShell 5.1 veya PowerShell 7+
- Node.js 20.19+, 22.12+ veya daha yeni desteklenen bir sürüm
- Java 17 veya daha yeni bir sürüm
- Lokal olarak çalışan PostgreSQL 16

Global Gradle kurulumu gerekmez. `backend/gradlew.bat` repoyla birlikte gelir.

## İlk kurulum

### 1. PostgreSQL rolü ve veritabanını oluşturun

Repo kökünde çalıştırın:

```powershell
.\scripts\bootstrap-database.ps1 -IncludeTestDatabases
```

Script PostgreSQL araçlarını PATH, çalışan Windows servisi veya standart kurulum
dizininden bulur. Aşağıdaki kaynakları oluşturur:

- Sınırlı uygulama rolü: `shiftarc_app`
- Uygulama veritabanı: `shiftarc`
- İzole entegrasyon veritabanı: `shiftarc_test`
- İzole tarayıcı testi veritabanı: `shiftarc_e2e`

Script yeni uygulama rolünün parolasını güvenli terminal istemiyle sorar. Bu
parolayı bir sonraki adımda lokal environment dosyasına yazın. Parolayı README,
commit mesajı, source code veya log içine yazmayın.

### 2. Lokal environment dosyasını hazırlayın

```powershell
Copy-Item .env.local.example .env.local
```

`.env.local` içindeki boş parola alanını lokal `shiftarc_app` parolasıyla
doldurun:

```dotenv
SHIFTARC_API_PORT=8080
SHIFTARC_DB_URL=jdbc:postgresql://localhost:5432/shiftarc
SHIFTARC_DB_USERNAME=shiftarc_app
SHIFTARC_DB_PASSWORD=
SHIFTARC_TEST_DB_URL=jdbc:postgresql://localhost:5432/shiftarc_test
SHIFTARC_E2E_DB_URL=jdbc:postgresql://localhost:5432/shiftarc_e2e
```

`.env.local` Git tarafından ignore edilir. `.env.local.example` hiçbir zaman
gerçek secret içermemelidir. Terminalde daha önce tanımlanmış environment
değerleri `.env.local` değerlerinden önceliklidir.

### 3. Frontend bağımlılıklarını kurun

```powershell
Set-Location frontend
npm ci
Set-Location ..
```

### 4. Ortamı doğrulayın

```powershell
.\scripts\dev.ps1 -Target all -CheckOnly
```

Bu komut servis başlatmadan Node.js, Java, PostgreSQL, portlar, Gradle Wrapper
ve zorunlu environment değerlerini kontrol eder.

### 5. Uygulamayı başlatın

```powershell
.\scripts\dev.ps1
```

Windows'ta aynı akış çift tıklanabilir başlatıcıyla da çalıştırılabilir:

```powershell
.\scripts\start-shiftarc.bat
```

Başlatıcı frontend ve backend süreçlerini birlikte açar. Lokal PostgreSQL'in
çalışıyor ve `.env.local` dosyasının hazırlanmış olması gerekir.

Servis adresleri:

- Frontend: <http://localhost:5173>
- API: <http://localhost:8080>
- Sistem durumu: <http://localhost:8080/api/v1/system/status>
- Actuator health: <http://localhost:8080/actuator/health>
- PostgreSQL: `localhost:5432`

Frontend teknik durum ekranı React, Spring Boot ve PostgreSQL bağlantılarını
ayrı ayrı gösterir. Süreçleri durdurmak için `Ctrl+C` kullanın. Lokal geliştirme
logları `logs/dev/` altında tutulur ve Git'e alınmaz.

## Servisleri ayrı çalıştırma

Yalnız frontend:

```powershell
.\scripts\dev.ps1 -Target frontend
```

Yalnız backend:

```powershell
.\scripts\dev.ps1 -Target backend
```

Doğrudan modül komutları da kullanılabilir:

```powershell
Set-Location frontend
npm run dev
```

```powershell
Set-Location backend
.\gradlew.bat bootRun --no-daemon --console=plain
```

## Kalite kontrolleri

Bütün lokal kalite kapısını repo kökünden çalıştırın:

```powershell
.\scripts\check.ps1
```

Bu komut sırasıyla şunları çalıştırır:

1. Frontend ESLint
2. Frontend Vitest testleri
3. Frontend TypeScript ve Vite production build
4. Backend JUnit testleri
5. Backend executable JAR build

Modül bazlı komutlar:

```powershell
Set-Location frontend
npm run lint
npm run test
npm run build
```

```powershell
Set-Location backend
.\gradlew.bat clean test bootJar --no-daemon --console=plain
```

Migration entegrasyon testi yalnız `shiftarc_test` veritabanına bağlanır. URL'nin
loopback host kullanması ve veritabanı adının `_test` veya `_e2e` ile bitmesi kod
tarafından zorunlu tutulur; `shiftarc` uygulama verisi testlerden etkilenmez.

## Repository yapısı

```text
ShiftARC/
├── backend/                 Spring Boot API ve Flyway migration'ları
├── contracts/openapi/       API kaynak doğrusu olan OpenAPI sözleşmesi
├── frontend/                React/Vite web uygulaması
├── scripts/                 Lokal bootstrap, dev ve kalite komutları
├── .env.local.example       Secret içermeyen environment şablonu
├── AGENTS.md                İnsanlar ve code agent'ları için çalışma kuralları
└── README.md                Kurulum ve proje özeti
```

Runtime veri akışı:

```text
Browser → Vite /api proxy → Spring Boot → JDBC/Hikari → PostgreSQL
```

Frontend PostgreSQL'e doğrudan erişmez. API bağlantıyı
`GET /api/v1/system/status` üzerinden `SELECT 1` ile doğrular.

## API sözleşmesi

API sözleşmesinin kaynak doğrusu:

```text
contracts/openapi/shiftarc-api.yaml
```

Mevcut ürün endpoint'leri:

- `GET /api/v1/workspace`
- `PATCH /api/v1/workspace/settings`
- `POST /api/v1/onboarding`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `PUT /api/v1/categories/{categoryId}`
- `DELETE /api/v1/categories/{categoryId}`
- `POST /api/v1/categories/{categoryId}/restore`
- `GET /api/v1/day-types`
- `POST /api/v1/day-types`
- `PUT /api/v1/day-types/{dayTypeId}`
- `DELETE /api/v1/day-types/{dayTypeId}`
- `POST /api/v1/day-types/{dayTypeId}/restore`
- `PUT /api/v1/day-types/{dayTypeId}/blocks`
- `GET /api/v1/weekly-plan`
- `PUT /api/v1/weekly-plan`
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `PUT /api/v1/tasks/{taskId}`
- `POST /api/v1/tasks/{taskId}/status/{status}`
- `GET /api/v1/daily-plan/today`
- `POST /api/v1/daily-plan/today/regenerate`
- `GET /api/v1/execution/today`
- `POST /api/v1/execution/start`
- `POST /api/v1/execution/finish`
- `POST /api/v1/execution/transition`
- `PATCH /api/v1/execution/sessions/{sessionId}/times`
- `GET /api/v1/system/status`

Bir endpoint veya payload değiştirildiğinde önce OpenAPI sözleşmesi, ardından
backend uygulaması, frontend tip/client kodu ve testler aynı değişiklik amacı
içinde güncellenmelidir.

Sistem durumu başarılı yanıtı:

```json
{
  "service": "shiftarc-api",
  "version": "0.1.0",
  "status": "UP",
  "database": "UP"
}
```

PostgreSQL erişilemezse API güvenli bir HTTP 503 Problem Details yanıtı döner;
JDBC exception veya bağlantı secret'ı response'a eklenmez.

## Veritabanı değişiklikleri

- Şema değişiklikleri yalnız Flyway migration'larıyla yapılır.
- Migration dosyaları `backend/src/main/resources/db/migration/` altındadır.
- Uygulanmış migration değiştirilmez veya yeniden adlandırılmaz.
- Yeni değişiklik yeni ve sıralı bir `V<n>__description.sql` dosyasıdır.
- Hibernate/JPA otomatik DDL üretimi kapalıdır.
- V1 uygulamaya ait `shiftarc` şemasını, V2 workspace ve planlama çekirdeğini,
  V3 ise günlük plan ve append-only çalışma geçmişini oluşturur.

## Güvenlik temeli

- Uygulama PostgreSQL superuser hesabıyla çalıştırılmaz.
- Gerçek parolalar ve bağlantı secret'ları Git'e alınmaz.
- Secret değerleri hata mesajlarına, API response'larına ve loglara yazılmaz.
- Actuator yalnız genel health endpoint'ini açar ve detay göstermez.
- Testler yalnız açıkça ayrılmış `shiftarc_test` ve `shiftarc_e2e`
  veritabanlarını değiştirebilir; uygulama veritabanına bağlanmaları engellenir.

## 0.1.0 geliştirme kapsamı dışında olanlar

- Authentication ve kullanıcı hesapları
- Belirli tarihlere ait gün tipi istisnaları
- Kullanıcı ayarlı günlük öncelik ve gelişmiş planlama algoritması
- Takvim tabanlı execution geçmişi ve ayrıntılı analiz
- Trigger ve pomodoro akışları
- Production deployment, container veya managed servis kurulumu
- Ödeme ve herkese açık kayıt

Bu sınırlar gelecekteki geliştirmeleri engellemek için değil, ilk teknik temeli
dar ve doğrulanabilir tutmak için vardır.

## Sorun giderme

`psql` PATH içinde bulunamıyorsa bootstrap script standart PostgreSQL kurulumunu
ve çalışan Windows servisini otomatik arar. Gerekirse dizini açıkça verin:

```powershell
.\scripts\bootstrap-database.ps1 `
  -PostgresBin "C:\Program Files\PostgreSQL\16\bin"
```

Port doluysa `dev.ps1` servisi başlatmadan önce PID bilgisini verir. Varsayılan
portlar `5173`, `8080` ve `5432`dir.

En güncel geliştirme ve commit kuralları için [AGENTS.md](AGENTS.md) dosyasını
okuyun.

## Sürüm notları

- [`0.0.1` — Lokal teknik temel](docs/releases/0.0.1.md)
