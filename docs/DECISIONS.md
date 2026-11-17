# Quyết định thiết kế

## R2D — Armor & Accessory Foundation local (14/11/2026)

Baseline R2C đã phát hành: `050c05cd65078a25ef24321d36ce2f247d815f0d`. Owner chỉ cho phép làm local; không stage/commit/push/deploy trước phê duyệt riêng.

`UnitBuild.equipment` có thêm `armor` và `accessory`; `null` là Không giáp / Không phụ kiện. Build cũ thiếu hai trường vẫn hợp lệ, giữ chỉ số cũ. ID không hợp lệ bị từ chối trước khi thay đội hình. Compiler tạo snapshot bất biến; năm slot, replay và Player/Bot dùng cùng profile, giá và CD như R2C.

| TEMP_R2D | HP thân | Vàng | Tốc | Damage vũ khí gốc | CD triệu hồi |
| --- | ---: | ---: | ---: | ---: | ---: |
| Light Armor | +8 | +2 | 0 | 0 | 0 |
| Chain Armor | +18 | +6 | -6 | 0 | 0 |
| Heavy Armor | +32 | +11 | -12 | 0 | 0 |
| Vital Charm | +12 | +4 | 0 | 0 | 0 |
| Swift Charm | 0 | +4 | +8 | 0 | 0 |
| Whetstone | 0 | +5 | 0 | +4 | +0.2s |

Giáp/phụ kiện cộng chỉ số, không tạo hệ phòng thủ. Whetstone cộng vào `damagePhysicalWeaponBase` trước bonus cầm hai tay +30% và làm tròn; không đổi core damage, attackInterval, windup, AOE hoặc tốc lùi riêng của Giáo. Khiên vẫn là barrier độc lập 30 HP. Tốc di chuyển cơ bản nhận modifier giáp/phụ kiện. Không giáp/phụ kiện không thêm giá hay hiệu ứng.

Một editor cho main hand, off hand, armor, accessory; nháp chỉ áp dụng khi bấm nút, đổi slot bỏ nháp, trả preset chỉ tác động slot đang sửa. Không thêm DEF/MDEF/STR/KG, dual wield, spell card, ranged system, backend/account hay dependency. Giữ 23 active weapons, Bot heuristic và combat hiện có.

Số liệu vẫn TEMP, cần Owner thử cân bằng. Caveat replay browser R2A lịch sử và QA thiết bị thật vẫn OPEN; kiểm thử mới không xóa bằng chứng cũ.

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
| C10 | R1B: mỗi loại quân có tối đa một slot preset; vẫn triệu hồi nhiều bản sao từ cùng slot | R2C giữ năm preset nền khác nhau; theo yêu cầu Owner mới, custom được trùng vũ khí hoặc toàn bộ build giữa các slot. Không áp giới hạn preset cho custom |

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

## R2C — Five-Slot Modular Loadouts LOCAL, 04/11/2026

Baseline Owner chỉ định và fresh-check thực tế: `HEAD`, `origin/main`, remote `refs/heads/main` cùng `d6d012f1868cdc8ff4ec50ddec10c7c8cce79090`, nhánh `main`, remote đúng `VesperKrock/laneforge-game`. Worktree/index sạch trước sửa, chỉ có các thư mục ignored đang có; giữ chúng và `.gitignore`. Quyền thực hiện chỉ local, dừng trước stage/commit/push/deploy.

- **Hợp đồng slot:** collection nội bộ cố định năm phần tử. `getCustomProfile(slot)` trả snapshot custom hoặc `undefined`; `getSlotProfile(slot)` trả custom đúng slot hoặc preset nền (chỉ số sai ném `RangeError`). `setCustomBuild(slot, unknown)` và `clearCustomBuild(slot)` kiểm tra phase/chỉ số/validator trước thay đổi. API một-custom `customSlot` và global clear được thay có chủ đích; không giữ khái niệm “custom cuối cùng”.
- **Bất biến:** compiler/validator R2B không đổi; profile, build, off-hand và behavior đã freeze. Setter tạo snapshot mới, không chia sẻ draft có thể sửa; sửa/xóa một slot giữ nguyên tham chiếu bốn slot kia. Collection dùng private field để trace JSON preset-only R1D/R2A.1 giữ nguyên, không cập nhật expected digest. Test mới chụp thêm năm effective profiles vì JSON của Battle không xuất private fields.
- **Bot:** custom Unit có `sourceSlot` 0–4. Heuristic vẫn score 5, trừ 2 mỗi quân cùng slot, trừ 2 cho slot vừa chọn, quyết định mỗi 0.75s. Thay đúng phép đếm theo `weaponId` bằng `sourceSlot`; không đổi ưu tiên preset, giá/CD hay quy tắc combat. Đánh đổi có chủ đích: hai slot giống nhau có số quân riêng và có thể được Bot phân bổ lần lượt; không gộp thành một build. Chưa có AI tối ưu tổ hợp Giáo/Búa custom; đây không phải nghiên cứu win-rate.
- **UX:** Xưởng mặc định đóng, chơi preset ngay được. Tổng quan đúng năm slot, nhãn Preset/Custom, tên, grip/tay phụ custom hoặc trang bị preset cố định, Vàng/CD và nút Sửa. Một editor dùng lại; chọn slot nạp bản đã áp dụng vào draft mới, hoặc nháp Rìu tay phụ trống khi slot đang dùng preset. Đổi slot bỏ nháp chưa áp dụng và báo rõ; chọn lại chính slot không xóa nháp. Chỉ Dùng bản lắp ráp cập nhật đội hình. Trả slot này về preset chỉ xóa slot đang sửa; không có thao tác xóa cả năm ngầm.
- **Vòng đời:** Bắt đầu/Chơi lại reset trạng thái trận, giữ cả năm build và preset nền; không tự apply draft. Khóa chỉnh sửa khi running/won/lost. Về chuẩn bị nạp lại bản đã áp dụng của slot đang chọn; nháp chưa áp dụng bị bỏ có thông báo. Chọn lại năm preset nền không di chuyển custom: vị trí slot là identity. Reload reset về preset; UI nói rõ chưa lưu đội hình.
- **Phạm vi:** giữ 23 active/43 catalogue, Giáo kite, Búa AOE, barrier Khiên 30 HP, bonus +30% chỉ thành phần damage vũ khí một tay đủ điều kiện khi tay phụ trống. Không thêm weapon, giáp/phụ kiện, thẻ, dual wield, tài khoản, backend, dependency, workflow hoặc rule Security Gate.

### Kiểm chứng R2C local

Trạng thái **R2C READY_FOR_APPROVAL** ngày 04/11/2026, không cấp quyền xuất bản. `npm run build` PASS gồm TypeScript và Vite. Full `npx playwright test --workers=1` **144/144 PASS / 540.53s**, `--workers=2` **144/144 PASS / 279.68s**; mỗi lượt không skip/retry/flaky, gồm 110 model/playtest và 34 browser (32 đồng hồ thật, hai RAF điều khiển). Không sửa `tests/smoke.spec.ts`, không đổi digest golden default hoặc clock R2A.1.

48 biến thể đội hình năm custom đối xứng (sáu lịch dt × đổi phe × đổi ID từng cặp × đảo mảng) dùng đường mua thật; harness chỉ tắt quyết định tự động để kiểm input hai phía tương ứng. Mẫu 16 trận trên bốn đội hình mixed/all-custom/identical, idle/cycle và hai lịch dt kết thúc 4 won / 12 lost, 12.72–87.22s; kiểm Vàng Bot từng bước, giá/CD/profile từng purchase. Bot đã dùng đủ năm slot trong mẫu năm Đoản kiếm giống nhau. Đây là mẫu correctness, không suy ra win-rate hoặc khóa cân bằng.

Production preview `/laneforge-game/`: desktop 1440×1000 và touch 390×844 PASS apply slot 1→5, nháp riêng/không tự apply, sửa slot 3 giữ slot 1, trả slot 3 về preset, paid summon/CD, hai bên cùng profile, restart/setup/reload, keyboard/focus/touch và không overflow. Trận browser năm custom dùng đồng hồ thật kết thúc `lost` ở cả hai lượt (39.411s / 44.033s host, bảy lượt mua thật); ca Greatsword thắng Bot và idle defeat kế thừa cũng PASS. Không inject HP/Vàng/kết quả để ép xanh; observer console/pageerror/network không báo lỗi.

Lượt targeted đầu **17/19 PASS**, hai test browser mới dùng nhầm `toBeDisabled()` cho fieldset; trace hiển thị fieldset/control con đã disabled. Sửa matcher thành `toHaveJSProperty('disabled', true)`, giữ assertions khóa nút con; targeted UI sau sửa **3/3 PASS** và hai full suite trên đều PASS. Đây là lỗi assertion được đóng, không phải sửa combat hay thay kỳ vọng thắng/thua. Evidence ban đầu được giữ riêng, không ghi đè bằng lượt full.

Security Gate `PASS_HEURISTIC`: 26 candidate / 26 tracked / 17 ignore checks / 0 staged / 0 findings; policy/allowlist không đổi. `npm audit --audit-level=low --json`: 0 vulnerabilities. Manifest cuối gồm bảy file sửa sẵn có, không file nguồn mới/xóa; SHA-256 tính trên bytes worktree. Log, JSON, screenshot, trace và manifest review ở thư mục ignored local, không đưa vào nguồn public.

### R2C OPEN và giới hạn kế thừa

- Số TEMP/balance và thời lượng duel/trận còn OPEN; không ép mọi duel về 4–7s hoặc coi mẫu trận là thống kê thắng. Bot custom giữ heuristic đơn giản R2B, không đánh giá tối ưu năm build.
- Phân loại nguồn Pollaxe, Katana-Taichi, nhóm nguồn của sáu pháp khí và taxonomy đề xuất còn OPEN_REVIEW; giữ nguyên catalogue và toàn bộ metadata nguồn.
- [Replay chính xác lỗi browser lịch sử R2A](R2A_REVIEW.md#open-và-điều-kiện-phát-hành-đề-xuất) còn OPEN vì trace cũ thiếu telemetry. Không xóa caveat bằng kết quả R2C mới. Regression clock R2A.1 và toàn bộ R1E được giữ nguyên.
- Cảnh báo bundle Phaser >500 kB có từ baseline, chưa tối ưu trong R2C. Browser mobile là viewport/touch giả lập, chưa phải QA thiết bị thật. Security Gate là heuristic, không phải chứng minh tuyệt đối không có secret/PII.
- Bản local cần Owner duyệt manifest và SHA-256 cuối; không suy ra quyền phát hành từ R2B đã công bố.

## R2W1 — Visual Workshop integration, local preparation, 15/11/2026

- Owner đã review R2W0 và đồng ý hướng thiết kế Xưởng trực quan: năm slot, nhân vật trung tâm, bốn vị trí trang bị, chọn để xem trước và xác nhận để áp dụng. Tiếp tục từ phần visual đã kiểm chứng, không viết lại prototype từ đầu.
- **Xác nhận quyền sử dụng:** Owner xác nhận có toàn quyền sử dụng và đưa các hình ảnh đã cung cấp vào dự án. Ghi nhận và chấp nhận xác nhận này làm cơ sở tích hợp R2W1; việc thiếu metadata license trong archive không còn là blocker. Đây là xác nhận của Owner, không mô tả thành một cuộc xác minh giấy phép độc lập của Codex.
- Phạm vi asset dự kiến chỉ Actor1_1 và ShortSword1 / Axe1 / Spear1 / elemental_hammer_1 đã review; mapping lần lượt short_sword / axe / spear / war_hammer. Các vũ khí khác giữ fallback rõ ràng. Giáp/phụ kiện chưa có sprite vẫn dùng tên và placeholder.
- Visual configuration và rig nằm ngoài UnitBuild compiler/combat behavior. Hướng hoàn thiện: grip hai tay Giáo, phân biệt Rìu một/hai tay, Khiên chỉ với grip phù hợp; camera mobile giữ khả năng nhận diện, không đổi simulation hoặc thời điểm gây sát thương.
- **Checkpoint bắt buộc của Owner:** trước khi áp dụng bất kỳ thay đổi Security Gate nào, trình exact paths và exact diff để Owner duyệt riêng. Gate hiện chỉ nhận source text và artifact JS/CSS; PNG cần allowlist có kiểm tra bytes/hash riêng. Đang dừng ở bước đề xuất Gate, chưa áp dụng patch, chưa đưa PNG vào source và chưa tuyên bố triển khai/kiểm thử R2W1 hoàn tất.
- Quyền làm việc chỉ LOCAL. Giữ archive, prototype và bằng chứng R2W0; không stage, commit, push hoặc deploy. Phê duyệt Gate sau này không đồng nghĩa với phê duyệt phát hành.

## R2W1 — cập nhật phê duyệt có điều kiện, 15/11/2026

- Phê duyệt mới của Owner thay thế giới hạn LOCAL và checkpoint đang chờ ở ghi chép R2W1 phía trên. Owner xác nhận toàn quyền **sử dụng và phát hành** hình ảnh đã cung cấp. Đây là xác nhận của Owner được chấp nhận cho dự án, không phải xác minh độc lập tác giả/license của từng PNG.
- Owner duyệt exact Security Gate patch có SHA-256 `c3b2f5f8d9fa12619b0d817ffe2f4e68e8d40898d5bcbd032f82bef4a5b9ae97`. Gate chỉ thêm hai module visual và năm PNG có đường dẫn, byte count, kích thước và SHA-256 cố định; kiểm tra cả source, index và dist. Không có wildcard asset, tắt scanner hoặc thay allowlist khác.
- Tái sử dụng cấu trúc frame, hand anchors, pivot, mapping và layout đã review của R2W0. Actor1_1 là sheet 576×384, 54 ô 64×64, hướng gốc trái; bốn weapon là 288×64, ba ô 96×64. Mapping: ShortSword1 → `short_sword`; Axe1 → `axe`; Spear1 → `spear`; elemental_hammer_1 → `war_hammer`. Chỉ năm PNG, tổng 29.727 bytes, được đưa vào bundle. Archive gốc và evidence giữ nguyên ngoài nguồn public.
- `WeaponVisual` sở hữu dữ liệu hình, pivot, layer, tỉ lệ, idle/attack và flip; không import compiler hoặc combat model. `WorkshopScene` nhận profile để preview. `BattleScene` đọc unit/profile hiện hữu, tái sử dụng rig theo unit ID và hủy khi unit biến mất hoặc ID đổi về fallback; animation không gọi gây sát thương, không quyết định nhịp đòn.
- Giáo có hai điểm nắm dọc cán; Rìu 2H có cán phóng lớn về mặt trình bày và hai tay giữ trước ngực, khác Rìu một tay + Khiên. Miếng găng foreground lấy từ actor đã duyệt, không thêm PNG. Rìu 2H dùng pose thân braced và ba frame vũ khí thật cho động tác; không tuyên bố có ba pose cơ thể khác nhau. Frame thrust 4/5 của actor và frame 1/2 của Giáo trùng pixel; giữ recovery hold đúng dữ liệu. Khiên là hình khối, gắn tay phụ, chỉ hiện khi grip một tay và barrier còn HP.
- Xưởng giữ năm slot độc lập và semantics R2D: thay chọn chỉ đổi nháp/preview; Áp dụng build mới thay slot; chuyển slot bỏ nháp cũ và thông báo; restore chỉ slot đang sửa; replay giữ build, Về chuẩn bị cho sửa tiếp, reload về preset. Panel thumbnail có bốn mẫu thật và nhãn thiếu sprite cho 19 active còn lại; select gốc hỗ trợ bàn phím. Giáp/phụ kiện chỉ tên và placeholder, không giả thay ngoại hình.
- Mobile 390×844 dùng camera cận cảnh zoom 1.5 và các nút theo giao tranh/căn cứ ta/căn cứ Bot/toàn tuyến; desktop zoom 1.15. Tọa độ mô phỏng, range, collision, AI và luật thắng thua giữ nguyên. Góc nhìn toàn tuyến là lựa chọn riêng; mặc định theo giao tranh để nhận diện nhân vật. Màu vòng chân, nhãn TA/BOT và thanh HP phân biệt phe.
- Bảo toàn 23 active / 43 catalogue, năm custom slot, ba giáp/ba phụ kiện, barrier, bonus +30%, Giáo kite và Búa AOE. Không sửa Battle, UnitBuild hoặc WeaponCatalog; không thêm dependency, không triển khai R2E hoặc mở vũ khí mới.
- Quyền stage/commit/push fast-forward/Pages chỉ có hiệu lực sau khi toàn bộ tiêu chí Owner PASS: build/typecheck, full regression 1 và 2 workers, visual QA, console/network, lifecycle, audit 0, Gate source/staged/dist, diff check và manifest cuối đúng phạm vi. CI/Pages và bytes public phải được xác minh riêng trước khi báo RELEASED.
- OPEN có chủ đích: 19 active/preset chưa có sprite riêng; giáp/phụ kiện chưa có ngoại hình; Khiên hình khối; Búa elemental không suy ra phép/hiệu ứng gameplay. QA mobile trình duyệt/touch giả lập chưa thay thế thiết bị thật. Bundle Phaser lớn và balance TEMP là giới hạn kế thừa. Đây không phải nghiệm thu R2E hay full inventory.

## R2W2 — Character Appearance, checkpoint asset local, 15/11/2026

- Kế thừa R2W1 đã phát hành tại `0661f62f8a47f2a6744c1f926bdd80bc66d632b9`. Owner xác nhận có toàn quyền sử dụng và phát hành hình ảnh trong archive đã cung cấp; dự án tiếp tục chấp nhận xác nhận này, không đặt lại blocker do thiếu metadata license. Đây là xác nhận của Owner, không phải kết luận xác minh tác quyền độc lập.
- **Core = chỉ số và luật; Appearance = hình ảnh.** Hướng triển khai: danh mục ID ngoại hình thuần dữ liệu, tách khỏi registry sprite/pose/anchor. Compiler chỉ kiểm tra ID, không import Phaser hoặc PNG; thiếu `appearanceId` dùng actor mặc định R2W1, ID lạ và field không hợp lệ bị từ chối. Snapshot vẫn immutable; ngoại hình không tham gia phép tính combat và không tạo core/class/nội tại mới.
- Đề xuất năm mẫu gồm Actor1_1 hiện tại và Actor2_1, Actor2_4, Actor2_7, Actor3_6, chọn sau audit kích thước và contact sheet toàn nhóm 576×384. Mỗi mẫu có anchor tay chính/tay phụ riêng. Frame thrust 4/5 và swing 13/14 trùng pixel ở cả năm mẫu; giữ hold thật, không tuyên bố có ba pose khác nhau. Ghép thử chỉ dùng rig R2W1 trong công cụ local, chưa là nghiệm thu tích hợp game.
- Giữ năm slot độc lập, cho phép trùng ngoại hình; chọn actor chỉ đổi nháp/preview, Áp dụng build mới thay slot. Replay giữ build trong phiên, về chuẩn bị cho sửa tiếp, reload có thể về preset. Bốn vũ khí có sprite tiếp tục dùng mapping R2W1; 19 vũ khí khác giữ fallback trung thực. Giáp/phụ kiện chưa có sprite vẫn dùng placeholder.
- **Checkpoint bắt buộc:** cần Owner duyệt riêng exact Security Gate patch trước khi thêm bốn PNG mới và hai module registry vào allowlist. Hiện Gate chưa thay đổi, PNG mới chỉ ở vùng ignored local, UnitBuild/Xưởng/BattleScene chưa sửa. Không mở wildcard, bỏ scanner hoặc dùng kết quả audit pose thay cho full regression và QA desktop/mobile sau tích hợp.
- R2W2 chỉ LOCAL; không stage, commit, push hoặc deploy. Quyền phát hành có điều kiện của R2W1 không áp dụng cho R2W2. Không triển khai R2W3/R2E, vũ khí mới hoặc gameplay khác.

## R2W2–R2W4 — cập nhật local theo brief tổng hợp, 16/11/2026

- Phê duyệt mới của Owner thay checkpoint R2W2 đang chờ ở ghi chép phía trên: exact patch SHA-256 `5cdf3906e59660928d6b687756f7e51c28c54eb84066228e2f17a6bc9cb72ff5` và manifest `d0a802d0fd390272570e5abf5532f10fbf5a78a18b3b4460340bf4508814756a` đã khớp và được áp dụng nguyên trạng. Chỉ bốn PNG actor mới cùng hai module Appearance/CharacterVisual; không wildcard hoặc bỏ scanner. Owner tiếp tục xác nhận quyền dùng/phát hành asset; đây không phải xác minh giấy phép độc lập.
- Năm actor đã vào Xưởng và BattleScene. Appearance.ts chỉ chứa ID/tên; CharacterVisual.ts giữ texture, pose, origin, scale, facing, anchor/crop riêng. UnitBuild nhận appearanceId tùy chọn, giữ snapshot build legacy không tự thêm field, resolved profile mặc định actor_1_1; từ chối ID/field/getter/prototype không hợp lệ. Không tạo core, nghề hoặc nội tại mới; Battle.ts và WeaponCatalog.ts không thay đổi.
- Năm slot được trùng actor, đổi actor giữ trang bị, chỉ Áp dụng build mới đổi slot thật. Replay giữ ngoại hình; restore riêng slot; reload về preset. Cache UI dùng toàn bộ build để đổi riêng actor/giáp/phụ kiện cũng cập nhật summary và thẻ triệu hồi.
- Rig R2W1 được tái sử dụng với anchor đo riêng từng actor, crop găng tay cùng texture actor; giữ hold frame trùng đúng ảnh. Khiên hình học bám tay phụ và bị ẩn ở tư thế hai tay. Bộ chọn có thumbnail và native select; mobile 390×844 giữ camera cận cảnh/toàn tuyến R2W1. Giáp/phụ kiện vẫn là placeholder rõ ràng.
- R2W3 mới audit/chọn ứng viên trong vùng ignored: bốn sprite hiện hữu, 18 PNG đề nghị thêm exact allowlist, Bardiche thiếu art phù hợp. Estoc là biến thể rapier; Morning Star có chi tiết sáng bake trong PNG, không có phép/hiệu ứng gameplay. Không biến ảnh contact thành bằng chứng rig/combat đã PASS. Chưa áp dụng Gate R2W3 hoặc thêm asset của bước này vào src/dist.
- Owner chọn giữ checkpoint R2W3 để review, chưa duyệt patch; không hỏi duyệt lặp lại hoặc coi prompt tiếp nối là cho phép áp dụng. R2W2 đã đạt 176/176 test với 1 worker và 176/176 với 2 workers, không skip/retry/flaky; 2.960 tổ hợp giữ chỉ số, browser desktop/mobile và rig lifecycle/nonmutation đạt. Build/typecheck, Gate source/dist, audit 0 và diff check đạt; index vẫn trống. Đây là nghiệm thu local để Owner review, không phải phát hành.
- R2W4 hoãn ở đề xuất: ưu tiên nhãn/overlap và giảm thao tác trên mobile sau khi R2W3 được duyệt, tích hợp và kiểm chứng. Không đổi collision, giới hạn stack hay timing để chữa vấn đề hình ảnh. QA mobile giả lập không thay cho kiểm thử thiết bị vật lý.
- Phạm vi toàn đợt chỉ LOCAL. Cấm stage/commit/push/deploy kể cả sau khi Gate được duyệt; quyền phát hành R2W1 trước đó không kế thừa. Không mở R2E, vũ khí catalogue-only, thẻ, phép, backend hoặc PvP. Archive và evidence cũ được bảo toàn.

## R2W3 — phê duyệt asset có điều kiện và tích hợp local, 16/11/2026

- Quyết định mới của Owner thay thế checkpoint chờ duyệt R2W3 ở trên: chỉ được áp dụng exact patch SHA-256 `86b950998c9db9e2e5c1a19a81e4662b043da0a23ef77d2b1e150c87a52a8d9b`, manifest `bfd6d2c2f33e606960b978a12831bef5fe3f8ef2376787bbf14dcd84e6ec670f`, sau kiểm tra byte thật, baseline và diff. Đã kiểm tra và áp dụng đúng 18 bản ghi PNG cùng comment 9→27. Không thay scanner, text allowlist, wildcard, dependencies hoặc workflow. Gate sau patch có SHA-256 `4a6a683b2996f4a102c65b0b1530537702fe33c6b886becc7c324b643e1b548b`.
- 18 PNG mới tổng 175.524 bytes; giữ nguyên archive gốc. Owner đã xác nhận quyền sử dụng/phát hành asset; quyền thực hiện đợt này vẫn **LOCAL ONLY**, tuyệt đối không stage/commit/push/deploy.
- Mapping mới: Blades1→estoc; Blades7→stiletto; Spear2→ji; Lance6→pike; Spear9→trident; elemental_mace_1→club; Scepter10→mace; elemental_mace_10→morning_star; ShortSword4→arming_sword; ExSword2→sabre; ExSword4→scimitar; ExSword6→falchion; Katana4→katana_taichi; Axe4→battle_axe; Greatsword10→longsword; Greatsword3→greatsword; elemental_mace_5→two_hand_mace; Katana6→nodachi. Bốn mapping R2W1 được kế thừa; tổng 22/23 active. Bardiche giữ **OPEN_ART**, không dùng art gần giống để ép đủ số.
- Registry visual riêng sở hữu rectangle/frame, pivot, scale, rotation, layer và motion. Toàn bộ 22 sheet được chọn đã audit là 288×64 với ba ô 96×64; điều này không áp dụng mặc định cho archive. Estoc/Stiletto/Pike/Trident/Spear có frame 1/2 trùng pixel: recovery hold giữ nguyên. Actor frame và weapon frame có mapping riêng; animation không quyết định thời điểm hit.
- Kiếm/Chùy/Rìu có pose chém; Estoc/Stiletto dùng pose đâm; cán Giáo có hai điểm nắm; vũ khí hai tay dùng pose braced và tay foreground lấy từ chính actor. Điểm nắm được biến đổi theo anchor của từng actor. Battle Axe vẫn tuân thủ compiler cũ: Khiên→một tay; tay phụ trống→two_hand_grip +30%. Không suy ra fixed-two-hand từ tên hoặc hình.
- Đồ họa ngôi sao/ánh sáng trên art là pixel có sẵn, không thêm phép, hiệu ứng nguyên tố hoặc gameplay. Khiên tiếp tục là hình khối và chỉ hiện khi grip cho phép, barrier còn HP. Giáp/phụ kiện tiếp tục placeholder trung thực.
- R2W2 và toàn bộ cơ chế R1D–R2D được giữ. Thay đổi R2W3 không sửa Battle, UnitBuild, WeaponCatalog, CharacterVisual hoặc camera; rig dùng chung theo ID. R2W4 polish riêng **DEFERRED**; nhãn đông quân và QA điện thoại vật lý còn OPEN. Header local ghi R2W3 để phân biệt với bản public R2W1.
- Nghiệm thu local: targeted 16/16 PASS, full 189/189 với 1 worker và 189/189 với 2 workers, không skip/retry/flaky. Giữ 176 regression R2W2 và thêm 13 case; 1.440 pose, 200 rig × 10 vòng, 500 render model đóng băng không mutation; build/typecheck, desktop/mobile 390×844, keyboard/touch, Gate source/dist, audit 0 và diff check đạt. Source runtime và dist giữ cùng bytes giữa hai full suite. Trạng thái **READY_FOR_OWNER_REVIEW — LOCAL ONLY**, chưa stage hoặc phát hành.

## R2W4 — Visual Polish & Owner Review, 17/11/2026

- Owner yêu cầu tiếp nối R2W2/R2W3, chỉ LOCAL; mọi bước stage/commit/push/deploy chờ prompt phát hành riêng. Giữ 27 PNG và Security Gate đã duyệt nguyên bytes; không thêm asset hoặc dependency.
- Nhãn chiến trường gom quân cùng phe trong một khoảng màn hình, ghi ×N và mã vũ khí nếu đồng nhất. Thanh màu báo tổng HP thân; thanh xanh lam báo tổng barrier của nhóm. Hàng nhãn giữ theo ID và phân tầng tránh chồng. Vòng chân từng quân và hình nhân vật vẫn giữ vị trí cũ; đây không phải đội hình/đơn vị chiến đấu mới. Khi nhóm trộn vũ khí, chỉ hiện phe/số lượng để không gán sai tên. Camera chỉ quyết định thông tin đang thấy.
- Khiên Graphics có viền, mặt và núm giữa gắn vào anchor tay phụ riêng của actor; chỉ hiện khi một tay và barrier >0. Không thêm block, damage, timing hoặc hiệu ứng gameplay. Preset giữ hình học, thêm dấu ◇/phe/vòng chân; không gán actor sai nghĩa. Nhãn Giáp/Phụ kiện ghi rõ chỉ có chỉ số, chưa có lớp hình riêng.
- Mobile: bộ chọn mở đưa focus tới tiêu đề và cuộn panel vào vùng nhìn; đóng trả focus về nút mở. Native select cao tối thiểu 44px; giữ toàn bộ nháp/Apply, năm slot, replay và keyboard/touch.
- Rà có giới hạn Spear10, Spear11, Spear4 từ contact sheet R2W3: lần lượt móc/glaive mảnh, đầu hai nhánh và rìu hai cạnh nhỏ; không đủ silhouette Bardiche lưỡi dài một phía. Chỉnh pivot/scale không sửa được nghĩa hình. Bardiche tiếp tục **OPEN_ART**, 22/23; không đề nghị thêm PNG hoặc sửa Gate trong R2W4.
- Nghiệm thu source cuối, so sánh ảnh cùng model, browser real-clock, full regression và manifest được ghi trong hồ sơ review local. QA trình duyệt 390×844 không thay cho điện thoại thật. Chồng hình do luật stack, giáp/phụ kiện chưa có layer và bundle Phaser vẫn là giới hạn công khai; không sửa gameplay để chữa hình ảnh.

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
