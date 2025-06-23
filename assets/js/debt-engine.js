/**
 * מנוע ניתוח חובות מתקדם - Debt Analysis Engine (Web Version)
 * מערכת גבייה מתקדמת לניתוח וטיפול בחובות לקוחות
 * Version: 3.0 - עבודה עם SheetJS ו-File API
 */

class DebtAnalysisEngine {
    constructor() {
        this.debtorsData = [];
        this.analysisResults = {};
        this.workbook = null;
        this.currentFileName = "";
        
        this.riskCategories = {
            CRITICAL: { threshold: 50000, priority: 1, description: "קריטי - מעל 50K", color: "#dc3545" },
            HIGH: { threshold: 20000, priority: 2, description: "גבוה - 20K-50K", color: "#fd7e14" },
            MEDIUM: { threshold: 5000, priority: 3, description: "בינוני - 5K-20K", color: "#ffc107" },
            LOW: { threshold: 0, priority: 4, description: "נמוך - מתחת ל-5K", color: "#198754" }
        };
        
        this.overdueThresholds = {
            EXTREME: 365,  // שנה ומעלה
            SEVERE: 180,   // 6 חודשים
            MODERATE: 90,  // 3 חודשים
            RECENT: 30     // חודש
        };
        
        console.log("✅ מנוע ניתוח החובות (Web Version) הוטען בהצלחה");
    }

    /**
     * טעינת קובץ Excel משתמש ב-File API
     */
    async loadExcelFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("לא נבחר קובץ"));
                return;
            }
            
            // וידוא שזה קובץ Excel
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];
            
            if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
                reject(new Error("קובץ חייב להיות מסוג Excel (.xlsx או .xls)"));
                return;
            }
            
            console.log("📂 טוען קובץ Excel:", file.name);
            this.currentFileName = file.name;
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    this.workbook = XLSX.read(data, { type: 'array' });
                    
                    console.log("✅ קובץ Excel נטען בהצלחה");
                    console.log("📊 גיליונות זמינים:", this.workbook.SheetNames);
                    
                    resolve(this.workbook);
                } catch (error) {
                    console.error("❌ שגיאה בקריאת קובץ Excel:", error);
                    reject(new Error("שגיאה בקריאת הקובץ: " + error.message));
                }
            };
            
            reader.onerror = (error) => {
                console.error("❌ שגיאה בטעינת הקובץ:", error);
                reject(new Error("שגיאה בטעינת הקובץ"));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * קריאת נתונים מהגיליון
     */
    async loadDebtorsData(sheetName = null) {
        try {
            if (!this.workbook) {
                throw new Error("יש לטעון קובץ Excel תחילה");
            }
            
            console.log("🔄 טוען נתוני חייבים מהקובץ...");
            
            // בחירת גיליון (הראשון אם לא צוין)
            const selectedSheet = sheetName || this.workbook.SheetNames[0];
            const worksheet = this.workbook.Sheets[selectedSheet];
            
            if (!worksheet) {
                throw new Error(`גיליון '${selectedSheet}' לא נמצא`);
            }
            
            console.log("📋 עובד עם גיליון:", selectedSheet);
            
            // המרת הגיליון ל-JSON עם כותרות
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1, // מחזיר מערך של מערכים
                defval: "", // ערך ברירת מחדל לתאים ריקים
                raw: false // המרת מספרים למחרוזות לעיבוד עצמאי
            });
            
            if (!jsonData || jsonData.length < 2) {
                throw new Error("הקובץ חייב להכיל לפחות שורת כותרות ושורת נתונים אחת");
            }
            
            // הפרדת כותרות ונתונים
            const headers = jsonData[0];
            const rawData = jsonData.slice(1);
            
            console.log("📊 זוהו", headers.length, "עמודות ו-", rawData.length, "שורות נתונים");
            console.log("🏷️ כותרות:", headers);
            
            // עיבוד הנתונים
            this.debtorsData = this.processRawData(headers, rawData);
            console.log("✅ עובדו", this.debtorsData.length, "רשומות חייבים");
            
            return this.debtorsData;
            
        } catch (error) {
            console.error("❌ שגיאה בטעינת נתונים:", error.message);
            throw error;
        }
    }

    /**
     * עיבוד הנתונים הגולמיים
     */
    processRawData(headers, rawData) {
        const processedData = [];
        
        // ניקוי כותרות
        const cleanHeaders = headers.map(header => this.normalizeHeader(header));
        console.log("🧹 כותרות מנוקות:", cleanHeaders);
        
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;
            
            // דילוג על שורות ריקות
            const hasData = row.some(cell => cell !== null && cell !== undefined && cell !== "");
            if (!hasData) continue;
            
            const debtor = {};
            
            // מיפוי הנתונים לפי כותרות
            for (let j = 0; j < cleanHeaders.length && j < row.length; j++) {
                const header = cleanHeaders[j];
                const value = row[j];
                
                if (!header || header === "") continue;
                
                // ניקוי ועיבוד הערכים
                debtor[header] = this.processValue(value);
            }
            
            // וידוא שיש לפחות שם ערות חוב
            if (!debtor.name && !debtor.customer_name && !debtor.debtor_name) {
                continue; // דילוג על שורות ללא שם
            }
            
            // הוספת חישובים נוספים
            debtor.riskLevel = this.calculateRiskLevel(debtor);
            debtor.overdueCategory = this.calculateOverdueCategory(debtor);
            debtor.priority = this.calculatePriority(debtor);
            debtor.recommendedAction = this.getRecommendedAction(debtor);
            debtor.isInternational = this.isInternationalCase(debtor);
            
            processedData.push(debtor);
        }
        
        console.log("📈 עיבוד הושלם:", processedData.length, "רשומות תקפות");
        return processedData;
    }

    /**
     * נרמול כותרות עברית/אנגלית
     */
    normalizeHeader(header) {
        if (!header || typeof header !== 'string') return '';
        
        const headerStr = header.toString().trim();
        
        // מיפוי כותרות עבריות לאנגליות
        const headerMap = {
            'שם': 'name',
            'שם הלקוח': 'name',
            'שם לקוח': 'name',
            'לקוח': 'name',
            'חייב': 'name',
            'שם חייב': 'name',
            'סכום': 'amount',
            'יתרה': 'balance',
            'חוב': 'debt',
            'סכום חוב': 'debt',
            'יתרת חוב': 'debt',
            'ימים': 'days',
            'ימי פיגור': 'overdue_days',
            'פיגור': 'overdue_days',
            'ימי חוב': 'overdue_days',
            'טלפון': 'phone',
            'טל': 'phone',
            'נייד': 'phone',
            'כתובת': 'address',
            'עיר': 'city',
            'מזהה': 'id',
            'קוד': 'code',
            'קוד לקוח': 'customer_code',
            'ח.פ': 'tax_id',
            'ח״פ': 'tax_id',
            'עסק': 'business',
            'מדינה': 'country',
            'ארץ': 'country'
        };
        
        // חיפוש במיפוי המדויק
        if (headerMap[headerStr]) {
            return headerMap[headerStr];
        }
        
        // חיפוש חלקי
        for (const [heb, eng] of Object.entries(headerMap)) {
            if (headerStr.includes(heb)) {
                return eng;
            }
        }
        
        // אם לא נמצא, החזרת הכותרת מנוקה
        return headerStr.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w\u0590-\u05FF]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    /**
     * עיבוד ערך בודד
     */
    processValue(value) {
        if (value === null || value === undefined || value === "") {
            return null;
        }
        
        // אם זה מספר
        if (typeof value === 'number') {
            return value;
        }
        
        // אם זה מחרוזת
        if (typeof value === 'string') {
            const strValue = value.toString().trim();
            
            // נסיון להמיר למספר (הסרת פסיקים ורווחים)
            const numValue = parseFloat(strValue.replace(/[,\s₪]/g, ''));
            if (!isNaN(numValue) && strValue.match(/[\d,.\s₪]/)) {
                return numValue;
            }
            
            // החזרת המחרוזת כפי שהיא
            return strValue;
        }
        
        return value;
    }

    /**
     * חישוב רמת סיכון
     */
    calculateRiskLevel(debtor) {
        const amount = this.getDebtAmount(debtor);
        
        if (amount >= this.riskCategories.CRITICAL.threshold) {
            return 'CRITICAL';
        } else if (amount >= this.riskCategories.HIGH.threshold) {
            return 'HIGH';
        } else if (amount >= this.riskCategories.MEDIUM.threshold) {
            return 'MEDIUM';
        } else {
            return 'LOW';
        }
    }

    /**
     * חישוב קטגוריית פיגור
     */
    calculateOverdueCategory(debtor) {
        const days = this.getOverdueDays(debtor);
        
        if (days >= this.overdueThresholds.EXTREME) {
            return 'EXTREME';
        } else if (days >= this.overdueThresholds.SEVERE) {
            return 'SEVERE';
        } else if (days >= this.overdueThresholds.MODERATE) {
            return 'MODERATE';
        } else if (days >= this.overdueThresholds.RECENT) {
            return 'RECENT';
        } else {
            return 'CURRENT';
        }
    }

    /**
     * חישוב עדיפות טיפול
     */
    calculatePriority(debtor) {
        const riskScore = this.riskCategories[debtor.riskLevel].priority;
        const overdueScore = this.getOverdueScore(debtor.overdueCategory);
        
        // שילוב הציונים (ככל שהציון נמוך יותר, כך העדיפות גבוהה יותר)
        return Math.round((riskScore + overdueScore) / 2);
    }

    /**
     * ציון פיגור
     */
    getOverdueScore(category) {
        const scores = {
            'EXTREME': 1,
            'SEVERE': 2,
            'MODERATE': 3,
            'RECENT': 4,
            'CURRENT': 5
        };
        return scores[category] || 5;
    }

    /**
     * המלצה על פעולה
     */
    getRecommendedAction(debtor) {
        const risk = debtor.riskLevel;
        const overdue = debtor.overdueCategory;
        
        if (risk === 'CRITICAL' && overdue === 'EXTREME') {
            return 'פעולה משפטית מיידית';
        } else if (risk === 'CRITICAL' || overdue === 'EXTREME') {
            return 'התערבות מנהלים בכירים';
        } else if (risk === 'HIGH' && overdue === 'SEVERE') {
            return 'מכתב דרישה + שיחת טלפון';
        } else if (risk === 'HIGH' || overdue === 'SEVERE') {
            return 'שיחת טלפון דחופה';
        } else if (overdue === 'MODERATE') {
            return 'מכתב דרישה';
        } else if (overdue === 'RECENT') {
            return 'תזכורת טלפונית';
        } else {
            return 'מעקב שגרתי';
        }
    }

    /**
     * זיהוי מקרים בינלאומיים
     */
    isInternationalCase(debtor) {
        const name = (debtor.name || '').toLowerCase();
        const country = (debtor.country || '').toLowerCase();
        const address = (debtor.address || '').toLowerCase();
        
        const internationalIndicators = [
            'cambodia', 'קמבודיה', 'khmer',
            'romania', 'רומניה', 'romanian',
            'palestine', 'פלסטין', 'palestinian',
            'farm', 'dairy', 'poultry',
            'ltd', 'inc', 'corp', 's.c'
        ];
        
        return internationalIndicators.some(indicator => 
            name.includes(indicator) || 
            country.includes(indicator) || 
            address.includes(indicator)
        );
    }

    /**
     * קבלת סכום החוב
     */
    getDebtAmount(debtor) {
        return debtor.amount || debtor.balance || debtor.debt || 0;
    }

    /**
     * קבלת ימי הפיגור
     */
    getOverdueDays(debtor) {
        return debtor.days || debtor.overdue_days || debtor.overdue || 0;
    }

    /**
     * ניתוח כללי של החובות
     */
    performGlobalAnalysis() {
        if (!this.debtorsData || this.debtorsData.length === 0) {
            throw new Error("אין נתונים לניתוח");
        }
        
        console.log("🔍 מבצע ניתוח כללי...");
        
        const analysis = {
            totalDebtors: this.debtorsData.length,
            totalAmount: 0,
            byRiskLevel: {},
            byOverdueCategory: {},
            topDebtors: [],
            urgentCases: [],
            internationalCases: [],
            statistics: {},
            fileName: this.currentFileName,
            processedAt: new Date().toISOString()
        };
        
        // איתחול קטגוריות
        Object.keys(this.riskCategories).forEach(level => {
            analysis.byRiskLevel[level] = { count: 0, amount: 0, percentage: 0 };
        });
        
        Object.keys(this.overdueThresholds).forEach(category => {
            analysis.byOverdueCategory[category] = { count: 0, amount: 0, percentage: 0 };
        });
        analysis.byOverdueCategory['CURRENT'] = { count: 0, amount: 0, percentage: 0 };
        
        // חישוב נתונים
        for (const debtor of this.debtorsData) {
            const amount = this.getDebtAmount(debtor);
            analysis.totalAmount += amount;
            
            // לפי רמת סיכון
            analysis.byRiskLevel[debtor.riskLevel].count++;
            analysis.byRiskLevel[debtor.riskLevel].amount += amount;
            
            // לפי פיגור
            analysis.byOverdueCategory[debtor.overdueCategory].count++;
            analysis.byOverdueCategory[debtor.overdueCategory].amount += amount;
            
            // מקרים בינלאומיים
            if (debtor.isInternational) {
                analysis.internationalCases.push(debtor);
            }
        }
        
        // חישוב אחוזים
        Object.keys(analysis.byRiskLevel).forEach(level => {
            analysis.byRiskLevel[level].percentage = 
                Math.round((analysis.byRiskLevel[level].amount / analysis.totalAmount) * 100);
        });
        
        Object.keys(analysis.byOverdueCategory).forEach(category => {
            analysis.byOverdueCategory[category].percentage = 
                Math.round((analysis.byOverdueCategory[category].amount / analysis.totalAmount) * 100);
        });
        
        // מציאת המקרים החמורים ביותר
        analysis.topDebtors = [...this.debtorsData]
            .sort((a, b) => this.getDebtAmount(b) - this.getDebtAmount(a))
            .slice(0, 10);
        
        // מקרים דחופים
        analysis.urgentCases = [...this.debtorsData]
            .filter(d => d.priority <= 2)
            .sort((a, b) => a.priority - b.priority);
        
        // סטטיסטיקות
        const amounts = this.debtorsData.map(d => this.getDebtAmount(d));
        analysis.statistics = {
            averageDebt: Math.round(analysis.totalAmount / analysis.totalDebtors),
            medianDebt: this.calculateMedian(amounts),
            maxDebt: Math.max(...amounts),
            minDebt: Math.min(...amounts.filter(a => a > 0)),
            totalInternational: analysis.internationalCases.length
        };
        
        this.analysisResults = analysis;
        console.log("✅ ניתוח כללי הושלם");
        
        return analysis;
    }

    /**
     * חישוב חציון
     */
    calculateMedian(numbers) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
        } else {
            return sorted[middle];
        }
    }

    /**
     * קבלת מידע על הקובץ
     */
    getFileInfo() {
        if (!this.workbook) {
            return null;
        }
        
        return {
            fileName: this.currentFileName,
            sheets: this.workbook.SheetNames,
            totalRecords: this.debtorsData.length,
            processedAt: new Date().toLocaleString('he-IL')
        };
    }

    /**
     * יצוא נתונים מעובדים ל-Excel
     */
    exportProcessedData() {
        if (!this.debtorsData || this.debtorsData.length === 0) {
            throw new Error("אין נתונים לייצוא");
        }
        
        // הכנת הנתונים לייצוא
        const exportData = this.debtorsData.map(debtor => ({
            'שם הלקוח': debtor.name || '',
            'סכום החוב': this.getDebtAmount(debtor),
            'ימי פיגור': this.getOverdueDays(debtor),
            'רמת סיכון': this.getRiskLevelText(debtor.riskLevel),
            'קטגוריית פיגור': this.getOverdueCategoryText(debtor.overdueCategory),
            'עדיפות': debtor.priority,
            'פעולה מומלצת': debtor.recommendedAction,
            'מקרה בינלאומי': debtor.isInternational ? 'כן' : 'לא',
            'טלפון': debtor.phone || '',
            'כתובת': debtor.address || ''
        }));
        
        // יצירת workbook חדש
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // הוספת הגיליון
        XLSX.utils.book_append_sheet(wb, ws, "נתונים מעובדים");
        
        // הורדת הקובץ
        const fileName = `ניתוח_גבייה_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log("📥 קובץ מעובד יוצא:", fileName);
    }

    /**
     * טקסט רמת סיכון בעברית
     */
    getRiskLevelText(level) {
        return this.riskCategories[level]?.description || level;
    }

    /**
     * טקסט קטגוריית פיגור בעברית
     */
    getOverdueCategoryText(category) {
        const texts = {
            'EXTREME': 'קיצוני - מעל שנה',
            'SEVERE': 'חמור - 6+ חודשים',
            'MODERATE': 'בינוני - 3+ חודשים',
            'RECENT': 'עדכני - חודש אחרון',
            'CURRENT': 'שוטף'
        };
        return texts[category] || category;
    }
}

// הפיכה לזמינה גלובלית
if (typeof window !== 'undefined') {
    window.DebtAnalysisEngine = DebtAnalysisEngine;
}

console.log("✅ מנוע ניתוח החובות (SheetJS Version) מוכן לשימוש");
