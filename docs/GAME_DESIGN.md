# LaneForge — Game design baseline

Baseline từ yêu cầu Owner R0A/R0B/R1A/R1B/R1C, chưa phải specification game hoàn chỉnh.

## CONFIRMED BY OWNER

- Chiến thuật/thủ thành 2D, một chiến tuyến ngang, hai căn cứ; quân tự tiến và tự đánh.
- Năm slot, mỗi loại tối đa một slot; được triệu hồi nhiều bản sao nếu đủ Vàng và CD.
- R1C thử **Solo vs Bot**: hai bên có Vàng và năm CD riêng, cùng giá và cùng đường kiểm tra triệu hồi. Player chỉ điều khiển phe mình; lựa chọn đã thực hiện của Bot quan sát được.
- R1C bỏ lịch tám quân miễn phí R1B. Bot quyết định theo trạng thái hiện tại, tiếp tục tới khi trận kết thúc; không buff ngầm hay ép kết quả theo thời gian.
- Thử nghiệm đội hình R1C cho cận chiến chồng vị trí và cùng đánh; Giáo ưu tiên hỗ trợ sau cận chiến, được chồng Giáo và vẫn chiến đấu khi không có cận chiến.
- Ưu tiên PvE; Solo vs Bot local không phải PvP online. Spell Card ba bậc thuộc thiết kế tương lai, xem [SPELL_CARDS](SPELL_CARDS.md); chưa triển khai trong vòng này.
- Không có kết quả Hòa trong luật thông thường; quân khác phe phải chặn nhau và giao chiến trước khi phá nhà. Cận chiến cùng phe vẫn được chồng nhau.
- **ĐƠN GIẢN NHƯNG HIỆU QUẢ**: kế thừa code Phaser/TypeScript/Vite, không AI framework/backend/hệ thống phụ.

## Baseline đã công bố

R0B `19aa892` xác minh web/Pages; R1A `1086c8a` mở năm slot/bốn profile. R1B `add1f736f9c2953f0a6df3f68aeed937be007aac` đã commit/push fast-forward, đối chiếu origin/main, Actions SUCCESS và kiểm chứng Pages. R1B có roster năm loại, giãn đồng đội 24 và tám địch theo lịch 0–18s; **spacing cứng và lịch đó là lịch sử, được thay bằng R1C bên dưới**. R1C chỉ làm local và cần phê duyệt riêng.

## R1C — luật trận đang thử local

### Kinh tế và triệu hồi

- Mỗi phe bắt đầu 100 Vàng, hồi 5/giây, trần 125. Hai mảng CD riêng; cùng năm profile `TEMP_R1B_UNITS` và thứ tự `TEMP_R1B_SLOTS`. Không sửa HP/DMG/nhịp đánh/tốc chạy/giá/CD/tầm quân R1B.
- `canSummon(side, slot)` / `summon(side, slot)` trong `src/game/Battle.ts` là đường xác thực duy nhất cho cả Player lẫn Bot: phe/slot hợp lệ, trận đang chạy, đủ Vàng, hết CD và cửa không nằm sau một địch chắn. Lệnh bị từ chối không đổi trạng thái.
- Đồng đội tại cửa không cản spawn; nhiều loại có thể xuất hiện cùng tọa độ. Bot không có spawn miễn phí, tiền vô hạn hoặc CD rút ngắn.
- Theo phản hồi Owner trước duyệt R1C, HP nhà **240 Player / 240 Bot**, dùng một cấu hình gốc `DEMO.baseHp = 240` cho khởi tạo/reset, UI và thanh HP. Đây là giá trị thử được Owner yêu cầu, chưa phải cân bằng cuối.
- Phá căn cứ về 0 để thắng/thua, không giới hạn thời gian hoặc điều kiện ép thắng bí mật. Game over đóng băng mô phỏng. Restart xóa quân, cả hai pool Vàng/CD, lựa chọn và nhịp quyết định Bot.

### Rà soát đối xứng sau phản hồi Owner

- **Không tiêu tiền (fixture chặn mọi lệnh chi Vàng, không sửa hàm cập nhật):** tại 0/1/2/3/4/5s, cả hai phe lần lượt có 100/105/110/115/120/125; sau đó cùng giữ trần 125. So sánh bằng nhau ở mỗi bước 0.01s, không chỉ ở đầu/cuối.
- **Có tiêu tiền:** trong bốn giây đầu Player không triệu hồi có 120; Bot đã trả 110 cho các lệnh hợp lệ nên còn 10. Hai bên cùng nhận 20 Vàng; chênh số dư là chi tiêu, không phải khác tốc hồi. Khi chạm trần, phải tính từng bước `min(125, số dư + thu nhập) - chi trong bước`, không cộng dồn thu nhập đã bị trần cắt.
- **Spawn và CD:** cả hai dùng cùng vị trí spawn phản chiếu, giá/CD và validator. Bot quyết định ở ranh giới cuối bước, quân mới bắt đầu tiến/đánh ở bước tiếp theo giống input Player giữa các frame; tránh Bot được tiến miễn phí ngay bước sinh ra. Heuristic/điểm/nhịp 0.75s không thay đổi.
- **Di chuyển:** tính vị trí tiếp theo từ cùng trạng thái cho mỗi nhóm trước khi áp dụng; cận chiến rồi Giáo cho cả hai phe. Không để quân đầu mảng làm thay đổi vị trí mà quân đối phương sau mảng quan sát trong cùng lượt di chuyển.
- **Combat:** đã tái hiện lỗi cũ hai quân giống nhau cùng đủ đòn chí mạng nhưng ID thấp hạ trước và né đòn trả. Nay chọn toàn bộ đòn hợp lệ trước rồi mới áp sát thương; hai quân có thể cùng chết. Kiểm tra đổi ID, đảo mảng và phản chiếu cả đội hình/target cho kết quả phản chiếu tương ứng. ID thấp chỉ còn phân xử các mục tiêu cùng khoảng cách, không hủy đòn đối phương cùng bước.
- **Game over:** xét sau toàn bộ sát thương của bước. Theo quyết định Owner, không có Hòa. Hai nhà cùng về 0 là vi phạm bất biến, được báo lỗi thay vì ưu tiên phe xử lý trước; xem chứng minh và test hồi quy bên dưới. Không thêm bộ đếm thời gian ép kết quả.

### Vì sao không có Hòa từ trận hợp lệ

Owner đã chốt **không có kết quả Hòa trong luật thông thường**, quân hai phe không được đi xuyên nhau. Test Hòa trước đây đặt sẵn Player ở x=822 sát nhà Bot và Bot ở x=138 sát nhà Player: đã đảo thứ tự chiến tuyến ngay từ đầu. Đó là trạng thái dựng nhân tạo không có chuỗi triệu hồi/di chuyển hợp lệ dẫn tới; đề xuất Hòa dựa trên test đó được loại bỏ.

Bất biến xét quân sống là `max(x_Player) <= min(x_Bot)`. Với cấu hình hiện tại:

- Spawn tại 124/836, nằm phía trong khoảng đánh nhà. Tầm ngắn nhất 28 lớn hơn offset spawn 14: quân tiến đánh nhà dừng ở tối đa x=822 (Player) / tối thiểu x=138 (Bot), nên tiếp viện xuất hiện phía đối diện hợp lệ, không sau lưng địch. Validator vẫn chặn cửa đã nằm sau một địch.
- Tiến quân bị giới hạn bởi địch gần nhất; khi vào tầm thì dừng. Bước mô phỏng tối đa 0.05s, tổng dịch chuyển lớn nhất hai quân là 13.8, nhỏ hơn tầm ngắn nhất 28; không vượt qua nhau trong cùng bước. Giáo nhường tuyến bằng lùi về nhà mình, không đi xuyên địch. Đồng đội được chồng/vượt nhau không làm đảo thứ tự hai phe.
- Khi cả hai phe còn quân sống, luôn có địch giữa mỗi quân và căn cứ đối phương. Target chọn quân chắn gần nhất. Tất cả target của bước được chọn trước khi áp sát thương: kể cả quân chắn cuối cùng chết trong bước đó, các đòn khác cũng không đổi sang nhà ngay trong bước.
- Vì vậy không thể xếp đòn đánh cả hai nhà trong cùng một bước hợp lệ. Khi một nhà về 0, game over đóng băng mô phỏng; không có bước sau phá nốt nhà kia.

Giữ kiểm tra bất biến ở đầu bước, sau di chuyển và trước xét kết quả. Quân ngoài lane, hai đội xuyên nhau hoặc cả hai nhà đã bị phá là **lỗi trạng thái**, phát sinh lỗi lập trình thay vì gán Hòa/thắng/thua hay ưu tiên Player/Bot. Guard không phải một kết quả trận mới hoặc cơ chế sửa tọa độ tự động.

Kiểm chứng mới: năm cặp quân đối xứng được trả Vàng và spawn qua `summon`, kiểm soát không bổ sung thêm input, đều giao chiến rồi cùng chết trước khi chạm nhà. Thêm **300 lượt mô phỏng từ start/spawn hợp lệ** (seed 1–60 × các bước 1/20, 1/30, 1/60, 1/100 và 0.2s bị cap): kiểm tra 491,868 trạng thái, 7,710 bước có sát thương nhà; không xuyên phe, không đánh xuyên quân vào nhà và không có hai nhà cùng 0. Cả 300 lượt kết thúc (166 thắng / 134 thua), dài nhất 141.10s trong giới hạn kiểm thử 180s. Đây là các script kiểm tra, không phải win-rate người chơi hay bằng chứng thay thế lập luận bất biến.

### Bot — TEMP_R1C / heuristic, chưa khóa

Quyết định mỗi **0.75 giây mô phỏng**, tối đa một lệnh hợp lệ mỗi lần; không dùng click DOM. Xét quân sống, tiền/CD, thành phần đội hình và khoảng cách Player tới nhà Bot:

1. Khi thiếu tuyến cận chiến hoặc bị ép nhà, ưu tiên Khiên nếu chưa có Khiên sống.
2. Có cận chiến bảo vệ đang tiếp xúc mục tiêu trong tầm hỗ trợ: cân nhắc Giáo. Rìu được ưu tiên trước mục tiêu còn nhiều HP ở gần tuyến giao chiến.
3. Trường Kiếm bổ sung thông thường; Giác Đấu dùng phản ứng nhanh/rẻ khi bị ép nhà. Điểm giảm theo số quân cùng loại còn sống và loại vừa chọn, tránh lặp máy móc.
4. Khi không nguy cấp, có thể dành Vàng cho ưu tiên mạnh chưa đủ tiền. Khi bị ép nhà, chọn quân hợp lệ vừa túi tiền thay vì đợi món đắt. Không còn hành động phù hợp thì chờ.
5. Không có đối thủ sống và cận chiến đã sang nửa bản đồ đối phương: chờ quan sát thay vì tiếp tục tiêu tiền không cần thiết.

Tham số tạm: áp lực nhà trong 180 tọa độ; mục tiêu bền còn ít nhất 88 HP và gần cận chiến trong 90; hỗ trợ xét tầm 58. Ưu tiên nền Khiên 10 / Giáo hoặc Rìu phù hợp 9 / Giác Đấu khẩn cấp 8 / Trường Kiếm 5; trừ 2 cho mỗi quân cùng loại sống và 2 nếu vừa chọn cùng slot. Chỉ dành tiền nếu ưu tiên còn ít nhất 8 và không bị ép nhà. Đồng điểm chọn slot thấp hơn. Các số này **do triển khai đề xuất để thử**, không phải cân bằng Owner đã khóa.

Không nhìn trước click, không planner, không ngưỡng thắng bí mật. Chính sách chỉ quan sát trạng thái hiện tại và có thể bị khai thác; không tuyên bố AI thông minh hoặc bất bại.

### Đội hình và giao chiến

- Cận chiến đi xuyên/đứng chồng đồng đội, không đẩy nhau. Rìu và Khiên cùng contact line đều đánh được. Địch sống phía trước vẫn chặn tiến quân; không đi xuyên địch để đánh nhà.
- Giáo có tầm 58, cận chiến 28. Sau khi cận chiến tiến, Giáo giữ ít nhất **24 tọa độ hỗ trợ tạm** phía sau đầu tuyến; nếu đã đủ tầm có thể dừng xa hơn (ví dụ 30).
- Nhiều Giáo được trùng vị trí. Không có cận chiến thì Giáo tự tiến và đánh. Khi cận chiến mới xuất hiện phía sau, Giáo nhường/lùi với tốc độ hiện có rồi tái lập vị trí sau; có giai đoạn chuyển tiếp đứng trước cận chiến, **không teleport**. Không lùi quá cửa spawn về phía nhà.
- Chọn địch sống gần nhất phía trước, giữa quân và nhà địch; cùng khoảng cách chọn ID thấp hơn. Đồng đội không chắn đòn; không đánh sau lưng, friendly fire, AoE, xuyên địch hoặc taunt.
- Đòn đánh giữ thời gian lẻ qua frame, không tích lũy đòn khi hành quân; đòn hợp lệ trong cùng bước nhận đủ sát thương trước xét kết quả, không hủy đòn trả do ID thấp. Offset dọc của hình chỉ phục vụ đọc hình, không đổi tọa độ chiến đấu.

### UI và thời gian

Năm nút Player tương tác, năm nút Bot luôn disabled và không có handler triệu hồi. Hai số Vàng và mười CD lấy từ trạng thái thật; hiển thị ready/thiếu Vàng/hồi chiêu. Bot vừa chọn được highlight một giây và có tên quân + lý do ngắn; không hiển thị ý định tương lai.

Ẩn tab dừng trận local; bước trở lại giới hạn 0.05s, không bù thời gian vắng mặt. Hiển thị slot Bot là minh bạch, **không phải chống gian lận**. PvP tương lai cần xác thực trạng thái/thời gian/lệnh bằng nguồn có thẩm quyền hoặc cơ chế đồng bộ an toàn tương đương; R1C không triển khai networking.

## Quan sát mô phỏng R1C

Chiến lược gọi lệnh hợp lệ theo vòng lặp mỗi 100ms, bước mô phỏng 0.02s; không giả định win-rate người chơi:

| Kịch bản | Kết quả / giây | Player triệu hồi / chi Vàng | HP nhà Player |
| --- | --- | --- | --- |
| Không triệu hồi | Thua 12.56 | 0 / 0 | 0 |
| Một Trường Kiếm | Thua 13.32 | 1 / 25 | 0 |
| Tiếp viện Trường Kiếm | Thua 31.38 | 10 / 250 | 0 |
| Khiên → Giáo → Rìu → Trường Kiếm → Giác Đấu | Thắng 23.64 | 6 / 190 | 240 |
| Rìu → Giáo → Trường Kiếm → Giác Đấu → Khiên | Thắng 40.20 | 10 / 300 | 240 |
| Khiên → Rìu → Giác Đấu → Trường Kiếm → Giáo | Thắng 71.40 | 15 / 450 | 240 |
| Khiên → Trường Kiếm → Giáo → Giác Đấu → Rìu | Thua 60.16 | 13 / 395 | 0 |
| Chỉ Giáo | Thua 19.08 | 6 / 180 | 0 |

Trong vòng Rìu/Giáo, Bot trả 285 Vàng cho 12 quân, bốn loại xuất hiện; lệnh cuối ở 37.50s chứng minh không còn mốc dừng 18s. Các fixture riêng xác nhận cả năm lựa chọn phù hợp ngữ cảnh, không yêu cầu mỗi trận phải dùng đủ năm loại. Kiểm thử mô hình gồm ledger Vàng/CD Bot qua từng bước, hành động sau mốc 18s, lựa chọn Khiên/Rìu/Giáo/Giác Đấu/Trường Kiếm trong các tình huống riêng và các trường hợp chờ. Kiểm thử nhịp thao tác 100ms ở 20/30/60 FPS dùng vòng Rìu → Giáo → Trường Kiếm → Giác Đấu → Khiên, cho phép thắng mà không đổi chỉ số.

Các thời gian 9.42–31.58s và ví dụ đổi nhịp 20ms của bản trước 240 HP đã hết hiệu lực, không dùng làm kết quả hiện tại. Kiểm tra bổ sung cả 120 hoán vị của năm slot, gửi lệnh mỗi 100ms, bước 0.02s và chặn chạy thử ở 300s: cả 120 đều kết thúc (38 thắng / 82 thua), dài nhất 71.40s; không có mẫu còn running. Đây là tập script cố định, không phải win-rate người chơi. Không thêm timeout vào gameplay; không chứng minh mọi chuỗi thao tác có thể đều kết thúc trong cùng giới hạn.

## Kiểm chứng và giới hạn

Bộ local R1C **30/30 PASS** (49.7s): 27 mô hình/mô phỏng + 3 browser trên production preview tại `/laneforge-game/`. Browser kiểm tra 10 slot, chặn điều khiển Bot bằng pointer/touch/keyboard/dispatch, hai số Vàng, CD/lựa chọn Bot, trận đầy đủ, reset 240/240, idle defeat và viewport 390×844; không có lỗi console/network. Build/typecheck PASS; security gate PASS_HEURISTIC, 0 staged/0 tracked prompts, không phát hiện; npm audit 0 lỗ hổng. So sánh source xác nhận cấu hình 240 HP, kinh tế/giá/CD, thân hàm di chuyển/target/spawn và heuristic Bot không đổi so với bản 240 HP trước khi bỏ Hòa. Ảnh desktop/mobile chỉ là output local bị ignore; không coi giả lập là QA thiết bị thật hoặc Pages đã cập nhật. READY_FOR_APPROVAL vẫn cần Owner duyệt manifest trước xuất bản; không còn đề xuất Hòa cần duyệt.

Cân bằng còn tạm: chiến lược đơn loại trong các mẫu thử thua nhanh, đội hỗn hợp có thể thắng giữ nguyên HP nhà. Kết quả nhạy với thứ tự/nhịp thao tác và diễn biến giao chiến, không cam kết cùng thời gian ở mọi FPS. Hình/nhãn cùng loại khi chồng nhiều quân có thể che nhau; chưa physics pixel, giới hạn quân hoặc QA hiệu năng trận rất dài. Giữ cảnh báo bundle Phaser >500kB.

Không thêm dependency, workflow, service hoặc file public mới. Chỉ làm local, **NO STAGE / NO COMMIT / NO PUSH / NO DEPLOY** trước duyệt R1C. Site public vẫn là R1B.

## OPEN / PROPOSED

Cân bằng quân/kinh tế/HP nhà, mức khó và ưu tiên Bot, offset Giáo, map/spawn/giới hạn quân, thời lượng trận, Spell Card/Kim Cương và kiến trúc PvP đều còn mở ngoài phạm vi đã chốt. Theo dõi [DECISIONS](DECISIONS.md), [UNITS](UNITS.md) và [ROADMAP](ROADMAP.md).
