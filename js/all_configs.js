// js/all_configs.js
document.addEventListener('DOMContentLoaded', function() {
    const configList = document.getElementById('config-list');
    const exportButton = document.getElementById('export-configs-btn');
    const clearAllButton = document.getElementById('clear-all-configs-btn');
    
    // API Key and Proposal Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key-btn'); // Assuming you'll add this button
    const generateProposalButton = document.getElementById('generate-proposal-btn');
    const proposalOutputDiv = document.getElementById('proposal-output');
    const proposalStatusDiv = document.getElementById('proposal-status');
    
    const savedConfigStorageKey = 'sudsSavedConfigs';
    const userApiKeyStorageKey = 'sudsUserOpenAiApiKey'; // Key for storing the API key

    let userProvidedApiKey = '';

    // Function to load API key from localStorage
    function loadApiKey() {
        const storedKey = localStorage.getItem(userApiKeyStorageKey);
        if (storedKey) {
            userProvidedApiKey = storedKey;
            apiKeyInput.value = userProvidedApiKey; // Pre-fill if found
        }
    }

    // Function to save API key to localStorage
    function saveUserApiKey() {
        const newKey = apiKeyInput.value.trim();
        if (newKey && (newKey.startsWith('sk-') || newKey.startsWith('sk-proj-'))) { // Basic validation for OpenAI keys
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
    
    // Event listener for Save API Key button (assuming you add one)
    // If you don't have a separate save button, you can implicitly save when "Generate Proposal" is clicked,
    // but a dedicated save button is better UX. For now, we'll rely on the input field's value at generation time.

    // --- Configuration Loading and Management (same as before) ---
    function loadConfigurations() {
        configList.innerHTML = '';
        const storedData = localStorage.getItem(savedConfigStorageKey);
        let configs = [];

        if (storedData) {
            try {
                configs = JSON.parse(storedData);
                if (!Array.isArray(configs)) configs = [];
            } catch (e) {
                console.error("Error parsing saved configurations:", e);
                configList.innerHTML = '<p>Error loading configurations. Data might be corrupted.</p>';
                return;
            }
        }

        if (configs.length === 0) {
            configList.innerHTML = '<p>No product configurations saved yet. Use the configurator tools to save some!</p>';
            exportButton.style.display = 'none';
            clearAllButton.style.display = 'none';
            generateProposalButton.disabled = true;
            return;
        }
        exportButton.style.display = 'inline-block';
        clearAllButton.style.display = 'inline-block';
        generateProposalButton.disabled = false;


        configs.forEach((config, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'config-item';
            listItem.dataset.index = index;

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'config-item-details';

            const nameStrong = document.createElement('strong');
            nameStrong.textContent = config.derived_product_name || config.product_type || 'Unnamed Configuration';
            detailsDiv.appendChild(nameStrong);

            if (config.generated_product_code) {
                const codeP = document.createElement('p');
                codeP.textContent = `Product Code: ${config.generated_product_code}`;
                detailsDiv.appendChild(codeP);
            }
            if (config.savedTimestamp) {
                const timeP = document.createElement('p');
                timeP.className = 'timestamp';
                timeP.textContent = `Saved: ${new Date(config.savedTimestamp).toLocaleString()}`;
                detailsDiv.appendChild(timeP);
            }
            if (config.savedId) {
                const idSP = document.createElement('p');
                idSP.className = 'timestamp';
                idSP.textContent = `Saved ID: ${config.savedId}`;
                detailsDiv.appendChild(idSP);
            }

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
            deleteButton.onclick = function() {
                if (confirm('Are you sure you want to delete this configuration?')) {
                    deleteConfiguration(index);
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

    function deleteConfiguration(indexToDelete) {
        const storedData = localStorage.getItem(savedConfigStorageKey);
        let configs = [];
        if (storedData) {
            try {
                configs = JSON.parse(storedData);
                if (!Array.isArray(configs)) configs = [];
            } catch (e) { /* Do nothing */ }
        }
        configs.splice(indexToDelete, 1);
        localStorage.setItem(savedConfigStorageKey, JSON.stringify(configs));
        loadConfigurations();
    }

    exportButton.addEventListener('click', function() { /* ... (same as before) ... */ });
    clearAllButton.addEventListener('click', function() { /* ... (same as before) ... */ });
    // --- End Configuration Loading and Management ---


    // --- Proposal Generation ---
    generateProposalButton.addEventListener('click', async function() {
        const apiKey = apiKeyInput.value.trim(); // Get API key from input field
        if (!apiKey) {
            alert('Please enter your OpenAI API Key in the input field.');
            apiKeyInput.focus();
            return;
        }
        // Save the entered API key for future sessions if it's valid
        if (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) {
            localStorage.setItem(userApiKeyStorageKey, apiKey);
            userProvidedApiKey = apiKey; // Update state variable
        } else {
            alert('The entered API Key does not look like a valid OpenAI key. Please check and try again.');
            return;
        }


        const storedData = localStorage.getItem(savedConfigStorageKey);
        // ... (rest of the proposal generation logic from the previous response, starting from checking storedData)
        if (!storedData) {
            alert('No configurations found to generate a proposal from.');
            return;
        }

        let configs;
        try {
            configs = JSON.parse(storedData);
            if (!Array.isArray(configs) || configs.length === 0) {
                alert('No configurations found to generate a proposal from.');
                return;
            }
        } catch (e) {
            alert('Could not read saved configurations. Data might be corrupted.');
            return;
        }

        proposalStatusDiv.textContent = 'Generating proposal... Please wait.';
        proposalOutputDiv.textContent = ''; 
        generateProposalButton.disabled = true;

        const configurationsDetails = configs.map(config => { /* ... (same as before) ... */
            let details = `Product Type: ${config.product_type || 'N/A'}\n`;
            details += `Derived Name: ${config.derived_product_name || 'N/A'}\n`;
            details += `Product Code: ${config.generated_product_code || 'N/A'}\n`;
            if (config.catchpit_details) {
                details += `  Catchpit Type: ${config.catchpit_details.catchpit_type || 'N/A'}\n  Depth: ${config.catchpit_details.depth_mm || 'N/A'}mm\n  Pipework: ${config.catchpit_details.pipework_diameter || 'N/A'}\n  Target Pollutant: ${config.catchpit_details.target_pollutant || 'N/A'}\n  Removable Bucket: ${config.catchpit_details.removable_bucket ? 'Yes' : 'No'}\n`;
            } else if (config.chamber_details && config.flow_control_params) { 
                details += `  Chamber Depth: ${config.chamber_details.chamber_depth_mm || 'N/A'}mm\n  Chamber Diameter: ${config.chamber_details.chamber_diameter || 'N/A'}\n  Target Flow: ${config.flow_control_params.target_flow_lps || 'N/A'} L/s\n  Head Height: ${config.flow_control_params.design_head_m || 'N/A'} m\n  Bypass: ${config.flow_control_params.bypass_required ? 'Yes' : 'No'}\n`;
            } else if (config.main_chamber && config.inlets) { 
                details += `  System: ${config.system_type_selection || 'N/A'}\n  Application: ${config.water_application_selection || 'N/A'}\n  Chamber Depth: ${config.main_chamber.chamber_depth_mm || 'N/A'}mm\n  Chamber Diameter: ${config.main_chamber.chamber_diameter || 'N/A'}\n  Inlets (${config.inlets.length}):\n`;
                config.inlets.forEach(inlet => { details += `    - Pos: ${inlet.position}, Size: ${inlet.pipe_size || 'N/A'}, Material: ${inlet.pipe_material || 'N/A'} ${inlet.pipe_material_other ? `(${inlet.pipe_material_other})` : ''}\n`; });
            } else if (config.separator_details) { 
                details += `  Depth: ${config.separator_details.depth_mm || 'N/A'}mm\n  Flow Rate: ${config.separator_details.flow_rate_lps || 'N/A'} L/s\n  Pipework: ${config.separator_details.pipework_diameter || 'N/A'}\n  Size Class: ${config.separator_details.space_available || 'N/A'}\n  Targets: ${(config.separator_details.target_contaminants || []).join(', ')}\n`;
            }
            details += `  Adoptable: ${config.adoptable_status || 'N/A'}\n`;
            if (config.quote_details) { details += `  Estimated Sell Price (inc. ${config.quote_details.profit_markup_percent || 0}% markup): £${config.quote_details.estimated_sell_price?.toFixed(2) || 'N/A'}\n`;}
            return details;
        }).join('\n-------------------------------------\n');


        const systemPrompt = `You are a highly proficient technical sales assistant for SuDS Enviro... (same system prompt as before) ...`; // Keep detailed system prompt
        const userQuery = `Please generate a project proposal based on the following configured SuDS components... (same user query as before) ...`; // Keep detailed user query

        // ***** THIS IS THE CRITICAL LINE TO CHANGE FROM THE PLACEHOLDER *****
        const aiApiEndpoint = 'https://api.openai.com/v1/chat/completions'; 
        // If using Azure OpenAI, it would be something like:
        // const aiApiEndpoint = `https://YOUR_AZURE_RESOURCE_NAME.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT_ID/chat/completions?api-version=2023-07-01-preview`;

        try {
            const requestBody = {
                model: "gpt-4o", 
                messages: [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": userQuery }
                ],
                max_tokens: 3000,
                temperature: 0.6
            };

            const response = await fetch(aiApiEndpoint, { // Now using the correct endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}` // Uses the key from the input field
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse API error response." } }));
                console.error("API Error Response:", errorData);
                throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || response.statusText || "Unknown API error"}`);
            }

            const data = await response.json();
            const proposalText = data.choices?.[0]?.message?.content || "Could not extract proposal text from API response.";
            proposalOutputDiv.textContent = proposalText;
            proposalStatusDiv.textContent = 'Proposal generated successfully!';

        } catch (error) {
            console.error('Error generating proposal:', error);
            proposalOutputDiv.textContent = `Error generating proposal. Please check the console for details. Message: ${error.message}`;
            proposalStatusDiv.textContent = 'Proposal generation failed.';
        } finally {
            generateProposalButton.disabled = false;
        }
    });

    // Initial load of configurations and API key
    loadApiKey(); 
    loadConfigurations();

    window.addEventListener('storage', function(event) {
        if (event.key === savedConfigStorageKey) {
            loadConfigurations();
        }
        if (event.key === userApiKeyStorageKey) { // Also listen for API key changes if modified in another tab
            loadApiKey();
        }
    });
});
