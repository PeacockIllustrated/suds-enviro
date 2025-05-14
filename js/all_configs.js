// js/all_configs.js
document.addEventListener('DOMContentLoaded', function() {
    const configList = document.getElementById('config-list');
    const exportButton = document.getElementById('export-configs-btn');
    const clearAllButton = document.getElementById('clear-all-configs-btn');
    
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

    const savedConfigStorageKey = 'sudsSavedConfigs';
    const userApiKeyStorageKey = 'sudsUserOpenAiApiKey'; 

    let userProvidedApiKey = '';
    let rawMarkdownForDownload = ''; 

    function loadApiKey() { /* ... (same as before) ... */
        const storedKey = localStorage.getItem(userApiKeyStorageKey);
        if (storedKey) {
            userProvidedApiKey = storedKey;
            if(apiKeyInput) apiKeyInput.value = userProvidedApiKey; 
        }
    }

    function saveUserApiKey() { /* ... (same as before) ... */
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

    function loadConfigurations() { /* ... (same as before, including button disabling) ... */
        if (!configList) return;
        configList.innerHTML = ''; 
        const storedData = localStorage.getItem(savedConfigStorageKey);
        let configs = [];

        if (storedData) {
            try { configs = JSON.parse(storedData); if (!Array.isArray(configs)) configs = []; }
            catch (e) { console.error("Error parsing saved configurations:", e); configList.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">Error loading configurations.</p>'; return; }
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
            const listItem = document.createElement('li'); listItem.className = 'config-item'; listItem.dataset.index = index;
            const detailsDiv = document.createElement('div'); detailsDiv.className = 'config-item-details';
            const nameStrong = document.createElement('strong'); nameStrong.textContent = config.derived_product_name || config.product_type || 'Unnamed Configuration'; detailsDiv.appendChild(nameStrong);
            if (config.generated_product_code) { const codeP = document.createElement('p'); codeP.textContent = `Product Code: ${config.generated_product_code}`; detailsDiv.appendChild(codeP); }
            if (config.savedTimestamp) { const timeP = document.createElement('p'); timeP.className = 'timestamp'; timeP.textContent = `Saved: ${new Date(config.savedTimestamp).toLocaleString()}`; detailsDiv.appendChild(timeP); }
            if (config.savedId) { const idSP = document.createElement('p'); idSP.className = 'timestamp'; idSP.textContent = `Saved ID: ${config.savedId}`; detailsDiv.appendChild(idSP); }
            const actionsDiv = document.createElement('div'); actionsDiv.className = 'config-item-actions';
            const viewDetailsButton = document.createElement('button'); viewDetailsButton.textContent = 'View Details'; viewDetailsButton.className = 'view-details-btn'; viewDetailsButton.onclick = function() { const pre = listItem.querySelector('pre'); if (pre) pre.style.display = pre.style.display === 'none' ? 'block' : 'none'; };
            const deleteButton = document.createElement('button'); deleteButton.textContent = 'Delete'; deleteButton.onclick = function() { if (confirm('Are you sure you want to delete this configuration?')) { deleteConfiguration(index); } };
            actionsDiv.appendChild(viewDetailsButton); actionsDiv.appendChild(deleteButton);
            const detailsPre = document.createElement('pre'); detailsPre.textContent = JSON.stringify(config, null, 2);
            listItem.appendChild(detailsDiv); listItem.appendChild(actionsDiv); listItem.appendChild(detailsPre); configList.appendChild(listItem);
        });
    }

    function deleteConfiguration(indexToDelete) { /* ... (same as before) ... */
        const storedData = localStorage.getItem(savedConfigStorageKey); let configs = [];
        if (storedData) { try { configs = JSON.parse(storedData); if (!Array.isArray(configs)) configs = []; } catch (e) {} }
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
        if ((apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) && apiKey !== userProvidedApiKey) {
            localStorage.setItem(userApiKeyStorageKey, apiKey);
            userProvidedApiKey = apiKey; 
        } else if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-')) {
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

        // Get customer and project details from new input fields
        const customerName = customerNameInput.value.trim() || "[Client Name/Company Placeholder]";
        const projectName = projectNameInput.value.trim() || "[Project Name/Location Placeholder]";
        const projectNotes = projectNotesInput.value.trim();


        if(proposalStatusDiv) proposalStatusDiv.textContent = 'Generating proposal... Please wait.';
        if(proposalOutputDiv) proposalOutputDiv.innerHTML = ''; 
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

        
        
        // Updated System Prompt to use placeholders for customer/project info
        const systemPrompt = `You are an expert technical sales proposal writer for SuDS Enviro, a premier UK-based provider of Sustainable Drainage Systems. Your primary function is to generate comprehensive, client-ready project proposals in well-structured Markdown format.

**Client & Project Context (to be inserted by AI where placeholders are used in the template):**
*   **Client Name/Company:** {{CUSTOMER_NAME}}
*   **Project Name/Location:** {{PROJECT_NAME}}
*   **Additional Project Notes/Context:** {{PROJECT_NOTES}}

**Proposal Structure (Strictly Adhere to this Markdown structure, replacing placeholders):**

# Project Proposal: Sustainable Drainage System for {{PROJECT_NAME}}

**Date:** ${new Date().toLocaleDateString('en-GB')}
**Prepared for:** {{CUSTOMER_NAME}}
**Prepared by:** SuDS Enviro Sales Team

## 1. Introduction
Briefly introduce SuDS Enviro as a leader in innovative and compliant SuDS solutions. State the purpose of this proposal – to outline a recommended drainage system for the {{PROJECT_NAME}} based on the client's selected components. If project notes are available ({{PROJECT_NOTES}}), subtly weave any relevant context into the introduction or system overview.

## 2. Executive Summary
Provide a concise overview of the proposed system for {{PROJECT_NAME}}, highlighting its key benefits and its suitability for the project's (assumed) objectives like effective stormwater management, pollutant removal, and regulatory compliance. Mention the total estimated project value.

## 3. Proposed SuDS Components & Specifications
This section will detail each configured product. For each product, use the following format:
(The AI will insert the product details here based on the user query data)

## 4. Conceptual System Overview
Provide a short paragraph describing how these components might function together within a typical SuDS management train for the {{PROJECT_NAME}}. Tailor this to the types of products included and any context from {{PROJECT_NOTES}}.

## 5. Key Benefits of SuDS Enviro Solutions
*   **Regulatory Compliance:** Our systems are designed to meet [mention relevant UK standards/guidelines like SuDS Manual, Sewers for Adoption/Design and Construction Guidance].
*   **Environmental Protection:** Effectively reduces pollutants, improves water quality, and can enhance local biodiversity.
*   **Flood Risk Mitigation:** Contributes to effective flood risk management by controlling runoff rates and volumes.
*   **Durability & Quality:** Manufactured to high standards for long-term performance and reliability.
*   **Expert Support:** SuDS Enviro offers comprehensive support from design to installation and maintenance.

## 6. Total Estimated Project Investment
The total estimated investment for the supply of the SuDS Enviro components listed above for the {{PROJECT_NAME}} is **£${totalEstimatedSellPrice}** (excluding VAT, delivery, and installation unless otherwise stated). A detailed formal quotation can be provided upon request.

## 7. Next Steps
We recommend the following next steps to progress the SuDS solution for {{PROJECT_NAME}}:
1.  A brief consultation call to discuss your project requirements in more detail.
2.  Review of site plans (if available) to optimize component selection and placement.
3.  Provision of a formal, detailed quotation.
Please contact us to proceed.

## 8. Contact Information
**SuDS Enviro**
Email: info@sudsenviro.com
Phone: 01224 057700
Website: suds-enviro.com

---
*This proposal is based on the component configurations provided and is indicative. Final pricing and specifications are subject to a formal quotation.*
---
`;

        // User query now includes the customer/project details for the AI to use
        const userQuery = `
        Customer Name/Company: ${customerName}
        Project Name/Location: ${projectName}
        Additional Project Notes: ${projectNotes || "None provided."}

        Please generate a project proposal using the system prompt's structure and the product data below.
        Ensure all placeholders like {{CUSTOMER_NAME}}, {{PROJECT_NAME}}, and {{PROJECT_NOTES}} in the system prompt template are correctly filled with the information provided above.

        **Configured Product Data:**
        ${configurationsDetails}
        `;
        
        const aiApiEndpoint = 'https://api.openai.com/v1/chat/completions';
        
        try {
            const requestBody = {
                model: "gpt-4o", 
                messages: [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": userQuery }
                ],
                max_tokens: 3500, 
                temperature: 0.5 
            };

            const response = await fetch(aiApiEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${userProvidedApiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse API error response." } }));
                console.error("API Error Response:", errorData);
                throw new Error(`API request failed: ${errorData.error?.message || response.statusText || "Unknown API error"} (Status: ${response.status})`);
            }

            const data = await response.json();
            rawMarkdownForDownload = data.choices?.[0]?.message?.content || "Could not extract proposal text from API response."; 
            
            if (typeof marked !== 'undefined' && proposalOutputDiv) { 
                proposalOutputDiv.innerHTML = marked.parse(rawMarkdownForDownload); 
            } else if (proposalOutputDiv) {
                proposalOutputDiv.textContent = rawMarkdownForDownload; 
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

    if(downloadProposalButton) downloadProposalButton.addEventListener('click', function() { /* ... (same download HTML logic as previous response) ... */
        if (!proposalOutputDiv || !rawMarkdownForDownload || rawMarkdownForDownload === "Could not extract proposal text from API response." || rawMarkdownForDownload.startsWith("Error generating proposal")) {
            alert('No valid proposal content to download. Please generate a proposal first.'); return;
        }
        const htmlToDownload = `
            <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>SuDS Enviro Project Proposal</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333333; }
                h1, h2, h3, h4, h5, h6 { color: #1d80b9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
                h1 { font-size: 26px; margin-bottom: 15px; border-bottom: 2px solid #1d80b9; padding-bottom: 8px;}
                h2 { font-size: 22px; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #54b54d; padding-bottom: 6px;}
                h3 { font-size: 18px; margin-top: 25px; margin-bottom: 10px; color: #1a73a8; }
                p { margin-bottom: 12px; text-align: justify; } ul, ol { margin-left: 20px; margin-bottom: 12px; padding-left: 20px; }
                li { margin-bottom: 6px; } strong { font-weight: bold; } em { font-style: italic; } hr { border: 0; height: 1px; background: #cccccc; margin: 25px 0; }
                blockquote { border-left: 4px solid #dddddd; padding-left: 15px; margin-left: 0; color: #555555; font-style: italic; }
                pre { background-color: #f7f7f7; padding: 15px; border-radius: 4px; overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 13px; }
                code { font-family: 'Courier New', Courier, monospace; background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-size: 0.9em;}
                pre code { background-color: transparent; padding: 0; }
                .contact-info { margin-top:30px; padding-top:15px; border-top: 1px solid #cccccc; font-size:0.9em; color:#555555; }
                .footer-note { margin-top:40px; padding-top:20px; border-top:1px dashed #cccccc; font-style:italic; font-size:0.85em; color:#777777; text-align:center; }
            </style></head><body>
            ${typeof marked !== 'undefined' ? marked.parse(rawMarkdownForDownload) : '<pre>' + rawMarkdownForDownload + '</pre>'}
            </body></html>`;
        const blob = new Blob([htmlToDownload], { type: 'text/html;charset=utf-8' });
        const today = new Date();
        const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        const filename = `SuDS_Enviro_Proposal_${projectNameInput.value.trim() || 'General'}_${dateString}.html`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob); link.download = filename;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(link.href); 
        alert('Proposal HTML file ready. You can open this file with Word or import into Google Docs for further editing and saving as .docx.');
    });

    loadApiKey(); 
    loadConfigurations();

    window.addEventListener('storage', function(event) {
        if (event.key === savedConfigStorageKey) loadConfigurations();
        if (event.key === userApiKeyStorageKey) loadApiKey();

        
    });
});


// js/main.js (or at the end of existing page-specific scripts)
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            const isExpanded = navLinks.classList.contains('active');
            mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
        });
    }

    // Optional: Close mobile menu if a link is clicked
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }
});
