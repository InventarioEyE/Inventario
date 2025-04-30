// history.js - Manteniendo intacta la funcionalidad de guardado

// 1. FUNCIONES EXISTENTES (NO MODIFICADAS)
function getHistory() {
    try {
        const history = localStorage.getItem('history');
        return history ? JSON.parse(history) : [];
    } catch (e) {
        console.error('Error al obtener historial:', e);
        return [];
    }
}

function getUsersFromHistory() {
    const history = getHistory();
    const users = new Set(['Todos']);
    history.forEach(record => users.add(record.username));
    return Array.from(users);
}

function renderHistory(filterUser = '', filterDate = '') {
    const history = getHistory();
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const filteredHistory = history.filter(record => {
        const userMatch = !filterUser || filterUser === 'Todos' || record.username === filterUser;
        const dateMatch = !filterDate || new Date(record.timestamp).toISOString().split('T')[0] === filterDate;
        return userMatch && dateMatch;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (filteredHistory.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No se encontraron registros</td></tr>';
        return;
    }

    filteredHistory.forEach(record => {
        const date = new Date(record.timestamp);
        const actionType = getActionType(record.action);
        const amountChanged = getAmountChanged(record);
        
        tableBody.innerHTML += `
            <tr>
                <td>${date.toLocaleString()}</td>
                <td>${record.username}</td>
                <td>${record.productName} (ID: ${record.productId})</td>
                <td>${actionType}</td>
                <td>${amountChanged}</td>
                <td>${record.oldQuantity}</td>
                <td>${record.newQuantity}</td>
            </tr>
        `;
    });
}

// Funciones auxiliares existentes
function getActionType(action) {
    const types = {
        'ADD': 'Agregar',
        'UPDATE': 'Actualizar',
        'DELETE': 'Eliminar',
        'INCREMENT': 'Incrementar',
        'DECREMENT': 'Reducir'
    };
    return types[action] || action;
}

function getAmountChanged(record) {
    if (['INCREMENT', 'DECREMENT'].includes(record.action)) {
        return Math.abs(record.newQuantity - record.oldQuantity);
    }
    return record.action === 'ADD' ? record.newQuantity : 
           record.action === 'DELETE' ? record.oldQuantity : '-';
}

function populateUserFilter() {
    const users = getUsersFromHistory();
    const filterSelect = document.getElementById('filterUser');
    if (!filterSelect) return;

    filterSelect.innerHTML = '';
    users.forEach(user => {
        filterSelect.innerHTML += `<option value="${user}">${user}</option>`;
    });
}

// 2. NUEVAS FUNCIONES PARA EXPORTACIÓN (MEJORA)
function exportToExcel() {
    try {
        const history = getHistory();
        const selectedUser = document.getElementById('filterUser').value;
        const userName = selectedUser === 'Todos' ? 'Todos los usuarios' : selectedUser;
        const exportDate = new Date().toISOString().split('T')[0];

        if (history.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        // Filtrar por usuario
        const filteredHistory = selectedUser === 'Todos' 
            ? history 
            : history.filter(record => record.username === selectedUser);

        if (filteredHistory.length === 0) {
            alert(`No hay registros para ${userName}`);
            return;
        }

        // Procesar datos
        const { increments, decrements } = processExportData(filteredHistory);

        // Crear libro Excel
        const wb = XLSX.utils.book_new();
        
        // Hoja AUMENTOS (solo INCREMENT)
        const wsIncrements = XLSX.utils.json_to_sheet(increments.records);
        XLSX.utils.book_append_sheet(wb, wsIncrements, "Aumentos");

        // Hoja DISMINUCIONES (solo DECREMENT)
        const wsDecrements = XLSX.utils.json_to_sheet(decrements.records);
        XLSX.utils.book_append_sheet(wb, wsDecrements, "Disminuciones");

        // Hoja TOTALES
        const wsTotals = XLSX.utils.json_to_sheet([
            { 'Descripción': 'Total aumentos (INCREMENT)', 'Valor': increments.total },
            { 'Descripción': 'Total disminuciones (DECREMENT)', 'Valor': decrements.total },
            { 'Descripción': 'Diferencia neta', 'Valor': increments.total - decrements.total },
            {},
            { 'Descripción': 'Información adicional', 'Valor': '' },
            { 'Descripción': 'Usuario', 'Valor': userName },
            { 'Descripción': 'Fecha exportación', 'Valor': exportDate },
            { 'Descripción': 'Registros procesados', 'Valor': filteredHistory.length }
        ]);
        XLSX.utils.book_append_sheet(wb, wsTotals, "Totales");

        // Exportar archivo
        XLSX.writeFile(wb, `Historial_${userName}_${exportDate}.xlsx`);
        alert('Archivo exportado con éxito');

    } catch (error) {
        console.error('Error en exportación:', error);
        alert('Error al exportar: ' + error.message);
    }
}

function processExportData(history) {
    const increments = { records: [], total: 0 };
    const decrements = { records: [], total: 0 };

    history.forEach(record => {
        const date = new Date(record.timestamp);
        const row = {
            'Fecha': date.toLocaleDateString(),
            'Hora': date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            'Producto': record.productName,
            'ID': record.productId,
            'Cantidad': 0,
            'Usuario': record.username
        };

        if (record.action === 'INCREMENT') {
            const amount = record.newQuantity - record.oldQuantity;
            row.Cantidad = amount;
            increments.records.push(row);
            increments.total += amount;
        } 
        else if (record.action === 'DECREMENT') {
            const amount = record.oldQuantity - record.newQuantity;
            row.Cantidad = amount;
            decrements.records.push(row);
            decrements.total += amount;
        }
    });

    return { increments, decrements };
}

// 3. INICIALIZACIÓN (SIN CAMBIOS)
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('historyTableBody')) return;

    // Crear botón exportación si no existe
    if (!document.getElementById('exportExcelBtn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportExcelBtn';
        exportBtn.className = 'export-btn';
        exportBtn.textContent = '📊 Exportar a Excel';
        document.querySelector('.history-actions').prepend(exportBtn);
    }

    // Configurar eventos
    populateUserFilter();
    renderHistory();

    document.getElementById('applyFilters')?.addEventListener('click', () => {
        const user = document.getElementById('filterUser').value;
        const date = document.getElementById('filterDate').value;
        renderHistory(user, date);
    });

    document.getElementById('resetFilters')?.addEventListener('click', () => {
        document.getElementById('filterUser').value = 'Todos';
        document.getElementById('filterDate').value = '';
        renderHistory();
    });

    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
});