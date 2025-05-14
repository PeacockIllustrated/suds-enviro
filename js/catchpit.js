// js/catchpit.js
document.addEventListener('DOMContentLoaded', function() {
    // Pricing Rules for Catchpit
    const pricingRules = {
        base: 40.00,
        type_adder: { 'Standard': 0, 'Bucket': 30.00, 'Dual Filter': 75.00 },
        adoptable_status: {'adoptable': 50.00, 'non_adoptable': 0},
        depth_base: 50.00,
        depth_per_150mm_step: 10.00,
        pipe_diameter_adder: { '110mm': 0, '160mm': 5.00, '225mm': 15.00 },
        pollutant_adder: { 'Silt': 0, 'Leaves': 10.00, 'Oils': 50.00, 'All': 70.00 },
        removable_bucket_adder: 20.00 // Only if removable_bucket is 'yes'
    };

    // DOM References
    const form = document.getElementById('sudsCatchpitForm');
    const submitStatus = document.getElementById('suds_submit_status');
    const webhookUrl = 'https://mkiminstest.app.n8n.cloud/webhook-test/862c9207-f6dd-4ee7-ae40-4658d15de3d0'; // This can be removed if not used
    const productCodeDisplay = document.getElementById('suds_product_code_display');
    const shoppingListItemsUl = document.getElementById('shopping_list_items');
    const costPriceValueSpan = document.getElementById('cost_price_value');
    const sellPriceValueSpan = document.getElementById('sell_price_value');
    const profitMarkupInput = document.getElementById('profit_markup_percent');

    const catchpitTypeSelect = document.getElementById('cp_type');
    const chamberDepthSelect = document.getElementById('cp_depth');
    const adoptableStatusGroup = document.getElementById('adoptable_status_group');
    const pipeworkDiameterSelect = document.getElementById('cp_pipework_diameter');
    const targetPollutantSelect = document.getElementById('cp_target_pollutant');
    const removableBucketGroup = document.getElementById('removable_bucket_group');

    const savedConfigStorageKey = 'sudsSavedConfigs';


    function formatCurrency(value) { return `£${value.toFixed(2)}`; }

    function populateDepthOptions() {
        const selectedAdoptable = document.querySelector('input[name="adoptable_status"]:checked');
        const adoptableValue = selectedAdoptable?.value;
        const currentDepthValue = chamberDepthSelect.value;
        chamberDepthSelect.innerHTML = ''; // Clear existing options

        if (!adoptableValue) {
            chamberDepthSelect.disabled = true;
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "-- Select Adoptable Status First --";
            chamberDepthSelect.appendChild(defaultOption);
            updateProductCodeDisplay(); // Update displays even if disabled
            updateQuoteDisplay();
            return;
        }

        chamberDepthSelect.disabled = false;
        const selectDepthOption = document.createElement('option');
        selectDepthOption.value = "";
        selectDepthOption.textContent = "-- Select Depth --";
        chamberDepthSelect.appendChild(selectDepthOption);

        const minDepth = 600;
        const maxDepth = (adoptableValue === 'adoptable') ? 3000 : 6000;
        const increment = 150;

        for (let depth = minDepth; depth <= maxDepth; depth += increment) {
            const option = document.createElement('option');
            option.value = depth;
            option.textContent = `${depth}mm`;
            chamberDepthSelect.appendChild(option);
        }

        // Restore previous selection if valid
        if (currentDepthValue && chamberDepthSelect.querySelector(`option[value="${currentDepthValue}"]`)) {
            chamberDepthSelect.value = currentDepthValue;
        } else {
            chamberDepthSelect.value = ""; // Reset if previous value is no longer valid
        }
        updateProductCodeDisplay();
        updateQuoteDisplay();
    }

    function calculateQuote() {
        let totalCost = 0;
        const items = [];
        const formData = new FormData(form);

        totalCost += pricingRules.base;
        items.push({ description: "Catchpit Base Unit", cost: pricingRules.base });

        const cpType = formData.get('cp_type');
        if (cpType && pricingRules.type_adder[cpType]) {
            const cost = pricingRules.type_adder[cpType];
            if (cost > 0) items.push({ description: `Type: ${cpType}`, cost: cost });
            totalCost += cost;
        }

        const adoptableStatus = formData.get('adoptable_status');
        if (adoptableStatus && pricingRules.adoptable_status[adoptableStatus]) {
            const cost = pricingRules.adoptable_status[adoptableStatus];
            if (cost > 0) items.push({ description: `Status: ${adoptableStatus.charAt(0).toUpperCase() + adoptableStatus.slice(1)}`, cost: cost });
            totalCost += cost;
        }

        const depth = parseFloat(formData.get('cp_depth'));
        if (depth && depth >= 600) {
            let depthCost = pricingRules.depth_base;
            const steps = (depth - 600) / 150;
            depthCost += steps * pricingRules.depth_per_150mm_step;
            items.push({ description: `Depth: ${depth}mm`, cost: depthCost });
            totalCost += depthCost;
        }

        const pipeDiameter = formData.get('cp_pipework_diameter');
        if (pipeDiameter && pricingRules.pipe_diameter_adder[pipeDiameter]) {
            const cost = pricingRules.pipe_diameter_adder[pipeDiameter];
            if (cost > 0) items.push({ description: `Pipe Connections: ${pipeDiameter}`, cost: cost * 2 }); // Assuming 2 connections
            totalCost += (cost * 2);
        }

        const pollutant = formData.get('cp_target_pollutant');
        if (pollutant && pricingRules.pollutant_adder[pollutant]) {
            const cost = pricingRules.pollutant_adder[pollutant];
            if (cost > 0) items.push({ description: `Target: ${pollutant}`, cost: cost });
            totalCost += cost;
        }

        const removableBucket = formData.get('removable_bucket');
        if (removableBucket === 'yes') {
            items.push({ description: "Removable Bucket", cost: pricingRules.removable_bucket_adder });
            totalCost += pricingRules.removable_bucket_adder;
        }

        return { total: totalCost, items: items };
    }

    function updateQuoteDisplay() {
        const quote = calculateQuote();
        const costPrice = quote.total;
        const markupPercent = parseFloat(profitMarkupInput.value) || 0;
        const sellPrice = costPrice * (1 + markupPercent / 100);

        shoppingListItemsUl.innerHTML = ''; // Clear previous items
        if (quote.items.length > 0) {
            quote.items.forEach(item => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<span class="item-description">${item.description}</span><span class="item-cost">${formatCurrency(item.cost)}</span>`;
                shoppingListItemsUl.appendChild(listItem);
            });
        } else {
            shoppingListItemsUl.innerHTML = '<li>Select options to see quote...</li>';
        }

        costPriceValueSpan.textContent = formatCurrency(costPrice);
        sellPriceValueSpan.textContent = formatCurrency(sellPrice);
    }

    function getShortCode(value, mapping) {
        return mapping[value] || value.substring(0, 3).toUpperCase();
    }

    function updateProductCodeDisplay() {
        const name = "SECP";
        const typeCodeMapping = { "Standard": "STD", "Bucket": "BKT", "Dual Filter": "DFL" };
        const pollutantCodeMapping = { "Silt": "SIL", "Leaves": "LEA", "Oils": "OIL", "All": "ALL" };

        const type = catchpitTypeSelect.value ? getShortCode(catchpitTypeSelect.value, typeCodeMapping) : 'TYPE';
        const pollutant = targetPollutantSelect.value ? getShortCode(targetPollutantSelect.value, pollutantCodeMapping) : 'POLL';
        const pipeDia = pipeworkDiameterSelect.value ? pipeworkDiameterSelect.value.replace('mm', '') : 'DIA';
        const depth = chamberDepthSelect.value || 'DEPTH';
        const bucketCode = document.querySelector('input[name="removable_bucket"]:checked')?.value === 'yes' ? 'RB' : 'NR';
        const adoptableSelected = form.querySelector('input[name="adoptable_status"]:checked');
        const adoptableCode = adoptableSelected ? (adoptableSelected.value === 'adoptable' ? 'AD' : 'NA') : 'ADSTAT';


        if (type === 'TYPE' || pollutant === 'POLL' || pipeDia === 'DIA' || depth === 'DEPTH' || !adoptableSelected || !chamberDepthSelect.value) {
            productCodeDisplay.textContent = 'Please complete selections...';
            return;
        }
        productCodeDisplay.textContent = `${name}-${type}-${pollutant}-${pipeDia}-${depth}-${bucketCode}-${adoptableCode}`;
    }

    function updateQuoteAndCode() {
        updateProductCodeDisplay();
        updateQuoteDisplay();
    }

    // Attach event listeners
    const elementsTriggeringUpdates = [
        catchpitTypeSelect, chamberDepthSelect, adoptableStatusGroup,
        pipeworkDiameterSelect, targetPollutantSelect, removableBucketGroup,
        profitMarkupInput
    ];

    elementsTriggeringUpdates.forEach(element => {
        if (element) { // Check if element exists
            element.addEventListener('change', updateQuoteAndCode);
            if (element.type === 'number' || element.type === 'text') {
                element.addEventListener('keyup', updateQuoteAndCode);
                element.addEventListener('input', updateQuoteAndCode);
            }
        }
    });

    if (adoptableStatusGroup) {
        // Radio groups need event delegation or listeners on individual radios for 'change'
        Array.from(adoptableStatusGroup.querySelectorAll('input[type="radio"]')).forEach(radio => {
            radio.addEventListener('change', () => {
                populateDepthOptions(); // This already calls updateQuoteAndCode
            });
        });
    }
     if (removableBucketGroup) {
        Array.from(removableBucketGroup.querySelectorAll('input[type="radio"]')).forEach(radio => {
            radio.addEventListener('change', updateQuoteAndCode);
        });
    }


    // Initial population and display updates
    populateDepthOptions(); // This will also call updateProductCodeDisplay and updateQuoteDisplay

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitStatus.textContent = 'Submitting...';
        submitStatus.className = ''; // Reset classes

        // Clear previous validation styles
        form.querySelectorAll('.suds-input, .suds-select').forEach(el => el.style.borderColor = '');
        if (adoptableStatusGroup) adoptableStatusGroup.style.outline = 'none';

        let isValid = true;

        const adoptableSelected = form.querySelector('input[name="adoptable_status"]:checked');
        if (!adoptableSelected) {
            isValid = false;
            if (adoptableStatusGroup) adoptableStatusGroup.style.outline = '2px solid var(--suds-red)';
        }

        const requiredStaticFields = form.querySelectorAll('#cp_type[required], #cp_depth[required], #cp_pipework_diameter[required], #cp_target_pollutant[required]');
        requiredStaticFields.forEach(input => {
            if ((input.tagName === 'SELECT' && input.value === "") || (input.tagName !== 'SELECT' && !input.value.trim())) {
                isValid = false;
                input.style.borderColor = 'var(--suds-red)';
            }
        });

        const bucketSelected = form.querySelector('input[name="removable_bucket"]:checked');
        if (!bucketSelected) { // Assuming removable_bucket is always required to be selected
             isValid = false;
             // Add visual indication for removable_bucket_group if needed
        }


        if (!isValid) {
            submitStatus.textContent = 'Please fill in all required fields.';
            submitStatus.className = 'suds_status_error';
            const firstInvalidField = form.querySelector('[style*="border-color: var(--suds-red)"], [style*="outline"]');
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (firstInvalidField.tagName !== 'SELECT' && firstInvalidField.type !== 'radio') {
                    firstInvalidField.focus();
                }
            }
            return;
        }

        const payload = buildJsonPayload();

        // Save to localStorage
        try {
            const configToSave = { ...payload };
            configToSave.savedId = `suds-cp-${Date.now()}`;
            configToSave.savedTimestamp = new Date().toISOString();

            const existingConfigsRaw = localStorage.getItem(savedConfigStorageKey);
            let savedConfigs = [];
            if (existingConfigsRaw) {
                try {
                    savedConfigs = JSON.parse(existingConfigsRaw);
                    if (!Array.isArray(savedConfigs)) savedConfigs = [];
                } catch (e) {
                    console.error("Error parsing existing localStorage data for sudsSavedConfigs:", e);
                    savedConfigs = [];
                }
            }

            savedConfigs.push(configToSave);
            localStorage.setItem(savedConfigStorageKey, JSON.stringify(savedConfigs));
            console.log("Catchpit configuration saved to localStorage.");
            submitStatus.textContent = 'Catchpit configuration saved successfully!';
            submitStatus.className = 'suds_status_success';
        } catch (storageError) {
            console.error("Error saving Catchpit configuration to localStorage:", storageError);
            submitStatus.textContent = 'Saving to local storage failed: ' + (storageError.message || 'Unknown error.');
            submitStatus.className = 'suds_status_error';
        }

        form.reset();
        populateDepthOptions(); // Resets depth dropdown and updates related displays
        updateProductCodeDisplay();
        updateQuoteDisplay();
    });

    function buildJsonPayload() {
        const formData = new FormData(form);
        const quote = calculateQuote();
        const costPrice = quote.total;
        const markupPercent = parseFloat(profitMarkupInput.value) || 0;
        const sellPrice = costPrice * (1 + markupPercent / 100);

        let derivedProductName = "Catchpit";
        const cpTypeValue = formData.get('cp_type');
        if (cpTypeValue) {
            derivedProductName = `Catchpit (${cpTypeValue})`;
        }

        const payload = {
            product_type: "catchpit",
            derived_product_name: derivedProductName,
            generated_product_code: productCodeDisplay.textContent.startsWith('Please') ? null : productCodeDisplay.textContent,
            adoptable_status: formData.get('adoptable_status'),
            catchpit_details: {
                catchpit_type: cpTypeValue,
                depth_mm: parseFloat(formData.get('cp_depth')) || null,
                pipework_diameter: formData.get('cp_pipework_diameter'),
                target_pollutant: formData.get('cp_target_pollutant'),
                removable_bucket: formData.get('removable_bucket') === 'yes'
            },
            quote_details: {
                items: quote.items,
                cost_price: costPrice,
                profit_markup_percent: markupPercent,
                estimated_sell_price: sellPrice
            }
        };
        return payload;
    }

    // Functions to be called by ai_analyzer.js if this page is loaded in an iframe
    // This is a placeholder for now, will need specific implementation based on how
    // ai_analyzer.js sends data (e.g., postMessage or URL params)
    window.prefillFormFromAIScheduleData = function(data) {
        console.log("Attempting to prefill Catchpit form with AI data:", data);
        // Example:
        // if (data.manhole_type && data.manhole_type.includes("Catchpit")) { // Or some other identifier
        //     if (catchpitTypeSelect && data.inferred_catchpit_type) catchpitTypeSelect.value = data.inferred_catchpit_type;
        //     // ... and so on for other fields based on 'data' object structure from AI schedule
        // }
        // After setting values, trigger change events and update displays
        // elementsTriggeringUpdates.forEach(el => el?.dispatchEvent(new Event('change')));
        // populateDepthOptions(); // or directly updateQuoteAndCode();
        updateQuoteAndCode();
    };
});