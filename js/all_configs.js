// js/all_configs.js
document.addEventListener('DOMContentLoaded', function() {
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
    const copyMarkdownButton = document.getElementById('copy-markdown-btn'); // NEW
    const downloadProposalButton = document.getElementById('download-proposal-btn');
    const proposalOutputDiv = document.getElementById('proposal-output');
    const proposalStatusDiv = document.getElementById('proposal-status');

    const projectDataStorageKey = 'sudsUserProjectsData';
    const userApiKeyStorageKey = 'sudsUserOpenAiApiKey';
    const DEFAULT_PROJECT_NAME = "_DEFAULT_PROJECT_";

    let userProvidedApiKey = '';
    let rawMarkdownForDownload = '';
    let currentProjectsData = {};

    function loadApiKey() { /* ... no change ... */
        const storedKey = localStorage.getItem(userApiKeyStorageKey);
        if (storedKey) {
            userProvidedApiKey = storedKey;
            if (apiKeyInput) apiKeyInput.value = userProvidedApiKey;
        }
    }

    function saveUserApiKey() { /* ... no change ... */
        if (!apiKeyInput) return;
        const newKey = apiKeyInput.value.trim();
        if (newKey && (newKey.startsWith('sk-') || newKey.startsWith('sk-proj-'))) {
            localStorage.setItem(userApiKeyStorageKey, newKey);
            userProvidedApiKey = newKey;
            alert('API Key saved successfully!');
        } else if (newKey === "") {
            localStorage.removeItem(userApiKeyStorageKey);
            userProvidedApiKey = "";
            alert('API Key cleared.');
        } else {
            alert('Invalid API Key format. Please enter a valid key (e.g., starting with "sk-").');
        }
    }

    if (saveApiKeyButton) {
        saveApiKeyButton.addEventListener('click', saveUserApiKey);
    }

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

    function displayConfigurationsForSelectedProject() { /* ... no change (ensure copyMarkdownButton is hidden initially here too) ... */
        const selectedProjectName = projectSelectDropdown.value;
        configList.innerHTML = '';

        if (copyMarkdownButton) copyMarkdownButton.style.display = 'none'; // Hide on project change
        if (downloadProposalButton) downloadProposalButton.style.display = 'none'; // Hide on project change


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
            configs.forEach((config, index) => { /* ... list item rendering ... */
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
            if (!selectedProjectName) { alert('Please select a project to clear.'); return; } // Allow clearing even if project array is empty but key exists
            if (confirm(`Are you sure you want to delete ALL configurations for project "${selectedProjectName}"? This cannot be undone.`)) {
                if (currentProjectsData[selectedProjectName]) { // Check if project actually exists
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
            const apiKey = apiKeyInput.value.trim();

            // Initial UI setup for generation
            if (proposalStatusDiv) proposalStatusDiv.textContent = 'Preparing to generate...';
            if (proposalOutputDiv) proposalOutputDiv.innerHTML = '';
            if (downloadProposalButton) downloadProposalButton.style.display = 'none';
            if (copyMarkdownButton) copyMarkdownButton.style.display = 'none'; // Hide copy button initially
            // generateProposalButton.disabled = true; // Disabled at the end of try/finally

            if (!selectedProjectName) { /* ... (validation - no change) ... */ alert('Please select a project...'); return;}
            if (!apiKey) { /* ... (validation - no change) ... */ alert('Please enter API key...'); return;}
            // ... (API key format validation - no change) ...

            const configsForProposal = currentProjectsData[selectedProjectName];
            if (!configsForProposal || configsForProposal.length === 0) { /* ... (validation - no change) ... */ alert('No configurations found...'); return;}

            const propCustomerName = customerNameInput.value.trim() || "[Client Name/Company Placeholder]";
            const propProjectName = projectNameInput.value.trim() || "[Project Name/Location Placeholder]";
            const propProjectNotes = projectNotesInput.value.trim();

            if (proposalStatusDiv) proposalStatusDiv.textContent = 'Generating proposal... Please wait.';
            generateProposalButton.disabled = true; // Disable while generating

            // configurationsDetails and totalEstimatedSellPrice calculation (no change)
            const configurationsDetails = configsForProposal.map(config => {
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
            const totalEstimatedSellPrice = configsForProposal.reduce((sum, conf) => sum + (conf.quote_details?.estimated_sell_price || 0), 0).toFixed(2);

            const systemPrompt = `You are an expert technical sales proposal writer for SuDS Enviro... (rest of your prompt, ensure placeholders {{CUSTOMER_NAME}}, {{PROJECT_NAME}}, {{PROJECT_NOTES}} are used, and Total Estimated Project Investment uses £${totalEstimatedSellPrice})`;
            // ... (full system prompt as before)

            const userQuery = `
            Customer Name/Company: ${propCustomerName}
            Project Name/Location: ${propProjectName}
            Additional Project Notes: ${propProjectNotes || "None provided."}

            Please generate a project proposal using the system prompt's structure and the product data below.
            Ensure all placeholders like {{CUSTOMER_NAME}}, {{PROJECT_NAME}}, and {{PROJECT_NOTES}} in the system prompt template are correctly filled with the information provided above.

            **Configured Product Data for project "${selectedProjectName}":**
            ${configurationsDetails}
            `;

            const aiApiEndpoint = 'https://api.openai.com/v1/chat/completions';
            try {
                const requestBody = { /* ... */ }; // Same as before
                const response = await fetch(aiApiEndpoint, { /* ... */ }); // Same as before
                // ... (API fetch logic - same as before)
                if (!response.ok) { const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse API error." } })); throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`); }
                const data = await response.json();
                rawMarkdownForDownload = data.choices?.[0]?.message?.content || "Could not extract proposal text.";

                if (rawMarkdownForDownload && rawMarkdownForDownload !== "Could not extract proposal text from API response.") {
                    if (typeof marked !== 'undefined' && proposalOutputDiv) { proposalOutputDiv.innerHTML = marked.parse(rawMarkdownForDownload); }
                    else if (proposalOutputDiv) { proposalOutputDiv.textContent = rawMarkdownForDownload; } // Fallback
                    if(proposalStatusDiv) proposalStatusDiv.textContent = 'Proposal generated successfully!';
                    if(downloadProposalButton) downloadProposalButton.style.display = 'inline-block';
                    if(copyMarkdownButton) copyMarkdownButton.style.display = 'inline-block'; // Show copy button
                } else {
                    if(proposalStatusDiv) proposalStatusDiv.textContent = 'Failed to generate valid proposal content from AI.';
                    if(downloadProposalButton) downloadProposalButton.style.display = 'none';
                    if(copyMarkdownButton) copyMarkdownButton.style.display = 'none';
                }

            } catch (error) {
                console.error('Error generating proposal:', error);
                if(proposalOutputDiv) proposalOutputDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
                if(proposalStatusDiv) proposalStatusDiv.textContent = 'Proposal generation failed.';
                if(downloadProposalButton) downloadProposalButton.style.display = 'none';
                if(copyMarkdownButton) copyMarkdownButton.style.display = 'none';
            } finally {
                if(generateProposalButton) generateProposalButton.disabled = false;
            }
        });
    }

    // NEW: Event listener for Copy Markdown button
    if (copyMarkdownButton) {
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


    if (downloadProposalButton) { /* ... (no change to download HTML logic itself) ... */
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


    loadApiKey();
    loadInitialData();

    window.addEventListener('storage', function(event) { /* ... no change ... */
        if (event.key === projectDataStorageKey) { loadInitialData(); }
        if (event.key === userApiKeyStorageKey) loadApiKey();
    });
});
