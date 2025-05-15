// js/all_configs.js
document.addEventListener('DOMContentLoaded', function() {
    const configList = document.getElementById('config-list');
    const projectSelectDropdown = document.getElementById('project-select');
    const exportProjectButton = document.getElementById('export-project-configs-btn'); // Renamed
    const clearProjectButton = document.getElementById('clear-project-configs-btn');   // Renamed
    const clearAllProjectDataButton = document.getElementById('clear-all-project-data-btn'); // New button

    // Proposal Specific Inputs
    const customerNameInput = document.getElementById('customer-name');
    const projectNameInput = document.getElementById('project-name');
    const projectNotesInput = document.getElementById('project-notes');

    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key-btn');
    const generateProposalButton = document.getElementById('generate-proposal-btn');
    const proposalOutputDiv = document.getElementById('proposal-output');
    const proposalStatusDiv = document.getElementById('proposal-status');
    const downloadProposalButton = document.getElementById('download-proposal-btn');

    const projectDataStorageKey = 'sudsUserProjectsData'; // Changed key
    const userApiKeyStorageKey = 'sudsUserOpenAiApiKey';
    const DEFAULT_PROJECT_NAME = "_DEFAULT_PROJECT_"; // Consistent with configurators


    let userProvidedApiKey = '';
    let rawMarkdownForDownload = '';
    let currentProjectsData = {}; // To store all loaded project data

    function loadApiKey() {
        const storedKey = localStorage.getItem(userApiKeyStorageKey);
        if (storedKey) {
            userProvidedApiKey = storedKey;
            if (apiKeyInput) apiKeyInput.value = userProvidedApiKey;
        }
    }

    function saveUserApiKey() {
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

    function populateProjectSelector() {
        projectSelectDropdown.innerHTML = '<option value="">-- Select a Project --</option>'; // Reset
        const projectNames = Object.keys(currentProjectsData);

        if (projectNames.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No projects found";
            option.disabled = true;
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

    function displayConfigurationsForSelectedProject() {
        const selectedProjectName = projectSelectDropdown.value;
        configList.innerHTML = ''; // Clear previous list

        if (!selectedProjectName || !currentProjectsData[selectedProjectName]) {
            configList.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">Please select a project to view its configurations.</p>';
            if (exportProjectButton) exportProjectButton.disabled = true;
            if (clearProjectButton) clearProjectButton.disabled = true;
            if (generateProposalButton) generateProposalButton.disabled = true;
            customerNameInput.value = ''; // Clear proposal fields
            projectNameInput.value = '';
            return;
        }

        const configs = currentProjectsData[selectedProjectName];

        if (configs.length === 0) {
            configList.innerHTML = `<p style="text-align: center; color: #666; margin: 20px 0;">No configurations saved for project: ${selectedProjectName}.</p>`;
            if (exportProjectButton) exportProjectButton.disabled = false; // Can still export empty project or clear it
            if (clearProjectButton) clearProjectButton.disabled = false;
            if (generateProposalButton) generateProposalButton.disabled = true; // Can't generate proposal for empty project
        } else {
            if (exportProjectButton) exportProjectButton.disabled = false;
            if (clearProjectButton) clearProjectButton.disabled = false;
            if (generateProposalButton) generateProposalButton.disabled = false;

            configs.forEach((config, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'config-item';
                // Store project name and index for deletion
                listItem.dataset.projectName = selectedProjectName;
                listItem.dataset.index = index;

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'config-item-details';
                const nameStrong = document.createElement('strong');
                nameStrong.textContent = config.derived_product_name || config.product_type || 'Unnamed Configuration';
                detailsDiv.appendChild(nameStrong);
                if (config.generated_product_code) { const codeP = document.createElement('p'); codeP.textContent = `Product Code: ${config.generated_product_code}`; detailsDiv.appendChild(codeP); }
                if (config.savedTimestamp) { const timeP = document.createElement('p'); timeP.className = 'timestamp'; timeP.textContent = `Saved: ${new Date(config.savedTimestamp).toLocaleString()}`; detailsDiv.appendChild(timeP); }
                if (config.savedId) { const idSP = document.createElement('p'); idSP.className = 'timestamp'; idSP.textContent = `Saved ID: ${config.savedId}`; detailsDiv.appendChild(idSP); }

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'config-item-actions';
                const viewDetailsButton = document.createElement('button');
                viewDetailsButton.textContent = 'View Details';
                viewDetailsButton.className = 'view-details-btn';
                viewDetailsButton.onclick = function() {
                    const pre = listItem.querySelector('pre');
                    if (pre) pre.style.display = pre.style.display === 'none' ? 'block' : 'none';
                };
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete-btn'; // Added for potential specific styling
                deleteButton.onclick = function() {
                    if (confirm(`Are you sure you want to delete this configuration from project "${selectedProjectName}"?`)) {
                        deleteConfiguration(selectedProjectName, index);
                    }
                };
                actionsDiv.appendChild(viewDetailsButton);
                actionsDiv.appendChild(deleteButton);

                const detailsPre = document.createElement('pre');
                detailsPre.textContent = JSON.stringify(config, null, 2);
                listItem.appendChild(detailsDiv);
                listItem.appendChild(actionsDiv);
                listItem.appendChild(detailsPre);
                configList.appendChild(listItem);
            });
        }
        // Pre-fill proposal customer/project name based on selected project
        // Simple split by " - " if that's your convention, otherwise just use full project name
        if (selectedProjectName && selectedProjectName !== DEFAULT_PROJECT_NAME) {
            const parts = selectedProjectName.split(" - ");
            customerNameInput.value = parts[0] || selectedProjectName; // Default to full name if no " - "
            projectNameInput.value = parts[1] || (parts[0] ? '' : selectedProjectName); // If only one part, it might be customer or project
        } else if (selectedProjectName === DEFAULT_PROJECT_NAME) {
             customerNameInput.value = ''; // Clear for default project
             projectNameInput.value = 'Default Project';
        } else {
            customerNameInput.value = '';
            projectNameInput.value = '';
        }

    }

    function loadInitialData() {
        const storedData = localStorage.getItem(projectDataStorageKey);
        if (storedData) {
            try {
                currentProjectsData = JSON.parse(storedData);
                if (typeof currentProjectsData !== 'object' || currentProjectsData === null) {
                    currentProjectsData = {};
                }
            } catch (e) {
                console.error("Error parsing project data from localStorage:", e);
                currentProjectsData = {};
            }
        } else {
            currentProjectsData = {};
        }
        populateProjectSelector();
        displayConfigurationsForSelectedProject(); // Display based on initial (likely empty) selection
    }


    function deleteConfiguration(projectName, indexToDelete) {
        if (!currentProjectsData[projectName]) return;

        currentProjectsData[projectName].splice(indexToDelete, 1);

        if (currentProjectsData[projectName].length === 0 && projectName !== DEFAULT_PROJECT_NAME) {
            // Optionally delete the project key if it becomes empty (unless it's the default)
            // delete currentProjectsData[projectName]; // Be careful with this if user might add to it again
        }
        localStorage.setItem(projectDataStorageKey, JSON.stringify(currentProjectsData));
        // No need to re-populate selector, just re-display configs for current project
        displayConfigurationsForSelectedProject();
        // If the deleted project was the one whose array became empty, might need to refresh selector if you auto-delete keys
        // For now, simpler to just let it be an empty project in the list.
    }

    if (projectSelectDropdown) {
        projectSelectDropdown.addEventListener('change', displayConfigurationsForSelectedProject);
    }

    if (exportProjectButton) {
        exportProjectButton.addEventListener('click', function() {
            const selectedProjectName = projectSelectDropdown.value;
            if (!selectedProjectName || !currentProjectsData[selectedProjectName]) {
                alert('Please select a project with configurations to export.');
                return;
            }
            const dataToExport = {
                [selectedProjectName]: currentProjectsData[selectedProjectName]
            };
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `suds_configs_${selectedProjectName.replace(/\s+/g, '_')}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        });
    }

    if (clearProjectButton) {
        clearProjectButton.addEventListener('click', function() {
            const selectedProjectName = projectSelectDropdown.value;
            if (!selectedProjectName || !currentProjectsData[selectedProjectName]) {
                alert('Please select a project to clear.');
                return;
            }
            if (confirm(`Are you sure you want to delete ALL configurations for project "${selectedProjectName}"? This cannot be undone.`)) {
                if (selectedProjectName === DEFAULT_PROJECT_NAME) {
                     currentProjectsData[DEFAULT_PROJECT_NAME] = []; // Clear array for default
                } else {
                    delete currentProjectsData[selectedProjectName]; // Remove the project key entirely
                }
                localStorage.setItem(projectDataStorageKey, JSON.stringify(currentProjectsData));
                loadInitialData(); // Reload everything to update dropdown and list
            }
        });
    }
    if (clearAllProjectDataButton) {
        clearAllProjectDataButton.addEventListener('click', function() {
            if (confirm("DANGER! Are you absolutely sure you want to delete ALL configurations for ALL projects? This is irreversible!")) {
                if (confirm("SECOND CONFIRMATION: This will wipe all saved project configurations. Proceed?")) {
                    localStorage.removeItem(projectDataStorageKey); // Or set to {}
                    currentProjectsData = {};
                    loadInitialData(); // Reload and show empty state
                    alert("All project data has been cleared.");
                }
            }
        });
    }


    if (generateProposalButton) {
        generateProposalButton.addEventListener('click', async function() {
            const selectedProjectName = projectSelectDropdown.value;
            const apiKey = apiKeyInput.value.trim();

            if (!selectedProjectName) {
                alert('Please select a project to generate a proposal for.');
                projectSelectDropdown.focus();
                return;
            }
            if (!apiKey) {
                alert('Please enter your OpenAI API Key.');
                if(apiKeyInput) apiKeyInput.focus();
                return;
            }
             if ((apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) && apiKey !== userProvidedApiKey) {
                localStorage.setItem(userApiKeyStorageKey, apiKey);
                userProvidedApiKey = apiKey;
            } else if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-') && userProvidedApiKey !== apiKey) { // only error if it's newly entered bad key
                alert('The entered API Key does not look like a valid OpenAI key.');
                return;
            }


            const configsForProposal = currentProjectsData[selectedProjectName];
            if (!configsForProposal || configsForProposal.length === 0) {
                alert(`No configurations found for project "${selectedProjectName}" to include in the proposal.`);
                return;
            }

            // Use the values from the proposal-specific input fields
            const propCustomerName = customerNameInput.value.trim() || "[Client Name/Company Placeholder]";
            const propProjectName = projectNameInput.value.trim() || "[Project Name/Location Placeholder]";
            const propProjectNotes = projectNotesInput.value.trim();

            if (proposalStatusDiv) proposalStatusDiv.textContent = 'Generating proposal... Please wait.';
            if (proposalOutputDiv) proposalOutputDiv.innerHTML = '';
            if (downloadProposalButton) downloadProposalButton.style.display = 'none';
            generateProposalButton.disabled = true;

            const configurationsDetails = configsForProposal.map(config => {
                // ... (same detailed Markdown string generation as before) ...
                let details = `**Product Name:** ${config.derived_product_name || config.product_type || 'N/A'}\n`;
                details += `**Product Code:** ${config.generated_product_code || 'N/A'}\n`;
                if (config.catchpit_details) { /* ... */ }
                else if (config.chamber_details && config.flow_control_params) { /* ... */ }
                else if (config.main_chamber && config.inlets) { /* ... */ }
                else if (config.separator_details) { /* ... */ }
                details += `  * Adoptable Status: ${config.adoptable_status || 'N/A'}\n`;
                if (config.quote_details && typeof config.quote_details.estimated_sell_price === 'number') { details += `  * **Estimated Sell Price:** £${config.quote_details.estimated_sell_price.toFixed(2)}\n`; }
                return details;
            }).join('\n\n---\n\n');

            const totalEstimatedSellPrice = configsForProposal.reduce((sum, conf) => sum + (conf.quote_details?.estimated_sell_price || 0), 0).toFixed(2);

            const systemPrompt = `You are an expert technical sales proposal writer for SuDS Enviro...
    *   **Client Name/Company:** {{CUSTOMER_NAME}}
    *   **Project Name/Location:** {{PROJECT_NAME}}
    *   **Additional Project Notes/Context:** {{PROJECT_NOTES}}
    ...
    ## 6. Total Estimated Project Investment
    The total estimated investment ... is **£${totalEstimatedSellPrice}** ...
    ... rest of the system prompt ...`;

            const userQuery = `
            Customer Name/Company: ${propCustomerName}
            Project Name/Location: ${propProjectName}
            Additional Project Notes: ${propProjectNotes || "None provided."}

            Please generate a project proposal ...
            **Configured Product Data for project "${selectedProjectName}":**
            ${configurationsDetails}
            `;

            const aiApiEndpoint = 'https://api.openai.com/v1/chat/completions';
            try {
                // ... (API fetch logic - same as before) ...
                const requestBody = { model: "gpt-4o", messages: [{ "role": "system", "content": systemPrompt },{ "role": "user", "content": userQuery }], max_tokens: 3500, temperature: 0.5 };
                const response = await fetch(aiApiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userProvidedApiKey}`}, body: JSON.stringify(requestBody)});
                if (!response.ok) { const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse API error." } })); throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`); }
                const data = await response.json();
                rawMarkdownForDownload = data.choices?.[0]?.message?.content || "Could not extract proposal text.";
                if (typeof marked !== 'undefined' && proposalOutputDiv) { proposalOutputDiv.innerHTML = marked.parse(rawMarkdownForDownload); }
                else if (proposalOutputDiv) { proposalOutputDiv.textContent = rawMarkdownForDownload; }
                if(proposalStatusDiv) proposalStatusDiv.textContent = 'Proposal generated successfully!';
                if(downloadProposalButton) downloadProposalButton.style.display = 'inline-block';

            } catch (error) {
                console.error('Error generating proposal:', error);
                if(proposalOutputDiv) proposalOutputDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
                if(proposalStatusDiv) proposalStatusDiv.textContent = 'Proposal generation failed.';
            } finally {
                if(generateProposalButton) generateProposalButton.disabled = false;
            }
        });
    }


    if (downloadProposalButton) { /* ... (same download HTML logic as before, ensure it uses propProjectName for filename) ... */
        downloadProposalButton.addEventListener('click', function() {
            if (!proposalOutputDiv || !rawMarkdownForDownload || rawMarkdownForDownload === "Could not extract proposal text from API response." || rawMarkdownForDownload.startsWith("Error generating proposal")) {
                alert('No valid proposal content to download.'); return;
            }
            const htmlToDownload = `<!DOCTYPE html>...<body>${typeof marked !== 'undefined' ? marked.parse(rawMarkdownForDownload) : '<pre>' + rawMarkdownForDownload + '</pre>'}</body></html>`; // Simplified, use your existing template
            const blob = new Blob([htmlToDownload], { type: 'text/html;charset=utf-8' });
            const today = new Date();
            const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            const filenameProjectPart = projectNameInput.value.trim().replace(/\s+/g, '_') || projectSelectDropdown.value.replace(/\s+/g, '_') || 'General';
            const filename = `SuDS_Enviro_Proposal_${filenameProjectPart}_${dateString}.html`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob); link.download = filename;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            alert('Proposal HTML file ready.');
        });
    }

    // Initial Load
    loadApiKey();
    loadInitialData(); // This populates dropdown and lists configs for initial selection

    window.addEventListener('storage', function(event) {
        if (event.key === projectDataStorageKey) {
             console.log('Project data changed in another tab. Reloading view.');
             loadInitialData(); // Reload if project data changes elsewhere
        }
        if (event.key === userApiKeyStorageKey) loadApiKey();
    });
});
