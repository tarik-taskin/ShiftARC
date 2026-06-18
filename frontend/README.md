# ShiftARC Web

React, TypeScript ve Vite tabanlı ShiftARC frontend uygulamasıdır.

Ana kurulum ve geliştirme akışı için repository kökündeki
[`README.md`](../README.md) ve [`AGENTS.md`](../AGENTS.md) dosyalarını kullanın.

Modül komutları:

```powershell
npm ci
npm run dev
npm run lint
npm run test
npm run build
```

Development sırasında `/api` istekleri Vite tarafından lokal Spring Boot API'ye
yönlendirilir. Port `SHIFTARC_API_PORT` environment değeriyle, varsayılan olarak
`8080` şeklinde belirlenir.
