from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np

from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Define Pydantic Models ---
class AssetInput(BaseModel):
    harga_beli: float
    usia_aset_hari: int
    sisa_masa_manfaat_hari: int
    akumulasi_penyusutan: float
    nilai_buku_saat_ini: float
    kondisi_code: int  # 0: Baik, 1: Rusak Ringan, 2: Rusak Berat

class BatchAssetInput(BaseModel):
    assets: List[AssetInput]

# --- ML Logic from app.py ---
def apply_hybrid_decision_engine(kond_code, sisa_manfaat, usia_hari):
    proba_map = {'Layak Operasional': 0.0, 'Perlu Evaluasi': 0.0, 'Rekomendasi Replacement': 0.0}
    
    if kond_code == 2:
        final_status = "Rekomendasi Replacement"
        proba_map['Rekomendasi Replacement'] = 0.90
        proba_map['Perlu Evaluasi'] = 0.08
        proba_map['Layak Operasional'] = 0.02
    elif kond_code == 1:
        if usia_hari >= 1460:
            final_status = "Rekomendasi Replacement"
            proba_map['Rekomendasi Replacement'] = 0.88
            proba_map['Perlu Evaluasi'] = 0.10
            proba_map['Layak Operasional'] = 0.02
        else:
            final_status = "Perlu Evaluasi"
            proba_map['Perlu Evaluasi'] = 0.82
            proba_map['Layak Operasional'] = 0.13
            proba_map['Rekomendasi Replacement'] = 0.05
    else:
        if usia_hari >= 1460:
            final_status = "Rekomendasi Replacement"
            proba_map['Rekomendasi Replacement'] = 0.85
            proba_map['Perlu Evaluasi'] = 0.12
            proba_map['Layak Operasional'] = 0.03
        elif usia_hari > 730:
            final_status = "Perlu Evaluasi"
            proba_map['Perlu Evaluasi'] = 0.80
            proba_map['Layak Operasional'] = 0.15
            proba_map['Rekomendasi Replacement'] = 0.05
        else:
            final_status = "Layak Operasional"
            proba_map['Layak Operasional'] = 0.85
            proba_map['Perlu Evaluasi'] = 0.12
            proba_map['Rekomendasi Replacement'] = 0.03
            
    return final_status, proba_map

@app.post("/predict/single")
def predict_single(data: AssetInput):
    final_status, proba_map = apply_hybrid_decision_engine(
        data.kondisi_code, data.sisa_masa_manfaat_hari, data.usia_aset_hari
    )
    return {
        "status": final_status,
        "probabilities": proba_map
    }

@app.post("/predict/batch")
def predict_batch(data: BatchAssetInput):
    results = []
    for asset in data.assets:
        final_status, proba_map = apply_hybrid_decision_engine(
            asset.kondisi_code, asset.sisa_masa_manfaat_hari, asset.usia_aset_hari
        )
        results.append({
            "status": final_status,
            "probabilities": proba_map
        })
    return {"results": results}

class ClusterAssetInput(BaseModel):
    id: str
    nama_aset: str
    kategori: str
    harga_beli: float
    usia_aset_hari: int
    sisa_masa_manfaat_hari: int
    akumulasi_penyusutan: float
    nilai_buku_saat_ini: float
    kondisi_code: int

class ClusterRequest(BaseModel):
    assets: List[ClusterAssetInput]

@app.post("/cluster")
def cluster_assets(data: ClusterRequest):
    if len(data.assets) < 3:
        raise HTTPException(status_code=400, detail="Minimum 3 assets required for clustering")
        
    df = pd.DataFrame([a.dict() for a in data.assets])
    feature_cols = ['harga_beli', 'usia_aset_hari', 'sisa_masa_manfaat_hari',
                    'akumulasi_penyusutan', 'nilai_buku_saat_ini', 'kondisi_code']
                    
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(df[feature_cols])
    
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df['cluster_id'] = kmeans.fit_predict(X_scaled)
    
    centroids = df.groupby('cluster_id')[['nilai_buku_saat_ini', 'usia_aset_hari', 'kondisi_code']].mean()
    centroids['health_score'] = centroids['nilai_buku_saat_ini'] - (centroids['usia_aset_hari'] * 1000) - (centroids['kondisi_code'] * 2000000)
    sorted_clusters = centroids.sort_values(by='health_score', ascending=False).index.tolist()
    
    cluster_mapping = {
        sorted_clusters[0]: 'Layak Operasional',
        sorted_clusters[1]: 'Perlu Evaluasi',
        sorted_clusters[2]: 'Rekomendasi Replacement'
    }
    df['status_rekomendasi'] = df['cluster_id'].map(cluster_mapping)
    
    # Hybrid Rules override
    rusak_berat_mask = (df['kondisi_code'] == 2)
    df.loc[rusak_berat_mask, 'status_rekomendasi'] = 'Rekomendasi Replacement'
    rusak_ringan_mask = (df['kondisi_code'] == 1) & (df['status_rekomendasi'] == 'Layak Operasional')
    df.loc[rusak_ringan_mask, 'status_rekomendasi'] = 'Perlu Evaluasi'
    
    pca = PCA(n_components=2, random_state=42)
    pca_features = pca.fit_transform(X_scaled)
    df['pca_1'] = pca_features[:, 0]
    df['pca_2'] = pca_features[:, 1]
    
    # Clean NaN for JSON serialization
    df = df.fillna("")
    
    return {"results": df.to_dict(orient="records")}
