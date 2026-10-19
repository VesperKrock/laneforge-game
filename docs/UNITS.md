# Đơn vị

## Roster R1C giữ từ R1B — năm loại, mỗi loại tối đa một slot

Owner đã chốt slot không trùng loại và duyệt thêm Giáo cho R1B. Một slot vẫn triệu hồi được nhiều bản sao. HP, sát thương, nhịp đánh, di chuyển, giá, CD và tầm đánh vẫn là **PROVISIONAL / CHƯA CÂN BẰNG**. Điểm yếu là phân tích để thử nghiệm, chưa phải kết luận cân bằng đã kiểm chứng.

| Đơn vị Owner đề xuất | Vai trò đề xuất | Điểm yếu đề xuất |
| --- | --- | --- |
| Trường Kiếm | Cận chiến cân bằng, giữ nhịp tiến quân | Không vượt trội trước chuyên gia chống cận chiến hoặc áp lực tầm xa |
| Rìu | Sát thương mỗi đòn cao, HP khá cao, đánh/đi chậm | Đòn chậm dễ lãng phí khi đánh mục tiêu ít HP |
| Khiên | HP cao nhất; chịu đòn chỉ bằng HP, không giáp/taunt | Sát thương và tốc chạy thấp; cần giữ tuyến trước quân hỗ trợ, không có taunt |
| Kiếm Giác Đấu | Đánh và di chuyển nhanh, HP và sát thương mỗi đòn thấp | Đi đầu thì dễ bị hạ; được vượt đồng đội ở R1C nhưng vẫn bị địch chặn |
| Giáo | Tầm dài hơn, hỗ trợ sau Khiên | HP thấp; cần giữ được tuyến trước, không bắn xa hoặc xuyên nhiều mục tiêu |

## Ứng viên mở rộng — PROPOSED / CHƯA ĐƯỢC OWNER DUYỆT

| Ứng viên | Hướng thử nghiệm đề xuất |
| --- | --- |
| Cung | Hỗ trợ tầm xa, cần tuyến trước bảo vệ |
| Dao Ngắn | Tốc độ và áp lực sớm, đổi lấy độ bền |
| Búa Chiến | Đòn nặng, nhịp chậm; cơ chế phá giáp còn mở |
| Nỏ Xuyên Giáp | Chuyên trị mục tiêu phòng thủ; hệ giáp chưa được duyệt |

## TEMP_R1B giữ nguyên cho R1C — chưa khóa cân bằng

| Loại / ký hiệu | HP | DMG/đòn | Khoảng đánh (s) | Di chuyển (tọa độ/s) | Vàng | CD slot (s) | Tầm | Hình tạm |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trường Kiếm / TK | 60 | 12 | 0.65 | 105 | 25 | 2 | 28 | Chữ nhật |
| Rìu / RI | 88 | 26 | 1.2 | 72 | 35 | 3.2 | 28 | Hình thoi + rìu |
| Khiên / KH | 150 | 5 | 0.95 | 54 | 40 | 4 | 28 | Tròn + khiên |
| Kiếm Giác Đấu / GD | 38 | 7 | 0.35 | 138 | 20 | 1.5 | 28 | Tam giác + hai kiếm |
| Giáo / GI | 50 | 10 | 0.9 | 85 | 30 | 2.8 | 58 | Thân hẹp + cán giáo dài |

Nguồn cấu hình duy nhất là `TEMP_R1B_UNITS` và `TEMP_R1B_SLOTS` trong `src/game/Battle.ts`; giữ nguyên cả năm profile từ R1B. Hai phe dùng đúng một bảng, không buff riêng Bot. Mỗi phe bắt đầu 100 Vàng / hồi 5 mỗi giây / trần 125; năm CD độc lập, cùng đường xác thực và trả giá khi triệu hồi. Giá/CD/tầm UI lấy từ cấu hình, không phải số trang trí. Theo phản hồi Owner, hai nhà cùng dùng `DEMO.baseHp = 240`; đây là HP căn cứ, không đổi HP quân trong bảng.

**Owner cho thử ở R1C:** cận chiến chồng vị trí/cùng đánh, đồng đội không chắn đòn; Rìu đánh được khi Khiên còn sống. Giáo chồng nhau, tự chiến đấu khi không có cận chiến; có cận chiến thì ưu tiên ở sau. **TEMP_R1C đề xuất:** offset hỗ trợ tối thiểu 24, được dừng xa hơn nếu đủ tầm; khi cận chiến tới từ sau, Giáo nhường bằng tốc chạy hiện tại, có chuyển tiếp ngắn đứng trước, không teleport. Địch vẫn chặn tiến quân; hai phe không được đi xuyên nhau. Không có Hòa trong luật thông thường theo Owner; nhiều quân cùng phe chết đồng thời không đồng nghĩa hai nhà có thể cùng bị phá. Không friendly fire/AoE/taunt/giáp. Offset hình dọc chỉ để đọc hình, không đổi combat; nhiều bản sao cùng loại vẫn có thể che hình/nhãn nhau. Xem [luật Bot và quan sát thử](GAME_DESIGN.md).
