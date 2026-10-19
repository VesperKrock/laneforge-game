# Roadmap đề xuất

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
