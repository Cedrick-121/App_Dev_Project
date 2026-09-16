document.addEventListener('DOMContentLoaded', () => {
    
    // Simulated Database (Pre-loaded with fake data for panel defense)
    let appointments = [
        { id: 1, name: "Ana Cruz", studentId: "02024000088", permit: "Registrar — Transcript", date: "2026-09-15", time: "10:00", status: "Pending" },
        { id: 2, name: "Mark Reyes", studentId: "02023001102", permit: "Library Access", date: "2026-09-16", time: "13:30", status: "Approved" }
    ];

    let currentSort = { column: 'date', isAscending: true };
    let latestBookingId = null; // Used to track the student's latest booking for the Tracker UI

    // DOM Elements
    const toggleBtn = document.getElementById('toggleRoleBtn');
    const roleIndicator = document.getElementById('roleIndicator');
    const studentView = document.getElementById('studentView');
    const adminView = document.getElementById('adminView');
    const form = document.getElementById('bookingForm');
    const adminTableBody = document.getElementById('adminTableBody');
    const searchInput = document.getElementById('adminSearchInput');
    const toastContainer = document.getElementById('toastContainer');
    const mainNav = document.getElementById('mainNav');

    // --- Toast Notification System ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- Role Switching & Loading Screen ---
    let isAdmin = false;
    toggleBtn.addEventListener('click', () => {
        isAdmin = !isAdmin;
        if (isAdmin) {
            studentView.classList.add('hidden');
            mainNav.classList.add('hidden'); // Hide student nav
            adminView.classList.remove('hidden');
            roleIndicator.textContent = "Admin Mode";
            toggleBtn.textContent = "Student View";
            
            // Trigger Skeleton Loading Effect
            renderSkeleton();
            setTimeout(() => renderTable(), 800); 
        } else {
            adminView.classList.add('hidden');
            studentView.classList.remove('hidden');
            mainNav.classList.remove('hidden'); // Show student nav
            roleIndicator.textContent = "Student Mode";
            toggleBtn.textContent = "Admin Login";
            updateTrackerUI(); // Refresh tracker if admin changed the status
        }
    });

    // --- Form Submission & Business Rules ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('studentName').value;
        const studentId = document.getElementById('studentId').value;
        const permit = document.getElementById('permitType').value;
        const date = document.getElementById('apptDate').value;
        const time = document.getElementById('apptTime').value;

        // Rule 1: 11-Digit Check
        if (studentId.length !== 11 || isNaN(studentId)) {
            showToast("Student Number must be exactly 11 digits.", "error");
            return;
        }

        // Rule 2: 8AM - 5PM Operating Hours
        const hour = parseInt(time.split(':')[0]);
        if (hour < 8 || hour >= 17) {
            showToast("Operating hours are 8:00 AM to 5:00 PM.", "error");
            return;
        }

        // Rule 3: No Weekends
        const selectedDate = new Date(date);
        if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
            showToast("Weekend schedules are closed.", "error");
            return;
        }

        // Rule 4: 100 Daily Limit per Permit Type
        const dailyCount = appointments.filter(a => a.permit === permit && a.date === date).length;
        if (dailyCount >= 100) {
            showToast(`Daily limit (100) reached for ${permit} on this date.`, "error");
            return;
        }

        // Add to Mock Database
        const newId = Date.now();
        appointments.push({
            id: newId, name, studentId, permit, date, time, status: "Pending"
        });

        latestBookingId = newId; // Save for the visual tracker
        showToast("Booking Confirmed!", "success");
        form.reset();
        updateTrackerUI();
    });

    // --- Visual Status Tracker Logic ---
    function updateTrackerUI() {
        if (!latestBookingId) return;

        const booking = appointments.find(a => a.id === latestBookingId);
        if (!booking) return;

        const trackerCard = document.getElementById('statusTrackerCard');
        const trackerDetails = document.getElementById('trackerDetails');
        const stepPending = document.getElementById('stepPending');
        const stepApproved = document.getElementById('stepApproved');
        const stepLine = document.querySelector('.step-line');

        trackerCard.classList.remove('hidden');
        trackerDetails.innerHTML = `${booking.permit} <br> ${booking.date} at ${booking.time}`;

        if (booking.status === "Approved") {
            stepPending.classList.remove('active');
            stepPending.style.background = "#e0e0e0";
            stepPending.style.color = "#64748B";
            
            stepLine.classList.add('active');
            
            stepApproved.classList.add('approved-active');
            stepApproved.textContent = "2. Approved & Ready";
        } else {
            stepPending.classList.add('active');
            stepPending.style.background = "";
            stepPending.style.color = "";
            
            stepLine.classList.remove('active');
            
            stepApproved.classList.remove('approved-active');
            stepApproved.textContent = "2. Approved";
        }
    }

    // --- Admin Table Render & Skeleton ---
    function renderSkeleton() {
        adminTableBody.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            adminTableBody.innerHTML += `<tr class="skeleton-row"><td colspan="5" style="height: 60px;"></td></tr>`;
        }
    }

    function renderTable(filterText = '') {
        adminTableBody.innerHTML = ''; 

        // Sorting Logic
        let displayData = [...appointments].sort((a, b) => {
            let valA = a[currentSort.column].toLowerCase();
            let valB = b[currentSort.column].toLowerCase();
            if (valA < valB) return currentSort.isAscending ? -1 : 1;
            if (valA > valB) return currentSort.isAscending ? 1 : -1;
            return 0;
        });

        // Filtering Logic (Search Bar)
        const filteredAppts = displayData.filter(appt => 
            appt.name.toLowerCase().includes(filterText) || 
            appt.studentId.toLowerCase().includes(filterText)
        );

        if (filteredAppts.length === 0) {
            adminTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem;">No matching records found.</td></tr>`;
            return;
        }

        filteredAppts.forEach(appt => {
            const tr = document.createElement('tr');
            const badgeClass = appt.status === 'Approved' ? 'approved' : 'pending';
            const disableBtn = appt.status === 'Approved' ? 'disabled' : '';

            tr.innerHTML = `
                <td>
                    <div style="font-weight: 800; color: var(--sti-blue)">${appt.name}</div>
                    <div style="font-size: 0.85rem; color: var(--text-gray)">${appt.studentId}</div>
                </td>
                <td style="font-weight: 700;">${appt.permit}</td>
                <td>
                    <div>${appt.date}</div>
                    <div style="font-size: 0.85rem; color: var(--text-gray)">${appt.time}</div>
                </td>
                <td><span class="badge ${badgeClass}">${appt.status}</span></td>
                <td>
                    <button class="btn-sm btn-approve" onclick="approveAppt(${appt.id})" ${disableBtn}>
                        ${appt.status === 'Approved' ? 'Approved' : 'Approve'}
                    </button>
                    <button class="btn-sm btn-delete" onclick="deleteAppt(${appt.id})">Delete</button>
                </td>
            `;
            adminTableBody.appendChild(tr);
        });
    }

    // --- Search & Sort Triggers ---
    searchInput.addEventListener('input', (e) => {
        renderTable(e.target.value.toLowerCase());
    });

    window.sortTable = function(column) {
        if (currentSort.column === column) {
            currentSort.isAscending = !currentSort.isAscending; // Toggle direction
        } else {
            currentSort.column = column;
            currentSort.isAscending = true;
        }
        renderTable(searchInput.value.toLowerCase());
    };

    // --- Global CRUD Actions ---
    window.approveAppt = function(id) {
        const record = appointments.find(a => a.id === id);
        if (record) {
            record.status = "Approved";
            showToast(`${record.name}'s permit approved!`, "success");
            renderTable(searchInput.value.toLowerCase()); 
            updateTrackerUI(); // Update tracker in case it was the current user
        }
    };

    window.deleteAppt = function(id) {
        if (confirm("Delete this appointment permanently?")) {
            appointments = appointments.filter(a => a.id !== id);
            showToast(`Record deleted.`, "info");
            renderTable(searchInput.value.toLowerCase()); 
        }
    };
});