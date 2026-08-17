import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export const Pengaturan = () => {
    const { logout, currentUser, showToast } = useData();

    const [personalInfo, setPersonalInfo] = useState({
        nama_lengkap: currentUser?.nama_lengkap || 'Administrator System',
        email: currentUser?.email || 'admin@gofleet.co.id',
        telepon: '+62 812-3456-7890',
        alamat: 'Jl. Boulevard Sunter Raya No. 88, Jakarta Utara'
    });

    const handleSaveInfo = (e) => {
        e.preventDefault();
        showToast('success', 'Pengaturan informasi pribadi berhasil disimpan.');
    };

    const handleLogout = () => {
        if (window.confirm('Apakah Anda yakin ingin keluar dari sistem GoFleet AMS?')) {
            logout();
        }
    };

    return (
        <div>
            {/* Header Section */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Pengaturan Sistem & Akun</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Kelola preferensi sistem, data profil pribadi, dan sesi akun Anda.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
                {/* Card 1: Informasi Profil Pribadi */}
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-id-card-clip" style={{ color: '#00624F' }}></i> Informasi Profil Pribadi
                    </h3>

                    <form onSubmit={handleSaveInfo}>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Nama Lengkap</label>
                            <input
                                type="text"
                                value={personalInfo.nama_lengkap}
                                onChange={e => setPersonalInfo({ ...personalInfo, nama_lengkap: e.target.value })}
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Email Pribadi / Kerja</label>
                                <input
                                    type="email"
                                    value={personalInfo.email}
                                    onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Nomor Telepon / WA</label>
                                <input
                                    type="text"
                                    value={personalInfo.telepon}
                                    onChange={e => setPersonalInfo({ ...personalInfo, telepon: e.target.value })}
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '18px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Alamat Tempat Tinggal</label>
                            <textarea
                                value={personalInfo.alamat}
                                onChange={e => setPersonalInfo({ ...personalInfo, alamat: e.target.value })}
                                rows={3}
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                            />
                        </div>

                        <button type="submit" style={{ background: '#00624F', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                            <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>
                            Simpan Profil Pribadi
                        </button>
                    </form>
                </div>

                {/* Card 2: Sesi Akun & Tombol Logout */}
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-user-shield" style={{ color: '#00624F' }}></i> Sesi Akun & Keamanan
                        </h3>

                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    fontSize: '18px'
                                }}>
                                    {currentUser?.nama_lengkap ? currentUser.nama_lengkap.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{currentUser?.nama_lengkap || 'Administrator System'}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Username: <strong style={{ color: '#db2777' }}>{currentUser?.username || 'admin'}</strong></div>
                                    <div style={{ fontSize: '11px', color: '#00624F', fontWeight: 800, marginTop: '4px', textTransform: 'uppercase' }}>{currentUser?.role || 'ADMINISTRATOR SYSTEM'}</div>
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                            Untuk menjaga keamanan data perusahaan, pastikan Anda selalu keluar dari sistem setelah selesai menggunakan aplikasi.
                        </p>
                    </div>

                    {/* Prominent Logout Button */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '20px' }}>
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                background: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                fontSize: '14px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                            }}
                        >
                            <i className="fa-solid fa-right-from-bracket"></i> Keluar dari Sistem (Logout)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
