// for the location: it is default to Dhaka and won't be changed unless the main admin changes the location
let allowChange = false; // you can set this to true if logic allows
const select = document.getElementById("district");
select.addEventListener("change", function () {
    if (!allowChange) {
        // Force back to "Dhaka"
        select.value = "dhaka";
    }
});

// for side panel
const buttons = document.querySelectorAll('.btn-organize');
const sections = document.querySelectorAll('.panel-section');

buttons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active button
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Get target section
        const target = button.getAttribute('data-section');

        // Show target section, hide others
        sections.forEach(section => {
            section.style.display = section.id === target ? 'block' : 'none';
        });
    });
});

// Modal functionality
function openEvidenceModal(complaintId) {
    document.getElementById('evidence-id').textContent = complaintId;
    document.getElementById('evidenceModal').style.display = 'flex';
    document.getElementById('evidenceModal').style.justifyContent = 'center';
    document.getElementById('evidenceModal').style.alignItems = 'center';
}

function openStatusModal(complaintId, currentStatus) {
    document.getElementById('status-id').textContent = complaintId;
    document.getElementById('current-status').textContent = currentStatus;
    document.getElementById('statusModal').style.display = 'flex';
    document.getElementById('statusModal').style.justifyContent = 'center';
    document.getElementById('statusModal').style.alignItems = 'center';
    document.getElementById('new-status').value = currentStatus;
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    modal.style.justifyContent = '';
    modal.style.alignItems = '';
}

function saveStatus() {
    const id = document.getElementById('status-id').textContent;
    const newStatus = document.getElementById('new-status').value;
    
    // Find and update the status display in the table
    const rows = document.querySelectorAll('.complaint-table tbody tr');
    rows.forEach(row => {
        const idCell = row.querySelector('td:first-child');
        if (idCell && idCell.textContent === id) {
            const statusCell = row.querySelector('td:nth-child(6) .status');
            if (statusCell) {
                // Remove old status classes
                statusCell.classList.remove('verifying', 'investigating', 'solved');
                // Add new status class
                statusCell.classList.add(newStatus);
                // Update text
                statusCell.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
            }
        }
    });
    
    alert(`Status for complaint ${id} updated to: ${newStatus}`);
    closeModal('statusModal');
}

// Close modals when clicking outside
window.addEventListener('click', function (e) {
    const evidenceModal = document.getElementById('evidenceModal');
    const statusModal = document.getElementById('statusModal');
    if (e.target === evidenceModal) {
        closeModal('evidenceModal');
    }
    if (e.target === statusModal) {
        closeModal('statusModal');
    }
});

// Add event listeners to all table buttons when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get all complaint rows
    const rows = document.querySelectorAll('.complaint-table tbody tr');
    
    // For each row, set up button event listeners
    rows.forEach(row => {
        const complaintId = row.querySelector('td:first-child').textContent;
        const statusElement = row.querySelector('td:nth-child(6) .status');
        const currentStatus = statusElement ? statusElement.textContent.toLowerCase() : '';
        
        // Get the buttons in this row
        const buttons = row.querySelectorAll('td:last-child button');
        
        // First button is "Update Status"
        if (buttons[0]) {
            buttons[0].addEventListener('click', function() {
                openStatusModal(complaintId, currentStatus);
            });
        }
        
        // Second button is "View Evidence"
        if (buttons[1]) {
            buttons[1].addEventListener('click', function() {
                openEvidenceModal(complaintId);
            });
        }
    });
});