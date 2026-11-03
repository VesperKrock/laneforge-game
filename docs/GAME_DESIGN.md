# LaneForge — Game design baseline

Nguồn: yêu cầu Owner R0A–R1E. Đây là prototype, chưa phải specification/cân bằng game hoàn chỉnh. Kết quả Combat Timing Audit R1E nằm ở cuối tài liệu; gameplay vẫn là bản R1D đã phát hành.

## CONFIRMED BY OWNER

- Chiến thuật 2D trên một chiến tuyến ngang; quân tự tiến/tự đánh, phá nhà về 0 để thắng/thua.
- Năm slot, mỗi loại tối đa một slot; nhiều bản sao cùng loại được triệu hồi nếu đủ Vàng/CD.
- R1D cho chọn năm loại khác nhau từ sáu quân trước trận; mặc định năm quân R1C. Bot mang cùng năm loại nhưng tự quyết định triệu hồi.
- Cận chiến cùng phe được chồng/vượt nhau và cùng đánh; Giáo chủ động kite kể cả đứng riêng, vẫn ưu tiên hỗ trợ sau cận chiến, được chồng Giáo. Chưa áp giới hạn stack ba quân.
- Quân khác phe chặn nhau, không đi xuyên để phá nhà. Không có Hòa trong luật thông thường; vi phạm bất biến phải báo lỗi, không ưu tiên Player/Bot.
- Giữ hai nhà 240 HP, cùng kinh tế/giá/CD. Không tăng HP hoặc sửa giá/CD năm quân cũ trong R1D.
- Phong cách B: đủ thời gian phản ứng/tiếp viện. Khoảng 4–7s duel, 8–12s Khiên và 60–120s trận là định hướng, không phải điều kiện ép kết quả.
- PvE local trước; chưa Spell Card, Kim Cương, level, skin, tài khoản, lưu dữ liệu, backend hoặc PvP online.
- **ĐƠN GIẢN NHƯNG HIỆU QUẢ:** kế thừa Phaser/TypeScript/Vite, không framework combat/AI mới.

## Baseline và quyền phát hành

R0B `19aa892`, R1A `1086c8a`, R1B `add1f73` là lịch sử. R1C đã commit/push/deploy riêng tại **`da7d13c46f550b5a66576253f47323260ac8deef`**, đã xác minh Actions/Pages. Fresh-check trước R1D: HEAD = origin/main = SHA này, branch main, worktree/index sạch, baseline build + 30 tests + security gate + audit PASS.

R1D revision đã được Owner duyệt và phát hành riêng tại **`b4ec9fc1d05dee40244e38e281c20de04776e7bb`**. Những mục R1D bên dưới lưu hồ sơ lúc trình duyệt local, không phải trạng thái phát hành hiện tại. R1E bắt đầu từ đúng commit này; chỉ audit local, **NO STAGE / NO COMMIT / NO PUSH / NO DEPLOY**.

Revision tiếp tục đúng worktree R1D đã trình, không reset/làm lại. Preflight đối chiếu hash 11 file với snapshot lần trình trước: khớp toàn bộ, index trống, HEAD/origin/main vẫn R1C. Prompt revision nằm ngoài public repository; không stage.

## Luật đối xứng kế thừa R1C

Mỗi phe có 100 Vàng đầu trận, +5/giây, trần 125, năm CD riêng; cùng `TEMP_R1D_UNITS`, cùng `Battle.loadout`, cùng `canSummon(side, slot)` / `summon(side, slot)`. Lệnh sai phe/slot, thiếu Vàng/CD, chưa chạy hoặc cửa nằm sau địch đều bị từ chối mà không đổi trạng thái. Không spawn miễn phí, đợt cố định hoặc hệ số bí mật.

Hai nhà dùng `DEMO.baseHp = 240` khi tạo/reset/UI. Game over xét sau toàn bộ sát thương của bước, đóng băng mô phỏng; Chơi lại reset quân/Vàng/CD/nhịp Bot và giữ đội hình. Về chuẩn bị kết thúc lượt local hiện tại, reset về trạng thái chờ để đổi quân; không lưu dữ liệu.

Kiểm tra có kiểm soát không tiêu tiền: cả hai cùng 100/105/110/115/120/125 tại 0/1/2/3/4/5s, rồi giữ trần, bằng nhau ở từng bước 0.01s. Trong bốn giây đầu nếu Player không tiêu, Player có 120; Bot chi 110 nên còn 10, cả hai cùng thu 20. Ledger từng bước là `min(125, số dư + thu nhập) - chi trong bước`; không coi số dư thấp do chi tiêu là lỗi hồi Vàng.

Di chuyển tính từ cùng snapshot cho từng nhóm, cả hai phe dùng chung thứ tự. Revision cho **Giáo di chuyển trước, cận chiến sau**: quân đuổi phải tới tọa độ mới, tránh dừng ở vị trí cũ rồi Giáo lùi khiến đòn luôn thiếu tầm. Hỗ trợ sau đồng minh có thể trễ một bước khi tuyến trước vừa tiến; không buff tốc/tầm. Mọi đòn chính/phụ hợp lệ được chọn từ trạng thái sống trước sát thương rồi áp dụng cùng bước; chết cùng bước không hủy đòn đã chọn. Đổi ID/đảo mảng/phản chiếu hai phe được kiểm tra. Bot sinh quân ở cuối bước, quân mới hành động bước kế tiếp như input Player giữa hai frame.

### Vì sao không có Hòa hợp lệ

Test Hòa cũ đặt Player x=822 và Bot x=138: hai đội đã vượt nhau, không phải trạng thái sinh ra từ luật hợp lệ. Bất biến quân sống: `max(x_Player) <= min(x_Bot)`.

- Spawn 124/836 nằm trong tầm đánh nhà: tầm ngắn nhất 28 lớn hơn offset cửa 14. Tiếp viện không xuất hiện sau lưng quân đang đánh nhà; validator chặn cửa nếu đã nằm sau địch.
- Tiến quân bị giới hạn bởi địch gần nhất. Mỗi bước cap 0.05s, tổng dịch chuyển lớn nhất hai quân 13.8 < tầm ngắn nhất 28. Giáo lùi về phía nhà mình; overlap đồng đội không làm đảo thứ tự hai phe.
- Khi hai phe còn quân sống, địch chắn trước căn cứ; target không bỏ qua quân sống. Quân chắn chết trong bước cũng không đổi các đòn đã chọn sang nhà.
- Do đó không thể xếp đòn lên cả hai nhà trong một bước hợp lệ; khi một nhà về 0 thì dừng trận.

Guard ở đầu bước/sau di chuyển/trước xét kết quả báo lỗi quân ngoài lane, hai phe xuyên nhau hoặc hai nhà cùng 0. Không tự sửa tọa độ hoặc phân xử phe thắng. AOE Búa chỉ trúng quân phụ sống, không splash nhà nên giữ lập luận trên.

## TEMP_R1D — thay đổi combat

### Rìu

Giữ 88 HP / 26 DMG / giá 35 / CD 3.2s / tốc 72 / tầm 28 / chu kỳ 1.2s. Khi lần đầu xác nhận mục tiêu trong tầm, bắt đầu chờ **0.6s**, chưa gây sát thương. Ví dụ bước 0.01s: contact ở 0.01, đánh ở 0.61 / 1.81 / 3.01. Có sai số tối đa một bước do lấy mẫu; không đánh trước 0.6s.

Handoff trong tầm đã đúng trước revision: mục tiêu chết giữa hai bước thì chọn địch sống gần nhất mới, giữ nguyên timer; sẵn sàng được đánh ngay, chưa sẵn sàng chỉ chờ phần còn lại. Test đổi ở 0.31/0.60/0.91s xác nhận đòn tới đúng 0.61/0.61/1.81s, không bắt đầu lại cả windup/CD. Không retarget hồi tố nếu mục tiêu chết trong cùng bước đã chọn đòn.

Regression mới tìm thấy lỗi khác: đánh ở 0.61s, rời tầm 0.62, vào lại 0.63, code cũ xóa CD nên đánh lại 1.23 (cách 0.62s). Nay giữ CD đòn cũ chưa hết; đồng thời vào lại phải chờ windup mới 0.6s, nên đòn kế không sớm hơn 1.81. Đi/chờ không tích readiness vô hạn. Rìu/Búa đặt đủ chu kỳ sau đòn thật để frame lẻ không rút ngắn khoảng đòn; thử dt không đều 0.013/0.027/0.041s và đổi mục tiêu nhanh vẫn cách ít nhất 1.2s cho Rìu. Ba quân khác giữ cadence R1C.

### Giáo

Owner sửa rõ: Giáo phải **chủ động kite, không cần đợi đồng minh**. Tiến 85/s, lùi **48/s**, vẫn đánh đúng nhịp 0.9s và tầm 58. Ngưỡng thử **52**, nằm trong tầm 58: có địch sống ở đó và chưa có cận chiến đồng minh đứng trước bảo vệ thì lùi về cửa nhà. Khoảng đệm 6 tránh lùi/tiến giật ở mép tầm; ngay cả hai Giáo cùng lùi trong bước cap 0.05s, độ tách thêm 4.8 < 6 nên vẫn trong tầm và có thể ổn định giao chiến. Không thêm trạng thái AI hoặc hysteresis.

Khi cận chiến đồng minh sống ở trước trong phạm vi **96**, ưu tiên hỗ trợ sau **30**, không bỏ tuyến bảo vệ chỉ vì địch chạm Khiên. Vẫn nhường liên tục khi đồng minh tới sau, không teleport; clamp tại cửa 124/836. Chọn 30 vì tầm Giáo 58 và cận chiến 28, giữ được đòn hỗ trợ. Ngưỡng 30/96/52 là TEMP_R1D do triển khai chọn. Test có Khiên bảo vệ, hai Giáo chồng, hai Giáo đối đầu ổn định, cận chiến mới tới và truy đuổi phản chiếu hai phe.

Từ khoảng cách ban đầu 140 ở giữa lane, cả bốn cận chiến đã đánh trúng Giáo kite **trước khi Giáo tới cửa**. Với Giáo Player, tọa độ đòn đầu của quân đuổi: Giác Đấu 428.49, Kiếm 426.69, Rìu 378.72, Khiên 271.99, đều >124; phía Bot phản chiếu quanh 960. Giáo vừa lùi vừa gây sát thương, không bất tử. Giác Đấu bắt kịp nhưng mẫu này Giáo thắng còn 1 HP; contact ban đầu 28 thì Giác Đấu thắng. Không hardcode phe/quân thắng.

### Búa Chiến

Theo revision Owner: **72 HP / 26 DMG chính / 10 lên mọi địch phụ trong vùng / windup 0.9s / chu kỳ 1.8s / tốc 60 / tầm 28 / giá 45 / CD 4s**. Không còn cap hai quân phụ. Phải có mục tiêu chính sống trong tầm mới có đòn/splash; vùng đo tâm–tâm **40** quanh chính mục tiêu đó. Mỗi địch phụ sống chỉ nhận một lần, thứ tự khoảng cách rồi ID; không trùng chính/phụ, không friendly fire/quân chết/nhà. Prototype không có trạng thái bất tử. Đánh đơn chỉ 26. Không giáp, xuyên giáp, stun, knockback, chí mạng hay buff theo phe. Không tune thêm ngoài số revision.

DPS đơn lý thuyết Búa 26/1.8 ≈ **14.44**, Rìu 26/1.2 ≈ **21.67**; ba địch trong vùng nhận 26+10+10 = **46** chia sát thương mỗi đòn. Búa đắt hơn 10 Vàng, ít hơn 16 HP và windup chậm hơn; không suy ra cân bằng chỉ từ DPS. Test cụm 1/2/3/4/7 quân xác nhận không cap, mép 40 trúng nhưng 40.001 không trúng; cả hai Búa có đòn chí mạng cùng bước vẫn nhận đủ AOE từ snapshot.

Hình thân rộng, đầu búa vuông, nhãn BC và vòng chớp nhỏ tạm; vòng chớp là hiệu ứng, không biểu diễn chính xác vùng sát thương. Không asset/dependency mới.

## Kho quân và Bot

Sáu nút chọn inline dùng button/aria-pressed; bỏ một loại rồi thêm loại khác. Chưa đủ năm thì Bắt đầu disabled và model từ chối deck sai/loại lạ/trùng. Thứ tự slot theo catalog: TK → RI → KH → GD → GI → BC, bỏ loại không chọn. Trong lúc chạy không đổi deck được; Chơi lại giữ năm loại; Về chuẩn bị cho sửa lại.

Luôn năm nút Player tương tác và năm nút Bot chỉ xem, hai pool Vàng/mười CD thật. Bot vừa mua được highlight một giây, có tên/lý do. Slot Bot không handler triệu hồi, pointer/touch/keyboard/dispatch không điều khiển được.

Bot giữ nhịp **0.75s** và heuristic R1C: Khiên giữ tuyến, Giáo hỗ trợ tuyến tiếp xúc, Rìu đánh mục tiêu bền, Giác Đấu cứu nhà, Trường Kiếm bổ sung; giảm điểm theo loại đang sống/vừa mua, dành tiền khi an toàn, không tiếp viện vô ích khi đang raid không gặp địch. R1D thêm Búa điểm nền 10 chỉ nếu có hai địch cách nhau không quá 40 và cận chiến mình cách nhóm không quá 90. Không mang Búa thì không thể chọn Búa; có Búa nhưng không có cụm phù hợp thì điểm 0. Vẫn qua chung giá/CD/validator, không dự đoán thao tác hoặc thêm deck AI.

Ẩn tab dừng local; trở lại không mô phỏng bù. Minh bạch slot không thay thế xác thực PvP; không triển khai đồng bộ mạng.

## Đối đầu trước/sau revision — mẫu có kiểm soát

So sánh trực tiếp model R1D local đã trình với bản revision hiện tại, không lấy R1C thay cho “trước”. Hai đội bắt đầu cách 28 tại giữa lane, Giáo sau Khiên 30; riêng các hàng truy đuổi bắt đầu cách 140. Không tiếp viện, cô lập AI bằng CD fixture, bước 0.01s; giữ đúng HP/sát thương/tốc độ thực. Mỗi mẫu phản chiếu phe/đảo mảng có kết quả tương ứng. Thời gian từ fixture, không gồm hành quân từ căn cứ.

| Tình huống | R1D trước revision | R1D revision |
| --- | --- | --- |
| Rìu vs Giác Đấu | Rìu thắng 1.81s, còn 46 HP | Không đổi |
| Rìu vs Trường Kiếm | Rìu thắng 3.01s, còn 28 HP | Không đổi |
| Giáo vs Giác Đấu, contact 28 | Giác Đấu thắng 2.45s, còn 8 HP | Không đổi, Giác Đấu đánh tới Giáo đang lùi |
| Giáo vs Giác Đấu, xuất phát 140 | Giác Đấu thắng 3.03s, còn 8 HP | Giáo thắng 3.06s, còn 1 HP; Giác Đấu đã gây 49 sát thương |
| Giáo vs Rìu, xuất phát 140 | Rìu thắng 2.75s, còn 58 HP | Rìu thắng 3.39s, còn 48 HP |
| Giáo vs Khiên, xuất phát 140 | Khiên thắng 9.69s, còn 40 HP | Khiên thắng 13.17s, còn 10 HP |
| Khiên + Giáo vs Rìu | Thắng 4.75s, Khiên 46 / Giáo 50 HP | Không đổi |
| Búa vs Rìu | Búa thua 3.01s, Rìu còn 52 HP | Búa thua 3.01s, Rìu còn 36 HP |
| Búa vs hai Giác Đấu chồng | Thua 1.75s; địch 20/30 HP | Thua 1.75s; địch 12/28 HP |
| Búa vs ba Giác Đấu chồng | Thua 1.05s; địch 20/30/30 HP | Thua 1.05s; địch 12/28/28 HP |
| Búa vs Khiên + Giáo sau 30 | Thua 3.80s; địch Khiên 114 / Giáo 34 HP | Thua 3.80s; địch Khiên 98 / Giáo 30 HP |
| Khiên + Búa vs ba Giác Đấu | Thua 4.55s, hai địch còn 14/4 HP | Thua 4.55s, một địch còn 8 HP |
| Khiên + Búa vs bốn Giác Đấu | Thua 2.80s, ba địch còn 22/22/38 HP | Thua 2.80s, ba địch còn 18/18/18 HP |
| Khiên + Kiếm + Búa vs ba Giác Đấu | Thắng 2.71s; Khiên 31 / Kiếm 60 / Búa 72 HP | Không đổi |
| Thay Búa bằng Rìu trong hàng trên | Thắng 3.01s; Khiên 31 / Kiếm 60 / Rìu 88 HP | Không đổi; Búa dọn cụm nhanh hơn 0.30s ở mẫu này |
| Khiên + Giáo + Búa vs ba Giác Đấu | Thắng 3.60s, mất Khiên; Giáo 50 / Búa 72 HP | Thắng 2.85s, giữ Khiên 10 / Giáo 50 / Búa 72 HP |

Búa có ích cho cụm đông khi có tuyến bảo vệ và sát thương bổ sung; đánh trúng mọi mục tiêu trong vùng thay vì bỏ qua quân thứ tư trở đi. Rìu vẫn hơn khi đấu đơn, rẻ hơn và mạnh hơn về DPS đơn. Búa + Khiên vẫn chưa đủ thắng ba/bốn Giác Đấu trong các mẫu này; không tự tăng số lần nữa. Búa không thành lựa chọn thắng mọi đối đầu. Những kết quả này chưa chứng minh balance cuối hoặc bao phủ mọi đội hình.

Nhiều duel vẫn ngắn hơn định hướng 4–7s; không nâng HP quân cũ hoặc ép timeout để sửa cảm nhận. Giáo thắng sát nút Giác Đấu ở khoảng 140 là điểm Owner cần đánh giá, không phải lỗi “không bắt được”: có tiếp cận và gây sát thương thật trước biên.

## Solo vs Bot — mẫu trước/sau revision

Input hợp lệ theo vòng mỗi 100ms, dt 0.02s; tiếp viện tới hết trận, không gọi spawn trực tiếp/đổi ngân sách. Deck mặc định; hai hàng Búa dùng TK/RI/KH/GI/BC.

| Thứ tự lặp | Trước revision | Revision | Player quân / chi | Bot quân / chi |
| --- | --- | --- | --- | --- |
| Không triệu hồi | Thua 12.56s | Thua 12.56s | 0 / 0 | 4 / 110 |
| Chỉ Trường Kiếm | Thua 31.32s | Thua 31.32s | 10 / 250 | 10 / 250 |
| KH → GI → RI → TK → GD | Thắng 23.00s | Thắng 22.50s | 6 / 190 | 8 / 200 |
| RI → GI → TK → GD → KH | Thua 22.74s | Thua 21.52s | 6 / 185 | 7 / 185 |
| KH → RI → GI → TK → GD | Thắng 73.70s | Thắng 50.16s | 11 / 340 | 14 / 340 |
| GI → GD → KH → TK → RI | Thua 99.00s | Thắng 53.28s | 12 / 350 | 14 / 350 |
| Chỉ Búa | Thua 23.10s | Thua 22.24s | 4 / 180 | 6 / 180 |
| KH → BC → GI → TK → RI | Thắng 37.50s | Thắng 47.64s | 9 / 315 | 10 / 315 |

Mẫu Búa Bot dùng đủ năm loại, trả 315 Vàng, lệnh cuối 43.50s; vẫn mua sau 18s, không scripted cap. Player thắng các mẫu này giữ nhà 240; khi thua nhà về 0, nhà Bot vẫn 240. Các số chi là lần lượt Player/Bot thực trả, không buff để bù tăng giá Búa.

Browser end-to-end dùng thứ tự KH → GI → BC → TK → RI trên deck có Búa để kiểm tra tới thắng và restart, không ép kết quả gameplay. Vòng KH → BC → GI → TK → RI vẫn giữ trong so sánh model; thử dt 0.014/0.024s có thể thua 105.24/142.03s thay vì thắng 47.64s ở dt 0.02. Kết quả nhạy nhịp thao tác/FPS, không tuyên bố lockstep. Thời gian test browser có guard riêng, không thêm timer vào game.

600 lượt từ input/spawn hợp lệ: sáu deck × seed 1–20 × năm dt (1/20, 1/30, 1/60, 1/100, 0.2 bị cap 0.05). Kiểm tra **1,117,530 trạng thái**, 14,974 bước có sát thương nhà, không xuyên phe/đánh xuyên quân/hai nhà cùng 0. Tất cả kết thúc: **338 thắng/262 thua**, dài nhất **293.43s**, trong guard test 360s. Trước revision cùng tập là 1,040,874 trạng thái, 313 thắng/287 thua, dài nhất 280.20s. Đây là script kiểm tra, không phải win-rate người chơi hoặc chứng minh mọi chuỗi input đều hữu hạn.



## Kiểm chứng, giới hạn và manifest

**R1D REVISION STATUS: READY_FOR_APPROVAL**, chỉ local. Build/typecheck PASS; full suite **47/47 PASS** (~1.1 phút): 43 mô hình/mô phỏng + 4 browser Chrome trên production subpath "/laneforge-game/". Browser chạy deck có Búa tới thắng và reset giữ đội hình/240 HP, idle defeat, khóa sửa khi chạy, Bot không điều khiển được, giá Búa 45 cả hai bên, keyboard/touch và viewport 390×844; không lỗi console/network. Test gồm kite solo/đuổi bắt thật/cửa lane/hai Giáo không đảo hướng vô hạn, AOE cụm 2/3/4/7 và snapshot chí mạng, Rìu handoff/ready/mất contact/đổi nhanh/frame lẻ. Không tune thêm Búa sau số Owner yêu cầu.

Thất bại hồi quy đã xử lý: ca Rìu rời/vào tầm nhanh từng tạo khoảng đòn 0.62s (đã tái hiện trước sửa); fixture đứng yên đánh nhà cần tiếp tục tiến sau khi Giáo kite; kỳ vọng mọi DMG khác nhau không còn đúng vì Búa bằng 26 của Rìu; một mẫu chiến thuật từng thua nay thắng. Các kỳ vọng được cập nhật theo hành vi Owner sửa, không che lỗi bằng buff phe hoặc ép thắng.

Security gate **PASS_HEURISTIC**: 22 tracked/candidate, 0 staged, 0 tracked prompts, 17 ignore checks, findings rỗng; build chỉ HTML/JS/CSS, không source map hoặc file local. `npm audit --audit-level=low`: **0 vulnerabilities**. So sánh module từ HEAD xác nhận toàn bộ `DEMO`, năm profile cũ và default loadout giữ nguyên; chỉ thêm loại Búa. Không sửa package/lockfile/workflow/security policy. Git root E:\\laneforge-game, main, HEAD và remote main vẫn ở baseline R1C; 11 file modified, 0 thêm/xóa, index 0.

Hạn chế: chồng nhiều quân cùng loại vẫn che hình/nhãn; UI mobile dùng cuộn dọc, chưa QA thiết bị thật. Bundle Phaser vẫn cảnh báo >500kB. Scanner là heuristic, không chứng minh không tồn tại mọi secret/PII. Không thêm dependency, workflow, service hoặc file public mới; ảnh/script/mô phỏng phụ ở output local bị ignore.

Manifest R1D dự kiến **11 file sửa, 0 thêm, 0 xóa**:
```text
README.md
docs/DECISIONS.md
docs/GAME_DESIGN.md
docs/ROADMAP.md
docs/UNITS.md
index.html
src/game/Battle.ts
src/game/BattleScene.ts
src/main.ts
src/style.css
tests/smoke.spec.ts
```

## OPEN / PROPOSED

Owner đánh giá ngưỡng kite 52, offset Giáo 30/phạm vi 96, kết quả Giáo–Giác Đấu tùy khoảng xuất phát, Búa AOE không cap và nhịp B/FPS/khả năng đọc stack. Chưa chốt stack ba quân, tăng HP quân cũ, cân bằng cuối, thêm vũ khí hoặc triển khai R2. Các bước ngoài manifest cần duyệt riêng. **NO COMMIT / NO PUSH / NO DEPLOY** tới khi Owner duyệt chính xác manifest R1D trong hội thoại.

## R1E — Combat Timing Audit (local, 19/10/2026)

**READY_FOR_APPROVAL — audit và regression tests, không đổi gameplay.** Baseline HEAD = origin/main = `b4ec9fc1d05dee40244e38e281c20de04776e7bb`; Git root/branch đúng, index trống. R1D đã phát hành; yêu cầu R1E không cấp quyền stage/commit/push/deploy.

### Kết luận và phạm vi bằng chứng

Chưa tái hiện lỗi Player đánh nhanh hơn Bot, lỗi cấp đòn khi đổi mục tiêu hoặc lợi thế bí mật cho quân đã giao chiến. Hai Giác Đấu cùng HP/điều kiện luôn có cùng lịch sát thương trong các mẫu đối xứng. Đổi phe, ID và thứ tự mảng không thay kết quả. **Không nerf/buff, không sửa code combat.** Không thể quy nguyên nhân chính xác cho lần Owner quan sát khi chưa có chuỗi thao tác/trạng thái của lần đó.

Có hai yếu tố đã đo được: đòn đầu tức thì và nhiều quân cùng phe chồng nhau. Ngoài ra, `attackInterval = 0.35` hiện dùng cách mang phần dư timer từ R1C, **không bảo đảm mọi khoảng cách giữa hai hit thực tế đều >= 0.35s**. Đây là mô tả code hiện hành, không phải quyết định cân bằng mới của Owner. Sai số frame có thể rút ngắn hoặc kéo dài một khoảng; audit không tự đổi sang luật khoảng cách tối thiểu.

Giữ nguyên Giác Đấu 38 HP / 7 DMG / interval 0.35s / tốc 138 / tầm 28 / giá 20 / CD slot 1.5s. Giữ Rìu, Giáo, Búa, Khiên, Trường Kiếm, năm slot chọn từ sáu quân, kinh tế đối xứng, nhà 240 HP, stack và bất biến không xuyên phe/không Hòa.

### Timer, spawn và rời/vào tầm

- `summon` cùng một hàm cho hai phe: trừ 20 Vàng, đặt CD slot 1.5s, sinh quân đầy 38 HP, `attackIn = 0`, `engaged = false`, `flash = 0`. CD slot chỉ giới hạn mua quân mới, không quyết định nhịp đánh của quân đã sinh.
- Mỗi bước cap `dt <= 0.05`: giảm timer, di chuyển từ snapshot chung, chọn tất cả đòn trước rồi áp sát thương. Giác Đấu không có windup như Rìu/Búa: nếu trong tầm và timer sẵn sàng, đánh ngay ở bước đó. Đòn chí mạng cùng bước không hủy đòn trả đã chọn.
- Sau hit, Giác Đấu cộng 0.35 vào timer đã trừ dt, giữ phần dư. Ví dụ dt 0.01: hit đầu tại 0.01, timer còn 0.34; hit thứ hai tại 0.35. Với dt 0.05: hit đầu 0.05, kế 0.35, cách **0.30s**. Frame lẻ có khoảng 0.324s và 0.365s; không phải hard minimum 0.35. Không đánh nhiều lần trong một bước, không tích vô hạn đòn khi đi đường.
- Đổi mục tiêu trong tầm giữ timer. Bỏ mục tiêu cũ ở 0.10/0.34s: mục tiêu mới chỉ nhận hit tại 0.35 và 0.70. Đổi sau hit 0.35: chờ tới 0.70, không được thêm hit tức thì.
- Ra ngoài tầm: `engaged = false`, giữ CD chưa hết nhưng clamp readiness tại 0. Rời một bước rồi vào lại vẫn phải chờ hit 0.35. Rời hai giây: vào lại tại 2.02 được một hit ngay, kế 2.36; không dồn nhiều hit đã bỏ lỡ.
- Bot quyết định cuối bước; quân mới không hành động trong bước sinh. Mẫu Bot mua Giác Đấu thật tại 0.75s: hit đầu 0.76s; Player nhập lệnh sau cùng bước ở trạng thái phản chiếu có cùng HP, Vàng, CD, vị trí và lịch đánh. Không có lượt đánh thêm lúc spawn cho Player.

### Đối xứng và FPS/dt

Sáu lịch dt: 100/60/30/20 FPS, lặp 0.013/0.027/0.041s, và input dt 0.2 bị cap thành 0.05. Mỗi lịch thử khoảng cách 28 và 140; mỗi khoảng thử đủ 2 phe phản chiếu × 2 cách gán ID × 2 thứ tự mảng = **96 duel**. HP thật, tốc thật, không đồng minh hoặc can thiệp damage; chỉ khóa CD Bot để cô lập tiếp viện.

Các hit khi bắt đầu đã trong tầm 28 (thời gian mô phỏng tính từ fixture):

| Lịch dt | Thời điểm sáu hit của mỗi phe (s) | Kết quả |
| --- | --- | --- |
| 100 FPS | 0.01 / 0.35 / 0.70 / 1.05 / 1.40 / 1.75 | Cùng chết |
| 60 FPS | 0.016667 / 0.35 / 0.70 / 1.05 / 1.40 / 1.75 | Cùng chết |
| 30 FPS | 0.033333 / 0.366667 / 0.70 / 1.066667 / 1.40 / 1.766667 | Cùng chết |
| 20 FPS | 0.05 / 0.35 / 0.70 / 1.05 / 1.40 / 1.75 | Cùng chết |
| Frame lẻ | 0.013 / 0.364 / 0.729 / 1.053 / 1.417 / 1.782 | Cùng chết |
| dt 0.2 cap 0.05 | 0.05 / 0.35 / 0.70 / 1.05 / 1.40 / 1.75 | Cùng chết |

Mỗi hit của **cả hai phe** có cùng HP trước/sau: **38→31, 31→24, 24→17, 17→10, 10→3, 3→0**. Đây là hai quân cùng chết; trận vẫn `running`, hai nhà vẫn 240, không sinh kết quả Hòa. Khoảng cách 140: hit đầu 0.41–0.45s, kết thúc 2.15–2.187s; các biến thể phản chiếu/ID/mảng vẫn giống nhau trong cùng lịch dt.

Đo cadence riêng bằng dummy đứng yên, không phản công, HP tăng chỉ trong fixture: cả hai phe cùng **10 hit / 70 DMG trong 3.2s** trên sáu lịch. Từ hit thứ hai, thời điểm hit nằm trong một bước sau mốc interval liên tục; không có timer trôi tích lũy hoặc burst nhiều hit trong một bước. Cách mang phần dư này đã tồn tại trước R1E; không dùng test để chốt một luật mới.

Tất cả số trên là **thời gian mô phỏng**. Nếu máy chỉ chạy 5 FPS (dt thật 0.2), cap chỉ tiến 0.05 mỗi frame: mô phỏng chậm hơn thời gian thực, không chạy bù. Không tuyên bố game là lockstep hoặc mọi trận giữ kết quả giống nhau giữa các FPS.

### Quân đã giao chiến và quân mới sinh

Fixture chuyển mục tiêu có kiểm soát tại cửa Bot: cựu binh Player x=808, HP 38, timer sẵn sàng; địch cũ x=836, HP 7, CD đánh còn 0.2s. Hit 0.01 hạ địch cũ, cựu binh vẫn 38 HP nhưng CD còn 0.34. Sau đó Bot mua Giác Đấu mới qua validator thật: x=836, HP 38, timer 0. Phản chiếu hai phe cho kết quả tương ứng.

| Thời gian (s) | Quân đánh / mục tiêu | HP mục tiêu trước→sau |
| --- | --- | --- |
| 0.01 | Cựu binh → địch cũ | 7→0 |
| 0.02 | Mới sinh → cựu binh | 38→31 |
| 0.35 | Cựu binh → mới sinh | 38→31 |
| 0.36 | Mới sinh → cựu binh | 31→24 |
| 0.70 | Cựu binh → mới sinh | 31→24 |
| 0.71 | Mới sinh → cựu binh | 24→17 |
| 1.05 | Cựu binh → mới sinh | 24→17 |
| 1.06 | Mới sinh → cựu binh | 17→10 |
| 1.40 | Cựu binh → mới sinh | 17→10 |
| 1.41 | Mới sinh → cựu binh | 10→3 |
| 1.75 | Cựu binh → mới sinh | 10→3 |
| 1.76 | Mới sinh → cựu binh | 3→0 |

Quân mới thắng còn **3 HP**, vì cựu binh chưa hồi CD; tuổi quân không cấp buff. Fixture bắt đầu từ ranh giới giao chiến đã bị thương, không phải tuyên bố tái hiện toàn bộ lịch sử spawn của quân cũ.

Một mẫu khác chạy từ lệnh mua thật lúc đầu trận: Giác Đấu đến x=822, đánh nhà Bot một hit ở **5.06s** (nhà còn 233/240), Bot mua Giác Đấu mới ngay sau đó. Quân mới hit 5.07 / 5.41 / 5.76 / 6.11 / 6.46 / 6.81; cựu binh hit quân mới 5.40 / 5.75 / 6.10 / 6.45 / 6.80. Cựu binh chết **6.81s**, quân mới còn 3 HP. Thử chờ thêm 0.10 hoặc 0.34s trước mua, đổi phe, vẫn không tạo thắng lợi bí mật cho cựu binh. Trong mẫu này chỉ CD AI bị khóa để không có quân thứ ba; giá, thu nhập, di chuyển, spawn và damage đều thật.

Spawn sát chiến tuyến: **240 duel** = 6 lịch dt × khoảng cách 14/28/28.01/40/140 × 2 phe × 2 ID × 2 thứ tự mảng. Một bên đã có mặt nhưng timer sẵn sàng, bên kia mua mới đầy HP. Cả hai cùng chết sau sáu hit, không có thắng do thứ tự xử lý. Khoảng cách cửa/nhà vẫn theo luật chuẩn, không xuyên phe, không hạ nhà khi còn địch chắn.

### Stack và phong cách B — tách khỏi bug timing

Hai Giác Đấu chồng ở x=480 gặp một Giác Đấu x=508: mỗi quân vẫn chỉ gây 7/hit; tổng hai quân là 14/loạt. Địch mất **38→24 tại 0.01, 24→10 tại 0.35, 10→0 tại 0.70s**. Hai quân cùng phe còn 17/38 HP; đảo phe giữ kết quả. Hình/nhãn đang chồng có thể làm người xem tưởng một quân đánh quá nhanh, nhưng mẫu này không chứng minh đó chính là tình huống Owner đã gặp.

Duel 1v1 Giác Đấu đang ngắn hơn định hướng B **4–7s**: cần `ceil(38/7) = 6` hit, đòn đầu tức thì nên chỉ có năm khoảng 0.35s trước hit hạ quân (xấp xỉ **1.75s**). Đòn đầu góp phần rút ngắn trận, không giải thích toàn bộ khoảng cách với mục tiêu B. Nếu chỉ chờ thêm một interval trước hit đầu, tính lý thuyết cũng mới khoảng **2.10s**, chưa đạt 4–7s; đây là phép tính đề xuất, **chưa triển khai hoặc coi là quyết định Owner**.

PROPOSED cho Owner: xác định 0.35s cần là cadence có sai số frame như hiện tại hay khoảng cách tối thiểu giữa mọi hit; xác định Giác Đấu có chủ đích là ngoại lệ giao tranh nhanh hay phải nằm trong 4–7s. Nếu đổi, duyệt riêng thay đổi windup/cadence hoặc cân bằng; R1E không tự chọn số HP/DMG mới, không giới hạn stack và không đổi luật đòn đầu.

### Kiểm chứng và manifest R1E

Build/typecheck PASS. Full suite **61/61 PASS** (71.47s, không skip/flaky): 47 test cũ + 14 audit mới; tổng **57 model/playtest + 4 browser Chrome** trên production preview `/laneforge-game/`. Browser kiểm tra chiến đấu tới thắng và restart, thua khi không triệu hồi, hai kinh tế/slot Bot chỉ xem, lựa chọn Búa, keyboard/touch và mobile 390×844; không lỗi console/network. Audit không thay UI hoặc build tag R1D.

Security gate **PASS_HEURISTIC**: 22 tracked/candidate, 0 staged, 0 tracked prompts, 17 ignore checks, findings rỗng; build chỉ có HTML/JS/CSS. `npm audit --audit-level=low`: **0 vulnerabilities**. Scanner dùng heuristic tên/nội dung/lịch sử đường dẫn, không phải chứng minh tuyệt đối mọi secret/PII đều không tồn tại. Prompts, môi trường, credentials và output local vẫn được ignore.

SHA-256 build lại khớp artifact R1D đã phát hành ở cả ba file: HTML `61571bbb4d5e9958b4245c5b03a67c7f4555b1b764cbd12ad24fe628adc146ac`, JS `9b60c0fc46201795114b74b15412b030516c7d590a81bf905e3041fc537f17b4`, CSS `c64bd1b9c55b43215ba573e05aad124a9f49f6025d3ba842799610a2648b78dd`. Bundle Phaser vẫn cảnh báo >500kB; không đổi dependency hoặc thêm chia bundle trong audit này.

JSON reporter giữ toàn bộ thời điểm, dt yêu cầu/thực dùng, ID các quân đánh, vị trí/timer, HP trước/sau và HP nhà cho các trace cadence/handoff/range/veteran/stack. Bộ đối xứng/gate giữ từng hit và HP hai quân. Chạy lại bằng `npm run build`, rồi `npm run test:browser -- --grep R1E: --reporter=list,json`; full suite bỏ `--grep R1E:`. Log/JSON, screenshot và output build chỉ ở đường dẫn local được ignore; không đưa lên public repo.

Manifest dự kiến **2 file sửa, 0 thêm/xóa**:

```text
docs/GAME_DESIGN.md
tests/smoke.spec.ts
```

Không thay source gameplay, package/lockfile, workflow hoặc security policy. Giới hạn: mẫu có kiểm soát không bao phủ mọi lịch input; chưa có replay lần Owner quan sát; stack vẫn che hình/nhãn; frame sampling và dt cap vẫn như R1D. Chưa stage/commit/push/deploy.
