import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Pagination } from '../components/Pagination';

export const ModulManagement = () => {
    const { modules, updateModules, createCustomModule, deleteModule, showToast } = useData();

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showBuildModal, setShowBuildModal] = useState(false);
    const [editingModule, setEditingModule] = useState(null);

    // FontAwesome Icon List for visual icon picker
    const ICON_PRESETS = [
        { icon: 'fa-solid fa-cube', label: 'Cube' },
        { icon: 'fa-solid fa-box-archive', label: 'Box / Inventaris' },
        { icon: 'fa-solid fa-cart-shopping', label: 'Keranjang / Purchasing' },
        { icon: 'fa-solid fa-tags', label: 'Tag / Kategori' },
        { icon: 'fa-solid fa-shield-halved', label: 'Perisai / Asuransi' },
        { icon: 'fa-solid fa-truck', label: 'Truk / Fleet' },
        { icon: 'fa-solid fa-clipboard-check', label: 'Checklist / Audit' },
        { icon: 'fa-solid fa-file-invoice', label: 'Invoice / Laporan' },
        { icon: 'fa-solid fa-users', label: 'User / Tim' },
        { icon: 'fa-solid fa-wrench', label: 'Kunci / Maintenance' },
        { icon: 'fa-solid fa-hand-holding-hand', label: 'Tangan / Peminjaman' },
        { icon: 'fa-solid fa-layer-group', label: 'Master Data' },
        { icon: 'fa-solid fa-compass-drafting', label: 'Kompas / Kalibrasi' },
        { icon: 'fa-solid fa-calculator', label: 'Kalkulator / Depresiasi' },
        { icon: 'fa-solid fa-coins', label: 'Koin / Keuangan' },
        { icon: 'fa-solid fa-warehouse', label: 'Gudang / Stock' },
        { icon: 'fa-solid fa-gears', label: 'Gear / System' }
    ];

    // Form Modal Build/Edit Modul state
    const [form, setForm] = useState({
        nama_modul: '',
        unique_key: '',
        url_page: '',
        icon: 'fa-solid fa-cube',
        kategori: 'Asset Operations',
        posisi: 'top',
        status: 'Aktif',
        layout: 'Tabel Data CRUD + Search & Filter',
        sub_tabs: '',
        has_workflow: false,
        feat_kpi: true,
        perm_view: true,
        perm_add: true,
        perm_edit: true,
        perm_delete: true,
        perm_submit: false,
        perm_approve: false,
        perm_export: false
    });

    // Sub-tab selector state inside Schema Builder
    const [selectedSchemaTab, setSelectedSchemaTab] = useState('Default');

    // Schema Columns dictionary per Sub-Tab
    const [schemaFieldsByTab, setSchemaFieldsByTab] = useState({
        'Default': [
            { field: 'kode_item', label: 'Kode Transaksi / ID', type: 'VARCHAR' },
            { field: 'nama_item', label: 'Nama Item / Perihal', type: 'VARCHAR' },
            { field: 'biaya', label: 'Nilai Transaksi (Rp)', type: 'CURRENCY' },
            { field: 'tanggal', label: 'Tanggal Kejadian', type: 'DATE' },
            { field: 'keterangan', label: 'Deskripsi Catatan', type: 'TEXT' }
        ]
    });

    const getParsedSubTabs = (tabStr) => {
        return (tabStr || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    };

    const currentSubTabsList = getParsedSubTabs(form.sub_tabs);

    const resetForm = () => {
        setEditingModule(null);
        setForm({
            nama_modul: '',
            unique_key: '',
            url_page: '',
            icon: 'fa-solid fa-cube',
            kategori: 'Asset Operations',
            posisi: 'top',
            status: 'Aktif',
            layout: 'Tabel Data CRUD + Search & Filter',
            sub_tabs: '',
            has_workflow: false,
            feat_kpi: true,
            perm_view: true,
            perm_add: true,
            perm_edit: true,
            perm_delete: true,
            perm_submit: false,
            perm_approve: false,
            perm_export: false
        });
        setSelectedSchemaTab('Default');
        setSchemaFieldsByTab({
            'Default': [
                { field: 'kode_item', label: 'Kode Transaksi / ID', type: 'VARCHAR' },
                { field: 'nama_item', label: 'Nama Item / Perihal', type: 'VARCHAR' },
                { field: 'biaya', label: 'Nilai Transaksi (Rp)', type: 'CURRENCY' },
                { field: 'tanggal', label: 'Tanggal Kejadian', type: 'DATE' },
                { field: 'keterangan', label: 'Deskripsi Catatan', type: 'TEXT' }
            ]
        });
    };

    const handleToggleWorkflow = (checked) => {
        if (checked) {
            setForm(prev => ({
                ...prev,
                has_workflow: true,
                sub_tabs: '1. Permohonan Pengajuan, 2. Persetujuan Manager, 3. Riwayat Selesai',
                perm_submit: true,
                perm_approve: true
            }));
            setSchemaFieldsByTab({
                '1. Permohonan Pengajuan': [
                    { field: 'kode_pengajuan', label: 'Nomor Berkas Pengajuan', type: 'VARCHAR' },
                    { field: 'nama_pengaju', label: 'Nama Pemohon / Perihal', type: 'VARCHAR' },
                    { field: 'nominal', label: 'Estimasi Biaya (Rp)', type: 'CURRENCY' },
                    { field: 'tanggal_pengajuan', label: 'Tanggal Pengajuan', type: 'DATE' },
                    { field: 'alasan', label: 'Alasan Permohonan', type: 'TEXT' }
                ],
                '2. Persetujuan Manager': [
                    { field: 'kode_pengajuan', label: 'Nomor Berkas', type: 'VARCHAR' },
                    { field: 'nama_pengaju', label: 'Nama Pemohon', type: 'VARCHAR' },
                    { field: 'nominal', label: 'Nilai Disetujui (Rp)', type: 'CURRENCY' },
                    { field: 'catatan_approver', label: 'Catatan Pertimbangan Approver', type: 'TEXT' }
                ],
                '3. Riwayat Selesai': [
                    { field: 'kode_pengajuan', label: 'Nomor Berkas Selesai', type: 'VARCHAR' },
                    { field: 'nama_pengaju', label: 'Nama Pemohon', type: 'VARCHAR' },
                    { field: 'nominal', label: 'Total Realisasi (Rp)', type: 'CURRENCY' },
                    { field: 'tanggal_selesai', label: 'Tanggal Eksekusi Selesai', type: 'DATE' }
                ]
            });
            setSelectedSchemaTab('1. Permohonan Pengajuan');
        } else {
            setForm(prev => ({
                ...prev,
                has_workflow: false
            }));
        }
    };

    const handleAddFieldDB = () => {
        const tabKey = selectedSchemaTab || 'Default';
        const currentList = schemaFieldsByTab[tabKey] || [];
        const updatedList = [
            ...currentList,
            { field: `col_${currentList.length + 1}`, label: `Label Field ${currentList.length + 1}`, type: 'VARCHAR' }
        ];
        setSchemaFieldsByTab({
            ...schemaFieldsByTab,
            [tabKey]: updatedList
        });
    };

    const handleDeleteFieldDB = (idx) => {
        const tabKey = selectedSchemaTab || 'Default';
        const currentList = schemaFieldsByTab[tabKey] || [];
        const updatedList = currentList.filter((_, i) => i !== idx);
        setSchemaFieldsByTab({
            ...schemaFieldsByTab,
            [tabKey]: updatedList
        });
    };

    const handleEditModule = (modul) => {
        setEditingModule(modul);
        setForm({
            nama_modul: modul.label || modul.nama_modul || '',
            unique_key: modul.key || '',
            url_page: `${modul.key}.html`,
            icon: modul.icon || 'fa-solid fa-cube',
            kategori: modul.category || 'Asset Operations',
            posisi: modul.position || 'top',
            status: modul.status || 'Aktif',
            layout: modul.layout_type || 'Tabel Data CRUD + Search & Filter',
            sub_tabs: modul.custom_tabs || '',
            has_workflow: !!modul.has_workflow,
            feat_kpi: modul.feat_kpi !== false,
            perm_view: true,
            perm_add: true,
            perm_edit: true,
            perm_delete: true,
            perm_submit: (modul.actions || []).includes('submit'),
            perm_approve: (modul.actions || []).includes('approve'),
            perm_export: (modul.actions || []).includes('export')
        });

        if (modul.subtab_schemas && typeof modul.subtab_schemas === 'object') {
            setSchemaFieldsByTab(modul.subtab_schemas);
            const firstTab = Object.keys(modul.subtab_schemas)[0] || 'Default';
            setSelectedSchemaTab(firstTab);
        } else if (modul.db_schema && Array.isArray(modul.db_schema)) {
            setSchemaFieldsByTab({
                'Default': modul.db_schema.map(s => ({
                    field: s.name || s.field || 'col',
                    label: s.label || 'Label',
                    type: s.type || 'VARCHAR'
                }))
            });
            setSelectedSchemaTab('Default');
        }
        setShowBuildModal(true);
    };

    const handleToggleStatus = (modulId) => {
        const updated = modules.map(m => {
            if (m.modul_id === modulId) {
                const nextStatus = m.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
                showToast('info', `Status modul "${m.label}" diubah ke "${nextStatus}".`);
                return { ...m, status: nextStatus };
            }
            return m;
        });
        updateModules(updated);
    };

    const handleDeleteModulItem = (modulId, nama, isSystem) => {
        if (isSystem) {
            showToast('error', `Modul sistem "${nama}" tidak dapat dihapus!`);
            return;
        }
        if (window.confirm(`Apakah Anda yakin ingin MENGHAPUS modul "${nama}" beserta skema databasenya?`)) {
            if (deleteModule) {
                deleteModule(modulId);
            }
            showToast('info', `Modul "${nama}" telah berhasil dihapus.`);
        }
    };

    const handleSaveBuild = (e) => {
        e.preventDefault();
        if (!form.nama_modul.trim()) {
            showToast('error', 'Nama Modul wajib diisi!');
            return;
        }

        const subTabsArr = getParsedSubTabs(form.sub_tabs);

        const actionsList = ['view'];
        if (form.perm_add) actionsList.push('add');
        if (form.perm_edit) actionsList.push('edit');
        if (form.perm_delete) actionsList.push('delete');
        if (form.perm_submit || form.has_workflow) actionsList.push('submit');
        if (form.perm_approve || form.has_workflow) actionsList.push('approve');
        if (form.perm_export) actionsList.push('export');

        const formattedSubtabSchemas = {};
        Object.keys(schemaFieldsByTab).forEach(tabName => {
            formattedSubtabSchemas[tabName] = (schemaFieldsByTab[tabName] || []).map(s => ({
                name: s.field.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
                label: s.label,
                type: s.type
            }));
        });

        const defaultSchema = formattedSubtabSchemas[selectedSchemaTab] || formattedSubtabSchemas['Default'] || Object.values(formattedSubtabSchemas)[0] || [];

        if (editingModule) {
            const updated = modules.map(m => {
                if (m.modul_id === editingModule.modul_id) {
                    return {
                        ...m,
                        label: form.nama_modul,
                        key: form.unique_key || m.key,
                        icon: form.icon,
                        category: form.kategori,
                        custom_tabs: subTabsArr.join(', '),
                        actions: actionsList,
                        has_workflow: form.has_workflow,
                        feat_kpi: form.feat_kpi,
                        status: form.status,
                        db_schema: defaultSchema,
                        subtab_schemas: formattedSubtabSchemas
                    };
                }
                return m;
            });
            updateModules(updated);
            showToast('success', `Modul "${form.nama_modul}" Berhasil Diperbarui!`);
        } else {
            createCustomModule(
                form.nama_modul,
                `Custom module ${form.nama_modul}`,
                subTabsArr.length > 0 ? subTabsArr : ['Daftar Utama'],
                {
                    unique_key: form.unique_key,
                    icon: form.icon,
                    kategori: form.kategori,
                    actions: actionsList,
                    has_workflow: form.has_workflow,
                    feat_kpi: form.feat_kpi,
                    db_schema: defaultSchema,
                    subtab_schemas: formattedSubtabSchemas
                }
            );
            showToast('success', `Modul Baru & Skema Database Sub-Tab "${form.nama_modul}" Berhasil Dibuat!`);
        }

        setShowBuildModal(false);
        resetForm();
    };

    const filteredModules = modules.filter(m => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = !query ||
            (m.label && m.label.toLowerCase().includes(query)) ||
            (m.key && m.key.toLowerCase().includes(query)) ||
            (m.category && m.category.toLowerCase().includes(query));

        const matchesCat = !categoryFilter ||
            (categoryFilter === 'core' && m.is_system) ||
            (categoryFilter === 'custom' && !m.is_system) ||
            (m.category && m.category.toLowerCase() === categoryFilter.toLowerCase());

        return matchesQuery && matchesCat;
    });

    const sortedFilteredModules = [...filteredModules].sort((a, b) => {
        if (sortOrder === 'terbaru') return (b.modul_id || 0) - (a.modul_id || 0);
        if (sortOrder === 'terlama') return (a.modul_id || 0) - (b.modul_id || 0);
        if (sortOrder === 'nama_asc') return (a.label || a.nama_modul || '').localeCompare(b.label || b.nama_modul || '');
        if (sortOrder === 'nama_desc') return (b.label || b.nama_modul || '').localeCompare(a.label || a.nama_modul || '');
        return 0;
    });

    const totalItems = sortedFilteredModules.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedFilteredModules.slice(startIndex, startIndex + itemsPerPage);

    const totalSystemMods = modules.filter(m => m.is_system).length;
    const totalCustomMods = modules.filter(m => !m.is_system).length;

    const activeSchemaTabList = currentSubTabsList.length > 0 ? currentSubTabsList : ['Default'];

    return (
        <div style={{ padding: '4px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-cubes-stacked" style={{ color: '#00624F' }}></i> Manajemen Modul & Fitur Custom Builder
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Kelola modul sistem, buat modul kustom baru dengan skema kolom berbeda per sub-tab, serta aktifkan fitur summary card KPI & workflow pengajuan.
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowBuildModal(true);
                    }}
                    style={{
                        background: '#00624F',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <i className="fa-solid fa-circle-plus"></i> Build Modul & Skema Kolom
                </button>
            </div>

            {/* Top Metric Cards Grid (3 Cards) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-database" style={{ color: '#00624F' }}></i> TOTAL MODUL TERDAFTAR
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>{modules.length}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Modul Operasional & Sistem Core</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-puzzle-piece" style={{ color: '#16a34a' }}></i> CUSTOM MODULES
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#16a34a', marginTop: '6px' }}>{totalCustomMods}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Modul Kustom Ditambahkan</div>
                </div>

                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-server" style={{ color: '#0288d1' }}></i> SYSTEM CORE MODULES
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#0288d1', marginTop: '6px' }}>{totalSystemMods}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Modul Bawaan Sistem</div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Cari nama modul, key identifier, kategori..."
                    value={searchQuery}
                    onChange={e => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ flex: 1, minWidth: '220px', padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                />
                <select
                    value={categoryFilter}
                    onChange={e => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', background: '#fff' }}
                >
                    <option value="">-- Semua Kategori & Tipe --</option>
                    <option value="core">System Core</option>
                    <option value="custom">Custom Modules</option>
                    <option value="Asset Operations">Asset Operations</option>
                    <option value="General Core">General Core</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Security & Access">Security & Access</option>
                    <option value="Reporting">Reporting</option>
                </select>

                <select
                    value={sortOrder}
                    onChange={e => {
                        setSortOrder(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '9px 14px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        background: '#fff'
                    }}
                >
                    <option value="terbaru">Urutkan: Terbaru</option>
                    <option value="terlama">Urutkan: Terlama</option>
                    <option value="nama_asc">Nama (A - Z)</option>
                    <option value="nama_desc">Nama (Z - A)</option>
                </select>
            </div>

            {/* Main Table Section */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', width: '50px' }}>No</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Icon & Nama Modul</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Key Identifier</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Kategori</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Sub-Tabs & Fitur Modul</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '100px' }}>Status</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', width: '150px' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                    <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', marginBottom: '8px', color: '#cbd5e1', display: 'block' }}></i>
                                    Tidak ada modul yang sesuai dengan pencarian atau filter.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, idx) => (
                                <tr key={item.modul_id || item.key || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600 }}>{startIndex + idx + 1}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: item.is_system ? '#e0f2fe' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className={item.icon || 'fa-solid fa-cube'} style={{ color: item.is_system ? '#0288d1' : '#16a34a', fontSize: '15px' }}></i>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{item.label || item.nama_modul}</div>
                                                <span style={{ background: item.is_system ? '#475569' : '#00624F', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                                                    {item.is_system ? 'System Core' : (item.badge || 'Custom')}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#db2777', fontWeight: 700 }}>
                                        <code style={{ background: '#fce7f3', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{item.key}</code>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                                            {item.category || 'Asset Operations'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px' }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                                            <i className="fa-solid fa-folder-tree" style={{ color: '#0288d1', marginRight: '4px' }}></i>
                                            {item.custom_tabs || 'Daftar Utama CRUD'}
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                            {item.feat_kpi !== false && (
                                                <span style={{ fontSize: '10px', color: '#0288d1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                                    📊 Summary Cards
                                                </span>
                                            )}
                                            {item.has_workflow && (
                                                <span style={{ fontSize: '10px', color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                                    ✓ Pengajuan & Persetujuan
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <span
                                            onClick={() => handleToggleStatus(item.modul_id)}
                                            title="Klik untuk mengubah status"
                                            style={{
                                                background: item.status === 'Nonaktif' ? '#fee2e2' : '#dcfce7',
                                                color: item.status === 'Nonaktif' ? '#991b1b' : '#15803d',
                                                padding: '3px 10px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'inline-block'
                                            }}
                                        >
                                            {item.status === 'Nonaktif' ? '● Nonaktif' : '● Aktif'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleEditModule(item)}
                                                title="Edit Modul & Skema"
                                                style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i> Edit
                                            </button>
                                            {!item.is_system && (
                                                <button
                                                    onClick={() => handleDeleteModulItem(item.modul_id, item.label || item.nama_modul, item.is_system)}
                                                    title="Hapus Modul Kustom"
                                                    style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(size) => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                    }}
                    totalItems={totalItems}
                    startIndex={startIndex}
                    endIndex={startIndex + paginatedData.length}
                />
            </div>

            {/* Build & Edit Modul Modal */}
            {showBuildModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '16px'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '820px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-cubes" style={{ color: '#00624F' }}></i>
                                {editingModule ? `Edit Modul: ${editingModule.label}` : 'Build Modul Baru & Skema Kolom Sub-Tabs'}
                            </h3>
                            <button
                                onClick={() => setShowBuildModal(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveBuild} style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Nama Modul *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Pengadaan Aset"
                                        value={form.nama_modul}
                                        onChange={e => setForm({ ...form, nama_modul: e.target.value, unique_key: form.unique_key || e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Unique Key Identifier (Slug) *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="pengadaan"
                                        value={form.unique_key}
                                        onChange={e => setForm({ ...form, unique_key: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            {/* VISUAL ICON PICKER FOR ADMIN */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Pilih Icon Modul (Klik Icon Di Bawah):
                                </label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                                    {ICON_PRESETS.map(p => (
                                        <button
                                            key={p.icon}
                                            type="button"
                                            onClick={() => setForm({ ...form, icon: p.icon })}
                                            title={p.label}
                                            style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '8px',
                                                border: form.icon === p.icon ? '2px solid #00624F' : '1px solid #cbd5e1',
                                                background: form.icon === p.icon ? '#e6f4f1' : '#fff',
                                                color: form.icon === p.icon ? '#00624F' : '#64748b',
                                                fontSize: '16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <i className={p.icon}></i>
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Class Icon Terpilih:</span>
                                    <input
                                        type="text"
                                        value={form.icon}
                                        onChange={e => setForm({ ...form, icon: e.target.value })}
                                        placeholder="fa-solid fa-cube"
                                        style={{ flex: 1, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Kategori Modul
                                </label>
                                <select
                                    value={form.kategori}
                                    onChange={e => setForm({ ...form, kategori: e.target.value })}
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#fff' }}
                                >
                                    <option value="Asset Operations">Asset Operations</option>
                                    <option value="General Core">General Core</option>
                                    <option value="Finance & Accounting">Finance & Accounting</option>
                                    <option value="Security & Access">Security & Access</option>
                                    <option value="Reporting">Reporting</option>
                                </select>
                            </div>

                            {/* FITUR TOGGLES: SUMMARY CARD & WORKFLOW */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: '#e0f2fe', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: '#0369a1' }}>
                                        <input
                                            type="checkbox"
                                            checked={form.feat_kpi}
                                            onChange={e => setForm({ ...form, feat_kpi: e.target.checked })}
                                            style={{ width: '16px', height: '16px', accentColor: '#0288d1' }}
                                        />
                                        Aktifkan Fitur Summary Cards KPI
                                    </label>
                                    <div style={{ fontSize: '11px', color: '#0288d1', marginTop: '3px', marginLeft: '24px' }}>
                                        Menampilkan kartu statistik ringkasan di bagian atas halaman modul.
                                    </div>
                                </div>

                                <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                                        <input
                                            type="checkbox"
                                            checked={form.has_workflow}
                                            onChange={e => handleToggleWorkflow(e.target.checked)}
                                            style={{ width: '16px', height: '16px', accentColor: '#00624F' }}
                                        />
                                        Aktifkan Fitur Pengajuan & Persetujuan
                                    </label>
                                    <div style={{ fontSize: '11px', color: '#15803d', marginTop: '3px', marginLeft: '24px' }}>
                                        Alur permohonan staf → approval manager.
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Daftar Sub-Tabs Modul (Pisahkan dengan koma)
                                </label>
                                <input
                                    type="text"
                                    placeholder="1. Permohonan Pengajuan, 2. Persetujuan Manager, 3. Riwayat Selesai"
                                    value={form.sub_tabs}
                                    onChange={e => setForm({ ...form, sub_tabs: e.target.value })}
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                />
                                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                    Setiap sub-tab yang terdaftar di atas dapat memiliki skema kolom tabel yang berbeda-beda.
                                </span>
                            </div>

                            {/* Database Schema Builder Section per Sub-Tab */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="fa-solid fa-table" style={{ color: '#00624F' }}></i>
                                            Pengaturan Skema Kolom Terpisah Per Sub-Tab
                                        </h4>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>Pilih sub-tab di bawah untuk menyesuaikan kolom tabelnya:</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddFieldDB}
                                        style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        + Tambah Kolom ({selectedSchemaTab})
                                    </button>
                                </div>

                                {/* Sub-Tab Selection Buttons inside Schema Builder */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>
                                    {activeSchemaTabList.map(tabName => (
                                        <button
                                            key={tabName}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSchemaTab(tabName);
                                                if (!schemaFieldsByTab[tabName]) {
                                                    setSchemaFieldsByTab({
                                                        ...schemaFieldsByTab,
                                                        [tabName]: [
                                                            { field: 'kode_item', label: 'Kode / ID', type: 'VARCHAR' },
                                                            { field: 'nama_item', label: 'Nama Unit / Perihal', type: 'VARCHAR' },
                                                            { field: 'nominal', label: 'Nilai Transaksi (Rp)', type: 'CURRENCY' }
                                                        ]
                                                    });
                                                }
                                            }}
                                            style={{
                                                background: selectedSchemaTab === tabName ? '#00624F' : '#fff',
                                                color: selectedSchemaTab === tabName ? '#fff' : '#334155',
                                                border: selectedSchemaTab === tabName ? 'none' : '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                padding: '6px 14px',
                                                fontSize: '12px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                boxShadow: selectedSchemaTab === tabName ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                        >
                                            📌 {tabName}
                                        </button>
                                    ))}
                                </div>

                                {/* Field Editor List for Currently Selected Sub-Tab */}
                                {((schemaFieldsByTab[selectedSchemaTab] || schemaFieldsByTab['Default'] || [])).map((sf, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 34px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            placeholder="Field DB (kode_item)"
                                            value={sf.field}
                                            onChange={e => {
                                                const tabKey = selectedSchemaTab || 'Default';
                                                const currentList = [...(schemaFieldsByTab[tabKey] || [])];
                                                currentList[idx].field = e.target.value;
                                                setSchemaFieldsByTab({
                                                    ...schemaFieldsByTab,
                                                    [tabKey]: currentList
                                                });
                                            }}
                                            style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Label Kolom (Kode Item)"
                                            value={sf.label}
                                            onChange={e => {
                                                const tabKey = selectedSchemaTab || 'Default';
                                                const currentList = [...(schemaFieldsByTab[tabKey] || [])];
                                                currentList[idx].label = e.target.value;
                                                setSchemaFieldsByTab({
                                                    ...schemaFieldsByTab,
                                                    [tabKey]: currentList
                                                });
                                            }}
                                            style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                                        />
                                        <select
                                            value={sf.type}
                                            onChange={e => {
                                                const tabKey = selectedSchemaTab || 'Default';
                                                const currentList = [...(schemaFieldsByTab[tabKey] || [])];
                                                currentList[idx].type = e.target.value;
                                                setSchemaFieldsByTab({
                                                    ...schemaFieldsByTab,
                                                    [tabKey]: currentList
                                                });
                                            }}
                                            style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', background: '#fff' }}
                                        >
                                            <option value="VARCHAR">VARCHAR (Teks Pendek)</option>
                                            <option value="CURRENCY">CURRENCY (Rupiah / Decimal)</option>
                                            <option value="DATE">DATE (Tanggal)</option>
                                            <option value="TEXT">TEXT (Teks Panjang)</option>
                                            <option value="INTEGER">INTEGER (Angka Bulat)</option>
                                        </select>
                                        {(schemaFieldsByTab[selectedSchemaTab] || []).length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteFieldDB(idx)}
                                                style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', width: '30px', height: '30px', cursor: 'pointer' }}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Permissions & Actions */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                    Fitur Hak Akses & Tombol Operasional
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.perm_add} onChange={e => setForm({ ...form, perm_add: e.target.checked })} /> Tambah Data
                                    </label>
                                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.perm_edit} onChange={e => setForm({ ...form, perm_edit: e.target.checked })} /> Edit Data
                                    </label>
                                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.perm_delete} onChange={e => setForm({ ...form, perm_delete: e.target.checked })} /> Hapus Data
                                    </label>
                                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.perm_submit || form.has_workflow} onChange={e => setForm({ ...form, perm_submit: e.target.checked })} /> Tombol Ajukan (Permohonan)
                                    </label>
                                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.perm_approve || form.has_workflow} onChange={e => setForm({ ...form, perm_approve: e.target.checked })} /> Tombol Setujui (Approval Manager)
                                    </label>
                                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.perm_export} onChange={e => setForm({ ...form, perm_export: e.target.checked })} /> Export Excel/CSV
                                    </label>
                                </div>
                            </div>

                            {/* Footer Modal Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowBuildModal(false)}
                                    style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '9px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>
                                    {editingModule ? 'Simpan Perubahan' : 'Build Modul Sekarang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
