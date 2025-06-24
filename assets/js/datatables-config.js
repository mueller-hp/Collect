/**
 * DataTables Configuration Module
 * Advanced DataTables setup with Hebrew RTL support
 * Collections-Web Project
 */

class DataTablesManager {
    constructor() {
        this.defaultConfig = this.getDefaultConfig();
        this.hebrewLanguage = this.getHebrewLanguage();
        this.customCSS = this.getCustomCSS();
        
        this.injectCSS();
        console.log('📋 DataTables Configuration Manager מוכן');
    }

    /**
     * קבלת הגדרות ברירת מחדל
     */
    getDefaultConfig() {
        return {
            responsive: true,
            language: this.getHebrewLanguage(),
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "הכל"]],
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'excel',
                    text: '📊 Excel',
                    className: 'btn btn-success btn-sm'
                },
                {
                    extend: 'pdf',
                    text: '📄 PDF', 
                    className: 'btn btn-danger btn-sm'
                },
                {
                    extend: 'print',
                    text: '🖨️ הדפסה',
                    className: 'btn btn-info btn-sm'
                }
            ],
            order: [[0, 'desc']],
            columnDefs: [
                {
                    targets: '_all',
                    className: 'text-center'
                }
            ]
        };
    }

    /**
     * הגדרות שפה עברית
     */
    getHebrewLanguage() {
        return {
            "decimal": "",
            "emptyTable": "אין נתונים זמינים בטבלה",
            "info": "מציג _START_ עד _END_ מתוך _TOTAL_ רשומות",
            "infoEmpty": "מציג 0 עד 0 מתוך 0 רשומות", 
            "infoFiltered": "(מסונן מתוך _MAX_ רשומות)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "הצג _MENU_ רשומות",
            "loadingRecords": "טוען...",
            "processing": "מעבד...",
            "search": "חיפוש:",
            "zeroRecords": "לא נמצאו רשומות תואמות",
            "paginate": {
                "first": "ראשון",
                "last": "אחרון", 
                "next": "הבא",
                "previous": "הקודם"
            },
            "aria": {
                "sortAscending": ": הפעל למיון עולה",
                "sortDescending": ": הפעל למיון יורד"
            },
            "select": {
                "rows": {
                    "_": "%d שורות נבחרו",
                    "0": "לחץ על שורה לבחירה",
                    "1": "שורה אחת נבחרה"
                }
            },
            "buttons": {
                "copy": "העתק",
                "excel": "Excel",
                "pdf": "PDF",
                "print": "הדפס",
                "colvis": "נראות עמודות"
            }
        };
    }

    /**
     * CSS מותאם אישית
     */
    getCustomCSS() {
        return `
<style>
.collections-datatable {
    direction: rtl;
    font-family: 'Segoe UI', Arial, sans-serif;
}

.collections-datatable .dataTables_wrapper {
    direction: rtl;
}

.collections-datatable .dataTables_filter {
    text-align: right;
    margin-bottom: 1rem;
}

.collections-datatable .dataTables_filter label {
    font-weight: normal;
    white-space: nowrap;
    text-align: right;
}

.collections-datatable .dataTables_filter input {
    display: inline-block;
    width: auto;
    margin-right: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 0.375rem;
    padding: 0.375rem 0.75rem;
}

.collections-datatable .dataTables_length {
    text-align: right;
    margin-bottom: 1rem;
}

.collections-datatable .dataTables_info {
    text-align: right;
    padding-top: 0.755rem;
}

.collections-datatable .dataTables_paginate {
    text-align: left;
    padding-top: 0.5rem;
}

.collections-datatable .dt-buttons {
    margin-bottom: 1rem;
    text-align: right;
}

.collections-datatable .dt-button {
    margin-left: 0.25rem;
    border-radius: 0.375rem;
}

.collections-datatable .btn-group-sm > .btn {
    padding: 0.125rem 0.25rem;
    font-size: 0.75rem;
}

.collections-datatable table.dataTable thead th {
    border-bottom: 2px solid #dee2e6;
    text-align: center;
    font-weight: 600;
    background-color: #f8f9fa;
}

.collections-datatable table.dataTable tbody td {
    border-top: 1px solid #dee2e6;
    text-align: center;
    padding: 0.75rem;
}

.collections-datatable table.dataTable tbody tr:hover {
    background-color: #f5f5f5;
}

.status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-badge.low-risk {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.status-badge.medium-risk {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.status-badge.high-risk {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
}

.btn-action {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-edit {
    background-color: #0d6efd;
    color: white;
}

.btn-edit:hover {
    background-color: #0b5ed7;
}

.btn-delete {
    background-color: #dc3545;
    color: white;
}

.btn-delete:hover {
    background-color: #bb2d3b;
}

@media (max-width: 768px) {
    .collections-datatable .dt-buttons {
        text-align: center;
    }
    
    .collections-datatable .dt-button {
        display: block;
        width: 100%;
        margin: 0.25rem 0;
    }
    
    .collections-datatable .dataTables_filter,
    .collections-datatable .dataTables_length,
    .collections-datatable .dataTables_info {
        text-align: center;
    }
}
</style>
        `;
    }

    /**
     * הזרקת CSS לדף
     */
    injectCSS() {
        document.head.insertAdjacentHTML('beforeend', this.customCSS);
    }

    /**
     * יצירת טבלה עם הגדרות בסיסיות
     */
    createTable(selector, data, columns, additionalConfig = {}) {
        const config = {
            ...this.defaultConfig,
            data: data,
            columns: columns,
            ...additionalConfig
        };

        return $(selector).DataTable(config);
    }

    /**
     * יצירת טבלת חובות
     */
    createDebtsTable(selector, data) {
        const columns = [
            { 
                title: 'מזהה',
                data: 'id',
                className: 'text-center'
            },
            { 
                title: 'שם חייב',
                data: 'debtorName'
            },
            { 
                title: 'סכום חוב',
                data: 'amount',
                render: (data) => `₪${data.toLocaleString('he-IL')}`
            },
            { 
                title: 'תאריך יצירה',
                data: 'createdDate',
                render: (data) => new Date(data).toLocaleDateString('he-IL')
            },
            { 
                title: 'רמת סיכון',
                data: 'riskLevel',
                render: (data) => {
                    const riskClass = data === 'קריטי' ? 'high-risk' : 
                                    data === 'גבוה' ? 'medium-risk' : 'low-risk';
                    return `<span class="status-badge ${riskClass}">${data}</span>`;
                }
            },
            {
                title: 'פעולות',
                data: null,
                orderable: false,
                render: (data, type, row) => `
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="viewDebt('${row.id}')">
                            👁️ צפייה
                        </button>
                    </div>
                `
            }
        ];

        return this.createTable(selector, data, columns);
    }

    /**
     * יצירת טבלת גבייה
     */
    createCollectionsTable(selector, data) {
        const columns = [
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
            }
        ];

        return this.createTable(selector, data, columns);
    }

    /**
     * עדכון נתוני טבלה
     */
    updateTableData(table, newData) {
        if (table && table.clear) {
            table.clear();
            table.rows.add(newData);
            table.draw();
        }
    }

    /**
     * הרס טבלה
     */
    destroyTable(table) {
        if (table && table.destroy) {
            table.destroy();
        }
    }
}

// יצירת instance גלובלי
const dataTablesManager = new DataTablesManager();

// Export למודולים
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataTablesManager;
}

// Export ל-ES6 modules  
if (typeof window !== 'undefined') {
    window.DataTablesManager = DataTablesManager;
    window.dataTablesManager = dataTablesManager;
}

// Export statements removed for browser compatibility