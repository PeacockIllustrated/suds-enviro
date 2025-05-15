// js/all_configs.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Element References
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
    // const copyMarkdownButton = document.getElementById('copy-markdown-btn'); // Temporarily commented out for this test
    const downloadProposalButton = document.getElementById('download-proposal-btn');
    const proposalOutputDiv = document.getElementById('proposal-output');
    const proposalStatusDiv = document.getElementById('proposal-status');

    // localStorage Keys
    const projectDataStorageKey = 'sudsUserProjectsData';
    const userApiKeyStorageKey = 'sudsUserOpenAiApiKey';
    const DEFAULT_PROJECT_NAME = "_DEFAULT_PROJECT_";

    // Module-scoped variables
    let userProvidedApiKey = '';
    let rawMarkdownForDownload = '';
    let currentProjectsData = {};

    // --- API Key Management ---
    function loadApiKey() {
        const storedKey = localStorage.getItem(userApiKeyStorageKey);
        if (storedKey) {
            userProvidedApiKey = storedKey;
            if (apiKeyInput) apiKeyInput.value = storedKey;
        } else {
            userProvidedApiKey = '';
            if (apiKeyInput) apiKeyInput.value = '';
        }
    }

    function saveUserApiKey() {
        if (!apiKeyInput) return;
        const newKeyFromInput = apiKeyInput.value.trim();
        if (newKeyFromInput && (newKeyFromInput.startsWith('sk-') || newKeyFromInput.startsWith('sk-proj-')) && newKeyFromInput.length > 20) {
            localStorage.setItem(userApiKeyStorageKey, newKeyFromInput);
            userProvidedApiKey = newKeyFromInput;
            alert('API Key saved successfully!');
        } else if (newKeyFromInput === "") {
            localStorage.removeItem(userApiKeyStorageKey);
            userProvidedApiKey = "";
            alert('API Key cleared.');
        } else {
            alert('Invalid API Key format or length. Please enter a valid key (e.g., starting with "sk-" or "sk-proj-").');
        }
    }

    if (saveApiKeyButton) {
        saveApiKeyButton.addEventListener('click', saveUserApiKey);
    }

    // --- Project and Configuration Management ---
    function populateProjectSelector() {
        projectSelectDropdown.innerHTML = '<option value="">-- Select a Project --</option>';
        const projectNames = Object.keys(currentProjectsData);
        if (projectNames.length === 0) {
            const option = document.createElement('option');
            option.value = ""; option.textContent = "No projects found"; option.disabled = true;
            projectSelectDropdown.appendChild(option); return;
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
        configList.innerHTML = '';
        // if (copyMarkdownButton) copyMarkdownButton.style.display = 'none'; // Temporarily commented out
        if (downloadProposalButton) downloadProposalButton.style.display = 'none';
        if (proposalStatusDiv) proposalStatusDiv.textContent = '';
        if (proposalOutputDiv) proposalOutputDiv.innerHTML = 'Proposal will appear here once generated...';

        if (!selectedProjectName || !currentProjectsData[selectedProjectName]) {
            configList.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">Please select a project to view its configurations.</p>';
            if (exportProjectButton) exportProjectButton.disabled = true;
            if (clearProjectButton) clearProjectButton.disabled = true;
            if (generateProposalButton) generateProposalButton.disabled = true;
            customerNameInput.value = ''; projectNameInput.value = ''; return;
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
            projectNameInput.value = parts.length > 1 ? parts.slice(1).join(" - ") : (parts[0] ? '' : selectedProjectName);
        } else if (selectedProjectName === DEFAULT_PROJECT_NAME) {
             customerNameInput.value = ''; projectNameInput.value = 'Default Project';
        } else {
            customerNameInput.value = ''; projectNameInput.value = '';
        }
    }

    function loadInitialData() {
        const storedData = localStorage.getItem(projectDataStorageKey);
        if (storedData) {
            try { currentProjectsData = JSON.parse(storedData); if (typeof currentProjectsData !== 'object' || currentProjectsData === null) { currentProjectsData = {}; } }
            catch (e) { console.error("Error parsing project data from localStorage:", e); currentProjectsData = {}; }
        } else { currentProjectsData = {}; }
        populateProjectSelector();
        displayConfigurationsForSelectedProject();
    }

    function deleteConfiguration(projectName, indexToDelete) {
        if (!currentProjectsData[projectName]) return;
        currentProjectsData[projectName].splice(indexToDelete, 1);
        localStorage.setItem(projectDataStorageKey, JSON.stringify(currentProjectsData));
        displayConfigurationsForSelectedProject();
    }

    if (projectSelectDropdown) {
        projectSelectDropdown.addEventListener('change', displayConfigurationsForSelectedProject);
    }
    if (exportProjectButton) { /* ... same as before ... */ }
    if (clearProjectButton) { /* ... same as before ... */ }
    if (clearAllProjectDataButton) { /* ... same as before ... */ }


    // --- REVERTED PROPOSAL GENERATION (NO COPY BUTTON LOGIC YET) ---
    if (generateProposalButton) {
        generateProposalButton.addEventListener('click', async function() {
            // Initial UI Reset for new attempt
            if (proposalStatusDiv) proposalStatusDiv.textContent = '';
            if (proposalOutputDiv) proposalOutputDiv.innerHTML = 'Proposal will appear here once generated...';
            if (downloadProposalButton) downloadProposalButton.style.display = 'none';
            // if (copyMarkdownButton) copyMarkdownButton.style.display = 'none'; // Not yet re-added

            const selectedProjectName = projectSelectDropdown.value;
            let keyFromInput = apiKeyInput.value.trim();
            let keyForApiCall = '';

            // API KEY VALIDATION
            if (keyFromInput && (keyFromInput.startsWith('sk-') || keyFromInput.startsWith('sk-proj-')) && keyFromInput.length > 20) {
                keyForApiCall = keyFromInput;
                if (keyForApiCall !== userProvidedApiKey) {
                    localStorage.setItem(userApiKeyStorageKey, keyForApiCall);
                    userProvidedApiKey = keyForApiCall;
                }
            } else if (userProvidedApiKey && (userProvidedApiKey.startsWith('sk-') || userProvidedApiKey.startsWith('sk-proj-')) && userProvidedApiKey.length > 20) {
                keyForApiCall = userProvidedApiKey;
            }

            if (!keyForApiCall || !(keyForApiCall.startsWith('sk-') || keyForApiCall.startsWith('sk-proj-')) || keyForApiCall.length < 20) {
                alert('A valid OpenAI API Key is required. Please enter it, ensure it starts with "sk-" or "sk-proj-", is of sufficient length, and click "Save Key" if needed.');
                if (apiKeyInput) apiKeyInput.focus();
                return;
            }

            if (!selectedProjectName) {
                alert('Please select a project to generate a proposal for.');
                projectSelectDropdown.focus();
                return;
            }

            const configsForProposal = currentProjectsData[selectedProjectName];
            if (!configsForProposal || configsForProposal.length === 0) {
                alert(`No configurations found for project "${selectedProjectName}" to include in the proposal.`);
                return;
            }

            // Set generating status and disable button AFTER validations
            if (proposalStatusDiv) proposalStatusDiv.textContent = 'Generating proposal... Please wait.';
            generateProposalButton.disabled = true;

            const propCustomerName = customerNameInput.value.trim() || "[Client Name/Company Placeholder]";
            const propProjectName = projectNameInput.value.trim() || "[Project Name/Location Placeholder]";
            const propProjectNotes = projectNotesInput.value.trim();

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

            const systemPrompt = `You are an expert technical sales proposal writer for SuDS Enviro... (Your full system prompt with {{CUSTOMER_NAME}}, {{PROJECT_NAME}}, {{PROJECT_NOTES}}, and £${totalEstimatedSellPrice})`;
            const userQuery = `
            Customer Name/Company: ${propCustomerName}
            Project Name/Location: ${propProjectName}
            Additional Project Notes: ${propProjectNotes || "None provided."}
            ...
            **Configured Product Data for project "${selectedProjectName}":**
            ${configurationsDetails}
            `;
            const aiApiEndpoint = 'https://api.openai.com/v1/chat/completions';
            console.log(">>> Preparing to send API request. Using API Key:", keyForApiCall.substring(0, 10) + "...");

            try {
                const requestBody = { // THIS IS THE CRITICAL PART
                    model: "gpt-4o",
                    messages: [
                        { "role": "system", "content": systemPrompt },
                        { "role": "user", "content": userQuery }
                    ],
                    max_tokens: 3500,
                    temperature: 0.5
                };
                // For debugging the "missing model" error, uncomment the next line:
                // console.log("Request Body being sent to API:", JSON.stringify(requestBody, null, 2));

                const response = await fetch(aiApiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${keyForApiCall}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse API error response." } }));
                    throw new Error(`API request failed: ${errorData.error?.message || response.statusText} (Status: ${response.status})`);
                }

                const data = await response.json();
                rawMarkdownForDownload = data.choices?.[0]?.message?.content || "Could not extract proposal text from API response.";

                if (rawMarkdownForDownload && rawMarkdownForDownload !== "Could not extract proposal text from API response.") {
                    if (typeof marked !== 'undefined' && proposalOutputDiv) { proposalOutputDiv.innerHTML = marked.parse(rawMarkdownForDownload); }
                    else if (proposalOutputDiv) { proposalOutputDiv.textContent = rawMarkdownForDownload; }
                    if(proposalStatusDiv) proposalStatusDiv.textContent = 'Proposal generated successfully!';
                    if(downloadProposalButton) downloadProposalButton.style.display = 'inline-block';
                    // if(copyMarkdownButton) copyMarkdownButton.style.display = 'inline-block'; // Not re-added yet
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


    // --- DOWNLOAD PROPOSAL BUTTON ---
    if (downloadProposalButton) {
        downloadProposalButton.addEventListener('click', function() {
            // ... (Your existing download logic - no changes needed here for the model parameter bug)
            if (!proposalOutputDiv || !rawMarkdownForDownload || rawMarkdownForDownload === "Could not extract proposal text from API response." || rawMarkdownForDownload.startsWith("Error generating proposal")) {
                alert('No valid proposal content to download. Please generate a proposal first.'); return;
            }
            const htmlToDownload = `<!DOCTYPE html>...<body>${typeof marked !== 'undefined' ? marked.parse(rawMarkdownForDownload) : '<pre>' + rawMarkdownForDownload + '</pre>'}</body></html>`;
            const blob = new Blob([htmlToDownload], { type: 'text/html;charset=utf-8' });
            const today = new Date();
            const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            const filenameProjectPart = projectNameInput.value.trim().replace(/[^\w.-]/g, '_') || projectSelectDropdown.value.replace(/[^\w.-]/g, '_') || 'General';
            const filename = `SuDS_Enviro_Proposal_${filenameProjectPart}_${dateString}.html`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob); link.download = filename;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            alert('Proposal HTML file ready.');
        });
    }

    // Initial Page Load
    loadApiKey();
    loadInitialData();

    // Storage Event Listener
    window.addEventListener('storage', function(event) {
        if (event.key === projectDataStorageKey) { loadInitialData(); }
        if (event.key === userApiKeyStorageKey) { loadApiKey(); }
    });
});
