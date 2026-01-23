## 2025-01-22
- Started work on dynamic router basename and Vercel rewrites.
- Planning to add App-level test that stubs BASE_URL per instructions.
## 2025-01-22
- Baseline tests passed before changes.
## 2025-01-22
- Added basename derived from import.meta.env.BASE_URL and updated Vercel rewrites to root.
## 2025-01-22
- Updated App tests to stub BASE_URL via vi.stubEnv and dynamic import.
## 2025-01-22
- Removed module reset to keep store instance stable across App tests.
