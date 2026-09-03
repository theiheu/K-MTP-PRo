import json
import re
import csv
import sqlite3
import io
import os
from collections import defaultdict

transcript_path = r"C:\Users\PC\.gemini\antigravity\brain\c418855f-0ff6-48f7-a4d1-811eac39ed7d\.system_generated\logs\transcript_full.jsonl"

raw_text = ""
if os.path.exists(transcript_path):
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get('type') == 'USER_INPUT':
                    content = data.get('content', '')
                    if 'MÃ VẬT TƯ' in content and 'TÊN VẬT TƯ' in content:
                        raw_text = content
            except Exception:
                pass

if not raw_text:
    print("Error: Could not find raw text in transcript.")
    exit(1)

lines = raw_text.split('\n')
table_lines = []
in_table = False
for line in lines:
    if line.startswith('STT') and 'MÃ VẬT TƯ' in line:
        in_table = True
    if in_table:
        if line.startswith('Từ dữ liệu trên') or line.startswith('</USER_REQUEST>'):
            break
        table_lines.append(line)

raw_data = "\n".join(table_lines).strip()

rules = [
    ("Vòng bi - Bạc đạn", [r'\bbạc đạn\b', r'\bvòng bi\b', r'\bbạc mắt trâu\b']),
    ("Dây curoa - Nhông xích - Truyền động", [r'\bdây curoa\b', r'\bbuli\b', r'\bbuly\b', r'\bnhông\b', r'\bxích\b', r'\bmắt xích\b', r'\bbánh răng\b', r'\bcốt\b', r'\bcon lăn\b', r'\bláp\b', r'\btrục\b', r'\bkhớp nối\b']),
    ("Phụ tùng Xe - Máy móc", [r'\bxe xúc\b', r'\bxe ben\b', r'\bxe rùa\b', r'\bxe tải\b', r'\blọc gió\b', r'\blọc nhớt\b', r'\blọc dầu\b', r'\bkét nước\b', r'\bbô xe\b', r'\bống bô\b', r'\byếm xe\b', r'\bruột xe\b', r'\blốp xe\b', r'\bmâm xe\b', r'\bắc xe\b', r'\bbơm tay\b', r'\bgương xe\b', r'\bkính hậu\b', r'\bbánh xe\b', r'\bcàng xoay\b', r'\bcàng chết\b', r'\blam gầu\b', r'\bbạc xe\b', r'\bbố thắng\b', r'\bmá phanh\b', r'\bphanh\b', r'\bđề máy\b', r'\bnhíp\b', r'\bbình hơi\b', r'\btắc kê\b']),
    ("Vật tư Điện - Điện tử", [r'\bcb\b', r'\bdây điện\b', r'\bcos\b', r'\bbóng đèn\b', r'\bđèn\b', r'\bcông tắc\b', r'\brờ le\b', r'\brơ le\b', r'\bkhởi\b', r'\btủ điện\b', r'\bđồng hồ đo\b', r'\bđồng hồ điện\b', r'\bđồng hồ nhiệt\b', r'\btụ\b', r'\btụ điện\b', r'\bổ cắm\b', r'\bphích cắm\b', r'\btimer\b', r'\bdomino\b', r'\bmoter\b', r'\bmotor\b', r'\bcầu dao\b', r'\bdây dò nhiệt\b', r'\bcòi báo\b', r'\bbo\b', r'\brcbo\b', r'\bbình ắc quy\b', r'\bsạc\b', r'\bbiến áp\b', r'\bcáp\b', r'\bquạt\b', r'\bheater\b', r'\bcảm biến\b', r'\bđế rơ le\b', r'\btivi\b', r'\bpin\b', r'\bcánh quạt\b']),
    ("Thiết bị Chăn nuôi - Nông nghiệp", [r'\bcám\b', r'\bmáng\b', r'\bnúm gà\b', r'\bcửa lồng\b', r'\blò xo\b', r'\bgiấy úm\b', r'\bghim bắn\b', r'\bchuột\b', r'\bmáy đập bắp\b', r'\bmáy đảo phân\b', r'\bmáy trộn\b', r'\bvĩ giấy\b', r'\btrại\b', r'\blưới\b', r'\bsát trùng người\b', r'\bdây gầu tải\b', r'\btúi lọc bụi\b', r'\bnhiệt kế\b', r'\bmiếng chặn phân\b', r'\btấm giàn lạnh\b', r'\bmen\b', r'\benviclean\b']),
    ("Vật tư Hàn - Cắt - Gia công", [r'\bhàn\b', r'\bplasma\b', r'\bgió đá\b', r'\bđá cắt\b', r'\bđá mài\b', r'\bbéc cắt\b', r'\bque hàn\b', r'\bdây hàn\b', r'\bkìm hàn\b', r'\bkính đen\b', r'\bkính trắng\b', r'\bco2\b', r'\boxy\b', r'\bsáp hàn\b', r'\bmũi khoan\b', r'\bmũi đục\b', r'\bmáy cắt\b', r'\bmáy mài\b', r'\bmáy doa\b', r'\bmáy hàn\b', r'\bđá\b', r'\bkhí\b']),
    ("Công cụ - Dụng cụ - Bảo hộ", [r'\bcân\b', r'\bkìm\b', r'\bmỏ lết\b', r'\bchìa khóa\b', r'\blục giác\b', r'\bsúng\b', r'\bchổi\b', r'\bbao tay\b', r'\bgiẻ lau\b', r'\bủng\b', r'\báo mưa\b', r'\bthước\b', r'\bđầu điếu\b', r'\bcảo\b', r'\bđội\b', r'\bbình xịt\b', r'\bgăng tay\b', r'\bkính\b', r'\bkéo\b', r'\btay bơm\b', r'\bmáy may bao\b', r'\bnồi cơm\b', r'\bống thuỷ\b', r'\bxi lanh\b', r'\bđồng hồ\b', r'\bdao\b', r'\bxe nâng\b', r'\bbơm mỡ\b']),
    ("Vật tư Nước - Khí nén", [r'\bống nước\b', r'\bco\b', r'\blơi\b', r'\bt nước\b', r'\bvan\b', r'\blúp pê\b', r'\blúp bê\b', r'\brt\b', r'\brn\b', r'\brắc co\b', r'\btê\b', r'\bphao\b', r'\bbơm\b', r'\bbồn nước\b', r'\bvòi\b', r'\bbéc phun\b', r'\bbéc\b', r'\bdây mềm\b', r'\bống mềm\b', r'\bdây hút\b', r'\bdây xả\b', r'\blọc rác\b', r'\bbộ chia hơi\b', r'\bmáy nén\b', r'\bđĩa khí\b', r'\bcóc xả hơi\b', r'\bống\b']),
    ("Kim khí - Bulong - Ốc vít", [r'\bbulong\b', r'\bốc\b', r'\blong đền\b', r'\btán\b', r'\bvít\b', r'\bty ren\b', r'\bthanh ren\b', r'\btăng đơ\b', r'\bcáp inox\b', r'\bcổ dê\b', r'\bkẽm\b', r'\bđinh\b', r'\briver\b', r'\bbản lề\b', r'\bray nhôm\b', r'\bpát\b', r'\bke\b', r'\bkhóa\b', r'\bcầu chắn rác\b', r'\bla nhôm\b', r'\bnẹp\b']),
    ("Dầu mỡ - Hóa chất - Sơn", [r'\bdầu\b', r'\bnhớt\b', r'\bmỡ\b', r'\bkeo\b', r'\bsơn\b', r'\bsát trùng\b', r'\bthuốc\b', r'\bdung môi\b', r'\bhóa chất\b', r'\bsilicon\b', r'\bsikadur\b', r'\bchai\b', r'\bcan\b']),
    ("Vật tư Đóng gói - Bạt - Dây", [r'\bbao\b', r'\bchỉ\b', r'\bbăng keo\b', r'\bdây dù\b', r'\bdây rút\b', r'\bbạt\b', r'\bni lông\b', r'\bdây trắng\b', r'\bdây vàng\b', r'\bdây chữa cháy\b']),
]

f = io.StringIO(raw_data)
reader = csv.reader(f, delimiter='\t')
header = next(reader)
if header[-1].strip() == '': header.pop()
header.append("DANH MỤC")

rows = []
summary = defaultdict(list)
for row in reader:
    if not row or len(row) < 3: continue
    ten_vt = row[2] if len(row) > 2 else ""
    
    cat_found = "Vật tư Khác"
    ten_lower = ten_vt.lower()
    for cat, patterns in rules:
        for p in patterns:
            if re.search(p, ten_lower):
                cat_found = cat
                break
        if cat_found != "Vật tư Khác":
            break
            
    clean_row = [str(x).replace('\n', ' ').strip() for x in row[:4]]
    while len(clean_row) < 4: clean_row.append("")
    clean_row.append(cat_found)
    rows.append(clean_row)
    summary[cat_found].append(clean_row)

base_dir = r"C:\Users\PC\Desktop\K-MTP-PRo"
csv_path = os.path.join(base_dir, "DanhSachVatTu.csv")
db_path = os.path.join(base_dir, "QuanLyVatTu.db")

with open(csv_path, 'w', encoding='utf-8-sig', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(header)
    writer.writerows(rows)

conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute('''CREATE TABLE IF NOT EXISTS VatTu (
    STT INTEGER,
    MaVatTu TEXT,
    TenVatTu TEXT,
    DVT TEXT,
    DanhMuc TEXT
)''')
cur.execute('DELETE FROM VatTu')
cur.executemany('INSERT INTO VatTu VALUES (?, ?, ?, ?, ?)', rows)
conn.commit()
conn.close()

print(f"Thành công! Đã xử lý {len(rows)} vật tư.")
print(f"Đã tạo file CSV: {csv_path}")
print(f"Đã tạo file Database: {db_path}\n")
print("[SUMMARY]")
for cat, items in sorted(summary.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"- **{cat}**: {len(items)} vật tư")
