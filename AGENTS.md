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

### Backend

- Ana paket `com.shiftarc.api` altında kalır.
- Controller yalnız HTTP dönüşümünü; service uygulama davranışını yönetir.
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
Kategori, gün tipi, görev, günlük plan ve geçmiş özellikleri yalnız tanımlanan
ürün fazlarında eklenir; kullanıcı farklı bir faz istemedikçe ileri fazları
altyapı görevi bahanesiyle erkenden uygulama.
