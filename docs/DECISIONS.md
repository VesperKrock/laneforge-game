# Quyết định thiết kế

Nguồn xác nhận: yêu cầu Owner R0A/R0B/R1A/R1B. Không coi tham số do người triển khai chọn cho bản thử là quyết định thiết kế cuối cùng.

## CONFIRMED BY OWNER

| ID | Quyết định | Phạm vi / giới hạn |
| --- | --- | --- |
| C01 | Một chiến tuyến ngang 2D, hai phía có căn cứ | Kích thước và luật thắng đầy đủ còn mở |
| C02 | Năm slot chuẩn bị trước trận | R1B dùng năm loại cố định; chưa có màn chuẩn bị đội hình |
| C03 | Người chơi chọn đơn vị để triệu hồi bằng Vàng + CD theo slot | Giá, kinh tế và CD cụ thể chưa khóa |
| C04 | Đơn vị tự tiến và tự đánh | Công thức và luật chọn mục tiêu còn mở |
| C05 | PvE-first; địch có thể spawn wave theo kịch bản | Chưa có hệ campaign/wave đầy đủ |
| C06 | PvP hai bên phải dùng Vàng + CD | Chưa duyệt cách triển khai PvP |
| C07 | Bạc buff nhỏ; Vàng đổi nhịp có đánh đổi; Kim Cương tiến hóa theo vũ khí và có skill riêng | Cả ba có phụ phí Vàng/CD theo bậc; chưa có thông số khóa |
| C08 | Kim Cương không auto-win; rush Bạc là chiến lược hợp lệ | Mục tiêu cân bằng, chưa được kiểm chứng |
| C09 | Owner đề xuất bốn quân; R1A duyệt roster và hướng vai trò để thử | Không khóa roster hoặc chỉ số của game hoàn chỉnh |
| C10 | Mỗi loại quân/vũ khí có tối đa một slot trong đội hình | Owner đã chốt ở R1B; vẫn được triệu hồi nhiều bản sao từ cùng một slot |

## APPROVED FOR R0B TECHNICAL PROTOTYPE

| ID | Phê duyệt | Giới hạn |
| --- | --- | --- |
| T01 | Phaser 3 + TypeScript + Vite | Prototype web R0B; không tự chốt kiến trúc game hoàn chỉnh |
| T02 | GitHub Pages, project path `/laneforge-game/`, deploy qua GitHub Actions | Chỉ upload `dist/`; chưa công bố trước phê duyệt |
| T03 | Demo nhỏ có tương tác thật và kiểm thử build/browser nếu có thể | Không làm toàn bộ gameplay, Spell Card hay PvP |
| T04 | Git root đã chuẩn hóa, thư mục con rỗng là cleanup độc lập | Không di chuyển repo lại; không cưỡng chế xóa thư mục bị giữ |
| T05 | Repo public, loại trừ prompt/secrets/local data; manifest file cụ thể | Dừng trước commit/push; cần Owner duyệt R0B trong hội thoại |

## APPROVED FOR R1A — lịch sử, đã công bố tại `1086c8a`

| ID | Owner cho phép | Giới hạn |
| --- | --- | --- |
| A01 | Kế thừa Phaser 3/TypeScript/Vite và production path hiện tại | Không thêm dependency, framework hay sửa workflow/security policy |
| A02 | Năm slot cố định, Vàng chung, CD riêng | Roster hiện tại theo C10 và R1B bên dưới |
| A03 | Trường Kiếm cân bằng, Rìu đòn nặng/chậm, Khiên HP cao, Giác Đấu nhanh/ít HP | Chỉ số trong [UNITS](UNITS.md) là TEMP_R1A, chưa duyệt cân bằng |
| A04 | Giao chiến trước mặt, ưu tiên địch gần nhất chắn đường, đánh nhà đúng tầm; ba địch kịch bản | Không giáp, taunt, skill hoặc AI/wave framework |
| A05 | R1A đã được Owner duyệt và công bố | Không cấp quyền công bố cho vòng R1B mới |

## APPROVED FOR R1B LOCAL PLAYTEST

| ID | Owner cho phép | Giới hạn |
| --- | --- | --- |
| B01 | Năm slot: Trường Kiếm / Rìu / Khiên / Kiếm Giác Đấu / Giáo; invariant phát hiện cấu hình trùng | Không deck editor, không framework validate |
| B02 | Giáo hỗ trợ sau Khiên bằng tầm đánh dài hơn; cùng profile cho cả hai phe | Không projectile, xuyên mục tiêu, AoE, giáp hoặc skill |
| B03 | Chọn địch gần nhất phía trước, tie-break ID; giãn quân một chiều, không vượt đồng đội | Không physics/pathfinding/nhiều lane; cửa spawn đầy thì chờ chỗ |
| B04 | Lịch PvE hữu hạn, cố định; chỉnh số vừa phải sau thử nghiệm | Không AI thích ứng, buff ngầm hoặc wave manager |
| B05 | Làm và kiểm thử local rồi trình manifest | NO STAGE / NO COMMIT / NO PUSH / NO DEPLOY cho R1B |

Các giá trị **TEMP_R1B** đang thử: hồi Vàng 6 → 5/giây, đầu trận/trần giữ 100/125; chỉ số bốn quân cũ giữ nguyên, thêm Giáo theo đề xuất 50 HP / 10 DMG / 0.9s / tốc 85 / giá 30 / CD 2.8s / tầm 58. Giãn tâm đồng đội 24 tọa độ. Đây là cấu hình thử được phép triển khai, chưa phải số liệu cân bằng Owner đã khóa. Xem [UNITS](UNITS.md) và [kịch bản thử](GAME_DESIGN.md).

## OPEN / PROPOSED

| ID | Cần chốt | Hiện trạng |
| --- | --- | --- |
| O01 | Công nghệ dài hạn: web/native/engine | R0B/R1A/R1B dùng web stack hiện có; không suy rộng sang kiến trúc game hoàn chỉnh |
| O02 | Kích thước map, vị trí spawn, giới hạn quân | Tọa độ demo chỉ để thử |
| O03 | Vàng khởi đầu, hồi/trần Vàng, giá và CD | Số demo không phải thông số thiết kế |
| O04 | HP/DMG, giáp, tốc chạy, công thức tốc đánh, tầm đánh, collision/targeting | Chưa có balance hay specification chiến đấu |
| O05 | Skill/ultimate và tiến hóa theo vũ khí | Chưa triển khai |
| O06 | Tối đa một thẻ mỗi slot, không cộng dồn nhiều bậc | Đề xuất chưa duyệt |
| O07 | Số Kim Cương được dùng / còn sống, gồm một đơn vị sống mỗi slot | Đề xuất chưa duyệt |
| O08 | PvP online hay địa phương, đồng bộ và chống gian lận | Nghiên cứu ở R5 đề xuất |
| O09 | Phạm vi MVP/R1 đầy đủ, thứ tự nội dung và tiêu chí nghiệm thu | R1B chỉ mở rộng roster, spacing và sức ép PvE; các bước tiếp theo chưa duyệt |
| O10 | Luật thắng/thua/hòa, thời lượng trận và hành vi khi ẩn tab | R0B dùng phá căn cứ và không chạy bù khi quay lại tab; chưa khóa cho R1 |
| O11 | Cung, Dao Ngắn, Búa Chiến, Nỏ Xuyên Giáp | Ứng viên mở rộng chưa duyệt; Giáo đã được duyệt làm quân thử R1B |

## Các quyết định còn mở sau phạm vi R1B

1. Giữ stack web cho game đầy đủ hay cần yêu cầu nền tảng khác?
2. MVP rộng hơn R1B gồm những nội dung PvE và tiêu chí thắng/thua nào?
3. Map, spawn, giới hạn quân và luật giao chiến/giáp/tốc đánh sẽ theo phương án nào?
4. Kinh tế, giá và CD tạm cho thử cân bằng được duyệt ở mức nào?
5. Có duyệt một thẻ mỗi slot, không cộng bậc và giới hạn Kim Cương nào để làm cơ sở cho R2/R3?
