        // Import
        document.getElementById('importFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = JSON.parse(evt.target.result);
                    
                    const action = confirm("Do you want to completely REPLACE all your existing data with this backup? (Click 'OK' to REPLACE, or 'Cancel' to carefully MERGE it with your existing data)");
                    
                    let imported = false;
                    
                    if (action) {
                        // Replace All
                        // First wipe existing fg_ keys
                        for (let i = localStorage.length - 1; i >= 0; i--) {
                            const k = localStorage.key(i);
                            if (k.startsWith('fg_')) localStorage.removeItem(k);
                        }
                        // Then set new ones
                        for (const key in data) {
                            if (key.startsWith('fg_')) { localStorage.setItem(key, data[key]); imported = true; }
                        }
                        alert("Backup successfully REPLACED all data.");
                    } else {
                        // Merge Data
                        for (const key in data) {
                            if (key.startsWith('fg_')) {
                                if (key === 'fg_transactions' || key === 'fg_gst_history') {
                                    const existing = JSON.parse(localStorage.getItem(key)) || [];
                                    const newData = JSON.parse(data[key]) || [];
                                    const merged = [...existing, ...newData];
                                    // Sort by date (descending)
                                    if(key === 'fg_transactions') merged.sort((a,b) => new Date(b.date) - new Date(a.date));
                                    localStorage.setItem(key, JSON.stringify(merged));
                                    imported = true;
                                } else {
                                    // Overwrite profile/settings in merge mode
                                    localStorage.setItem(key, data[key]);
                                    imported = true;
                                }
                            }
                        }
                        alert("Backup successfully MERGED with existing data.");
                    }

                    if (imported) {
                        e.target.value = ''; // Reset
                        location.reload();
                    } else {
                        alert("Invalid backup file format.");
                    }
                } catch(err) {
                    alert("Error reading backup file.");
                    console.error(err);
                }
            };
            reader.readAsText(file);
        });
