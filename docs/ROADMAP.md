# Roadmap LaneForge — Modular Unit + Weapon System

## Trạng thái hiện tại và định hướng R2A

Cập nhật local ngày 02/11/2026 theo định hướng Owner: người chơi tự lắp quân bằng nhân vật lõi, vũ khí hai tay, giáp, phụ kiện và thẻ hỗ trợ, rồi thử/sửa build trong trận một lane. Tên LaneForge trong code giữ nguyên; Legend Army là tên tài liệu thiết kế nguồn. Các bước tương lai dưới đây là **PROPOSED**, chưa phải tính năng đã hoàn thành hoặc cam kết phát hành.

| Mốc | Trạng thái thực tế |
| --- | --- |
| R0B / R1A / R1B / R1C | Đã phát hành và kiểm chứng theo lịch sử bên dưới: `19aa892` / `1086c8a` / `add1f73` / `da7d13c` |
| R1D revision | Đã được Owner duyệt và phát hành tại `b4ec9fc1d05dee40244e38e281c20de04776e7bb`; baseline GitHub khi fresh-check R2A |
| R1E Combat Timing Audit | Kết quả audit local: 61 tests, gồm 14 regression bổ sung. Hai file `docs/GAME_DESIGN.md`, `tests/smoke.spec.ts` chưa commit và được bảo toàn trong R2A; không thay gameplay R1D |
| R2A Modular Weapon Foundation + Seed Arsenal | Owner đã đồng ý hướng thiết kế/phạm vi; triển khai và kiểm thử **local**, chờ Owner duyệt manifest/kết quả. Không đồng nghĩa đã duyệt phát hành |

Mặc định vẫn là sáu preset R1D, chọn năm slot, Player/Bot cùng kinh tế 100 Vàng / +5 mỗi giây / tối đa 125, CD riêng, nhà 240 HP, không xuyên phe, không Hòa. Xưởng R2A chỉ thay một slot nếu người chơi chủ động dùng; Bot nhận cùng build và trả cùng Vàng/CD. Không nerf/buff preset để phù hợp hướng mới.

## Các bước Modular đề xuất và cổng xét duyệt

| Mốc | Phạm vi định hướng | Điều kiện xem xét duyệt |
| --- | --- | --- |
| R2A | TypeScript UnitBuild/validator/compiler; một lõi demo; catalogue đủ 43 vũ khí, giữ phân loại nguồn riêng với taxonomy đề xuất; 15 melee dùng nhóm hành vi chung; tay phụ Trống/Khiên barrier mẫu; một slot Xưởng | Bonus thử +30% chỉ trên damage vật lý riêng của vũ khí 1H đủ điều kiện khi tay phụ trống, không nhân lại vũ khí vốn 2H; build sai bị từ chối trước chi tiêu; preset R1D nguyên vẹn; full R1E + regression R2A, build/browser/mobile/security/audit; manifest Owner duyệt riêng |
| R2B — PROPOSED | Mở rộng melee, animation theo họ hành vi | Thêm dữ liệu không nhân đôi engine cho từng món; visual phân biệt đúng họ |
| R2C — PROPOSED | Xưởng năm custom loadout cùng preset, UX mobile | Tạo/sửa/copy năm build, preset chơi ngay; giao diện dễ hiểu trên điện thoại |
| R2D — PROPOSED | Giáp/phụ kiện; mở rộng luật Khiên, DEF, KG/STR | Owner chốt định nghĩa/tương tác; quy tắc nhất quán, kiểm thử được. Barrier mẫu R2A không có nghĩa hệ thống này đã hoàn thành |
| R3 — PROPOSED | Thẻ hỗ trợ, nội tại/modifier/xung đột | Hợp đồng hiệu ứng và validator tổ hợp rõ ràng; không mặc nhiên triển khai toàn bộ 72 thẻ |
| R4 — PROPOSED | PvE, onboarding và cân bằng; Dễ/Thường | Thử người mới, nhiều chiến thuật khả thi và nhiều đường thắng |
| R5 — PROPOSED | Mobile QA: touch, hiệu năng, Android/iOS | Kiểm thử thiết bị thật, pin, ổn định; QA trình duyệt mobile không đồng nghĩa đã có ứng dụng điện thoại |
| R6 — PROPOSED | Nội dung, QA và phát hành thương mại | Phạm vi, tiêu chí phát hành và quy trình cửa hàng được Owner duyệt riêng |
| Nhánh tương lai — OPEN | Xích, cung/nỏ, phép; projectile và tương tác đặc biệt | Duyệt cơ chế riêng trước khi chuyển từ catalogue sang gameplay |

43 records là **dữ liệu phân loại**, 15 active là **phạm vi gameplay R2A**, còn passive nguồn là **tài liệu chưa thực thi**. Các số `TEMP_R2A`, cờ cầm hai tay và barrier mẫu là thử nghiệm để Owner xét, không phải số cân bằng chính thức của tác giả nguồn. Dual wield, toàn bộ 72 thẻ, DEF/MDEF/STR-KG, nón/giáp/phụ kiện nâng cao, phép/cung/nỏ/thú cưỡi, tài khoản/backend/PvP/app điện thoại nằm ngoài R2A.

R2A **NO STAGE / NO COMMIT / NO PUSH / NO DEPLOY**. Xem [báo cáo và manifest local R2A](R2A_REVIEW.md). Bản public không thay đổi do vòng local này.

## Hồ sơ roadmap trước R2A — giữ lại để truy xuất

Phần dưới giữ nội dung định hướng cũ và trạng thái lúc soạn R1D. Những câu “R1D local / public R1C” là **lịch sử**, được cập nhật bằng bảng trạng thái hiện tại ở trên. Các đề xuất R2 Spell Card, R3 Kim Cương và R5 PvP cũ **không phải mốc đã làm**; thứ tự phát triển mới là Modular R2A–R6 bên trên.

Các mốc ngoài gói Owner duyệt là **PROPOSED**, không phải cam kết release/lịch giao hàng. R0B `19aa892`, R1A `1086c8a`, R1B `add1f73`, R1C `da7d13c` đã push và kiểm chứng Pages. R1D hiện chỉ được triển khai và kiểm thử local.

| Mốc | Mục tiêu đề xuất | Điều kiện chuyển bước đề xuất |
| --- | --- | --- |
| R0 / R0A | Chuẩn bị repo, baseline thiết kế, phân biệt confirmed/proposed | Git root đúng, tài liệu rõ nguồn và quyết định mở |
| R0B | Smoke test Phaser/TS/Vite, hygiene public repo, chuẩn bị Pages | Build + kiểm chứng tương tác, security gate, Owner duyệt trước commit/push; chỉ coi Pages live sau khi xác minh |
| R1 | Core battle một lane | Owner duyệt phạm vi, luật trận, đơn vị và kinh tế thử nghiệm |
| R1A | Năm slot, bốn profile quân, Vàng chung/CD riêng và giao chiến cơ bản | Build/browser/security đạt; trình manifest và dừng trước stage/commit/push/deploy |
| R1B | Năm slot không trùng loại, Giáo, target/range/spacing và PvE có đội hình | Kiểm chứng mô hình, các chiến lược chơi thử, production preview và security; dừng trước stage/commit/push/deploy |
| R1C | Solo vs Bot cùng kinh tế/triệu hồi, hai bên UI và đội hình overlap | Giữ chỉ số quân R1B và heuristic Bot; nhà chung 240 HP theo Owner; kiểm chứng hồi Vàng/chi tiêu, xử lý đối xứng, bất biến không xuyên phe/không Hòa và trận dài, browser/security; trình manifest và dừng trước stage/commit/push/deploy |
| R1D | Giữ tiến độ đòn Rìu, Giáo kite 48/s, Búa AOE 26/10 không cap phụ, chọn năm loại từ sáu | Revision tiếp tục local hiện tại; giữ kinh tế/240 HP/công bằng, không giới hạn stack; đối đầu/mô phỏng/browser/security/audit; Owner duyệt manifest riêng trước stage/commit/push/deploy |
| R2 | Spell Card Bạc/Vàng | Duyệt gắn thẻ, phụ phí, đánh đổi; kiểm chứng rush Bạc |
| R3 | Tiến hóa Kim Cương | Duyệt skill/giới hạn, kiểm chứng không auto-win |
| R4 | PvE và cân bằng | Wave/màn chơi và tiêu chí cân bằng được duyệt |
| R5 | Nghiên cứu PvP | Chọn online/địa phương và đánh giá đồng bộ/công bằng |

R0B không phải bản hoàn chỉnh R1. Hai lính kịch bản và một đơn vị demo chỉ kiểm tra đường đi từ thao tác tới mô phỏng/dựng hình; không thay thế thiết kế chiến đấu, hệ wave hoặc cân bằng.

R1D kế thừa R1C đã công bố, không làm lại mốc cũ. Không trùng slot/không xuyên địch/không Hòa là luật Owner chốt; số tạm, ngưỡng hỗ trợ, ưu tiên Bot và tempo vẫn cần đánh giá. Chưa tăng HP năm quân cũ hoặc chốt stack ba quân; không mở rộng campaign, Spell Card, PvP, level/lưu dữ liệu. Site public vẫn là R1C cho tới khi R1D được duyệt xuất bản và kiểm chứng riêng.
