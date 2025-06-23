/**
 * מערכת התראות מתקדמת - Alert System (Web Version)
 * מערכת התראות לניהול חובות וחייבים בעייתיים
 * Version: 2.0 - עבודה עם ממשק משתמש ואחסון מקומי
 */

class AlertSystem {
    constructor() {
        this.config = {
            enabled: true,
            throttleMinutes: 15,
            maxAlertsPerHour: 12,
            quietHours: {
                enabled: true,
                start: 22,
                end: 7
            },
            alertThresholds: {
                criticalAmount: 50000,
                highAmount: 20000,
                overdueDays: 90,
                severeDays: 180
            }
        };
        
        this.state = {
            alertHistory: [],
            isMonitoring: false,
            lastAlertTime: null,
            notificationPermission: Notification.permission || 'default'
        };
        
        this.debtAnalysisEngine = null;
        this.alertTypes = {
            CRITICAL_DEBT: { icon: '🚨', color: '#dc3545', priority: 1 },
            HIGH_RISK: { icon: '⚠️', color: '#fd7e14', priority: 2 },
            OVERDUE: { icon: '⏰', color: '#ffc107', priority: 3 },
            NEW_ANALYSIS: { icon: '📊', color: '#0d6efd', priority: 4 },
            SYSTEM: { icon: '🔧', color: '#6c757d', priority: 5 }
        };
        
        this.loadConfiguration();
        this.requestNotificationPermission();
        console.log("✅ מערכת התראות הוטענה בהצלחה");
    }
    
    /**
     * טעינת הגדרות מאחסון מקומי
     */
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('alertSystemConfig');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
            }
            
            const savedHistory = localStorage.getItem('alertHistory');
            if (savedHistory) {
                this.state.alertHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.warn('⚠️ שגיאה בטעינת הגדרות התראות:', error);
        }
    }
    
    /**
     * שמירת הגדרות לאחסון מקומי
     */
    saveConfiguration() {
        try {
            localStorage.setItem('alertSystemConfig', JSON.stringify(this.config));
            localStorage.setItem('alertHistory', JSON.stringify(this.state.alertHistory));
        } catch (error) {
            console.error('❌ שגיאה בשמירת הגדרות התראות:', error);
        }
    }
    
    /**
     * בקשת הרשאה לתצוגת התראות
     */
    async requestNotificationPermission() {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                this.state.notificationPermission = permission;
                console.log(`🔔 הרשאת התראות: ${permission}`);
            } catch (error) {
                console.warn('⚠️ לא ניתן לבקש הרשאה להתראות:', error);
            }
        }
    }
    
    /**
     * חיבור למנוע ניתוח החובות
     */
    connectToDebtEngine(debtEngine) {
        this.debtAnalysisEngine = debtEngine;
        console.log('🔗 מערכת התראות חוברה למנוע ניתוח החובות');
    }
    
    /**
     * יצירת התראה חדשה
     */
    createAlert(type, title, message, data = {}) {
        if (!this.config.enabled) {
            return null;
        }
        
        // בדיקת throttling
        if (this.isThrottled()) {
            console.log('⏱️ התראה נחסמה עקב throttling');
            return null;
        }
        
        // בדיקת שעות שקט
        if (this.isQuietHours()) {
            console.log('🌙 התראה נחסמה עקב שעות שקט');
            return null;
        }
        
        const alert = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type,
            title,
            message,
            data,
            timestamp: new Date().toISOString(),
            read: false,
            ...this.alertTypes[type]
        };
        
        this.state.alertHistory.unshift(alert);
        this.state.lastAlertTime = Date.now();
        
        // שמירה לאחסון מקומי
        this.saveConfiguration();
        
        // הצגת התראה
        this.displayAlert(alert);
        this.showBrowserNotification(alert);
        
        console.log(`${alert.icon} התראה חדשה:`, alert.title);
        return alert;
    }
    
    /**
     * בדיקת חובות קריטיים
     */
    checkCriticalDebts(debtorsData) {
        if (!debtorsData || debtorsData.length === 0) {
            return;
        }
        
        const criticalDebts = debtorsData.filter(debtor => 
            debtor.totalBalance >= this.config.alertThresholds.criticalAmount
        );
        
        if (criticalDebts.length > 0) {
            this.createAlert('CRITICAL_DEBT', 
                `זוהו ${criticalDebts.length} חובות קריטיים`,
                `חובות מעל ${this.formatCurrency(this.config.alertThresholds.criticalAmount)} דורשים טיפול מיידי`,
                { count: criticalDebts.length, debts: criticalDebts }
            );
        }
        
        // בדיקת חובות מאוחרים
        const overdueDebts = debtorsData.filter(debtor => 
            debtor.daysSinceLastPayment >= this.config.alertThresholds.overdueDays
        );
        
        if (overdueDebts.length > 0) {
            this.createAlert('OVERDUE',
                `זוהו ${overdueDebts.length} חובות מאוחרים`,
                `חובות מעל ${this.config.alertThresholds.overdueDays} ימים ללא תשלום`,
                { count: overdueDebts.length, debts: overdueDebts }
            );
        }
    }
    
    /**
     * הצגת התראה בממשק המשתמש
     */
    displayAlert(alert) {
        // חיפוש container להתראות
        let container = document.getElementById('alert-container');
        if (!container) {
            container = this.createAlertContainer();
        }
        
        // יצירת element להתראה
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-dismissible fade show alert-${this.getBootstrapClass(alert.type)}`;
        alertElement.setAttribute('role', 'alert');
        alertElement.setAttribute('data-alert-id', alert.id);
        
        alertElement.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2" style="font-size: 1.2em;">${alert.icon}</span>
                <div class="flex-grow-1">
                    <strong>${alert.title}</strong>
                    <div class="mt-1 small">${alert.message}</div>
                    <div class="mt-1 text-muted small">${this.formatTimestamp(alert.timestamp)}</div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="סגור"></button>
            </div>
        `;
        
        container.appendChild(alertElement);
        container.classList.add('show');
        
        // הסרה אוטומטית אחרי זמן מסוים
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
                this.markAsRead(alert.id);
            }
        }, 10000);
    }
    
    /**
     * יצירת container להתראות
     */
    createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alert-container';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        container.style.maxWidth = '400px';
        container.style.direction = 'rtl';
        
        document.body.appendChild(container);
        return container;
    }
    
    /**
     * הצגת התראה בדפדפן
     */
    showBrowserNotification(alert) {
        if (this.state.notificationPermission !== 'granted') {
            return;
        }
        
        try {
            const notification = new Notification(alert.title, {
                body: alert.message,
                icon: '/favicon.ico',
                tag: alert.id,
                dir: 'rtl',
                lang: 'he'
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // סגירה אוטומטית
            setTimeout(() => notification.close(), 8000);
        } catch (error) {
            console.warn('⚠️ שגיאה בהצגת התראת דפדפן:', error);
        }
    }
    
    /**
     * בדיקה האם יש throttling
     */
    isThrottled() {
        if (!this.state.lastAlertTime) {
            return false;
        }
        
        const timeSinceLastAlert = Date.now() - this.state.lastAlertTime;
        const throttleMs = this.config.throttleMinutes * 60 * 1000;
        
        return timeSinceLastAlert < throttleMs;
    }
    
    /**
     * בדיקה האם זה שעות שקט
     */
    isQuietHours() {
        if (!this.config.quietHours.enabled) {
            return false;
        }
        
        const now = new Date();
        const currentHour = now.getHours();
        const start = this.config.quietHours.start;
        const end = this.config.quietHours.end;
        
        if (start > end) {
            // שעות שקט חוצות חצות
            return currentHour >= start || currentHour < end;
        } else {
            return currentHour >= start && currentHour < end;
        }
    }
    
    /**
     * סימון התראה כנקראה
     */
    markAsRead(alertId) {
        const alert = this.state.alertHistory.find(a => a.id === alertId);
        if (alert) {
            alert.read = true;
            this.saveConfiguration();
        }
    }
    
    /**
     * קבלת סטטיסטיקות התראות
     */
    getAlertStats() {
        const total = this.state.alertHistory.length;
        const unread = this.state.alertHistory.filter(a => !a.read).length;
        const last24h = this.state.alertHistory.filter(a => 
            Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000
        ).length;
        
        return { total, unread, last24h };
    }
    
    /**
     * ניקוי היסטוריה ישנה
     */
    cleanupOldHistory(daysToKeep = 30) {
        const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        this.state.alertHistory = this.state.alertHistory.filter(alert => 
            new Date(alert.timestamp).getTime() > cutoffDate
        );
        this.saveConfiguration();
        console.log(`🧹 נוקתה היסטוריית התראות מעל ${daysToKeep} ימים`);
    }
    
    /**
     * עזרים לעיצוב
     */
    getBootstrapClass(alertType) {
        const classMap = {
            'CRITICAL_DEBT': 'danger',
            'HIGH_RISK': 'warning',
            'OVERDUE': 'warning',
            'NEW_ANALYSIS': 'info',
            'SYSTEM': 'secondary'
        };
        return classMap[alertType] || 'info';
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        }).format(amount);
    }
    
    formatTimestamp(timestamp) {
        return new Intl.DateTimeFormat('he-IL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(timestamp));
    }
    
    /**
     * זיהוי מדינת מוצא על פי שם
     */
    detectCountryFromName(name) {
        if (!name || typeof name !== 'string') {
            return null;
        }
        
        const cleanName = name.toLowerCase().trim();
        const countryPatterns = {
            'תאילנד': ['thailand', 'thai', 'bangkok', 'phuket', 'chiang', 'ไทย', 'กรุงเทพ'],
            'הודו': ['india', 'indian', 'delhi', 'mumbai', 'bangalore', 'chennai', 'भारत', 'इंडिया'],
            'סין': ['china', 'chinese', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', '中国', '中華'],
            'וייטנאם': ['vietnam', 'vietnamese', 'hanoi', 'saigon', 'ho chi minh', 'việt nam'],
            'פיליפינים': ['philippines', 'filipino', 'manila', 'cebu', 'davao', 'pilipinas'],
            'אתיופיא': ['ethiopia', 'ethiopian', 'addis ababa', 'አማርኛ', 'ኢትዮጵያ'],
            'אריתריאה': ['eritrea', 'eritrean', 'asmara', 'ትግርኛ'],
            'אוקראינה': ['ukraine', 'ukrainian', 'kiev', 'kyiv', 'odessa', 'україна', 'українська'],
            'רוסיא': ['russia', 'russian', 'moscow', 'petersburg', 'россия', 'русский'],
            'מולדובה': ['moldova', 'moldovan', 'chisinau', 'молдова'],
            'קמבודיה': ['cambodia', 'cambodian', 'ខ្មែរ'],
            'רומניה': ['romania', 'romanian', 'ghenia', 'sc.', 's.c.', 'srl', 'bucuresti'],
            'פלסטין': ['palestine', 'palestinian', 'gaza', 'westbank', 'ramallah', 'فلسطين']
        };
        
        for (const [country, patterns] of Object.entries(countryPatterns)) {
            for (const pattern of patterns) {
                if (name.includes(pattern)) {
                    return country;
                }
            }
        }
        
        return null;
    }
    
    healthCheck() {
        const status = {
            timestamp: new Date().toISOString(),
            systemStatus: 'healthy',
            components: {
                notifications: this.state.notificationPermission === 'granted' ? 'ok' : 'warning',
                localStorage: this.testLocalStorage() ? 'ok' : 'error',
                debtEngine: this.debtAnalysisEngine ? 'ok' : 'not_connected',
                monitoring: this.state.isMonitoring ? 'active' : 'inactive'
            },
            stats: this.getAlertStats(),
            config: {
                enabled: this.config.enabled,
                throttleMinutes: this.config.throttleMinutes,
                maxAlertsPerHour: this.config.maxAlertsPerHour,
                quietHoursEnabled: this.config.quietHours.enabled
            }
        };
        
        // בדוק אם יש בעיות
        const hasErrors = Object.values(status.components).includes('error');
        const hasWarnings = Object.values(status.components).includes('warning');
        
        if (hasErrors) {
            status.systemStatus = 'error';
        } else if (hasWarnings) {
            status.systemStatus = 'warning';
        }
        
        console.log('🏥 בדיקת בריאות מערכת:', status);
        return status;
    }
    
    testLocalStorage() {
        try {
            const testKey = 'alert-system-test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// יצירת instance גלובלי
const alertSystem = new AlertSystem();

// אתחול כשה-DOM מוכן
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 מערכת התראות מוכנה לשימוש');
    
    // הצג container אם יש התראות
    const alertHistory = alertSystem.state.alertHistory;
    if (alertHistory && alertHistory.length > 0) {
        const container = document.getElementById('alert-container');
        if (container) {
            container.classList.add('show');
        }
    }
    
    // נקה היסטוריה ישנה
    alertSystem.cleanupOldHistory();
});

// Export למודולים
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlertSystem;
}

// Export ל-ES6 modules  
if (typeof window !== 'undefined') {
    window.AlertSystem = AlertSystem;
    window.alertSystem = alertSystem;
}

export { AlertSystem, alertSystem };