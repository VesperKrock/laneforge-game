# laneforge-game
A 2D lane-based strategy game featuring weapon classes, spell cards, and tactical unit deployment

LaneForge là game chiến thuật/thủ thành 2D trên một chiến tuyến ngang: chuẩn bị năm slot, chọn thời điểm triệu hồi bằng Vàng + Cooldown, để đơn vị tự tiến và giao chiến.

## Bản thử local R1C — Solo vs Bot

Phaser 3 + TypeScript + Vite, kế thừa R1B đã công bố tại `add1f73`. Hai bên cùng năm loại duy nhất: Trường Kiếm / Rìu / Khiên / Kiếm Giác Đấu / Giáo. Mỗi loại một slot, được triệu hồi nhiều bản sao. **Mỗi bên có 100 Vàng ban đầu, +5/giây, trần 125 và năm CD riêng**, cùng giá và cùng kiểm tra triệu hồi. Bỏ tám quân PvE miễn phí.

Player điều khiển năm nút của mình; năm nút Bot chỉ để quan sát Vàng/CD, loại vừa chọn và lý do ngắn. Bot quyết định mỗi 0.75 giây theo tuyến trước, mục tiêu bền, hỗ trợ và áp lực nhà; có thể dành tiền khi an toàn hoặc chọn quân rẻ cứu nhà. Không tiền/CD vô hạn, không AI framework/backend.

Cận chiến được chồng vị trí và cùng tấn công, quân nhanh vượt đồng đội. Giáo giữ phía sau tuyến cận chiến, được chồng Giáo; thiếu cận chiến vẫn tự tiến/đánh, khi cận chiến mới tới thì nhường bằng chuyển động liên tục. Địch vẫn chặn đường; mục tiêu là địch sống gần nhất phía trước, tie-break ID. Xem [luật và kết quả thử](docs/GAME_DESIGN.md), [chỉ số](docs/UNITS.md).

**TẠM THỜI / CHƯA CÂN BẰNG:** giữ toàn bộ profile và kinh tế R1B; Owner yêu cầu HP nhà **240/240**, dùng một cấu hình gốc `DEMO.baseHp`; vẫn phá nhà về 0 để kết thúc. Offset Giáo 24, nhịp Bot và ưu tiên giữ nguyên heuristic thử nghiệm. Di chuyển được tính cùng trạng thái; đòn cùng bước nhận đủ sát thương thay vì ID thấp hủy đòn trả. Owner chốt **không có Hòa**: hai phe phải giao chiến, không đi xuyên địch. Trạng thái đảo chiến tuyến hoặc hai nhà cùng bị phá bị báo lỗi bất biến, không chọn phe thắng theo thứ tự xử lý. Hình/nhãn quân chồng nhau có thể che nhau. Chưa có Spell Card, Kim Cương, PvP networking, level, lưu dữ liệu hoặc hệ thống phụ. R1C chỉ local, dừng trước stage/commit/push/deploy.

## Chạy local

Khuyến nghị Node.js **24 LTS** (`.nvmrc`). Node 22 từ 22.12 cũng được khai báo hỗ trợ. Dùng npm đi kèm Node; xem phiên bản thực tế đã kiểm tra trong [biên bản R0B](docs/R0B_REVIEW.md). Dependency được khóa trong `package-lock.json`.

```sh
npm install --ignore-scripts
npm run dev
```

Mở `http://127.0.0.1:5173/laneforge-game/`. Bấm **Bắt đầu**, chọn quân ở phần **PLAYER**; quan sát Bot phía trên chiến trường. Thử Rìu → Giáo → Trường Kiếm → Giác Đấu → Khiên rồi tiếp viện theo tình hình. Bấm **Chơi lại** để reset. Để địch tự tiến mà không triệu hồi sẽ dẫn tới thua. Ẩn tab tạm dừng trận local, không mô phỏng bù. UI minh bạch Bot không thay thế xác thực trạng thái/thời gian/lệnh cần có cho PvP tương lai.

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

URL R1B đã công bố và kiểm chứng: **https://vesperkrock.github.io/laneforge-game/** tại `add1f736f9c2953f0a6df3f68aeed937be007aac`. R1C hiện chỉ được phép local; build/browser PASS không có nghĩa Pages đã cập nhật.

Workflow `.github/workflows/deploy-pages.yml` chạy khi push `main` hoặc chạy thủ công, cài lockfile, build, security gate rồi upload **chỉ dist/**. Action được pin SHA, checkout không giữ credentials; Pages source đã là GitHub Actions. Không sửa dependency, workflow hoặc settings trong R1C. Cần Owner duyệt manifest R1C riêng trước stage/commit/push/deploy; sau publish mới kiểm tra lại Actions và site.

Hướng dẫn nền tảng: [Vite project Pages/base path](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Node LTS](https://nodejs.org/en/about/previous-releases).

## Tài liệu thiết kế

- [Game design baseline](docs/GAME_DESIGN.md)
- [Đơn vị](docs/UNITS.md)
- [Spell Cards](docs/SPELL_CARDS.md)
- [Confirmed / approved prototype / proposed decisions](docs/DECISIONS.md)
- [Roadmap đề xuất](docs/ROADMAP.md)
- [Manifest và kết quả kiểm tra R0B](docs/R0B_REVIEW.md)
