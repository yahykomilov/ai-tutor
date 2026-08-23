# AI Tutor — Maktab uchun AI-yordamchi

> gamma.app ga shu matnni joylang (har bir `---` yangi slayd). Til: o'zbekcha.

---

## AI Tutor
### Maktab uchun AI-yordamchi

O'quvchiga darslarni **tushunishga** yordam beradigan sun'iy intellekt.
Javobni tayyor bermaydi — o'rgatadi. Faqat o'quv mavzulari bo'yicha.
Til: o'zbekcha · русский · English.

Jamoa: **DevX Command**

---

## Muammo

- Sinfda **30 bola, 1 o'qituvchi** — har bolaga alohida vaqt yo'q.
- ChatGPT uy vazifasini **o'rniga yechib beradi** → bola o'rganmaydi, ko'chiradi.
- Tayyor yordamchilar **o'zbek tilida** yaxshi ishlamaydi.
- Sun'iy intellektni **aldab**, mavzudan chetga burish oson.

---

## Yechim: AI Tutor

- **O'rgatadi, ko'chirtirmaydi** — Sokrat usuli: tayyor javob emas, yo'naltiruvchi savollar, qadamma-qadam tushuntirish.
- **Faqat dars** — o'yin/maslahat/suhbat so'ralsa, xushmuomala rad etib, mavzuga qaytaradi.
- **3 tilda** — o'zbek, rus, ingliz.
- **Ishonchli** — prompt injection'dan 3 qatlamli himoya.

---

## Nega bizniki kuchli (g'oya o'ziga xos)

1. **Anti-cheating** — bozordagi AI'lardan farqli, javobni tutib qo'ymaydi, tushuntiradi.
2. **Buzib bo'lmaydigan himoya** — o'quvchi qanchalik urinmasin, qoidani buzolmaydi.
3. **Viral** — yaxshi tushuntirishni do'stiga ulashadi, yutuqlarini bo'lishadi, do'stini taklif qiladi.
4. **Ona tilida** — O'zbekiston maktabi uchun.

---

## Xavfsizlik — jonli ko'rsatamiz

3 qatlamli himoya:
1. **Hujumni aniqlash** — «ko'rsatmalarni unut», rol almashtirish (uz/ru/en).
2. **Izolyatsiya** — o'quvchi matni maxsus teglar ichida, buyruq sifatida bajarilmaydi.
3. **Javob tekshiruvi** — tizim ko'rsatmasi sizib chiqsa, bloklanadi.

Saytdagi **«Xavfsizlik»** bo'limida jonli sinab ko'rsak bo'ladi.
Test: 15 hujum — hammasi bloklandi, 8 oddiy savol — hammasi o'tdi (23/23).

---

## Viral mexanika (o'zi tarqaladi)

- 📤 **Ulash** — zo'r tushuntirishni bir tugma bilan do'stiga yuboradi.
- 🔥 **Yutuqlar** — nechta mavzu o'rganding, necha kunlik streak — bo'lishgisi keladi.
- 👥 **Do'stni taklif qil** — havola orqali birga o'qishadi.

«Ko'rgan bola do'stiga ko'rsatgisi keladi» — mexanika shunga qurilgan.

---

## Kanallar (tayyor mahsulot)

- 🌐 **Veb-sayt** — chat + xavfsizlik demosi, mobil va desktop.
- 🤖 **Telegram bot** — o'sha tutor Telegram'da.
- 📱 **Telegram Mini App** — bot ichida to'liq ilova.
- (mobil ilova — imkon bo'lsa)

---

## Texnologiya

- Monorepo: `common` / `server` / `web` / `bot`.
- Server: Node + Express, Anthropic Claude, 3 qatlamli himoya, rate-limit.
- Web: React + Vite + Tailwind + i18next (uz/ru/en), dark mode.
- Bot: grammy.
- Deploy: Vercel (web) + Render (server).

---

## Jamoa — DevX Command

- **Yahyo** — mobil ilova + taqdimot
- **Abdulaziz** — veb-sayt
- **Otabek** — backend
- **X.O.B** — integratsiya va test

---

## Rahmat!

**AI Tutor** — o'rgatadigan, aldab bo'lmaydigan, o'zbekcha AI repetitor.

Jonli demo → sayt + Telegram bot.
