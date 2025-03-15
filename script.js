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
const budgetProgress = document.getElementById('budgetProgress');
const spentAmount = document.getElementById('spentAmount');
const budgetAmount = document.getElementById('budgetAmount');
const saveBudgetBtn = document.getElementById('saveBudget');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const applyDateFilter = document.getElementById('applyDateFilter');
const exportBtn = document.getElementById('exportBtn');
const categoryPills = document.getElementById('categoryPills');
const saveGoalBtn = document.getElementById('saveGoal');
const saveRecurringBtn = document.getElementById('saveRecurring');
const mainMenuBtn = document.getElementById('mainMenuBtn');
const goalsProgress = document.getElementById('goalsProgress');
const recurringList = document.getElementById('recurringList');
const insights = document.getElementById('insights');

// Initialize expenses array from localStorage or empty array
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Initialize budget from localStorage
let monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
budgetAmount.textContent = monthlyBudget.toFixed(2);

// Initialize arrays from localStorage
let goals = JSON.parse(localStorage.getItem('expenseGoals')) || [];
let recurringExpenses = JSON.parse(localStorage.getItem('recurringExpenses')) || [];

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

    // Update budget progress
    const percentage = (monthlyTotal / monthlyBudget) * 100;
    budgetProgress.style.width = `${Math.min(percentage, 100)}%`;
    budgetProgress.className = `progress-bar ${percentage > 100 ? 'bg-danger' : 'bg-primary'}`;
    spentAmount.textContent = monthlyTotal.toFixed(2);
    budgetAmount.textContent = monthlyBudget.toFixed(2);

    // Update chart
    updateChart();
    updateTrendChart();
}

// Chart initialization
let myChart = null;
let trendChart = null;

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

// Update trend chart
function updateTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Group expenses by date
    const dailyTotals = expenses.reduce((acc, expense) => {
        const date = expense.date;
        acc[date] = (acc[date] || 0) + expense.amount;
        return acc;
    }, {});

    // Sort dates and get last 7 days
    const sortedDates = Object.keys(dailyTotals).sort();
    const last7Days = sortedDates.slice(-7);
    const data = last7Days.map(date => dailyTotals[date]);

    // Destroy existing chart if it exists
    if (trendChart) {
        trendChart.destroy();
    }

    // Create trend chart
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(date => new Date(date).toLocaleDateString()),
            datasets: [{
                label: 'Daily Expenses',
                data: data,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Expense Trend (Last 7 Days)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '₹' + value
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
    const start = startDate.value ? new Date(startDate.value) : null;
    const end = endDate.value ? new Date(endDate.value) : null;

    return expenses.filter(expense => {
        const matchesSearch = expense.title.toLowerCase().includes(searchTerm) ||
                            expense.notes.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || expense.category === selectedCategory;
        
        let matchesDate = true;
        if (start && end) {
            const expenseDate = new Date(expense.date);
            matchesDate = expenseDate >= start && expenseDate <= end;
        }

        return matchesSearch && matchesCategory && matchesDate;
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

// Save budget
saveBudgetBtn.addEventListener('click', () => {
    const budget = parseFloat(document.getElementById('monthlyBudget').value);
    if (budget && budget > 0) {
        monthlyBudget = budget;
        localStorage.setItem('monthlyBudget', budget);
        updateStatistics();
        bootstrap.Modal.getInstance(document.getElementById('budgetModal')).hide();
        showAlert('Budget updated successfully!', 'success');
    }
});

// Category pills functionality
categoryPills.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-pill')) {
        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        e.target.classList.add('active');
        filterCategory.value = e.target.dataset.category;
        displayExpenses();
    }
});

// Date range filter
applyDateFilter.addEventListener('click', () => {
    if (startDate.value && endDate.value) {
        displayExpenses();
    } else {
        showAlert('Please select both start and end dates', 'danger');
    }
});

// Export functionality
exportBtn.addEventListener('click', () => {
    const filteredExpenses = filterExpenses();
    
    // Create CSV content
    const csvContent = [
        ['Date', 'Title', 'Category', 'Payment Mode', 'Amount', 'Notes'],
        ...filteredExpenses.map(expense => [
            new Date(expense.date).toLocaleDateString(),
            expense.title,
            expense.category,
            expense.paymentMode,
            expense.amount,
            expense.notes
        ])
    ].map(row => row.join(',')).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'expenses.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showAlert('Expenses exported successfully!', 'success');
});

// Initialize date range with current month
const today = new Date();
startDate.valueAsDate = new Date(today.getFullYear(), today.getMonth(), 1);
endDate.valueAsDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

// Floating Action Menu
mainMenuBtn.addEventListener('click', () => {
    const menu = mainMenuBtn.closest('.floating-menu');
    menu.classList.toggle('active');
});

// Goals Management
function saveGoal() {
    const category = document.getElementById('goalCategory').value;
    const amount = parseFloat(document.getElementById('goalAmount').value);
    
    if (amount && amount > 0) {
        const goal = {
            id: Date.now(),
            category,
            amount,
            progress: 0
        };
        
        goals = goals.filter(g => g.category !== category);
        goals.push(goal);
        localStorage.setItem('expenseGoals', JSON.stringify(goals));
        updateGoals();
        bootstrap.Modal.getInstance(document.getElementById('goalsModal')).hide();
        showAlert('Goal added successfully!', 'success');
    }
}

function updateGoals() {
    goalsProgress.innerHTML = '';
    
    goals.forEach(goal => {
        const monthlyExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            const today = new Date();
            return e.category === goal.category &&
                   expenseDate.getMonth() === today.getMonth() &&
                   expenseDate.getFullYear() === today.getFullYear();
        });
        
        const spent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
        const progress = Math.min((spent / goal.amount) * 100, 100);
        
        const goalElement = document.createElement('div');
        goalElement.className = 'goal-item';
        goalElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}</h6>
                    <small class="text-muted">₹${spent.toFixed(2)} / ₹${goal.amount.toFixed(2)}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteGoal(${goal.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <div class="progress">
                <div class="progress-bar ${progress >= 100 ? 'bg-danger' : 'bg-success'}"
                     style="width: ${progress}%"></div>
            </div>
        `;
        
        goalsProgress.appendChild(goalElement);
    });
}

function deleteGoal(id) {
    if (confirm('Are you sure you want to delete this goal?')) {
        goals = goals.filter(goal => goal.id !== id);
        localStorage.setItem('expenseGoals', JSON.stringify(goals));
        updateGoals();
        showAlert('Goal deleted successfully!', 'danger');
    }
}

// Recurring Expenses Management
function saveRecurring() {
    const title = document.getElementById('recurringTitle').value;
    const amount = parseFloat(document.getElementById('recurringAmount').value);
    const category = document.getElementById('recurringCategory').value;
    const frequency = document.getElementById('recurringFrequency').value;
    const dueDate = document.getElementById('recurringDueDate').value;
    
    if (title && amount && amount > 0 && dueDate) {
        const recurring = {
            id: Date.now(),
            title,
            amount,
            category,
            frequency,
            dueDate,
            lastPaid: null
        };
        
        recurringExpenses.push(recurring);
        localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
        updateRecurring();
        bootstrap.Modal.getInstance(document.getElementById('recurringModal')).hide();
        showAlert('Recurring expense added successfully!', 'success');
    }
}

function updateRecurring() {
    recurringList.innerHTML = '';
    
    recurringExpenses.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    recurringExpenses.forEach(recurring => {
        const dueDate = new Date(recurring.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        const recurringElement = document.createElement('div');
        recurringElement.className = 'recurring-item';
        recurringElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${recurring.title}</h6>
                    <small class="text-muted">
                        ₹${recurring.amount.toFixed(2)} - ${recurring.frequency}
                        <span class="badge ${daysUntilDue <= 7 ? 'bg-danger' : 'bg-info'}">
                            Due in ${daysUntilDue} days
                        </span>
                    </small>
                </div>
                <div>
                    <button class="btn btn-sm btn-success me-1" onclick="markPaid(${recurring.id})">
                        <i class="bi bi-check-lg"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRecurring(${recurring.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        recurringList.appendChild(recurringElement);
    });
}

function markPaid(id) {
    const recurring = recurringExpenses.find(r => r.id === id);
    if (recurring) {
        // Add as regular expense
        const expense = {
            id: Date.now(),
            title: recurring.title,
            amount: recurring.amount,
            category: recurring.category,
            date: new Date().toISOString().split('T')[0],
            paymentMode: 'automatic',
            notes: `Recurring ${recurring.frequency} expense`
        };
        
        expenses.push(expense);
        saveExpenses();
        
        // Update next due date
        const currentDue = new Date(recurring.dueDate);
        switch(recurring.frequency) {
            case 'monthly':
                currentDue.setMonth(currentDue.getMonth() + 1);
                break;
            case 'quarterly':
                currentDue.setMonth(currentDue.getMonth() + 3);
                break;
            case 'yearly':
                currentDue.setFullYear(currentDue.getFullYear() + 1);
                break;
        }
        
        recurring.lastPaid = new Date().toISOString();
        recurring.dueDate = currentDue.toISOString().split('T')[0];
        
        localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
        updateRecurring();
        showAlert('Marked as paid and added to expenses!', 'success');
    }
}

function deleteRecurring(id) {
    if (confirm('Are you sure you want to delete this recurring expense?')) {
        recurringExpenses = recurringExpenses.filter(r => r.id !== id);
        localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
        updateRecurring();
        showAlert('Recurring expense deleted successfully!', 'danger');
    }
}

// Smart Insights
function updateInsights() {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    // Monthly comparison
    const thisMonthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
    
    const lastMonthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === (thisMonth - 1) && date.getFullYear() === thisYear;
    });
    
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Category analysis
    const categoryTotals = {};
    thisMonthExpenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a);
    
    // Generate insights
    insights.innerHTML = '';
    
    // Monthly comparison insight
    const monthlyChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    const monthlyInsight = document.createElement('div');
    monthlyInsight.className = 'insight-card';
    monthlyInsight.innerHTML = `
        <h6><i class="bi bi-calendar"></i> Monthly Comparison</h6>
        <p>
            This month: ₹${thisMonthTotal.toFixed(2)}<br>
            ${monthlyChange > 0 
                ? `<span class="text-danger">↑ ${monthlyChange.toFixed(1)}% increase</span>` 
                : `<span class="text-success">↓ ${Math.abs(monthlyChange).toFixed(1)}% decrease</span>`}
            compared to last month
        </p>
    `;
    insights.appendChild(monthlyInsight);
    
    // Top spending categories
    if (sortedCategories.length > 0) {
        const categoryInsight = document.createElement('div');
        categoryInsight.className = 'insight-card';
        categoryInsight.innerHTML = `
            <h6><i class="bi bi-pie-chart"></i> Top Spending Categories</h6>
            <p>
                1. ${sortedCategories[0][0]}: ₹${sortedCategories[0][1].toFixed(2)}<br>
                ${sortedCategories[1] ? `2. ${sortedCategories[1][0]}: ₹${sortedCategories[1][1].toFixed(2)}<br>` : ''}
                ${sortedCategories[2] ? `3. ${sortedCategories[2][0]}: ₹${sortedCategories[2][1].toFixed(2)}` : ''}
            </p>
        `;
        insights.appendChild(categoryInsight);
    }
    
    // Budget insight
    if (monthlyBudget > 0) {
        const remaining = monthlyBudget - thisMonthTotal;
        const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
        const dailyBudget = remaining / (daysInMonth - today.getDate() + 1);
        
        const budgetInsight = document.createElement('div');
        budgetInsight.className = 'insight-card';
        budgetInsight.innerHTML = `
            <h6><i class="bi bi-piggy-bank"></i> Budget Status</h6>
            <p>
                Remaining: ₹${remaining.toFixed(2)}<br>
                Daily budget: ₹${dailyBudget.toFixed(2)} for the rest of the month
            </p>
        `;
        insights.appendChild(budgetInsight);
    }
}

// Event listeners for new features
saveGoalBtn.addEventListener('click', saveGoal);
saveRecurringBtn.addEventListener('click', saveRecurring);

// Update all displays when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateGoals();
    updateRecurring();
    updateInsights();
});

// Update insights when expenses change
const originalSaveExpenses = saveExpenses;
saveExpenses = function() {
    originalSaveExpenses();
    updateGoals();
    updateInsights();
};

// Add after updateChart function
function handleOrientationChange() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobile = window.innerWidth <= 768;
    
    if (isLandscape && isMobile) {
        // Adjust chart heights for landscape mode
        document.querySelectorAll('.chart-container').forEach(container => {
            container.style.height = '200px';
        });
    } else {
        // Reset chart heights
        document.querySelectorAll('.chart-container').forEach(container => {
            container.style.height = isMobile ? '250px' : '400px';
        });
    }
    
    // Update charts
    updateChart();
    updateTrendChart();
}

// Enhanced window resize handler
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        displayExpenses();
        handleOrientationChange();
    }, 250);
});

// Handle orientation change
window.addEventListener('orientationchange', () => {
    setTimeout(handleOrientationChange, 100);
});

// Enhanced touch feedback
function addTouchFeedback(element) {
    element.addEventListener('touchstart', () => {
        element.style.transform = 'scale(0.98)';
        element.style.opacity = '0.9';
    }, { passive: true });
    
    element.addEventListener('touchend', () => {
        element.style.transform = '';
        element.style.opacity = '';
    }, { passive: true });
}

// Apply touch feedback to interactive elements
document.addEventListener('DOMContentLoaded', () => {
    // Add touch feedback to buttons and cards
    document.querySelectorAll('.btn, .stat-card, .goal-item, .recurring-item, .category-pill').forEach(addTouchFeedback);
    
    // Initialize orientation handling
    handleOrientationChange();
    
    // Update displays
    updateGoals();
    updateRecurring();
    updateInsights();
});

// Enhanced mobile table view
function enhanceMobileTableView() {
    const isMobile = window.innerWidth <= 768;
    const table = document.querySelector('.table-mobile-view');
    
    if (isMobile) {
        // Add swipe to delete functionality
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            let touchStartX = 0;
            let touchEndX = 0;
            
            row.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            }, { passive: true });
            
            row.addEventListener('touchmove', (e) => {
                touchEndX = e.touches[0].clientX;
                const diff = touchStartX - touchEndX;
                
                if (diff > 50) { // Swipe left
                    row.style.transform = `translateX(-${diff}px)`;
                }
            }, { passive: true });
            
            row.addEventListener('touchend', () => {
                const diff = touchStartX - touchEndX;
                
                if (diff > 100) { // Complete swipe
                    const id = row.querySelector('.btn-danger').getAttribute('onclick').match(/\d+/)[0];
                    deleteExpense(id);
                } else { // Reset position
                    row.style.transform = '';
                }
            });
        });
    }
}

// Enhanced alert for mobile
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    
    // Adjust position based on device
    const isMobile = window.innerWidth <= 768;
    alert.style.cssText = `
        ${isMobile ? 'bottom: 20px;' : 'top: 20px;'}
        left: 50%;
        transform: translateX(-50%);
        z-index: 1050;
        min-width: ${isMobile ? '90%' : '280px'};
        max-width: 90%;
        box-shadow: 0 3px 10px rgba(0,0,0,0.15);
        border-radius: 10px;
        margin: 0 auto;
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
    alert.style.transform = `translate(-50%, ${isMobile ? '20px' : '-20px'})`;
    
    setTimeout(() => {
        alert.style.transition = 'all 0.3s ease';
        alert.style.opacity = '1';
        alert.style.transform = 'translate(-50%, 0)';
    }, 50);

    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = `translate(-50%, ${isMobile ? '20px' : '-20px'})`;
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Call enhanceMobileTableView when displaying expenses
const originalDisplayExpenses = displayExpenses;
displayExpenses = function() {
    originalDisplayExpenses();
    enhanceMobileTableView();
};
