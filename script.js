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
    const imagePreview = document.getElementById('imagePreview'); // Nuevo elemento para la vista previa
    const cropOptions = {
        aspectRatio: 1 / 1, // Relación de aspecto cuadrada
        viewMode: 1,
    };
    let cropper;

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
            row.insertCell().innerHTML = `<img src="${agente.image || 'profile.webp'}" alt="${agente.fullName}" style="max-width: 50px; height: auto; vertical-align: middle;">`;
            row.insertCell().textContent = agente.fullName;
            row.insertCell().textContent = agente.agentNumber;
            row.insertCell().textContent = agente.anlzdPrem;
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
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        imagePreview.src = ''; // Limpiar la vista previa
        imageInput.value = ''; // Limpiar el campo oculto
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

    formAgente.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!cropper) {
            Swal.fire('Error', 'Por favor, selecciona y recorta una imagen.', 'error');
            return;
        }
        const croppedCanvas = cropper.getCroppedCanvas();
        const croppedImageBase64 = croppedCanvas.toDataURL('image/png'); // Puedes elegir otro formato

        const fullName = fullNameInput.value;
        const state = stateInput.value;
        const sales = parseInt(salesInput.value);
        const agentNumber = agentNumberInput.value;
        const anlzdPrem = parseFloat(anlzdPremInput.value);

        const nuevoAgente = { id: agenteAEditarId, image: croppedImageBase64, fullName, state, sales, agentNumber, anlzdPrem };

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
            imagePreview.src = agenteAEditar.image || 'profile.webp'; // Mostrar imagen existente
            imageInput.value = agenteAEditar.image || '';
            fullNameInput.value = agenteAEditar.fullName;
            stateInput.value = agenteAEditar.state;
            salesInput.value = agenteAEditar.sales;
            agentNumberInput.value = agenteAEditar.agentNumber || '';
            anlzdPremInput.value = agenteAEditar.anlzdPrem || 0;
            openModal(modalAgente);
            // Inicializar Cropper después de que el modal sea visible y la imagen cargue
            setTimeout(() => {
                if (imagePreview.src) {
                    initializeCropper(imagePreview);
                }
            }, 300); // Un pequeño delay para asegurar que la imagen se haya cargado
        }
    }

    function openDeleteModal(id) {
        agenteAEliminarId = id;
        eliminarAgente(id);
    }

    btnConfirmarEliminar.addEventListener('click', () => {
        // La lógica de confirmación está dentro de la función eliminarAgente con Swal
    });

    pageSizeSelect.addEventListener('change', (event) => {
        currentLength = parseInt(event.target.value);
        currentPage = 1;
        obtenerAgentes();
    });

    // --- Funciones de exportación ---
    btnExportarCSV.addEventListener('click', () => {
        const csvData = [
            ['id', 'image', 'Nombre Completo', 'agent_number', 'anlzd_prem', 'state', 'sales'],
            ...agentes.map(agente => [agente.id, agente.image, agente.fullName, agente.agentNumber, agente.anlzdPrem, agente.state, agente.sales])
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
    });

    btnExportarPDF.addEventListener('click', () => {
        Swal.fire('Información', 'Función para exportar a PDF (requiere librería como jsPDF)', 'info');
    });

    function initializeCropper(imgElement) {
        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(imgElement, cropOptions);
    }

    imageFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                // Inicializar Cropper después de cargar la nueva imagen
                initializeCropper(imagePreview);
            }
            reader.readAsDataURL(file);
        } else {
            imagePreview.src = '';
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
        }
    });

    // --- Inicialización ---
    obtenerAgentes();
});