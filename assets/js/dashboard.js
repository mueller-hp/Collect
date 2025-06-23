/**
 * Dashboard JavaScript Module - Part 2
 * Collections-Web Project
 * Advanced Interactive Dashboard with RTL Support
 */

class DashboardManager {
    constructor() {
        this.debtAnalysisEngine = null;
        this.alertSystem = null;
        this.charts = {};
        this.tables = {};
        this.currentData = [];
        this.analysisResults = {};
        
        console.log("✅ Dashboard Manager מוכן לשימוש");
    }

    /**
     * Initialize Collections Table
     */
    initializeCollectionsTable() {
        const tableElement = document.getElementById('collections-table');
        if (!tableElement) return;

        const tableData = this.prepareCollectionsTableData();

        this.tables.collectionsTable = $(tableElement).DataTable({
            data: tableData,
            columns: [
                { 
                    title: 'מזהה גביה',
                    data: 'id',
                    className: 'text-center'
                },
                { 
                    title: 'שם חייב',
                    data: 'debtorName'
                },
                { 
                    title: 'סכום נגבה',
                    data: 'collectedAmount',
                    render: (data) => `₪${data.toLocaleString('he-IL')}`
                },
                { 
                    title: 'תאריך גביה',
                    data: 'collectionDate',
                    render: (data) => new Date(data).toLocaleDateString('he-IL')
                },
                { 
                    title: 'אמצעי תשלום',
                    data: 'paymentMethod'
                },
                { 
                    title: 'סטטוס',
                    data: 'status',
                    render: (data) => {
                        const statusClass = data === 'הושלם' ? 'low-risk' : 
                                          data === 'חלקי' ? 'medium-risk' : 'high-risk';
                        return `<span class="status-badge ${statusClass}">${data}</span>`;
                    }
                },
                {
                    title: 'פעולות',
                    data: null,
                    orderable: false,
                    render: (data, type, row) => `
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" onclick="dashboard.viewCollection('${row.id}')">
                                👁️ צפייה
                            </button>
                        </div>
                    `
                }
            ],
            language: {
                url: this.getDataTablesHebrewLanguage()
            },
            order: [[3, 'desc']], // Sort by collection date
            pageLength: 10,
            responsive: true,
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'excel',
                    text: '📊 ייצוא ל-Excel',
                    className: 'btn btn-success btn-sm'
                },
                {
                    extend: 'pdf',
                    text: '📄 ייצוא ל-PDF',
                    className: 'btn btn-danger btn-sm'
                }
            ],
            initComplete: function() {
                console.log('✅ Collections table initialized');
            }
        });
    }

    /**
     * Prepare Debts Table Data
     */
    prepareDebtsTableData() {
        const sampleData = [
            {
                id: 'D001',
                debtorName: 'יוסי כהן',
                amount: 15000,
                createdDate: '2024-01-15',
                riskLevel: 'גבוה',
                isOverdue: true
            },
            {
                id: 'D002',
                debtorName: 'רחל לוי',
                amount: 8500,
                createdDate: '2024-02-10',
                riskLevel: 'בינוני',
                isOverdue: false
            },
            {
                id: 'D003',
                debtorName: 'משה אברהם',
                amount: 25000,
                createdDate: '2024-01-20',
                riskLevel: 'גבוה',
                isOverdue: true
            },
            {
                id: 'D004',
                debtorName: 'שרה דוד',
                amount: 3200,
                createdDate: '2024-03-05',
                riskLevel: 'נמוך',
                isOverdue: false
            },
            {
                id: 'D005',
                debtorName: 'אברהם רוזן',
                amount: 12000,
                createdDate: '2024-02-25',
                riskLevel: 'בינוני',
                isOverdue: true
            }
        ];

        // Use real data if available, otherwise use sample data
        return this.debtData.debts || sampleData;
    }

    /**
     * Prepare Collections Table Data
     */
    prepareCollectionsTableData() {
        const sampleData = [
            {
                id: 'C001',
                debtorName: 'יוסי כהן',
                collectedAmount: 7500,
                collectionDate: '2024-05-15',
                paymentMethod: 'העברה בנקאית',
                status: 'חלקי'
            },
            {
                id: 'C002',
                debtorName: 'רחל לוי',
                collectedAmount: 8500,
                collectionDate: '2024-05-20',
                paymentMethod: 'מזומן',
                status: 'הושלם'
            },
            {
                id: 'C003',
                debtorName: 'שרה דוד',
                collectedAmount: 3200,
                collectionDate: '2024-05-22',
                paymentMethod: 'כרטיס אשראי',
                status: 'הושלם'
            }
        ];

        return this.debtData.collections || sampleData;
    }

    /**
     * Get DataTables Hebrew Language Configuration
     */
    getDataTablesHebrewLanguage() {
        return {
            "sEmptyTable": "אין נתונים זמינים בטבלה",
            "sInfo": "מציג _START_ עד _END_ מתוך _TOTAL_ רשומות",
            "sInfoEmpty": "מציג 0 עד 0 מתוך 0 רשומות",
            "sInfoFiltered": "(מסונן מתוך _MAX_ רשומות סה\"כ)",
            "sInfoPostFix": "",
            "sInfoThousands": ",",
            "sLengthMenu": "הצג _MENU_ רשומות",
            "sLoadingRecords": "טוען...",
            "sProcessing": "מעבד...",
            "sSearch": "חיפוש:",
            "sZeroRecords": "לא נמצאו רשומות תואמות",
            "oPaginate": {
                "sFirst": "ראשון",
                "sLast": "אחרון",
                "sNext": "הבא",
                "sPrevious": "הקודם"
            },
            "oAria": {
                "sSortAscending": ": הפעל למיון עולה",
                "sSortDescending": ": הפעל למיון יורד"
            }
        };
    }

    /**
     * Initialize Alerts
     */
    initializeAlerts() {
        console.log('🚨 Initializing Alerts...');
        
        if (!this.alertSystem) {
            console.warn('AlertSystem not found');
            return;
        }

        // Display recent alerts
        this.displayRecentAlerts();
        
        // Setup alert listeners
        this.setupAlertListeners();
    }

    /**
     * Display Recent Alerts
     */
    displayRecentAlerts() {
        const alertsContainer = document.getElementById('dashboard-alerts');
        if (!alertsContainer) return;

        const recentAlerts = [
            {
                type: 'warning',
                title: 'חובות באיחור',
                message: 'יש 3 חובות חדשים שעברו את תאריך הפירעון',
                timestamp: new Date()
            },
            {
                type: 'success',
                title: 'גביה הושלמה',
                message: 'נגבה בהצלחה סכום של ₪8,500 מרחל לוי',
                timestamp: new Date(Date.now() - 3600000)
            },
            {
                type: 'danger',
                title: 'חוב בסיכון גבוה',
                message: 'חוב של משה אברהם (₪25,000) סומן כסיכון גבוה',
                timestamp: new Date(Date.now() - 7200000)
            }
        ];

        alertsContainer.innerHTML = recentAlerts.map(alert => `
            <div class="alert-card ${alert.type}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${alert.title}</h6>
                        <p class="mb-1">${alert.message}</p>
                        <small class="text-muted">${this.formatTimestamp(alert.timestamp)}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="dashboard.dismissAlert(this)">
                        ✕
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Setup Alert Listeners
     */
    setupAlertListeners() {
        // Listen for new alerts from AlertSystem
        if (this.alertSystem && this.alertSystem.on) {
            this.alertSystem.on('newAlert', (alert) => {
                this.handleNewAlert(alert);
            });
        }
    }

    /**
     * Handle New Alert
     */
    handleNewAlert(alert) {
        console.log('🚨 New alert received:', alert);
        
        // Add to dashboard alerts
        const alertsContainer = document.getElementById('dashboard-alerts');
        if (alertsContainer) {
            const alertElement = document.createElement('div');
            alertElement.className = `alert-card ${alert.type} new-alert`;
            alertElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${alert.title}</h6>
                        <p class="mb-1">${alert.message}</p>
                        <small class="text-muted">עכשיו</small>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="dashboard.dismissAlert(this)">
                        ✕
                    </button>
                </div>
            `;
            
            alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
            
            // Remove new-alert class after animation
            setTimeout(() => {
                alertElement.classList.remove('new-alert');
            }, 1000);
        }

        // Update KPI if relevant
        this.refreshKPICards();
    }

    /**
     * Initialize Event Listeners
     */
    initializeEventListeners() {
        console.log('👂 Initializing Event Listeners...');
        
        // Refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // Export buttons
        const exportExcelBtn = document.getElementById('export-excel');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        }

        const exportPdfBtn = document.getElementById('export-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportToPdf());
        }

        // Window resize for responsive charts
        window.addEventListener('resize', this.debounce(() => {
            this.resizeCharts();
        }, 300));
    }

    /**
     * Start Auto Refresh
     */
    startAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshDashboard();
        }, 300000);
        
        console.log('🔄 Auto-refresh started (5 minutes interval)');
    }

    /**
     * Refresh Dashboard
     */
    refreshDashboard() {
        console.log('🔄 Refreshing dashboard...');
        
        this.showLoadingState();
        
        // Simulate data refresh
        setTimeout(() => {
            this.refreshKPICards();
            this.refreshCharts();
            this.refreshTables();
            this.displayRecentAlerts();
            this.hideLoadingState();
            
            if (this.alertSystem) {
                this.alertSystem.showAlert('success', 'דשבורד עודכן בהצלחה');
            }
        }, 1500);
    }

    /**
     * Refresh KPI Cards
     */
    refreshKPICards() {
        this.initializeKPICards();
    }

    /**
     * Refresh Charts
     */
    refreshCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.update) {
                chart.update();
            }
        });
    }

    /**
     * Refresh Tables
     */
    refreshTables() {
        Object.values(this.tables).forEach(table => {
            if (table && table.ajax && table.ajax.reload) {
                table.ajax.reload(null, false);
            }
        });
    }

    /**
     * Show Loading State
     */
    showLoadingState() {
        const loadingElements = document.querySelectorAll('.loading-spinner');
        loadingElements.forEach(element => {
            element.style.display = 'flex';
        });
    }

    /**
     * Hide Loading State
     */
    hideLoadingState() {
        const loadingElements = document.querySelectorAll('.loading-spinner');
        loadingElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    /**
     * Resize Charts
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    /**
     * Export to Excel
     */
    exportToExcel() {
        console.log('📊 Exporting to Excel...');
        
        if (this.tables.debtsTable) {
            this.tables.debtsTable.button('.buttons-excel').trigger();
        }
    }

    /**
     * Export to PDF
     */
    exportToPdf() {
        console.log('📄 Exporting to PDF...');
        
        if (this.tables.debtsTable) {
            this.tables.debtsTable.button('.buttons-pdf').trigger();
        }
    }

    /**
     * Action Handlers
     */
    editDebt(debtId) {
        console.log('✏️ Editing debt:', debtId);
        
        if (this.alertSystem) {
            this.alertSystem.showAlert('info', `עריכת חוב ${debtId} - פונקציונליות בפיתוח`);
        }
    }

    deleteDebt(debtId) {
        console.log('🗑️ Deleting debt:', debtId);
        
        if (confirm(`האם אתה בטוח שברצונך למחוק את החוב ${debtId}?`)) {
            if (this.alertSystem) {
                this.alertSystem.showAlert('warning', `חוב ${debtId} נמחק בהצלחה`);
            }
        }
    }

    viewCollection(collectionId) {
        console.log('👁️ Viewing collection:', collectionId);
        
        if (this.alertSystem) {
            this.alertSystem.showAlert('info', `צפייה בגביה ${collectionId} - פונקציונליות בפיתוח`);
        }
    }

    dismissAlert(buttonElement) {
        const alertCard = buttonElement.closest('.alert-card');
        if (alertCard) {
            alertCard.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                alertCard.remove();
            }, 300);
        }
    }

    /**
     * Utility Functions
     */
    formatTimestamp(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        if (diff < 60000) { // Less than 1 minute
            return 'עכשיו';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `לפני ${minutes} דקות`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `לפני ${hours} שעות`;
        } else {
            return timestamp.toLocaleDateString('he-IL');
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });

        // Destroy tables
        Object.values(this.tables).forEach(table => {
            if (table && table.destroy) {
                table.destroy();
            }
        });

        console.log('🧹 Dashboard Manager cleaned up');
    }
    
    // CSS Animation for new alerts
    initializeAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            .new-alert {
                animation: slideIn 0.5s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// יצירת instance גלובלי
const dashboardManager = new DashboardManager();

// Export למודולים
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}

// Export ל-ES6 modules  
if (typeof window !== 'undefined') {
    window.DashboardManager = DashboardManager;
    window.dashboardManager = dashboardManager;
}

export { DashboardManager, dashboardManager };
