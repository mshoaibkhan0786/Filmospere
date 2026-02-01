
const TMDB_READ_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGEyZDgzOTlmM2FmOThjNGQyOTBiMmFhYWNjNjAyZSIsIm5iZiI6MTc2NDU2MzAzMi45ODMsInN1YiI6IjY5MmQxODU4ZWQzYTc0MTRiMjUxMWY3YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xUHn1pyh2vlISckJdCh-_r0-Rzx3HCr5xgS1DtK322U';
const CAST_LIMIT = 20;

async function getVerifiedCast() {
    console.log('Fetching Cast...');
    const creditsUrl = 'https://api.themoviedb.org/3/tv/111188/credits?language=en-US';
    const res = await fetch(creditsUrl, { headers: { Authorization: `Bearer ${TMDB_READ_TOKEN}` } });
    const data = await res.json();
    const cast = (data.cast || []).slice(0, CAST_LIMIT);

    const verifiedCast = [];

    for (const member of cast) {
        let finalPath = member.profile_path;

        if (finalPath) {
            // Check default path
            const defaultUrl = `https://image.tmdb.org/t/p/original${finalPath}`;
            const check = await fetch(defaultUrl, { method: 'HEAD' });

            if (!check.ok) {
                console.log(`⚠️  Broken Path for ${member.name}: ${finalPath}. Finding backup...`);

                // Fetch person images
                const imgsRes = await fetch(`https://api.themoviedb.org/3/person/${member.id}/images`, {
                    headers: { Authorization: `Bearer ${TMDB_READ_TOKEN}` }
                });
                const imgsData = await imgsRes.json();
                const profiles = imgsData.profiles || [];

                // Find first working one
                let foundBackup = null;
                for (const p of profiles) {
                    const backupUrl = `https://image.tmdb.org/t/p/original${p.file_path}`;
                    const backupCheck = await fetch(backupUrl, { method: 'HEAD' });
                    if (backupCheck.ok) {
                        foundBackup = p.file_path;
                        break;
                    }
                }

                if (foundBackup) {
                    finalPath = foundBackup;
                    console.log(`✅ Found Backup: ${finalPath}`);
                } else {
                    console.log(`❌ No backup found for ${member.name}.`);
                    finalPath = null;
                }
            } else {
                console.log(`✅ OK: ${member.name}`);
            }
        }

        verifiedCast.push({
            id: `tmdb-person-${member.id}`,
            name: member.name,
            role: member.character,
            imageUrl: finalPath ? `https://wsrv.nl/?url=https://image.tmdb.org/t/p/original${finalPath}` : null
        });
    }

    console.log('\n--- VERIFIED CAST JSON ---');
    console.log(JSON.stringify(verifiedCast, null, 2));
}

getVerifiedCast();
