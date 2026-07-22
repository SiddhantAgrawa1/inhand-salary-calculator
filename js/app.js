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
  
  // July Increment Selectors
  const julyIncrement = document.getElementById('julyIncrement');
  const incrementDetails = document.getElementById('incrementDetails');
  const incrementPercentRange = document.getElementById('incrementPercentRange');
  const incrementPercentVal = document.getElementById('incrementPercentVal');
  const incrementPctText = document.getElementById('incrementPctText');
  const monthlyInHandSubtext = document.getElementById('monthlyInHandSubtext');

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

    const isIncrementActive = julyIncrement.checked;
    const incrementPct = parseFloat(incrementPercentRange.value) || 10;

    // Helper to compute monthly components based on a given monthly CTC
    function computeComponentsForCtc(monthlyCtcVal) {
      const mBasic = monthlyCtcVal * (basicPct / 100);
      let mPf = 0;
      if (pfRule === 'capped') {
        mPf = Math.min(mBasic * 0.12, 1800);
      } else {
        mPf = mBasic * 0.12;
      }
      const mGratuity = isGratuityIncluded ? mBasic * (15 / 26) / 12 : 0;
      const mEmployerPf = isEmployerPfIncluded ? mPf : 0;
      const mGross = Math.max(0, monthlyCtcVal - mEmployerPf - mGratuity);
      const mHra = Math.min(mBasic * 0.050, Math.max(0, mGross - mBasic));
      const mSpecial = Math.max(0, mGross - mBasic - mHra);
      return {
        basic: mBasic,
        pf: mPf,
        gratuity: mGratuity,
        gross: mGross,
        hra: mHra,
        special: mSpecial
      };
    }

    let pre, post;
    let actualAnnualCtc = ctc;

    if (isIncrementActive) {
      const monthlyCtc_pre = ctc / 12;
      const monthlyCtc_post = (ctc * (1 + incrementPct / 100)) / 12;
      pre = computeComponentsForCtc(monthlyCtc_pre);
      post = computeComponentsForCtc(monthlyCtc_post);
      actualAnnualCtc = (ctc * 0.25) + (ctc * (1 + incrementPct / 100) * 0.75);
    } else {
      const monthlyCtc = ctc / 12;
      pre = computeComponentsForCtc(monthlyCtc);
      post = pre;
      actualAnnualCtc = ctc;
    }

    // 1. Basic Pay Calculation
    const annualBasic = pre.basic * 3 + post.basic * 9;
    const monthlyBasic = post.basic; // Represent post-increment basic as current

    // 2. Provident Fund (PF) Calculation
    const annualEmployeePf = pre.pf * 3 + post.pf * 9;
    const annualEmployerPf = (isEmployerPfIncluded ? pre.pf : 0) * 3 + (isEmployerPfIncluded ? post.pf : 0) * 9;
    const monthlyEmployeePf = post.pf; // Represent post-increment PF as current

    // 3. Gratuity Calculation
    const annualGratuity = (isGratuityIncluded ? pre.gratuity : 0) * 3 + (isGratuityIncluded ? post.gratuity : 0) * 9;
    const monthlyGratuity = post.gratuity; // Represent post-increment Gratuity as current

    // 4. Gross Salary Calculation
    const employerPfDeductedFromCtc = isEmployerPfIncluded ? annualEmployerPf : 0;
    const gratuityDeductedFromCtc = isGratuityIncluded ? annualGratuity : 0;

    const annualGross = pre.gross * 3 + post.gross * 9;
    const monthlyGross = post.gross; // Represent post-increment gross as current

    // 5. Component Breakdown (HRA & Special Allowance)
    const annualHra = pre.hra * 3 + post.hra * 9;
    const monthlyHra = post.hra; // Represent post-increment HRA as current

    const annualSpecial = pre.special * 3 + post.special * 9;
    const monthlySpecial = post.special; // Represent post-increment special as current

    // 6. Employee Deductions
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
    const totalAnnualDeductions = annualEmployeePf + annualPt + annualTax;

    const monthlyInHand_pre = Math.max(0, pre.gross - pre.pf - monthlyPt - monthlyTax);
    const monthlyInHand_post = Math.max(0, post.gross - post.pf - monthlyPt - monthlyTax);
    const annualInHand = monthlyInHand_pre * 3 + monthlyInHand_post * 9;
    
    const monthlyInHand = monthlyInHand_post; // Represent post-increment in-hand as main monthly
    const totalMonthlyDeductions = monthlyEmployeePf + monthlyPt + monthlyTax; // Post-increment monthly deductions

    // --- Update DOM UI ---

    // Badges & Labels
    if (isIncrementActive) {
      ctcFormattedBadge.textContent = `${formatLakhs(ctc)} / yr (Base) | Eff: ${formatLakhs(actualAnnualCtc)}`;
    } else {
      ctcFormattedBadge.textContent = `${formatLakhs(ctc)} / yr`;
    }
    basicPercentVal.textContent = `${basicPct}%`;
    monthlyBasicText.textContent = formatINR(monthlyBasic);
    monthlyGratuityText.textContent = formatINR(monthlyGratuity).replace('₹', '');

    // Hero KPI Cards
    monthlyInHandEl.textContent = formatINR(monthlyInHand);
    annualInHandEl.textContent = formatINR(annualInHand);
    totalMonthlyDeductionsEl.textContent = formatINR(totalMonthlyDeductions);

    // Hero Card Subtext for Increment Details
    if (isIncrementActive) {
      monthlyInHandSubtext.style.display = 'block';
      monthlyInHandSubtext.textContent = `Apr-Jun: ${formatINR(monthlyInHand_pre)}/mo | Jul-Mar: ${formatINR(monthlyInHand_post)}/mo`;
    } else {
      monthlyInHandSubtext.style.display = 'none';
      monthlyInHandSubtext.textContent = '';
    }

    // Mini Cards
    employeePfValEl.textContent = formatINR(monthlyEmployeePf);
    gratuityValEl.textContent = formatINR(monthlyGratuity);
    incomeTaxValEl.textContent = formatINR(monthlyTax);

    // Summary Stats
    grossAnnualValEl.textContent = formatINR(annualGross);
    employerPfAnnualValEl.textContent = formatINR(isEmployerPfIncluded ? annualEmployerPf : pre.pf * 3 + post.pf * 9);
    gratuityAnnualValEl.textContent = formatINR(annualGratuity);
    annualDeductionsValEl.textContent = formatINR(totalAnnualDeductions);

    // Table Itemized Breakdown
    const activeCtc = actualAnnualCtc;

    if (isIncrementActive) {
      tbMonthlyBasic.innerHTML = `<div>${formatINR(post.basic)}</div><div class="small text-muted fs-8" style="font-size: 0.75rem;">${formatINR(pre.basic)} (Apr-Jun)</div>`;
      tbMonthlyHra.innerHTML = `<div>${formatINR(post.hra)}</div><div class="small text-muted fs-8" style="font-size: 0.75rem;">${formatINR(pre.hra)} (Apr-Jun)</div>`;
      tbMonthlySpecial.innerHTML = `<div>${formatINR(post.special)}</div><div class="small text-muted fs-8" style="font-size: 0.75rem;">${formatINR(pre.special)} (Apr-Jun)</div>`;
      tbMonthlyGross.innerHTML = `<div>${formatINR(post.gross)}</div><div class="small text-muted fs-8" style="font-size: 0.75rem;">${formatINR(pre.gross)} (Apr-Jun)</div>`;
      tbMonthlyEmployeePf.innerHTML = `<div>- ${formatINR(post.pf)}</div><div class="small text-muted fs-8" style="font-size: 0.75rem;">- ${formatINR(pre.pf)} (Apr-Jun)</div>`;
      tbMonthlyTax.innerHTML = `- ${formatINR(monthlyTax)}`;
      tbMonthlyInHand.innerHTML = `<div>${formatINR(monthlyInHand_post)}</div><div class="small text-muted fs-8" style="font-size: 0.75rem;">${formatINR(monthlyInHand_pre)} (Apr-Jun)</div>`;
    } else {
      tbMonthlyBasic.textContent = formatINR(pre.basic);
      tbMonthlyHra.textContent = formatINR(pre.hra);
      tbMonthlySpecial.textContent = formatINR(pre.special);
      tbMonthlyGross.textContent = formatINR(pre.gross);
      tbMonthlyEmployeePf.textContent = `- ${formatINR(pre.pf)}`;
      tbMonthlyTax.textContent = `- ${formatINR(monthlyTax)}`;
      tbMonthlyInHand.textContent = formatINR(monthlyInHand_pre);
    }

    tbYearlyBasic.textContent = formatINR(annualBasic);
    tbPctBasic.textContent = `${((annualBasic / activeCtc) * 100).toFixed(1)}%`;

    tbYearlyHra.textContent = formatINR(annualHra);
    tbPctHra.textContent = `${((annualHra / activeCtc) * 100).toFixed(1)}%`;

    tbYearlySpecial.textContent = formatINR(annualSpecial);
    tbPctSpecial.textContent = `${((annualSpecial / activeCtc) * 100).toFixed(1)}%`;

    tbYearlyGross.textContent = formatINR(annualGross);
    tbPctGross.textContent = `${((annualGross / activeCtc) * 100).toFixed(1)}%`;

    tbYearlyEmployeePf.textContent = `- ${formatINR(annualEmployeePf)}`;
    tbPctEmployeePf.textContent = `${((annualEmployeePf / activeCtc) * 100).toFixed(1)}%`;

    tbPctPt.textContent = `${((annualPt / activeCtc) * 100).toFixed(1)}%`;

    tbYearlyTax.textContent = `- ${formatINR(annualTax)}`;
    tbPctTax.textContent = `${((annualTax / activeCtc) * 100).toFixed(1)}%`;

    tbYearlyInHand.textContent = formatINR(annualInHand);
    tbPctInHand.textContent = `${((annualInHand / activeCtc) * 100).toFixed(1)}%`;

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

  // July Increment Listeners
  julyIncrement.addEventListener('change', () => {
    if (julyIncrement.checked) {
      incrementDetails.classList.remove('d-none');
    } else {
      incrementDetails.classList.add('d-none');
    }
    calculateSalary();
  });

  incrementPercentRange.addEventListener('input', (e) => {
    const val = e.target.value;
    incrementPercentVal.textContent = `${val}%`;
    incrementPctText.textContent = `${val}%`;
    calculateSalary();
  });

  // Reset Button
  resetBtn.addEventListener('click', () => {
    ctcInput.value = 1200000;
    ctcRange.value = 1200000;
    basicPercentRange.value = 50;
    document.getElementById('pfUncapped').checked = true;
    employerPfInCtc.checked = true;
    gratuityInCtc.checked = true;
    document.getElementById('regimeNew').checked = true;
    julyIncrement.checked = false;
    incrementDetails.classList.add('d-none');
    incrementPercentRange.value = 10;
    incrementPercentVal.textContent = '10%';
    incrementPctText.textContent = '10%';
    updateActivePresetBtn(1200000);
    calculateSalary();
  });

  // Copy Summary Button
  copySummaryBtn.addEventListener('click', () => {
    const ctc = parseFloat(ctcInput.value) || 0;
    const isIncrementActive = julyIncrement.checked;
    const incrementPct = parseFloat(incrementPercentRange.value) || 10;
    const basicPct = parseFloat(basicPercentRange.value) || 50;

    const pfRule = document.querySelector('input[name="pfRule"]:checked')?.value || 'uncapped';
    const isEmployerPfIncluded = employerPfInCtc.checked;
    const isGratuityIncluded = gratuityInCtc.checked;
    const taxRegime = document.querySelector('input[name="taxRegime"]:checked')?.value || 'new';

    function computeComponentsForCtc(monthlyCtcVal) {
      const mBasic = monthlyCtcVal * (basicPct / 100);
      let mPf = 0;
      if (pfRule === 'capped') {
        mPf = Math.min(mBasic * 0.12, 1800);
      } else {
        mPf = mBasic * 0.12;
      }
      const mGratuity = isGratuityIncluded ? mBasic * (15 / 26) / 12 : 0;
      const mEmployerPf = isEmployerPfIncluded ? mPf : 0;
      const mGross = Math.max(0, monthlyCtcVal - mEmployerPf - mGratuity);
      return { basic: mBasic, pf: mPf, gratuity: mGratuity, gross: mGross };
    }

    let pre, post;
    let actualAnnualCtc = ctc;
    if (isIncrementActive) {
      const monthlyCtc_pre = ctc / 12;
      const monthlyCtc_post = (ctc * (1 + incrementPct / 100)) / 12;
      pre = computeComponentsForCtc(monthlyCtc_pre);
      post = computeComponentsForCtc(monthlyCtc_post);
      actualAnnualCtc = (ctc * 0.25) + (ctc * (1 + incrementPct / 100) * 0.75);
    } else {
      const monthlyCtc = ctc / 12;
      pre = computeComponentsForCtc(monthlyCtc);
      post = pre;
    }

    const annualGross = pre.gross * 3 + post.gross * 9;
    let annualTax = 0;
    if (taxRegime === 'new') {
      const taxableIncome = Math.max(0, annualGross - STANDARD_DEDUCTION);
      annualTax = computeNewTaxRegime(taxableIncome);
    }
    const monthlyTax = annualTax / 12;

    const monthlyInHand_pre = Math.max(0, pre.gross - pre.pf - 200 - monthlyTax);
    const monthlyInHand_post = Math.max(0, post.gross - post.pf - 200 - monthlyTax);
    const annualInHand = monthlyInHand_pre * 3 + monthlyInHand_post * 9;

    let summaryText = '';
    if (isIncrementActive) {
      summaryText =
        `Salary In-Hand Breakdown Summary (with July Increment of ${incrementPct}%):
----------------------------------
Base Annual CTC: ${formatINR(ctc)}
Effective Annual CTC: ${formatINR(actualAnnualCtc)}
Monthly In-Hand Take Home (Apr-Jun): ${formatINR(monthlyInHand_pre)}
Monthly In-Hand Take Home (Jul-Mar): ${formatINR(monthlyInHand_post)}
Annual In-Hand Take Home: ${formatINR(annualInHand)}
----------------------------------
Monthly Employee PF (Apr-Jun): ${formatINR(pre.pf)}
Monthly Employee PF (Jul-Mar): ${formatINR(post.pf)}
Monthly Gratuity (Apr-Jun): ${formatINR(pre.gratuity)}
Monthly Gratuity (Jul-Mar): ${formatINR(post.gratuity)}
Monthly Professional Tax (PT): ₹ 200
Monthly Income Tax (TDS): ${formatINR(monthlyTax)}
----------------------------------
Calculated with In-Hand Salary Calculator`;
    } else {
      summaryText =
        `Salary In-Hand Breakdown Summary:
----------------------------------
Annual CTC: ${formatINR(ctc)}
Monthly In-Hand Take Home: ${formatINR(monthlyInHand_pre)}
Annual In-Hand Take Home: ${formatINR(annualInHand)}
----------------------------------
Monthly Employee PF: ${formatINR(pre.pf)}
Monthly Gratuity: ${formatINR(pre.gratuity)}
Monthly Professional Tax (PT): ₹ 200
Monthly Income Tax (TDS): ${formatINR(monthlyTax)}
----------------------------------
Calculated with In-Hand Salary Calculator`;
    }

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
