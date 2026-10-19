# laneforge-game
A 2D lane-based strategy game featuring weapon classes, spell cards, and tactical unit deployment

LaneForge là game chiến thuật/thủ thành 2D trên một chiến tuyến ngang: chuẩn bị năm slot, chọn thời điểm triệu hồi bằng Vàng + Cooldown, để đơn vị tự tiến và giao chiến.

## Bản thử local R1D — combat và kho quân 5/6

Phaser 3 + TypeScript + Vite, kế thừa R1C đã công bố tại `da7d13c46f550b5a66576253f47323260ac8deef`. Chọn **năm loại khác nhau từ kho sáu quân** trước trận: Trường Kiếm / Rìu / Khiên / Kiếm Giác Đấu / Giáo / Búa Chiến. Mặc định vẫn năm loại cũ; Bot mang cùng bộ đã chọn. Mỗi bên **100 Vàng ban đầu, +5/giây, trần 125, năm CD riêng và nhà 240 HP**, cùng giá và validator.

Player điều khiển năm nút của mình; năm nút Bot chỉ để quan sát Vàng/CD, loại vừa chọn và lý do ngắn. Bot quyết định mỗi 0.75 giây theo tuyến trước, mục tiêu bền, hỗ trợ và áp lực nhà; có thể dành tiền khi an toàn hoặc chọn quân rẻ cứu nhà. Không tiền/CD vô hạn, không AI framework/backend.

Rìu chờ 0.6s sau tiếp cận, giữ tiến độ khi đổi mục tiêu trong tầm, tối thiểu 1.2s giữa các cú đánh thực tế. Giáo tiến 85/s, chủ động kite 48/s khi địch áp sát kể cả đứng riêng, vẫn ưu tiên hỗ trợ sau cận chiến. Búa 72 HP, 26 đòn chính + 10 lên mọi địch khác trong bán kính 40 quanh mục tiêu, windup 0.9s/chu kỳ 1.8s, giá 45/CD 4s. Cận chiến vẫn chồng/cùng đánh; địch chặn đường, mục tiêu gần nhất phía trước, tie-break ID. Xem [luật, đối đầu trước/sau revision và manifest 11 file](docs/GAME_DESIGN.md), [chỉ số](docs/UNITS.md).

**TEMP_R1D / CHƯA CÂN BẰNG:** năm profile cũ không đổi; Búa dùng số revision Owner cho thử. Offset Giáo 30, cận chiến gần trong 96 và ngưỡng kite 52 trong tầm 58 là số triển khai chọn; Giác Đấu bắt kịp nhưng không được hardcode thắng. Không giới hạn stack ba quân, không buff bí mật. Combat cùng bước công bằng và **không Hòa/không xuyên phe** giữ từ R1C. Thời lượng còn chênh lệch và nhạy FPS/input; không gọi là cân bằng cuối. Chưa Spell Card, Kim Cương, PvP, level, tài khoản/lưu dữ liệu. **R1D local, dừng trước stage/commit/push/deploy.**

## Chạy local

Khuyến nghị Node.js **24 LTS** (`.nvmrc`). Node 22 từ 22.12 cũng được khai báo hỗ trợ. Dùng npm đi kèm Node; xem phiên bản thực tế đã kiểm tra trong [biên bản R0B](docs/R0B_REVIEW.md). Dependency được khóa trong `package-lock.json`.

```sh
npm install --ignore-scripts
npm run dev
```

Mở `http://127.0.0.1:5173/laneforge-game/`. Trong kho, bỏ một quân rồi chọn Búa nếu muốn; phải đủ năm mới **Bắt đầu**. Triệu hồi bằng năm nút PLAYER, quan sát Bot phía trên. Đội hình khóa trong trận; **Chơi lại** reset và giữ năm loại, **Về chuẩn bị** reset về chờ để đổi. Thử Khiên → Búa → Giáo → Trường Kiếm → Rìu với deck bỏ Giác Đấu, rồi tiếp viện theo tình hình. Không triệu hồi sẽ thua. Ẩn tab dừng local, không mô phỏng bù. Chưa QA thiết bị thật hoặc xác thực PvP.

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

URL R1C đã công bố và kiểm chứng: **https://vesperkrock.github.io/laneforge-game/** tại `da7d13c46f550b5a66576253f47323260ac8deef`. R1D chỉ local; build/browser PASS không có nghĩa Pages đã cập nhật.

Workflow `.github/workflows/deploy-pages.yml` chạy khi push `main` hoặc chạy thủ công, cài lockfile, build, security gate rồi upload **chỉ dist/**. Action pin SHA, checkout không giữ credentials; Pages source là GitHub Actions. R1D không sửa dependency/workflow/settings. Cần Owner duyệt manifest R1D riêng trước stage/commit/push/deploy; sau publish mới kiểm tra lại Actions/site.

Hướng dẫn nền tảng: [Vite project Pages/base path](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Node LTS](https://nodejs.org/en/about/previous-releases).

## Tài liệu thiết kế

- [Game design baseline](docs/GAME_DESIGN.md)
- [Đơn vị](docs/UNITS.md)
- [Spell Cards](docs/SPELL_CARDS.md)
- [Confirmed / approved prototype / proposed decisions](docs/DECISIONS.md)
- [Roadmap đề xuất](docs/ROADMAP.md)
- [Manifest và kết quả kiểm tra R0B](docs/R0B_REVIEW.md)
