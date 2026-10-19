# Quyết định thiết kế

Nguồn xác nhận: yêu cầu Owner R0A/R0B/R1A. Không coi tham số do người triển khai chọn cho bản thử là quyết định thiết kế cuối cùng.

## CONFIRMED BY OWNER

| ID | Quyết định | Phạm vi / giới hạn |
| --- | --- | --- |
| C01 | Một chiến tuyến ngang 2D, hai phía có căn cứ | Kích thước và luật thắng đầy đủ còn mở |
| C02 | Năm slot chuẩn bị trước trận | R1A bật năm slot cố định; chưa có màn chuẩn bị đội hình |
| C03 | Người chơi chọn đơn vị để triệu hồi bằng Vàng + CD theo slot | Giá, kinh tế và CD cụ thể chưa khóa |
| C04 | Đơn vị tự tiến và tự đánh | Công thức và luật chọn mục tiêu còn mở |
| C05 | PvE-first; địch có thể spawn wave theo kịch bản | Chưa có hệ campaign/wave đầy đủ |
| C06 | PvP hai bên phải dùng Vàng + CD | Chưa duyệt cách triển khai PvP |
| C07 | Bạc buff nhỏ; Vàng đổi nhịp có đánh đổi; Kim Cương tiến hóa theo vũ khí và có skill riêng | Cả ba có phụ phí Vàng/CD theo bậc; chưa có thông số khóa |
| C08 | Kim Cương không auto-win; rush Bạc là chiến lược hợp lệ | Mục tiêu cân bằng, chưa được kiểm chứng |
| C09 | Owner đề xuất bốn quân; R1A duyệt roster và hướng vai trò để thử | Không khóa roster hoặc chỉ số của game hoàn chỉnh |

## APPROVED FOR R0B TECHNICAL PROTOTYPE

| ID | Phê duyệt | Giới hạn |
| --- | --- | --- |
| T01 | Phaser 3 + TypeScript + Vite | Prototype web R0B; không tự chốt kiến trúc game hoàn chỉnh |
| T02 | GitHub Pages, project path `/laneforge-game/`, deploy qua GitHub Actions | Chỉ upload `dist/`; chưa công bố trước phê duyệt |
| T03 | Demo nhỏ có tương tác thật và kiểm thử build/browser nếu có thể | Không làm toàn bộ gameplay, Spell Card hay PvP |
| T04 | Git root đã chuẩn hóa, thư mục con rỗng là cleanup độc lập | Không di chuyển repo lại; không cưỡng chế xóa thư mục bị giữ |
| T05 | Repo public, loại trừ prompt/secrets/local data; manifest file cụ thể | Dừng trước commit/push; cần Owner duyệt R0B trong hội thoại |

## APPROVED FOR R1A LOCAL COMBAT TEST

| ID | Owner cho phép | Giới hạn |
| --- | --- | --- |
| A01 | Kế thừa Phaser 3/TypeScript/Vite và production path hiện tại | Không thêm dependency, framework hay sửa workflow/security policy |
| A02 | Năm slot cố định, Vàng chung, CD riêng; slot 5 tạm trùng Trường Kiếm | Không editor đội hình; không khóa luật deck |
| A03 | Trường Kiếm cân bằng, Rìu đòn nặng/chậm, Khiên HP cao, Giác Đấu nhanh/ít HP | Chỉ số trong [UNITS](UNITS.md) là TEMP_R1A, chưa duyệt cân bằng |
| A04 | Giao chiến trước mặt, ưu tiên địch gần nhất chắn đường, đánh nhà đúng tầm; ba địch kịch bản | Không giáp, taunt, skill hoặc AI/wave framework |
| A05 | Chỉnh sửa local, build/browser/security checks, trình manifest rồi dừng | Chưa được stage/commit/push/deploy R1A |

## OPEN / PROPOSED

| ID | Cần chốt | Hiện trạng |
| --- | --- | --- |
| O01 | Công nghệ dài hạn: web/native/engine | R0B/R1A dùng web stack hiện có; không suy rộng sang kiến trúc game hoàn chỉnh |
| O02 | Kích thước map, vị trí spawn, giới hạn quân | Tọa độ demo chỉ để thử |
| O03 | Vàng khởi đầu, hồi/trần Vàng, giá và CD | Số demo không phải thông số thiết kế |
| O04 | HP/DMG, giáp, tốc chạy, công thức tốc đánh, tầm đánh, collision/targeting | Chưa có balance hay specification chiến đấu |
| O05 | Skill/ultimate và tiến hóa theo vũ khí | Chưa triển khai |
| O06 | Tối đa một thẻ mỗi slot, không cộng dồn nhiều bậc | Đề xuất chưa duyệt |
| O07 | Số Kim Cương được dùng / còn sống, gồm một đơn vị sống mỗi slot | Đề xuất chưa duyệt |
| O08 | PvP online hay địa phương, đồng bộ và chống gian lận | Nghiên cứu ở R5 đề xuất |
| O09 | Phạm vi MVP/R1 đầy đủ, thứ tự nội dung và tiêu chí nghiệm thu | R1A chỉ duyệt core test năm slot/bốn quân; các bước tiếp theo chưa duyệt |
| O10 | Luật thắng/thua/hòa, thời lượng trận và hành vi khi ẩn tab | R0B dùng phá căn cứ và không chạy bù khi quay lại tab; chưa khóa cho R1 |
| O11 | Giáo, Cung, Dao Ngắn, Búa Chiến, Nỏ Xuyên Giáp | Ứng viên mở rộng, chưa được Owner duyệt |

## Các quyết định còn mở sau phạm vi R1A

1. Giữ stack web cho game đầy đủ hay cần yêu cầu nền tảng khác?
2. MVP rộng hơn R1A gồm những nội dung PvE và tiêu chí thắng/thua nào?
3. Map, spawn, giới hạn quân và luật giao chiến/giáp/tốc đánh sẽ theo phương án nào?
4. Kinh tế, giá và CD tạm cho thử cân bằng được duyệt ở mức nào?
5. Có duyệt một thẻ mỗi slot, không cộng bậc và giới hạn Kim Cương nào để làm cơ sở cho R2/R3?
