# R2A / R2A.1 — Modular Weapon Foundation & Release Review

## R2A.1 — Stabilization & Release Review (02/11/2026)

**READY_FOR_APPROVAL — automated gates PASS, replay chính xác trace lịch sử vẫn OPEN. LOCAL ONLY.** Không stage/commit/push/deploy. Mục này cập nhật trạng thái hiện tại; hồ sơ R2A bên dưới được giữ nguyên để truy xuất, không phải lượt kiểm chứng mới.

### CONFIRMED — phạm vi và bằng chứng

- Fresh-check R2A.1: `HEAD = origin/main = remote main = b4ec9fc1d05dee40244e38e281c20de04776e7bb`, index trống; **13/13 file khớp SHA-256 manifest R2A** trước khi sửa. Đã lưu snapshot local. Không thay source game, UI, chỉ số, Bot, catalogue, dependency, config Playwright, workflow hoặc Security Gate trong R2A.1.
- Trace lỗi cũ đã được giải mã DOM theo định dạng của trace viewer cài trong repo: **673 lần thử mua, 16 lần mua thành công suy ra từ tiến con trỏ slot, chi 565 Vàng**, Player còn 29 Vàng, 114 hit; nhà Player **0/240**, nhà Bot **240/240**; khoảng running→lost trên clock trace **98.870s**. DOM cuối xác nhận trạng thái `lost`; ảnh lỗi chỉ chụp viewport, không đủ để dựng lại FPS. Đây không phải một trận bị timeout rồi giả lập kết quả.
- Trace cũ **không có** `Battle.elapsed`, đầy đủ delta từng frame hoặc FPS. Không thể replay chính xác trace cũ. Ước lượng thời gian mô phỏng từ tiền còn lại/đã chi phụ thuộc giả định chưa chạm trần Vàng; không dùng nó như thời gian chính xác.
- Bài cũ điều khiển mua bằng nhiều vòng đọc DOM → thử click → `waitForTimeout(100)` theo wall-clock; combat nhận delta Phaser riêng, được làm mượt và cap 0.05s như R1D. Khoảng chờ yêu cầu 100ms không bảo đảm nhịp input đúng 100ms trong mô phỏng. Có lệnh chờ thực dài **220.68ms** trong trace cũ.
- Model R1D public nguyên vẹn cũng cho **hai kết quả khác nhau** với cùng đội hình/vòng mua `3→4→5→1→2` và dt 0.01s: thử mỗi 100ms → thắng **51.04s**, 10 lần mua; mỗi 200ms → thua **98.53s**, 16 lần mua, nhà **0/240 vs 240/240**. Grid **48** cặp dt/input cho **42 thắng / 6 thua**, không đổi stat/Gold/AI. Đây là fixture minh họa hợp đồng thời gian của test, không phải cân bằng mới.
- Bốn probe production mới ghi delta/input/state bằng CDP: chỉ giữ tham chiếu và đọc state sau frame; **không viết HP, Vàng, damage, phase hoặc gọi trực tiếp engine để ép kết quả**. Đã replay delta và từng input sang source R1D gốc lẫn R2A: **8/8 replay khớp chính xác** elapsed từng frame, state sau mỗi lần mua và state cuối. Probe native dùng 7.451 frame; input yêu cầu 100ms thực tế cách **105.2–146ms**. Không phát hiện khác luật combat R1D/R2A trong những mẫu này.

| Probe browser | Clock | Delta / FPS đo được | Kết quả / thời gian mô phỏng | Thời gian host |
| --- | --- | --- | --- | --- |
| Input 100ms | Có điều khiển | 16ms, 62.5 frame/s mô phỏng | Thắng / 52.096s, 10 lần mua | 10.703s |
| Input 150ms | Có điều khiển | 16ms, 62.5 frame/s mô phỏng | Thắng / 56.864s, 10 lần mua | 16.695s |
| Input 200ms | Có điều khiển | 16ms, 62.5 frame/s mô phỏng | Thắng / 52.096s, 10 lần mua | 17.570s |
| Input yêu cầu 100ms | **Clock thật** | delta smoothed 6.58–7.31ms, khoảng 144 frame/s mô phỏng | Thắng / 51.741s, 10 lần mua | 52.283s |

**Kết luận có bằng chứng:** yêu cầu một kết quả `won` cố định trong khi lịch frame/input không cố định là phần không ổn định của test. Chưa thấy bằng chứng một lỗi gameplay mới; không kết luận “mọi lỗi do hai workers” hay “game không thể có bug”. Mẫu thua model là một kết quả combat hợp lệ theo luật đã có ở R1D.

### CONFIRMED — patch test được Owner duyệt riêng

Owner cho phép ngoại lệ chỉ sửa clock/input của đúng bài R1D trong `tests/smoke.spec.ts`; toàn bộ audit R1E giữ nguyên. Đã kiểm tra và báo diff trước áp dụng. Patch `.codex/r2a1-r1d-clock-proposal.patch` chỉ:

1. Cài clock browser trước navigation, pause khi game còn `ready`, chạy 1.000ms để ổn định lịch frame Phaser.
2. Cho `requestAnimationFrame`, timer, `performance` và thao tác mua tiến cùng lịch bằng `clock.runFor(100)`; mốc screenshot/giới hạn vòng lặp cũng theo thời gian điều khiển đó.
3. **Giữ nguyên** combat engine, click handler thật, validator/chi tiền/CD, Bot, assertion thắng, nhà địch 0 HP, hit > 0, khóa slot sau trận, replay/reset HP/Vàng/CD và đội hình Búa. Không mock chiến thắng, retry, skip hoặc nới assertion. Ba browser test legacy còn lại và 17 browser R2A vẫn dùng clock thật.

SHA-256 `tests/smoke.spec.ts` trước R2A.1: `0f8e011f74bbae2345ef8fa05506171e54238806c6b539363be65671a3c426a1`; sau patch: **`7407223e01e0132981625619754a67792ac8339553d2725fff1deda3d01d90f6`**. Kiểm tra prefix/suffix theo byte chứng minh **mọi nội dung ngoài đúng bài R1D đó không đổi**. Toàn bộ block audit R1E, gồm 14 test và assertions, có cùng SHA-256 **`de0a5494cc5f91982ba587bf38877538900797f07624c6d7ad12b5240b37da39`** trước/sau. `docs/GAME_DESIGN.md` giữ nguyên hash **`fb653a4d9d835f26e0d7ab06d84457e0a3a9dea7065577f9679bad6c6a01c2f6`**.

R2A.1 thêm hai regression trong file đã được allowlist `tests/modular.spec.ts`: fixture R1D thắng/thua ở hai lịch input có golden hash từ baseline; browser chạy engine thật với clock điều khiển và chèn trễ host 125ms, xác nhận state đứng yên khi chỉ host chậm, mua đúng giá, thắng thật và replay đầy đủ.

### CONFIRMED / TEMP_R2A — kiểm chứng luật

Các giá trị ở bảng R2A bên dưới **không đổi** và vẫn mang nhãn **TEMP_R2A**, không phải dữ liệu cân bằng chính thức: Rìu + Khiên 26 damage/30 barrier; Rìu tay phụ Trống 26×1.30 làm tròn 34, interval giữ 1.2s; Greatsword vốn 2H 34 damage, không nhân bonus lần hai, không mang Khiên. Barrier nhận hit chính/AOE trước, dư vào thân; 15 active/28 catalogue-only, compiler immutable, invalid build bị từ chối trước chi tiêu, khóa sửa build giữa trận, mua cùng Gold/CD cho hai phe. Targeted R2A + R1E đã kiểm chứng lại các luật này; full runs được ghi ở bảng sau.

### Nhật ký kiểm chứng R2A.1 — ghi mọi lượt

| Lượt | Phạm vi / workers | Kết quả |
| --- | --- | --- |
| T1 | Hai regression R2A.1 / 2 workers | **2/2 PASS**, 19.87s |
| T2 (trước patch R1D) | Toàn bộ R2A/R2A.1 + 14 audit R1E / 2 workers | **57/57 PASS**, 155.26s |
| T3 (sau patch) | Bài R1D lỗi × 3 lần / 2 workers, không retry | **3/3 PASS**, 37.38s |
| F1 (sau patch) | Full suite / 1 worker | **104/104 PASS**, 335.31s |
| F2 (sau patch) | Full suite / 2 workers | **104/104 PASS**, 176.08s |

Tổng **5 invocation / 270 lần thực thi test**, tất cả PASS trong R2A.1, 0 skip / 0 retries / 0 reporter flaky. Không ghi đè JSON R2A cũ để che lượt fail: mỗi lượt R2A.1 có `.codex/r2a1-<tên-lượt>.json/log` riêng. Suite cuối = **61 cũ + 41 R2A + 2 R2A.1 = 104**, gồm **82 model/playtest + 22 browser**. Trong mỗi full suite, **20 browser test dùng clock thật**, hai bài dùng clock điều khiển. Bài Greatsword custom không điều khiển clock thắng/replay ở cả F1/F2, mất 22.707s / 22.947s host. Những bài summon/economy/CD/mobile còn lại cũng chạy clock thật; không đổi toàn suite sang fake time.

Build chạy **2 lần PASS**, bao gồm lượt sau patch; có 3 lượt typecheck thành công (một riêng, hai trong build). Cùng HTML/JS/CSS artifact với R2A; source game không đổi. Cảnh báo Phaser chunk >500kB vẫn còn. `npm audit --audit-level=low` chạy **2 lần**, cả hai 0 vulnerabilities; lượt cuối sau patch. Security Gate chạy **3 lần PASS_HEURISTIC**, gồm kiểm tra đầu và hai lần chốt sau cập nhật báo cáo; policy khớp nguyên byte R2A, đúng **26 candidate / 17 ignore checks / 0 findings / 0 staged**. Kết quả/hash cuối nằm trong manifest. Scanner là heuristic, không phải bảo đảm tuyệt đối không có secret/PII.

### OPEN và điều kiện phát hành đề xuất

- **OPEN — replay chính xác lỗi browser lịch sử:** trace cũ thiếu delta/FPS/input telemetry ở mức engine, nên không chứng minh được chính xác frame/timing nào tạo trận thua đó. Bằng chứng mới giải thích lỗi hợp đồng thời gian của test và kiểm tra cách sửa; không xóa lượt 101/102 cũ, không tự nhận đã chứng minh tải hai workers là nguyên nhân duy nhất.
- **Các điều kiện tự động hiện đạt:** T3, full 1 worker, full 2 workers, browser clock thật, build/typecheck, audit và gate cuối đều PASS trên chính tài liệu/file được liệt kê trong manifest. Không retry để che lỗi. Nếu một bước fail ở vòng sau, giữ HOLD để điều tra lượt đó. Nếu Owner yêu cầu đóng cả replay lịch sử, cần tái hiện thêm một failure có ghi đầy đủ delta/input; không thay gameplay để ép thắng.
- Owner cần duyệt rõ việc chấp nhận giới hạn lịch sử trên cùng các số **TEMP_R2A**. R2A.1 không mở R2B, không thêm vũ khí/thẻ/giáp/phụ kiện hoặc đổi thuật toán Bot.

R2A.1 chỉ sửa **`tests/smoke.spec.ts` (đúng đoạn R1D đã duyệt), `tests/modular.spec.ts`, `docs/R2A_REVIEW.md`** so với worktree R2A; không thêm/xóa file nguồn. Manifest toàn worktree vẫn 13 file; sẽ cập nhật đầy đủ SHA-256 và phân loại R1E/R2A/R2A.1 ở `.codex/r2a-approval-manifest.json` và snapshot `.codex/r2a1-approval-manifest.json`. Output chẩn đoán/trace/log giữ local, ignored. **NO STAGE / NO COMMIT / NO PUSH / NO DEPLOY.**

## Hồ sơ R2A — giữ nguyên lịch sử bên dưới

**READY_FOR_APPROVAL — local, kèm finding browser R1D OPEN bên dưới.** Ngày 02/11/2026. Không stage/commit/push/deploy. Báo cáo này không cấp quyền phát hành và không coi roadmap đề xuất là tính năng đã hoàn thành.

## Baseline và bảo toàn R1E

Fresh-check: root/branch đúng, `HEAD = origin/main = remote main = b4ec9fc1d05dee40244e38e281c20de04776e7bb`. Index ban đầu 0 staged. Worktree ban đầu chỉ sửa hai file audit R1E dưới đây; R2A không sửa thêm một byte ở chúng:

| File có sẵn từ R1E | SHA-256 trước/sau R2A |
| --- | --- |
| `docs/GAME_DESIGN.md` | `fb653a4d9d835f26e0d7ab06d84457e0a3a9dea7065577f9679bad6c6a01c2f6` |
| `tests/smoke.spec.ts` | `0f8e011f74bbae2345ef8fa05506171e54238806c6b539363be65671a3c426a1` |

## Hành vi và kiến trúc

- `WeaponCatalog.ts`: 43 records giữ nguyên tên/thứ tự/phân loại/note nguồn; taxonomy đề xuất ở các trường riêng. Chỉ 15 `active_r2a`; 28 `catalog_only` bị validator từ chối và không có trong menu Xưởng.
- `UnitBuild.ts`: types WeaponDefinition/EquipmentLoadout/UnitBuild/CompiledUnitProfile, validator nhận cả dữ liệu runtime không đúng kiểu; compiler pure, tạo snapshot đóng băng và không sửa catalogue/preset. Lõi duy nhất Bộ Binh demo. Tay phụ có schema vũ khí để dự trù nhưng dual wield luôn bị từ chối.
- `Battle.ts`: một custom slot thay preset tương ứng; bốn slot còn lại giữ nguyên. Hai phe dùng cùng profile biên dịch, cùng hàm mua và giá/CD. Chỉ nhận build hợp lệ khi chuẩn bị, không đổi trang bị giữa trận. Chơi lại giữ build; Về chuẩn bị cho sửa hoặc trả về preset.
- Custom dùng một luật cận chiến tiếp cận/theo tầm, windup lần đầu và sau khi rời/vào tầm, repeat interval tối thiểu; năm họ animation/placeholder: 1H chém, 1H đâm, 1H đập, polearm và 2H heavy. Không có 15 engine. Polearm custom chưa có kite riêng; custom War Hammer không thừa hưởng AOE của preset Búa R1D.
- R1D mặc định giữ nguyên profile, timer/cadence (kể cả Giác Đấu 0.35 và phần dư timer), windup Rìu 0.6, kite Giáo 48, AOE Búa 26+10 không cap, heuristic Bot, nhà 240, kinh tế 100/+5/s/max125, snapshot chọn tất cả đòn trước sát thương, không xuyên phe/không Hòa. Custom được Bot chấm như cận chiến thử nghiệm (score 5, trừ theo số đang có và lần mua gần nhất); không thêm tiền/CD hoặc stat bí mật. Đây là heuristic TEMP, không phải AI tối ưu cho mọi build.
- UI Xưởng là vùng mở tùy chọn trong chuẩn bị, mặc định đóng; native select/fieldset/button cho keyboard/touch, chỉ có 15 lựa chọn. Hiện HP thân/Khiên, base/bonus damage, interval/windup/tầm/tốc/giá/CD và tư thế cầm. Vũ khí vốn 2H khóa Khiên và giải thích; đổi từ 1H+Khiên sang 2H đưa bản nháp tay phụ về Trống trước khi dùng. Thay đổi bản nháp chỉ có hiệu lực khi bấm **Dùng bản lắp ráp**.
- Không thêm dependency, asset ngoài, tài khoản/save, backend hay workflow. Không có request dịch vụ ngoài để chơi.

## Luật TEMP_R2A cần Owner đánh giá

Lõi: HP thân **60**, tốc **85 đơn vị/giây**, damage vật lý lõi **0**, giá lõi **10 Vàng**. Khiên mẫu: **30 HP barrier**, giá **10 Vàng**, không thay HP thân, tốc, interval hoặc CD. Giá cuối = lõi + vũ khí + Khiên nếu mang. CD theo vũ khí; tất cả số đều là đề xuất thử nghiệm, **không phải số cân bằng chính thức của anh Đăng**.

1H có `canTwoHandGrip=true` + tay phụ Trống tự chuyển cầm hai tay: `Math.round(damagePhysicalWeapon × 1.30)`. Cộng damage lõi sau bước này; không nhân STR/phép/true damage/splash. Rìu 26 → 33.8 → **34**, không đổi interval. 1H+Khiên không bonus. Stiletto không eligible. Vũ khí vốn 2H chiếm cả hai tay, không nhận +30% lần nữa và không mang Khiên. Không có người chơi chọn tư thế 1H trống tay phụ cho vũ khí eligible trong R2A.

Barrier áp dụng vào cả hit chính và AOE vật lý R1D nhận vào: `absorbed = min(shieldHp, damage)`, giảm barrier, damage dư vào thân, clamp 0. Khiên không hồi, không block%, không hướng đỡ, không DEF/steal/reflect/armor. Các đòn đã chọn cùng snapshot vẫn trả đủ dù người đánh chết trong bước đó; nhiều hit cùng bước không làm mất damage dư. Luật barrier này là lựa chọn tối thiểu TEMP_R2A theo ví dụ Owner cho phép, cần duyệt trước phát hành.

### Chỉ số 15 vũ khí

`Dmg 1H+Khiên / Trống` là damage cuối mỗi hit (lõi 0). `Giá Khiên / Trống` đã gồm giá lõi/Khiên; `—` nghĩa trang bị không hợp lệ, không phải thiếu dữ liệu. Tất cả active có HP thân 60, tốc 85; Khiên hợp lệ có 30 barrier, Trống có 0. Asset là hình dựng bằng code theo family, không tải ngoài.

| Vũ khí (ID) | Family / grip | Eligible 2H | Dmg Khiên / Trống | Interval / windup (s) | Tầm | Giá Khiên / Trống | CD (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spear – Thương (spear) | polearm / polearm_two_hand | Không | — / 10 | 0.9 / 0.15 | 58 | — / 30 | 2.8 |
| Estoc - Liễu kiếm (estoc) | one_hand_pierce / one_hand | Không | 11 / 11 | 0.55 / 0.1 | 32 | 35 / 25 | 2 |
| Ji - Kích (ji) | polearm / polearm_two_hand | Không | — / 22 | 1.3 / 0.5 | 54 | — / 38 | 3.4 |
| Stiletto - Dao đục (stiletto) | one_hand_pierce / one_hand | Không | 7 / 7 | 0.35 / 0.05 | 24 | 30 / 20 | 1.5 |
| Club – Chùy gỗ (club) | one_hand_blunt / one_hand | Không | 13 / 13 | 0.8 / 0.2 | 28 | 32 / 22 | 2 |
| Mace – Chùy chiến (mace) | one_hand_blunt / one_hand | Không | 19 / 19 | 1 / 0.3 | 28 | 40 / 30 | 2.6 |
| War Hammer – Búa chiến (war_hammer) | one_hand_blunt / one_hand | Không | 26 / 26 | 1.8 / 0.9 | 28 | 55 / 45 | 4 |
| Arming Sword (arming_sword) | one_hand_slash / one_hand | Có | 12 / 16 | 0.65 / 0.15 | 28 | 35 / 25 | 2 |
| Sabre – Kiếm cong (sabre) | one_hand_slash / one_hand | Không | 11 / 11 | 0.55 / 0.1 | 28 | 35 / 25 | 2 |
| Katana-Taichi (katana_taichi) | one_hand_slash / one_hand | Có | 18 / 23 | 0.85 / 0.25 | 32 | 42 / 32 | 2.8 |
| Rìu chiến- Battle Axe (battle_axe) | one_hand_slash / one_hand | Có | 30 / 39 | 1.4 / 0.7 | 28 | 50 / 40 | 3.6 |
| Rìu (axe) | one_hand_slash / one_hand | Có | 26 / 34 | 1.2 / 0.6 | 28 | 45 / 35 | 3.2 |
| Rìu cán dài-Bardiche (bardiche) | polearm / polearm_two_hand | Không | — / 28 | 1.5 / 0.65 | 54 | — / 42 | 3.8 |
| Longsword (longsword) | two_hand_heavy / two_hand | Không | — / 23 | 1 / 0.35 | 38 | — / 35 | 3 |
| Greatsword (greatsword) | two_hand_heavy / two_hand | Không | — / 34 | 1.6 / 0.75 | 42 | — / 45 | 4 |

Cờ eligible hiện bật cho **Arming Sword, Katana-Taichi, Battle Axe, Rìu**; những món 1H khác tạm không bật. Đây là lựa chọn `TEMP_R2A`, cần Owner xét từng món; không suy ra từ nhóm animation nguồn.

### Catalogue nguồn 43 món và taxonomy riêng

Không tìm thấy workbook gốc trong checkout. Dùng bảng 43 món và phụ lục đặc tính Owner cung cấp trong tài liệu R2A theo quyền fallback đã ghi rõ. Chưa xác minh độc lập byte/cell từ Excel. `sourceNote` lưu đủ nguyên văn 43 mô tả, kể cả lỗi chính tả nguồn; không biến chúng thành passive. `sourceAnimationGroup=null` giữ nguyên sáu ô pháp khí trống. “Đại đao” giữ cả hai khoảng trắng cuối tên trong catalogue. Golden source digest bao gồm toàn bộ tên/category/group/note: `d9276dd5707e94721c7e4ba12ed8fa7bdbc313250092a8dc71b82c76a640647c`.

| # | Tên nguồn | Damage nguồn | Animation nguồn | Family đề xuất | R2A |
| --- | --- | --- | --- | --- | --- |
| 1 | Spear – Thương | Đâm/Chém | Vũ khí cán dài (hai tay) | polearm | Active |
| 2 | Lance – Kỵ thương | Đâm | Vũ khí cán dài (hai tay) | polearm | Chỉ catalogue |
| 3 | Pike – Trường thương | Đâm | Vũ khí cán dài (hai tay) | polearm | Chỉ catalogue |
| 4 | Javelin – Lao phóng | Đâm | Vũ khí cán dài (hai tay) | polearm | Chỉ catalogue |
| 5 | Estoc - Liễu kiếm | Đâm | Vũ khí 1 tay | one_hand_pierce | Active |
| 6 | Ji - Kích | Đâm/Chém | Vũ khí cán dài (hai tay) | polearm | Active |
| 7 | Đinh Ba | Đâm | Vũ khí cán dài (hai tay) | polearm | Chỉ catalogue |
| 8 | Lao móc | Đâm | Vũ khí cán dài (hai tay) | polearm | Chỉ catalogue |
| 9 | Stiletto - Dao đục | Đâm | Vũ khí 1 tay | one_hand_pierce | Active |
| 10 | Club – Chùy gỗ | Đập | Vũ khí 1 tay | one_hand_blunt | Active |
| 11 | Mace – Chùy chiến | Đập | Vũ khí 1 tay | one_hand_blunt | Active |
| 12 | Morning Star - Chùy sao | Đập | Vũ khí 1 tay | one_hand_blunt | Chỉ catalogue |
| 13 | War Hammer – Búa chiến | Đập | Vũ khí 1 tay | one_hand_blunt | Active |
| 14 | Pollaxe | Đập/đâm | Vũ khí 1 tay | one_hand_blunt | Chỉ catalogue |
| 15 | Bec de Corbin | Đập/đâm | Vũ khí cán dài (hai tay) | polearm | Chỉ catalogue |
| 16 | Flail- Chùy xích | Đập | Vũ khí xích | chain | Chỉ catalogue |
| 17 | Côn nhị khúc | Đập | Vũ khí xích | chain | Chỉ catalogue |
| 18 | Trường côn-Côn | Đập | Vũ khí cán dài (hai tay) | polearm | Chỉ catalogue |
| 19 | Búa chiến cán dài | Đập | Vũ khí cán dài (hai tay) | polearm | Chỉ catalogue |
| 20 | Chùy 2 tay | Đập | Vũ khí 2 tay | two_hand_heavy | Chỉ catalogue |
| 21 | Arming Sword | Chém | Vũ khí 1 tay | one_hand_slash | Active |
| 22 | Sabre – Kiếm cong | Chém | Vũ khí 1 tay | one_hand_slash | Active |
| 23 | Scimitar | Chém | Vũ khí 1 tay | one_hand_slash | Chỉ catalogue |
| 24 | Falchion- - Đao | Chém | Vũ khí 1 tay | one_hand_slash | Chỉ catalogue |
| 25 | Katana-Taichi | Chém | Vũ khí 1 tay | one_hand_slash | Active |
| 26 | Đoản kiếm | Chém | Vũ khí 1 tay | one_hand_slash | Chỉ catalogue |
| 27 | Machete | Chém | Vũ khí 1 tay | one_hand_slash | Chỉ catalogue |
| 28 | Rìu chiến- Battle Axe | Chém | Vũ khí 1 tay | one_hand_slash | Active |
| 29 | Rìu | Chém | Vũ khí 1 tay | one_hand_slash | Active |
| 30 | Mâu | Chém | Vũ khí cán dài (hai tay) | polearm | Chỉ catalogue |
| 31 | Rìu cán dài-Bardiche | Chém | Vũ khí cán dài (hai tay) | polearm | Active |
| 32 | Longsword | Chém | Vũ khí 2 tay | two_hand_heavy | Active |
| 33 | Greatsword | Chém | Vũ khí 2 tay | two_hand_heavy | Active |
| 34 | Đại đao | Chém | Vũ khí 2 tay | two_hand_heavy | Chỉ catalogue |
| 35 | Nodachi / Ōdachi | Chém | Vũ khí 2 tay | two_hand_heavy | Chỉ catalogue |
| 36 | Cung | Cung | Cung 2 tay | ranged | Chỉ catalogue |
| 37 | Nỏ | Cung | Cung 2 tay | ranged | Chỉ catalogue |
| 38 | Quyền trượng | Phép | ∅ (trống) | magic | Chỉ catalogue |
| 39 | Đũa phép | Phép | ∅ (trống) | magic | Chỉ catalogue |
| 40 | Bùa chú/ Vật tổ | Phép | ∅ (trống) | magic | Chỉ catalogue |
| 41 | Cầu phép | Phép | ∅ (trống) | magic | Chỉ catalogue |
| 42 | Tinh Linh | Phép | ∅ (trống) | magic | Chỉ catalogue |
| 43 | Sách phép | Phép | ∅ (trống) | magic | Chỉ catalogue |

**OPEN_REVIEW:** Pollaxe nguồn vẫn là 1 tay, damage Đập/đâm; Katana-Taichi vẫn là 1 tay; sáu pháp khí không có nhóm animation nguồn. Không tự sửa thành cách phân loại khác. Toàn bộ family/grip/damageStyle đề xuất và cờ eligible chưa phải dữ liệu nguồn đã chốt.

## So sánh ba build

Dummy thân 60 HP đứng yên, không phản công; đặt sẵn trong tầm, dt 0.01s, dùng windup/interval thật. Thời gian là mô phỏng tính từ bước đầu của fixture:

| Build | HP thân / Khiên | Damage base + bonus | Interval / windup | Tầm / tốc | Giá / CD | Hit hạ HP60 / thời điểm |
| --- | --- | --- | --- | --- | --- | --- |
| Rìu + Khiên | 60 / 30 | 26 + 0 = 26 | 1.2 / 0.6s | 28 / 85 | 45 / 3.2s | 3 hit: 0.61 / 1.81 / 3.01s |
| Rìu cầm hai tay | 60 / 0 | 26 + 8 = 34 | 1.2 / 0.6s | 28 / 85 | 35 / 3.2s | 2 hit: 0.61 / 1.81s |
| Greatsword vốn 2H | 60 / 0 | 34 + 0 = 34 | 1.6 / 0.75s | 42 / 85 | 45 / 4s | 2 hit: 0.76 / 2.36s |

Đây là so sánh damage/hit threshold, chưa phải kết luận build nào cân bằng hoặc mạnh hơn trong mọi tình huống.

Duel phản công thật, đặt hai quân cách 28 và không có tiếp viện, dt 0.01s, không sửa HP/damage/tốc. Cùng chết ở đây là hai quân chết trong cùng snapshot; trận vẫn `running`, hai nhà 240 HP, **không phải kết quả Hòa**:

| Đối đầu | Kết quả | Thời gian mô phỏng |
| --- | --- | --- |
| Rìu + Khiên vs Rìu cầm hai tay | Cả hai cùng chết; Khiên đã hấp thụ đủ 30 damage | 3.01s |
| Rìu + Khiên vs Greatsword | Rìu + Khiên thắng, thân còn 22 HP, barrier 0 | 3.01s |
| Rìu cầm hai tay vs Greatsword | Rìu hai tay thắng, thân còn 26 HP | 1.81s |

144 duel biến thể = 3 cặp × 6 lịch dt × đổi phe/ID/thứ tự mảng. Trong từng lịch dt, trace/HP/thời gian khớp khi phản chiếu và đảo ID/mảng. Không suy ra cùng mốc thời gian giữa mọi FPS hoặc kết quả từ khoảng xuất phát khác.

Model full match dùng slot 2 custom không Khiên, bốn slot preset còn lại; Bot hoạt động, không khóa AI hoặc sửa tiền/CD. “Một quân” mua đúng một custom ở đầu rồi dừng. “Đội hình” thử vòng mua slot **3→5→2→1→4** mỗi 0.1s nếu đủ điều kiện, dt 0.02s. Đây là 30 playtest hữu hạn, không phải win rate thống kê hoặc phép đo cân bằng:

| Vũ khí custom | Một quân: kết quả / giây | Đội hình: kết quả / giây |
| --- | --- | --- |
| Spear | Thua / 14.42 | Thắng / 35.44 |
| Estoc | Thua / 13.56 | Thua / 24.56 |
| Ji | Thua / 15.36 | Thắng / 21.02 |
| Stiletto | Thua / 13.56 | Thua / 27.06 |
| Club | Thua / 13.80 | Thua / 28.68 |
| Mace | Thua / 13.78 | Thắng / 46.20 |
| War Hammer | Thua / 17.64 | Thắng / 23.74 |
| Arming Sword | Thua / 13.46 | Thắng / 47.60 |
| Sabre | Thua / 13.58 | Thua / 24.54 |
| Katana-Taichi | Thua / 13.56 | Thua / 33.56 |
| Battle Axe | Thua / 16.66 | Thắng / 20.50 |
| Rìu | Thua / 16.50 | Thua / 28.98 |
| Bardiche | Thua / 16.02 | Thắng / 35.66 |
| Longsword | Thua / 15.28 | Thắng / 50.04 |
| Greatsword | Thua / 14.96 | Thắng / 23.74 |

## Kiểm chứng

- `npm run build`: PASS TypeScript + Vite; HTML 9.46 kB, CSS 8.55 kB, JS 1,239.33 kB (gzip 330.28 kB), vẫn cảnh báo chunk Phaser >500 kB. Không thay dependency hoặc cơ chế đóng gói để tắt cảnh báo.
- Regression R2A targeted đầu: **23/23 PASS**, gồm catalogue/validator/compiler/barrier, 1.200 duel đối xứng (6 lịch dt × đổi phe/ID/mảng × 25 biến thể vũ khí/tay phụ), 30 full model matches, blockers và trace default.
- Dấu trace default R1D từ source trước khi sửa: `9306f6dc4c6e5ee39645ea463e3cbf108f6bb9353a484fb08a6e4c8234c84b85`; bốn lịch mua quân thật gồm Búa/AI/Vàng/CD chạy toàn bộ state mỗi bước, khớp sau tích hợp.
- Full suite trước patch allowlist: **102/102 PASS** trong 233.77s; 61 test R1E/cũ nguyên vẹn + 41 mới R2A = 81 model/playtest + 21 browser.
- Full suite sau patch, 2 workers: **101/102 PASS** trong 283.54s, test browser R1D `production subpath: selected Warhammer formation fights a continuing bot, wins and preserves deck on restart` kỳ vọng `won` nhưng nhận `lost`. Không có lỗi runtime/network được báo ở các test đã pass; 41 test R2A đều pass. Test cũ và source gameplay giữ nguyên. Chạy riêng test này với 1 worker **PASS** (test 53.3s, tổng 57.3s).
- **Full suite cuối sau patch: 102/102 PASS với 1 worker, 386.60s**, 0 skip / 0 failures / reporter flaky 0 trong lượt này. Lệnh: `npm run test:browser -- --workers=1 --reporter=list,json` với Chrome. Bài Búa R1D pass 53.5s. **Không coi lượt cuối pass là xóa được finding gián đoạn ở lượt hai workers.** Không bật retry, không sửa config, không cắt test.
- Browser: cả 15 active chọn từ Xưởng, thay đúng một trong năm slot, preview chỉ số, mua bằng Vàng/CD thật, chống double-click trong CD, thấy cùng build ở Bot, chạy tới kết quả, replay/chuẩn bị. Đội hình Greatsword custom thắng Bot thật; mặc định Búa R1D thắng/replay trong lượt cuối. Mobile 390×844 có keyboard/touch, Trống/Khiên, khóa Khiên cho 2H, chuyển custom slot, trả preset, không horizontal overflow. Console/page/network/external-request checks rỗng trong lượt cuối; đã xem screenshot desktop và mobile. Đây là Chrome viewport/touch emulation, chưa phải QA Android/iOS thật.
- `npm audit --audit-level=low`: **0 vulnerabilities** (info/low/moderate/high/critical đều 0).
- Gate ban đầu HOLD đúng bốn file mới chưa có trong allowlist. Sau khi xem yêu cầu cụ thể, **Owner đã cho phép thêm đúng bốn đường dẫn**, không wildcard và không thay bất kỳ rule. Đã báo nguyên diff, `git apply --check` PASS rồi áp dụng local `.codex/r2a-security-allowlist-proposal.patch`.
- Đối chiếu toàn bộ scanner sau khi loại đúng hai dòng allowlist bổ sung: **khớp nguyên vẹn bản trước sửa**, mọi kiểm tra secrets/credentials/.env/prompts/source map/artifact và kiểm tra nội dung giữ nguyên. Hash SHA-256 policy gốc chuẩn hóa LF: `1cdbcc284b3e6cebd75306b778f6aff23b84f15ea79811b9d199a22e6b56a684`. Bốn file mới chịu quét nội dung bình thường, không ngoại lệ. **Gate chính thức sau patch: PASS_HEURISTIC, 26 candidate / 22 tracked / 0 staged / 0 tracked prompts / 17 ignore checks / findings rỗng.**

Scanner là heuristic tên/nội dung/history-path, không phải bảo đảm tuyệt đối không có secret/PII. Policy đề xuất vẫn quét nội dung cả bốn file mới và không bỏ bất kỳ kiểm tra nào.

Các lỗi kiểm thử đã xử lý: lần full đầu có 16 lỗi assertion mới vì matcher `toBeDisabled` không nhận `fieldset`/`option` dù thuộc tính native đã bật; chuyển sang kiểm tra native `disabled` và xác nhận select/button con thực sự bị khóa. Lần full thứ hai có hai lỗi ở cửa sổ đọc Vàng giữa nhiều thao tác trình duyệt khi thu nhập vẫn chạy; phép đo mới ghi số dư trước/sau trong cùng sự kiện click thật và yêu cầu chênh lệch **đúng giá mua**. Không bỏ test hoặc nới số Vàng cho qua, không sửa gameplay và không đụng 61 test cũ để giải quyết các lỗi này.

**Finding còn mở:** scripted victory browser R1D không ổn định ở lần full sau patch với hai workers. Mẫu trước patch đã pass cùng test và golden model default vẫn khớp; chưa có bằng chứng thay rule combat. Có thể liên quan lịch dt/input hoặc tải browser, nhưng **chưa chứng minh nguyên nhân**. Không tự sửa test, thay cadence, buff quân hoặc tăng lợi thế Player để ép thắng. Trace/screenshot lỗi được giữ riêng ở `.codex/r2a-r1d-browser-failure-trace.zip` và `.codex/r2a-r1d-browser-failure.png`; kết quả full lỗi ở `.codex/r2a-full-tests-post-policy-first.json`, recheck riêng ở `.codex/r2a-r1d-browser-recheck.json`. Owner cần biết finding này khi đánh giá chất lượng.

Trace lỗi có 673 lần Evaluate để thử mua quân; một lệnh chờ 100ms thực tế dài 220.68ms. Thời gian giữa các thao tác browser không cố định ở đúng 100ms; số đo này chưa cô lập được nguyên nhân trận thua.

Output build/log/JSON/screenshot nằm local ở thư mục ignore `dist/`, `.codex/`, `test-results/`; không nằm trong manifest nguồn công khai. Browser chạy Chrome production preview `/laneforge-game/`, không dùng dev-only API để thao tác trận.

## OPEN, giới hạn và phạm vi chưa làm

Owner cần xét số liệu 15 món, cờ eligible (nhất là Katana-Taichi), barrier áp dụng mọi đòn vật lý/AOE và không phân hướng, chênh lệch tốc/giá/HP giữa lõi demo với preset, polearm custom không kite, custom War Hammer không AOE, heuristic Bot dùng score melee 5. Các điểm này đã được ghi nhãn thử nghiệm, không tự nhận là số chính thức. Không suy diễn toàn bộ note nguồn thành cơ chế.

Chưa làm 43 active, dual wield, 72 thẻ/support/passive engine, định nghĩa DEF/MDEF/STR-KG, nón/giáp/phụ kiện, projectile, cung/nỏ/phép/heal/thú cưỡi/vũ khí xích/vật phẩm đặc biệt, tài khoản/backend/PvP/app điện thoại. Mobile browser QA không thay kiểm thử thiết bị thật/pin/App Store. Visual là placeholder theo family, quân cùng phe vẫn có thể chồng và che nhãn theo R1D; không tự đổi luật stack. Mẫu dt/input hữu hạn không bảo đảm mọi trận có cùng kết quả giữa mọi FPS.

## Manifest để Owner duyệt

**Hai file modified có sẵn từ R1E, bảo toàn nguyên byte (không phải sửa mới R2A):**

```text
docs/GAME_DESIGN.md
tests/smoke.spec.ts
```

**R2A sửa 7 file có sẵn:**

```text
docs/ROADMAP.md
index.html
src/game/Battle.ts
src/game/BattleScene.ts
src/main.ts
src/style.css
scripts/security-gate.mjs
```

**R2A thêm 4 file:**

```text
docs/R2A_REVIEW.md
src/game/UnitBuild.ts
src/game/WeaponCatalog.ts
tests/modular.spec.ts
```

**Không xóa file.** Không sửa `package.json`, lockfile, workflow, Pages hoặc dependency. Security policy chỉ bổ sung đúng bốn đường dẫn đã được Owner duyệt, giữ nguyên toàn bộ rule. Manifest toàn worktree hiện gồm 9 modified (2 R1E + 7 R2A), 4 untracked mới; index **0 staged**. `docs/ROADMAP.md` giữ lịch sử các mốc/đề xuất cũ và thêm hướng Modular với nhãn trạng thái rõ ràng.

Manifest máy đọc được local: `.codex/r2a-approval-manifest.json`, gồm SHA-256 của cả 13 file, hashes build, thống kê test, finding browser và kết quả đối chiếu policy. Evidence không đưa vào manifest nguồn public: `.codex/r2a-*.json/log`, screenshot/trace, `test-results/`, `dist/` đều là output local/ignored. Baseline HEAD/origin/main/remote main giữ `b4ec9fc1d05dee40244e38e281c20de04776e7bb`.

**Dừng chờ Owner duyệt manifest/kết quả cuối. Quyền sửa allowlist local không cấp quyền phát hành. NO STAGE / NO COMMIT / NO PUSH / NO DEPLOY.**
