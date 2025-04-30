// export.js - Funcionalidad para exportar a Excel

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de exportación
    if (document.getElementById('exportTab')) {
        setupExportPage();
    }
});

function setupExportPage() {
    // Crear la interfaz de exportación dinámicamente
    const main = document.querySelector('main');
    if (!main) return;
    
    main.innerHTML = `
        <section class="export-section">
            <h2>Exportar Historial a Excel</h2>
            
            <div class="export-filters">
                <div class="filter-group">
                    <label for="exportStartDate">Desde:</label>
                    <input type="date" id="exportStartDate">
                </div>
                
                <div class="filter-group">
                    <label for="exportEndDate">Hasta:</label>
                    <input type="date" id="exportEndDate">
                </div>
                
                <div class="filter-group">
                    <label for="exportUserFilter">Usuario:</label>
                    <select id="exportUserFilter">
                        <option value="">Todos los usuarios</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="exportActionFilter">Tipo de acción:</label>
                    <select id="exportActionFilter">
                        <option value="">Todas las acciones</option>
                        <option value="ADD">Agregar</option>
                        <option value="UPDATE">Actualizar</option>
                        <option value="DELETE">Eliminar</option>
                        <option value="INCREMENT">Incrementar</option>
                        <option value="DECREMENT">Reducir</option>
                    </select>
                </div>
            </div>
            
            <div class="export-actions">
                <button id="previewBtn" class="export-btn">Vista Previa</button>
                <button id="exportBtn" class="export-btn primary">Exportar a Excel</button>
            </div>
            
            <div class="export-preview">
                <h3>Vista Previa</h3>
                <div class="table-container">
                    <table id="exportPreviewTable">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Usuario</th>
                                <th>Producto</th>
                                <th>ID</th>
                                <th>Acción</th>
                                <th>Cantidad</th>
                                <th>Anterior</th>
                                <th>Nuevo</th>
                            </tr>
                        </thead>
                        <tbody id="exportPreviewBody">
                            <!-- Vista previa se cargará aquí -->
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    `;
    
    // Cargar usuarios en el filtro
    populateExportUserFilter();
    
    // Configurar eventos
    document.getElementById('previewBtn')?.addEventListener('click', updateExportPreview);
    document.getElementById('exportBtn')?.addEventListener('click', exportToExcel);
}

function populateExportUserFilter() {
    const history = getHistory();
    const userFilter = document.getElementById('exportUserFilter');
    if (!userFilter) return;
    
    const users = new Set();
    history.forEach(record => users.add(record.username));
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        userFilter.appendChild(option);
    });
}

function getFilteredHistory() {
    const startDate = document.getElementById('exportStartDate')?.value;
    const endDate = document.getElementById('exportEndDate')?.value;
    const userFilter = document.getElementById('exportUserFilter')?.value;
    const actionFilter = document.getElementById('exportActionFilter')?.value;
    
    let history = getHistory();
    
    // Aplicar filtros
    if (startDate) {
        history = history.filter(record => {
            const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
            return recordDate >= startDate;
        });
    }
    
    if (endDate) {
        history = history.filter(record => {
            const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
            return recordDate <= endDate;
        });
    }
    
    if (userFilter) {
        history = history.filter(record => record.username === userFilter);
    }
    
    if (actionFilter) {
        history = history.filter(record => record.action === actionFilter);
    }
    
    return history;
}

function updateExportPreview() {
    const filteredHistory = getFilteredHistory();
    const previewBody = document.getElementById('exportPreviewBody');
    if (!previewBody) return;
    
    previewBody.innerHTML = '';
    
    if (filteredHistory.length === 0) {
        previewBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-results">No hay registros que coincidan con los filtros</td>
            </tr>
        `;
        return;
    }
    
    filteredHistory.forEach(record => {
        const date = new Date(record.timestamp);
        const actionName = getActionName(record.action);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date.toLocaleString()}</td>
            <td>${record.username}</td>
            <td>${record.productName}</td>
            <td>${record.productId}</td>
            <td>${actionName}</td>
            <td>${record.action === 'INCREMENT' || record.action === 'DECREMENT' ? 
                Math.abs(record.newQuantity - record.oldQuantity) : '-'}</td>
            <td>${record.oldQuantity}</td>
            <td>${record.newQuantity}</td>
        `;
        previewBody.appendChild(row);
    });
}

function getActionName(actionCode) {
    switch(actionCode) {
        case 'ADD': return 'Agregar';
        case 'UPDATE': return 'Actualizar';
        case 'DELETE': return 'Eliminar';
        case 'INCREMENT': return 'Incrementar';
        case 'DECREMENT': return 'Reducir';
        default: return actionCode;
    }
}

function exportToExcel() {
    const filteredHistory = getFilteredHistory();
    
    if (filteredHistory.length === 0) {
        alert('No hay datos para exportar con los filtros actuales');
        return;
    }
    
    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    
    // Preparar datos
    const excelData = filteredHistory.map(record => {
        const date = new Date(record.timestamp);
        return {
            'Fecha y Hora': date.toLocaleString(),
            'Usuario': record.username,
            'Producto': record.productName,
            'ID Producto': record.productId,
            'Acción': getActionName(record.action),
            'Cantidad Modificada': record.action === 'INCREMENT' || record.action === 'DECREMENT' ? 
                Math.abs(record.newQuantity - record.oldQuantity) : '-',
            'Cantidad Anterior': record.oldQuantity,
            'Cantidad Nueva': record.newQuantity,
            'Fecha (ISO)': record.timestamp,
            'Acción (Código)': record.action
        };
    });
    
    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Añadir hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Historial Inventario");
    
    // Generar nombre de archivo
    const currentDate = new Date().toISOString().slice(0, 10);
    const startDate = document.getElementById('exportStartDate')?.value || 'todo';
    const endDate = document.getElementById('exportEndDate')?.value || 'hoy';
    const fileName = `Historial_Inventario_${startDate}_a_${endDate}_${currentDate}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(wb, fileName);
}

// Función auxiliar para obtener historial
function getHistory() {
    try {
        return JSON.parse(localStorage.getItem('history')) || [];
    } catch (e) {
        console.error('Error al obtener historial:', e);
        return [];
    }
}