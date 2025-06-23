/**
 * Chart Configuration Module for Collections Dashboard
 * תצורות גרפים מתקדמות לדשבורד גבייה
 * 
 * Features:
 * - RTL Support for Hebrew
 * - Chart.js Integration
 * - Dynamic Data Binding
 * - Interactive Charts
 * - Risk Distribution Charts
 * - Overdue Analysis Charts
 * - Customer Portfolio Charts
 * - Trend Analysis
 * 
 * @version 2.0
 * @author Collections System
 * @date May 2025
 */

// Chart Configuration Class
class ChartManager {
    constructor() {
        this.charts = {};
        this.defaultOptions = this.getDefaultOptions();
        this.colors = this.getColorPalette();
        this.rtlSettings = this.getRTLSettings();
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    // Initialize Chart Manager
    initialize() {
        console.log('📊 Chart Manager initializing...');
        
        // Wait for Chart.js to load
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js not loaded yet, retrying...');
            setTimeout(() => this.initialize(), 500);
            return;
        }

        // Configure Chart.js defaults
        this.configureChartDefaults();
        
        // Register custom plugins
        this.registerCustomPlugins();
        
        console.log('✅ Chart Manager initialized successfully');
    }

    // Get Default Chart Options
    getDefaultOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    rtl: true,
                    textDirection: 'rtl',
                    position: 'top',
                    align: 'center',
                    labels: {
                        font: {
                            family: 'Segoe UI, Tahoma, Arial, sans-serif',
                            size: 12
                        },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    rtl: true,
                    textDirection: 'rtl',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#007bff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: (context) => {
                            return this.formatTooltipLabel(context);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Segoe UI, Tahoma, Arial, sans-serif'
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Segoe UI, Tahoma, Arial, sans-serif'
                        }
                    }
                }
            }
        };
    }

    // Get Color Palette
    getColorPalette() {
        return {
            critical: '#dc3545',    // אדום - קריטי
            high: '#fd7e14',        // כתום - גבוה
            medium: '#ffc107',      // צהוב - בינוני
            low: '#28a745',         // ירוק - נמוך
            primary: '#007bff',     // כחול - ראשי
            secondary: '#6c757d',   // אפור - משני
            success: '#28a745',     // ירוק - הצלחה
            info: '#17a2b8',        // תכלת - מידע
            warning: '#ffc107',     // צהוב - אזהרה
            danger: '#dc3545',      // אדום - סכנה
            gradient: {
                critical: ['#dc3545', '#a71e2a'],
                high: ['#fd7e14', '#dc6610'],
                medium: ['#ffc107', '#e0a800'],
                low: ['#28a745', '#1e7e34'],
                primary: ['#007bff', '#0056b3']
            }
        };
    }

    // Get RTL Settings
    getRTLSettings() {
        return {
            textDirection: 'rtl',
            rtl: true,
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            }
        };
    }

    // Configure Chart.js Defaults
    configureChartDefaults() {
        Chart.defaults.font.family = 'Segoe UI, Tahoma, Arial, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.legend.rtl = true;
        Chart.defaults.plugins.tooltip.rtl = true;
    }

    // Register Custom Plugins
    registerCustomPlugins() {
        // RTL Plugin
        Chart.register({
            id: 'rtlSupport',
            beforeInit: (chart) => {
                if (chart.options.plugins.legend) {
                    chart.options.plugins.legend.rtl = true;
                    chart.options.plugins.legend.textDirection = 'rtl';
                }
                if (chart.options.plugins.tooltip) {
                    chart.options.plugins.tooltip.rtl = true;
                    chart.options.plugins.tooltip.textDirection = 'rtl';
                }
            }
        });

        // Currency Formatter Plugin
        Chart.register({
            id: 'currencyFormatter',
            beforeUpdate: (chart) => {
                if (chart.options.scales && chart.options.scales.y) {
                    chart.options.scales.y.ticks.callback = (value) => {
                        return this.formatCurrency(value);
                    };
                }
            }
        });
    }

    // Create Risk Distribution Chart
    createRiskChart(canvasId = 'riskChart', data = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }

        // Default data if none provided
        if (!data) {
            data = this.getDefaultRiskData();
        }

        const config = {
            type: 'doughnut',
            data: {
                labels: ['קריטי', 'גבוה', 'בינוני', 'נמוך'],
                datasets: [{
                    data: [data.critical || 0, data.high || 0, data.medium || 0, data.low || 0],
                    backgroundColor: [
                        this.colors.critical,
                        this.colors.high,
                        this.colors.medium,
                        this.colors.low
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                ...this.defaultOptions,
                ...this.rtlSettings,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'התפלגות לפי רמת סיכון',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        ...this.defaultOptions.plugins.legend,
                        position: 'bottom'
                    }
                },
                cutout: '60%'
            }
        };

        this.charts.risk = new Chart(canvas, config);
        return this.charts.risk;
    }

    // Create Overdue Distribution Chart
    createOverdueChart(canvasId = 'overdueChart', data = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }

        if (!data) {
            data = this.getDefaultOverdueData();
        }

        const config = {
            type: 'bar',
            data: {
                labels: ['0-30 ימים', '31-60 ימים', '61-90 ימים', '91-180 ימים', '180+ ימים'],
                datasets: [{
                    label: 'סכום (₪)',
                    data: [
                        data.days_0_30 || 0,
                        data.days_31_60 || 0,
                        data.days_61_90 || 0,
                        data.days_91_180 || 0,
                        data.days_180_plus || 0
                    ],
                    backgroundColor: [
                        this.colors.low,
                        this.colors.medium,
                        this.colors.high,
                        this.colors.critical,
                        this.colors.danger
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                ...this.defaultOptions,
                ...this.rtlSettings,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'התפלגות חובות לפי תקופת פיגור',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    ...this.defaultOptions.scales,
                    y: {
                        ...this.defaultOptions.scales.y,
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        };

        this.charts.overdue = new Chart(canvas, config);
        return this.charts.overdue;
    }

    // Create Trend Analysis Chart
    createTrendChart(canvasId = 'trendChart', data = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }

        if (!data) {
            data = this.getDefaultTrendData();
        }

        const config = {
            type: 'line',
            data: {
                labels: data.labels || ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי'],
                datasets: [{
                    label: 'חובות חדשים',
                    data: data.newDebts || [100000, 150000, 120000, 180000, 160000],
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'גבייה',
                    data: data.collections || [80000, 90000, 85000, 95000, 110000],
                    borderColor: this.colors.success,
                    backgroundColor: this.colors.success + '20',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                ...this.defaultOptions,
                ...this.rtlSettings,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'מגמות חובות וגבייה',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    ...this.defaultOptions.scales,
                    y: {
                        ...this.defaultOptions.scales.y,
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        };

        this.charts.trend = new Chart(canvas, config);
        return this.charts.trend;
    }

    // Create Customer Analysis Chart
    createCustomerChart(canvasId = 'customerChart', data = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }

        if (!data) {
            data = this.getDefaultCustomerData();
        }

        const config = {
            type: 'radar',
            data: {
                labels: ['פיגור בתשלומים', 'היקף חוב', 'מספר עסקאות', 'יחס גבייה', 'איכות לקוח'],
                datasets: [{
                    label: 'ממוצע תיק',
                    data: data.portfolio || [60, 70, 80, 75, 65],
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '30',
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colors.primary
                }]
            },
            options: {
                ...this.defaultOptions,
                ...this.rtlSettings,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: true,
                        text: 'ניתוח תיק לקוחות',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        };

        this.charts.customer = new Chart(canvas, config);
        return this.charts.customer;
    }

    // Update Chart Data
    updateChart(chartName, newData) {
        if (!this.charts[chartName]) {
            console.error(`Chart ${chartName} not found`);
            return;
        }

        const chart = this.charts[chartName];
        
        // Update data based on chart type
        if (chartName === 'risk') {
            chart.data.datasets[0].data = [
                newData.critical || 0,
                newData.high || 0,
                newData.medium || 0,
                newData.low || 0
            ];
        } else if (chartName === 'overdue') {
            chart.data.datasets[0].data = [
                newData.days_0_30 || 0,
                newData.days_31_60 || 0,
                newData.days_61_90 || 0,
                newData.days_91_180 || 0,
                newData.days_180_plus || 0
            ];
        }

        chart.update();
    }

    // Update All Charts
    updateAllCharts(analysisResults) {
        if (!analysisResults) {
            console.warn('No analysis results provided for chart update');
            return;
        }

        // Update Risk Chart
        if (analysisResults.riskDistribution) {
            this.updateChart('risk', {
                critical: analysisResults.riskDistribution.CRITICAL || 0,
                high: analysisResults.riskDistribution.HIGH || 0,
                medium: analysisResults.riskDistribution.MEDIUM || 0,
                low: analysisResults.riskDistribution.LOW || 0
            });
        }

        // Update Overdue Chart
        if (analysisResults.overdueDistribution) {
            this.updateChart('overdue', analysisResults.overdueDistribution);
        }

        console.log('📊 All charts updated successfully');
    }

    // Initialize All Charts
    initializeAllCharts(container = 'dashboard-charts') {
        console.log('🎯 Initializing all dashboard charts...');

        // Wait for container
        const chartContainer = document.getElementById(container);
        if (!chartContainer) {
            console.warn(`Chart container ${container} not found`);
            return;
        }

        // Create all charts
        this.createRiskChart();
        this.createOverdueChart();
        this.createTrendChart();
        this.createCustomerChart();

        // Update with real data if available
        if (window.debtAnalysisResults) {
            this.updateAllCharts(window.debtAnalysisResults);
        }

        console.log('✅ All charts initialized successfully');
    }

    // Format Currency
    formatCurrency(value) {
        if (typeof value !== 'number') return value;
        
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    // Format Tooltip Label
    formatTooltipLabel(context) {
        const label = context.label || '';
        const value = context.parsed || context.raw;
        
        if (typeof value === 'number') {
            return `${label}: ${this.formatCurrency(value)}`;
        }
        
        return `${label}: ${value}`;
    }

    // Get Default Risk Data
    getDefaultRiskData() {
        return {
            critical: 3,
            high: 8,
            medium: 15,
            low: 42
        };
    }

    // Get Default Overdue Data
    getDefaultOverdueData() {
        return {
            days_0_30: 500000,
            days_31_60: 300000,
            days_61_90: 200000,
            days_91_180: 150000,
            days_180_plus: 100000
        };
    }

    // Get Default Trend Data
    getDefaultTrendData() {
        return {
            labels: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי'],
            newDebts: [100000, 150000, 120000, 180000, 160000],
            collections: [80000, 90000, 85000, 95000, 110000]
        };
    }

    // Get Default Customer Data
    getDefaultCustomerData() {
        return {
            portfolio: [60, 70, 80, 75, 65]
        };
    }

    // Destroy Chart
    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            delete this.charts[chartName];
        }
    }

    // Destroy All Charts
    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            this.destroyChart(chartName);
        });
    }

    // Resize All Charts
    resizeAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    // Export Chart as Image
    exportChart(chartName, filename = null) {
        if (!this.charts[chartName]) {
            console.error(`Chart ${chartName} not found`);
            return;
        }

        const chart = this.charts[chartName];
        const url = chart.toBase64Image();
        
        // Create download link
        const link = document.createElement('a');
        link.download = filename || `${chartName}-chart.png`;
        link.href = url;
        link.click();
    }

    // Get Chart Statistics
    getChartStats() {
        return {
            totalCharts: Object.keys(this.charts).length,
            activeCharts: Object.keys(this.charts),
            chartTypes: Object.values(this.charts).map(chart => chart.config.type)
        };
    }
}

// Global Instance
window.chartManager = new ChartManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}

// Auto-initialize integration with Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Wait for dashboard to be ready
    if (window.dashboardManager) {
        // Integrate with dashboard refresh
        const originalRefresh = window.dashboardManager.refreshDashboard;
        window.dashboardManager.refreshDashboard = function() {
            originalRefresh.call(this);
            if (window.chartManager) {
                window.chartManager.updateAllCharts(window.debtAnalysisResults);
            }
        };
    }
});

console.log('📊 Chart Configuration Module loaded successfully');
