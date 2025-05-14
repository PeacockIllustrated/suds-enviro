// js/all_configs.js
document.addEventListener('DOMContentLoaded', function() {
    const configList = document.getElementById('config-list');
    const exportButton = document.getElementById('export-configs-btn');
    const clearAllButton = document.getElementById('clear-all-configs-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const generateProposalButton = document.getElementById('generate-proposal-btn');
    const proposalOutputDiv = document.getElementById('proposal-output');
    const proposalStatusDiv = document.getElementById('proposal-status');
    const savedConfigStorageKey = 'sudsSavedConfigs';

    // --- Configuration Loading and Management (remains the same) ---
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

    exportButton.addEventListener('click', function() {
        const storedData = localStorage.getItem(savedConfigStorageKey);
        if (!storedData) {
            alert('No configurations to export.');
            return;
        }
        try {
            const configs = JSON.parse(storedData);
            if (!Array.isArray(configs) || configs.length === 0) {
                 alert('No configurations to export.');
                 return;
            }
            const jsonData = JSON.stringify(configs, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'suds_enviro_all_configurations.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch(e) {
            alert('Error exporting configurations. Data might be corrupted.');
            console.error("Export error:", e);
        }
    });

    clearAllButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete ALL saved product configurations? This action cannot be undone.')) {
            localStorage.removeItem(savedConfigStorageKey);
            loadConfigurations();
            alert('All saved configurations have been cleared.');
        }
    });
    // --- End Configuration Loading and Management ---


    // --- Proposal Generation ---
    generateProposalButton.addEventListener('click', async function() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Please enter your OpenAI API Key.');
            apiKeyInput.focus();
            return;
        }

        const storedData = localStorage.getItem(savedConfigStorageKey);
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
        proposalOutputDiv.textContent = ''; // Clear previous proposal
        generateProposalButton.disabled = true;

        // Prepare a more structured summary for the AI
        const configurationsDetails = configs.map(config => {
            let details = `Product Type: ${config.product_type || 'N/A'}\n`;
            details += `Derived Name: ${config.derived_product_name || 'N/A'}\n`;
            details += `Product Code: ${config.generated_product_code || 'N/A'}\n`;
            
            // Add specific details based on product type
            if (config.catchpit_details) {
                details += `  Catchpit Type: ${config.catchpit_details.catchpit_type || 'N/A'}\n`;
                details += `  Depth: ${config.catchpit_details.depth_mm || 'N/A'}mm\n`;
                details += `  Pipework: ${config.catchpit_details.pipework_diameter || 'N/A'}\n`;
                details += `  Target Pollutant: ${config.catchpit_details.target_pollutant || 'N/A'}\n`;
                details += `  Removable Bucket: ${config.catchpit_details.removable_bucket ? 'Yes' : 'No'}\n`;
            } else if (config.chamber_details && config.flow_control_params) { // Orifice
                details += `  Chamber Depth: ${config.chamber_details.chamber_depth_mm || 'N/A'}mm\n`;
                details += `  Chamber Diameter: ${config.chamber_details.chamber_diameter || 'N/A'}\n`;
                details += `  Target Flow: ${config.flow_control_params.target_flow_lps || 'N/A'} L/s\n`;
                details += `  Head Height: ${config.flow_control_params.design_head_m || 'N/A'} m\n`;
                details += `  Bypass: ${config.flow_control_params.bypass_required ? 'Yes' : 'No'}\n`;
            } else if (config.main_chamber && config.inlets) { // Universal Chamber
                details += `  System: ${config.system_type_selection || 'N/A'}\n`;
                details += `  Application: ${config.water_application_selection || 'N/A'}\n`;
                details += `  Chamber Depth: ${config.main_chamber.chamber_depth_mm || 'N/A'}mm\n`;
                details += `  Chamber Diameter: ${config.main_chamber.chamber_diameter || 'N/A'}\n`;
                details += `  Inlets (${config.inlets.length}):\n`;
                config.inlets.forEach(inlet => {
                    details += `    - Pos: ${inlet.position}, Size: ${inlet.pipe_size || 'N/A'}, Material: ${inlet.pipe_material || 'N/A'} ${inlet.pipe_material_other ? `(${inlet.pipe_material_other})` : ''}\n`;
                });
            } else if (config.separator_details) { // Separator
                details += `  Depth: ${config.separator_details.depth_mm || 'N/A'}mm\n`;
                details += `  Flow Rate: ${config.separator_details.flow_rate_lps || 'N/A'} L/s\n`;
                details += `  Pipework: ${config.separator_details.pipework_diameter || 'N/A'}\n`;
                details += `  Size Class: ${config.separator_details.space_available || 'N/A'}\n`;
                details += `  Targets: ${(config.separator_details.target_contaminants || []).join(', ')}\n`;
            }
            details += `  Adoptable: ${config.adoptable_status || 'N/A'}\n`;
            if (config.quote_details) {
                 details += `  Estimated Cost Price: £${config.quote_details.cost_price?.toFixed(2) || 'N/A'}\n`;
                 details += `  Estimated Sell Price (inc. ${config.quote_details.profit_markup_percent || 0}% markup): £${config.quote_details.estimated_sell_price?.toFixed(2) || 'N/A'}\n`;
            }
            return details;
        }).join('\n-------------------------------------\n');

        const systemPrompt = `You are a highly proficient technical sales assistant for SuDS Enviro, a leading UK provider of Sustainable Drainage Systems. Your task is to generate a structured, professional, and persuasive project proposal based on a list of customer-configured SuDS products.

The proposal should include:
1.  **Project Title:** Create a suitable and professional title (e.g., "Proposed Sustainable Drainage System for [Generic Project Name/Location]").
2.  **Introduction:** Briefly introduce SuDS Enviro and the purpose of the proposal.
3.  **Proposed SuDS Components:**
    *   List each configured product clearly.
    *   For each product, state its Derived Name, Product Code, and key technical specifications as provided.
    *   Mention the estimated sell price for each component if available.
4.  **System Overview (Conceptual):** Briefly describe how these components might work together in a typical SuDS scheme (e.g., "The proposed system is designed to effectively manage surface water runoff by capturing pollutants with catchpits and hydrodynamic separators, controlling flow rates with orifice chambers, and providing inspection access via universal chambers...").
5.  **Benefits:** Briefly highlight 2-3 key benefits of using SuDS Enviro solutions (e.g., regulatory compliance, environmental protection, long-term cost-effectiveness).
6.  **Next Steps:** Suggest next steps (e.g., site visit, detailed design consultation, formal quotation).
7.  **Contact Information:**
    SuDS Enviro
    Email: sales@sudsenviro.co.uk
    Phone: 01234 567890 (Replace with actual if different)
    Website: www.sudsenviro.co.uk (Replace with actual if different)

Maintain a professional and confident tone. Use clear, concise language.
Format the output using Markdown for readability (headings, lists, bolding). Do not include the "Estimated Cost Price" in the client-facing proposal, only the "Estimated Sell Price".`;

        const userQuery = `Please generate a project proposal based on the following configured SuDS components for a new project:

${configurationsDetails}

Ensure all specified sections are included and the formatting is professional.
The total estimated sell price for all listed components is £${configs.reduce((sum, conf) => sum + (conf.quote_details?.estimated_sell_price || 0), 0).toFixed(2)}. Mention this total project estimate.`;


        const aiApiEndpoint = 'https://api.openai.com/v1/chat/completions';
        // If using Azure OpenAI, your endpoint will look different, e.g.:
        // const aiApiEndpoint = `https://YOUR_AZURE_OPENAI_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT_NAME/chat/completions?api-version=2023-07-01-preview`;


        try {
            const requestBody = {
                model: "gpt-4o", // Or "gpt-3.5-turbo", "gpt-4-turbo" etc. Consider gpt-4o for better quality.
                messages: [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": userQuery }
                ],
                max_tokens: 3000, // Increased for potentially longer proposals
                temperature: 0.6  // A balance between creativity and factualness
            };

            const response = await fetch(aiApiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
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
            // If you want to render Markdown as HTML (requires including a Markdown library like 'marked.js')
            // if (typeof marked !== 'undefined') {
            //     proposalOutputDiv.innerHTML = marked.parse(proposalText);
            // } else {
            //     proposalOutputDiv.textContent = proposalText; // Fallback to plain text
            // }
            proposalStatusDiv.textContent = 'Proposal generated successfully!';

        } catch (error) {
            console.error('Error generating proposal:', error);
            proposalOutputDiv.textContent = `Error generating proposal. Please check the console for details. Message: ${error.message}`;
            proposalStatusDiv.textContent = 'Proposal generation failed.';
        } finally {
            generateProposalButton.disabled = false;
        }
    });

    loadConfigurations(); // Initial load

    window.addEventListener('storage', function(event) {
        if (event.key === savedConfigStorageKey) {
            loadConfigurations();
        }
    });
});