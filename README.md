# laneforge-game
A 2D lane-based strategy game featuring weapon classes, spell cards, and tactical unit deployment

LaneForge là game chiến thuật/thủ thành 2D trên một chiến tuyến ngang: chuẩn bị năm slot, chọn thời điểm triệu hồi bằng Vàng + Cooldown, để đơn vị tự tiến và giao chiến.

## Bản thử local R1B

Phaser 3 + TypeScript + Vite. Kế thừa R1A `1086c8a`, R1B dùng năm slot cố định: Trường Kiếm / Rìu / Khiên / Kiếm Giác Đấu / Giáo. **Mỗi loại có tối đa một slot**, nhưng có thể triệu hồi nhiều bản sao từ slot đó. Vàng chung, CD riêng. Nút hiển thị giá/CD/tầm và trạng thái sẵn sàng, hồi chiêu, thiếu Vàng hoặc chờ lối ra trống; lệnh bị từ chối không mất Vàng/CD.

Giáo có tầm 58, các quân còn lại tầm 28; Giáo sau Khiên có thể hỗ trợ đầu tuyến. Quân tự tiến, giữ khoảng tâm 24 và không vượt đồng đội, đánh địch sống gần nhất phía trước (cùng khoảng cách chọn ID thấp hơn), rồi mới đánh nhà đúng tầm. PvE có tám quân theo sáu mốc từ 0 đến 18 giây, gồm cặp Khiên/Giáo và tiếp viện Rìu. Đợt đến hạn chờ cửa spawn trống, không lặp vô hạn. Xem [chỉ số TEMP_R1B](docs/UNITS.md) và [lịch PvE/kết quả thử](docs/GAME_DESIGN.md).

**TẠM THỜI / CHƯA CÂN BẰNG:** bốn quân cũ giữ chỉ số R1A; thêm Giáo, hồi Vàng 6 → 5/giây (đầu trận 100, trần 125). Khiên chịu đòn bằng HP, không giáp/taunt. Vũ khí vẽ có thể giao nhau; spacing không phải physics theo pixel. Tiếp viện Trường Kiếm liên tục vẫn thắng được, chưa cân bằng chiến dịch. Chưa có editor, Spell Card, Kim Cương, campaign, lưu game hay PvP; không thêm dependency, backend, tài khoản hoặc analytics. Chỉ làm local, chưa stage/commit/push/deploy R1B.

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

URL R1A đã công bố: **https://vesperkrock.github.io/laneforge-game/**. Code R1B hiện chỉ được phép kiểm tra local; không coi site đang phục vụ R1B trước khi được duyệt, push và xác minh deploy.

Workflow `.github/workflows/deploy-pages.yml` chạy khi push `main` hoặc chạy thủ công, cài từ lockfile, build, kiểm tra security rồi upload **chỉ `dist/`**. Các action chính thức được pin bằng commit SHA; checkout không giữ credentials.

Nguồn Pages đã được cấu hình **GitHub Actions** ở R0B. Không sửa workflow/settings trong R1B. Commit/push R1B chỉ được thực hiện sau khi Owner duyệt đúng phạm vi trong hội thoại. Sau push phải kiểm tra Actions thành công và mở URL để xác nhận thao tác triệu hồi, CD, thắng/thua, resize và tải assets; không suy ra Pages live từ build local.

Hướng dẫn nền tảng: [Vite project Pages/base path](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Node LTS](https://nodejs.org/en/about/previous-releases).

## Tài liệu thiết kế

- [Game design baseline](docs/GAME_DESIGN.md)
- [Đơn vị](docs/UNITS.md)
- [Spell Cards](docs/SPELL_CARDS.md)
- [Confirmed / approved prototype / proposed decisions](docs/DECISIONS.md)
- [Roadmap đề xuất](docs/ROADMAP.md)
- [Manifest và kết quả kiểm tra R0B](docs/R0B_REVIEW.md)
