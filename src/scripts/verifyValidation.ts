    
import { formatDuration, getDurationInMinutes } from '../utils/formatUtils';

const testCases = [
    { input: '2h 11m', expectedMinutes: 131, expectedFormat: '2h 11m' },
    { input: '1h 5m', expectedMinutes: 65, expectedFormat: '1h 5m' },
    { input: '45 min', expectedMinutes: 45, expectedFormat: '45m' },
    { input: '130', expectedMinutes: 130, expectedFormat: '2h 10m' },
    { input: '2h', expectedMinutes: 120, expectedFormat: '2h' },
    { input: undefined, expectedMinutes: 0, expectedFormat: 'N/A' },
];

let failed = false;

testCases.forEach(({ input, expectedMinutes, expectedFormat }) => {
    const minutes = getDurationInMinutes(input);
    const formatted = formatDuration(input);

    console.log(`Input: "${input}"`);
    console.log(`  Expected Minutes: ${expectedMinutes}, Got: ${minutes}`);
    console.log(`  Expected Format: "${expectedFormat}", Got: "${formatted}"`);

    if (minutes !== expectedMinutes || formatted !== expectedFormat) {
        console.error('  FAILED');
        failed = true;
    } else {
        console.log('  PASSED');
    }
});

if (failed) process.exit(1);
