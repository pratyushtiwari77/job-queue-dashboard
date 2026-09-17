# Mini Job Queue Dashboard

Submission for the React + NestJS assignment. Lets you create jobs, see them in a table, filter by status, move them through pending → running → completed/failed, and delete them.

## Tech stack
-Backend: NestJS,  SQLite
-Frontend: React 

## How to run it locally

### Backend
cd backend
npm install
npm run dev
On first run it creates a `db.sqlite` file next to it and creates the two tables it needs (`jobs` and `job_status_history`)

### Frontend
cd frontend
npm install
npm start

## API
| POST | /jobs | create a job (`title`, `type`)  always starts as `pending` |
| GET | /jobs | get all jobs, optional `?status=` filter |
| PATCH | /jobs/:id/status | change status |
| DELETE | /jobs/:id | delete a job |
| GET | /jobs/:id/history | see every status change for one job |


I used /jobs/:id/status specifically for changing the job status because status changes have their own rules. This prevents users from changing other fields like the job title or createdAt. After a job is created, only its status can be changed.


## The concurrency and error and logic handling problem
This is the part I spent the most time thinking through, so I'm answering each question directly.

Before touching the database, the service checks whether the requested new status is in the list for the job's *current* status. If not, `400 Bad Request`.

The real rule lives in one place, `jobs.service.ts`:
```ts
const ALLOWED_TRANSITIONS = {
  pending:   ['running'],
  running:   ['completed', 'failed'],
  completed: [],
  failed:    [],
};
```

### What happens if someone bypasses the React app and calls the API directly?

Nothing bad happens — the API is the one actually enforcing everything, the React app is just a UI on top of it.

- `PATCH /jobs/:id/status { "status": "completed" }` on a job that's still `pending` → `400 Bad Request`, `"Cannot change status from pending to completed"`.
- `PATCH /jobs/:id/status { "status": "bogus" }` → `400 Bad Request` from `class-validator`, before it even reaches my code, because `status` has to be one of the 4 allowed enum values.
- `POST /jobs { "title": "" }` → `400 Bad Request`, `"title should not be empty"`.
- `DELETE /jobs/some-fake-id` → `404 Not Found`.

So whatever request shape someone throws at the API, either `class-validator` rejects it before it reaches my logic, or my transition check rejects it before it touches the database. The frontend being bypassed doesn't open any hole.


### What happens when two requests arrive at nearly the same time?

Suppose the job is currently `pending` and two users try to change it to `running`:
User A: pending → running
User B: pending → running

The naive way to write this is:
```ts
const job = await findJob(id);          
if (job.status === 'pending') {          
  await updateJob(id, { status: 'running' });
}
```

The bug: between the read and the write there's a small window of time. If two requests both read the job while it's still `pending`, both will pass the `if`, and both would write.

What I did instead is make the check and the write **one single database statement**, instead of "read, then decide in JavaScript, then write":

```ts
const result = db
  .prepare('UPDATE jobs SET status = ? WHERE id = ? AND status = ?')
  .run(newStatus, id, job.status);

if (result.changes === 0) {
  throw new ConflictException('already updated by someone else');
}
```
This is a compare-and-swap: "change this row to `running`, but **only if** its status in the database, right now, at this exact instant, is still `pending`." A database only ever lets one write touch a given row at a time — that's the whole point of a database — so if two of these statements arrive close together, only one of them can actually match the `WHERE` clause and change the row. The other one changes 0 rows, and I turn that into `409 Conflict` instead of silently doing nothing or throwing a confusing error.

### How would you prevent an invalid or inconsistent state?

Combining everything above:
1. **`class-validator` on every request body** — wrong types, missing fields, or a `status` that isn't one of the 4 allowed values never even reaches the code.
2. **The transition whitelist** — a job can never skip a step (`pending` straight to `completed`) or go backwards (`completed` back to `running`), no matter who calls the API or how.
3. **The atomic conditional `UPDATE ... WHERE`** — two simultaneous requests can never both "win" and apply conflicting changes to the same job.
4. **Prepared statements with `?` placeholders everywhere** (never building SQL with string concatenation) — so none of this validation can be bypassed with a crafted `title` or `type` string doing SQL injection.
---

## Other edge cases I thought about / handled

- **Deleting a job twice in a row** (e.g. double-click, or two tabs both clicking delete) — I tested this: first `DELETE` returns `200 { deleted: true }`, second returns `404 Not Found`. No error, no crash, no "deleted -1 jobs".
- **Updating the status of a job that was just deleted** — `findOne` returns nothing, so it's a clean `404` instead of trying to update a row that isn't there.
- **Filtering by an invalid status** — `GET /jobs?status=banana` returns `400 Bad Request` instead of silently returning an empty list, so the frontend (or anyone calling the API) knows their filter was wrong rather than assuming there just happen to be no matching jobs.
- **Extra/unexpected fields in the request body** — `ValidationPipe({ whitelist: true })` strips anything not defined on the DTO, so someone can't `POST /jobs` with `{"title": "x", "type": "y", "status": "completed"}` and sneak a job directly into `completed` state.
- **Frontend network/API failures** — every API call in `api.js` throws with the backend's actual error message on a non-2xx response, and `App.js` catches that into either the page-level error state (for loading the list) or an `alert()` (for actions like create/update/delete), so the user always sees *something* went wrong instead of the UI just looking broken or frozen.



## Bonus: the one production-readiness improvement I added

**A `job_status_history` table that records every status change** (`fromStatus`, `toStatus`, `changedAt`), with a `GET /jobs/:id/history` endpoint to read it back.

 The most directly useful thing for this exact problem is concurrency and state consistency. If a job ever ends up somewhere unexpected, "who changed this and when" is usually the very first question we should ask while debugging, and without a history table the current status is all we'd ever have. It's also genuinely cheap: one extra table, one extra insert inside the same function that already does the status update, no new dependency, no architectural change.