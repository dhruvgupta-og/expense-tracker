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

    // Sort categories by amount for better visualization
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

    // Prepare data for chart
    const labels = Object.keys(sortedCategories);
    const data = Object.values(sortedCategories);

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
        type: isMobile ? 'pie' : 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--bs-body-bg').trim()
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: isMobile ? 10 : 20
            },
            plugins: {
                legend: {
                    position: isMobile ? 'bottom' : 'right',
                    labels: {
                        boxWidth: isMobile ? 12 : 40,
                        padding: isMobile ? 10 : 20,
                        font: {
                            size: isMobile ? 10 : 12
                        },
                        generateLabels: (chart) => {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label} (₹${data.datasets[0].data[i].toFixed(2)})`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i
                            }));
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Expense Distribution by Category',
                    font: {
                        size: isMobile ? 14 : 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.raw;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `₹${value.toFixed(2)} (${percentage}%)`;
                        }
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

    if (filteredExpenses.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" class="text-center py-5">
                <i class="bi bi-inbox text-muted" style="font-size: 2.5rem;"></i>
                <p class="mt-3 mb-0 text-muted">No expenses found</p>
                <button class="btn btn-primary mt-3" onclick="document.getElementById('expenseTitle').focus()">
                    <i class="bi bi-plus-lg"></i> Add Your First Expense
                </button>
            </td>
        `;
        expenseTableBody.appendChild(emptyRow);
        return;
    }

    filteredExpenses.forEach(expense => {
        const row = document.createElement('tr');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            row.innerHTML = `
                <td data-label="Date">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-calendar-date me-2"></i>
                        ${new Date(expense.date).toLocaleDateString()}
                    </div>
                </td>
                <td data-label="Title">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-card-text me-2"></i>
                        ${expense.title}
                    </div>
                </td>
                <td data-label="Category">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-tag me-2"></i>
                        <span class="badge bg-primary">${expense.category}</span>
                    </div>
                </td>
                <td data-label="Payment">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-credit-card me-2"></i>
                        <span class="badge bg-secondary">${expense.paymentMode}</span>
                    </div>
                </td>
                <td data-label="Amount">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-currency-rupee me-2"></i>
                        <strong class="text-${expense.amount > 1000 ? 'danger' : 'success'}">
                            ₹${expense.amount.toFixed(2)}
                        </strong>
                    </div>
                </td>
                <td data-label="Notes">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-sticky me-2"></i>
                        <span class="text-truncate" style="max-width: 200px;" title="${expense.notes || '-'}">
                            ${expense.notes || '-'}
                        </span>
                    </div>
                </td>
                <td data-label="Action">
                    <button class="btn btn-danger btn-sm w-100" 
                            onclick="deleteExpense(${expense.id})"
                            style="touch-action: manipulation;">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;

            // Add touch feedback
            row.style.cursor = 'pointer';
            row.addEventListener('touchstart', () => {
                row.style.backgroundColor = 'var(--bs-gray-200)';
            });
            row.addEventListener('touchend', () => {
                row.style.backgroundColor = '';
            });
        } else {
            row.innerHTML = `
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>${expense.title}</td>
                <td><span class="badge bg-primary">${expense.category}</span></td>
                <td><span class="badge bg-secondary">${expense.paymentMode}</span></td>
                <td><strong>₹${expense.amount.toFixed(2)}</strong></td>
                <td>${expense.notes || '-'}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense(${expense.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
        }

        // Add animation to new rows
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        expenseTableBody.appendChild(row);

        // Trigger animation
        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, 50);
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

// Enhanced alert message with better mobile support
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = `
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1050;
        min-width: 280px;
        max-width: 90%;
        box-shadow: 0 3px 10px rgba(0,0,0,0.15);
        border-radius: 10px;
    `;
    
    alert.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            ${message}
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Add animation
    alert.style.opacity = '0';
    alert.style.transform = 'translate(-50%, -20px)';
    
    setTimeout(() => {
        alert.style.transition = 'all 0.3s ease';
        alert.style.opacity = '1';
        alert.style.transform = 'translate(-50%, 0)';
    }, 50);

    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translate(-50%, -20px)';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Handle scroll for sticky search/filter
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const searchFilter = document.querySelector('.search-filter-container');
    if (!searchFilter) return;

    const st = window.pageYOffset || document.documentElement.scrollTop;
    if (st > lastScrollTop) {
        // Scrolling down
        searchFilter.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        searchFilter.style.transform = 'translateY(0)';
    }
    lastScrollTop = st <= 0 ? 0 : st;
});
