// app.js - Lógica interactiva del cliente para Puente Digital

document.addEventListener('DOMContentLoaded', () => {
  // Estado local
  let currentCategory = 'todas';
  let allInitiatives = [];
  let selectedInitiative = null;

  // Elementos DOM
  const initiativesGrid = document.getElementById('initiativesGrid');
  const filterGroup = document.getElementById('filterGroup');
  const statInitiatives = document.getElementById('statInitiatives');
  const statVolunteers = document.getElementById('statVolunteers');
  const toast = document.getElementById('toast');

  // Modales
  const modalNewInit = document.getElementById('modalNewInitiative');
  const btnOpenInitModal = document.getElementById('btnOpenInitModal');
  const btnCloseInitModal = document.getElementById('btnCloseInitModal');
  const btnCancelInit = document.getElementById('btnCancelInit');
  const formNewInitiative = document.getElementById('formNewInitiative');
  const btnSubmitInit = document.getElementById('btnSubmitInit');

  const modalCollab = document.getElementById('modalCollab');
  const btnCloseCollabModal = document.getElementById('btnCloseCollabModal');
  const modalCollabBadge = document.getElementById('modalCollabBadge');
  const modalCollabTitle = document.getElementById('modalCollabTitle');
  const modalCollabDesc = document.getElementById('modalCollabDesc');
  const modalCollabAuthor = document.getElementById('modalCollabAuthor');
  const modalCollabContact = document.getElementById('modalCollabContact');
  const modalCollabCount = document.getElementById('modalCollabCount');
  const collabList = document.getElementById('collabList');
  const formJoin = document.getElementById('formJoin');
  const joinInitiativeId = document.getElementById('joinInitiativeId');
  const btnSubmitJoin = document.getElementById('btnSubmitJoin');

  // Mapeo de categorías y estilos
  const categoryLabels = {
    alfabetizacion: { text: '📖 Alfabetización Digital', class: 'category-alfabetizacion' },
    donacion: { text: '💻 Donación de Equipos', class: 'category-donacion' },
    tramites: { text: '🏛️ Trámites Online', class: 'category-tramites' },
    ciberseguridad: { text: '🛡️ Ciberseguridad Comunitaria', class: 'category-ciberseguridad' }
  };

  // ========================================================
  // NOTIFICACIONES TOAST
  // ========================================================
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ef4444' : '#0f172a';
    toast.classList.remove('hidden');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }

  // ========================================================
  // CARGAR INICIATIVAS DESDE LA API (Vercel Functions)
  // ========================================================
  async function loadInitiatives() {
    try {
      initiativesGrid.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Conectando con la base de datos comunitaria...</p>
        </div>
      `;

      const url = currentCategory === 'todas' 
        ? '/api/initiatives' 
        : `/api/initiatives?category=${encodeURIComponent(currentCategory)}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Error al obtener iniciativas');
      }

      allInitiatives = await response.json();
      renderInitiatives(allInitiatives);
      updateStats(allInitiatives);
    } catch (err) {
      console.error(err);
      initiativesGrid.innerHTML = `
        <div class="empty-state">
          <h4 style="margin-bottom: 8px; color: #ef4444;">No se pudieron cargar las iniciativas</h4>
          <p style="color: #64748b; margin-bottom: 16px;">${escapeHtml(err.message)}</p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn btn-secondary" onclick="window.location.reload()">Reintentar</button>
            <button class="btn btn-primary" id="btnInitDb">Inicializar Tablas en la Base de Datos</button>
          </div>
        </div>
      `;

      const btnInitDb = document.getElementById('btnInitDb');
      if (btnInitDb) {
        btnInitDb.addEventListener('click', initializeDatabase);
      }
    }
  }

  // Helper para inicializar BD si está vacía
  async function initializeDatabase() {
    try {
      showToast('Configurando tablas en PostgreSQL...');
      const res = await fetch('/api/setup');
      const data = await res.json();
      if (data.success) {
        showToast('¡Base de datos lista con las 2 tablas creadas!');
        loadInitiatives();
      } else {
        showToast('Error: ' + data.details, true);
      }
    } catch (e) {
      showToast('Error de conexión con la base de datos', true);
    }
  }

  // ========================================================
  // RENDERIZADO DE CARDS
  // ========================================================
  function renderInitiatives(initiatives) {
    if (!initiatives || initiatives.length === 0) {
      initiativesGrid.innerHTML = `
        <div class="empty-state">
          <h4>No hay iniciativas en esta categoría</h4>
          <p style="color: #64748b; margin-top: 6px;">¡Sé el primero en publicar una iniciativa para ayudar a tu comunidad!</p>
          <button class="btn btn-primary" style="margin-top: 16px;" onclick="document.getElementById('btnOpenInitModal').click()">
            + Publicar Iniciativa
          </button>
        </div>
      `;
      return;
    }

    initiativesGrid.innerHTML = initiatives.map(init => {
      const catInfo = categoryLabels[init.categoria] || { text: init.categoria, class: 'category-alfabetizacion' };
      const dateFormatted = new Date(init.created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });

      return `
        <article class="initiative-card">
          <div class="card-top">
            <span class="card-category ${catInfo.class}">${catInfo.text}</span>
            <h4 class="card-title">${escapeHtml(init.titulo)}</h4>
            <p class="card-desc">${escapeHtml(init.descripcion)}</p>
          </div>

          <div>
            <div class="card-meta">
              <span class="card-author" title="${escapeHtml(init.autor_nombre)}">👤 ${escapeHtml(init.autor_nombre)}</span>
              <span class="card-collab-badge">🤝 ${init.total_colaboraciones || 0} apoyos</span>
            </div>

            <div class="card-actions">
              <button class="btn btn-primary btn-open-detail" data-id="${init.id}">
                Ver Detalles y Sumarme
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Asignar listeners a los botones de las cards
    document.querySelectorAll('.btn-open-detail').forEach(button => {
      button.addEventListener('click', () => {
        const id = parseInt(button.dataset.id, 10);
        openCollabModal(id);
      });
    });
  }

  // ========================================================
  // ACTUALIZAR CONTADORES
  // ========================================================
  function updateStats(initiatives) {
    statInitiatives.textContent = initiatives.length;
    const totalCollabs = initiatives.reduce((sum, item) => sum + parseInt(item.total_colaboraciones || 0, 10), 0);
    statVolunteers.textContent = totalCollabs;
  }

  // ========================================================
  // FILTRADO POR CATEGORÍA
  // ========================================================
  filterGroup.addEventListener('click', (e) => {
    if (!e.target.classList.contains('filter-btn')) return;

    filterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');

    currentCategory = e.target.dataset.category;
    loadInitiatives();
  });

  // ========================================================
  // MODAL CREAR INICIATIVA
  // ========================================================
  btnOpenInitModal.addEventListener('click', () => {
    formNewInitiative.reset();
    modalNewInit.classList.remove('hidden');
  });

  function closeInitModal() {
    modalNewInit.classList.add('hidden');
  }

  btnCloseInitModal.addEventListener('click', closeInitModal);
  btnCancelInit.addEventListener('click', closeInitModal);

  formNewInitiative.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      titulo: document.getElementById('initTitle').value,
      categoria: document.getElementById('initCategory').value,
      descripcion: document.getElementById('initDescription').value,
      autor_nombre: document.getElementById('initAuthor').value,
      contacto: document.getElementById('initContact').value
    };

    btnSubmitInit.disabled = true;
    btnSubmitInit.textContent = 'Publicando...';

    try {
      const response = await fetch('/api/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar iniciativa');
      }

      showToast('¡Iniciativa publicada con éxito!');
      closeInitModal();
      loadInitiatives();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      btnSubmitInit.disabled = false;
      btnSubmitInit.textContent = 'Publicar Iniciativa';
    }
  });

  // ========================================================
  // MODAL VER DETALLES Y REGISTRAR COLABORACIÓN
  // ========================================================
  async function openCollabModal(id) {
    selectedInitiative = allInitiatives.find(item => item.id === id);
    if (!selectedInitiative) return;

    const catInfo = categoryLabels[selectedInitiative.categoria] || { text: selectedInitiative.categoria, class: 'category-alfabetizacion' };

    modalCollabBadge.textContent = catInfo.text;
    modalCollabBadge.className = `badge ${catInfo.class}`;
    modalCollabTitle.textContent = selectedInitiative.titulo;
    modalCollabDesc.textContent = selectedInitiative.descripcion;
    modalCollabAuthor.textContent = selectedInitiative.autor_nombre;
    modalCollabContact.textContent = selectedInitiative.contacto;
    joinInitiativeId.value = selectedInitiative.id;

    formJoin.reset();
    modalCollab.classList.remove('hidden');

    // Cargar historial de colaboraciones
    await loadCollaborations(id);
  }

  async function loadCollaborations(initiativeId) {
    collabList.innerHTML = '<p class="collab-empty">Cargando apoyos...</p>';

    try {
      const response = await fetch(`/api/collaborations?initiativeId=${initiativeId}`);
      if (!response.ok) throw new Error('Error al cargar colaboraciones');

      const collabs = await response.json();
      modalCollabCount.textContent = collabs.length;

      if (collabs.length === 0) {
        collabList.innerHTML = '<p class="collab-empty">Aún no hay colaboraciones registradas. ¡Sé el primero en sumarte!</p>';
        return;
      }

      collabList.innerHTML = collabs.map(collab => {
        const date = new Date(collab.created_at).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short'
        });
        return `
          <div class="collab-item">
            <div class="collab-item-header">
              <strong>${escapeHtml(collab.nombre_voluntario)}</strong>
              <span>${date}</span>
            </div>
            <p style="color: #334155; font-size: 0.86rem;">"${escapeHtml(collab.mensaje)}"</p>
          </div>
        `;
      }).join('');
    } catch (err) {
      collabList.innerHTML = `<p class="collab-empty" style="color: #ef4444;">No se pudieron cargar los apoyos previos.</p>`;
    }
  }

  function closeCollabModal() {
    modalCollab.classList.add('hidden');
    selectedInitiative = null;
  }

  btnCloseCollabModal.addEventListener('click', closeCollabModal);

  // Enviar colaboración
  formJoin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const initiativeId = parseInt(joinInitiativeId.value, 10);
    const payload = {
      iniciativa_id: initiativeId,
      nombre_voluntario: document.getElementById('joinName').value,
      contacto_voluntario: document.getElementById('joinContact').value,
      mensaje: document.getElementById('joinMessage').value
    };

    btnSubmitJoin.disabled = true;
    btnSubmitJoin.textContent = 'Registrando...';

    try {
      const response = await fetch('/api/collaborations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar colaboración');
      }

      showToast('¡Gracias por sumarte a colaborar!');
      formJoin.reset();

      // Recargar lista de colaboraciones y listado general
      await loadCollaborations(initiativeId);
      await loadInitiatives();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      btnSubmitJoin.disabled = false;
      btnSubmitJoin.textContent = 'Sumarme a esta causa';
    }
  });

  // Cerrar modales con clic fuera del contenido
  window.addEventListener('click', (e) => {
    if (e.target === modalNewInit) closeInitModal();
    if (e.target === modalCollab) closeCollabModal();
  });

  // Escape HTML helper para evitar XSS
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Inicialización
  loadInitiatives();
});
