# Roadmap đề xuất

Các mốc dưới đây là **PROPOSED**, không phải cam kết release hoặc lịch giao hàng. R0B đã công bố tại `19aa892`, R1A tại `1086c8a`, R1B tại `add1f73` đã push và kiểm chứng Pages; vòng hiện tại chỉ duyệt triển khai và kiểm thử local R1C.

| Mốc | Mục tiêu đề xuất | Điều kiện chuyển bước đề xuất |
| --- | --- | --- |
| R0 / R0A | Chuẩn bị repo, baseline thiết kế, phân biệt confirmed/proposed | Git root đúng, tài liệu rõ nguồn và quyết định mở |
| R0B | Smoke test Phaser/TS/Vite, hygiene public repo, chuẩn bị Pages | Build + kiểm chứng tương tác, security gate, Owner duyệt trước commit/push; chỉ coi Pages live sau khi xác minh |
| R1 | Core battle một lane | Owner duyệt phạm vi, luật trận, đơn vị và kinh tế thử nghiệm |
| R1A | Năm slot, bốn profile quân, Vàng chung/CD riêng và giao chiến cơ bản | Build/browser/security đạt; trình manifest và dừng trước stage/commit/push/deploy |
| R1B | Năm slot không trùng loại, Giáo, target/range/spacing và PvE có đội hình | Kiểm chứng mô hình, các chiến lược chơi thử, production preview và security; dừng trước stage/commit/push/deploy |
| R1C | Solo vs Bot cùng kinh tế/triệu hồi, hai bên UI và đội hình overlap | Giữ chỉ số quân R1B và heuristic Bot; nhà chung 240 HP theo Owner; kiểm chứng hồi Vàng/chi tiêu, xử lý đối xứng, bất biến không xuyên phe/không Hòa và trận dài, browser/security; trình manifest và dừng trước stage/commit/push/deploy |
| R2 | Spell Card Bạc/Vàng | Duyệt gắn thẻ, phụ phí, đánh đổi; kiểm chứng rush Bạc |
| R3 | Tiến hóa Kim Cương | Duyệt skill/giới hạn, kiểm chứng không auto-win |
| R4 | PvE và cân bằng | Wave/màn chơi và tiêu chí cân bằng được duyệt |
| R5 | Nghiên cứu PvP | Chọn online/địa phương và đánh giá đồng bộ/công bằng |

R0B không phải bản hoàn chỉnh R1. Hai lính kịch bản và một đơn vị demo chỉ kiểm tra đường đi từ thao tác tới mô phỏng/dựng hình; không thay thế thiết kế chiến đấu, hệ wave hoặc cân bằng.

R1B là baseline lịch sử đã công bố. R1C thay lịch hữu hạn bằng Bot dùng ngân sách riêng theo cùng luật, cho cận chiến chồng vị trí và Giáo hỗ trợ linh hoạt. Không trùng slot là luật Owner chốt; chỉ số, ưu tiên Bot, offset hỗ trợ và mức khó vẫn tạm. Chưa mở rộng chiến dịch, Spell Card, PvP, level hay lưu dữ liệu. R1C cần duyệt xuất bản riêng, site vẫn R1B cho tới bước đó.
