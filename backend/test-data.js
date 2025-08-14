const { region_data } = require('./region_data');
const { industry_data } = require('./industry_data');

console.log('Testing data files...');

console.log('Region data type:', typeof region_data);
console.log('Region data is array:', Array.isArray(region_data));
if (Array.isArray(region_data)) {
  console.log('Region data length:', region_data.length);
  if (region_data.length > 0) {
    console.log('First region item:', region_data[0]);
    console.log('First region item keys:', Object.keys(region_data[0]));
  }
}

console.log('\nIndustry data type:', typeof industry_data);
console.log('Industry data is array:', Array.isArray(industry_data));
if (Array.isArray(industry_data)) {
  console.log('Industry data length:', industry_data.length);
  if (industry_data.length > 0) {
    console.log('First 5 industries:', industry_data.slice(0, 5));
  }
}

console.log('\nTest completed successfully!');
