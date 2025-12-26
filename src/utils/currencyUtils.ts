
// Historical USD to INR Exchange Rates (Approximate Average)
const historicalRates: { [key: number]: number } = {
    1950: 4.76, 1951: 4.76, 1952: 4.76, 1953: 4.76, 1954: 4.76,
    1955: 4.76, 1956: 4.76, 1957: 4.76, 1958: 4.76, 1959: 4.76,
    1960: 4.76, 1961: 4.76, 1962: 4.76, 1963: 4.76, 1964: 4.76,
    1965: 4.76, 1966: 6.36, 1967: 7.50, 1968: 7.50, 1969: 7.50,
    1970: 7.50, 1971: 7.50, 1972: 7.59, 1973: 7.74, 1974: 8.10,
    1975: 8.37, 1976: 8.96, 1977: 8.73, 1978: 8.19, 1979: 8.12,
    1980: 7.86, 1981: 8.65, 1982: 9.45, 1983: 10.09, 1984: 11.36,
    1985: 12.36, 1986: 12.61, 1987: 12.96, 1988: 13.91, 1989: 16.22,
    1990: 17.50, 1991: 22.74, 1992: 25.91, 1993: 30.49, 1994: 31.37,
    1995: 32.42, 1996: 35.43, 1997: 36.31, 1998: 41.25, 1999: 43.05,
    2000: 44.94, 2001: 47.18, 2002: 48.61, 2003: 46.58, 2004: 45.31,
    2005: 44.10, 2006: 45.33, 2007: 41.29, 2008: 43.42, 2009: 48.35,
    2010: 45.72, 2011: 46.67, 2012: 53.44, 2013: 58.59, 2014: 61.02,
    2015: 64.15, 2016: 67.19, 2017: 65.12, 2018: 68.38, 2019: 70.42,
    2020: 74.10, 2021: 73.91, 2022: 78.60, 2023: 82.00, 2024: 83.50
};

const indianLanguages = [
    'hindi', 'tamil', 'telugu', 'malayalam', 'kannada',
    'bengali', 'marathi', 'gujarati', 'punjabi', 'urdu'
];

export const isIndianMovie = (language: string | undefined): boolean => {
    if (!language) return false;
    const lang = language.toLowerCase().trim();
    // Check if primarily one of the indian languages, or includes "India" in origin if we had that data.
    // For now, simpler language check.
    return indianLanguages.some(l => lang.includes(l));
};

export const convertCurrency = (amountStr: string | undefined, year: number, language: string | undefined): string | null => {
    if (!amountStr || !language || !isIndianMovie(language)) return null;

    // 1. Get Exchange Rate
    const rate = historicalRates[year] || historicalRates[2024]; // Fallback to current

    // 2. Parse Amount (e.g., "$100M", "$1.2B", "$500,000")
    let amountInUSD = 0;
    const cleanStr = amountStr.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleanStr);

    if (isNaN(val)) return null;

    if (amountStr.includes('M')) {
        amountInUSD = val * 1000000;
    } else if (amountStr.includes('B')) {
        amountInUSD = val * 1000000000;
    } else if (amountStr.includes('k') || amountStr.includes('K')) {
        amountInUSD = val * 1000;
    } else {
        // Assume raw number if no suffix (rare for our formatted strings but possible)
        amountInUSD = val;
    }

    // 3. Convert to INR
    const amountInINR = amountInUSD * rate;

    // 4. Convert to Crores (1 Crore = 10,000,000)
    const crores = amountInINR / 10000000;

    // 5. Format
    if (crores >= 1) {
        return `₹${crores.toFixed(0)} Cr`;
    }
    // If less than 1 Crore, maybe Lakhs?
    const lakhs = amountInINR / 100000;
    return `₹${lakhs.toFixed(0)} Lakhs`;
};
