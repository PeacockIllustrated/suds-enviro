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
            generateProposalButton.disabled = true; // Disable proposal if no configs
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
            alert('Please enter your AI API Key.');
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
        proposalOutputDiv.textContent = '';
        generateProposalButton.disabled = true;

        // Prepare data for the AI. You might want to simplify or structure this.
        const configurationsSummary = configs.map(config => {
            return `Product: ${config.derived_product_name || config.product_type}, Code: ${config.generated_product_code || 'N/A'}, Key Details: ${JSON.stringify(config.details || config.chamber_details || config.separator_details || config.catchpit_details || config.flow_control_params || {})}`;
        }).join('\n - ');

        // **VERY IMPORTANT: Refine this prompt extensively!**
        const prompt = `
            You are an assistant for SuDS Enviro, a company specializing in sustainable drainage solutions.
            Based on the following list of configured SuDS products, generate a concise project proposal document.
            The proposal should be professional, clearly list the products, and provide a brief overview of a potential drainage scheme.
            Assume these products are for a single project.
            Start with a suitable project title and introduction. List each product with its code. Conclude with a next steps section.

            Configured Products:
            - ${configurationsSummary}

            Format the output as a professional proposal.
        `;

        try {
            // Replace with your actual AI API endpoint and request structure
            const response = await fetch('YOUR_AI_API_ENDPOINT', { // <<<<<<< REPLACE THIS
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}` // Common for many APIs
                },
                body: JSON.stringify({
                    // This structure depends HEAVILY on your AI API (e.g., OpenAI uses 'model' and 'messages' array)
                    prompt: prompt,
                    max_tokens: 1500, // Adjust as needed
                    temperature: 0.7 // Adjust for creativity vs. determinism
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorData}`);
            }

            const data = await response.json();
            
            // Extract the generated text. This also depends on your AI API's response structure.
            // For OpenAI, it might be data.choices[0].text or data.choices[0].message.content
            const proposalText = data.generated_proposal || data.choices?.[0]?.text || data.choices?.[0]?.message?.content || "Could not extract proposal text from API response.";
            
            proposalOutputDiv.textContent = proposalText;
            proposalStatusDiv.textContent = 'Proposal generated successfully!';

        } catch (error) {
            console.error('Error generating proposal:', error);
            proposalOutputDiv.textContent = `Error: ${error.message}`;
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