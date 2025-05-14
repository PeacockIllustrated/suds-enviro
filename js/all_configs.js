// js/all_configs.js
document.addEventListener('DOMContentLoaded', function() {
    const configList = document.getElementById('config-list');
    const exportButton = document.getElementById('export-configs-btn');
    const clearAllButton = document.getElementById('clear-all-configs-btn');
    
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key-btn');
    const generateProposalButton = document.getElementById('generate-proposal-btn');
    const proposalOutputDiv = document.getElementById('proposal-output');
    const proposalStatusDiv = document.getElementById('proposal-status');
    const downloadProposalButton = document.getElementById('download-proposal-btn'); // Updated ID

    const savedConfigStorageKey = 'sudsSavedConfigs';
    const userApiKeyStorageKey = 'sudsUserOpenAiApiKey'; 

    let userProvidedApiKey = '';
    let rawMarkdownForDownload = ''; // Store raw markdown for potential later use or different download type

    function loadApiKey() {
        const storedKey = localStorage.getItem(userApiKeyStorageKey);
        if (storedKey) {
            userProvidedApiKey = storedKey;
            if(apiKeyInput) apiKeyInput.value = userProvidedApiKey; 
        }
    }

    function saveUserApiKey() {
        if(!apiKeyInput) return;
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

    function loadConfigurations() {
        if (!configList) return;
        configList.innerHTML = ''; 
        const storedData = localStorage.getItem(savedConfigStorageKey);
        let configs = [];

        if (storedData) {
            try {
                configs = JSON.parse(storedData);
                if (!Array.isArray(configs)) configs = [];
            } catch (e) {
                console.error("Error parsing saved configurations:", e);
                configList.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">Error loading configurations.</p>';
                return;
            }
        }

        if (configs.length === 0) {
            configList.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">No product configurations saved yet.</p>';
            if(exportButton) exportButton.style.display = 'none';
            if(clearAllButton) clearAllButton.style.display = 'none';
            if(generateProposalButton) generateProposalButton.disabled = true;
            if(downloadProposalButton) downloadProposalButton.style.display = 'none'; 
            return;
        }
        if(exportButton) exportButton.style.display = 'inline-block';
        if(clearAllButton) clearAllButton.style.display = 'inline-block';
        if(generateProposalButton) generateProposalButton.disabled = false;
        
        configs.forEach((config, index) => { /* ... (config item rendering same as before) ... */
            const listItem = document.createElement('li');
            listItem.className = 'config-item';
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
            const viewDetailsButton = document.createElement('button'); viewDetailsButton.textContent = 'View Details'; viewDetailsButton.className = 'view-details-btn';
            viewDetailsButton.onclick = function() { const pre = listItem.querySelector('pre'); if (pre) pre.style.display = pre.style.display === 'none' ? 'block' : 'none'; };
            const deleteButton = document.createElement('button'); deleteButton.textContent = 'Delete';
            deleteButton.onclick = function() { if (confirm('Are you sure you want to delete this configuration?')) { deleteConfiguration(index); } };
            actionsDiv.appendChild(viewDetailsButton); actionsDiv.appendChild(deleteButton);
            const detailsPre = document.createElement('pre'); detailsPre.textContent = JSON.stringify(config, null, 2);
            listItem.appendChild(detailsDiv); listItem.appendChild(actionsDiv); listItem.appendChild(detailsPre);
            configList.appendChild(listItem);
        });
    }

    function deleteConfiguration(indexToDelete) { /* ... (same as before) ... */
        const storedData = localStorage.getItem(savedConfigStorageKey);
        let configs = [];
        if (storedData) { try { configs = JSON.parse(storedData); if (!Array.isArray(configs)) configs = []; } catch (e) { /* Do nothing */ } }
        configs.splice(indexToDelete, 1); localStorage.setItem(savedConfigStorageKey, JSON.stringify(configs)); loadConfigurations();
    }

    if(exportButton) exportButton.addEventListener('click', function() { /* ... (same as before) ... */ });
    if(clearAllButton) clearAllButton.addEventListener('click', function() { /* ... (same as before) ... */ });


    if(generateProposalButton) generateProposalButton.addEventListener('click', async function() {
        const apiKey = apiKeyInput.value.trim(); 
        if (!apiKey) {
            alert('Please enter your OpenAI API Key in the input field.');
            if(apiKeyInput) apiKeyInput.focus();
            return;
        }
        if (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) {
            localStorage.setItem(userApiKeyStorageKey, apiKey);
            userProvidedApiKey = apiKey; 
        } else {
            alert('The entered API Key does not look like a valid OpenAI key. Please check and try again.');
            return;
        }

        const storedData = localStorage.getItem(savedConfigStorageKey);
        if (!storedData) { alert('No configurations to generate a proposal from.'); return; }

        let configs;
        try {
            configs = JSON.parse(storedData);
            if (!Array.isArray(configs) || configs.length === 0) { alert('No configurations to generate a proposal from.'); return; }
        } catch (e) { alert('Could not read saved configurations. Data might be corrupted.'); return; }

        if(proposalStatusDiv) proposalStatusDiv.textContent = 'Generating proposal... Please wait.';
        if(proposalOutputDiv) proposalOutputDiv.innerHTML = ''; // Clear previous proposal (use innerHTML for HTML rendering)
        if(downloadProposalButton) downloadProposalButton.style.display = 'none'; 
        generateProposalButton.disabled = true;

        const configurationsDetails = configs.map(config => { /* ... (same detailed Markdown string generation as previous response) ... */
            let details = `**Product Name:** ${config.derived_product_name || config.product_type || 'N/A'}\n`;
            details += `**Product Code:** ${config.generated_product_code || 'N/A'}\n`;
            if (config.catchpit_details) {
                details += `  * Type: ${config.catchpit_details.catchpit_type || 'N/A'}\n  * Depth: ${config.catchpit_details.depth_mm || 'N/A'}mm\n  * Pipework Diameter: ${config.catchpit_details.pipework_diameter || 'N/A'}\n  * Target Pollutant: ${config.catchpit_details.target_pollutant || 'N/A'}\n  * Removable Bucket: ${config.catchpit_details.removable_bucket ? 'Yes' : 'No'}\n`;
            } else if (config.chamber_details && config.flow_control_params) { 
                details += `  * Chamber Depth: ${config.chamber_details.chamber_depth_mm || 'N/A'}mm\n  * Chamber Diameter: ${config.chamber_details.chamber_diameter || 'N/A'}\n  * Target Flow Rate: ${config.flow_control_params.target_flow_lps || 'N/A'} L/s\n  * Design Head Height: ${config.flow_control_params.design_head_m || 'N/A'} m\n  * Bypass Required: ${config.flow_control_params.bypass_required ? 'Yes' : 'No'}\n`;
            } else if (config.main_chamber && config.inlets) { 
                details += `  * System Type: ${config.system_type_selection || 'N/A'}\n  * Water Application: ${config.water_application_selection || 'N/A'}\n  * Chamber Depth: ${config.main_chamber.chamber_depth_mm || 'N/A'}mm\n  * Chamber Diameter: ${config.main_chamber.chamber_diameter || 'N/A'}\n  * Inlets (${config.inlets.length}):\n`;
                config.inlets.forEach(inlet => { details += `    * Position: ${inlet.position}, Size: ${inlet.pipe_size || 'N/A'}, Material: ${inlet.pipe_material || 'N/A'} ${inlet.pipe_material_other ? `(${inlet.pipe_material_other})` : ''}\n`; });
            } else if (config.separator_details) { 
                details += `  * Depth: ${config.separator_details.depth_mm || 'N/A'}mm\n  * Design Flow Rate: ${config.separator_details.flow_rate_lps || 'N/A'} L/s\n  * Pipework Diameter: ${config.separator_details.pipework_diameter || 'N/A'}\n  * Model Size/Space: ${config.separator_details.space_available || 'N/A'}\n  * Target Contaminants: ${(config.separator_details.target_contaminants || []).join(', ')}\n`;
            }
            details += `  * Adoptable Status: ${config.adoptable_status || 'N/A'}\n`;
            if (config.quote_details && typeof config.quote_details.estimated_sell_price === 'number') { details += `  * **Estimated Sell Price:** £${config.quote_details.estimated_sell_price.toFixed(2)}\n`; }
            return details;
        }).join('\n\n---\n\n');
        const totalEstimatedSellPrice = configs.reduce((sum, conf) => sum + (conf.quote_details?.estimated_sell_price || 0), 0).toFixed(2);
        const systemPrompt = `You are an expert technical sales proposal writer for SuDS Enviro... (same detailed Markdown system prompt as previous response) ...`;
        const userQuery = `Using the structured product data below, generate the full project proposal... (same detailed user query as previous response, ensuring it includes totalEstimatedSellPrice) ...`;
        
        const aiApiEndpoint = 'https://api.openai.com/v1/chat/completions';
        
        try {
            const requestBody = { /* ... (same as previous response: model, messages, max_tokens, temperature) ... */
                model: "gpt-4o", 
                messages: [ { "role": "system", "content": systemPrompt }, { "role": "user", "content": userQuery } ],
                max_tokens: 3500, temperature: 0.5 
            };

            const response = await fetch(aiApiEndpoint, { /* ... (same fetch options) ... */
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) { /* ... (same error handling) ... */
                const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse API error response." } }));
                console.error("API Error Response:", errorData);
                throw new Error(`API request failed: ${errorData.error?.message || response.statusText || "Unknown API error"} (Status: ${response.status})`);
            }

            const data = await response.json();
            rawMarkdownForDownload = data.choices?.[0]?.message?.content || "Could not extract proposal text from API response."; // Store raw Markdown
            
            if (typeof marked !== 'undefined' && proposalOutputDiv) { // Check if marked.js is loaded
                proposalOutputDiv.innerHTML = marked.parse(rawMarkdownForDownload); // Render Markdown as HTML for preview
            } else if (proposalOutputDiv) {
                proposalOutputDiv.textContent = rawMarkdownForDownload; // Fallback to plain text if marked.js not found
            }

            if(proposalStatusDiv) proposalStatusDiv.textContent = 'Proposal generated successfully!';
            if(downloadProposalButton) downloadProposalButton.style.display = 'inline-block';

        } catch (error) {
            console.error('Error generating proposal:', error);
            if(proposalOutputDiv) proposalOutputDiv.innerHTML = `<p style="color: red;">Error generating proposal. Please check the console for details.<br>Message: ${error.message}</p>`;
            if(proposalStatusDiv) proposalStatusDiv.textContent = 'Proposal generation failed.';
        } finally {
            if(generateProposalButton) generateProposalButton.disabled = false;
        }
    });

    if(downloadProposalButton) downloadProposalButton.addEventListener('click', function() {
        if (!rawMarkdownForDownload || rawMarkdownForDownload === "Could not extract proposal text from API response.") {
            alert('No valid proposal content to download. Please generate a proposal first.');
            return;
        }

        // Create the HTML content for the download
        // Basic HTML structure with some inline styles for better Word/GDocs import
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>SuDS Enviro Project Proposal</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; color: #333; }
                    h1, h2, h3, h4 { color: #1d80b9; font-family: 'Montserrat', Arial, sans-serif; } /* Using Montserrat if available */
                    h1 { font-size: 24pt; margin-bottom: 10px; border-bottom: 2px solid #1d80b9; padding-bottom: 5px;}
                    h2 { font-size: 18pt; margin-top: 25px; margin-bottom: 8px; border-bottom: 1px solid #54b54d; padding-bottom: 3px;}
                    h3 { font-size: 14pt; margin-top: 20px; margin-bottom: 5px; color: #1a73a8; }
                    p { margin-bottom: 12px; }
                    ul { margin-left: 20px; list-style-type: disc; }
                    li { margin-bottom: 5px; }
                    strong { font-weight: bold; }
                    hr { border: 0; height: 1px; background: #ccc; margin: 20px 0; }
                    .contact-info { margin-top:30px; padding-top:15px; border-top: 1px solid #ccc; font-size:0.9em; color:#555; }
                    .footer-note { margin-top:30px; font-style:italic; font-size:0.85em; color:#777; }
                </style>
            </head>
            <body>
                ${typeof marked !== 'undefined' ? marked.parse(rawMarkdownForDownload) : '<pre>' + rawMarkdownForDownload + '</pre>'}
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const today = new Date();
        const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        const filename = `SuDS_Enviro_Proposal_${dateString}.html`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); 
        
        alert('Proposal HTML file prepared for download. Open it with Word or Google Docs.');
    });

    loadApiKey(); 
    loadConfigurations();

    window.addEventListener('storage', function(event) {
        if (event.key === savedConfigStorageKey) loadConfigurations();
        if (event.key === userApiKeyStorageKey) loadApiKey();
    });
});
