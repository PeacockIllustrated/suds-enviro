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
    const copyMarkdownButton = document.getElementById('copy-markdown-btn'); // New button

    const savedConfigStorageKey = 'sudsSavedConfigs';
    const userApiKeyStorageKey = 'sudsUserOpenAiApiKey';

    let userProvidedApiKey = '';

    function loadApiKey() { /* ... (same as before) ... */
        const storedKey = localStorage.getItem(userApiKeyStorageKey);
        if (storedKey) {
            userProvidedApiKey = storedKey;
            apiKeyInput.value = userProvidedApiKey;
        }
    }

    function saveUserApiKey() { /* ... (same as before) ... */
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

    // --- Configuration Loading and Management (same as before) ---
    function loadConfigurations() { /* ... (same as before, ensure generateProposalButton.disabled and copyMarkdownButton.style.display are managed) ... */
        configList.innerHTML = '';
        const storedData = localStorage.getItem(savedConfigStorageKey);
        let configs = [];

        if (storedData) {
            try { configs = JSON.parse(storedData); if (!Array.isArray(configs)) configs = []; }
            catch (e) { console.error("Error parsing saved configurations:", e); configList.innerHTML = '<p>Error loading configurations.</p>'; return; }
        }

        if (configs.length === 0) {
            configList.innerHTML = '<p>No product configurations saved yet.</p>';
            if(exportButton) exportButton.style.display = 'none';
            if(clearAllButton) clearAllButton.style.display = 'none';
            if(generateProposalButton) generateProposalButton.disabled = true;
            if(copyMarkdownButton) copyMarkdownButton.style.display = 'none'; // Hide copy button
            return;
        }
        if(exportButton) exportButton.style.display = 'inline-block';
        if(clearAllButton) clearAllButton.style.display = 'inline-block';
        if(generateProposalButton) generateProposalButton.disabled = false;
        // Copy button visibility will be handled after proposal generation

        configs.forEach((config, index) => { /* ... (same as before) ... */
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
    // --- End Configuration Loading and Management ---


    // --- Proposal Generation ---
    if(generateProposalButton) generateProposalButton.addEventListener('click', async function() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Please enter your OpenAI API Key in the input field.');
            apiKeyInput.focus();
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

        proposalStatusDiv.textContent = 'Generating proposal... Please wait.';
        proposalOutputDiv.innerHTML = ''; // Clear previous proposal
        if(copyMarkdownButton) copyMarkdownButton.style.display = 'none'; // Hide copy button initially
        generateProposalButton.disabled = true;

        const configurationsDetails = configs.map(config => {
            let details = `**Product Name:** ${config.derived_product_name || config.product_type || 'N/A'}\n`;
            details += `**Product Code:** ${config.generated_product_code || 'N/A'}\n`;
            
            if (config.catchpit_details) {
                details += `  * Type: ${config.catchpit_details.catchpit_type || 'N/A'}\n`;
                details += `  * Depth: ${config.catchpit_details.depth_mm || 'N/A'}mm\n`;
                details += `  * Pipework Diameter: ${config.catchpit_details.pipework_diameter || 'N/A'}\n`;
                details += `  * Target Pollutant: ${config.catchpit_details.target_pollutant || 'N/A'}\n`;
                details += `  * Removable Bucket: ${config.catchpit_details.removable_bucket ? 'Yes' : 'No'}\n`;
            } else if (config.chamber_details && config.flow_control_params) { // Orifice
                details += `  * Chamber Depth: ${config.chamber_details.chamber_depth_mm || 'N/A'}mm\n`;
                details += `  * Chamber Diameter: ${config.chamber_details.chamber_diameter || 'N/A'}\n`;
                details += `  * Target Flow Rate: ${config.flow_control_params.target_flow_lps || 'N/A'} L/s\n`;
                details += `  * Design Head Height: ${config.flow_control_params.design_head_m || 'N/A'} m\n`;
                details += `  * Bypass Required: ${config.flow_control_params.bypass_required ? 'Yes' : 'No'}\n`;
            } else if (config.main_chamber && config.inlets) { // Universal Chamber
                details += `  * System Type: ${config.system_type_selection || 'N/A'}\n`;
                details += `  * Water Application: ${config.water_application_selection || 'N/A'}\n`;
                details += `  * Chamber Depth: ${config.main_chamber.chamber_depth_mm || 'N/A'}mm\n`;
                details += `  * Chamber Diameter: ${config.main_chamber.chamber_diameter || 'N/A'}\n`;
                details += `  * Inlets (${config.inlets.length}):\n`;
                config.inlets.forEach(inlet => {
                    details += `    * Position: ${inlet.position}, Size: ${inlet.pipe_size || 'N/A'}, Material: ${inlet.pipe_material || 'N/A'} ${inlet.pipe_material_other ? `(${inlet.pipe_material_other})` : ''}\n`;
                });
            } else if (config.separator_details) { // Separator
                details += `  * Depth: ${config.separator_details.depth_mm || 'N/A'}mm\n`;
                details += `  * Design Flow Rate: ${config.separator_details.flow_rate_lps || 'N/A'} L/s\n`;
                details += `  * Pipework Diameter: ${config.separator_details.pipework_diameter || 'N/A'}\n`;
                details += `  * Model Size/Space: ${config.separator_details.space_available || 'N/A'}\n`;
                details += `  * Target Contaminants: ${(config.separator_details.target_contaminants || []).join(', ')}\n`;
            }
            details += `  * Adoptable Status: ${config.adoptable_status || 'N/A'}\n`;
            if (config.quote_details && typeof config.quote_details.estimated_sell_price === 'number') {
                 details += `  * **Estimated Sell Price:** £${config.quote_details.estimated_sell_price.toFixed(2)}\n`;
            }
            return details;
        }).join('\n\n---\n\n'); // Separator for products in Markdown

        const totalEstimatedSellPrice = configs.reduce((sum, conf) => sum + (conf.quote_details?.estimated_sell_price || 0), 0).toFixed(2);

        const systemPrompt = `You are an expert technical sales proposal writer for SuDS Enviro, a premier UK-based provider of Sustainable Drainage Systems. Your primary function is to generate comprehensive, client-ready project proposals in well-structured Markdown format.

**Proposal Structure (Strictly Adhere to this Markdown structure):**

# Project Proposal: Sustainable Drainage System for [Client/Project Placeholder Name]

**Date:** ${new Date().toLocaleDateString('en-GB')}
**Prepared for:** [Client Name/Company - Use Placeholder if not provided]
**Prepared by:** SuDS Enviro Sales Team

## 1. Introduction

Briefly introduce SuDS Enviro as a leader in innovative and compliant SuDS solutions. State the purpose of this proposal – to outline a recommended drainage system based on the client's selected components.

## 2. Executive Summary

Provide a concise overview of the proposed system, highlighting its key benefits and its suitability for the project's (assumed) objectives like effective stormwater management, pollutant removal, and regulatory compliance. Mention the total estimated project value.

## 3. Proposed SuDS Components & Specifications

This section will detail each configured product. For each product, use the following format:

### [Product Derived Name - e.g., Catchpit (Bucket Type)]
*   **Product Code:** [Insert Product Code]
*   **Key Specifications:**
    *   [Specification 1: Value]
    *   [Specification 2: Value]
    *   ... (list all relevant specs from the provided data for this product)
*   **Adoptable Status:** [Yes/No/As per config]
*   **Estimated Sell Price:** £[Price]

(Repeat for each product, separated by a horizontal rule '---' if there are multiple products)

## 4. Conceptual System Overview

Provide a short paragraph describing how these components might function together within a typical SuDS management train. For example, "The proposed SuDS Enviro system is designed to manage stormwater runoff effectively. Surface water will initially pass through [e.g., Catchpits] to remove gross pollutants and silts. Flow will then be attenuated and further treated by [e.g., Hydrodynamic Separators], with controlled discharge managed by [e.g., Orifice Flow Control Chambers]. Inspection and maintenance access is facilitated by strategically placed [e.g., Universal Inspection Chambers]." Tailor this to the types of products included.

## 5. Key Benefits of SuDS Enviro Solutions

*   **Regulatory Compliance:** Our systems are designed to meet [mention relevant UK standards/guidelines like SuDS Manual, Sewers for Adoption/Design and Construction Guidance].
*   **Environmental Protection:** Effectively reduces pollutants, improves water quality, and can enhance local biodiversity.
*   **Flood Risk Mitigation:** Contributes to effective flood risk management by controlling runoff rates and volumes.
*   **Durability & Quality:** Manufactured to high standards for long-term performance and reliability.
*   **Expert Support:** SuDS Enviro offers comprehensive support from design to installation and maintenance.

## 6. Total Estimated Project Investment

The total estimated investment for the supply of the SuDS Enviro components listed above is **£${totalEstimatedSellPrice}** (excluding VAT, delivery, and installation unless otherwise stated). A detailed formal quotation can be provided upon request.

## 7. Next Steps

We recommend the following next steps:
1.  A brief consultation call to discuss your project requirements in more detail.
2.  Review of site plans (if available) to optimize component selection and placement.
3.  Provision of a formal, detailed quotation.

Please contact us to proceed.

## 8. Contact Information

**SuDS Enviro**
Email: sales@sudsenviro.co.uk
Phone: 01234 567890 (Please replace with actual number)
Website: www.sudsenviro.co.uk (Please replace with actual URL)

---
*This proposal is based on the component configurations provided and is indicative. Final pricing and specifications are subject to a formal quotation.*
---
`;

        const userQuery = `Using the structured product data below, generate the full project proposal adhering strictly to the Markdown format and section guidelines provided in the system prompt. Replace placeholders like "[Client/Project Placeholder Name]" with sensible generic placeholders if specific client data isn't available in the product list (e.g., "Valued Client" or "the Proposed Development Site").

**Configured Product Data:**
${configurationsDetails}
`;

        const aiApiEndpoint = 'https://api.openai.com/v1/chat/completions';
        
        try {
            const requestBody = {
                model: "gpt-4o", // Strongly recommend GPT-4o or GPT-4 Turbo for this level of detail
                messages: [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": userQuery }
                ],
                max_tokens: 3500, 
                temperature: 0.5 
            };

            const response = await fetch(aiApiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse API error response." } }));
                console.error("API Error Response:", errorData);
                throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || response.statusText || "Unknown API error"}`);
            }

            const data = await response.json();
            const proposalMarkdown = data.choices?.[0]?.message?.content || "Could not extract proposal text from API response.";
            
            proposalOutputDiv.textContent = proposalMarkdown; // Display raw Markdown
            proposalStatusDiv.textContent = 'Proposal generated successfully! (Markdown Format)';
            if(copyMarkdownButton) copyMarkdownButton.style.display = 'inline-block'; // Show copy button

        } catch (error) {
            console.error('Error generating proposal:', error);
            proposalOutputDiv.textContent = `Error generating proposal. Please check the console for details.\nMessage: ${error.message}`;
            proposalStatusDiv.textContent = 'Proposal generation failed.';
        } finally {
            generateProposalButton.disabled = false;
        }
    });

    if(copyMarkdownButton) copyMarkdownButton.addEventListener('click', function() {
        if (proposalOutputDiv.textContent) {
            navigator.clipboard.writeText(proposalOutputDiv.textContent)
                .then(() => {
                    alert('Proposal Markdown copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy markdown: ', err);
                    alert('Failed to copy markdown. Please select and copy manually.');
                });
        } else {
            alert('No proposal content to copy.');
        }
    });

    // Initial load
    loadApiKey(); 
    loadConfigurations();

    window.addEventListener('storage', function(event) {
        if (event.key === savedConfigStorageKey) loadConfigurations();
        if (event.key === userApiKeyStorageKey) loadApiKey();
    });
});
