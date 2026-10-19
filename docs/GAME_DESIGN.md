# LaneForge — Game design baseline

Đây là baseline thiết kế, chưa phải specification kỹ thuật hoàn chỉnh. Nguồn là các yêu cầu R0A và R0B do Owner cung cấp ngày 19/10/2026; không suy diễn nội dung các cuộc trao đổi chưa có trong phiên làm việc.

## CONFIRMED BY OWNER

- Game chiến thuật/thủ thành 2D trên một chiến tuyến ngang; mỗi bên có căn cứ.
- Người chơi chuẩn bị năm slot trước trận và chủ động chọn đơn vị để triệu hồi bằng Vàng + Cooldown theo slot.
- Đơn vị tự tiến và tự đánh sau khi xuất hiện.
- Ưu tiên PvE. Địch PvE có thể xuất hiện theo wave kịch bản, không bắt buộc mô phỏng kinh tế của người chơi.
- Khi nghiên cứu PvP, cả hai bên phải tuân theo Vàng + Cooldown.
- Spell Card có ba bậc Bạc, Vàng, Kim Cương; xem [thiết kế thẻ](SPELL_CARDS.md).

## APPROVED FOR R0B TECHNICAL PROTOTYPE

Phaser 3 + TypeScript + Vite, ứng dụng web tĩnh, đích GitHub Pages. R0B chỉ là demo tương tác để kiểm tra dựng hình, triệu hồi, Vàng/CD, tự tiến/đánh, kết quả trận và build/deploy.

Bản thử có một slot hoạt động và bốn placeholder, hai lính địch theo kịch bản, nút bắt đầu/chơi lại. Chỉ số, hình học, vị trí và điều kiện thắng/thua trong demo đều **TEMPORARY / NOT BALANCED**; không phải quyết định cân bằng game chính thức. Năm slot được thể hiện trên giao diện nhưng chưa có tính năng chuẩn bị đội hình.

## OPEN / PROPOSED

- Phá căn cứ về 0 HP để thắng là cách kiểm chứng tạm của R0B; luật thắng, hòa và giới hạn thời gian R1 còn chờ duyệt.
- Kích thước map thật, vị trí spawn, va chạm, chọn mục tiêu, ưu tiên tấn công và giới hạn quân.
- Vàng ban đầu, hồi Vàng, trần Vàng, chi phí và Cooldown từng đơn vị.
- Hệ giáp, tầm đánh, tốc đánh, skill/ultimate, cân bằng và nội dung MVP.
- Chi tiết gắn thẻ, giới hạn Kim Cương, PvP online hay địa phương.

Theo dõi tại [DECISIONS](DECISIONS.md). Chưa có gameplay đầy đủ, Spell Card, tiến hóa, hệ wave hoàn chỉnh, lưu tiến trình hay multiplayer.
