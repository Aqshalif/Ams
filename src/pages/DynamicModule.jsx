import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Pagination } from '../components/Pagination';

export const DynamicModule = () => {
    const { moduleKey } = useParams();
    const { modules, updateModules, checkPermission, getCustomData, saveCustomData, showToast } = useData();

    const currentModule = modules.find(m => m.key === moduleKey) || modules.find(m => m.key === 'pengadaan') || modules[0];

    const tabsList = (currentModule.custom_tabs || '').split(',').map(t => t.trim()).filter(Boolean);
    const [activeTab, setActiveTab] = useState(tabsList[0] || 'Utama');
    const [records, setRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('terbaru');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showLiveBuilderModal, setShowLiveBuilderModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [recordForm, setRecordForm] = useState({});

    const tableKey = `custom_data_${currentModule.key}_${activeTab.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    useEffect(() => {
        if (tabsList.length > 0 && !tabsList.includes(activeTab)) {
            setActiveTab(tabsList[0]);
        }
    }, [moduleKey, currentModule]);

    useEffect(() => {
        const data = getCustomData(tableKey);
        setRecords(data);
    }, [tableKey, activeTab]);

    const activeSchema = (currentModule.subtab_schemas && currentModule.subtab_schemas[activeTab])
        ? currentModule.subtab_schemas[activeTab]
        : (currentModule.db_schema || []);

    const activeActions = (currentModule.subtab_actions && currentModule.subtab_actions[activeTab])
        ? currentModule.subtab_actions[activeTab]
        : (currentModule.actions || []);

    const canView = checkPermission(currentModule.key, 'view');
    const canAdd = checkPermission(currentModule.key, 'add') && activeActions.includes('add');
    const canSubmit = checkPermission(currentModule.key, 'submit') && activeActions.includes('submit');
    const canApprove = checkPermission(currentModule.key, 'approve') && activeActions.includes('approve');
    const canEdit = checkPermission(currentModule.key, 'edit') && activeActions.includes('edit');
    const canDelete = checkPermission(currentModule.key, 'delete') && activeActions.includes('delete');
    const canExport = checkPermission(currentModule.key, 'export') && activeActions.includes('export');

    const handleOpenAddRecord = () => {
        setEditingRecord(null);
        const initForm = { status: 'Draft' };
        activeSchema.forEach(col => { initForm[col.name] = ''; });
        setRecordForm(initForm);
        setShowRecordModal(true);
    };

    const handleEditRecord = (r) => {
        setEditingRecord(r);
        setRecordForm({ ...r });
        setShowRecordModal(true);
    };

    const handleSaveRecord = (e) => {
        e.preventDefault();
        if (editingRecord) {
            const updated = records.map(r => r.id === editingRecord.id ? { ...r, ...recordForm } : r);
            setRecords(updated);
            saveCustomData(tableKey, updated);
            showToast('success', 'Record berhasil diperbarui.');
        } else {
            const newRec = {
                id: Date.now(),
                tab: activeTab,
                created_at: new Date().toISOString().split('T')[0],
                status: 'Draft',
                ...recordForm
            };
            const updated = [newRec, ...records];
            setRecords(updated);
            saveCustomData(tableKey, updated);
            showToast('success', 'Record baru berhasil ditambahkan.');
        }
        setShowRecordModal(false);
    };

    const handleDeleteRecord = (id) => {
        if (window.confirm('Yakin menghapus record ini dari sub-tab ini?')) {
            const updated = records.filter(r => r.id !== id);
            setRecords(updated);
            saveCustomData(tableKey, updated);
            showToast('info', 'Record berhasil dihapus.');
        }
    };

    const handleSubmitRecord = (id) => {
        const updated = records.map(r => r.id === id ? { ...r, status: 'Proses' } : r);
        setRecords(updated);
        saveCustomData(tableKey, updated);
        showToast('warning', 'Permohonan berhasil DIAJUKAN (Status: Proses Evaluasi)');
    };

    const handleApproveRecord = (id) => {
        const updated = records.map(r => r.id === id ? { ...r, status: 'Selesai' } : r);
        setRecords(updated);
        saveCustomData(tableKey, updated);
        showToast('success', 'Permohonan telah DISETUJUI oleh Manager (Status: Selesai)');
    };

    const filteredRecords = records.filter(r => {
        const matchesSearch = !searchQuery || JSON.stringify(r).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || (r.status || 'Draft') === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const sortedFilteredRecords = [...filteredRecords].sort((a, b) => {
        if (sortOrder === 'terbaru') return (b.id || 0) - (a.id || 0);
        if (sortOrder === 'terlama') return (a.id || 0) - (b.id || 0);
        return 0;
    });

    const totalItems = sortedFilteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRecords = sortedFilteredRecords.slice(startIndex, startIndex + itemsPerPage);

    if (!canView) {
        return (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <i className="fa-solid fa-lock" style={{ fontSize: '32px', marginBottom: '10px' }}></i>
                <h3>Akses Ditolak</h3>
                <p>Role Anda tidak memiliki wewenang untuk melihat modul "{currentModule.label}".</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={currentModule.icon || 'fa-solid fa-cube'} style={{ color: '#00624F' }}></i>
                        {currentModule.label}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Halaman Operasional Sub-Tab Dynamic Data Engine</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-gofleet" style={{ background: '#334155' }} onClick={() => setShowLiveBuilderModal(true)}>
                        <i className="fa-solid fa-sliders"></i> Mode Builder & Customization
                    </button>
                    {canAdd && (
                        <button className="btn-gofleet" onClick={handleOpenAddRecord}>
                            <i className="fa-solid fa-plus"></i> Tambah Data ({activeTab})
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-Tabs Bar */}
            {tabsList.length > 0 && (
                <div className="tab-bar">
                    {tabsList.map(tabName => (
                        <button
                            key={tabName}
                            className={activeTab === tabName ? 'active' : ''}
                            onClick={() => {
                                setActiveTab(tabName);
                                setCurrentPage(1);
                            }}
                        >
                            {tabName}
                        </button>
                    ))}
                </div>
            )}

            {/* Filter Toolbar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Search kata kunci..."
                    value={searchQuery}
                    onChange={e => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
                <select
                    value={statusFilter}
                    onChange={e => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', color: '#334155', background: '#fff' }}
                >
                    <option value="">-- Semua Status --</option>
                    <option value="Draft">Draft</option>
                    <option value="Proses">Proses Evaluasi</option>
                    <option value="Selesai">Selesai</option>
                </select>

                <select
                    value={sortOrder}
                    onChange={e => {
                        setSortOrder(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', background: '#fff' }}
                >
                    <option value="terbaru">Urutkan: Terbaru</option>
                    <option value="terlama">Urutkan: Terlama</option>
                </select>
            </div>

            {/* Dynamic Data Table */}
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tanggal</th>
                            {activeSchema.map(col => (
                                <th key={col.name}>{col.label}</th>
                            ))}
                            <th>Status Workflows</th>
                            <th>Aksi Operasional</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRecords.length === 0 ? (
                            <tr>
                                <td colSpan={activeSchema.length + 4} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                    Belum ada data transaksi pada sub-tab "{activeTab}". Klik tombol "Tambah Data" untuk menginput data baru.
                                </td>
                            </tr>
                        ) : (
                            paginatedRecords.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 700 }}>#{r.id}</td>
                                    <td>{r.created_at}</td>
                                    {activeSchema.map(col => (
                                        <td key={col.name}>
                                            {col.type === 'CURRENCY' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(r[col.name] || 0) : (r[col.name] || '-')}
                                        </td>
                                    ))}
                                    <td>
                                        <span className={`status-badge ${r.status === 'Selesai' ? 'tersedia' : r.status === 'Proses' ? 'perawatan' : 'nonaktif'}`}>
                                            {r.status || 'Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {canSubmit && (r.status === 'Draft' || !r.status) && (
                                                <button className="btn-gofleet" style={{ background: '#d97706', padding: '4px 8px', fontSize: '11px' }} onClick={() => handleSubmitRecord(r.id)}>
                                                    <i className="fa-solid fa-paper-plane"></i> Ajukan
                                                </button>
                                            )}
                                            {canApprove && r.status === 'Proses' && (
                                                <button className="btn-gofleet" style={{ background: '#16a34a', padding: '4px 8px', fontSize: '11px' }} onClick={() => handleApproveRecord(r.id)}>
                                                    <i className="fa-solid fa-check"></i> Setujui
                                                </button>
                                            )}
                                            {canEdit && (
                                                <button className="btn-gofleet" style={{ background: '#0288d1', padding: '4px 8px', fontSize: '11px' }} onClick={() => handleEditRecord(r)}>
                                                    <i className="fa-solid fa-pen-to-square"></i>
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button className="btn-gofleet" style={{ background: '#dc2626', padding: '4px 8px', fontSize: '11px' }} onClick={() => handleDeleteRecord(r.id)}>
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
                    endIndex={startIndex + paginatedRecords.length}
                />
            </div>

            {/* Record Form Modal */}
            {showRecordModal && (
                <div className="modal show">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingRecord ? 'Edit Data Record' : `Tambah Data Baru (${activeTab})`}</h3>
                            <span className="close-btn" onClick={() => setShowRecordModal(false)}>&times;</span>
                        </div>
                        <form onSubmit={handleSaveRecord}>
                            {activeSchema.map(col => (
                                <div key={col.name} className="form-group">
                                    <label>{col.label}</label>
                                    {col.type === 'TEXT' ? (
                                        <textarea value={recordForm[col.name] || ''} onChange={e => setRecordForm({ ...recordForm, [col.name]: e.target.value })} rows={3} />
                                    ) : col.type === 'CURRENCY' ? (
                                        <input type="number" value={recordForm[col.name] || ''} onChange={e => setRecordForm({ ...recordForm, [col.name]: Number(e.target.value) })} required />
                                    ) : col.type === 'DATE' ? (
                                        <input type="date" value={recordForm[col.name] || ''} onChange={e => setRecordForm({ ...recordForm, [col.name]: e.target.value })} required />
                                    ) : (
                                        <input type="text" value={recordForm[col.name] || ''} onChange={e => setRecordForm({ ...recordForm, [col.name]: e.target.value })} required />
                                    )}
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setShowRecordModal(false)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                                <button type="submit" className="btn-gofleet">Simpan Data</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
