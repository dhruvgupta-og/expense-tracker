// Get DOM elements
const expenseForm = document.getElementById('expenseForm');
const expenseTableBody = document.getElementById('expenseTableBody');
const totalAmountElement = document.getElementById('totalAmount');
const monthlyAmountElement = document.getElementById('monthlyAmount');
const todayAmountElement = document.getElementById('todayAmount');
const searchExpense = document.getElementById('searchExpense');
const filterCategory = document.getElementById('filterCategory');
const themeToggle = document.getElementById('themeToggle');
const expenseChart = document.getElementById('expenseChart');

// Initialize expenses array from localStorage or empty array
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Theme Toggle
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-bs-theme') === 'dark';
    html.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
    themeToggle.innerHTML = `<i class="bi bi-${isDark ? 'moon-fill' : 'sun-fill'}"></i>`;
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-bs-theme', savedTheme);
themeToggle.innerHTML = `<i class="bi bi-${savedTheme === 'dark' ? 'sun-fill' : 'moon-fill'}"></i>`;
themeToggle.addEventListener('click', toggleTheme);

// Update statistics
function updateStatistics() {
    // Total amount
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalAmountElement.textContent = total.toFixed(2);

    // Monthly amount
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const monthlyTotal = expenses.reduce((sum, expense) => {
        const expenseDate = new Date(expense.date);
        return (expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear)
            ? sum + expense.amount
            : sum;
    }, 0);
    monthlyAmountElement.textContent = monthlyTotal.toFixed(2);

    // Today's amount
    const todayStr = today.toISOString().split('T')[0];
    const todayTotal = expenses.reduce((sum, expense) => 
        expense.date === todayStr ? sum + expense.amount : sum, 0);
    todayAmountElement.textContent = todayTotal.toFixed(2);

    // Update chart
    updateChart();
}

// Chart initialization
let myChart = null;

function updateChart() {
    const ctx = expenseChart.getContext('2d');
    const isMobile = window.innerWidth <= 768;
    
    // Group expenses by category
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    // Prepare data for chart
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Define colors for categories
    const colors = [
        '#4361ee', '#3f37c9', '#3a0ca3', '#480ca8',
        '#560bad', '#7209b7', '#b5179e', '#f72585'
    ];

    // Destroy existing chart if it exists
    if (myChart) {
        myChart.destroy();
    }

    // Create new chart with responsive options
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: !isMobile,
            plugins: {
                legend: {
                    position: isMobile ? 'bottom' : 'right',
                    labels: {
                        boxWidth: isMobile ? 12 : 40,
                        padding: isMobile ? 10 : 20,
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Expense Distribution by Category',
                    font: {
                        size: isMobile ? 14 : 16
                    }
                }
            }
        }
    });
}

// Save expenses to localStorage
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateStatistics();
}

// Add new expense
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('expenseTitle').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    const paymentMode = document.getElementById('paymentMode').value;
    const notes = document.getElementById('expenseNotes').value;

    const expense = {
        id: Date.now(),
        title,
        amount,
        category,
        date,
        paymentMode,
        notes
    };

    expenses.push(expense);
    saveExpenses();
    displayExpenses();
    expenseForm.reset();

    // Show success message
    showAlert('Expense added successfully!', 'success');
});

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        displayExpenses();
        showAlert('Expense deleted successfully!', 'danger');
    }
}

// Show alert message
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    expenseForm.insertAdjacentElement('beforebegin', alert);
    setTimeout(() => alert.remove(), 3000);
}

// Filter and search expenses
function filterExpenses() {
    const searchTerm = searchExpense.value.toLowerCase();
    const selectedCategory = filterCategory.value;

    return expenses.filter(expense => {
        const matchesSearch = expense.title.toLowerCase().includes(searchTerm) ||
                            expense.notes.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || expense.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
}

// Display expenses in table
function displayExpenses() {
    expenseTableBody.innerHTML = '';
    
    const filteredExpenses = filterExpenses();
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    filteredExpenses.forEach(expense => {
        const row = document.createElement('tr');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            row.innerHTML = `
                <td data-label="Date">${new Date(expense.date).toLocaleDateString()}</td>
                <td data-label="Title">${expense.title}</td>
                <td data-label="Category"><span class="badge bg-primary">${expense.category}</span></td>
                <td data-label="Payment"><span class="badge bg-secondary">${expense.paymentMode}</span></td>
                <td data-label="Amount">₹${expense.amount.toFixed(2)}</td>
                <td data-label="Notes">${expense.notes || '-'}</td>
                <td data-label="Action">
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense(${expense.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>${expense.title}</td>
                <td><span class="badge bg-primary">${expense.category}</span></td>
                <td><span class="badge bg-secondary">${expense.paymentMode}</span></td>
                <td>₹${expense.amount.toFixed(2)}</td>
                <td>${expense.notes || '-'}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense(${expense.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
        }
        expenseTableBody.appendChild(row);
    });
}

// Event listeners for search and filter
searchExpense.addEventListener('input', displayExpenses);
filterCategory.addEventListener('change', displayExpenses);

// Set today's date as default in the date input
document.getElementById('expenseDate').valueAsDate = new Date();

// Initial display
displayExpenses();
updateStatistics();

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        displayExpenses();
        updateChart();
    }, 250);
});
