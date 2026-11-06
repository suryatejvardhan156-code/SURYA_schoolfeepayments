const money = value => "₹" + Number(value || 0).toFixed(2);
const message = document.getElementById("message");

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b42318" : "#16834b";
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
}

async function loadDashboard() {
    const d = await request("/api/dashboard");
    document.getElementById("totalStudents").textContent = d.total_students;
    document.getElementById("totalFees").textContent = money(d.total_fees);
    document.getElementById("collectedFees").textContent = money(d.collected_fees);
    document.getElementById("pendingFees").textContent = money(d.pending_fees);
}

async function loadStudents() {
    const students = await request("/api/students");
    document.getElementById("studentTable").innerHTML = students.map(s =>
        `<tr><td>${s.student_id}</td><td>${s.name}</td><td>${s.class}</td><td>${s.rollno}</td><td>${s.phone || ""}</td><td>${s.email || ""}</td></tr>`
    ).join("") || '<tr><td colspan="6">No students added</td></tr>';

    const options = '<option value="">Select student</option>' + students.map(s =>
        `<option value="${s.student_id}">${s.name} (ID: ${s.student_id})</option>`
    ).join("");
    document.getElementById("feeStudent").innerHTML = options;
    document.getElementById("reportStudent").innerHTML = options;
}

async function loadFees() {
    const fees = await request("/api/fees");
    document.getElementById("feeTable").innerHTML = fees.map(f => {
        const paid = Number(f.balance) <= 0;
        return `<tr>
          <td>${f.fee_id}</td><td>${f.name}</td><td>${f.class}</td>
          <td>${f.fee_type}</td><td>${money(f.total_amount)}</td>
          <td>${money(f.amount_paid)}</td><td>${money(f.balance)}</td>
          <td>${String(f.due_date).slice(0, 10)}</td>
          <td class="${paid ? "status-paid" : "status-pending"}">${paid ? "Paid" : "Pending"}</td>
        </tr>`;
    }).join("") || '<tr><td colspan="9">No fee records</td></tr>';

    document.getElementById("paymentFee").innerHTML =
        '<option value="">Select fee record</option>' + fees.filter(f => Number(f.balance) > 0).map(f =>
            `<option value="${f.fee_id}">Fee #${f.fee_id} - ${f.name} - Balance ${money(f.balance)}</option>`
        ).join("");
}

document.getElementById("studentForm").addEventListener("submit", async e => {
    e.preventDefault();
    try {
        const body = Object.fromEntries(new FormData(e.target));
        await request("/api/students", { method: "POST", body: JSON.stringify(body) });
        e.target.reset(); await refresh(); showMessage("Student added successfully.");
    } catch (err) { showMessage(err.message, true); }
});

document.getElementById("feeForm").addEventListener("submit", async e => {
    e.preventDefault();
    try {
        const body = Object.fromEntries(new FormData(e.target));
        await request("/api/fees", { method: "POST", body: JSON.stringify(body) });
        e.target.reset(); await refresh(); showMessage("Fee assigned successfully.");
    } catch (err) { showMessage(err.message, true); }
});

document.getElementById("paymentForm").addEventListener("submit", async e => {
    e.preventDefault();
    try {
        const body = Object.fromEntries(new FormData(e.target));
        await request("/api/payments", { method: "POST", body: JSON.stringify(body) });
        e.target.reset(); await refresh(); showMessage("Payment recorded successfully.");
    } catch (err) { showMessage(err.message, true); }
});

document.getElementById("reportButton").addEventListener("click", async () => {
    const id = document.getElementById("reportStudent").value;
    if (!id) return showMessage("Please select a student.", true);
    try {
        const rows = await request(`/api/reports/${id}`);
        const student = rows[0];
        const feeRows = rows.filter(r => r.fee_id !== null).map(r =>
            `<tr><td>${r.fee_type}</td><td>${r.academic_year}</td><td>${money(r.total_amount)}</td><td>${money(r.amount_paid)}</td><td>${money(r.balance)}</td><td>${String(r.due_date).slice(0,10)}</td></tr>`
        ).join("");
        document.getElementById("reportArea").innerHTML = `
          <h3>${student.name} | Class ${student.class} | Roll No. ${student.rollno}</h3>
          <div class="table-wrap"><table>
            <thead><tr><th>Fee Type</th><th>Academic Year</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due Date</th></tr></thead>
            <tbody>${feeRows || '<tr><td colspan="6">No fees assigned</td></tr>'}</tbody>
          </table></div>
          <button type="button" onclick="window.print()">Print Report</button>`;
        showMessage("Student report generated.");
    } catch (err) { showMessage(err.message, true); }
});

async function refresh() {
    await Promise.all([loadDashboard(), loadStudents(), loadFees()]);
}
refresh().catch(err => showMessage(err.message, true));
