/**
 * מודול טיפול בקבצים - File Handler
 * מערכת עיבוד קבצי Excel עם drag & drop interface
 * Version: 1.0 - Web Client Side
 */

class FileHandler {
    constructor() {
        this.debtEngine = null;
        this.currentFile = null;
        this.processingInProgress = false;
        
        console.log("✅ מודול טיפול בקבצים הוטען בהצלחה");
    }

    /**
     * אתחול event listeners לממשק הקבצים
     */
    initialize() {
        this.initializeDropZone();
        this.initializeBrowseButton();
        this.initializeProcessButton();
        
        console.log("🎯 ממשק קבצים הותקן בהצלחה");
    }

    /**
     * הגדרת אזור הגרירה
     */
    initializeDropZone() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        if (!dropZone || !fileInput) return;

        // מניעת התנהגות ברירת מחדל
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // הדגשת אזור הגרירה
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.highlight(dropZone), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.unhighlight(dropZone), false);
        });

        // טיפול בגרירה
        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    /**
     * הגדרת כפתור עיון
     */
    initializeBrowseButton() {
        const browseBtn = document.getElementById('browseBtn');
        const fileInput = document.getElementById('fileInput');
        
        if (!browseBtn || !fileInput) return;

        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFiles(e.target.files);
            }
        });
    }

    /**
     * הגדרת כפתור עיבוד
     */
    initializeProcessButton() {
        const processBtn = document.getElementById('processBtn');
        
        if (!processBtn) return;

        processBtn.addEventListener('click', () => {
            this.processFile();
        });
    }

    /**
     * מניעת התנהגות ברירת מחדל
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * הדגשת אזור הגרירה
     */
    highlight(element) {
        element.classList.add('drag-over');
    }

    /**
     * הסרת הדגשה
     */
    unhighlight(element) {
        element.classList.remove('drag-over');
    }

    /**
     * טיפול בגרירת קבצים
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        this.handleFiles(files);
    }

    /**
     * טיפול בקבצים שנבחרו
     */
    handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        
        // בדיקת סוג הקובץ
        if (!this.isValidFile(file)) {
            this.showError("קובץ חייב להיות מסוג Excel (.xlsx או .xls)");
            return;
        }
        
        // בדיקת גודל הקובץ (מקסימום 50MB)
        if (file.size > 50 * 1024 * 1024) {
            this.showError("הקובץ גדול מדי. מקסימום: 50MB");
            return;
        }
        
        this.currentFile = file;
        this.displayFileInfo(file);
        
        console.log("📁 קובץ נבחר:", file.name, "גודל:", this.formatFileSize(file.size));
    }

    /**
     * בדיקת תקינות הקובץ
     */
    isValidFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        
        const validExtensions = ['.xlsx', '.xls'];
        const hasValidType = validTypes.includes(file.type);
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        
        return hasValidType || hasValidExtension;
    }

    /**
     * הצגת מידע על הקובץ
     */
    displayFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        if (!fileInfo || !fileName || !fileSize) return;
        
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        
        fileInfo.style.display = 'block';
    }

    /**
     * עיצוב גודל קובץ
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * עיבוד הקובץ
     */
    async processFile() {
        if (!this.currentFile) {
            this.showError("יש לבחור קובץ תחילה");
            return;
        }
        
        if (this.processingInProgress) {
            this.showWarning("עיבוד כבר בתהליך...");
            return;
        }
        
        this.processingInProgress = true;
        this.showProcessing(true);
        
        try {
            console.log("🚀 מתחיל עיבוד קובץ:", this.currentFile.name);
            
            // יצירת מנוע הניתוח
            this.debtEngine = new DebtAnalysisEngine();
            
            // שלב 1: טעינת הקובץ
            this.updateProcessingStatus("טוען קובץ Excel...");
            await this.debtEngine.loadExcelFile(this.currentFile);
            
            // שלב 2: קריאת הנתונים
            this.updateProcessingStatus("קורא נתוני חייבים...");
            const debtorsData = await this.debtEngine.loadDebtorsData();
            
            if (!debtorsData || debtorsData.length === 0) {
                throw new Error("לא נמצאו נתוני חייבים בקובץ");
            }
            
            // שלב 3: ניתוח הנתונים
            this.updateProcessingStatus("מבצע ניתוח מתקדם...");
            const analysis = this.debtEngine.performGlobalAnalysis();
            
            // שלב 4: הכנת הדשבורד
            this.updateProcessingStatus("מכין דשבורד...");
            await this.initializeDashboard(analysis);
            
            console.log("✅ עיבוד הושלם בהצלחה");
            console.log("📊 נותחו", debtorsData.length, "חייבים");
            console.log("💰 סה״כ חוב:", analysis.totalAmount.toLocaleString(), "ש״ח");
            
            this.showSuccess("הקובץ עובד בהצלחה! נותחו " + debtorsData.length + " חייבים");
            
            // מעבר לדשבורד
            setTimeout(() => {
                this.showMainDashboard();
            }, 1500);
            
        } catch (error) {
            console.error("❌ שגיאה בעיבוד הקובץ:", error);
            this.showError("שגיאה בעיבוד הקובץ: " + error.message);
        } finally {
            this.processingInProgress = false;
            this.showProcessing(false);
        }
    }

    /**
     * עדכון סטטוס העיבוד
     */
    updateProcessingStatus(message) {
        const statusElement = document.querySelector('#loadingOverlay p');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log("🔄", message);
    }

    /**
     * הצגת מצב עיבוד
     */
    showProcessing(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const processBtn = document.getElementById('processBtn');
        
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.remove('hidden');
            } else {
                loadingOverlay.classList.add('hidden');
            }
        }
        
        if (processBtn) {
            processBtn.disabled = show;
            if (show) {
                processBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>מעבד...';
            } else {
                processBtn.innerHTML = '<i class="fas fa-play me-2"></i>התחל ניתוח';
            }
        }
    }

    /**
     * אתחול הדשבורד
     */
    async initializeDashboard(analysis) {
        // הכנת הנתונים לדשבורד
        window.debtAnalysisResults = analysis;
        window.debtAnalysisEngine = this.debtEngine;
        
        // אתחול מודולי הדשבורד
        if (typeof initializeDashboardContent === 'function') {
            await initializeDashboardContent(analysis);
        }
        
        console.log("📋 דשבורד הוכן בהצלחה");
    }

    /**
     * מעבר לדשבורד הראשי
     */
    showMainDashboard() {
        const fileUploadSection = document.getElementById('fileUploadSection');
        const mainDashboard = document.getElementById('mainDashboard');
        
        if (fileUploadSection) {
            fileUploadSection.style.display = 'none';
        }
        
        if (mainDashboard) {
            mainDashboard.style.display = 'block';
        }
        
        // עדכון כותרת הדף
        document.title = "מערכת ניהול גבייה - " + (this.currentFile?.name || "דשבורד");
    }

    /**
     * הצגת הודעת שגיאה
     */
    showError(message) {
        this.showToast(message, 'error');
        console.error("❌", message);
    }

    /**
     * הצגת הודעת אזהרה
     */
    showWarning(message) {
        this.showToast(message, 'warning');
        console.warn("⚠️", message);
    }

    /**
     * הצגת הודעת הצלחה
     */
    showSuccess(message) {
        this.showToast(message, 'success');
        console.log("✅", message);
    }

    /**
     * הצגת toast notification
     */
    showToast(message, type = 'info') {
        // יצירת toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="toast-content">
                <i class="${icon} me-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        // הוספה לעמוד
        document.body.appendChild(toast);
        
        // אנימצית הופעה
        setTimeout(() => toast.classList.add('show'), 100);
        
        // הסרה אוטומטית
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, type === 'error' ? 5000 : 3000);
    }

    /**
     * קבלת אייקון לפי סוג הודעה
     */
    getToastIcon(type) {
        const icons = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * איפוס מודול
     */
    reset() {
        this.currentFile = null;
        this.debtEngine = null;
        this.processingInProgress = false;
        
        // איפוס UI
        const fileInfo = document.getElementById('fileInfo');
        const fileInput = document.getElementById('fileInput');
        
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        
        if (fileInput) {
            fileInput.value = '';
        }
        
        console.log("🔄 מודול קבצים אופס");
    }

    /**
     * קבלת מידע על הקובץ הנוכחי
     */
    getCurrentFileInfo() {
        if (!this.currentFile || !this.debtEngine) {
            return null;
        }
        
        return {
            fileName: this.currentFile.name,
            fileSize: this.formatFileSize(this.currentFile.size),
            processedAt: new Date().toLocaleString('he-IL'),
            totalRecords: this.debtEngine.debtorsData?.length || 0,
            analysisResults: this.debtEngine.analysisResults
        };
    }
}

// CSS Styles for Toast Notifications
const toastStyles = `
<style>
.toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 16px;
    margin-bottom: 10px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 9999;
    max-width: 400px;
    border-right: 4px solid #007bff;
}

.toast-notification.show {
    transform: translateX(0);
}

.toast-notification.toast-success {
    border-right-color: #28a745;
}

.toast-notification.toast-error {
    border-right-color: #dc3545;
}

.toast-notification.toast-warning {
    border-right-color: #ffc107;
}

.toast-content {
    display: flex;
    align-items: center;
    color: #333;
    font-weight: 500;
}

.toast-success .toast-content {color: #155724;}
.toast-error .toast-content {color: #721c24;}
.toast-warning .toast-content {color: #856404;}

.drop-zone.drag-over {
    border-color: #007bff !important;
    background-color: rgba(0, 123, 255, 0.05) !important;
    transform: scale(1.02);
}

.drop-zone {
    transition: all 0.3s ease;
    cursor: pointer;
}

.drop-zone:hover {
    border-color: #0056b3;
    background-color: rgba(0, 123, 255, 0.02);
}
</style>
`;

// הוספת הסטיילים לעמוד
document.head.insertAdjacentHTML('beforeend', toastStyles);

// יצירת instance גלובלי
let fileHandlerInstance = null;

// פונקציית אתחול גלובלית
function initializeFileHandlers() {
    fileHandlerInstance = new FileHandler();
    fileHandlerInstance.initialize();
    
    console.log("🎯 מערכת קבצים מוכנה לשימוש");
}

// הפיכה לזמינה גלובלית
if (typeof window !== 'undefined') {
    window.FileHandler = FileHandler;
    window.initializeFileHandlers = initializeFileHandlers;
    window.getFileHandler = () => fileHandlerInstance;
}

console.log("✅ מודול טיפול בקבצים (File Handler) מוכן לשימוש");
