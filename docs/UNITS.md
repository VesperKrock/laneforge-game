# Đơn vị

## Roster thử R1A — Owner duyệt hướng vai trò, chưa khóa cân bằng

R1A cho phép dùng bốn hướng sau làm roster chơi thử tạm. HP, sát thương, nhịp đánh, di chuyển, giá và CD vẫn là **PROVISIONAL / CHƯA CÂN BẰNG**. Điểm yếu là phân tích để thử nghiệm, chưa phải kết luận cân bằng đã kiểm chứng.

| Đơn vị Owner đề xuất | Vai trò đề xuất | Điểm yếu đề xuất |
| --- | --- | --- |
| Trường Kiếm | Cận chiến cân bằng, giữ nhịp tiến quân | Không vượt trội trước chuyên gia chống cận chiến hoặc áp lực tầm xa |
| Rìu | Sát thương mỗi đòn cao, HP khá cao, đánh/đi chậm | Đòn chậm dễ lãng phí khi đánh mục tiêu ít HP |
| Khiên | HP cao nhất; chịu đòn chỉ bằng HP, không giáp/taunt | Sát thương và tốc chạy thấp; không ép địch chọn mình hoặc giữ quân nhanh ở phía sau |
| Kiếm Giác Đấu | Đánh và di chuyển nhanh, HP và sát thương mỗi đòn thấp | Dễ tiến quá xa trước tuyến chậm và bị hạ nhanh |

## Ứng viên mở rộng — PROPOSED / CHƯA ĐƯỢC OWNER DUYỆT

| Ứng viên | Hướng thử nghiệm đề xuất |
| --- | --- |
| Giáo | Tầm cận chiến dài hơn, kiểm soát khoảng cách |
| Cung | Hỗ trợ tầm xa, cần tuyến trước bảo vệ |
| Dao Ngắn | Tốc độ và áp lực sớm, đổi lấy độ bền |
| Búa Chiến | Đòn nặng, nhịp chậm; cơ chế phá giáp còn mở |
| Nỏ Xuyên Giáp | Chuyên trị mục tiêu phòng thủ; hệ giáp chưa được duyệt |

## TEMP_R1A — giá trị thử nghiệm, chưa khóa

| Loại / ký hiệu | HP | DMG/đòn | Khoảng đánh (s) | Di chuyển (tọa độ/s) | Vàng | CD slot (s) | Hình tạm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Trường Kiếm / TK | 60 | 12 | 0.65 | 105 | 25 | 2 | Chữ nhật |
| Rìu / RI | 88 | 26 | 1.2 | 72 | 35 | 3.2 | Hình thoi + rìu |
| Khiên / KH | 150 | 5 | 0.95 | 54 | 40 | 4 | Tròn + khiên |
| Kiếm Giác Đấu / GD | 38 | 7 | 0.35 | 138 | 20 | 1.5 | Tam giác + hai kiếm |

Nguồn cấu hình duy nhất trong code là `TEMP_R1A_UNITS` và `TEMP_R1A_SLOTS` ở `src/game/Battle.ts`. Slot 1 và 5 đều Trường Kiếm nhưng giữ hai bộ đếm CD riêng; dùng chung Vàng với ba slot còn lại. Giá/CD được hiển thị theo bảng này trên từng nút.

Địch tái sử dụng profile, không có hệ số buff bí mật theo phe. Màu xanh/đỏ phân biệt phe; hình và ký hiệu TK/RI/KH/GD phân biệt loại. Bảng không có giáp, kỹ năng, hiệu ứng khắc chế hoặc cân bằng chiến dịch. Cùng phe có thể chồng hình; chưa có điều phối đội hình hay giới hạn quân được duyệt.
