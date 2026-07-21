/**
 * In-Hand Salary Calculator Logic
 * Includes standard Indian CTC breakdown: Basic, HRA, Special Allowance,
 * Employer PF, Employee PF, Gratuity (4.81%), Professional Tax (₹200/mo),
 * and New Tax Regime FY 2024-25 / FY 2025-26 rules (with ₹75,000 Standard Deduction).
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const ctcInput = document.getElementById('ctcInput');
  const ctcRange = document.getElementById('ctcRange');
  const ctcFormattedBadge = document.getElementById('ctcFormattedBadge');
  const presetBtns = document.querySelectorAll('.preset-btn');

  const basicPercentRange = document.getElementById('basicPercentRange');
  const basicPercentVal = document.getElementById('basicPercentVal');
  const monthlyBasicText = document.getElementById('monthlyBasicText');

  const pfRuleRadios = document.querySelectorAll('input[name="pfRule"]');
  const employerPfInCtc = document.getElementById('employerPfInCtc');
  const gratuityInCtc = document.getElementById('gratuityInCtc');
  const monthlyGratuityText = document.getElementById('monthlyGratuityText');
  const taxRegimeRadios = document.querySelectorAll('input[name="taxRegime"]');

  const resetBtn = document.getElementById('resetBtn');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  // KPI Output Elements
  const monthlyInHandEl = document.getElementById('monthlyInHand');
  const annualInHandEl = document.getElementById('annualInHand');
  const totalMonthlyDeductionsEl = document.getElementById('totalMonthlyDeductions');
  const employeePfValEl = document.getElementById('employeePfVal');
  const gratuityValEl = document.getElementById('gratuityVal');
  const incomeTaxValEl = document.getElementById('incomeTaxVal');

  // Summary Stats Elements
  const grossAnnualValEl = document.getElementById('grossAnnualVal');
  const employerPfAnnualValEl = document.getElementById('employerPfAnnualVal');
  const gratuityAnnualValEl = document.getElementById('gratuityAnnualVal');
  const annualDeductionsValEl = document.getElementById('annualDeductionsVal');

  // Table Row Elements
  const tbMonthlyBasic = document.getElementById('tbMonthlyBasic');
  const tbYearlyBasic = document.getElementById('tbYearlyBasic');
  const tbPctBasic = document.getElementById('tbPctBasic');

  const tbMonthlyHra = document.getElementById('tbMonthlyHra');
  const tbYearlyHra = document.getElementById('tbYearlyHra');
  const tbPctHra = document.getElementById('tbPctHra');

  const tbMonthlySpecial = document.getElementById('tbMonthlySpecial');
  const tbYearlySpecial = document.getElementById('tbYearlySpecial');
  const tbPctSpecial = document.getElementById('tbPctSpecial');

  const tbMonthlyGross = document.getElementById('tbMonthlyGross');
  const tbYearlyGross = document.getElementById('tbYearlyGross');
  const tbPctGross = document.getElementById('tbPctGross');

  const tbMonthlyEmployeePf = document.getElementById('tbMonthlyEmployeePf');
  const tbYearlyEmployeePf = document.getElementById('tbYearlyEmployeePf');
  const tbPctEmployeePf = document.getElementById('tbPctEmployeePf');

  const tbPctPt = document.getElementById('tbPctPt');

  const tbMonthlyTax = document.getElementById('tbMonthlyTax');
  const tbYearlyTax = document.getElementById('tbYearlyTax');
  const tbPctTax = document.getElementById('tbPctTax');

  const tbMonthlyInHand = document.getElementById('tbMonthlyInHand');
  const tbYearlyInHand = document.getElementById('tbYearlyInHand');
  const tbPctInHand = document.getElementById('tbPctInHand');

  // Global Chart Reference
  let salaryChart = null;

  // --- Constants ---
  const PROFESSIONAL_TAX_MONTHLY = 200; // Fixed 200 INR per month
  const PROFESSIONAL_TAX_YEARLY = 2400; // Fixed 2400 INR per year
  const STANDARD_DEDUCTION = 75000;    // New Regime Standard Deduction

  // --- Formatters ---
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatLakhs = (val) => {
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(2)} Lakhs`;
    }
    return formatINR(val);
  };

  // --- Core Salary Calculation Function ---
  function calculateSalary() {
    const ctc = parseFloat(ctcInput.value) || 0;
    const basicPct = parseFloat(basicPercentRange.value) || 50;

    // PF Rule selection
    const pfRule = document.querySelector('input[name="pfRule"]:checked')?.value || 'uncapped';
    const isEmployerPfIncluded = employerPfInCtc.checked;
    const isGratuityIncluded = gratuityInCtc.checked;
    const taxRegime = document.querySelector('input[name="taxRegime"]:checked')?.value || 'new';

    // 1. Basic Pay Calculation
    const annualBasic = ctc * (basicPct / 100);
    const monthlyBasic = annualBasic / 12;

    // 2. Provident Fund (PF) Calculation (12% of Basic, capped or uncapped)
    let monthlyPfPerSide = 0;
    if (pfRule === 'capped') {
      monthlyPfPerSide = Math.min(monthlyBasic * 0.12, 1800);
    } else {
      monthlyPfPerSide = monthlyBasic * 0.12;
    }
    const annualPfPerSide = monthlyPfPerSide * 12;

    // 3. Gratuity Calculation (15/26 of monthly basic per year ≈ 4.80769% of annual basic)
    const annualGratuity = isGratuityIncluded ? annualBasic * (15 / 26) / 12 : 0;
    const monthlyGratuity = annualGratuity / 12;

    // 4. Gross Salary Calculation
    const employerPfDeductedFromCtc = isEmployerPfIncluded ? annualPfPerSide : 0;
    const gratuityDeductedFromCtc = isGratuityIncluded ? annualGratuity : 0;

    const annualGross = Math.max(0, ctc - employerPfDeductedFromCtc - gratuityDeductedFromCtc);
    const monthlyGross = annualGross / 12;

    // 5. Component Breakdown (HRA & Special Allowance)
    // Standard HRA: 5% of Basic pay
    const annualHra = Math.min(annualBasic * 0.050, Math.max(0, annualGross - annualBasic));
    const monthlyHra = annualHra / 12;

    const annualSpecial = Math.max(0, annualGross - annualBasic - annualHra);
    const monthlySpecial = annualSpecial / 12;

    // 6. Employee Deductions
    const monthlyEmployeePf = monthlyPfPerSide;
    const annualEmployeePf = annualPfPerSide;

    const monthlyPt = PROFESSIONAL_TAX_MONTHLY;
    const annualPt = PROFESSIONAL_TAX_YEARLY;

    // 7. Income Tax Calculation (New Tax Regime FY 2024-25 / FY 2025-26)
    let annualTax = 0;
    if (taxRegime === 'new') {
      const taxableIncome = Math.max(0, annualGross - STANDARD_DEDUCTION);
      annualTax = computeNewTaxRegime(taxableIncome);
    } else {
      annualTax = 0; // Exemption / No Tax
    }
    const monthlyTax = annualTax / 12;

    // 8. Net In-Hand Salary
    const totalMonthlyDeductions = monthlyEmployeePf + monthlyPt + monthlyTax;
    const totalAnnualDeductions = annualEmployeePf + annualPt + annualTax;

    const monthlyInHand = Math.max(0, monthlyGross - totalMonthlyDeductions);
    const annualInHand = monthlyInHand * 12;

    // --- Update DOM UI ---

    // Badges & Labels
    ctcFormattedBadge.textContent = `${formatLakhs(ctc)} / yr`;
    basicPercentVal.textContent = `${basicPct}%`;
    monthlyBasicText.textContent = formatINR(monthlyBasic);
    monthlyGratuityText.textContent = formatINR(monthlyGratuity).replace('₹', '');

    // Hero KPI Cards
    monthlyInHandEl.textContent = formatINR(monthlyInHand);
    annualInHandEl.textContent = formatINR(annualInHand);
    totalMonthlyDeductionsEl.textContent = formatINR(totalMonthlyDeductions);

    // Mini Cards
    employeePfValEl.textContent = formatINR(monthlyEmployeePf);
    gratuityValEl.textContent = formatINR(monthlyGratuity);
    incomeTaxValEl.textContent = formatINR(monthlyTax);

    // Summary Stats
    grossAnnualValEl.textContent = formatINR(annualGross);
    employerPfAnnualValEl.textContent = formatINR(annualPfPerSide);
    gratuityAnnualValEl.textContent = formatINR(annualGratuity);
    annualDeductionsValEl.textContent = formatINR(totalAnnualDeductions);

    // Table Itemized Breakdown
    tbMonthlyBasic.textContent = formatINR(monthlyBasic);
    tbYearlyBasic.textContent = formatINR(annualBasic);
    tbPctBasic.textContent = `${((annualBasic / ctc) * 100).toFixed(1)}%`;

    tbMonthlyHra.textContent = formatINR(monthlyHra);
    tbYearlyHra.textContent = formatINR(annualHra);
    tbPctHra.textContent = `${((annualHra / ctc) * 100).toFixed(1)}%`;

    tbMonthlySpecial.textContent = formatINR(monthlySpecial);
    tbYearlySpecial.textContent = formatINR(annualSpecial);
    tbPctSpecial.textContent = `${((annualSpecial / ctc) * 100).toFixed(1)}%`;

    tbMonthlyGross.textContent = formatINR(monthlyGross);
    tbYearlyGross.textContent = formatINR(annualGross);
    tbPctGross.textContent = `${((annualGross / ctc) * 100).toFixed(1)}%`;

    tbMonthlyEmployeePf.textContent = `- ${formatINR(monthlyEmployeePf)}`;
    tbYearlyEmployeePf.textContent = `- ${formatINR(annualEmployeePf)}`;
    tbPctEmployeePf.textContent = `${((annualEmployeePf / ctc) * 100).toFixed(1)}%`;

    tbPctPt.textContent = `${((annualPt / ctc) * 100).toFixed(1)}%`;

    tbMonthlyTax.textContent = `- ${formatINR(monthlyTax)}`;
    tbYearlyTax.textContent = `- ${formatINR(annualTax)}`;
    tbPctTax.textContent = `${((annualTax / ctc) * 100).toFixed(1)}%`;

    tbMonthlyInHand.textContent = formatINR(monthlyInHand);
    tbYearlyInHand.textContent = formatINR(annualInHand);
    tbPctInHand.textContent = `${((annualInHand / ctc) * 100).toFixed(1)}%`;

    // --- Update Chart ---
    updateChartData({
      inHand: annualInHand,
      employeePf: annualEmployeePf,
      employerPf: employerPfDeductedFromCtc,
      gratuity: gratuityDeductedFromCtc,
      pt: annualPt,
      tax: annualTax
    });
  }

  /**
   * New Tax Regime Calculation Slabs (FY 2024-25 / FY 2025-26 Budget Rules)
   * 0 - 3 L: Nil
   * 3 - 7 L: 5%
   * 7 - 10 L: 10%
   * 10 - 12 L: 15%
   * 12 - 15 L: 20%
   * > 15 L: 30%
   * Rebate u/s 87A: Full tax rebate if taxable income <= 7,00,000.
   * Plus 4% Health & Education Cess.
   */
  function computeNewTaxRegime(income) {
    if (income <= 0) return 0;

    // Rebate u/s 87A: If net taxable income <= 12,75,000 (12.75 Lakhs), tax liability is 0
    if (income <= 1275000) {
      return 0;
    }

    let tax = 0;

    if (income > 1500000) {
      tax += (income - 1500000) * 0.30;
      income = 1500000;
    }
    if (income > 1200000) {
      tax += (income - 1200000) * 0.20;
      income = 1200000;
    }
    if (income > 1000000) {
      tax += (income - 1000000) * 0.15;
      income = 1000000;
    }
    if (income > 700000) {
      tax += (income - 700000) * 0.10;
      income = 700000;
    }
    if (income > 300000) {
      tax += (income - 300000) * 0.05;
    }

    // Add 4% Cess
    const totalTaxWithCess = tax + (tax * 0.04);
    return Math.round(totalTaxWithCess);
  }

  // --- Chart.js Initialization & Update ---
  function initChart() {
    const ctx = document.getElementById('salaryChart').getContext('2d');

    salaryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Take-Home Pay', 'Employee PF', 'Employer PF', 'Gratuity', 'Prof. Tax (PT)', 'Income Tax'],
        datasets: [{
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: [
            '#10b981', // Take-Home (Emerald)
            '#6366f1', // Employee PF (Indigo)
            '#06b6d4', // Employer PF (Cyan)
            '#8b5cf6', // Gratuity (Purple)
            '#f59e0b', // PT (Amber)
            '#ef4444'  // Tax (Red)
          ],
          borderWidth: 2,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim() || '#131b2e',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              usePointStyle: true,
              padding: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const val = context.raw || 0;
                return ` ${label}: ${formatINR(val)}`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  function updateChartData({ inHand, employeePf, employerPf, gratuity, pt, tax }) {
    if (!salaryChart) return;

    salaryChart.data.datasets[0].data = [inHand, employeePf, employerPf, gratuity, pt, tax];
    salaryChart.data.datasets[0].borderColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim();
    salaryChart.options.plugins.legend.labels.color = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
    salaryChart.update();
  }

  // --- Event Listeners ---

  // Synchronize CTC Number Input & Range Slider
  ctcInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) || 0;
    ctcRange.value = val;
    updateActivePresetBtn(val);
    calculateSalary();
  });

  ctcRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) || 0;
    ctcInput.value = val;
    updateActivePresetBtn(val);
    calculateSalary();
  });

  // Preset Buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.getAttribute('data-value'));
      ctcInput.value = val;
      ctcRange.value = val;
      updateActivePresetBtn(val);
      calculateSalary();
    });
  });

  function updateActivePresetBtn(currentVal) {
    presetBtns.forEach(b => {
      if (parseFloat(b.getAttribute('data-value')) === currentVal) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // Basic Pay Range Slider
  basicPercentRange.addEventListener('input', calculateSalary);

  // PF & Gratuity Toggles & Radios
  pfRuleRadios.forEach(r => r.addEventListener('change', calculateSalary));
  employerPfInCtc.addEventListener('change', calculateSalary);
  gratuityInCtc.addEventListener('change', calculateSalary);
  taxRegimeRadios.forEach(r => r.addEventListener('change', calculateSalary));

  // Reset Button
  resetBtn.addEventListener('click', () => {
    ctcInput.value = 1200000;
    ctcRange.value = 1200000;
    basicPercentRange.value = 50;
    document.getElementById('pfUncapped').checked = true;
    employerPfInCtc.checked = true;
    gratuityInCtc.checked = true;
    document.getElementById('regimeNew').checked = true;
    updateActivePresetBtn(1200000);
    calculateSalary();
  });

  // Copy Summary Button
  copySummaryBtn.addEventListener('click', () => {
    const ctc = formatINR(ctcInput.value);
    const monthlyTakeHome = monthlyInHandEl.textContent;
    const annualTakeHome = annualInHandEl.textContent;
    const pf = employeePfValEl.textContent;
    const gratuity = gratuityValEl.textContent;
    const pt = "₹ 200";
    const tax = incomeTaxValEl.textContent;

    const summaryText =
      `Salary In-Hand Breakdown Summary:
----------------------------------
Annual CTC: ${ctc}
Monthly In-Hand Take Home: ${monthlyTakeHome}
Annual In-Hand Take Home: ${annualTakeHome}
----------------------------------
Monthly Employee PF: ${pf}
Monthly Gratuity: ${gratuity}
Monthly Professional Tax (PT): ${pt}
Monthly Income Tax (TDS): ${tax}
----------------------------------
Calculated with In-Hand Salary Calculator`;

    navigator.clipboard.writeText(summaryText).then(() => {
      const toastEl = document.getElementById('copyToast');
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  });

  // Theme Toggler
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'light') {
      themeIcon.className = 'bi bi-sun-fill text-warning';
    } else {
      themeIcon.className = 'bi bi-moon-stars-fill';
    }

    if (salaryChart) {
      salaryChart.options.plugins.legend.labels.color = newTheme === 'light' ? '#64748b' : '#94a3b8';
      salaryChart.data.datasets[0].borderColor = newTheme === 'light' ? '#ffffff' : '#131b2e';
      salaryChart.update();
    }
  });

  // Load Saved Theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'light') {
      themeIcon.className = 'bi bi-sun-fill text-warning';
    }
  }

  // Initial Execution
  initChart();
  calculateSalary();
});
