let tickets = [];
let currentEscalation = "L1 - Reemplazo Menor";
const TOTAL_STEPS = 6;

// NAVEGACIÓN
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

function startFlow(service) {
    if (service === 'perifericos') {
        currentEscalation = "L1 - Reemplazo Menor"; // Reset default
        showView('flow-view');
        nextStep(1);
    } else {
        showView('onedrive-flow');
        document.querySelectorAll('#onedrive-flow .step').forEach(s => s.classList.remove('active'));
        document.getElementById('od-step-1').classList.add('active');
        document.getElementById('od-progress-bar').style.width = '20%';
    }
}

// LOGICA HARDWARE
function nextStep(step) {
    document.querySelectorAll('#flow-view .step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    document.getElementById('progress-bar').style.width = (step / TOTAL_STEPS * 100) + '%';
    
    // Actualizar diagnóstico preliminar en el paso final
    if(step === 6) document.getElementById('hw-diag-pre').innerText = currentEscalation;
}

function setEscalation(type) { currentEscalation = type; }

function addTicket(name, depto, diagnosis) {
    // Cálculo de SLA según el tipo de diagnóstico del documento
    let sla = "15 MIN"; // Triage inicial
    if(diagnosis.includes("L1")) sla = "2 Horas";
    if(diagnosis.includes("L2")) sla = "4 Horas";
    if(diagnosis.includes("L4")) sla = "Garantía Fabricante";

    tickets.push({
        id: "TIC-" + Math.floor(1000 + Math.random() * 9000),
        solicitante: name,
        departamento: depto,
        diagnostico: diagnosis,
        sla: sla,
        estado: "Abierto",
        fecha: new Date().toLocaleString('es-SV'),
        tipo: depto.includes('Hardware') ? 'hardware' : 'cloud'
    });
    document.getElementById('ticket-count').innerText = tickets.length;
}

function generateTicket(depto) {
    const name = document.getElementById('user-name').value;
    if (!name.trim()) return alert("Por favor, ingrese su nombre completo.");
    addTicket(name, depto, currentEscalation);
    document.getElementById('user-name').value = "";
    showView('home-view');
    alert("Ticket creado exitosamente siguiendo los criterios SOP.");
}

// LOGICA ONEDRIVE
function branchOneDrive(type) {
    document.getElementById('od-step-1').classList.remove('active');
    document.getElementById(`od-step-${type}-1`).classList.add('active');
    document.getElementById('od-progress-bar').style.width = '60%';
}

function prepareTicketOD(diagnosis) {
    currentEscalation = diagnosis;
    document.getElementById('od-ticket-type').innerText = diagnosis;
    document.querySelectorAll('#onedrive-flow .step').forEach(s => s.classList.remove('active'));
    document.getElementById('od-step-final').classList.add('active');
    document.getElementById('od-progress-bar').style.width = '100%';
}

function generateTicketOD() {
    const name = document.getElementById('od-user-name').value;
    if (!name.trim()) return alert("Ingrese su nombre.");
    addTicket(name, "Soporte Cloud", currentEscalation);
    document.getElementById('od-user-name').value = "";
    showView('home-view');
    alert("Incidente de OneDrive registrado para revisión de Nivel 1.");
}

function solvedAction() {
    alert("¡Deflexión Exitosa! El problema se resolvió mediante el Portal Web de Nivel 0.");
    showView('home-view');
}

// DASHBOARD & KANBAN
function showDashboard() {
    showView('dashboard-view');
    switchDashboardView('table');
}

function switchDashboardView(viewType) {
    const isTable = viewType === 'table';
    document.getElementById('table-container').classList.toggle('hidden', !isTable);
    document.getElementById('kanban-container').classList.toggle('hidden', isTable);
    document.getElementById('btn-list').classList.toggle('active-btn', isTable);
    document.getElementById('btn-kanban').classList.toggle('active-btn', !isTable);
    if (isTable) renderTable(); else renderKanban();
}

function renderTable() {
    document.getElementById('ticket-body').innerHTML = tickets.map(t => `
        <tr>
            <td><strong>${t.id}</strong></td>
            <td>${t.solicitante}</td>
            <td><span class="badge-service bg-${t.tipo}">${t.departamento}</span></td>
            <td>${t.diagnostico}</td>
            <td><span style="color:#d32f2f; font-weight:700">${t.sla}</span></td>
            <td><strong>${t.estado}</strong></td>
        </tr>
    `).join('');
}

function renderKanban() {
    const cols = { 'Abierto': document.querySelector('#col-Abierto .kanban-cards'), 'En Proceso': document.querySelector('#col-En-Proceso .kanban-cards'), 'Resuelto': document.querySelector('#col-Resuelto .kanban-cards') };
    Object.values(cols).forEach(c => c.innerHTML = "");

    tickets.forEach(t => {
        const card = document.createElement('div');
        const estClass = t.estado.replace(' ', '-').toLowerCase();
        card.className = `kanban-card state-${estClass}`;
        card.draggable = true;
        card.id = `card-${t.id}`;
        card.ondragstart = (ev) => ev.dataTransfer.setData("text", ev.target.id);
        
        card.innerHTML = `
            <span class="badge-service bg-${t.tipo}">${t.departamento}</span><br>
            <strong>${t.id}</strong>
            <p>${t.solicitante}</p>
            <small>SLA: ${t.sla}</small><br>
            <small>${t.diagnostico}</small>
        `;
        cols[t.estado]?.appendChild(card);
    });
}

// DRAG & DROP
function allowDrop(ev) { ev.preventDefault(); }
function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const dropTarget = ev.target.closest('.kanban-col');
    if (dropTarget) {
        const ticketId = data.replace('card-', '');
        const newStatus = dropTarget.id.replace('col-', '').replace('-', ' ');
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) { ticket.estado = newStatus; renderKanban(); }
    }
}

// EXPORTACIÓN
function exportToExcel() {
    if (!tickets.length) return alert("Sin datos.");
    let csv = "\ufeffID,Solicitante,Departamento,Diagnostico,SLA,Estado,Fecha\n" + 
              tickets.map(t => `${t.id},${t.solicitante},${t.departamento},${t.diagnostico},${t.sla},${t.estado},${t.fecha}`).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "Reporte_Incidentes_UMA.csv";
    link.click();
}