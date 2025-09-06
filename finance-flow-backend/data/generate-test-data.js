const fs = require('fs');

// Generate 18 months of randomized financial data
function generateTestData() {
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

  // Starting values (more realistic progression)
  let currentValues = {
    "Main Checking": 2800,
    "Emergency Fund": 8200,
    "Investment Portfolio": 12000,
    "Travel Fund": 1500
  };

  // More realistic growth patterns with smoother progression
  const growthPatterns = {
    "Main Checking": { baseGrowth: 150, volatility: 0.3, range: 800 },
    "Emergency Fund": { baseGrowth: 350, volatility: 0.15, range: 300 },
    "Investment Portfolio": { baseGrowth: 600, volatility: 0.25, range: 500 },
    "Travel Fund": { baseGrowth: 180, volatility: 0.2, range: 200 }
  };

  const history = [];
  const startDate = new Date('2024-02-29'); // 18 months ago from current

  for (let i = 0; i < 18; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    // Last day of month
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    
    const monthData = {};
    
    // Apply more realistic growth patterns
    Object.keys(currentValues).forEach(category => {
      const pattern = growthPatterns[category];
      
      // Base consistent growth
      let monthlyGrowth = pattern.baseGrowth;
      
      // Add some natural variation
      const variation = (Math.random() - 0.5) * 2 * pattern.volatility * pattern.baseGrowth;
      monthlyGrowth += variation;
      
      // Random fluctuation within range
      const randomFactor = (Math.random() - 0.5) * pattern.range;
      monthlyGrowth += randomFactor;
      
      // Occasional larger movements (less frequent, more realistic)
      if (Math.random() < 0.08) {
        const bigMovement = (Math.random() - 0.4) * pattern.range * 2;
        monthlyGrowth += bigMovement;
      }
      
      // Special handling for checking account (can occasionally go down)
      if (category === "Main Checking" && Math.random() < 0.15) {
        monthlyGrowth = monthlyGrowth * -0.3; // Occasional expenses
      }
      
      currentValues[category] += monthlyGrowth;
      
      // Ensure no negative values but allow smaller amounts
      currentValues[category] = Math.max(500, currentValues[category]);
      
      monthData[category] = Math.round(currentValues[category]);
    });

    history.push({
      date: date.toISOString().split('T')[0],
      data: monthData
    });
  }

  return {
    categories,
    history,
    lastUpdated: new Date().toISOString()
  };
}

// Generate and save the test data
const testData = generateTestData();
fs.writeFileSync('finances-data-test.json', JSON.stringify(testData, null, 2));

console.log('Generated 18 months of randomized test data');
console.log('Date range:', testData.history[0].date, 'to', testData.history[testData.history.length-1].date);
console.log('Final values:', testData.history[testData.history.length-1].data);