# Quyết định thiết kế

Nguồn xác nhận: yêu cầu Owner R0A/R0B/R1A/R1B/R1C/R1D. Không coi tham số do người triển khai chọn cho bản thử là quyết định thiết kế cuối cùng.

## CONFIRMED BY OWNER

| ID | Quyết định | Phạm vi / giới hạn |
| --- | --- | --- |
| C01 | Một chiến tuyến ngang 2D, hai phía có căn cứ | Kích thước và luật thắng đầy đủ còn mở |
| C02 | Năm slot chuẩn bị trước trận | R1D duyệt chọn năm loại khác nhau từ kho sáu quân; mặc định năm loại R1C |
| C03 | Người chơi chọn đơn vị để triệu hồi bằng Vàng + CD theo slot | Giá, kinh tế và CD cụ thể chưa khóa |
| C04 | Đơn vị tự tiến và tự đánh | Công thức và luật chọn mục tiêu còn mở |
| C05 | PvE-first | R1B dùng wave lịch sử; R1C thử Solo vs Bot cùng kinh tế, chưa có campaign |
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

## APPROVED FOR R1B — lịch sử, đã công bố tại `add1f73`

| ID | Owner cho phép | Giới hạn |
| --- | --- | --- |
| B01 | Năm slot: Trường Kiếm / Rìu / Khiên / Kiếm Giác Đấu / Giáo; invariant phát hiện cấu hình trùng | Không deck editor, không framework validate |
| B02 | Giáo hỗ trợ sau Khiên bằng tầm đánh dài hơn; cùng profile cho cả hai phe | Không projectile, xuyên mục tiêu, AoE, giáp hoặc skill |
| B03 | Chọn địch gần nhất phía trước, tie-break ID; giãn quân một chiều, không vượt đồng đội | Không physics/pathfinding/nhiều lane; cửa spawn đầy thì chờ chỗ |
| B04 | Lịch PvE hữu hạn, cố định; chỉnh số vừa phải sau thử nghiệm | Không AI thích ứng, buff ngầm hoặc wave manager |
| B05 | R1B đã được duyệt và công bố riêng | Không cấp quyền stage/commit/push/deploy cho R1C |

Các giá trị **TEMP_R1B** đã công bố để thử: hồi Vàng 6 → 5/giây, đầu trận/trần giữ 100/125; chỉ số bốn quân cũ giữ nguyên, thêm Giáo theo đề xuất 50 HP / 10 DMG / 0.9s / tốc 85 / giá 30 / CD 2.8s / tầm 58. Giãn tâm đồng đội 24 là luật R1B lịch sử, được thay bởi overlap R1C. Đây là cấu hình thử được phép triển khai, chưa phải số liệu cân bằng Owner đã khóa. Xem [UNITS](UNITS.md) và [kịch bản thử](GAME_DESIGN.md).

## APPROVED FOR R1C — lịch sử, đã công bố tại `da7d13c`

R1B đã được Owner duyệt riêng, commit/push/deploy và kiểm chứng tại `add1f73`. Không gộp quyền xuất bản R1B với R1C.

| ID | Owner cho phép trong R1C | Giới hạn |
| --- | --- | --- |
| RC01 | Bỏ tám địch theo lịch, Bot có cùng năm slot/giá/CD và kinh tế riêng như Player | Một đường `summon(side, slot)`, không tiền/CD vô hạn hoặc spawn miễn phí |
| RC02 | Cho xem hai bên slot/Vàng/CD, tên và lý do khi Bot triệu hồi | Chỉ Player có input; slot Bot luôn disabled, không phải cơ chế chống gian lận PvP |
| RC03 | Bot theo ít quy tắc, phản ứng đội hình/áp lực, có thể chờ | Deterministic, không planner, backend, dự đoán click hay ép thắng theo thời gian |
| RC04 | Cận chiến chồng/vượt đồng đội và cùng đánh; Giáo đứng sau nhưng tự chiến đấu khi thiếu cận chiến | Không đi xuyên địch; nhường tuyến liên tục, không teleport; chưa chốt collision game đầy đủ |
| RC05 | Giữ năm profile và kinh tế R1B cho thử nghiệm | Không coi số tạm là cân bằng cuối cùng; HP nhà được Owner đổi thành 240/240 trước duyệt |
| RC06 | Build, mô hình/browser, security gate/audit, trình manifest local | NO STAGE / NO COMMIT / NO PUSH / NO DEPLOY trước duyệt R1C |
| RC07 | Theo phản hồi Owner: 240 HP cả hai nhà, cùng cấu hình; kiểm tra kinh tế và xử lý đối xứng | Giữ phá nhà về 0, giữ heuristic Bot; không buff bí mật hoặc thêm hệ thống |
| RC08 | Owner chốt không có Hòa trong luật thông thường; hai phe không đi xuyên nhau | Bảo toàn chiến tuyến; hai nhà cùng bị phá là lỗi trạng thái, không phân xử theo thứ tự |

**TEMP_R1C do triển khai đề xuất:** hỗ trợ Giáo tối thiểu 24; Bot quyết định 0.75s, áp lực nhà trong 180, mục tiêu bền còn 88 HP/gần tuyến trong 90, hỗ trợ xét tầm 58. Giảm điểm quân trùng/loại vừa chọn; dành tiền cho ưu tiên mạnh khi an toàn, dùng quân vừa tiền khi nguy cấp. Chi tiết và kết quả thật ở [GAME_DESIGN](GAME_DESIGN.md). Không đổi `TEMP_R1B_UNITS`, 100 Vàng đầu / 5 mỗi giây / trần 125.

**Sửa tối thiểu sau audit R1C:** tính di chuyển từ cùng trạng thái; chọn đòn trước áp sát thương để ID thấp không hủy đòn trả; Bot spawn ở ranh giới cuối bước như input Player giữa frame. **Theo RC08:** bỏ Hòa khỏi model/UI. Test cũ đặt hai đội sau lưng nhau (Player x=822, Bot x=138), không phải trạng thái trận hợp lệ. Kiểm tra bất biến báo lỗi khi xuyên chiến tuyến, ngoài lane hoặc hai nhà cùng bị phá; không ưu tiên phe nào. Xem lập luận và kiểm chứng bất biến tại [GAME_DESIGN](GAME_DESIGN.md). Bước sửa lỗi R1C không đổi heuristic Bot, giá/CD/profile hoặc kinh tế.

Ẩn tab tạm dừng mô phỏng local, không chạy bù. PvP tương lai cần nguồn thẩm quyền hoặc đồng bộ an toàn tương đương để xác thực trạng thái/thời gian/Vàng/CD/lệnh. Hiển thị slot đối thủ chỉ là minh bạch, không thay thế xác thực; chưa triển khai networking.

## APPROVED FOR R1D LOCAL IMPLEMENTATION

Fresh-check R1C: `da7d13c46f550b5a66576253f47323260ac8deef` trùng `origin/main`, worktree/index sạch trước sửa. Đây là gói mới, không gộp quyền xuất bản từ R1C. Baseline build, 30 tests, security gate và audit đều PASS.

| ID | CONFIRMED / Owner cho phép | Giới hạn |
| --- | --- | --- |
| RD01 | Rìu 88 HP / 26 DMG / 35 Vàng; windup đầu 0.6s, tối thiểu 1.2s giữa các đòn thật | Giữ tiến độ đổi mục tiêu trong tầm, không đòn miễn phí; rời/vào tầm không xóa CD còn lại; không retarget hồi tố cùng bước |
| RD02 | Revision: Giáo chủ động kite 48/s khi địch áp sát kể cả đứng riêng, vẫn hỗ trợ sau đồng minh khi phù hợp | Giữ tiến 85, tầm 58 và chỉ số cũ; đánh khi lùi; đuổi bắt được, không thoát lane |
| RD03 | Revision: Búa AOE 26 chính + 10 lên mọi địch khác trong bán kính 40; giá 45 | Giữ 72 HP / windup 0.9 / nhịp 1.8 / CD 4; không cap phụ, không splash nhà/đồng minh, không buff bí mật/stun/knockback |
| RD04 | Kho quân inline trước trận, keyboard/touch; Bot dùng cùng năm loại đã chọn | Khóa khi chạy; Chơi lại giữ đội hình, Về chuẩn bị cho sửa; không deck-building AI hay lưu dữ liệu |
| RD05 | Giữ kinh tế đối xứng, hai nhà 240, combat cùng bước, không xuyên phe/không Hòa | Không nâng HP/đổi giá hoặc CD năm quân cũ, chưa giới hạn stack ba quân |
| RD06 | Phong cách giao tranh B: có thời gian phản ứng/tiếp viện | 4–7s duel, 8–12s Khiên và 60–120s trận là định hướng; không ép thời gian/kết quả |
| RD07 | Đọc/sửa/kiểm thử local, cập nhật tài liệu và trình manifest | NO STAGE / NO COMMIT / NO PUSH / NO DEPLOY trước Owner duyệt manifest R1D riêng |

**TEMP_R1D revision, chưa khóa cân bằng:** Búa theo số Owner cho thử: HP 72 / DMG 26 / splash 10 mỗi quân phụ trong vùng 40, không cap / windup 0.9s / khoảng đánh 1.8s / tốc 60 / tầm 28 / giá 45 / CD 4s. Bộ 18/8/cap hai/giá 40 đã bị thay, không phải thông số hiện hành. Giáo giữ offset 30 và tìm đồng minh trong 96; thêm ngưỡng kite thử 52 trong tầm 58, không yêu cầu có đồng minh mới được lùi. Các ngưỡng 30/96/52 do triển khai chọn, cần Owner đánh giá. Bot giữ heuristic/nhịp R1C và điểm Búa thử 10 khi có cụm địch gần giao chiến; cùng giá 45 lấy từ bảng, không bù tiền/CD. Xem đối đầu revision tại [GAME_DESIGN](GAME_DESIGN.md).

R1D trước revision chỉ lùi để nhường đồng minh là diễn giải đã bị Owner thay bằng kiting chủ động. Logic giữ timer khi đổi mục tiêu trong tầm đã đúng, revision thêm regression; sửa nhỏ ca rời/vào nhanh từng cho khoảng đòn 0.62s và tránh làm tròn frame gây đòn sớm. R1C dùng offset 24/lùi 85 và năm loại cố định là lịch sử. R1D không thêm dependency, workflow, service, Spell Card, Kim Cương, tài khoản, backend, lưu dữ liệu hoặc PvP.

## OPEN / PROPOSED

| ID | Cần chốt | Hiện trạng |
| --- | --- | --- |
| O01 | Công nghệ dài hạn: web/native/engine | R0B/R1A/R1B/R1C dùng web stack hiện có; không suy rộng sang kiến trúc game hoàn chỉnh |
| O02 | Kích thước map, vị trí spawn, giới hạn quân | Tọa độ demo chỉ để thử |
| O03 | Vàng khởi đầu, hồi/trần Vàng, giá và CD | Số demo không phải thông số thiết kế |
| O04 | HP/DMG, giáp, tốc chạy, công thức tốc đánh, tầm đánh, collision/targeting | Chưa có balance hay specification chiến đấu |
| O05 | Skill/ultimate và tiến hóa theo vũ khí | Chưa triển khai |
| O06 | Tối đa một thẻ mỗi slot, không cộng dồn nhiều bậc | Đề xuất chưa duyệt |
| O07 | Số Kim Cương được dùng / còn sống, gồm một đơn vị sống mỗi slot | Đề xuất chưa duyệt |
| O08 | PvP online hay địa phương, đồng bộ và chống gian lận | Nghiên cứu ở R5 đề xuất |
| O09 | Phạm vi MVP/R1 đầy đủ, thứ tự nội dung và tiêu chí nghiệm thu | R1D chỉ thử combat/kho quân/Búa local; phạm vi game đầy đủ chưa duyệt |
| O10 | Luật thắng/thua chi tiết, thời lượng trận và hành vi khi ẩn tab | R1C phá nhà về 0, không có Hòa theo RC08 và không chạy bù khi quay lại tab; luật thời gian đầy đủ còn mở |
| O11 | Cung, Dao Ngắn, Nỏ Xuyên Giáp; giáp/xuyên giáp | Chưa duyệt; Búa đã duyệt thử AOE R1D, không duyệt cơ chế phá giáp |
| O12 | Giới hạn stack và tiêu chí nhịp trận | Owner chưa chốt stack ba quân; nhiều duel còn ngắn, một số trận vượt 120s; không tự sửa HP hoặc áp timeout |

## Các quyết định còn mở sau phạm vi R1D

1. Giữ stack web cho game đầy đủ hay cần yêu cầu nền tảng khác?
2. MVP rộng hơn R1C gồm những nội dung PvE và tiêu chí thắng/thua nào?
3. Map, spawn, giới hạn quân và luật giao chiến/giáp/tốc đánh sẽ theo phương án nào?
4. Kinh tế, giá và CD tạm cho thử cân bằng được duyệt ở mức nào?
5. Có duyệt một thẻ mỗi slot, không cộng bậc và giới hạn Kim Cương nào để làm cơ sở cho R2/R3?
