import React, { useState } from 'react';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const TabClustering = () => {
    const [clusterData, setClusterData] = useState(null);
    const [loading, setLoading] = useState(false);

    const performClustering = async () => {
        setLoading(true);
        try {
            // 1. Fetch raw data from MySQL
            const mysqlRes = await fetch('http://localhost:3000/api/mysql/aset');
            const mysqlData = await mysqlRes.json();
            
            if (!mysqlData.success || !mysqlData.data || mysqlData.data.length < 3) {
                alert("Data aset tidak cukup untuk clustering (minimal 3 data diperlukan).");
                setLoading(false);
                return;
            }

            // 2. Format payload for Python API
            const payload = mysqlData.data.map(a => {
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

            // 3. Post to Python API
            const clusterRes = await fetch('http://localhost:8000/cluster', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assets: payload })
            });
            const clusterResult = await clusterRes.json();
            setClusterData(clusterResult.results);

        } catch (error) {
            console.error("Clustering error", error);
            alert("Gagal memanggil API Python. Pastikan FastAPI berjalan di port 8000.");
        }
        setLoading(false);
    };

    const getScatterData = () => {
        if (!clusterData) return null;

        const layak = clusterData.filter(d => d.status_rekomendasi === 'Layak Operasional');
        const evaluasi = clusterData.filter(d => d.status_rekomendasi === 'Perlu Evaluasi');
        const repl = clusterData.filter(d => d.status_rekomendasi === 'Rekomendasi Replacement');

        return {
            datasets: [
                {
                    label: 'Layak Operasional',
                    data: layak.map(d => ({ x: d.pca_1, y: d.pca_2, nama: d.nama_aset })),
                    backgroundColor: '#10B981',
                },
                {
                    label: 'Perlu Evaluasi',
                    data: evaluasi.map(d => ({ x: d.pca_1, y: d.pca_2, nama: d.nama_aset })),
                    backgroundColor: '#F59E0B',
                },
                {
                    label: 'Rekomendasi Replacement',
                    data: repl.map(d => ({ x: d.pca_1, y: d.pca_2, nama: d.nama_aset })),
                    backgroundColor: '#EF4444',
                }
            ],
        };
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Segmentasi Klaster Aset dengan Metode K-Means (k=3)</h4>
                <button className="btn btn-primary" onClick={performClustering} disabled={loading}>
                    {loading ? 'Memproses Clustering...' : 'Jalankan K-Means Clustering'}
                </button>
            </div>
            
            {!clusterData && !loading && (
                <div className="alert alert-info">Klik tombol di atas untuk menarik data dari MySQL dan mengelompokkannya menggunakan K-Means (API Python).</div>
            )}

            {clusterData && (
                <div className="row">
                    <div className="col-md-12">
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-body">
                                <h6 className="card-title text-center mb-3">Visualisasi Ruang Klaster (Hasil Proyeksi PCA 2D)</h6>
                                <div style={{ height: '400px' }}>
                                    <Scatter 
                                        options={{ 
                                            maintainAspectRatio: false,
                                            plugins: {
                                                tooltip: {
                                                    callbacks: {
                                                        label: (ctx) => `${ctx.raw.nama} (PCA1: ${ctx.raw.x.toFixed(2)}, PCA2: ${ctx.raw.y.toFixed(2)})`
                                                    }
                                                }
                                            }
                                        }} 
                                        data={getScatterData()} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TabClustering;
