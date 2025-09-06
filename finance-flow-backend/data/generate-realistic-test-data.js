const fs = require('fs');

// Generate realistic financial data based on actual financial behaviors
function generateRealisticTestData() {
  const categories = [
    {
      "name": "Main Checking",
      "color": "#e07a5f"
    },
    {
      "name": "Emergency Fund", 
      "color": "#f2cc8f"
    },
    {
      "name": "Investment Portfolio",
      "color": "#81b29a"
    },
    {
      "name": "Travel Fund",
      "color": "#f4f1de"
    }
  ];

  // Realistic starting values
  let accounts = {
    "Main Checking": 1800,
    "Emergency Fund": 3200, 
    "Investment Portfolio": 8500,
    "Travel Fund": 800
  };

  // Simulate realistic financial behaviors
  const monthlyNetSalary = 2800; // After tax monthly salary
  const monthlyExpenses = 2200; // Regular monthly expenses
  const emergencyFundTarget = 300; // Monthly emergency fund contribution
  const investmentContribution = 400; // Monthly investment
  const travelSaving = 150; // Monthly travel saving

  const history = [];
  const startDate = new Date('2024-02-29');

  for (let monthIndex = 0; monthIndex < 18; monthIndex++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + monthIndex);
    date.setMonth(date.getMonth() + 1);
    date.setDate(0); // Last day of month
    
    // MAIN CHECKING: Salary in, expenses out, with some variation
    // Salary comes in
    accounts["Main Checking"] += monthlyNetSalary;
    
    // Monthly expenses go out (with 10% variation)
    const actualExpenses = monthlyExpenses * (0.9 + Math.random() * 0.2);
    accounts["Main Checking"] -= actualExpenses;
    
    // Occasional one-off expenses (20% chance)
    if (Math.random() < 0.2) {
      const oneOffExpense = 200 + Math.random() * 500;
      accounts["Main Checking"] -= oneOffExpense;
    }
    
    // Transfer to emergency fund
    const emergencyTransfer = Math.min(emergencyFundTarget, accounts["Main Checking"] - 500);
    if (emergencyTransfer > 0) {
      accounts["Main Checking"] -= emergencyTransfer;
      accounts["Emergency Fund"] += emergencyTransfer;
    }
    
    // Transfer to investments
    const investmentTransfer = Math.min(investmentContribution, accounts["Main Checking"] - 500);
    if (investmentTransfer > 0) {
      accounts["Main Checking"] -= investmentTransfer;
      accounts["Investment Portfolio"] += investmentTransfer;
    }
    
    // Transfer to travel fund
    const travelTransfer = Math.min(travelSaving, accounts["Main Checking"] - 500);
    if (travelTransfer > 0) {
      accounts["Main Checking"] -= travelTransfer;
      accounts["Travel Fund"] += travelTransfer;
    }
    
    // INVESTMENT PORTFOLIO: Market volatility simulation
    const marketReturn = (Math.random() - 0.4) * 0.08; // -4% to +4% monthly (realistic range)
    accounts["Investment Portfolio"] *= (1 + marketReturn);
    
    // EMERGENCY FUND: Occasionally earns small interest
    accounts["Emergency Fund"] *= 1.0025; // 0.25% monthly (3% annual)
    
    // TRAVEL FUND: Occasionally used for trips
    if (Math.random() < 0.1 && accounts["Travel Fund"] > 2000) {
      const tripCost = 800 + Math.random() * 1200;
      accounts["Travel Fund"] -= tripCost;
    }
    
    // Ensure no negative values but realistic minimums
    accounts["Main Checking"] = Math.max(500, accounts["Main Checking"]);
    accounts["Emergency Fund"] = Math.max(0, accounts["Emergency Fund"]);
    accounts["Investment Portfolio"] = Math.max(0, accounts["Investment Portfolio"]);
    accounts["Travel Fund"] = Math.max(0, accounts["Travel Fund"]);

    history.push({
      date: date.toISOString().split('T')[0],
      data: {
        "Main Checking": Math.round(accounts["Main Checking"]),
        "Emergency Fund": Math.round(accounts["Emergency Fund"]),
        "Investment Portfolio": Math.round(accounts["Investment Portfolio"]),
        "Travel Fund": Math.round(accounts["Travel Fund"])
      }
    });
  }

  return {
    categories,
    history,
    lastUpdated: new Date().toISOString()
  };
}

// Generate and save the realistic test data
const testData = generateRealisticTestData();
fs.writeFileSync('finances-data-test.json', JSON.stringify(testData, null, 2));

console.log('Generated realistic 18 months of test data');
console.log('Date range:', testData.history[0].date, 'to', testData.history[testData.history.length-1].date);
console.log('Final values:', testData.history[testData.history.length-1].data);