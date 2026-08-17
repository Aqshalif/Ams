import React, { useState } from 'react';

const TabPrediksi = () => {
    const [formData, setFormData] = useState({
        harga_beli: 15000000,
        usia_aset_hari: 365,
        sisa_masa_manfaat_hari: 1095,
        akumulasi_penyusutan: 3750000,
        nilai_buku_saat_ini: 11250000,
        kondisi_code: 0
    });
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: Number(e.target.value)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/predict/single', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error("Error calling prediction API", error);
            alert("Gagal memanggil API Python. Pastikan FastAPI berjalan di port 8000.");
        }
        setLoading(false);
    };

    return (
        <div>
            <h4 className="mb-4">Form Input Spesifikasi & Kondisi Fisik Aset</h4>
            <div className="row">
                <div className="col-md-6">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Harga Beli (Rp)</label>
                                    <input type="number" className="form-control" name="harga_beli" value={formData.harga_beli} onChange={handleChange} />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Usia Aset (Hari)</label>
                                        <input type="number" className="form-control" name="usia_aset_hari" value={formData.usia_aset_hari} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Sisa Manfaat (Hari)</label>
                                        <input type="number" className="form-control" name="sisa_masa_manfaat_hari" value={formData.sisa_masa_manfaat_hari} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Kondisi Fisik</label>
                                    <select className="form-select" name="kondisi_code" value={formData.kondisi_code} onChange={handleChange}>
                                        <option value={0}>Baik (Kode 0)</option>
                                        <option value={1}>Rusak Ringan (Kode 1)</option>
                                        <option value={2}>Rusak Berat (Kode 2)</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                    {loading ? 'Memproses...' : 'Hitung & Prediksi Status Kelayakan'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-6">
                    {result && (
                        <div className="card shadow-sm border-0 bg-dark text-white">
                            <div className="card-body text-center p-5">
                                <h5 className="text-muted mb-3">Rekomendasi Kelayakan Akhir:</h5>
                                <h2 className={`display-5 fw-bold ${result.status === 'Layak Operasional' ? 'text-success' : result.status === 'Perlu Evaluasi' ? 'text-warning' : 'text-danger'}`}>
                                    {result.status}
                                </h2>
                                
                                <hr className="border-secondary my-4" />
                                
                                <h6 className="text-start text-light mb-3">Distribusi Probabilitas Model:</h6>
                                <div className="text-start">
                                    {Object.entries(result.probabilities).map(([key, val]) => (
                                        <div key={key} className="mb-2">
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span>{key}</span>
                                                <span>{(val * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="progress" style={{ height: '8px' }}>
                                                <div className={`progress-bar ${key === 'Layak Operasional' ? 'bg-success' : key === 'Perlu Evaluasi' ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${val * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TabPrediksi;
