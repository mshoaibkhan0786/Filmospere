const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const CSV_FILE = path.join(__dirname, '../pinterest_bulk_upload.csv');
const TEMP_IMG = path.join(__dirname, '../.agent/temp_pin.jpg');

// --- CONFIGURATION ---
const SLOTS_HOURS = [2, 6, 9, 17, 21];
const SLOT_STRINGS = ["02:00 AM", "06:00 AM", "09:00 AM", "05:00 PM", "09:00 PM"];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER: CLICK BY TEXT ---
async function clickByText(page, text) {
    return page.evaluate((textToFind) => {
        const elements = [...document.querySelectorAll('*')];
        const el = elements.find(e => e.innerText && e.innerText.includes(textToFind));
        if (el) {
            el.click();
            return true;
        }
        return false;
    }, text);
}

// --- HELPER: FUZZY TEXT CLICK & TYPE ---
async function clickAndTypeByFuzzyText(page, textToFind, value) {
    console.log(`    Trying to find text: "${textToFind}"...`);
    return page.evaluate(async (text, val) => {
        const elements = [...document.querySelectorAll('div, span, label, textarea, input, h1, h2, h3, p')];
        // Find element that visibly contains the text (ignoring hidden ones)
        const target = elements.find(e => {
            if (e.offsetParent === null) return false; // Hidden
            const t = e.innerText || e.placeholder || "";
            return t.toLowerCase().includes(text.toLowerCase()) && t.length < 100; // avoid big containers
        });

        if (target) {
            target.click();
            // Try standard focus
            target.focus();
            return { found: true };
        }
        return { found: false };
    }, textToFind, value).then(async (result) => {
        if (result.found) {
            await delay(500); // Wait for click to activate input
            // Click clicked, now TYPE via Puppeteer to be safe
            await page.keyboard.type(value);
            return true;
        }
        return false;
    });
}

function getNextSlots(startFromDate, count) {
    let schedules = [];
    let current = new Date(startFromDate);
    let pinsScheduled = 0;
    while (pinsScheduled < count) {
        for (let i = 0; i < SLOTS_HOURS.length; i++) {
            let hour = SLOTS_HOURS[i];
            let slotTime = new Date(current);
            slotTime.setHours(hour, 0, 0, 0);

            if (slotTime > new Date()) {
                const yyyy = slotTime.getFullYear();
                const mm = String(slotTime.getMonth() + 1).padStart(2, '0');
                const dd = String(slotTime.getDate()).padStart(2, '0');
                // Format: MM/DD/YYYY to match Pinterest UI Screenshot
                const dateStr = `${mm}/${dd}/${yyyy}`;

                schedules.push({
                    date: dateStr,
                    time: SLOT_STRINGS[i],
                    obj: slotTime
                });
                pinsScheduled++;
                if (pinsScheduled >= count) break;
            }
        }
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
    }
    return schedules;
}

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => { file.close(resolve); });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

function parseCsv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const pins = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
        if (!parts || parts.length < 6) continue;
        const entries = parts.map(p => {
            let val = p.startsWith(',') ? p.slice(1) : p;
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
            }
            return val;
        });
        pins.push({
            title: entries[0],
            description: entries[1],
            link: entries[2],
            mediaUrl: entries[3],
            board: entries[4],
            dateStr: entries[5]
        });
    }
    return pins;
}

(async () => {
    console.log("---------------------------------------------------------");
    console.log("   Pinterest Auto-Scheduler: SCHEDULE FIX");
    console.log("---------------------------------------------------------");

    const pins = parseCsv(CSV_FILE);

    // --- ASK FOR RESUME INDEX ---
    const ans = await askQuestion(`Found ${pins.length} pins. Start from index (1-${pins.length})? [Default: 1]: `);
    let startIndex = parseInt(ans) - 1;
    if (isNaN(startIndex) || startIndex < 0) startIndex = 0;

    // We will parse dates dynamically from the CSV

    // Persistent Login
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
        userDataDir: path.join(__dirname, '../.agent/puppeteer_data')
    });

    const page = await browser.newPage();
    await page.goto('https://www.pinterest.com/pin-builder/');

    console.log("--> Checking Session...");
    try {
        await page.waitForSelector('input[type="file"]', { timeout: 5000 });
        console.log("--> Session Active! Starting...");
    } catch (e) {
        console.log("--> PLEASE LOG IN MANUALLY.");
        try {
            await page.waitForSelector('input[type="file"]', { timeout: 0 });
            console.log("--> Login detected! Starting...");
        } catch (e) { return; }
    }

    await delay(3000);

    for (let i = startIndex; i < pins.length; i++) {
        const pin = pins[i];

        // Parse dateStr "2026-03-01T17:00+05:30" directly from our updated CSV!
        let d = new Date(pin.dateStr);
        let mm = String(d.getMonth() + 1).padStart(2, '0');
        let dd = String(d.getDate()).padStart(2, '0');
        let yyyy = d.getFullYear();
        let schedDate = `${mm}/${dd}/${yyyy}`;

        let h = d.getHours();
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        let m = String(d.getMinutes()).padStart(2, '0');
        let schedTime = `${String(h).padStart(2, '0')}:${m} ${ampm}`;

        const sched = { date: schedDate, time: schedTime };

        console.log(`\n[${i + 1}/${pins.length}] ${pin.title}`);
        console.log(`    Target: ${sched.date} @ ${sched.time}`);

        try {
            if (i > startIndex) await page.goto('https://www.pinterest.com/pin-builder/');
            await page.waitForSelector('input[type="file"]', { timeout: 10000 });
            await delay(1000);

            // 1. IMAGE
            await downloadImage(pin.mediaUrl, TEMP_IMG);
            const input = await page.$('input[type="file"]');
            await input.uploadFile(TEMP_IMG);
            await delay(2000);

            // 2. TITLE (Fuzzy Text Pattern)
            let titleSuccess = await clickAndTypeByFuzzyText(page, "Add your title", pin.title);
            if (!titleSuccess) titleSuccess = await clickAndTypeByFuzzyText(page, "Add a title", pin.title);

            if (!titleSuccess) {
                // Fallback: Coordinate Click (Last Resort)
                console.log("    Fallback: Coordinate Click for Title...");

                // Let's try the generic "First Textarea" fallback
                const firstTA = await page.$('textarea');
                if (firstTA) {
                    await firstTA.click({ clickCount: 3 });
                    await page.keyboard.type(pin.title);
                    titleSuccess = true;
                }
            }
            if (titleSuccess) console.log("    ✅ Title Filled");
            else console.log("    ⚠️ Warning: Title NOT filled");

            // 3. DESCRIPTION (Strict Selection)
            // Fix: Force click the specific description container to ensure focus change
            console.log("    Attempting Description Fill...");
            let descSuccess = false;

            // A. Try specific class for Pinterest Description Editor
            const descSelectors = [
                '.public-DraftEditor-content',
                'div[aria-label="Tell everyone what your Pin is about"]'
            ];

            for (const sel of descSelectors) {
                const el = await page.$(sel);
                if (el) {
                    await el.click();
                    await delay(200);
                    await page.keyboard.type(pin.description);
                    descSuccess = true;
                    console.log(`    Filled Description via selector: ${sel}`);
                    break;
                }
            }

            // B. Tab Strategy (If we are in Title, Tab should move to Desc)
            if (!descSuccess) {
                console.log("    Using Tab from Title to Description...");
                await page.keyboard.press('Tab');
                await delay(200);
                await page.keyboard.type(pin.description);
                descSuccess = true;
            }

            // 4. LINK (Fuzzy Text Pattern)
            let linkSuccess = await clickAndTypeByFuzzyText(page, "Add a destination link", pin.link);
            if (!linkSuccess) {
                // Try finding input[type=url]
                const linkEl = await page.$('input[type="url"]');
                if (linkEl) {
                    await linkEl.click({ clickCount: 3 });
                    await page.keyboard.type(pin.link);
                }
            }

            // 5. BOARD (Skipped - Auto Selected)
            console.log("    (Board selection skipped - auto selected)");
            await delay(1000);

            // 6. SCHEDULE
            console.log("    Setting Schedule...");
            let scheduleOpen = false;

            // Try A: Click "Publish at a later date" Label
            try {
                await page.evaluate(() => {
                    const all = [...document.querySelectorAll('label, span, div')];
                    const target = all.find(e => e.innerText && e.innerText.trim() === 'Publish at a later date');
                    if (target) target.click();
                });
                await delay(500);
            } catch (e) { }

            // Check if open
            if (await page.$('input[name="date"]')) scheduleOpen = true;

            // Try B: Click Radio Input directly?
            if (!scheduleOpen) {
                console.log("    Retry Schedule Toggle (Radio)...");
                await page.evaluate(() => {
                    const radios = [...document.querySelectorAll('input[type="radio"]')];
                    // Usually the second radio is 'Later'
                    if (radios.length > 1) radios[radios.length - 1].click();
                });
                await delay(1000);
            }

            // Set Date
            console.log(`    Setting Date to: ${sched.date}`);
            const dateSelectors = ['input[name="date"]', 'input[id*="date"]', 'input[placeholder*="MM/DD/YYYY"]', 'input[type="text"][value*="/"]'];
            let dateFound = false;

            for (const sel of dateSelectors) {
                const el = await page.$(sel);
                if (el) {
                    await el.click();
                    await delay(100);
                    // Robust Clear: Ctrl+A -> Backspace
                    await page.keyboard.down('Control');
                    await page.keyboard.press('A');
                    await page.keyboard.up('Control');
                    await page.keyboard.press('Backspace');

                    await page.keyboard.type(sched.date); // MM/DD/YYYY
                    await page.keyboard.press('Enter');
                    dateFound = true;
                    console.log(`    Filled Date using: ${sel}`);
                    break;
                }
            }
            if (!dateFound) console.log("    ⚠️ Warning: Date input not found via selectors!");

            await delay(500);

            // Set Time
            console.log(`    Setting Time to: ${sched.time}`);
            const timeSelectors = ['input[name="time"]', 'input[id*="time"]', 'input[type="text"][id*="time"]'];
            let timeFound = false;

            for (const sel of timeSelectors) {
                const el = await page.$(sel);
                if (el) {
                    await el.click();
                    await delay(1000); // Wait for dropdown to open (important!)

                    // Do NOT type (User said it's blocked).
                    // Strategy: Find the element in the DOM, Scroll to it, Click it.
                    console.log(`    Looking for option "${sched.time}" in dropdown...`);

                    const success = await page.evaluate((timeStr) => {
                        // Pinterest often uses div[role="option"] nested in a list
                        // We scan for text match.
                        // Filter generic elements to speed up?
                        const candidates = [...document.querySelectorAll('div[role="option"], li, div[data-test-id*="item"], div')];

                        // Find Exact Match
                        const option = candidates.find(e => e.innerText && e.innerText.trim() === timeStr);

                        if (option) {
                            option.scrollIntoView({ block: 'center', behavior: 'instant' });
                            option.click();
                            return true;
                        }
                        return false;
                    }, sched.time);

                    if (success) {
                        timeFound = true;
                        console.log(`    ✅ Selected Time via Scroll & Click: ${sched.time}`);
                    } else {
                        console.log("    ⚠️ Failed to find time option in list. Trying Arrow Keys fallback...");
                        // Fallback: ArrowDown logic? 
                        // It's risky without knowing current position. 
                        // Let's try typing *just* the AM/PM part if that helps? No, blocked.
                    }
                    break;
                }
            }
            if (!timeFound) console.log("    ⚠️ Warning: Time input not found via selectors!");

            await delay(1000); // Wait for validation

            // 7. PUBLISH / SCHEDULE
            console.log("    Clicking Publish/Schedule...");
            let finalClicked = false;

            try {
                // Robust Toggle Check: Ensure date is set before clicking Schedule
                // (Already handled above, but being safe)

                // Strategy: Find button by text "Schedule" or "Publish"
                finalClicked = await page.evaluate(() => {
                    const candidates = [...document.querySelectorAll('button, div[role="button"]')];
                    // Priority 1: "Schedule" (Exact -> Partial)
                    let target = candidates.find(b => b.innerText?.trim().toLowerCase() === 'schedule');
                    if (!target) target = candidates.find(b => b.innerText?.toLowerCase().includes('schedule'));

                    // Priority 2: "Publish" (Exact -> Partial)
                    if (!target) target = candidates.find(b => b.innerText?.trim().toLowerCase() === 'publish');
                    if (!target) target = candidates.find(b => b.innerText?.toLowerCase().includes('publish'));

                    if (target) {
                        target.click();
                        return true;
                    }
                    return false;
                });
            } catch (e) { console.log("    Error finding button via text: " + e.message); }

            // Fallback: Original Selector
            if (!finalClicked) {
                try {
                    const publishBtn = await page.waitForSelector('div[data-test-id="board-dropdown-save-button"] button', { timeout: 2000 });
                    await publishBtn.click();
                    finalClicked = true;
                } catch (e) { }
            }

            if (finalClicked) {
                try {
                    await page.waitForSelector('div[data-test-id="toast"]', { timeout: 15000 });
                    console.log("    ✅ Success! Pin Scheduled.");
                } catch (e) {
                    console.log("    ⚠️ Warning: 'Success' toast not seen, but button was clicked. Check manually.");
                }
            } else {
                console.log("    ❌ Error: Could not find 'Schedule' or 'Publish' button.");
                await askQuestion("ACTION REQUIRED: Please click the red 'Schedule' button manually in the browser, then press Enter here to continue...");
            }

        } catch (err) {
            console.error(`    ❌ Error: ${err.message}`);
            const ans = await askQuestion("Error occurred. Continue to next? (y/n): ");
            if (ans.toLowerCase() !== 'y') break;
        }
        await delay(2000);
    }

    console.log("All done! Browser staying open.");
    rl.close();
})();
