# laneforge-game
A 2D lane-based strategy game featuring weapon classes, spell cards, and tactical unit deployment

LaneForge là game chiến thuật/thủ thành 2D trên một chiến tuyến ngang: chuẩn bị năm slot, chọn thời điểm triệu hồi bằng Vàng + Cooldown, để đơn vị tự tiến và giao chiến.

## Bản thử R0B

Phaser 3 + TypeScript + Vite. Bản thử có hai căn cứ, một lane, nút Bắt đầu/Chơi lại, một slot Trường Kiếm hoạt động và bốn slot dự phòng. Triệu hồi tốn 25 Vàng demo, hồi chiêu 2 giây; đơn vị tự tiến, đánh hai lính địch kịch bản rồi đánh căn cứ. Có kết quả thắng/thua, thanh HP và bộ đếm đòn trúng.

**TẠM THỜI / CHƯA CÂN BẰNG:** toàn bộ chỉ số/hình học chỉ phục vụ smoke test. Chưa có chuẩn bị đội hình, gameplay hoàn chỉnh, Spell Card, tiến hóa, campaign, lưu game hay PvP. Demo không có backend, tài khoản, analytics hoặc dịch vụ ngoài.

## Chạy local

Khuyến nghị Node.js **24 LTS** (`.nvmrc`). Node 22 từ 22.12 cũng được khai báo hỗ trợ. Dùng npm đi kèm Node; xem phiên bản thực tế đã kiểm tra trong [biên bản R0B](docs/R0B_REVIEW.md). Dependency được khóa trong `package-lock.json`.

```sh
npm install --ignore-scripts
npm run dev
```

Mở `http://127.0.0.1:5173/laneforge-game/`. Bấm **Bắt đầu** → **Trường Kiếm**; chờ CD rồi triệu hồi tiếp. Bấm **Chơi lại** để reset. Để địch tự tiến mà không triệu hồi sẽ dẫn tới thua. Bản thử giới hạn bước thời gian khi tab bị ẩn, không mô phỏng bù cả khoảng thời gian vắng mặt.

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

Kiểm tra bản production tại `http://127.0.0.1:4173/laneforge-game/`, không chỉ tại `/`. Dừng server bằng Ctrl+C. `build` chạy TypeScript check rồi sinh `dist/`. Có thể dùng `npm ci --ignore-scripts` cho cài đặt sạch theo lockfile.

## Kiểm tra

```sh
npm run typecheck
npm run build
npm run security:check
npm audit
npx playwright install chromium
npm run test:browser
```

Browser tests khởi chạy production preview riêng ở port 4173. Nếu dùng Chrome đã cài trên Windows, có thể bỏ bước tải Chromium và chạy trong PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm.cmd run test:browser
```

Scanner nội bộ kiểm tra allowlist, tracked/staged/untracked candidates, ignore rules, mẫu credential/PII và file trong `dist/`. Đây là heuristic, không bảo đảm phát hiện mọi secret. Không đưa secret vào frontend, kể cả biến `VITE_`. Không commit prompt, `.env`, credentials, dependency hoặc output; `.gitignore` không loại bỏ file đã tracked hay lịch sử cũ.

## GitHub Pages

Đích dự kiến: **https://vesperkrock.github.io/laneforge-game/**. Đây là URL kế hoạch, chưa phải tuyên bố site đã live.

Workflow `.github/workflows/deploy-pages.yml` chạy khi push `main` hoặc chạy thủ công, cài từ lockfile, build, kiểm tra security rồi upload **chỉ `dist/`**. Các action chính thức được pin bằng commit SHA; checkout không giữ credentials.

Owner cần mở [Settings → Pages](https://github.com/VesperKrock/laneforge-game/settings/pages), chọn **Build and deployment → Source → GitHub Actions**. Commit/push chỉ được thực hiện sau khi Owner duyệt phạm vi R0B trong hội thoại. Sau push phải kiểm tra Actions thành công và mở URL để xác nhận thao tác triệu hồi, CD, thắng/thua, resize và tải assets; không suy ra Pages live từ build local.

Hướng dẫn nền tảng: [Vite project Pages/base path](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Node LTS](https://nodejs.org/en/about/previous-releases).

## Tài liệu thiết kế

- [Game design baseline](docs/GAME_DESIGN.md)
- [Đơn vị](docs/UNITS.md)
- [Spell Cards](docs/SPELL_CARDS.md)
- [Confirmed / approved prototype / proposed decisions](docs/DECISIONS.md)
- [Roadmap đề xuất](docs/ROADMAP.md)
- [Manifest và kết quả kiểm tra R0B](docs/R0B_REVIEW.md)
