# School Fee Payment Management System

A beginner-friendly full-stack mini project using HTML, CSS, JavaScript, Express.js and MySQL.

## Files

- `db.sql` — creates the database and three tables.
- `server.js` — Express server and API routes.
- `public/index.html` — frontend page.
- `public/style.css` — page design.
- `public/script.js` — frontend logic and API calls.
- `package.json` — Node.js dependencies and start command.

## Setup

1. Install Node.js and MySQL.
2. Open MySQL Workbench or the MySQL command line.
3. Run the complete `db.sql` file.
4. Open `server.js` and replace `YOUR_MYSQL_PASSWORD` with your MySQL root password. If your MySQL root account has no password, use an empty string: `password: ""`.
5. Open a terminal in this project folder and run:

   ```bash
   npm install
   npm start
   ```

6. Open this address in your browser:

   `http://localhost:3000`

## Main features

- Add student details.
- Assign fees to students.
- View total, collected and pending fees.
- Record partial or full payments.
- Prevent a payment greater than the remaining balance.
- Generate and print an individual student's fee report.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/dashboard` | Dashboard totals |
| GET | `/api/students` | List students |
| POST | `/api/students` | Add a student |
| GET | `/api/fees` | List fee records and balances |
| POST | `/api/fees` | Assign a fee |
| POST | `/api/payments` | Record a payment |
| GET | `/api/reports/:studentId` | Generate a student fee report |

This is an academic mini-project starter. Add login/authentication and role permissions before using it with real student information.
