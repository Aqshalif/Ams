import React, { useState } from 'react';

const TabPrediksiBatch = () => {
    const [assets, setAssets] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const performBatchPrediction = async () => {
        setLoading(true);
        try {
            const mysqlRes = await fetch('http://localhost:3000/api/mysql/aset');
            const mysqlData = await mysqlRes.json();
            
            if (!mysqlData.success || !mysqlData.data) {
                alert("Gagal mengambil data aset dari database.");
                setLoading(false);
                return;
            }
            
            setAssets(mysqlData.data);

            const payload = mysqlData.data.map(a => {
                const beli = new Date(a.tanggal_beli);
                const today = new Date();
                const diffTime = Math.abs(today - beli);
                const usiaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
                const harga = Number(a.harga_beli) || 0;
                
                let kondisiCode = 0;
                if(a.kondisi === 'Rusak Ringan') kondisiCode = 1;
                if(a.kondisi === 'Rusak Berat') kondisiCode = 2;

                return {
                    harga_beli: harga,
                    usia_aset_hari: usiaHari,
                    sisa_masa_manfaat_hari: Math.max(0, 1460 - usiaHari),
                    akumulasi_penyusutan: Math.min(harga, (harga/1460) * usiaHari),
                    nilai_buku_saat_ini: Math.max(0, harga - (Math.min(harga, (harga/1460) * usiaHari))),
                    kondisi_code: kondisiCode
                };
            });

            const predictRes = await fetch('http://localhost:8000/predict/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assets: payload })
            });
            const predictData = await predictRes.json();
            setResults(predictData.results);

        } catch (error) {
            console.error("Batch Prediction error", error);
            alert("Gagal memanggil API Python.");
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Prediksi Massal (Batch) dari Database</h4>
                <button className="btn btn-primary" onClick={performBatchPrediction} disabled={loading}>
                    {loading ? 'Memproses Data...' : 'Tarik Data & Prediksi Semua'}
                </button>
            </div>
            
            {!results.length && !loading && (
                <div className="alert alert-info">Klik tombol di atas untuk menarik seluruh data aset dari MySQL dan memprediksi status kelayakannya secara massal.</div>
            )}

            {results.length > 0 && (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive" style={{ maxHeight: '500px' }}>
                            <table className="table table-hover table-striped mb-0">
                                <thead className="table-dark sticky-top">
                                    <tr>
                                        <th>Kode Aset</th>
                                        <th>Nama Aset</th>
                                        <th>Kondisi Fisik</th>
                                        <th>Status ML</th>
                                        <th>Probabilitas Tertinggi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.map((a, idx) => {
                                        const res = results[idx];
                                        const maxProb = res ? Math.max(...Object.values(res.probabilities)) : 0;
                                        
                                        return (
                                            <tr key={idx}>
                                                <td>{a.kode_aset}</td>
                                                <td>{a.nama_aset}</td>
                                                <td>{a.kondisi}</td>
                                                <td>
                                                    <span className={`badge ${res?.status === 'Layak Operasional' ? 'bg-success' : res?.status === 'Perlu Evaluasi' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                        {res?.status || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>{(maxProb * 100).toFixed(1)}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TabPrediksiBatch;
