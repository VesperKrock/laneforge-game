# Roadmap đề xuất

Các mốc dưới đây là **PROPOSED**, không phải cam kết release hoặc lịch giao hàng. R0B đã công bố tại `19aa892`, R1A tại `1086c8a`; vòng hiện tại chỉ duyệt triển khai và kiểm thử local R1B.

| Mốc | Mục tiêu đề xuất | Điều kiện chuyển bước đề xuất |
| --- | --- | --- |
| R0 / R0A | Chuẩn bị repo, baseline thiết kế, phân biệt confirmed/proposed | Git root đúng, tài liệu rõ nguồn và quyết định mở |
| R0B | Smoke test Phaser/TS/Vite, hygiene public repo, chuẩn bị Pages | Build + kiểm chứng tương tác, security gate, Owner duyệt trước commit/push; chỉ coi Pages live sau khi xác minh |
| R1 | Core battle một lane | Owner duyệt phạm vi, luật trận, đơn vị và kinh tế thử nghiệm |
| R1A | Năm slot, bốn profile quân, Vàng chung/CD riêng và giao chiến cơ bản | Build/browser/security đạt; trình manifest và dừng trước stage/commit/push/deploy |
| R1B | Năm slot không trùng loại, Giáo, target/range/spacing và PvE có đội hình | Kiểm chứng mô hình, các chiến lược chơi thử, production preview và security; dừng trước stage/commit/push/deploy |
| R2 | Spell Card Bạc/Vàng | Duyệt gắn thẻ, phụ phí, đánh đổi; kiểm chứng rush Bạc |
| R3 | Tiến hóa Kim Cương | Duyệt skill/giới hạn, kiểm chứng không auto-win |
| R4 | PvE và cân bằng | Wave/màn chơi và tiêu chí cân bằng được duyệt |
| R5 | Nghiên cứu PvP | Chọn online/địa phương và đánh giá đồng bộ/công bằng |

R0B không phải bản hoàn chỉnh R1. Hai lính kịch bản và một đơn vị demo chỉ kiểm tra đường đi từ thao tác tới mô phỏng/dựng hình; không thay thế thiết kế chiến đấu, hệ wave hoặc cân bằng.

R1B giữ một map/lane và lịch địch tuyến tính hữu hạn. Quy tắc không trùng slot đã được Owner chốt; chỉ số, kinh tế và mức khó vẫn tạm. Không mở rộng sang chiến dịch, Spell Card, PvP hoặc các vòng tiếp theo trước khi Owner duyệt.
