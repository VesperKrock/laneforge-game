# Đơn vị

## Roster thử R1B — năm loại, mỗi loại tối đa một slot

Owner đã chốt slot không trùng loại và duyệt thêm Giáo cho R1B. Một slot vẫn triệu hồi được nhiều bản sao. HP, sát thương, nhịp đánh, di chuyển, giá, CD và tầm đánh vẫn là **PROVISIONAL / CHƯA CÂN BẰNG**. Điểm yếu là phân tích để thử nghiệm, chưa phải kết luận cân bằng đã kiểm chứng.

| Đơn vị Owner đề xuất | Vai trò đề xuất | Điểm yếu đề xuất |
| --- | --- | --- |
| Trường Kiếm | Cận chiến cân bằng, giữ nhịp tiến quân | Không vượt trội trước chuyên gia chống cận chiến hoặc áp lực tầm xa |
| Rìu | Sát thương mỗi đòn cao, HP khá cao, đánh/đi chậm | Đòn chậm dễ lãng phí khi đánh mục tiêu ít HP |
| Khiên | HP cao nhất; chịu đòn chỉ bằng HP, không giáp/taunt | Sát thương và tốc chạy thấp; cần được xếp trước quân hỗ trợ, không có taunt để tự đổi tuyến |
| Kiếm Giác Đấu | Đánh và di chuyển nhanh, HP và sát thương mỗi đòn thấp | Đi đầu thì dễ bị hạ; đứng sau quân chậm thì phải giữ tốc theo hàng |
| Giáo | Tầm dài hơn, hỗ trợ sau Khiên | HP thấp; cần giữ được tuyến trước, không bắn xa hoặc xuyên nhiều mục tiêu |

## Ứng viên mở rộng — PROPOSED / CHƯA ĐƯỢC OWNER DUYỆT

| Ứng viên | Hướng thử nghiệm đề xuất |
| --- | --- |
| Cung | Hỗ trợ tầm xa, cần tuyến trước bảo vệ |
| Dao Ngắn | Tốc độ và áp lực sớm, đổi lấy độ bền |
| Búa Chiến | Đòn nặng, nhịp chậm; cơ chế phá giáp còn mở |
| Nỏ Xuyên Giáp | Chuyên trị mục tiêu phòng thủ; hệ giáp chưa được duyệt |

## TEMP_R1B — giá trị thử nghiệm, chưa khóa

| Loại / ký hiệu | HP | DMG/đòn | Khoảng đánh (s) | Di chuyển (tọa độ/s) | Vàng | CD slot (s) | Tầm | Hình tạm |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trường Kiếm / TK | 60 | 12 | 0.65 | 105 | 25 | 2 | 28 | Chữ nhật |
| Rìu / RI | 88 | 26 | 1.2 | 72 | 35 | 3.2 | 28 | Hình thoi + rìu |
| Khiên / KH | 150 | 5 | 0.95 | 54 | 40 | 4 | 28 | Tròn + khiên |
| Kiếm Giác Đấu / GD | 38 | 7 | 0.35 | 138 | 20 | 1.5 | 28 | Tam giác + hai kiếm |
| Giáo / GI | 50 | 10 | 0.9 | 85 | 30 | 2.8 | 58 | Thân hẹp + cán giáo dài |

Nguồn cấu hình duy nhất trong code là `TEMP_R1B_UNITS` và `TEMP_R1B_SLOTS` ở `src/game/Battle.ts`. Thứ tự slot: sword / axe / shield / gladiator / spear; invariant lúc nạp module từ chối loại bị lặp. Bốn profile cũ giữ nguyên số của R1A; Giáo dùng đúng bộ thông số đề xuất. Giá/CD/tầm hiển thị từ bảng cấu hình trên nút. Kinh tế giảm hồi Vàng 6 → 5/giây, đầu trận/trần vẫn 100/125; xem [quan sát thử](GAME_DESIGN.md).

Địch tái sử dụng profile, không có hệ số buff bí mật theo phe. Màu xanh/đỏ phân biệt phe; hình và ký hiệu TK/RI/KH/GD/GI phân biệt loại. Bảng không có giáp, kỹ năng, hiệu ứng khắc chế hoặc cân bằng chiến dịch. Quân cùng phe giữ tâm cách nhau tối thiểu 24, không vượt nhau; Giáo sau Khiên có thể đánh địch ở khoảng 52. Thứ tự xếp quân có ý nghĩa, chưa có điều phối đội hình hoặc giới hạn quân được duyệt.
