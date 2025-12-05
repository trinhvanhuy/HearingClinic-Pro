# Import Clients từ Excel Files

Script này cho phép import khách hàng từ các file Excel trong nhiều folders, với khả năng clear database trước khi import và kiểm tra trùng lặp.

## Tính năng

- ✅ **Clear toàn bộ clients** trước khi import (optional)
- ✅ **Import từ nhiều folders** cùng lúc
- ✅ **Đệ quy tìm file Excel** trong tất cả subfolders
- ✅ **Kiểm tra trùng lặp** dựa trên:
  - Tên (fullName) - chuẩn hóa, không phân biệt hoa thường và dấu
  - Ngày sinh (dateOfBirth) - so sánh chính xác theo ngày
  - Số điện thoại (phone) - chuẩn hóa, chỉ giữ số
- ✅ **Hỗ trợ 2 format Excel**:
  - Format 1: Mỗi sheet = một client (key-value hoặc header-row)
  - Format 2: Mỗi row = một client (header-row với nhiều rows)
- ✅ **Tự động parse** các trường dữ liệu phổ biến

## Cài đặt

Đảm bảo các dependencies đã được cài đặt:

```bash
cd backend
npm install
```

## Cách sử dụng

### 1. Clear DB và Import từ nhiều folders

```bash
cd backend
npm run import-clients -- --clear ./@_NL ./@_TR
```

### 2. Import mà không clear DB (kiểm tra duplicate với data hiện có)

```bash
cd backend
npm run import-clients ./@_NL ./@_TR
```

### 3. Sử dụng đường dẫn tuyệt đối

```bash
cd backend
npm run import-clients -- --clear /path/to/@_NL /path/to/@_TR
```

### 4. Import từ một folder duy nhất

```bash
cd backend
npm run import-clients ./@_NL
```

## Cấu trúc File Excel

### Format 1: Mỗi Sheet = Một Client

**Key-Value Format:**
```
| Key              | Value                |
|------------------|----------------------|
| Họ tên           | Nguyễn Văn A         |
| Ngày sinh        | 15/01/1990           |
| Số điện thoại    | 0912345678           |
| Email            | nguyenvana@email.com  |
```

**Header-Row Format (2 rows):**
```
| Họ tên        | Ngày sinh  | Số điện thoại | Email              |
|---------------|------------|---------------|--------------------|
| Nguyễn Văn A  | 15/01/1990 | 0912345678    | nguyenvana@email.com|
```

### Format 2: Mỗi Row = Một Client

**Multiple Rows Format:**
```
| Họ tên        | Ngày sinh  | Số điện thoại | Email              |
|---------------|------------|---------------|--------------------|
| Nguyễn Văn A  | 15/01/1990 | 0912345678    | nguyenvana@email.com|
| Trần Thị B    | 20/03/1985 | 0987654321    | tranthib@email.com |
```

## Trường dữ liệu được hỗ trợ

Script sẽ tự động nhận diện các trường sau (không phân biệt hoa thường, có dấu/không dấu):

| Trường         | Từ khóa tìm kiếm                                | Bắt buộc |
|----------------|-------------------------------------------------|----------|
| Họ tên         | "tên đầy đủ", "ho ten", "fullname", "name"     | ✅ Có    |
| Họ             | "họ", "ho", "lastname", "last name"            | ❌ Không |
| Tên            | "tên", "ten", "firstname", "first name"        | ❌ Không |
| Ngày sinh      | "ngày sinh", "ngay sinh", "dob", "birth"       | ❌ Không |
| Số điện thoại  | "số điện thoại", "phone", "sdt", "sđt", "tel"  | ❌ Không |
| Email          | "email", "mail", "e-mail"                      | ❌ Không |
| Giới tính      | "giới tính", "gioi tinh", "gender", "sex"      | ❌ Không |
| Địa chỉ        | "địa chỉ", "dia chi", "address"                | ❌ Không |
| Ghi chú        | "ghi chú", "ghi chu", "note", "notes"          | ❌ Không |

## Kiểm tra Trùng lặp

Một client được coi là trùng lặp nếu **CẢ 3** điều kiện sau đều đúng:

1. **Tên giống nhau** (sau khi chuẩn hóa: lowercase, bỏ dấu, normalize whitespace)
2. **Ngày sinh giống nhau** (cùng ngày, tháng, năm)
3. **Số điện thoại giống nhau** (cả 2 đều không có, hoặc cùng số sau khi chuẩn hóa)

## Ví dụ Output

```
🚀 Starting import process...

🗑️  Starting to clear all clients from database...
   Deleted 150 clients...
✅ Successfully deleted 150 clients from database.

📦 Loading existing clients for duplicate checking...
✅ Loaded 0 existing clients into cache.

📂 Scanning folder: ./@_NL
   Found 25 Excel file(s)
📂 Scanning folder: ./@_TR
   Found 30 Excel file(s)

📋 Total 55 Excel file(s) to process:

   1. ./@_NL/file1.xlsx
   2. ./@_NL/file2.xlsx
   ...

📖 Processing file: file1.xlsx
   Found 1 sheet(s): Sheet1
   Processing sheet "Sheet1" as single client...
   ✅ Sheet "Sheet1": Created - Nguyễn Văn A (0912345678)

...

============================================================
📊 IMPORT SUMMARY
============================================================
   ✅ Created: 1250 clients
   ⏭️  Skipped: 45 clients (duplicates or missing data)
   ❌ Errors: 0 files/sheets/rows
============================================================

✨ Import process completed!
```

## Lưu ý

1. **Backup database** trước khi chạy với option `--clear`
2. Script sẽ **tự động skip** các client trùng lặp
3. Script hỗ trợ **cả .xls và .xlsx**
4. Files được xử lý theo thứ tự **alphabetical**
5. Mỗi file Excel có thể có **nhiều sheets**, mỗi sheet được xử lý độc lập

## Troubleshooting

### Lỗi: "Directory not found"
- Kiểm tra lại đường dẫn folder
- Sử dụng đường dẫn tuyệt đối nếu cần

### Lỗi: "No Excel files found"
- Kiểm tra xem folder có chứa file .xlsx hoặc .xls không
- Kiểm tra quyền đọc file

### Client bị skip: "Duplicate found"
- Client này đã tồn tại trong database (trùng tên + ngày sinh + số điện thoại)
- Đây là hành vi mong đợi để tránh duplicate

### Client bị skip: "No name found"
- File Excel không có trường tên hoặc tên bị rỗng
- Kiểm tra lại cấu trúc file Excel

