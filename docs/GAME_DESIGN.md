# LaneForge — Game design baseline

Đây là baseline thiết kế, chưa phải specification kỹ thuật hoàn chỉnh. Nguồn là các yêu cầu R0A, R0B, R1A và R1B do Owner cung cấp; không suy diễn nội dung các cuộc trao đổi chưa có trong phiên làm việc.

## CONFIRMED BY OWNER

- Game chiến thuật/thủ thành 2D trên một chiến tuyến ngang; mỗi bên có căn cứ.
- Người chơi chuẩn bị năm slot trước trận và chủ động chọn đơn vị để triệu hồi bằng Vàng + Cooldown theo slot.
- Mỗi loại quân chỉ có tối đa một slot; có thể triệu hồi nhiều bản sao từ slot đó. Đây là quy tắc Owner chốt ở R1B.
- Đơn vị tự tiến và tự đánh sau khi xuất hiện.
- Ưu tiên PvE. Địch PvE có thể xuất hiện theo wave kịch bản, không bắt buộc mô phỏng kinh tế của người chơi.
- Khi nghiên cứu PvP, cả hai bên phải tuân theo Vàng + Cooldown.
- Spell Card có ba bậc Bạc, Vàng, Kim Cương; xem [thiết kế thẻ](SPELL_CARDS.md).

## APPROVED FOR R0B TECHNICAL PROTOTYPE

Phaser 3 + TypeScript + Vite, ứng dụng web tĩnh, đích GitHub Pages. R0B chỉ là demo tương tác để kiểm tra dựng hình, triệu hồi, Vàng/CD, tự tiến/đánh, kết quả trận và build/deploy.

R0B đã được công bố từ commit `19aa892`: một slot hoạt động, bốn placeholder, hai địch kịch bản và nút bắt đầu/chơi lại. Đây là baseline lịch sử; chỉ số không phải quyết định cân bằng chính thức.

## R1A đã công bố / R1B đang thử local

R1A tại `1086c8a` đã đưa bốn vai trò vào core test. R1B kế thừa code đó và dùng năm slot duy nhất: **Trường Kiếm / Rìu / Khiên / Kiếm Giác Đấu / Giáo**. Vàng dùng chung, CD riêng. Chưa có editor đội hình.

Quy tắc thử **TEMP_R1B / PROVISIONAL / NOT BALANCED**:

- Ưu tiên địch sống gần nhất phía trước, giữa đơn vị và căn cứ địch. Khoảng cách bằng nhau chọn ID thấp hơn, không phụ thuộc thứ tự mảng. Không đánh địch sau lưng, đánh nhà qua địch chắn hoặc đánh nhiều mục tiêu cùng đòn.
- Tầm tính giữa tâm quân: Giáo 58, bốn quân còn lại 28. Giáo có thể đánh từ sau Khiên khi nằm trong tầm; không có đạn bay, AoE hoặc xuyên mục tiêu.
- Quân cùng phe tiến theo thứ tự từ đầu tuyến về sau, giữ khoảng tâm tối thiểu 24, không vượt đồng đội. Quân sau vẫn đánh nếu đủ tầm. Thứ tự vào tuyến có ý nghĩa: Giáo sau Khiên hỗ trợ được; Giáo nằm quá sâu sau nhiều quân thì không đánh tới.
- Điểm spawn cố định cách tâm nhà 14 về phía lane. Nếu đồng đội đang chiếm cửa, nút hiển thị **Chờ lối ra trống**; lệnh bị từ chối không mất Vàng/CD, không tạo hàng đợi trả phí. Cửa mở khi quân trước tiến hoặc chết.
- Đợt PvE đến hạn chờ cửa spawn trống, không bỏ qua hoặc lặp. Phe địch dùng cùng profile, được spawn miễn phí theo quy tắc PvE đã chốt.
- Đòn đánh giữ phần thời gian lẻ qua frame; thứ tự ID quyết định đòn đồng thời chí mạng. Không tích lũy đòn khi đang hành quân. Không có giáp/taunt.
- Giữ bắt đầu/chơi lại, HP nhà ta/địch 80/90, thắng/thua khi nhà về 0. Sau game over không cập nhật quân, lịch địch hoặc kinh tế. Ẩn tab dừng mô phỏng; khi quay lại chặn bước tối đa 0.05 giây, không bù cả khoảng vắng mặt.

## Lịch PvE TEMP_R1B

| Đến hạn | Đội hình | Mục đích thử |
| --- | --- | --- |
| 0s | Trường Kiếm | Tranh đầu tuyến |
| 3s | Khiên, rồi Giáo | Chịu đòn và hỗ trợ từ phía sau |
| 6s | Kiếm Giác Đấu | Tiếp sức bằng nhịp đánh nhanh |
| 10s | Rìu | Đòn nặng khi tuyến trước hao hụt |
| 14s | Trường Kiếm | Bổ sung tuyến |
| 18s | Khiên, rồi Rìu | Đợt tiếp viện cuối |

Tổng tám quân, sáu mốc; không spam vô hạn. Hai quân cùng đợt ra lần lượt khi đủ khoảng trống. Thời gian đến hạn được rút ngắn so với gợi ý kết thúc ở 42s để trận thử gặp đủ năm loại trước khi kết thúc. Đây là danh sách tuyến tính cố định, không có AI thích ứng hoặc hệ chiến dịch.

## Kinh tế và quan sát thử

| Giá trị | R1A / mốc so sánh | TEMP_R1B đang giữ |
| --- | --- | --- |
| Vàng ban đầu / trần | 100 / 125 | 100 / 125, không đổi |
| Hồi Vàng | 6/giây | 5/giây |
| HP/DMG/tốc/giá/CD bốn quân cũ | Theo bảng R1A | Không đổi |
| Quân thứ năm | Chưa có Giáo | Thêm Giáo theo [bảng TEMP_R1B](UNITS.md) |

So sánh trên cùng lịch R1B và chiến lược vòng lặp cố định, bước mô phỏng 0.02 giây: ở mức 6 Vàng/giây, chỉ dùng Giáo thắng khoảng 64.28s (nhà còn 54 HP); ở mức 5 thì thua 36.28s. Hai phương án tiếp viện Trường Kiếm và hỗn hợp Khiên/Giáo/Rìu/Trường Kiếm/Giác Đấu vẫn thắng. Giữ 5/giây để thử áp lực lựa chọn đội hình, không buff HP/DMG địch.

| Kịch bản hiện tại | Kết quả mô phỏng | Triệu hồi / chi Vàng | HP nhà ta cuối trận |
| --- | --- | --- | --- |
| Không triệu hồi | Thua 10.54s | 0 / 0 | 0 |
| Một Trường Kiếm, không bổ sung | Thua 13.12s | 1 / 25 | 0 |
| Tiếp viện Trường Kiếm liên tục | Thắng 46.84s | 13 / 325 | 80 |
| Lặp Khiên → Giáo → Rìu → Trường Kiếm → Giác Đấu | Thắng 54.02s | 12 / 370 | 80 |
| Chỉ bổ sung Giáo | Thua 36.28s | 9 / 270 | 0 |

Đây là kết quả script mô phỏng, không phải win-rate hoặc QA của người chơi. Thứ tự triệu hồi và thời điểm bấm thực tế có thể cho kết quả khác. Quan sát: một quân đơn lẻ không giữ được nhà; Giáo cần tuyến trước; đội hình có tiếp viện mới vượt hết tám địch. **Trường Kiếm liên tục vẫn thắng mà không mất HP nhà**, nên chưa thể gọi mức khó/hiệu quả các quân là cân bằng.

Giới hạn: giãn tâm chỉ bảo đảm cho trạng thái hợp lệ sinh bởi game, không sửa hàng loạt tọa độ chồng do can thiệp ngoài. Thân hình tạm đã thu gọn theo khoảng 24; vũ khí/đòn vẽ có thể giao nhau, chưa có va chạm theo pixel. Quân nhanh không vượt quân chậm; cửa spawn có thể tạm bị chặn trong giao chiến. Chưa kiểm chứng thiết bị thật hoặc đầy đủ các biến thể đội hình.

## Kiểm chứng và phạm vi chờ duyệt R1B

Build/typecheck trên Node 24.22.0, bộ 16 kiểm tra (13 mô hình/mô phỏng + 3 browser production preview), security gate và audit được chạy local. Browser dùng Chrome headless, path `/laneforge-game/`, gồm năm nút riêng biệt, Vàng/CD/cửa spawn, chơi đội hình hỗn hợp đến thắng, không triệu hồi đến thua, restart và viewport 390×844. Ảnh desktop/mobile đã được xem trực tiếp; không coi đây là QA của Owner trên thiết bị thật.

Manifest dự kiến chỉ sửa 10 file hiện có: `README.md`, `docs/DECISIONS.md`, `docs/GAME_DESIGN.md`, `docs/ROADMAP.md`, `docs/UNITS.md`, `index.html`, `src/game/Battle.ts`, `src/game/BattleScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`. Không thêm file public, dependency, workflow hay chính sách bảo mật. Prompt và output local vẫn ignore; security gate là heuristic, không bảo đảm tìm được mọi secret. Không stage/commit/push/deploy trước Owner duyệt R1B.

## OPEN / PROPOSED

- Phá căn cứ về 0 HP để thắng là cách kiểm chứng tạm của R0B; luật thắng, hòa và giới hạn thời gian R1 còn chờ duyệt.
- Kích thước map thật, vị trí spawn, va chạm, chọn mục tiêu, ưu tiên tấn công và giới hạn quân.
- Vàng ban đầu, hồi Vàng, trần Vàng, chi phí và Cooldown từng đơn vị.
- Hệ giáp, tầm đánh, tốc đánh, skill/ultimate, cân bằng và nội dung MVP.
- Chi tiết gắn thẻ, giới hạn Kim Cương, PvP online hay địa phương.

Theo dõi tại [DECISIONS](DECISIONS.md). Chưa có gameplay đầy đủ, Spell Card, tiến hóa, hệ wave hoàn chỉnh, lưu tiến trình hay multiplayer.
