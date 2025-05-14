// js/all_configs.js
document.addEventListener('DOMContentLoaded', function() {
    const configList = document.getElementById('config-list');
    const exportButton = document.getElementById('export-configs-btn');
    const clearAllButton = document.getElementById('clear-all-configs-btn'); // New button
    const savedConfigStorageKey = 'sudsSavedConfigs';

    function loadConfigurations() {
        configList.innerHTML = ''; // Clear current list
        const storedData = localStorage.getItem(savedConfigStorageKey);
        let configs = [];

        if (storedData) {
            try {
                configs = JSON.parse(storedData);
                if (!Array.isArray(configs)) {
                    configs = [];
                }
            } catch (e) {
                console.error("Error parsing saved configurations:", e);
                configList.innerHTML = '<p>Error loading configurations. Data might be corrupted.</p>';
                return;
            }
        }

        if (configs.length === 0) {
            configList.innerHTML = '<p>No product configurations saved yet. Use the configurator tools to save some!</p>';
            exportButton.style.display = 'none';
            clearAllButton.style.display = 'none'; // Hide clear all if no configs
            return;
        }
        exportButton.style.display = 'inline-block'; // Show if configs exist
        clearAllButton.style.display = 'inline-block'; // Show if configs exist


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
                if (pre) {
                    pre.style.display = pre.style.display === 'none' ? 'block' : 'none';
                }
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
            loadConfigurations(); // Refresh the list (will show "No configurations")
            alert('All saved configurations have been cleared.');
        }
    });

    loadConfigurations();

    window.addEventListener('storage', function(event) {
        if (event.key === savedConfigStorageKey) {
            loadConfigurations();
        }
    });
});