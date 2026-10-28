# STI CampusFlow v2 — Registrar Document Request & Appointment System

Rebuilt from the ASP.NET version into a plain **HTML + CSS + JavaScript** front end, a
**Node.js** backend and a **SQLite** database — with every item from the team's feedback
document (`minions_assemble.pdf`) built in.

**Nothing to install except Node.js.** No `npm install`, no XAMPP, no SQL Server. Node 22
has SQLite built in, so the whole backend runs from the standard library.

---

## 1. Run it

1. Install **Node.js 22.13 or newer** (the LTS from <https://nodejs.org> is fine — v24 works too).
2. Open this folder and double-click **`start.bat`** (Windows), or run:
   ```bash
   node server.js
   ```
3. Open **<http://localhost:3000>**.

The first start creates `data/campusflow.db` and fills it with demo data.

**Open it on your phone:** the console also prints a link like `http://192.168.1.5:3000`.
Open that on a phone connected to the same Wi-Fi. (Allow Node through the Windows firewall
if Windows asks.)

**Fresh demo data:** stop the server, delete the `data` folder, start again (or `npm run reset`).

**Live preview (no server):** `node tools/build-preview.js` builds
`dist/campusflow-preview.html` — the whole app in one file, running the same rules in the
browser with data saved in localStorage. Good for showing the design to the adviser.

### Demo accounts

| Role | How to sign in |
| --- | --- |
| Student | **Student** tab → `02000123456` / `Student@123` (or tap the demo button to fill it in) |
| Registrar head | **Registrar staff** tab → `REG-001` / `Registrar@123` |
| Registrar staff | `REG-002`, `REG-003` / `Registrar@123` |

New students make their own account from **Create your account** on the sign-in page.
Typing a new `@…sti.edu.ph` email in the picker creates a new student, so you can show the first-time setup.

---

## 2. What changed, item by item (from the feedback doc)

### Features
| Feedback | What we built |
| --- | --- |
| **1.** Paid docs (Good Moral, Form 137 & 138) need a payslip with the doc types, registrar's name and signature | Every request with a fee gets a printable **Payment slip** (order of payment) listing codes, copies, unit fees and total, with the **registrar's name, title and signature** and a **QR code**. Student pays at the Cashier, then **uploads the OR number + a photo of the receipt**. Registrar checks it (*Payment is correct* / *Not accepted* with a reason). Paid documents can't be marked ready until the payment is confirmed. **Form 138** was added to the catalogue. The head registrar draws the signature once under **Slip signature**; it prints on every payment slip and claim slip. |
| **2.** Notify a day before, "make sure you come at the exact time" | Automatic reminders **24 hours before** and **2 hours before** each appointment (in the bell, as a toast, and as a **browser pop-up** if the student turns it on). |
| **2.** Typhoon: students think the office is closed too | Registrar → **Closures & notices** → *Classes suspended, office open*. Every student booked that day is notified that the office **is open** and their appointment stays (they may also move it for free). The day shows a warning dot on the calendar and a notice on the claiming board. *Office closed* is also available for holidays — booked students are asked to pick a new time at no penalty. |
| **3.** Side announcements with who's claiming, by student number | **Claiming board** on the right side of every page (its own tab on phones): *"02000•••456 — Good Moral Certificate — 2:30 PM"*, with the student's own row highlighted as **You**, crossed out once claimed, plus seats left per window and registrar announcements. Middle digits are hidden for privacy (set `maskStudentNumbers: false` in `config.js` to show full numbers). |

### Design
| Feedback | What we built |
| --- | --- |
| **1.** Can't open on a phone | Fully responsive. Phones get a bottom tab bar, one-column layouts, bottom-sheet dialogs, big tap targets, and safe-area support for notched phones. Tested at 390 px and 1440 px wide. |
| **2.** Cards too white, can't tell forms apart | Cards now have a visible border and shadow on a tinted page background, plus a **mild colour stripe on the left side** per category (records, certifications, clearances, enrollment). A selected document gets a coloured outline, tinted fill and check mark. |
| **3.** Dark mode | Moon/sun button in the top bar; Light / Dark / Match my device under Account. Remembered per browser. |
| **4.** Font style | Body: **Atkinson Hyperlegible Next** (made for easy reading). Headings: **Bricolage Grotesque**. Falls back to Segoe UI if offline. |
| **5.** Centered when zoomed out | The whole app sits in a centered frame (max 1440 px), and page content is centered inside it. |

### System
| Feedback | What we built |
| --- | --- |
| **1.** Cancel right away or give extra time? | **Both, in steps.** A **30-minute grace period** after the window ends. If still not claimed, the request becomes **Missed — on hold** (not cancelled) and the student has **7 days** to pick a new time. Only after that is it closed as *Not claimed*. Students can move an appointment up to **2 times**. All numbers are in `config.js`. |
| **2.** Limit so students don't conflict | **One-hour windows (8 AM, 9 AM, 10 AM… 4 PM) with 8 seats each** (configurable, and adjustable per day by the registrar). Seats are checked **on the server inside a database transaction**, so two students can't grab the last seat at once. A student can only have **one appointment per day** and **3 open requests**; the calendar marks days they already booked. The calendar also blocks days before the documents can be ready (e.g. Transcript needs 5 working days). |

---

### v2.1 changes
- **Hour-only time windows.** Students pick 8 AM, 9 AM, 10 AM… 4 PM (lunch 12–1 PM is closed). Times show without minutes ("2 PM to 3 PM"). Change `slotMinutes` / `defaultSlotCapacity` in `config.js`.
- **QR code instead of a barcode** on both the payment slip and the claim slip. Scanning it opens a live, signed copy of that slip **without signing in**, showing the current status, so the Registrar can scan it at the window to confirm it's genuine. The link carries an HMAC token (`data/.slip-secret`), so slip links can't be guessed or faked.
- **Download as image.** Every slip has a *Download as image* button that saves a PNG (with the QR and signature) to the phone's Downloads/Photos, plus *Print or save as PDF*.
- The QR points to this computer's Wi-Fi address so phones on the same network can open it. Once hosted online, set `publicUrl` in `config.js` (or the `PUBLIC_URL` environment variable) to the real address.
- **After updating from v2.0, delete the `data` folder once** so the demo data is recreated with hourly times.

### v2.2 — ready for web hosting
- **Hosting files:** `render.yaml` (Render), `Dockerfile` (Railway, Fly.io, any VPS), and **`DEPLOY.md`** with click-by-click steps.
- **Host detection:** on Render/Railway/Fly the QR codes automatically use the site's `https://` address.
- **Data folder setting:** `DATA_DIR` keeps the database on the host's persistent disk.
- **Real-use mode:** `SEED_MODE=minimal` starts with only the document list and the head registrar account (`ADMIN_PASSWORD`), and hides the demo buttons on the sign-in page.
- **Public-site safety:** change password (Account page), login throttling, Secure cookies + HSTS over https, `/health` check, clean shutdown on redeploy.

### v2.3
- **Everyone signs in with a password.** Students use their student number or school email, staff use their staff ID. Passwords are hashed with PBKDF2-SHA256 at 210,000 iterations with a random salt for each account, so the database never holds a usable password. Sign-ups only accept school email domains (`ALLOWED_EMAIL_DOMAINS`).
- **Email notices through Gmail, with the student choosing where.** Every notification in the app is also emailed. In **Account → Email notices** a student picks one of three: their **school email** (the Outlook address they signed up with), a **personal email** such as Gmail, or **no email at all**, in which case notices stay in the bell. A personal address only starts receiving mail after a 6-digit code sent to it is typed back in, so a typo cannot send appointment details to a stranger. This matters because mail from a Gmail sender often lands in a school Outlook Junk folder. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` (see DEPLOY.md); leave them blank and the messages print in the console instead.
- **Registrar staff** keep staff ID + password, on their own tab.
- **"Change password" removed** for everyone.
- **Registrar can upload a signature image.** The paper background is removed automatically; drawing still works too.

## 3. Project structure

```
server.js                 HTTP server: static files, JSON API, sessions, reminder timer
config.js                 Office rules (hours, window length, seats, grace period…)
core/
  logic.js                ALL business rules + every API endpoint (shared with the preview)
  repo-sqlite.js          Every SQL statement (parameterised)
  repo-memory.js          Same functions in memory — used by the live preview
  seed.js                 Demo data
database/schema.sql       Tables, keys, indexes, checks (for the ERD chapter)
public/
  index.html              App shell
  css/app.css             Design system: light/dark tokens, components, responsive rules
  js/api.js               fetch() client (+ in-browser demo mode)
  js/app-core.js          Router, layout, icons, toasts, notifications polling, QR helper
  js/vendor/qrcode.js     QR encoder (Kazuhiko Arase, MIT licence) — works offline
  js/app-shared.js        Claiming board, calendar picker, sign in/up, notifications, account
  js/app-student.js       Student home, request wizard, my requests, request details
  js/app-registrar.js     Dashboard, queue, request review, claiming list, notices, signature, slips
tools/build-preview.js    Builds the single-file live preview
render.yaml, Dockerfile   Web hosting setup (see DEPLOY.md)
```

**Architecture in one sentence (for the panel):** a single-page front end talks to a JSON
REST API; the API's rules live in `core/logic.js` and reach the database only through a
repository object, so the same rules run against SQLite on the server and against memory in
the preview.

### Tables
`users`, `document_types`, `requests`, `request_items`, `status_history`, `closures`,
`capacity_overrides`, `notifications`, `announcements`, `settings`. See `database/schema.sql`.

### Request statuses
`pending → approved → processing → ready → released`, plus `rejected`, `cancelled`,
`missed` (on hold, can be rescheduled) and `noshow` (closed). Payment has its own track:
`none | unpaid → submitted → verified` (or `rejected` → re-upload).

### Main API endpoints
| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/login` (staff), `/api/auth/logout`, `/api/me/profile` (student number, once) | — |
| GET | `/api/documents`, `/api/availability?month=&docs=`, `/api/slots?date=` | signed in |
| GET/POST | `/api/requests`, `/api/requests/:id` | student (own) / registrar (all) |
| POST | `/api/requests/:id/cancel`, `/reschedule`, `/payment` | student |
| POST | `/api/requests/:id/transition`, `/verify-payment`, `/api/requests/bulk-approve` | registrar |
| GET | `/api/board` | signed in (claiming board) |
| GET | `/api/public/slip/:ref?t=token` | anyone with the QR link |
| GET | `/api/registrar/dashboard`, `/api/registrar/manifest?date=` | registrar |
| GET/POST/DELETE | `/api/closures`, `/api/capacity`, `/api/announcements` | registrar |
| GET/POST | `/api/notifications`, `/api/notifications/read` | signed in |
| GET/POST | `/api/settings` (registrar name + signature) | read: all · write: head |

---

## 4. Security notes (for the manuscript)
- Passwords: **PBKDF2-SHA256, 210,000 iterations, 16-byte random salt per account**, compared with `timingSafeEqual`. Raising the work factor upgrades each password automatically on its owner's next sign-in. A wrong password and an unknown account return the same message, so the page cannot be used to discover who is registered.
- Staff passwords: **PBKDF2-SHA256, 100,000 iterations, random salt per user**, constant-time compare.
- Sessions: random 256-bit token in an **HttpOnly, SameSite=Lax** cookie, 8-hour sliding expiry.
- **CSRF**: every write must carry the `X-Requested-With: CampusFlow` header, which a
  cross-site form cannot send.
- **SQL injection**: every query uses `?` placeholders (`core/repo-sqlite.js`).
- **XSS**: all user text is escaped before it touches the page (`esc()` in `app-core.js`).
- Students can only open, pay, move or cancel **their own** requests; role checks on every endpoint.
- Login gives one generic error for wrong ID or wrong password.
- Receipt photos are shrunk in the browser and size-limited on the server.

## 5. Changing the rules
Edit `config.js` and restart: opening hours, window length, seats per window, lunch break,
booking range, lead time, grace period, reschedule window, reminder timing, masking.

## 6. Moving to MySQL later
`database/schema.sql` is standard SQL. Swap `core/repo-sqlite.js` for a MySQL version with the
same function names (e.g. using `mysql2`) — nothing in `core/logic.js` or the front end changes.
