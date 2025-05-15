// js/orifice.js
document.addEventListener('DOMContentLoaded', function() {
    // Pricing Rules for Orifice Flow Control
    const pricingRules = { base: 70.00, adoptable_status: {'adoptable': 60.00, 'non_adoptable': 0}, depth_base: 80.00, depth_per_150mm_step: 15.00, diameter: {'315mm': 0, '450mm': 50.00, '600mm': 110.00, '1050mm': 280.00}, pipe_size_connection: { '110mm': 10.00, '160mm': 15.00, '225mm': 25.00 }, orifice_plate_base: 45.00, orifice_diameter_adder: 0.25, bypass_adder: 120.00 };

    // DOM References
    const form = document.getElementById('sudsOrificeForm');
    const submitStatus = document.getElementById('suds_submit_status');
    // const webhookUrl = 'https://mkiminstest.app.n8n.cloud/webhook-test/862c9207-f6dd-4ee7-ae40-4658d15de3d0'; // Can remove if not used
    const productCodeDisplay = document.getElementById('suds_product_code_display');
    const shoppingListItemsUl = document.getElementById('shopping_list_items');
    const costPriceValueSpan = document.getElementById('cost_price_value');
    const sellPriceValueSpan = document.getElementById('sell_price_value');
    const profitMarkupInput = document.getElementById('profit_markup_percent');
    const chamberDepthSelect = document.getElementById('ofc_chamber_depth');
    const chamberDiameterSelect = document.getElementById('ofc_chamber_diameter');
    const adoptableStatusGroup = document.getElementById('adoptable_status_group');
    const pipeworkSizeSelect = document.getElementById('ofc_pipework_size');
    const targetFlowInput = document.getElementById('ofc_target_flow');
    const headHeightInput = document.getElementById('ofc_head_height');
    const orificeDiameterInput = document.getElementById('ofc_orifice_diameter');
    const bypassGroup = document.getElementById('bypass_group');
    const savedConfigStorageKey = 'sudsSavedConfigs';

    // --- Helper Functions ---
    function formatCurrency(value) { return `£${value.toFixed(2)}`; }

    function populateDepthOptions() {
        const selectedAdoptable = document.querySelector('input[name="adoptable_status"]:checked');
        const adoptableValue = selectedAdoptable?.value;
        const currentDepthValue = chamberDepthSelect.value;
        chamberDepthSelect.innerHTML = '';
        if (!adoptableValue) {
            chamberDepthSelect.disabled = true; const o = document.createElement('option'); o.value = ""; o.textContent = "-- Select Adoptable Status First --"; chamberDepthSelect.appendChild(o);
            updateProductCodeDisplay(); updateQuoteDisplay(); return;
        }
        chamberDepthSelect.disabled = false; const dO = document.createElement('option'); dO.value = ""; dO.textContent = "-- Select Depth --"; chamberDepthSelect.appendChild(dO);
        const minD = 600; const maxD = (adoptableValue === 'adoptable') ? 3000 : 6000; const inc = 150;
        for (let d = minD; d <= maxD; d += inc) { const o = document.createElement('option'); o.value = d; o.textContent = `${d}mm`; chamberDepthSelect.appendChild(o); }
        if (currentDepthValue && chamberDepthSelect.querySelector(`option[value="${currentDepthValue}"]`)) { chamberDepthSelect.value = currentDepthValue; } else { chamberDepthSelect.value = ""; }
        updateProductCodeDisplay(); updateQuoteDisplay();
    }

    function calculateQuote() {
        let totalCost = 0; const items = []; const formData = new FormData(form);
        totalCost += pricingRules.base; items.push({ description: "Orifice Chamber Base", cost: pricingRules.base });
        const adoptableStatus = formData.get('adoptable_status'); if (adoptableStatus && pricingRules.adoptable_status[adoptableStatus]) { const c = pricingRules.adoptable_status[adoptableStatus]; if (c > 0) items.push({ description: `Status: ${adoptableStatus.charAt(0).toUpperCase() + adoptableStatus.slice(1)}`, cost: c }); totalCost += c; }
        const depth = parseFloat(formData.get('ofc_chamber_depth')); if (depth && depth >= 600) { let depthCost = pricingRules.depth_base; const steps = (depth - 600) / 150; depthCost += steps * pricingRules.depth_per_150mm_step; items.push({ description: `Depth: ${depth}mm`, cost: depthCost }); totalCost += depthCost; }
        const diameter = formData.get('ofc_chamber_diameter'); if (diameter && pricingRules.diameter[diameter]) { const c = pricingRules.diameter[diameter]; if (c > 0) items.push({ description: `Diameter: ${diameter}`, cost: c }); totalCost += c; }
        const pipeSize = formData.get('ofc_pipework_size'); if (pipeSize && pricingRules.pipe_size_connection[pipeSize]) { const connectionCost = pricingRules.pipe_size_connection[pipeSize] * 2; items.push({ description: `Inlet/Outlet Connections (${pipeSize})`, cost: connectionCost }); totalCost += connectionCost; }
        let plateCost = pricingRules.orifice_plate_base;
        const orificeDiameter = parseFloat(formData.get('ofc_orifice_diameter'));
        if (orificeDiameter && orificeDiameter > 0) {
            plateCost += orificeDiameter * pricingRules.orifice_diameter_adder;
            items.push({ description: `Orifice Plate (${orificeDiameter}mm)`, cost: plateCost });
        } else { // Default cost if diameter is not specified (or calculated elsewhere)
            items.push({ description: `Orifice Plate (Standard/Calculated)`, cost: plateCost });
        }
        totalCost += plateCost;
        const bypassRequired = formData.get('bypass_required'); if (bypassRequired === 'yes') { items.push({ description: "Bypass Included", cost: pricingRules.bypass_adder }); totalCost += pricingRules.bypass_adder; }
        return { total: totalCost, items: items };
    }


    function updateQuoteDisplay() {
        const quote = calculateQuote(); const costPrice = quote.total; const markupPercent = parseFloat(profitMarkupInput.value) || 0; const sellPrice = costPrice * (1 + markupPercent / 100);
        shoppingListItemsUl.innerHTML = ''; if (quote.items.length > 0) { quote.items.forEach(item => { const li = document.createElement('li'); li.innerHTML = `<span class="item-description">${item.description}</span><span class="item-cost">${formatCurrency(item.cost)}</span>`; shoppingListItemsUl.appendChild(li); }); } else { shoppingListItemsUl.innerHTML = '<li>Select options to see quote...</li>'; }
        costPriceValueSpan.textContent = formatCurrency(costPrice); sellPriceValueSpan.textContent = formatCurrency(sellPrice);
    }

    function updateProductCodeDisplay() {
        const adoptableSelected = form.querySelector('input[name="adoptable_status"]:checked');
        const adoptableCode = adoptableSelected ? (adoptableSelected.value === 'adoptable' ? 'AD' : 'NA') : 'ADSTAT';
        const depth = chamberDepthSelect.value || 'DEPTH';
        const diameter = chamberDiameterSelect.value ? chamberDiameterSelect.value.replace('mm', '') : 'DIAM';
        const flow = targetFlowInput.value ? targetFlowInput.value + 'LPS' : 'FLOW';
        const head = headHeightInput.value ? headHeightInput.value + 'MHD' : 'HEAD';
        const bypassCode = document.querySelector('input[name="bypass_required"]:checked')?.value === 'yes' ? '-BY' : '';

        if (depth === 'DEPTH' || diameter === 'DIAM' || flow === 'FLOW' || head === 'HEAD' || !adoptableSelected || !chamberDepthSelect.value || !targetFlowInput.value.trim() || !headHeightInput.value.trim() || !chamberDiameterSelect.value) {
            productCodeDisplay.textContent = 'Please complete selections...';
            return;
        }
        productCodeDisplay.textContent = `OFC-${diameter}-${depth}-${flow}-${head}-${adoptableCode}${bypassCode}`;
    }

    function updateQuoteAndCode() { updateProductCodeDisplay(); updateQuoteDisplay(); }

    const elementsTriggeringUpdates = [chamberDepthSelect, chamberDiameterSelect, adoptableStatusGroup, pipeworkSizeSelect, targetFlowInput, headHeightInput, orificeDiameterInput, profitMarkupInput, bypassGroup];
    elementsTriggeringUpdates.forEach(el => {
        if(el) {
            el.addEventListener('change', updateQuoteAndCode);
            if (el.type === 'number' || el.type === 'text') { el.addEventListener('keyup', updateQuoteAndCode); el.addEventListener('input', updateQuoteAndCode); }
        }
    });

    if (adoptableStatusGroup) {
        Array.from(adoptableStatusGroup.querySelectorAll('input[type="radio"]')).forEach(radio => {
           radio.addEventListener('change', () => { populateDepthOptions(); });
       });
    }
    if (bypassGroup) {
        Array.from(bypassGroup.querySelectorAll('input[type="radio"]')).forEach(radio => {
           radio.addEventListener('change', updateQuoteAndCode);
       });
    }


    populateDepthOptions(); updateProductCodeDisplay(); updateQuoteDisplay();

    form.addEventListener('submit', function(event) {
        event.preventDefault(); submitStatus.textContent = 'Submitting...'; submitStatus.className = '';
        form.querySelectorAll('.suds-input, .suds-select').forEach(el => el.style.borderColor = '');
        if(adoptableStatusGroup) adoptableStatusGroup.style.outline = 'none';

        let isValid = true;
        const adoptableSelected = form.querySelector('input[name="adoptable_status"]:checked');
        if (!adoptableSelected) { isValid = false; if(adoptableStatusGroup) adoptableStatusGroup.style.outline = '2px solid var(--suds-red)'; }

        const requiredStaticFields = form.querySelectorAll('#ofc_chamber_depth[required], #ofc_chamber_diameter[required], #ofc_pipework_size[required], #ofc_target_flow[required], #ofc_head_height[required]');
        requiredStaticFields.forEach(input => { if ((input.tagName === 'SELECT' && input.value === "") || (input.tagName !== 'SELECT' && !input.value.trim())) { isValid = false; input.style.borderColor = 'var(--suds-red)'; } });

        if (!isValid) {
            submitStatus.textContent = 'Please fill in all required fields.'; submitStatus.className = 'suds_status_error';
            const firstInvalidField = form.querySelector('[style*="border-color: var(--suds-red)"], [style*="outline"]');
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (firstInvalidField.tagName !== 'SELECT' && firstInvalidField.type !== 'radio') {
                    firstInvalidField.focus();
                }
            } return;
        }

        const payload = buildJsonPayload();

        try {
            const configToSave = { ...payload };
            configToSave.savedId = `suds-ofc-${Date.now()}`;
            configToSave.savedTimestamp = new Date().toISOString();
            // derived_product_name is in buildJsonPayload

            const existingConfigsRaw = localStorage.getItem(savedConfigStorageKey);
            let savedConfigs = [];
            if (existingConfigsRaw) { try { savedConfigs = JSON.parse(existingConfigsRaw); if (!Array.isArray(savedConfigs)) savedConfigs = []; } catch (e) { console.error("Error parsing localStorage:", e); savedConfigs = []; } }

            savedConfigs.push(configToSave);
            localStorage.setItem(savedConfigStorageKey, JSON.stringify(savedConfigs));
            submitStatus.textContent = 'Orifice configuration saved successfully!';
            submitStatus.className = 'suds_status_success';
        } catch (storageError) {
            console.error("Error saving to localStorage:", storageError);
            submitStatus.textContent = 'Saving to local storage failed: ' + (storageError.message || 'Unknown error.');
            submitStatus.className = 'suds_status_error';
        }

        form.reset(); populateDepthOptions(); updateProductCodeDisplay(); updateQuoteDisplay();
    });

    function buildJsonPayload() {
        const formData = new FormData(form); const quote = calculateQuote(); const costPrice = quote.total; const markupPercent = parseFloat(profitMarkupInput.value) || 0; const sellPrice = costPrice * (1 + markupPercent / 100);
        const derivedProductName = `OFC ${formData.get('ofc_target_flow') || 'N/A'}LPS`;

        const payload = {
            product_type: "orifice_flow_control",
            adoptable_status: formData.get('adoptable_status'),
            derived_product_name: derivedProductName,
            generated_product_code: productCodeDisplay.textContent.startsWith('Please') ? null : productCodeDisplay.textContent,
            chamber_details: { chamber_depth_mm: parseFloat(formData.get('ofc_chamber_depth')) || null, chamber_diameter: formData.get('ofc_chamber_diameter'), pipework_size: formData.get('ofc_pipework_size') },
            flow_control_params: { target_flow_lps: parseFloat(formData.get('ofc_target_flow')) || null, design_head_m: parseFloat(formData.get('ofc_head_height')) || null, orifice_diameter_mm: parseFloat(formData.get('ofc_orifice_diameter')) || null, bypass_required: formData.get('bypass_required') === 'yes' },
            quote_details: { items: quote.items, cost_price: costPrice, profit_markup_percent: markupPercent, estimated_sell_price: sellPrice }
        };
        return payload;
    }

    // Placeholder for AI integration
    window.prefillFormFromAIScheduleData = function(data) {
        console.log("Attempting to prefill Orifice form with AI data:", data);
        // Logic to map 'data' (from AI schedule) to orifice form fields
        // e.g., if data.hydro_brake === 'Y' or data.manhole_type suggests flow control
        // You'll need to infer target_flow, head_height, or set defaults.
        // Chamber details like depth/diameter can be prefilled.
        updateQuoteAndCode();
    };
});
