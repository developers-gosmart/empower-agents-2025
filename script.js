document.addEventListener('DOMContentLoaded', () => {
    const agentesTableBody = document.querySelector('#agentesTable tbody');
    const btnNuevoAgente = document.getElementById('btnNuevoAgente');
    const modalAgente = document.getElementById('modalAgente');
    const formAgente = document.getElementById('formAgente');
    const agenteIdInput = document.getElementById('agenteId');
    const imageFile = document.getElementById('imageFile');
    const imageInput = document.getElementById('image');
    const fullNameInput = document.getElementById('fullName');
    const stateInput = document.getElementById('state');
    const salesInput = document.getElementById('sales');
    const agentNumberInput = document.getElementById('agent_number');
    const anlzdPremInput = document.getElementById('anlzd_prem');
    const modalEliminar = document.getElementById('modalEliminar');
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    const closeModalButtons = document.querySelectorAll('.close-button');
    const btnExportarCSV = document.getElementById('btnExportarCSV');
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnExportarPDF = document.getElementById('btnExportarPDF');

    const apiUrl = 'https://wstableagentempower.gosmartcrm.com:8443/ws';
    const headers = {
        'Content-Type': 'application/json',
    };

    let agentes = [];
    let agenteAEditarId = null;
    let totalRecords = 0;
    let currentPage = 1;
    let currentLength = 10;
    let currentOrder = 'ASC';
    const pageSizeOptions = [10, 25, 50, 100, 500, 1000];
    const paginationControls = document.createElement('div');
    paginationControls.classList.add('pagination-controls');

    const pageSizeSelect = document.createElement('select');
    pageSizeSelect.classList.add('form-select', 'form-select-sm');
    pageSizeOptions.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        if (size === currentLength) {
            option.selected = true;
        }
        pageSizeSelect.appendChild(option);
    });

    const pageInfo = document.createElement('span');
    pageInfo.classList.add('page-info');

    paginationControls.appendChild(document.createTextNode('Registros por página: '));
    paginationControls.appendChild(pageSizeSelect);
    paginationControls.appendChild(pageInfo);
    document.querySelector('.container').appendChild(paginationControls);

    async function obtenerAgentes() {
        console.log('Obteniendo agentes...');
        try {
            const start = (currentPage - 1) * currentLength;
            const response = await fetch(`${apiUrl}/agent/paginator?start=${start}&length=${currentLength}&order=${currentOrder}`, {
                method: 'GET',
                headers: headers,
            });
            if (!response.ok) {
                throw new Error(`HTTP error! state: ${response.state}`);
            }
            const resp = await response.json();
            const data = resp.data;
            agentes = data.list;
            totalRecords = data.recordsTotal;
            renderTable();
            updatePaginationInfo();
        } catch (error) {
            console.error('Error al obtener agentes:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar',
                text: 'No se pudieron cargar los agentes.',
            });
        }
    }

    async function crearAgente(nuevoAgente) {
        console.log('Creando agente...');
        try {
            const response = await fetch(`${apiUrl}/agent`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(nuevoAgente),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! state: ${response.state}`);
            }
            const resp = await response.json();
            const agenteCreado = resp.data;
            agentes.push(agenteCreado);
            obtenerAgentes(); // Recargar la tabla para reflejar el nuevo agente
            closeModal(modalAgente);
            Swal.fire({
                icon: 'success',
                title: 'Agente creado',
                text: 'El agente se ha creado exitosamente.',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error al crear agente:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al crear',
                text: 'No se pudo crear el agente.',
            });
        }
    }

    async function actualizarAgente(agenteActualizado) {
        console.log('Actualizando agente...');
        try {
            const response = await fetch(`${apiUrl}/agent`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(agenteActualizado),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! state: ${response.state}`);
            }
            const resp = await response.json();
            const agenteModificado = resp.data;
            console.log('Agente modificado:', agenteModificado);
            agentes = agentes.map(agente => (agente.id === agenteModificado.id ? agenteModificado : agente));
            obtenerAgentes(); // Recargar la tabla para reflejar la actualización
            closeModal(modalAgente);
            Swal.fire({
                icon: 'success',
                title: 'Agente actualizado',
                text: 'El agente se ha actualizado exitosamente.',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error al actualizar agente:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al actualizar',
                text: 'No se pudo actualizar el agente.',
            });
        }
    }

    async function eliminarAgente(id) {
        console.log('Eliminando agente...');
        Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${apiUrl}/agent?id=${id}`, {
                        method: 'DELETE',
                        headers: headers,
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! state: ${response.state}`);
                    }
                    obtenerAgentes(); // Recargar la tabla después de eliminar
                    closeModal(modalEliminar);
                    Swal.fire(
                        'Eliminado!',
                        'El agente ha sido eliminado.',
                        'success'
                    );
                } catch (error) {
                    console.error('Error al eliminar agente:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al eliminar',
                        text: 'No se pudo eliminar el agente.',
                    });
                }
            }
        });
    }

    function renderTable() {
        agentesTableBody.innerHTML = '';
        agentes.forEach(agente => {
            const row = agentesTableBody.insertRow();
            if (agente.image) {
                imageCell.innerHTML = `<img src="${agente.image}" style="max-width: 50px; height: auto; vertical-align: middle;">`;
            } else {
                imageCell.innerHTML = `<img src="profile.webp" style="max-width: 50px; height: auto; vertical-align: middle;">`; // Mostrar profile.webp
            }
            row.insertCell().textContent = agente.fullName;
            row.insertCell().textContent = agente.agentNumber; // Nuevo
            row.insertCell().textContent = agente.anlzdPrem;     // Nuevo
            row.insertCell().textContent = agente.state;
            row.insertCell().textContent = agente.sales;
            const actionsCell = row.insertCell();
            actionsCell.classList.add('actions');
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.addEventListener('click', () => openEditModal(agente.id));
            actionsCell.appendChild(editButton);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.addEventListener('click', () => openDeleteModal(agente.id));
            actionsCell.appendChild(deleteButton);
        });
    }

    function updatePaginationInfo() {
        const totalPages = Math.ceil(totalRecords / currentLength);
        pageInfo.textContent = `Mostrando página ${currentPage} de ${totalPages} (${totalRecords} registros totales)`;
    }

    function openModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        formAgente.reset();
        agenteAEditarId = null;
    }

    btnNuevoAgente.addEventListener('click', () => {
        openModal(modalAgente);
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(modalAgente);
            closeModal(modalEliminar);
        });
    });

    formAgente.addEventListener('submit', (event) => {
        event.preventDefault();
        const image = imageInput.value;
        const fullName = fullNameInput.value;
        const state = stateInput.value;
        const sales = parseInt(salesInput.value);
        const agentNumber = agentNumberInput.value; // Nuevo
        const anlzdPrem = parseFloat(anlzdPremInput.value);     // Nuevo

        const nuevoAgente = { id: agenteAEditarId, image, fullName, state, sales, agentNumber, anlzdPrem }; // Nuevo

        if (agenteAEditarId) {
            actualizarAgente(nuevoAgente);
        } else {
            crearAgente(nuevoAgente);
        }
    });

    function openEditModal(id) {
        agenteAEditarId = id;
        const agenteAEditar = agentes.find(agente => agente.id === id);
        if (agenteAEditar) {
            agenteIdInput.value = agenteAEditar.id;
            imageInput.value = '';
            fullNameInput.value = agenteAEditar.fullName;
            stateInput.value = agenteAEditar.state;
            salesInput.value = agenteAEditar.sales;
            agentNumberInput.value = agenteAEditar.agentNumber || ''; // Nuevo
            anlzdPremInput.value = agenteAEditar.anlzdPrem || 0;     // Nuevo
            openModal(modalAgente);
        }
    }

    function openDeleteModal(id) {
        agenteAEliminarId = id;
        // No es necesario abrir la modal aquí, Swal lo reemplaza
        eliminarAgente(id); // Llamamos directamente a la función de eliminación con confirmación
    }

    btnConfirmarEliminar.addEventListener('click', () => {
        // Esta parte ya no es necesaria, la lógica de confirmación está en la función eliminarAgente con Swal
    });

    pageSizeSelect.addEventListener('change', (event) => {
        currentLength = parseInt(event.target.value);
        currentPage = 1; // Reset to the first page when page size changes
        obtenerAgentes();
    });

    // --- Funciones de exportación (necesitarás librerías externas para formatos avanzados) ---
    btnExportarCSV.addEventListener('click', () => {
        const csvData = [
            ['id', 'image', 'Nombre Completo', 'agent_number', 'anlzd_prem', 'state', 'sales'], // Nuevo
            ...agentes.map(agente => [agente.id, agente.image, agente.fullName, agente.agentNumber, agente.anlzdPrem, agente.state, agente.sales]) // Nuevo
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agentes.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    });

    btnExportarExcel.addEventListener('click', () => {
        Swal.fire('Información', 'Función para exportar a Excel (requiere librería como XLSX)', 'info');
        // Aquí implementarías la lógica con una librería como XLSX.js
    });

    btnExportarPDF.addEventListener('click', () => {
        Swal.fire('Información', 'Función para exportar a PDF (requiere librería como jsPDF)', 'info');
        // Aquí implementarías la lógica con una librería como jsPDF
    });

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    imageFile.addEventListener('change', async function () {
        const file = this.files[0];
        if (file) {
            const base64Image = await toBase64(file);
            imageInput.value = base64Image;
        } else {
            imageInput.value = ''; // Limpiar el campo oculto si no se selecciona archivo
        }
    });

    // --- Inicialización ---
    obtenerAgentes();
});
