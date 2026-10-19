# R0B — manifest trước phê duyệt

Trạng thái: **READY_FOR_APPROVAL**. Chưa stage, commit, push hoặc deploy. Kết quả bên dưới là kiểm tra local; không thay cho QA của Owner hoặc kết quả Actions/Pages.

Branch dự kiến: `main`, origin `https://github.com/VesperKrock/laneforge-game.git`.
HEAD gốc: `7e39337cea684e5a70c852034c83e4ec418b0a86`.
Mục đích commit dự kiến: `Prepare public-safe R0B Phaser prototype and Pages workflow`.

## Allowlist dự kiến commit — 22 file

| File | Thay đổi |
| --- | --- |
| `.gitignore` | Mới — prompt, secret/local data, dependency, build/test output |
| `.nvmrc` | Mới — Node 24 LTS cho prototype/CI |
| `.github/workflows/deploy-pages.yml` | Mới — build/security gate/upload dist/deploy Pages |
| `README.md` | Bổ sung — giữ phần giới thiệu gốc, hướng dẫn chạy/kiểm thử và docs |
| `docs/GAME_DESIGN.md` | Mới — baseline và phạm vi demo |
| `docs/UNITS.md` | Mới — bốn hướng Owner đề xuất và ứng viên chưa duyệt |
| `docs/SPELL_CARDS.md` | Mới — bậc thẻ/mục tiêu, tách đề xuất chưa khóa |
| `docs/DECISIONS.md` | Mới — confirmed / approved R0B / open |
| `docs/ROADMAP.md` | Mới — mốc đề xuất, R0B không phải R1 |
| `docs/R0B_REVIEW.md` | Mới — manifest và bằng chứng kiểm tra |
| `index.html` | Mới — UI năm slot, chỉ slot đầu hoạt động |
| `package.json` | Mới — scripts, exact dependencies, private package |
| `package-lock.json` | Mới — dependency lockfile, không phải dependency output |
| `tsconfig.json` | Mới — strict typecheck |
| `vite.config.ts` | Mới — project base path, không copy public hoặc đọc .env |
| `playwright.config.ts` | Mới — production preview/browser checks |
| `src/main.ts` | Mới — khởi tạo Phaser và UI |
| `src/style.css` | Mới — bố cục responsive, font local |
| `src/game/Battle.ts` | Mới — mô phỏng demo giới hạn |
| `src/game/BattleScene.ts` | Mới — dựng hình học/căn cứ/đơn vị |
| `scripts/security-gate.mjs` | Mới — allowlist và heuristic kiểm tra public source/artifact |
| `tests/smoke.spec.ts` | Mới — kiểm tra tương tác thật trên production preview |

Không bao gồm prompt, environment, credentials, dependency output, `dist/`, screenshot, report hay dữ liệu local. Không stage trước bước xin duyệt. Sau khi duyệt, chỉ stage các đường dẫn allowlist cụ thể, kiểm tra lại index/build/security rồi mới commit và push fast-forward.

## Kết quả thực tế

| Kiểm tra | Kết quả quan sát ngày 19/10/2026 |
| --- | --- |
| Git root / origin / branch / HEAD | Root đúng, origin đúng, `main`, HEAD gốc giữ nguyên; không di chuyển repository lần nữa |
| Cài dependency | `npm install --ignore-scripts --no-fund` PASS trên Node 22.19.0 / npm 10.9.3 |
| Cài sạch từ lockfile | `npm ci --ignore-scripts --no-fund` PASS trên Node 24.22.0 / npm 11.19.1 |
| Runtime cho CI | Node 24; đã kiểm chứng local bằng Node 24.22.0 từ archive Node.js chính thức, SHA-256 đối chiếu `SHASUMS256.txt`; không thay Node hệ thống |
| Phiên bản khóa | Phaser 3.90.0, TypeScript 7.0.2, Vite 8.3.4, Playwright 1.64.1, Node types 24.19.2 |
| Typecheck + production build | `npm run build` PASS trên Node 22 và 24; `tsc --noEmit` chạy trong build |
| Browser production preview | `PLAYWRIGHT_CHANNEL=chrome npm run test:browser`: **2 passed (20.7s)** trên Node 24; trình duyệt Chrome cài sẵn, không dùng mô phỏng DOM |
| Luồng triệu hồi | Canvas hiện, năm slot, slot 01 trừ Vàng, khóa trong CD, có thể triệu hồi lại, có đòn trúng, phá căn cứ địch và thắng |
| Luồng thua/restart/resize | Không triệu hồi dẫn tới thua; chơi lại reset HP/Vàng/quân/đòn trúng; resize 390×844 rồi triệu hồi được, không tràn ngang |
| Browser errors/network | Không có pageerror, console error, requestfailed, HTTP từ 400 hoặc request ra ngoài host local trong hai bài test cuối |
| Lỗi đã sửa | Lượt browser test đầu thất bại vì favicon 404; thêm favicon SVG nội tuyến, build và chạy lại cả hai test thành công |
| Dev server | Probe Node 24: trang và module entry dưới `/laneforge-game/` trả 200; hai prompt, `.git/config`, archive toolchain local trả 403; probe server đã dừng |
| Dependency advisory | `npm audit`: 0 vulnerability được báo tại thời điểm kiểm tra; không phải bảo đảm không có lỗ hổng chưa công bố |
| Source/index/artifact gate | `npm run security:check`: PASS_HEURISTIC; 22 candidate files, index không có file staged, không có prompt tracked, 17 ignore probes đạt; không có phát hiện theo mẫu kiểm tra |
| Artifact thực tế | Chỉ `dist/index.html`, một JS và một CSS có hash; URL JS/CSS dùng `/laneforge-game/assets/` và có file tương ứng; không có prompt, environment, source map hay local data |
| Nội dung/lịch sử Git | Trước R0B chỉ README tracked và một initial commit; review tên file lịch sử reachable không phát hiện prompt/private path. Không quét author metadata hoặc mọi nội dung lịch sử bằng công cụ chuyên dụng |
| Review thủ công | Đã đọc prospective source/config/docs, metadata lockfile và workflow; dependency resolution dùng npm registry HTTPS kèm integrity; không thêm dịch vụ/secret/environment |
| Text/link checks | `git diff --check` PASS cho tracked diff; kiểm tra riêng cả 22 file UTF-8, cuối dòng, whitespace và link Markdown local không phát hiện lỗi |
| Workflow | Năm official action refs được đối chiếu tag release → commit SHA trên repo `actions/*`; chỉ `dist/` được upload; chưa chạy workflow trên GitHub |

Browser tests tự khởi chạy/dừng production preview. Screenshot/report/trace và Node toolchain chỉ nằm trong các đường dẫn local đã ignore, không có trong manifest public. Không chạy gameplay QA toàn diện hay thử trên thiết bị thật; bài mobile là viewport Chrome desktop 390×844.

## Pages và việc Owner cần làm

API repo xác nhận public và `has_pages: false`; API Pages trả 404 ở preflight. **PAGES_WAIT_OWNER_SETTING / NOT_PUBLISHED**. Chưa thay đổi settings từ công cụ.

Owner mở [Settings → Pages](https://github.com/VesperKrock/laneforge-game/settings/pages) → **Build and deployment → Source → GitHub Actions**. URL dự kiến: https://vesperkrock.github.io/laneforge-game/.

Sau khi Owner duyệt commit/push R0B trong hội thoại, cần fresh-check index/worktree, security và build, commit đúng manifest, push thường, theo dõi Actions và mở URL kiểm chứng. Chưa quan sát các bước này nên chưa thể báo `PUSHED`, `ACTIONS_PASS` hay `PAGES_LIVE`.

## Giới hạn

- Thư mục con rỗng còn tồn tại ở preflight R0B nhưng **không còn tồn tại ở kiểm tra cuối**. Các thao tác R0B không xóa hoặc di chuyển thư mục này; không xác định tác nhân cleanup. Git root vẫn giữ nguyên, không có `.git` thứ hai.
- Demo dùng số/hình tạm, một slot có chức năng và hai địch kịch bản; không phải combat R1 hoàn chỉnh.
- Scanner chỉ dùng heuristic và review thủ công. Không có bảo đảm bảo mật toàn diện; ignore không sửa tracked files hoặc lịch sử.
- Không có Gitleaks sẵn trong môi trường; gate nội bộ kiểm tra allowlist, mẫu credential/PII, tên file lịch sử và artifact. Chỉ log loại phát hiện/đường dẫn, không log giá trị khớp.
- JS Phaser khoảng **1,204.12 kB** minified (**321.98 kB gzip**), nên Vite cảnh báo chunk lớn hơn 500 kB. Không che cảnh báo; chưa tối ưu bundle trong smoke test này.
- Workflow đã chuẩn bị local, chưa chạy trên GitHub. Dependency audit có thể thay đổi khi có advisory mới.
