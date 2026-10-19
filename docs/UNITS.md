# Đơn vị

## CONFIRMED — R1D chọn năm loại khác nhau từ kho sáu quân

Owner đã duyệt thêm Búa Chiến AOE cho thử local R1D. Mặc định vẫn năm quân R1C; Búa là lựa chọn thứ sáu trong kho, không phải slot thứ sáu. Player và Bot mang cùng năm loại đã chọn, mỗi slot có thể triệu hồi nhiều bản sao. Không giới hạn stack ba quân, không tăng HP quân cũ. Các số **TEMP_R1D / CHƯA CÂN BẰNG**, chưa khóa thông số game đầy đủ.

| Đơn vị Owner đề xuất | Vai trò đề xuất | Điểm yếu đề xuất |
| --- | --- | --- |
| Trường Kiếm | Cận chiến cân bằng, giữ nhịp tiến quân | Không vượt trội trước chuyên gia chống cận chiến hoặc áp lực tầm xa |
| Rìu | Sát thương mỗi đòn cao, HP khá cao, đánh/đi chậm | Đòn chậm dễ lãng phí khi đánh mục tiêu ít HP |
| Khiên | HP cao nhất; chịu đòn chỉ bằng HP, không giáp/taunt | Sát thương và tốc chạy thấp; cần giữ tuyến trước quân hỗ trợ, không có taunt |
| Kiếm Giác Đấu | Đánh và di chuyển nhanh, HP và sát thương mỗi đòn thấp | Đi đầu thì dễ bị hạ; được vượt đồng đội ở R1C nhưng vẫn bị địch chặn |
| Giáo | Tầm dài hơn, hỗ trợ sau Khiên | HP thấp; cần giữ được tuyến trước, không bắn xa hoặc xuyên nhiều mục tiêu |
| Búa Chiến | Đánh mục tiêu chính và mọi địch khác trong vùng tâm 40 | Đắt/chậm, DPS đơn thấp hơn Rìu; đứng riêng dễ bị Giác Đấu vây hạ |

## Ứng viên mở rộng — PROPOSED / CHƯA ĐƯỢC OWNER DUYỆT

| Ứng viên | Hướng thử nghiệm đề xuất |
| --- | --- |
| Cung | Hỗ trợ tầm xa, cần tuyến trước bảo vệ |
| Dao Ngắn | Tốc độ và áp lực sớm, đổi lấy độ bền |
| Nỏ Xuyên Giáp | Chuyên trị mục tiêu phòng thủ; hệ giáp chưa được duyệt |

## TEMP_R1D — giữ năm profile cũ, thêm Búa và windup

| Loại / ký hiệu | HP | DMG/đòn | Khoảng đánh (s) | Di chuyển (tọa độ/s) | Vàng | CD slot (s) | Tầm | Hình tạm |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trường Kiếm / TK | 60 | 12 | 0.65 | 105 | 25 | 2 | 28 | Chữ nhật |
| Rìu / RI | 88 | 26 | 1.2 | 72 | 35 | 3.2 | 28 | Hình thoi + rìu |
| Khiên / KH | 150 | 5 | 0.95 | 54 | 40 | 4 | 28 | Tròn + khiên |
| Kiếm Giác Đấu / GD | 38 | 7 | 0.35 | 138 | 20 | 1.5 | 28 | Tam giác + hai kiếm |
| Giáo / GI | 50 | 10 | 0.9 | 85 | 30 | 2.8 | 58 | Thân hẹp + cán giáo dài |
| Búa Chiến / BC | 72 | 26 chính, 10 mỗi quân phụ trong vùng | 1.8 | 60 | 45 | 4 | 28 | Thân rộng + đầu búa vuông |

Nguồn duy nhất: `TEMP_R1D_UNITS`, `TEMP_R1D`, `DEFAULT_LOADOUT` và `Battle.loadout` trong `src/game/Battle.ts`. Năm profile cũ không đổi HP/DMG/tốc đánh/tốc đi/giá/CD/tầm. Hai phe cùng bảng, 100 Vàng đầu trận / +5 mỗi giây / trần 125, năm CD riêng, cùng validator/trả giá; nhà chung `DEMO.baseHp = 240`. Không buff riêng Bot.

**Rìu:** đòn đầu sau 0.6s tính từ bước xác nhận vào tầm; tối thiểu 1.2s giữa các cú đánh thực tế. Mục tiêu chết giữa hai bước và có mục tiêu mới trong tầm thì giữ timer: sẵn sàng được đánh ngay, chưa sẵn sàng chỉ chờ phần còn lại. Mất hết mục tiêu trong tầm thì tiếp cận lại chờ windup mới và không xóa CD đòn cũ còn lại. Test revision phát hiện ca rời/vào nhanh từng cho hai đòn cách 0.62s; nay giữ tối thiểu 1.2s. Không retarget hồi tố khi mục tiêu chết trong cùng bước đã chọn đòn. Búa dùng cùng logic nhỏ với windup 0.9s/chu kỳ 1.8s. Hai vũ khí nặng làm tròn thời gian lên theo frame, không rút ngắn khoảng đánh; ba quân khác giữ cadence cũ.

**Giáo — Owner sửa rõ:** chủ động kite khi địch áp sát, không cần có đồng minh. Tiến 85/s, lùi 48/s và vẫn đánh đúng nhịp/tầm; clamp tại cửa nhà. Ngưỡng thử **52** trong tầm 58 để có khoảng đệm 6, tránh lùi rồi tiến giật ở mép tầm và giúp hai Giáo ổn định đấu tầm xa. Khi có cận chiến đồng minh ở trước trong phạm vi 96 thì ưu tiên hỗ trợ sau 30; không lùi khỏi tuyến bảo vệ chỉ vì địch đang chạm Khiên. 30 = 58 - 28 giữ tầm hỗ trợ. Giáo di chuyển trước rồi cận chiến cả hai phe cùng tính đuổi theo tọa độ mới, tránh dừng ở vị trí Giáo cũ khiến đòn mãi thiếu tầm. Không trạng thái AI/hysteresis mới. Cả bốn cận chiến đã đánh trúng Giáo kite trước biên trong mẫu thử; Giác Đấu không được bảo đảm thắng mọi khoảng xuất phát.

**Búa — số revision Owner cho thử:** 26 lên mục tiêu chính; thêm 10 một lần lên **mọi địch sống khác** trong bán kính tâm 40 quanh mục tiêu đó; bỏ cap hai quân phụ. Thứ tự theo khoảng cách rồi ID, không lặp chính/phụ; phải có mục tiêu chính sống trong tầm mới có splash. Đánh đơn chỉ 26; nhà chỉ nhận đòn chính, không splash. DPS đơn lý thuyết Búa 26/1.8 ≈ 14.44 < Rìu 26/1.2 ≈ 21.67. Cụm ba nhận tổng 46/đòn, chia lên ba quân. Không friendly fire, giáp/xuyên giáp, stun, knockback, chí mạng hoặc hệ số ẩn; prototype chưa có trạng thái bất tử. Chưa tune thêm sau số revision.

Không có Hòa trong luật thông thường; lỗi xuyên phe hoặc hai nhà cùng bị phá phải báo bất biến, không ưu tiên Player/Bot. Hình/nhãn chồng nhau vẫn có thể che nhau. [GAME_DESIGN](GAME_DESIGN.md) ghi đối đầu và giới hạn, không suy ra cân bằng cuối từ vài mẫu thử.
