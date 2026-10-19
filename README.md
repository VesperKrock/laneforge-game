# laneforge-game
A 2D lane-based strategy game featuring weapon classes, spell cards, and tactical unit deployment

LaneForge là game chiến thuật/thủ thành 2D trên một chiến tuyến ngang: chuẩn bị năm slot, chọn thời điểm triệu hồi bằng Vàng + Cooldown, để đơn vị tự tiến và giao chiến.

## Bản thử local R1A

Phaser 3 + TypeScript + Vite. Kế thừa R0B `19aa892`, R1A bật năm slot cố định: Trường Kiếm / Rìu / Khiên / Kiếm Giác Đấu / Trường Kiếm. Tất cả dùng chung Vàng nhưng có CD riêng, kể cả hai slot Trường Kiếm. Giá/CD và trạng thái sẵn sàng, hồi chiêu hoặc thiếu Vàng hiện trên từng nút.

Bốn quân có HP, sát thương, nhịp đánh và tốc chạy khác nhau; có hình/ký hiệu riêng. Quân tự tiến, đánh địch gần nhất ở phía trước rồi đánh căn cứ đúng tầm. PvE tạm có ba địch kịch bản tại 0/6/10 giây. Giữ nút bắt đầu/chơi lại, thanh HP, bộ đếm đòn trúng và kết quả thắng/thua. Xem [bảng chỉ số TEMP_R1A](docs/UNITS.md).

**TẠM THỜI / CHƯA CÂN BẰNG:** toàn bộ chỉ số/hình học phục vụ core combat test. Khiên chịu đòn bằng HP, không giáp/taunt; quân cùng phe có thể chồng hình. Chưa có chuẩn bị đội hình, gameplay hoàn chỉnh, Spell Card, tiến hóa, campaign, lưu game hay PvP. Không có backend, tài khoản, analytics hoặc dịch vụ ngoài. Chưa stage/commit/push/deploy R1A trong vòng triển khai local.

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

URL R0B đã công bố: **https://vesperkrock.github.io/laneforge-game/**. Code R1A hiện chỉ được phép kiểm tra local; không coi site đang phục vụ R1A trước khi được duyệt, push và xác minh deploy.

Workflow `.github/workflows/deploy-pages.yml` chạy khi push `main` hoặc chạy thủ công, cài từ lockfile, build, kiểm tra security rồi upload **chỉ `dist/`**. Các action chính thức được pin bằng commit SHA; checkout không giữ credentials.

Nguồn Pages đã được cấu hình **GitHub Actions** ở R0B. Không sửa workflow/settings trong R1A. Commit/push R1A chỉ được thực hiện sau khi Owner duyệt đúng phạm vi trong hội thoại. Sau push phải kiểm tra Actions thành công và mở URL để xác nhận thao tác triệu hồi, CD, thắng/thua, resize và tải assets; không suy ra Pages live từ build local.

Hướng dẫn nền tảng: [Vite project Pages/base path](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Node LTS](https://nodejs.org/en/about/previous-releases).

## Tài liệu thiết kế

- [Game design baseline](docs/GAME_DESIGN.md)
- [Đơn vị](docs/UNITS.md)
- [Spell Cards](docs/SPELL_CARDS.md)
- [Confirmed / approved prototype / proposed decisions](docs/DECISIONS.md)
- [Roadmap đề xuất](docs/ROADMAP.md)
- [Manifest và kết quả kiểm tra R0B](docs/R0B_REVIEW.md)
