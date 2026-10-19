# LaneForge — Game design baseline

Đây là baseline thiết kế, chưa phải specification kỹ thuật hoàn chỉnh. Nguồn là các yêu cầu R0A, R0B và R1A do Owner cung cấp; không suy diễn nội dung các cuộc trao đổi chưa có trong phiên làm việc.

## CONFIRMED BY OWNER

- Game chiến thuật/thủ thành 2D trên một chiến tuyến ngang; mỗi bên có căn cứ.
- Người chơi chuẩn bị năm slot trước trận và chủ động chọn đơn vị để triệu hồi bằng Vàng + Cooldown theo slot.
- Đơn vị tự tiến và tự đánh sau khi xuất hiện.
- Ưu tiên PvE. Địch PvE có thể xuất hiện theo wave kịch bản, không bắt buộc mô phỏng kinh tế của người chơi.
- Khi nghiên cứu PvP, cả hai bên phải tuân theo Vàng + Cooldown.
- Spell Card có ba bậc Bạc, Vàng, Kim Cương; xem [thiết kế thẻ](SPELL_CARDS.md).

## APPROVED FOR R0B TECHNICAL PROTOTYPE

Phaser 3 + TypeScript + Vite, ứng dụng web tĩnh, đích GitHub Pages. R0B chỉ là demo tương tác để kiểm tra dựng hình, triệu hồi, Vàng/CD, tự tiến/đánh, kết quả trận và build/deploy.

R0B đã được công bố từ commit `19aa892`: một slot hoạt động, bốn placeholder, hai địch kịch bản và nút bắt đầu/chơi lại. Đây là baseline lịch sử; chỉ số không phải quyết định cân bằng chính thức.

## APPROVED FOR R1A LOCAL COMBAT TEST

- Năm slot hoạt động, thứ tự cố định: Trường Kiếm / Rìu / Khiên / Kiếm Giác Đấu / Trường Kiếm. Slot 5 trùng loại để thử CD độc lập, chưa phải luật deck đã khóa.
- Vàng dùng chung; từng slot giữ CD riêng. Lệnh bị từ chối khi trận chưa chạy/đã kết thúc, thiếu Vàng, slot đang hồi hoặc chỉ số slot không hợp lệ; không trừ Vàng, tạo quân hay đổi CD.
- Bốn hướng quân được Owner duyệt cho roster thử tạm: cân bằng / đòn nặng / chịu đòn bằng HP / đánh và di chuyển nhanh. Không có hệ giáp hoặc taunt.
- Mô phỏng một chiều: ưu tiên địch còn sống gần nhất phía trước, dừng tại tầm đánh; chỉ đánh căn cứ khi không có địch gần hơn chắn đường. Không ngăn các đơn vị cùng phe đi xuyên nhau.
- PvE tạm có ba địch theo mốc thời gian 0/6/10 giây: Trường Kiếm / Rìu / Kiếm Giác Đấu. Cùng bảng chỉ số với quân ta, không dùng kinh tế PvP.
- Giữ nút bắt đầu/chơi lại, thắng/thua do HP căn cứ về 0 và responsive. Ẩn tab dừng mô phỏng, khi trở lại bước thời gian bị chặn tối đa 0.05 giây; không chạy bù thời gian vắng mặt.

Tất cả số liệu là **TEMP_R1A / PROVISIONAL / NOT BALANCED**: xem [bảng đơn vị](UNITS.md). Kinh tế giữ 100 Vàng đầu trận, +6/giây, trần 125; căn cứ ta/địch 80/90 HP, tầm đánh chung 28 đơn vị tọa độ. Điểm spawn cách tâm căn cứ 14 đơn vị về phía lane, nằm trong tầm đánh căn cứ để quân mới không xuất hiện sau lưng quân địch đang đánh nhà.

R1A chỉ được phép chỉnh sửa và kiểm tra local. Không có editor đội hình, lưu dữ liệu, tính năng ngoài phạm vi hay quyền commit/push/deploy trong vòng triển khai này.

## OPEN / PROPOSED

- Phá căn cứ về 0 HP để thắng là cách kiểm chứng tạm của R0B; luật thắng, hòa và giới hạn thời gian R1 còn chờ duyệt.
- Kích thước map thật, vị trí spawn, va chạm, chọn mục tiêu, ưu tiên tấn công và giới hạn quân.
- Vàng ban đầu, hồi Vàng, trần Vàng, chi phí và Cooldown từng đơn vị.
- Hệ giáp, tầm đánh, tốc đánh, skill/ultimate, cân bằng và nội dung MVP.
- Chi tiết gắn thẻ, giới hạn Kim Cương, PvP online hay địa phương.

Theo dõi tại [DECISIONS](DECISIONS.md). Chưa có gameplay đầy đủ, Spell Card, tiến hóa, hệ wave hoàn chỉnh, lưu tiến trình hay multiplayer.
