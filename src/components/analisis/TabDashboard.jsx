import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const TabDashboard = () => {
    const [assets, setAssets] = useState([]);
    const [clusterData, setClusterData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch MySQL Data
                const res = await fetch('http://localhost:3000/api/mysql/aset');
                const data = await res.json();
                
                if (data.success && data.data) {
                    setAssets(data.data);
                    
                    // Post to Cluster API
                    if (data.data.length >= 3) {
                        const payload = data.data.map(a => {
                            const beli = new Date(a.tanggal_beli);
                            const today = new Date('2026-08-06');
                            const diffTime = Math.abs(today - beli);
                            const usiaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
                            const harga = Number(a.harga_beli) || 0;
                            
                            let kondisiCode = 0;
                            if(a.kondisi === 'Rusak Ringan') kondisiCode = 1;
                            if(a.kondisi === 'Rusak Berat') kondisiCode = 2;

                            return {
                                id: String(a.aset_id),
                                nama_aset: a.nama_aset,
                                kategori: a.kategori || 'Lainnya',
                                harga_beli: harga,
                                usia_aset_hari: usiaHari,
                                sisa_masa_manfaat_hari: Math.max(0, 1460 - usiaHari),
                                akumulasi_penyusutan: Math.min(harga, (harga/1460) * usiaHari),
                                nilai_buku_saat_ini: Math.max(0, harga - (Math.min(harga, (harga/1460) * usiaHari))),
                                kondisi_code: kondisiCode
                            };
                        });

                        const clusterRes = await fetch('http://localhost:8000/cluster', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ assets: payload })
                        });
                        const clusterResult = await clusterRes.json();
                        setClusterData(clusterResult.results);
                    }
                }
            } catch (error) {
                console.error("Dashboard error", error);
            }
            setLoading(false);
        };

        loadData();
    }, []);

    if (loading) return <div>Loading data dashboard...</div>;

    const totalAset = assets.length;
    const totalHargaBeli = assets.reduce((sum, item) => sum + (Number(item.harga_beli) || 0), 0);
    
    // Pie 1: Kondisi
    const kondisiBaik = assets.filter(a => a.kondisi === 'Baik').length;
    const kondisiRusakRingan = assets.filter(a => a.kondisi === 'Rusak Ringan').length;
    const kondisiRusakBerat = assets.filter(a => a.kondisi === 'Rusak Berat').length;

    const pieDataKondisi = {
        labels: ['Baik', 'Rusak Ringan', 'Rusak Berat'],
        datasets: [{
            data: [kondisiBaik, kondisiRusakRingan, kondisiRusakBerat],
            backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
            borderWidth: 1,
        }],
    };

    // Pie 2: Rekomendasi ML
    let pieDataML = null;
    if (clusterData) {
        const layak = clusterData.filter(d => d.status_rekomendasi === 'Layak Operasional').length;
        const eval_ = clusterData.filter(d => d.status_rekomendasi === 'Perlu Evaluasi').length;
        const rep = clusterData.filter(d => d.status_rekomendasi === 'Rekomendasi Replacement').length;
        
        pieDataML = {
            labels: ['Layak Operasional', 'Perlu Evaluasi', 'Replacement'],
            datasets: [{
                data: [layak, eval_, rep],
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                borderWidth: 1,
            }],
        };
    }

    return (
        <div>
            <h4 className="mb-4">Dashboard & Exploratory Data Analysis (EDA) Aset</h4>
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card text-center border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="text-muted text-uppercase">Total Aset</h6>
                            <h2 className="text-primary fw-bold">{totalAset} Unit</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card text-center border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="text-muted text-uppercase">Investasi Aset (Beli)</h6>
                            <h2 className="text-success fw-bold">Rp {totalHargaBeli.toLocaleString('id-ID')}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="card-title text-center">Proporsi Kondisi Fisik (Asli)</h6>
                            <div style={{ width: '100%', margin: '0 auto' }}>
                                <Pie data={pieDataKondisi} />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="card-title text-center">Rekomendasi Klaster (ML)</h6>
                            {pieDataML ? (
                                <div style={{ width: '100%', margin: '0 auto' }}>
                                    <Pie data={pieDataML} />
                                </div>
                            ) : (
                                <p className="text-center mt-5 text-muted">Data clustering tidak tersedia.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="card-title">Sampel Aset Terbaru</h6>
                            <div className="table-responsive" style={{ maxHeight: '250px' }}>
                                <table className="table table-sm table-hover">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th>Kode</th>
                                            <th>Kondisi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assets.slice(0, 15).map((a, idx) => (
                                            <tr key={idx}>
                                                <td>{a.kode_aset}</td>
                                                <td>
                                                    <span className={`badge bg-${a.kondisi === 'Baik' ? 'success' : a.kondisi === 'Rusak Ringan' ? 'warning text-dark' : 'danger'}`}>
                                                        {a.kondisi}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TabDashboard;
