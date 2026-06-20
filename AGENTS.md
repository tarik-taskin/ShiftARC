# ShiftARC Agent ve Geliştirme Kuralları

Bu dosya repository üzerinde çalışan insan geliştiriciler ve yapay zekâ code
agent'ları için yaşayan çalışma sözleşmesidir. Mimari, komutlar veya geliştirme
kuralları değiştiğinde aynı amaç kapsamındaki commit içinde güncellenmelidir.

## Ürün bağlamı

ShiftARC; günlük ve haftalık planlama, zaman analizi, takvim kontrolü, görev
önceliklendirme, trigger ve pomodoro özelliklerine doğru gelişecek web tabanlı
bir planlama uygulamasıdır.

Mevcut `0.1.0` geliştirme serisi ilk kullanılabilir lokal ürün akışını kurar.
React, Spring Boot ve PostgreSQL temeli hazırdır; domain özellikleri fazlar
halinde sözleşme, backend ve frontend birlikte güncellenerek eklenir.

## Repository haritası

- `frontend/`: React 19, TypeScript 6 ve Vite 8 web uygulaması
- `backend/`: Spring Boot 4.1, Java 17 ve Gradle Kotlin DSL API uygulaması
- `contracts/openapi/`: REST API kaynak doğrusu
- `scripts/`: PostgreSQL bootstrap, lokal geliştirme ve kalite komutları
- `docs/releases/`: sürüm kapanış notlarının hedef dizini

Generated build çıktıları, dependency klasörleri, loglar ve lokal secret dosyaları
Git'e alınmaz.

## Çalışmaya başlamadan önce

1. `git status --short --branch` ile çalışma ağacını kontrol et.
2. Kullanıcıya ait mevcut değişiklikleri silme, resetleme veya üzerine yazma.
3. İlgili kodu, sözleşmeyi ve testleri değişiklikten önce oku.
4. Görevin kapsamı dışında refactor veya dependency ekleme.
5. Secret değerlerini komut çıktısına veya konuşmaya taşıma.

Repository kirliyse yalnız görevle ilgili dosyaları değiştir. İlgili kullanıcı
değişikliğiyle güvenli biçimde çalışılamıyorsa durumu açıkça bildir.

## Temel komutlar

Ortam kontrolü:

```powershell
.\scripts\dev.ps1 -Target all -CheckOnly
```

Lokal uygulama:

```powershell
.\scripts\dev.ps1
```

Tam kalite kapısı:

```powershell
.\scripts\check.ps1
```

Frontend:

```powershell
Set-Location frontend
npm ci
npm run lint
npm run test
npm run build
```

Backend:

```powershell
Set-Location backend
.\gradlew.bat clean test bootJar --no-daemon --console=plain
```

Uygulama kodu değiştiğinde en az ilgili modül test/build komutları çalıştırılır.
Ortak sözleşme, script veya release değişikliklerinde tam kalite kapısı tercih
edilir.

## Mimari kurallar

### Frontend

- TypeScript strict kontrollerini zayıflatma.
- API çağrılarını React componentlerine dağıtma; `src/api/` client katmanını kullan.
- `unknown` response'ları runtime doğrulamadan güvenilir tipe dönüştürme.
- Loading, success, error ve retry durumlarını açıkça modelle.
- Responsive davranış ve klavye/ekran okuyucu erişilebilirliğini koru.
- Animasyonlar `prefers-reduced-motion` tercihine uymalıdır.
- Tema renklerini component içine gömme; `data-theme` ve merkezi CSS token
  manifestlerini kullan.

### Backend

- Ana paket `com.shiftarc.api` altında kalır.
- Controller yalnız HTTP dönüşümünü; service uygulama davranışını yönetir.
- JPA entity/repository katmanı persistence ayrıntısını service katmanından ayırır.
- Hibernate şemayı yalnız `validate` eder; create/update DDL yetkisi verilmez.
- JDBC veya internal exception ayrıntılarını API response'una taşıma.
- Kullanıcıya dönen hatalarda standart Problem Details biçimini kullan.
- Lokal profile ait secret doğrulamasını kaldırma veya sessiz varsayılan parola ekleme.
- Executable JAR sürümü Gradle build metadata'sından gelir.

### API sözleşmesi

- `contracts/openapi/shiftarc-api.yaml` kaynak doğrudur.
- Endpoint, method, status code veya payload değişikliği önce sözleşmede yapılır.
- Backend, frontend client/type ve testler sözleşmeyle aynı commit kapsamında
  güncellenir.
- Breaking değişiklikler açıkça belirtilmeden mevcut `/api/v1` davranışını bozma.

### Kategori davranışı

- Kategori silme fiziksel silme değildir; arşivleme ve geri yükleme akışını koru.
- İsim benzersizliği çalışma alanı içinde ve büyük-küçük harf ayrımından bağımsızdır.
- Güncelleme, arşivleme ve geri yüklemede istemcinin gönderdiği optimistic-lock
  sürümünü doğrula; çakışmaları standart Problem Details yanıtıyla bildir.
- Görev oluşturma gibi başka akışlardan kategori eklemek gerektiğinde mevcut
  `CategoryDialog` bileşenini yeniden kullan.

### Gün tipi davranışı

- Her gün tipi zaman çizelgesi 00:00–24:00 aralığını boşluk ve çakışma olmadan
  tamamen kapsamalıdır.
- Blok sınırları beş dakikalık ızgaraya uymalı; sıralama istemciden gelse bile
  backend bütün çizelgeyi yeniden doğrulamalıdır.
- Zaman blokları yalnız aynı çalışma alanındaki aktif kategorileri kabul eder.
- Gün tipi silme fiziksel silme değildir; arşivleme ve optimistic-lock sürümünü koru.
- Haftalık gün atamalarını gün tipi editörüne ekleme; bu davranış ayrı ürün fazıdır.

### Haftalık plan davranışı

- Haftanın günleri ISO-8601 düzeninde `1=Pazartesi` ile `7=Pazar` arasında tutulur.
- Haftalık şablon kısmi kaydı kabul eder; `complete` yalnız yedi gün de atandığında
  true olur.
- Tek bir gün iki kez gönderilemez ve yalnız aktif, aynı workspace'e ait gün tipleri
  yeni atamalarda kullanılabilir.
- Bütün atamaları tek transaction içinde değiştir ve workspace settings sürümüyle
  optimistic-lock kontrolü uygula.
- Belirli tarihlere ait istisnaları tekrar eden haftalık şablona karıştırma.

### Görev davranışı

- `WORK_ITEM` yalnız son tarih ve beş dakikalık toplam süre; `HABIT` yalnız beş
  dakikalık haftalık hedef taşır. Tip alanlarını backend'de birlikte doğrula.
- Bütün görevler 1–5 önem derecesine sahiptir ve sıfır veya daha fazla aktif
  workspace kategorisine bağlanabilir.
- Tamamlama `completed_at` üretmeli; yeniden aktifleştirme veya arşivleme bu alanı
  temizlemelidir. Fiziksel silme yapma.
- Güncelleme ve durum geçişlerinde optimistic-lock sürümünü zorunlu tut.
- Yeni görev gerektiren farklı ekranlarda ayrı form üretme; `TaskDialog` bileşenini
  yeniden kullan. Dialog içinden `CategoryDialog` ile kategori ekleme akışını koru.

### Günlük plan davranışı

- Günlük plan aynı workspace ve tarih için tek snapshot'tır; sıradan GET mevcut planı
  değiştirmemeli veya yeniden üretmemelidir.
- Tarih ve saat hesabını sunucu varsayılanından değil workspace IANA saat diliminden yap.
- Plan blokları gün tipinin snapshot kopyasıdır; kaynak gün tipi sonradan değişse bile
  mevcut plan sessizce değişmemelidir.
- Görev yerleşiminde kategori kesişimi zorunludur. Günlük istekleri beş dakikaya
  yuvarla ve sığmayan süreyi `daily_plan_warning` içinde görünür biçimde sakla.
- Algoritma şimdilik deterministik başlangıç yaklaşımıdır; gerçekleşen süreyi düşme,
  kullanıcı ayarlı öncelik ve daha gelişmiş dağıtım sonraki fazlarda eklenmelidir.
- Yeniden üretim yalnız aktif plan ve doğru optimistic-lock sürümüyle yapılmalıdır.

### Görev yürütme davranışı

- Workspace başına en fazla bir açık `task_execution_session` bulunabilir.
- Başlatma yalnız bugünün aktif planındaki `PLANNED` öğeyi `ACTIVE` yapar.
- Bitirme oturumu kapatıp bağlı plan öğesini `COMPLETED` yapmalıdır.
- Sıradaki göreve geçiş mevcut bitiş ve yeni başlangıcı tek transaction içinde yapar.
- `STARTED`, `FINISHED` ve `TRANSITIONED` olayları append-only tabloya eklenir;
  uygulanmış execution event'i güncelleme veya silme.
- İstemciden gelen zaman gelecekte olamaz; bitiş başlangıçtan kesinlikle sonra olmalıdır.
- Zaman düzeltmesi oturumun açık/kapalı durumunu değiştiremez, başka oturumla
  çakışamaz ve önceki/yeni değerleri `TIMES_CORRECTED` olayıyla kaydetmelidir.
- Gerçekleşen dakika iş parçacıklarında tüm bitmiş oturumlardan, alışkanlıklarda
  workspace saat dilimine göre mevcut haftanın bitmiş oturumlarından hesaplanır.
- Execution kaydı bulunan günlük planı blokları silerek yeniden üretme; geçmiş item
  bağlantılarını ve snapshot bütünlüğünü koru.

### Veritabanı

- Uygulama `shiftarc_app` sınırlı rolüyle çalışır; PostgreSQL superuser kullanma.
- Şema değişiklikleri yalnız Flyway migration'larıyla yapılır.
- Uygulanmış migration'ı düzenleme, silme veya yeniden adlandırma.
- Yeni migration adı `V<n>__lowercase_description.sql` biçimindedir.
- Hibernate/JPA `ddl-auto` ile schema oluşturma veya güncelleme yapma.
- Testleri `shiftarc` veya production veritabanına bağlama. PostgreSQL entegrasyon
  testleri yalnız loopback üzerindeki `_test`/`_e2e` son ekli izole veritabanlarını
  kullanabilir.
- Sahte örnek domain tablolarını yalnız altyapıyı kanıtlamak için oluşturma.

## Secret ve güvenlik kuralları

- `.env.local` ve gerçek secret dosyaları commit edilmez.
- `.env.local.example` boş veya güvenli örnek değerler taşır.
- Parola, token, cookie, bağlantı string'i veya kişisel veri loglanmaz.
- Secret değerlerini test fixture, screenshot, commit mesajı veya release note içine
  koyma.
- Yeni dış endpoint veya actuator yüzeyi varsayılan olarak kapalı kabul edilir.
- Dependency eklerken bakım durumu, lisans, bundle/runtime etkisi ve audit sonucu
  kontrol edilir.

## Test yaklaşımı

Frontend değişikliklerinde ilgili senaryolar Testing Library ile kullanıcı
davranışı üzerinden test edilir. Implementation detail veya CSS class'a bağımlı
test yerine accessible role ve görünür metin tercih edilir.

Backend değişikliklerinde:

- Saf service davranışı birim testiyle,
- HTTP sözleşmesi MockMvc ile,
- Configuration fail-fast davranışı context testiyle,
- Migration naming ve kaynak bütünlüğü otomatik testle korunur.
- PostgreSQL constraint ve migration zinciri `shiftarc_test` üzerinde boş şemadan
  başlayarak doğrulanır; test URL güvenlik kontrolü geçmeden destructive hazırlık
  işlemi çalıştırılmaz.

Bug fix commit'i mümkünse önce hatayı yeniden üreten test içermelidir.

## Kod ve dosya standartları

- Repository metin dosyaları LF ve UTF-8 kullanır.
- Java/Kotlin/Gradle girintisi 4, TypeScript/JSON/YAML/CSS/SQL girintisi 2 boşluktur.
- Generated veya binary dosyaları metin aracıyla yeniden yazma.
- Geçici debug kodu, console log, commented-out blok veya gerçek secret bırakma.
- Yeni dosya ve isimler İngilizce; kullanıcıya görünen mevcut UI metinleri Türkçe
  olabilir ve ileride i18n anahtarlarına taşınacaktır.

## Git ve commit zorunluluğu

Her görev sonunda veya uzun görevlerde belirli bir amacı tamamlayan değişiklik
grubu sonunda aşağıdaki akış uygulanır:

```powershell
git add .
git commit -m "<type>(<scope>): <description>"
```

Commitler mümkün olduğunca tek bir işlevi veya amacı karşılayacak kadar küçük
olmalıdır. Küçük değişikliklerde bir commit yeterlidir. Büyük planlar genel olarak
8 veya daha fazla anlamlı commit'e bölünmelidir.

Örnekler:

```text
feat(frontend/employees): limit shift list
fix(frontend/bills): fix Turkish labels
feat(api): add system status endpoint
test(project): add foundation quality checks
docs(project): add development guidance
```

- Başarısız test veya yarım migration commit edilmez.
- Kullanıcı açıkça istemeden commit amend, rebase, force push veya history rewrite
  yapılmaz.
- Görev sonunda oluşturulan bütün commit hash ve mesajları kullanıcıya bildirilir.
- Çalışma ağacı mümkünse temiz bırakılır.

## Sürüm ve dokümantasyon

- Paket ve API sürümleri bilinçli kilometre taşlarında birlikte değerlendirilir.
- Her sürüm kapanışında `docs/releases/<version>.md` oluşturulur.
- Sürüm notu yalnız commit listesini tekrarlamaz; davranış, mimari, veri, güvenlik,
  test ve bilinen sınır değişikliklerini açıklar.
- Mimari gerçek veya agent çalışma kuralı değiştiğinde `AGENTS.md` güncellenir.
- Kurulum komutu veya prerequisite değiştiğinde root `README.md` güncellenir.

## Mevcut kapsam sınırı

`0.1.0` içinde authentication, trigger, pomodoro ve production deployment yoktur.
Kategori, gün tipi, haftalık şablon, görev yönetimi, temel günlük plan, görev yürütme
ve zaman düzeltme kullanılabilir; tarih istisnaları ve takvim geçmişi özellikleri yalnız
tanımlanan ürün fazlarında eklenir. Kullanıcı farklı bir faz istemedikçe ileri fazları
altyapı görevi bahanesiyle erkenden uygulama.
