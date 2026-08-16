# Kế hoạch triển khai Roadmap Week 2

## Mục tiêu

Mở rộng ứng dụng từ roadmap Week 1 hardcoded thành roadmap nhiều tuần, bổ sung
7 session của Week 2 và giữ nguyên toàn bộ progress hiện tại của người dùng.

Week 2 gồm:

| Ngày | Chủ đề | Mục tiêu | Bài nên làm |
| --- | --- | --- | --- |
| Day 1 | DFS / BFS cơ bản | Biết traversal trên grid và graph | Number of Islands, Max Area of Island, Flood Fill, Rotting Oranges |
| Day 2 | Graph | Adjacency list, visited, component, cycle | Clone Graph, Find if Path Exists, Course Schedule, Number of Provinces |
| Day 3 | Heap / Priority Queue | Top K, min/max theo thời gian, scheduling | Kth Largest Element, Top K Frequent, Last Stone Weight, K Closest Points |
| Day 4 | Greedy | Nhận diện “chọn local tốt nhất” | Jump Game, Gas Station, Partition Labels, Non-overlapping Intervals |
| Day 5 | Simulation + State | Mô phỏng đúng state, coordinate, direction | Spiral Matrix, Robot Simulation, Game of Life hoặc bài PCCP tương đương |
| Day 6 | Backtracking | Decision tree, choose → recurse → undo | Subsets, Permutations, Combination Sum, Letter Combinations |
| Day 7 | Mixed + Mock | Ghép pattern và luyện timing PCCP | 4–5 bài mixed, giới hạn thời gian |

## 1. Chuẩn hóa data model nhiều tuần

Mở rộng document Supabase:

```json
{
  "checklists": {
    "week1": [],
    "week2": []
  },
  "progress": {
    "checked": {},
    "notes": {},
    "sampleCodes": {},
    "errors": [],
    "courseStartDate": ""
  }
}
```

Đổi ID task từ:

```text
day-1-theory-0
```

thành:

```text
week-1-day-1-theory-0
week-2-day-1-theory-0
```

Việc đổi ID cần migration tương thích ngược để progress Week 1 hiện có không
bị mất.

## 2. Xây dựng dataset Week 2

Mỗi ngày sử dụng cùng cấu trúc với Week 1:

```js
{
  day,
  title,
  topic,
  recognition,
  code,
  samples,
  theory,
  practice,
  error,
  mock
}
```

Mỗi session cần có:

- 3–4 mục lý thuyết.
- 4 bài chính theo roadmap.
- Python quick reference.
- 3–4 sample code có thể chỉnh sửa.
- Checklist error review.
- Recognition hints để nhận diện pattern.

Nội dung chi tiết:

### Day 1 — DFS / BFS cơ bản

- Grid traversal với bốn hướng.
- DFS bằng recursion hoặc stack.
- BFS bằng `collections.deque`.
- `visited` riêng và kỹ thuật đánh dấu trực tiếp trên grid.
- Đếm connected component và tính diện tích component.

### Day 2 — Graph

- Xây adjacency list.
- Directed và undirected graph.
- Connected component.
- Cycle detection.
- Topological ordering cho Course Schedule.

### Day 3 — Heap / Priority Queue

- Python `heapq` là min-heap.
- Mô phỏng max-heap bằng giá trị âm.
- Giữ heap kích thước K.
- Top K và scheduling theo thời gian hoặc độ ưu tiên.

### Day 4 — Greedy

- Nhận diện local optimal choice.
- Xác định invariant chứng minh lựa chọn greedy.
- Sort rồi chọn.
- Phân biệt greedy với dynamic programming.

### Day 5 — Simulation + State

- Biểu diễn state rõ ràng.
- Coordinate và direction vector.
- Kiểm soát boundary.
- Cập nhật đồng thời bằng bản sao hoặc state encoding.

### Day 6 — Backtracking

- Decision tree.
- Choose → recurse → undo.
- Phân biệt permutation và combination.
- Pruning khi state không thể tạo kết quả hợp lệ.

### Day 7 — Mixed + Mock

- 4–5 bài mixed có timer.
- Đặt mốc thời gian bỏ qua bài.
- Tự test edge case trước khi submit.
- Phân loại lỗi theo pattern, implementation, edge case và time management.

## 3. Refactor UI hỗ trợ nhiều tuần

Refactor `pccp_week1.html`:

- Thêm bộ chuyển Week 1 / Week 2.
- Render dữ liệu theo `activeWeek`.
- Header, progress bar và số task thay đổi theo tuần đang xem.
- Roadmap card Week 2 có thể mở thay vì chỉ hiển thị `QUEUED`.
- Nút “Tiếp tục học” mở đúng tuần và ngày theo lịch.
- Error Log dùng chung cho toàn khóa học.
- Error record bổ sung `week` và `day`.

Có thể giữ tên `pccp_week1.html` để không ảnh hưởng deployment. Về lâu dài nên
đổi thành `index.html`.

## 4. Mở rộng lịch học thành 14 session

Ngày bắt đầu khóa học được áp dụng cho toàn roadmap:

| Ngày theo lịch | Session |
| --- | --- |
| Start date | Week 1 — Day 1 |
| Start date + 6 | Week 1 — Day 7 |
| Start date + 7 | Week 2 — Day 1 |
| Start date + 13 | Week 2 — Day 7 |

Flatten danh sách session để tính lịch:

```js
[
  { week: 1, day: 1 },
  // ...
  { week: 2, day: 7 }
]
```

Thông báo:

- 08:00: nội dung session cố định hôm nay.
- 12:00: nhắc nếu session hôm nay chưa hoàn thành.
- 17:00: nhắc lại nếu vẫn chưa hoàn thành.
- Nhấn banner mở đúng week và day.

## 5. Cập nhật Supabase migration

Cập nhật `supabase_migration.sql`:

- Seed thêm `checklists.week2`.
- Thêm constraint xác nhận `week2` là JSON array.
- Không ghi đè progress hiện tại.
- Cung cấp update migration riêng cho database đã tồn tại.

Ví dụ:

```sql
update public.pccp_databases
set document = jsonb_set(
  document,
  '{checklists,week2}',
  '<week2-json>'::jsonb,
  true
)
where id = 'week1';
```

Có thể giữ document ID `week1` trong lần triển khai này để tránh thay đổi khóa
chính và backend. Việc đổi sang ID `roadmap` có thể thực hiện trong migration
riêng sau đó.

## 6. Migration progress Week 1

Frontend cần migration idempotent:

- `day-1-*` → `week-1-day-1-*`.
- Note key `1` → `week-1-day-1`.
- `day-1-sample-0` → `week-1-day-1-sample-0`.
- Giữ nguyên Error Log.
- Giữ nguyên `courseStartDate`.
- Không reset checklist Week 1.
- Reload nhiều lần không tạo key trùng.

## 7. Kiểm thử

- Week 1 giữ nguyên toàn bộ progress.
- Week 1 và Week 2 không dùng chung task ID.
- Chuyển tuần không làm mất trạng thái checklist.
- Edit sample code Week 2 tồn tại sau reload.
- Error Log hiển thị đúng ở cả hai tuần.
- Error record lưu đúng week và day.
- Start date + 7 mở đúng Week 2 Day 1.
- Reminder mở đúng week và day.
- Hoàn thành Week 2 Day 1 không ảnh hưởng Week 1 Day 1.
- Supabase đồng bộ được giữa hai trình duyệt.
- Giao diện mobile không vỡ khi thêm week selector.

## 8. Thứ tự triển khai

1. Commit bản sửa Error Log đang chờ push.
2. Chuẩn hóa ID và migration progress Week 1.
3. Thêm dataset Week 2.
4. Refactor renderer hỗ trợ nhiều tuần.
5. Thêm week selector và cập nhật progress UI.
6. Mở rộng lịch học và reminder thành 14 session.
7. Cập nhật SQL migration và README.
8. Kiểm thử đọc/ghi Supabase, reload và responsive mobile.
9. Commit và push lên `main`.

## Tiêu chí hoàn thành

- Roadmap có 14 session liên tục.
- Mỗi ngày theo lịch tương ứng đúng một session cố định.
- Week 1 và Week 2 dùng chung progress, sample editing, Error Log và reminder.
- Không mất dữ liệu Week 1 hiện có.
- Dữ liệu và giao diện đồng bộ đúng qua Supabase.
