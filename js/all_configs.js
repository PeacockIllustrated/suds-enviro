// js/all_configs.js
document.addEventListener('DOMContentLoaded', function() {
    // ... (other const declarations and existing functions like saveUserApiKey, populateProjectSelector etc. remain the same) ...
    const configList = document.getElementById('config-list');
    const projectSelectDropdown = document.getElementById('project-select');
    const exportProjectButton = document.getElementById('export-project-configs-btn');
    const clearProjectButton = document.getElementById('clear-project-configs-btn');
    const clearAllProjectDataButton = document.getElementById('clear-all-project-data-btn');

    const customerNameInput = document.getElementById('customer-name');
    const projectNameInput = document.getElementById('project-name');
    const projectNotesInput = document.getElementById('project-notes');

    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key-btn');
    const generateProposalButton = document.getElementById('generate-proposal-btn');
    const copyMarkdownButton = document.getElementById('copy-markdown-btn');
    const downloadProposalButton = document.getElementById('download-proposal-btn');
    const proposalOutputDiv = document.getElementById('proposal-output');
    const proposalStatusDiv = document.getElementById('proposal-status');

    const projectDataStorageKey = 'sudsUserProjectsData';
    const userApiKeyStorageKey = 'sudsUserOpenAiApiKey';
    const DEFAULT_PROJECT_NAME = "_DEFAULT_PROJECT_";

    let userProvidedApiKey = ''; // This will be set by loadApiKey
    let rawMarkdownForDownload = '';
    let currentProjectsData = {};

    function loadApiKey() {
        const storedKey = localStorage.getItem(userApiKeyStorageKey);
        if (storedKey) {
            userProvidedApiKey = storedKey; // Update module-scoped variable
            if (apiKeyInput) {
                apiKeyInput.value = storedKey; // Set the input field value
                console.log("API Key loaded from storage into input field and variable:", storedKey);
            }
        } else {
            userProvidedApiKey = ''; // Ensure it's empty if nothing in storage
            if (apiKeyInput) apiKeyInput.value = ''; // Clear input field
            console.log("No API Key found in storage.");
        }
    }

    function saveUserApiKey() {
        if (!apiKeyInput) return;
        const newKeyFromInput = apiKeyInput.value.trim();
        if (newKeyFromInput && (newKeyFromInput.startsWith('sk-') || newKeyFromInput.startsWith('sk-proj-'))) {
            if (newKeyFromInput.length > 20) { // Basic length check
                localStorage.setItem(userApiKeyStorageKey, newKeyFromInput);
                userProvidedApiKey = newKeyFromInput; // CRITICAL: Update module-scoped variable
                alert('API Key saved successfully!');
                console.log("API Key saved and userProvidedApiKey updated to:", userProvidedApiKey);
            } else {
                alert('API Key appears too short to be valid.');
            }
        } else if (newKeyFromInput === "") {
            localStorage.removeItem(userApiKeyStorageKey);
            userProvidedApiKey = ""; // CRITICAL: Update module-scoped variable
            alert('API Key cleared.');
            console.log("API Key cleared and userProvidedApiKey updated.");
        } else {
            alert('Invalid API Key format. Please enter a valid key.');
        }
    }

    if (saveApiKeyButton) {
        saveApiKeyButton.addEventListener('click', saveUserApiKey);
    }
    // ... (populateProjectSelector, displayConfigurationsForSelectedProject, loadInitialData, deleteConfiguration, export, clear buttons - all remain the same) ...
    function populateProjectSelector() { /* ... no change ... */
        projectSelectDropdown.innerHTML = '<option value="">-- Select a Project --</option>';
        const projectNames = Object.keys(currentProjectsData);
        if (projectNames.length === 0) {
            const option = document.createElement('option');
            option.value = ""; option.textContent = "No projects found"; option.disabled = true;
            projectSelectDropdown.appendChild(option);
            return;
        }
        projectNames.sort().forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name === DEFAULT_PROJECT_NAME ? "Default Project (No Name Specified)" : name;
            projectSelectDropdown.appendChild(option);
        });
    }

    function displayConfigurationsForSelectedProject() { /* ... no change ... */
        const selectedProjectName = projectSelectDropdown.value;
        configList.innerHTML = '';
        if (copyMarkdownButton) copyMarkdownButton.style.display = 'none';
        if (downloadProposalButton) downloadProposalButton.style.display = 'none';
        if (!selectedProjectName || !currentProjectsData[selectedProjectName]) {
            configList.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">Please select a project to view its configurations.</p>';
            if (exportProjectButton) exportProjectButton.disabled = true;
            if (clearProjectButton) clearProjectButton.disabled = true;
            if (generateProposalButton) generateProposalButton.disabled = true;
            customerNameInput.value = '';
            projectNameInput.value = '';
            return;
        }
        const configs = currentProjectsData[selectedProjectName];
        if (configs.length === 0) {
            configList.innerHTML = `<p style="text-align: center; color: #666; margin: 20px 0;">No configurations saved for project: ${selectedProjectName}.</p>`;
            if (exportProjectButton) exportProjectButton.disabled = false;
            if (clearProjectButton) clearProjectButton.disabled = false;
            if (generateProposalButton) generateProposalButton.disabled = true;
        } else {
            if (exportProjectButton) exportProjectButton.disabled = false;
            if (clearProjectButton) clearProjectButton.disabled = false;
            if (generateProposalButton) generateProposalButton.disabled = false;
            configs.forEach((config, index) => {
                const listItem = document.createElement('li'); listItem.className = 'config-item';
                listItem.dataset.projectName = selectedProjectName; listItem.dataset.index = index;
                const detailsDiv = document.createElement('div'); detailsDiv.className = 'config-item-details';
                const nameStrong = document.createElement('strong'); nameStrong.textContent = config.derived_product_name || config.product_type || 'Unnamed Configuration'; detailsDiv.appendChild(nameStrong);
                if (config.generated_product_code) { const codeP = document.createElement('p'); codeP.textContent = `Product Code: ${config.generated_product_code}`; detailsDiv.appendChild(codeP); }
                if (config.savedTimestamp) { const timeP = document.createElement('p'); timeP.className = 'timestamp'; timeP.textContent = `Saved: ${new Date(config.savedTimestamp).toLocaleString()}`; detailsDiv.appendChild(timeP); }
                if (config.savedId) { const idSP = document.createElement('p'); idSP.className = 'timestamp'; idSP.textContent = `Saved ID: ${config.savedId}`; detailsDiv.appendChild(idSP); }
                const actionsDiv = document.createElement('div'); actionsDiv.className = 'config-item-actions';
                const viewDetailsButton = document.createElement('button'); viewDetailsButton.textContent = 'View Details'; viewDetailsButton.className = 'view-details-btn';
                viewDetailsButton.onclick = function() { const pre = listItem.querySelector('pre'); if (pre) pre.style.display = pre.style.display === 'none' ? 'block' : 'none'; };
                const deleteButton = document.createElement('button'); deleteButton.textContent = 'Delete'; deleteButton.className = 'delete-btn';
                deleteButton.onclick = function() { if (confirm(`Are you sure you want to delete this configuration from project "${selectedProjectName}"?`)) { deleteConfiguration(selectedProjectName, index); } };
                actionsDiv.appendChild(viewDetailsButton); actionsDiv.appendChild(deleteButton);
                const detailsPre = document.createElement('pre'); detailsPre.textContent = JSON.stringify(config, null, 2);
                listItem.appendChild(detailsDiv); listItem.appendChild(actionsDiv); listItem.appendChild(detailsPre); configList.appendChild(listItem);
            });
        }
        if (selectedProjectName && selectedProjectName !== DEFAULT_PROJECT_NAME) {
            const parts = selectedProjectName.split(" - ");
            customerNameInput.value = parts[0] || selectedProjectName;
            projectNameInput.value = parts[1] || (parts[0] ? '' : selectedProjectName);
        } else if (selectedProjectName === DEFAULT_PROJECT_NAME) {
             customerNameInput.value = '';
             projectNameInput.value = 'Default Project';
        } else {
            customerNameInput.value = '';
            projectNameInput.value = '';
        }
    }

    function loadInitialData() { /* ... no change ... */
        const storedData = localStorage.getItem(projectDataStorageKey);
        if (storedData) {
            try { currentProjectsData = JSON.parse(storedData); if (typeof currentProjectsData !== 'object' || currentProjectsData === null) { currentProjectsData = {}; } }
            catch (e) { console.error("Error parsing project data from localStorage:", e); currentProjectsData = {}; }
        } else { currentProjectsData = {}; }
        populateProjectSelector();
        displayConfigurationsForSelectedProject();
    }

    function deleteConfiguration(projectName, indexToDelete) { /* ... no change ... */
        if (!currentProjectsData[projectName]) return;
        currentProjectsData[projectName].splice(indexToDelete, 1);
        localStorage.setItem(projectDataStorageKey, JSON.stringify(currentProjectsData));
        displayConfigurationsForSelectedProject();
    }

    if (projectSelectDropdown) { /* ... no change ... */
        projectSelectDropdown.addEventListener('change', displayConfigurationsForSelectedProject);
    }
    if (exportProjectButton) { /* ... no change ... */
        exportProjectButton.addEventListener('click', function() {
            const selectedProjectName = projectSelectDropdown.value;
            if (!selectedProjectName || !currentProjectsData[selectedProjectName]) { alert('Please select a project with configurations to export.'); return; }
            const dataToExport = { [selectedProjectName]: currentProjectsData[selectedProjectName] };
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `suds_configs_${selectedProjectName.replace(/\s+/g, '_')}.json`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
        });
    }
    if (clearProjectButton) { /* ... no change ... */
        clearProjectButton.addEventListener('click', function() {
            const selectedProjectName = projectSelectDropdown.value;
            if (!selectedProjectName) { alert('Please select a project to clear.'); return; }
            if (confirm(`Are you sure you want to delete ALL configurations for project "${selectedProjectName}"? This cannot be undone.`)) {
                if (currentProjectsData[selectedProjectName]) {
                    if (selectedProjectName === DEFAULT_PROJECT_NAME) { currentProjectsData[DEFAULT_PROJECT_NAME] = []; }
                    else { delete currentProjectsData[selectedProjectName]; }
                    localStorage.setItem(projectDataStorageKey, JSON.stringify(currentProjectsData));
                }
                loadInitialData();
            }
        });
    }
    if (clearAllProjectDataButton) { /* ... no change ... */
        clearAllProjectDataButton.addEventListener('click', function() {
            if (confirm("DANGER! Are you absolutely sure you want to delete ALL configurations for ALL projects? This is irreversible!")) {
                if (confirm("SECOND CONFIRMATION: This will wipe all saved project configurations. Proceed?")) {
                    localStorage.removeItem(projectDataStorageKey);
                    currentProjectsData = {};
                    loadInitialData();
                    alert("All project data has been cleared.");
                }
            }
        });
    }

    if (generateProposalButton) {
        generateProposalButton.addEventListener('click', async function() {
            const selectedProjectName = projectSelectDropdown.value;

            if (proposalStatusDiv) proposalStatusDiv.textContent = 'Preparing to generate...';
            if (proposalOutputDiv) proposalOutputDiv.innerHTML = '';
            if (downloadProposalButton) downloadProposalButton.style.display = 'none';
            if (copyMarkdownButton) copyMarkdownButton.style.display = 'none';
            generateProposalButton.disabled = true;

            // --- REFINED API KEY LOGIC ---
            // 1. Prioritize the key currently in the input field if it's valid.
            // 2. Fallback to the module-scoped 'userProvidedApiKey' (loaded from storage).
            let keyFromInput = apiKeyInput.value.trim();
            let keyForApiCall = '';

            if (keyFromInput && (keyFromInput.startsWith('sk-') || keyFromInput.startsWith('sk-proj-')) && keyFromInput.length > 20) {
                keyForApiCall = keyFromInput;
                // If this valid key from input is different from what's in storage (or what was loaded into userProvidedApiKey),
                // then update storage and userProvidedApiKey. This handles the case where a user types/pastes a new key
                // and hits "Generate" without explicitly hitting "Save Key".
                if (keyForApiCall !== userProvidedApiKey) {
                    localStorage.setItem(userApiKeyStorageKey, keyForApiCall);
                    userProvidedApiKey = keyForApiCall;
                    console.log("API Key from input field used and saved/updated:", keyForApiCall);
                } else {
                    console.log("API Key from input field matches stored key:", keyForApiCall);
                }
            } else if (userProvidedApiKey && (userProvidedApiKey.startsWith('sk-') || userProvidedApiKey.startsWith('sk-proj-')) && userProvidedApiKey.length > 20) {
                // Input field was empty or invalid, but we have a valid key from storage.
                keyForApiCall = userProvidedApiKey;
                console.log("Using API Key from storage (userProvidedApiKey):", keyForApiCall);
            }

            // Final validation before API call
            if (!keyForApiCall || !(keyForApiCall.startsWith('sk-') || keyForApiCall.startsWith('sk-proj-')) || keyForApiCall.length < 20) {
                alert('A valid OpenAI API Key is required. Please enter it, ensure it starts with "sk-" or "sk-proj-", is of sufficient length, and click "Save Key" if needed.');
                if (apiKeyInput) apiKeyInput.focus();
                generateProposalButton.disabled = false;
                return;
            }
            // --- END REFINED API KEY LOGIC ---

            if (!selectedProjectName) {
                alert('Please select a project to generate a proposal for.');
                projectSelectDropdown.focus();
                generateProposalButton.disabled = false;
                return;
            }

            const configsForProposal = currentProjectsData[selectedProjectName];
            if (!configsForProposal || configsForProposal.length === 0) {
                alert(`No configurations found for project "${selectedProjectName}" to include in the proposal.`);
                generateProposalButton.disabled = false;
                return;
            }

            const propCustomerName = customerNameInput.value.trim() || "[Client Name/Company Placeholder]";
            const propProjectName = projectNameInput.value.trim() || "[Project Name/Location Placeholder]";
            const propProjectNotes = projectNotesInput.value.trim();

            if (proposalStatusDiv) proposalStatusDiv.textContent = 'Generating proposal... Please wait.';

            const configurationsDetails = /* ... (no change) ... */ configsForProposal.map(config => {
                let details = `**Product Name:** ${config.derived_product_name || config.product_type || 'N/A'}\n`;
                details += `**Product Code:** ${config.generated_product_code || 'N/A'}\n`;
                if (config.catchpit_details) { details += `  * Type: ${config.catchpit_details.catchpit_type || 'N/A'}\n  * Depth: ${config.catchpit_details.depth_mm || 'N/A'}mm\n  * Pipework Diameter: ${config.catchpit_details.pipework_diameter || 'N/A'}\n  * Target Pollutant: ${config.catchpit_details.target_pollutant || 'N/A'}\n  * Removable Bucket: ${config.catchpit_details.removable_bucket ? 'Yes' : 'No'}\n`;}
                else if (config.chamber_details && config.flow_control_params) { details += `  * Chamber Depth: ${config.chamber_details.chamber_depth_mm || 'N/A'}mm\n  * Chamber Diameter: ${config.chamber_details.chamber_diameter || 'N/A'}\n  * Target Flow Rate: ${config.flow_control_params.target_flow_lps || 'N/A'} L/s\n  * Design Head Height: ${config.flow_control_params.design_head_m || 'N/A'} m\n  * Bypass Required: ${config.flow_control_params.bypass_required ? 'Yes' : 'No'}\n`;}
                else if (config.main_chamber && config.inlets) { details += `  * System Type: ${config.system_type_selection || 'N/A'}\n  * Water Application: ${config.water_application_selection || 'N/A'}\n  * Chamber Depth: ${config.main_chamber.chamber_depth_mm || 'N/A'}mm\n  * Chamber Diameter: ${config.main_chamber.chamber_diameter || 'N/A'}\n  * Inlets (${config.inlets.length}):\n`; config.inlets.forEach(inlet => { details += `    * Position: ${inlet.position}, Size: ${inlet.pipe_size || 'N/A'}, Material: ${inlet.pipe_material || 'N/A'} ${inlet.pipe_material_other ? `(${inlet.pipe_material_other})` : ''}\n`; });}
                else if (config.separator_details) { details += `  * Depth: ${config.separator_details.depth_mm || 'N/A'}mm\n  * Design Flow Rate: ${config.separator_details.flow_rate_lps || 'N/A'} L/s\n  * Pipework Diameter: ${config.separator_details.pipework_diameter || 'N/A'}\n  * Model Size/Space: ${config.separator_details.space_available || 'N/A'}\n  * Target Contaminants: ${(config.separator_details.target_contaminants || []).join(', ')}\n`;}
                details += `  * Adoptable Status: ${config.adoptable_status || 'N/A'}\n`;
                if (config.quote_details && typeof config.quote_details.estimated_sell_price === 'number') { details += `  * **Estimated Sell Price:** £${config.quote_details.estimated_sell_price.toFixed(2)}\n`; }
                return details;
            }).join('\n\n---\n\n');
            const totalEstimatedSellPrice = /* ... (no change) ... */ configsForProposal.reduce((sum, conf) => sum + (conf.quote_details?.estimated_sell_price || 0), 0).toFixed(2);

            const systemPrompt = `You are an expert technical sales proposal writer for SuDS Enviro... (full prompt with {{CUSTOMER_NAME}}, {{PROJECT_NAME}}, {{PROJECT_NOTES}}, and £${totalEstimatedSellPrice})`;
            const userQuery = `
            Customer Name/Company: ${propCustomerName}
            Project Name/Location: ${propProjectName}
            Additional Project Notes: ${propProjectNotes || "None provided."}
            ...
            **Configured Product Data for project "${selectedProjectName}":**
            ${configurationsDetails}`;

            const aiApiEndpoint = 'https://api.openai.com/v1/chat/completions';
            console.log(">>> Preparing to send API request. Using API Key:", keyForApiCall.substring(0, 10) + "..."); // Log a portion for verification

            try {
                const requestBody = { /* ... */ }; // Same as before
                const response = await fetch(aiApiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${keyForApiCall}` // Use the determined keyForApiCall
                    },
                    body: JSON.stringify(requestBody)
                });
                // ... (rest of the try/catch/finally for API call and response handling - no change)
                if (!response.ok) { const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse API error." } })); throw new Error(`API request failed: ${errorData.error?.message || response.statusText} (Status: ${response.status})`); }
                const data = await response.json();
                rawMarkdownForDownload = data.choices?.[0]?.message?.content || "Could not extract proposal text.";
                if (rawMarkdownForDownload && rawMarkdownForDownload !== "Could not extract proposal text from API response.") {
                    if (typeof marked !== 'undefined' && proposalOutputDiv) { proposalOutputDiv.innerHTML = marked.parse(rawMarkdownForDownload); }
                    else if (proposalOutputDiv) { proposalOutputDiv.textContent = rawMarkdownForDownload; }
                    if(proposalStatusDiv) proposalStatusDiv.textContent = 'Proposal generated successfully!';
                    if(downloadProposalButton) downloadProposalButton.style.display = 'inline-block';
                    if(copyMarkdownButton) copyMarkdownButton.style.display = 'inline-block';
                } else {
                    if(proposalStatusDiv) proposalStatusDiv.textContent = 'Failed to generate valid proposal content from AI.';
                }
            } catch (error) {
                console.error('Error generating proposal:', error);
                if(proposalOutputDiv) proposalOutputDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
                if(proposalStatusDiv) proposalStatusDiv.textContent = 'Proposal generation failed.';
            } finally {
                if(generateProposalButton) generateProposalButton.disabled = false;
            }
        });
    }

    if (copyMarkdownButton) { /* ... no change ... */
        copyMarkdownButton.addEventListener('click', function() {
            if (!rawMarkdownForDownload || rawMarkdownForDownload === "Could not extract proposal text from API response." || rawMarkdownForDownload.startsWith("Error generating proposal")) {
                alert('No valid proposal Markdown to copy. Please generate a proposal first.');
                return;
            }
            navigator.clipboard.writeText(rawMarkdownForDownload).then(function() {
                const originalText = copyMarkdownButton.textContent;
                copyMarkdownButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyMarkdownButton.textContent = originalText;
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy markdown: ', err);
                alert('Failed to copy markdown. Your browser might not support this feature or permissions were denied.');
            });
        });
    }

    if (downloadProposalButton) { /* ... no change ... */
        downloadProposalButton.addEventListener('click', function() {
            if (!proposalOutputDiv || !rawMarkdownForDownload || rawMarkdownForDownload === "Could not extract proposal text from API response." || rawMarkdownForDownload.startsWith("Error generating proposal")) {
                alert('No valid proposal content to download.'); return;
            }
            const htmlToDownload = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>SuDS Enviro Project Proposal</title><style>body{font-family:Arial,sans-serif;line-height:1.6;margin:40px;color:#333}h1,h2,h3,h4,h5,h6{color:#1d80b9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}h1{font-size:26px;margin-bottom:15px;border-bottom:2px solid #1d80b9;padding-bottom:8px}h2{font-size:22px;margin-top:30px;margin-bottom:12px;border-bottom:1px solid #54b54d;padding-bottom:6px}h3{font-size:18px;margin-top:25px;margin-bottom:10px;color:#1a73a8}p{margin-bottom:12px;text-align:justify}ul,ol{margin-left:20px;margin-bottom:12px;padding-left:20px}li{margin-bottom:6px}strong{font-weight:700}em{font-style:italic}hr{border:0;height:1px;background:#ccc;margin:25px 0}blockquote{border-left:4px solid #ddd;padding-left:15px;margin-left:0;color:#555;font-style:italic}pre{background-color:#f7f7f7;padding:15px;border-radius:4px;overflow-x:auto;font-family:'Courier New',Courier,monospace;font-size:13px}code{font-family:'Courier New',Courier,monospace;background-color:#f0f0f0;padding:2px 4px;border-radius:3px;font-size:.9em}pre code{background-color:transparent;padding:0}</style></head><body>${typeof marked !== 'undefined' ? marked.parse(rawMarkdownForDownload) : '<pre>' + rawMarkdownForDownload + '</pre>'}</body></html>`;
            const blob = new Blob([htmlToDownload], { type: 'text/html;charset=utf-8' });
            const today = new Date();
            const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            const filenameProjectPart = projectNameInput.value.trim().replace(/\s+/g, '_') || projectSelectDropdown.value.replace(/\s+/g, '_') || 'General';
            const filename = `SuDS_Enviro_Proposal_${filenameProjectPart}_${dateString}.html`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob); link.download = filename;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            alert('Proposal HTML file ready. You can open this file with Word or import into Google Docs for further editing and saving as .docx.');
        });
    }

    // Initial page setup
    loadApiKey();       // Load API key from storage first
    loadInitialData();  // Then load project data and populate UI

    window.addEventListener('storage', function(event) {
        if (event.key === projectDataStorageKey) {
            console.log('Project data changed in another tab. Reloading view.');
            loadInitialData();
        }
        if (event.key === userApiKeyStorageKey) {
            console.log('API key changed in another tab. Reloading key.');
            loadApiKey(); // Reload the key if it's changed elsewhere
        }
    });
});
